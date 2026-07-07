import { getRequestURL, type H3Event } from 'h3';

export interface TenantConfig {
  slug: string;
  name: string;
  siteUrl?: string;
}

export const DEFAULT_DEALER_SLUG = 'hyundai-dealer';

const DEFAULT_TENANT: TenantConfig = {
  slug: DEFAULT_DEALER_SLUG,
  name: 'Hyundai Dealer',
};

const BLOOD_TENANT: TenantConfig = {
  slug: 'blood-hyundai',
  name: 'Blood Hyundai',
  siteUrl: 'https://bloodhyundai.com.au',
};

const SALE_TENANT: TenantConfig = {
  slug: 'sale-hyundai',
  name: 'Sale Hyundai',
  siteUrl: 'https://salehyundai.com.au',
};

const TENANTS: TenantConfig[] = [BLOOD_TENANT, SALE_TENANT, DEFAULT_TENANT];

const TENANT_HOSTS: Record<string, TenantConfig> = {
  'bloodhyundai.com.au': BLOOD_TENANT,
  'www.bloodhyundai.com.au': BLOOD_TENANT,
  'salehyundai.com.au': SALE_TENANT,
  'www.salehyundai.com.au': SALE_TENANT,
};

export function normalizeHostname(hostname: string | null | undefined): string {
  if (!hostname) return '';

  return hostname
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
    .replace(/:\d+$/, '');
}

export function getRequestHostname(event: H3Event): string {
  return normalizeHostname(getRequestURL(event).hostname);
}

export function resolveTenantFromHostname(
  hostname: string | null | undefined,
  fallbackSlug = DEFAULT_DEALER_SLUG
): TenantConfig {
  const normalized = normalizeHostname(hostname);
  if (normalized && TENANT_HOSTS[normalized]) {
    return TENANT_HOSTS[normalized];
  }

  const matchedTenant = TENANTS.find((tenant) => tenant.slug === fallbackSlug);
  if (matchedTenant) {
    return matchedTenant;
  }

  return {
    ...DEFAULT_TENANT,
    slug: fallbackSlug || DEFAULT_DEALER_SLUG,
  };
}

export function isKnownTenantHostname(hostname: string | null | undefined): boolean {
  return Boolean(TENANT_HOSTS[normalizeHostname(hostname)]);
}

export function resolveDealerSlug(
  event: H3Event,
  fallbackSlug = DEFAULT_DEALER_SLUG
): string {
  return resolveTenantFromHostname(getRequestHostname(event), fallbackSlug).slug;
}

export function resolveDealerSiteUrl(
  event: H3Event,
  fallbackUrl = ''
): string {
  const hostname = getRequestHostname(event);
  const tenant = resolveTenantFromHostname(hostname);

  if (isKnownTenantHostname(hostname) && tenant.siteUrl) {
    return tenant.siteUrl;
  }

  const requestUrl = getRequestURL(event);
  if (requestUrl.origin && requestUrl.origin !== 'null') {
    return requestUrl.origin;
  }

  return fallbackUrl;
}

export function resolveTenantCacheKey(
  event: H3Event,
  baseKey: string,
  fallbackSlug = DEFAULT_DEALER_SLUG
): string {
  const tenant = resolveTenantFromHostname(getRequestHostname(event), fallbackSlug);
  const hostname = getRequestHostname(event) || tenant.slug;
  return `${baseKey}:${tenant.slug}:${hostname}`;
}
