import type {
  InventoryFeedSource,
  InventorySource,
  InventorySourceProvider,
  InventorySourceRole,
  InventorySourceTransport,
  TenantInventorySettings,
} from '../types/inventory';
import { BLOOD_HYUNDAI_INVENTORY_SETTINGS } from './tenant-default-settings';

export interface HomepageSellerConfig {
  primary: string[];
  group: string[];
  secondary: string[];
}

const DEFAULT_DEALER_SLUG = 'hyundai-dealer';
const DEFAULT_INVENTORY_PROVIDER: InventorySourceProvider = 'carsales';
const DEFAULT_INVENTORY_TRANSPORT: InventorySourceTransport = 'json-feed';

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

function isInventorySourceProvider(value: unknown): value is InventorySourceProvider {
  return value === 'carsales' || value === 'driveagent' || value === 'supabase' || value === 'custom';
}

function isInventorySourceTransport(value: unknown): value is InventorySourceTransport {
  return value === 'json-feed' || value === 'api';
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

function normalizeTenantInventorySources(settings?: TenantInventorySettings): InventorySource[] {
  if (!Array.isArray(settings?.sources)) {
    return [];
  }

  return settings.sources
    .map((source, index) => ({
      provider: isInventorySourceProvider(source?.provider)
        ? source.provider
        : (isInventorySourceProvider(settings?.provider) ? settings.provider : DEFAULT_INVENTORY_PROVIDER),
      transport: isInventorySourceTransport(source?.transport)
        ? source.transport
        : DEFAULT_INVENTORY_TRANSPORT,
      url: String(source?.url || '').trim(),
      role: isInventorySourceRole(source?.role) ? source.role : roleForFeedIndex(index),
      sellerIds: normalizeStringArray(source?.sellerIds),
      enabled: source?.enabled !== false,
    }))
    .filter((source): source is InventorySource => Boolean(source.url) && source.enabled);
}

export function getInventoryFeedSources(
  dealerSlug: string,
  tenantInventorySettings?: TenantInventorySettings
): InventoryFeedSource[] {
  const contractSources = normalizeTenantInventorySources(tenantInventorySettings)
    .filter((source) => source.transport === 'json-feed');

  if (contractSources.length > 0) {
    return contractSources.map(({ url, role }) => ({ url, role }));
  }

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
    return normalizeTenantInventorySources(BLOOD_HYUNDAI_INVENTORY_SETTINGS)
      .filter((source) => source.transport === 'json-feed')
      .map(({ url, role }) => ({ url, role }));
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
    return {
      primary: normalizeStringArray(BLOOD_HYUNDAI_INVENTORY_SETTINGS.primarySellerIds),
      group: normalizeStringArray(BLOOD_HYUNDAI_INVENTORY_SETTINGS.groupSellerIds),
      secondary: normalizeStringArray(BLOOD_HYUNDAI_INVENTORY_SETTINGS.secondarySellerIds),
    };
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

export function getInventorySources(
  dealerSlug: string,
  tenantInventorySettings?: TenantInventorySettings
): InventorySource[] {
  const sellerConfig = getHomepageSellerConfig(dealerSlug, tenantInventorySettings);
  const contractSources = normalizeTenantInventorySources(tenantInventorySettings);

  if (contractSources.length > 0) {
    return contractSources.map((source) => ({
      ...source,
      sellerIds: source.sellerIds.length > 0 ? source.sellerIds : sellerConfig[source.role],
    }));
  }

  const provider = isInventorySourceProvider(tenantInventorySettings?.provider)
    ? tenantInventorySettings.provider
    : DEFAULT_INVENTORY_PROVIDER;

  return getInventoryFeedSources(dealerSlug, tenantInventorySettings).map((source) => ({
    provider,
    transport: DEFAULT_INVENTORY_TRANSPORT,
    url: source.url,
    role: source.role,
    sellerIds: sellerConfig[source.role],
    enabled: true,
  }));
}
