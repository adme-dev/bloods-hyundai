export interface CrmLeadSignal {
  source: string | null;
  type: string;
  status: string;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  gclid?: string | null;
  gbraid?: string | null;
  wbraid?: string | null;
  fbclid?: string | null;
  msclkid?: string | null;
  attributedPlatform?: string | null;
  attributedCampaignId?: string | null;
  attributedCampaignName?: string | null;
  chatSource?: string | null;
  chatIntent?: string | null;
  vehicleStockId: string | null;
  syncedToCrm: boolean;
  crmRef: string | null;
  externalRef: string | null;
}

export interface LeadSourceBucket {
  key: string;
  label: string;
  category: 'paid' | 'external_marketplace' | 'owned' | 'organic' | 'direct' | 'unknown';
}

export function classifyCrmLeadSource(lead: Pick<CrmLeadSignal, 'source' | 'utmSource' | 'utmMedium' | 'externalRef' | 'gclid' | 'gbraid' | 'wbraid' | 'fbclid' | 'msclkid' | 'attributedPlatform' | 'chatSource' | 'chatIntent'>): LeadSourceBucket {
  const source = normalize(lead.source);
  const utmSource = normalize(lead.utmSource);
  const utmMedium = normalize(lead.utmMedium);
  const externalRef = normalize(lead.externalRef);
  const attributedPlatform = normalize(lead.attributedPlatform);
  const chatSource = normalize(lead.chatSource);
  const chatIntent = normalize(lead.chatIntent);
  const haystack = `${source} ${utmSource} ${utmMedium} ${externalRef}`;

  if (chatSource === 'chat' || chatIntent) {
    return { key: 'chatbot', label: 'Chatbot', category: 'owned' };
  }

  if (haystack.includes('carsales')) {
    return { key: 'carsales', label: 'Carsales', category: 'external_marketplace' };
  }
  if (haystack.includes('auto trader') || haystack.includes('autotrader') || haystack.includes('auto-trader')) {
    return { key: 'autotrader', label: 'Autotrader', category: 'external_marketplace' };
  }
  if (haystack.includes('hyundai_oem') || haystack.includes('hyundai oem') || haystack.includes('hyundai lead')) {
    return { key: 'hyundai_oem', label: 'Hyundai OEM', category: 'external_marketplace' };
  }
  if (haystack.includes('meta_lead_ads') || haystack.includes('facebook lead') || haystack.includes('lead ads')) {
    return { key: 'meta_lead_ads', label: 'Meta Lead Ads', category: 'paid' };
  }
  if (attributedPlatform === 'meta_ads' || lead.fbclid || ['facebook', 'fb', 'meta', 'instagram', 'ig'].includes(utmSource)) {
    return { key: 'meta_paid', label: 'Meta paid', category: 'paid' };
  }
  if (
    attributedPlatform === 'google_ads' ||
    lead.gclid ||
    lead.gbraid ||
    lead.wbraid ||
    (['google', 'googleads', 'google_ads'].includes(utmSource) && ['cpc', 'ppc', 'paid', 'paid_search'].includes(utmMedium))
  ) {
    return { key: 'google_paid', label: 'Google paid', category: 'paid' };
  }
  if (utmMedium === 'email' || source.includes('mail') || utmSource.includes('newsletter')) {
    return { key: 'email', label: 'Email', category: 'owned' };
  }
  if (source === 'website' || source.startsWith('/') || source.includes('bloodhyundai.com.au') || source.includes('bloods-hyundai')) {
    return { key: 'website', label: 'Website forms', category: 'owned' };
  }
  if (utmMedium === 'organic' || source.includes('google') || source.includes('bing')) {
    return { key: 'organic_search', label: 'Organic search', category: 'organic' };
  }
  if (!source && !utmSource && !externalRef) {
    return { key: 'unknown', label: 'Unknown / untagged', category: 'unknown' };
  }
  return { key: 'direct_other', label: 'Direct / other', category: 'direct' };
}

export function calculateLeadSignalCoverage(leads: CrmLeadSignal[]) {
  const total = leads.length;
  const counts = leads.reduce((acc, lead) => {
    if (hasValue(lead.source)) acc.withSource += 1;
    if (hasValue(lead.utmSource) || hasValue(lead.utmMedium) || hasValue(lead.utmCampaign)) acc.withAnyUtm += 1;
    if (hasValue(lead.chatSource) || hasValue(lead.chatIntent)) acc.withChat += 1;
    if (hasValue(lead.utmCampaign) || hasValue(lead.attributedCampaignId) || hasValue(lead.attributedCampaignName)) acc.withCampaign += 1;
    if (isPaidLead(lead)) acc.withPaidAttribution += 1;
    if (lead.gclid || lead.gbraid || lead.wbraid || lead.fbclid || lead.msclkid) acc.withClickId += 1;
    if (hasValue(lead.attributedPlatform)) acc.withBackfilledAttribution += 1;
    if (hasValue(lead.vehicleStockId)) acc.withVehicle += 1;
    if (lead.syncedToCrm) acc.syncedToCrm += 1;
    if (hasValue(lead.crmRef)) acc.withCrmRef += 1;
    if (hasValue(lead.externalRef)) acc.withExternalRef += 1;
    return acc;
  }, {
    withSource: 0,
    withAnyUtm: 0,
    withChat: 0,
    withCampaign: 0,
    withPaidAttribution: 0,
    withClickId: 0,
    withBackfilledAttribution: 0,
    withVehicle: 0,
    syncedToCrm: 0,
    withCrmRef: 0,
    withExternalRef: 0,
  });

  return {
    total,
    ...counts,
    sourceCoverage: percent(counts.withSource, total),
    utmCoverage: percent(counts.withAnyUtm, total),
    chatCoverage: percent(counts.withChat, total),
    campaignCoverage: percent(counts.withCampaign, total),
    paidAttributionCoverage: percent(counts.withPaidAttribution, total),
    vehicleCoverage: percent(counts.withVehicle, total),
    crmSyncCoverage: percent(counts.syncedToCrm, total),
  };
}

export function summarizeLeadSources(leads: CrmLeadSignal[]) {
  const buckets = new Map<string, LeadSourceBucket & { total: number; crmSynced: number; withCampaign: number }>();

  for (const lead of leads) {
    const bucket = classifyCrmLeadSource(lead);
    const current = buckets.get(bucket.key) || { ...bucket, total: 0, crmSynced: 0, withCampaign: 0 };
    current.total += 1;
    if (lead.syncedToCrm) current.crmSynced += 1;
    if (hasValue(lead.utmCampaign)) current.withCampaign += 1;
    buckets.set(bucket.key, current);
  }

  return [...buckets.values()].sort((a, b) => b.total - a.total || a.label.localeCompare(b.label));
}

function isPaidLead(lead: Pick<CrmLeadSignal, 'utmSource' | 'utmMedium' | 'gclid' | 'gbraid' | 'wbraid' | 'fbclid' | 'msclkid' | 'attributedPlatform'>) {
  const attributedPlatform = normalize(lead.attributedPlatform);
  if (attributedPlatform === 'google_ads' || attributedPlatform === 'meta_ads') return true;
  if (lead.gclid || lead.gbraid || lead.wbraid || lead.fbclid || lead.msclkid) return true;
  const source = normalize(lead.utmSource);
  const medium = normalize(lead.utmMedium);
  if (['facebook', 'fb', 'meta', 'instagram', 'ig'].includes(source)) return true;
  return ['google', 'googleads', 'google_ads'].includes(source) && ['cpc', 'ppc', 'paid', 'paid_search'].includes(medium);
}

function hasValue(value: string | null | undefined) {
  return Boolean(value && value.trim());
}

function normalize(value: string | null | undefined) {
  return (value || '').trim().toLowerCase();
}

function percent(numerator: number, denominator: number) {
  if (!denominator) return 0;
  return Math.round((numerator / denominator) * 1000) / 10;
}
