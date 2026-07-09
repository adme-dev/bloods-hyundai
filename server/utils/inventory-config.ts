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

function parseFeedSources(value: string | undefined): InventoryFeedSource[] {
  return parseCsv(value).flatMap((entry, index) => {
    const [url, rawRole] = entry.split('|').map((part) => part.trim());
    if (!url) return [];
    const role = rawRole === 'primary' || rawRole === 'group' || rawRole === 'secondary'
      ? rawRole
      : index === 0
        ? 'primary'
        : index === 1
          ? 'group'
          : 'secondary';

    return [{ url, role }];
  });
}

export function getInventoryFeedSources(dealerSlug: string): InventoryFeedSource[] {
  for (const prefix of envPrefixesForDealer(dealerSlug)) {
    const tenantSources = parseFeedSources(process.env[`${prefix}_CARSALES_FEED_URLS`]);
    if (tenantSources.length > 0) {
      return tenantSources;
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

export function getHomepageSellerConfig(dealerSlug: string): HomepageSellerConfig {
  for (const prefix of envPrefixesForDealer(dealerSlug)) {
    const tenantConfig = {
      primary: parseCsv(process.env[`${prefix}_HOMEPAGE_FILTER_PRIMARY_SELLER_IDS`]),
      group: parseCsv(process.env[`${prefix}_HOMEPAGE_FILTER_GROUP_SELLER_IDS`]),
      secondary: parseCsv(process.env[`${prefix}_HOMEPAGE_FILTER_SECONDARY_SELLER_IDS`]),
    };

    if (tenantConfig.primary.length || tenantConfig.group.length || tenantConfig.secondary.length) {
      return tenantConfig;
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
