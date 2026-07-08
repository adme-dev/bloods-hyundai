export type InventorySourceRole = 'primary' | 'group' | 'secondary';

export interface InventoryFeedSource {
  url: string;
  role: InventorySourceRole;
}

export interface HomepageSellerConfig {
  primary: string[];
  group: string[];
  secondary: string[];
}

export interface TenantInventorySettings {
  feedSources?: Array<{
    url?: string;
    role?: InventorySourceRole;
  }>;
  feedUrls?: string[];
  primarySellerIds?: string[];
  groupSellerIds?: string[];
  secondarySellerIds?: string[];
}

const BLOOD_FEED_SOURCES: InventoryFeedSource[] = [
  {
    url: 'https://tsheefvkecaervnrxvdf.supabase.co/storage/v1/object/public/bucket/blood-hyundai/data.json',
    role: 'primary',
  },
  {
    url: 'https://tsheefvkecaervnrxvdf.supabase.co/storage/v1/object/public/bucket/blood-motor-group/data.json',
    role: 'group',
  },
  {
    url: 'https://tsheefvkecaervnrxvdf.supabase.co/storage/v1/object/public/bucket/geelong-mazda/data.json',
    role: 'secondary',
  },
];

const BLOOD_SELLER_CONFIG: HomepageSellerConfig = {
  primary: ['49b41e33-6e72-b64d-43a2-7897e61c1bf0'],
  group: ['646680a2-406b-2430-bde8-761a48e4a2ed'],
  secondary: ['41bba4aa-6460-dbd6-30f7-7f31dfa5ef61'],
};

const DEFAULT_DEALER_SLUG = 'hyundai-dealer';

function isBloodDealerSlug(dealerSlug: string): boolean {
  return dealerSlug === 'blood-hyundai' || dealerSlug === 'bloods-hyundai';
}

function envPrefixForDealer(dealerSlug: string): string {
  return dealerSlug.toUpperCase().replace(/[^A-Z0-9]+/g, '_');
}

function envPrefixesForDealer(dealerSlug: string): string[] {
  return Array.from(new Set([
    envPrefixForDealer(dealerSlug),
    ...(isBloodDealerSlug(dealerSlug) ? ['BLOOD_HYUNDAI', 'BLOODS_HYUNDAI'] : []),
  ]));
}

function parseCsv(value: string | undefined): string[] {
  return (value || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function normalizeStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.map((entry) => String(entry).trim()).filter(Boolean)
    : [];
}

function roleForFeedIndex(index: number): InventorySourceRole {
  return index === 0 ? 'primary' : index === 1 ? 'group' : 'secondary';
}

function isInventorySourceRole(value: unknown): value is InventorySourceRole {
  return value === 'primary' || value === 'group' || value === 'secondary';
}

function normalizeTenantFeedSources(settings?: TenantInventorySettings): InventoryFeedSource[] {
  const explicitSources = Array.isArray(settings?.feedSources)
    ? settings.feedSources
        .map((source, index) => ({
          url: String(source?.url || '').trim(),
          role: isInventorySourceRole(source?.role) ? source.role : roleForFeedIndex(index),
        }))
        .filter((source): source is InventoryFeedSource => Boolean(source.url))
    : [];

  if (explicitSources.length > 0) {
    return explicitSources;
  }

  return normalizeStringArray(settings?.feedUrls).map((url, index) => ({
    url,
    role: roleForFeedIndex(index),
  }));
}

function parseFeedSources(value: string | undefined): InventoryFeedSource[] {
  return parseCsv(value).flatMap((entry, index) => {
    const [url, rawRole] = entry.split('|').map((part) => part.trim());
    if (!url) return [];

    const role = rawRole === 'primary' || rawRole === 'group' || rawRole === 'secondary'
      ? rawRole
      : roleForFeedIndex(index);

    return { url, role };
  });
}

export function getInventoryFeedSources(
  dealerSlug: string,
  tenantInventorySettings?: TenantInventorySettings
): InventoryFeedSource[] {
  const tenantSources = normalizeTenantFeedSources(tenantInventorySettings);
  if (tenantSources.length > 0) {
    return tenantSources;
  }

  for (const prefix of envPrefixesForDealer(dealerSlug)) {
    const envSources = parseFeedSources(process.env[`${prefix}_CARSALES_FEED_URLS`]);
    if (envSources.length > 0) {
      return envSources;
    }
  }

  if (isBloodDealerSlug(dealerSlug)) {
    return BLOOD_FEED_SOURCES;
  }

  if (dealerSlug === DEFAULT_DEALER_SLUG) {
    return parseFeedSources(process.env.CARSALES_FEED_URLS);
  }

  return [];
}

export function getHomepageSellerConfig(
  dealerSlug: string,
  tenantInventorySettings?: TenantInventorySettings
): HomepageSellerConfig {
  const tenantConfig = {
    primary: normalizeStringArray(tenantInventorySettings?.primarySellerIds),
    group: normalizeStringArray(tenantInventorySettings?.groupSellerIds),
    secondary: normalizeStringArray(tenantInventorySettings?.secondarySellerIds),
  };

  if (tenantConfig.primary.length || tenantConfig.group.length || tenantConfig.secondary.length) {
    return tenantConfig;
  }

  for (const prefix of envPrefixesForDealer(dealerSlug)) {
    const envConfig = {
      primary: parseCsv(process.env[`${prefix}_HOMEPAGE_FILTER_PRIMARY_SELLER_IDS`]),
      group: parseCsv(process.env[`${prefix}_HOMEPAGE_FILTER_GROUP_SELLER_IDS`]),
      secondary: parseCsv(process.env[`${prefix}_HOMEPAGE_FILTER_SECONDARY_SELLER_IDS`]),
    };

    if (envConfig.primary.length || envConfig.group.length || envConfig.secondary.length) {
      return envConfig;
    }
  }

  if (isBloodDealerSlug(dealerSlug)) {
    return BLOOD_SELLER_CONFIG;
  }

  if (dealerSlug === DEFAULT_DEALER_SLUG) {
    return {
      primary: parseCsv(process.env.HOMEPAGE_FILTER_PRIMARY_SELLER_IDS),
      group: parseCsv(process.env.HOMEPAGE_FILTER_GROUP_SELLER_IDS),
      secondary: parseCsv(process.env.HOMEPAGE_FILTER_SECONDARY_SELLER_IDS),
    };
  }

  return {
    primary: [],
    group: [],
    secondary: [],
  };
}

export function getAllSellerIds(config: HomepageSellerConfig): string[] {
  return Array.from(new Set([
    ...config.primary,
    ...config.group,
    ...config.secondary,
  ]));
}
