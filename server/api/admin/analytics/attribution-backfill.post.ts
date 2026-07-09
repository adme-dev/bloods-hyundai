import { and, eq, gte, lt } from 'drizzle-orm';
import { db } from '../../../utils/db';
import { enquiries, marketingMetricsDaily } from '../../../database/schema';
import { inferLeadAttribution, type CampaignAttributionCandidate } from '../../../utils/metrics/attribution';

const MAX_DAYS = 366;

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  if (!user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' });
  }

  const body = await readBody<{ days?: number; force?: boolean }>(event).catch((): { days?: number; force?: boolean } => ({}));
  const days = Math.max(1, Math.min(MAX_DAYS, Number(body.days || 180)));
  const fromDate = new Date();
  fromDate.setUTCDate(fromDate.getUTCDate() - days);

  const from = fromDate.toISOString().slice(0, 10);
  const to = new Date().toISOString().slice(0, 10);
  const dayAfterTo = new Date(`${to}T00:00:00Z`);
  dayAfterTo.setUTCDate(dayAfterTo.getUTCDate() + 1);

  const [metricRows, leadRows] = await Promise.all([
    db.select({
      platform: marketingMetricsDaily.platform,
      campaignId: marketingMetricsDaily.campaignId,
      campaignName: marketingMetricsDaily.campaignName,
    }).from(marketingMetricsDaily)
      .where(and(
        eq(marketingMetricsDaily.dealerId, user.dealerId),
        gte(marketingMetricsDaily.date, from),
        lt(marketingMetricsDaily.date, dayAfterTo.toISOString().slice(0, 10)),
      )),
    db.select({
      id: enquiries.id,
      source: enquiries.source,
      utmSource: enquiries.utmSource,
      utmMedium: enquiries.utmMedium,
      utmCampaign: enquiries.utmCampaign,
      gclid: enquiries.gclid,
      gbraid: enquiries.gbraid,
      wbraid: enquiries.wbraid,
      fbclid: enquiries.fbclid,
      msclkid: enquiries.msclkid,
      landingPage: enquiries.landingPage,
      referrer: enquiries.referrer,
      attributedPlatform: enquiries.attributedPlatform,
      attributedCampaignId: enquiries.attributedCampaignId,
      attributedCampaignName: enquiries.attributedCampaignName,
    }).from(enquiries)
      .where(and(
        eq(enquiries.dealerId, user.dealerId),
        gte(enquiries.createdAt, fromDate),
        lt(enquiries.createdAt, dayAfterTo),
      )),
  ]);

  const campaigns = buildCampaignCandidates(metricRows);
  let matched = 0;
  let updated = 0;

  for (const lead of leadRows) {
    if (lead.attributedPlatform && !body.force) {
      matched += 1;
      continue;
    }

    const attribution = inferLeadAttribution(lead, campaigns);
    if (!attribution.platform) continue;

    matched += 1;
    await db.update(enquiries)
      .set({
        attributedPlatform: attribution.platform,
        attributedCampaignId: attribution.campaignId,
        attributedCampaignName: attribution.campaignName || lead.utmCampaign,
        attributionConfidence: attribution.confidence,
        attributionMethod: attribution.method,
        attributionMatchedAt: new Date(),
        attributionMeta: attribution.evidence,
      })
      .where(eq(enquiries.id, lead.id));
    updated += 1;
  }

  return {
    success: true,
    days,
    scanned: leadRows.length,
    matched,
    updated,
  };
});

function buildCampaignCandidates(rows: Array<{ platform: string; campaignId: string; campaignName: string | null }>): CampaignAttributionCandidate[] {
  const seen = new Set<string>();
  const candidates: CampaignAttributionCandidate[] = [];
  for (const row of rows) {
    if (row.platform !== 'google_ads' && row.platform !== 'meta_ads') continue;
    const key = `${row.platform}:${row.campaignId}:${row.campaignName || ''}`;
    if (seen.has(key)) continue;
    seen.add(key);
    candidates.push({
      platform: row.platform as CampaignAttributionCandidate['platform'],
      campaignId: row.campaignId,
      campaignName: row.campaignName,
    });
  }
  return candidates;
}
