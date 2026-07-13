import Groq from 'groq-sdk';
import { createHash } from 'node:crypto';

interface ExplainReportSlice {
  period: { from: string; to: string };
  summary: {
    totalCrmLeads: number;
    paidCrmLeads: number;
    utmCoverage: number;
    campaignCoverage: number;
    sourceCoverage: number;
  };
  insights: { executive: { totalSpend: number } };
  platformMetrics: { ga4: { sessions: number } };
  professionalMetrics: { paidMedia: { platformLeads: number } };
}

const AI_MODEL = 'llama-3.1-8b-instant';
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const cache = new Map<string, { narrative: string; generatedAt: string; expires: number }>();

const SYSTEM_PROMPT = `You write short summaries of a car dealership's marketing report for the dealer principal — a busy, non-technical reader.
Rules:
- 120 to 180 words, plain English, no jargon, no markdown, no headings, no bullet lists.
- Use ONLY the figures provided. Never invent numbers, percentages, causes or outcomes.
- When ad spend has no matched leads, present the honest possibilities (campaigns not optimising for leads, campaigns still ramping up, tracking tags not yet live, or leads arriving by phone/walk-in without tags) as possibilities — never assert one as fact.
- With small lead counts, note that percentages swing hard on few leads.
- Tone: calm, factual, client-ready — something an agency could paste into an email to the dealer.`;

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  if (!user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' });
  }

  const body = await readBody<{ from?: unknown; to?: unknown }>(event);
  const from = typeof body?.from === 'string' ? body.from : '';
  const to = typeof body?.to === 'string' ? body.to : '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
    throw createError({ statusCode: 400, message: 'Invalid period' });
  }
  const fromDate = new Date(`${from}T00:00:00Z`);
  const toDate = new Date(`${to}T00:00:00Z`);
  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime()) || fromDate > toDate) {
    throw createError({ statusCode: 400, message: 'Invalid period' });
  }
  if ((toDate.getTime() - fromDate.getTime()) / 86_400_000 > 366) {
    throw createError({ statusCode: 400, message: 'Period too long' });
  }

  const apiKey = process.env.AI_API_KEY || process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.warn('[MarketingExplain] AI_API_KEY not configured - AI summary disabled');
    return { available: false as const };
  }

  const report = await $fetch<ExplainReportSlice>('/api/admin/analytics/marketing-report', {
    query: { from, to },
    headers: { cookie: getHeader(event, 'cookie') || '' },
  });

  const metrics = {
    period: `${report.period.from} to ${report.period.to}`,
    adSpendAud: report.insights.executive.totalSpend,
    crmLeadsTotal: report.summary.totalCrmLeads,
    crmLeadsMatchedToPaid: report.summary.paidCrmLeads,
    platformReportedLeads: report.professionalMetrics.paidMedia.platformLeads,
    websiteSessions: report.platformMetrics.ga4.sessions,
    utmCoveragePct: report.summary.utmCoverage,
    campaignCoveragePct: report.summary.campaignCoverage,
    sourceCoveragePct: report.summary.sourceCoverage,
  };

  const hash = createHash('sha1').update(JSON.stringify(metrics)).digest('hex').slice(0, 12);
  const cacheKey = `${user.dealerId}:${from}:${to}:${hash}`;
  const hit = cache.get(cacheKey);
  if (hit && hit.expires > Date.now()) {
    return { available: true as const, narrative: hit.narrative, generatedAt: hit.generatedAt };
  }

  const groq = new Groq({ apiKey });
  const completion = await groq.chat.completions.create({
    model: AI_MODEL,
    temperature: 0.3,
    max_tokens: 400,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: `Marketing report figures for the period ${metrics.period}:\n${JSON.stringify(metrics, null, 2)}\n\nWrite the summary.` },
    ],
  });

  const narrative = completion.choices[0]?.message?.content?.trim();
  if (!narrative) {
    throw createError({ statusCode: 502, message: 'AI summary generation failed' });
  }

  const generatedAt = new Date().toISOString();
  cache.set(cacheKey, { narrative, generatedAt, expires: Date.now() + CACHE_TTL_MS });
  return { available: true as const, narrative, generatedAt };
});
