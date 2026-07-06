type HeaderMap = Record<string, string>;

const PRIVATE_ROUTE_PREFIXES = [
  '/admin',
  '/api',
  '/portal',
  '/secure-vehicle',
];

const PRIVATE_ROUTE_PATHS = new Set([
  '/favorites',
  '/payment-success',
  '/compare-vehicles-for-sale',
]);

const DAYS: Record<string, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
};

interface DealerSchemaInput {
  siteUrl: string;
  site?: Record<string, any> | null;
}

interface BreadcrumbSchemaInput {
  siteUrl: string;
  path: string;
}

export function normalizeSiteUrl(siteUrl: string | undefined | null): string {
  const fallback = 'https://bloodhyundai.com.au';
  return (siteUrl || fallback).replace(/\/+$/, '');
}

export function normalizePath(path: string): string {
  const [withoutQuery = '/'] = path.split('?');
  const [cleanPath = '/'] = withoutQuery.split('#');
  if (cleanPath.length > 1) return cleanPath.replace(/\/+$/, '');
  return cleanPath;
}

export function isPrivateRoute(path: string): boolean {
  const normalized = normalizePath(path);
  return (
    PRIVATE_ROUTE_PATHS.has(normalized) ||
    PRIVATE_ROUTE_PREFIXES.some((prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`))
  );
}

export function shouldExcludeFromSitemap(path: string): boolean {
  return isPrivateRoute(path);
}

export function getDocumentCacheHeaders(path: string): HeaderMap {
  if (isPrivateRoute(path)) {
    return {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
      'Netlify-CDN-Cache-Control': 'no-store',
      'CDN-Cache-Control': 'no-store',
      Vary: 'Accept, Accept-Encoding',
    };
  }

  return {
    'Cache-Control': 'public, max-age=0, must-revalidate',
    'Netlify-CDN-Cache-Control': 'public, max-age=300, stale-while-revalidate=3600',
    'CDN-Cache-Control': 'public, max-age=300, stale-while-revalidate=3600',
    Vary: 'Accept, Accept-Encoding',
  };
}

export function buildDealerSchema(input: DealerSchemaInput) {
  const site = input.site || {};
  const siteUrl = normalizeSiteUrl(input.siteUrl);
  const addressText = getDealerAddress(site);
  const parsedAddress = parseAustralianAddress(addressText);
  const phone = site.phone || site.departments?.sales?.phone || site.departments?.service?.phone || '';

  return {
    '@context': 'https://schema.org',
    '@type': 'AutoDealer',
    '@id': `${siteUrl}/#autodealer`,
    name: site.name || 'Blood Hyundai',
    url: siteUrl,
    logo: site.logo || `${siteUrl}/favicon.ico`,
    image: site.logo || `${siteUrl}/favicon.ico`,
    telephone: phone,
    address: {
      '@type': 'PostalAddress',
      streetAddress: parsedAddress.streetAddress || addressText,
      addressLocality: parsedAddress.addressLocality,
      addressRegion: parsedAddress.addressRegion,
      postalCode: parsedAddress.postalCode,
      addressCountry: 'AU',
    },
    openingHoursSpecification: getOpeningHoursSpecification(site),
  };
}

export function buildBreadcrumbSchema(input: BreadcrumbSchemaInput) {
  const siteUrl = normalizeSiteUrl(input.siteUrl);
  const pathSegments = normalizePath(input.path).split('/').filter(Boolean);
  let currentPath = '';

  const itemListElement = [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: `${siteUrl}/`,
    },
    ...pathSegments.map((segment, index) => {
      currentPath += `/${segment}`;
      return {
        '@type': 'ListItem',
        position: index + 2,
        name: formatSegmentName(segment),
        item: `${siteUrl}${currentPath}`,
      };
    }),
  ];

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement,
  };
}

function getDealerAddress(site: Record<string, any>): string {
  return (
    site.showroom_address ||
    site.address ||
    site.departments?.sales?.address ||
    site.departments?.service?.address ||
    site.departments?.parts?.address ||
    ''
  );
}

function parseAustralianAddress(address: string) {
  const normalized = String(address || '').trim();
  const match = normalized.match(/^(.*?),\s*([^,]+?)\s+([A-Z]{2,3})\s+(\d{4})$/);

  if (!match) {
    return {
      streetAddress: normalized,
      addressLocality: '',
      addressRegion: '',
      postalCode: '',
    };
  }

  return {
    streetAddress: match[1],
    addressLocality: match[2],
    addressRegion: match[3],
    postalCode: match[4],
  };
}

function getOpeningHoursSpecification(site: Record<string, any>) {
  const trading =
    site.departments?.sales?.trading ||
    site.departments?.service?.trading ||
    site.trading ||
    site.trading_hours ||
    {};

  return Object.entries(DAYS)
    .map(([key, dayOfWeek]) => {
      const hours = Array.isArray(trading[key]) ? trading[key][0] : trading[key];
      const open = typeof hours === 'string' ? hours.split('-')[0]?.trim() : hours?.open;
      const close = typeof hours === 'string' ? hours.split('-')[1]?.trim() : hours?.close;

      if (!open || !close) return null;

      return {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek,
        opens: normalizeTime(open),
        closes: normalizeTime(close),
      };
    })
    .filter(Boolean);
}

function normalizeTime(value: string): string {
  const trimmed = value.trim().toLowerCase();
  const match = trimmed.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/);

  if (!match) return value.trim();

  let hour = Number(match[1]);
  const minute = match[2] || '00';
  const meridiem = match[3];

  if (meridiem === 'pm' && hour < 12) hour += 12;
  if (meridiem === 'am' && hour === 12) hour = 0;

  return `${String(hour).padStart(2, '0')}:${minute}`;
}

function formatSegmentName(segment: string): string {
  return decodeURIComponent(segment)
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
