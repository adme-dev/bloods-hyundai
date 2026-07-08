export type HyundaiNavigationDestinationScope =
  | 'theme'
  | 'hyundaiNational'
  | 'inventory'
  | 'service'
  | 'phone'
  | 'email'
  | 'external';

export interface HyundaiNavigationLink {
  id: string;
  label: string;
  url: string;
  destinationScope?: HyundaiNavigationDestinationScope;
  target?: '_self' | '_blank';
}

export interface HyundaiNavigationCollectionItem {
  linkId: string;
  children?: HyundaiNavigationCollectionItem[];
}

export interface HyundaiNavigationMobileSection {
  id: string;
  heading: string;
  items: HyundaiNavigationCollectionItem[];
}

export interface HyundaiNavigationFooterColumn {
  id: string;
  heading: string;
  items: HyundaiNavigationCollectionItem[];
}

export interface HyundaiNavigationDomains {
  themeUrl: string;
  hyundaiNationalUrl: string;
}

export interface HyundaiNavigationSettings {
  domains: HyundaiNavigationDomains;
  links: HyundaiNavigationLink[];
  collections: {
    mainnav: HyundaiNavigationCollectionItem[];
    mobileSections: HyundaiNavigationMobileSection[];
    footer: HyundaiNavigationFooterColumn[];
    quickLinks: HyundaiNavigationCollectionItem[];
  };
  updatedAt?: string | null;
  updatedBy?: string | null;
}

export interface HyundaiLegacyNavItem {
  name: string;
  url: string;
  target?: '_self' | '_blank';
  children?: HyundaiLegacyNavItem[];
}

export interface HyundaiLegacyLink {
  title: string;
  url: string;
  target?: '_self' | '_blank';
}

export interface HyundaiLegacyLinkSection {
  heading: string;
  links: HyundaiLegacyLink[];
}

export interface HyundaiCompiledNavigation {
  mainnav: HyundaiLegacyNavItem[];
  mobilenav: HyundaiLegacyLinkSection[];
  footer: HyundaiLegacyLinkSection[];
  quick_links: HyundaiLegacyLink[];
}

export interface HyundaiSiteConfigLike {
  navigation?: Record<string, unknown>;
  sitelinks?: Record<string, unknown>;
  quick_links?: unknown;
  [key: string]: unknown;
}

interface CreateDefaultNavigationOptions {
  themeUrl?: string | null;
  hyundaiNationalUrl?: string | null;
}

const DEFAULT_HYUNDAI_NATIONAL_URL = 'https://www.hyundai.com/au/en';

export function createDefaultHyundaiNavigationSettings(
  options: CreateDefaultNavigationOptions = {},
): HyundaiNavigationSettings {
  const links: HyundaiNavigationLink[] = [
    { id: 'stock', label: 'Our stock', url: '/car-sales', destinationScope: 'inventory' },
    { id: 'offers', label: 'Latest Offers', url: '/special-offers', destinationScope: 'theme' },
    { id: 'finance', label: 'Finance', url: '/finance', destinationScope: 'theme' },
    { id: 'fleet', label: 'Fleet', url: '/fleet', destinationScope: 'theme' },
    { id: 'sell-my-car', label: 'Sell my car', url: '/sell-my-car', destinationScope: 'theme' },
    { id: 'service', label: 'Book a Service', url: '/service', destinationScope: 'service' },
    { id: 'test-drive', label: 'Book a Test Drive', url: '/test-drive', destinationScope: 'theme' },
    { id: 'contact', label: 'Contact Us', url: '/contact', destinationScope: 'theme' },
    { id: 'models', label: 'Models', url: '/models', destinationScope: 'theme' },
    { id: 'hyundai-au', label: 'Hyundai Australia', url: DEFAULT_HYUNDAI_NATIONAL_URL, destinationScope: 'hyundaiNational', target: '_blank' },
  ];

  return normalizeHyundaiNavigationSettings({
    domains: {
      themeUrl: normalizeBaseUrl(options.themeUrl),
      hyundaiNationalUrl: normalizeBaseUrl(options.hyundaiNationalUrl) || DEFAULT_HYUNDAI_NATIONAL_URL,
    },
    links,
    collections: {
      mainnav: [
        { linkId: 'stock' },
        { linkId: 'offers' },
        { linkId: 'finance' },
        { linkId: 'fleet' },
        { linkId: 'sell-my-car' },
      ],
      mobileSections: [
        {
          id: 'shop',
          heading: 'Shop',
          items: [{ linkId: 'models' }, { linkId: 'stock' }, { linkId: 'offers' }],
        },
        {
          id: 'dealer',
          heading: 'Dealer',
          items: [{ linkId: 'service' }, { linkId: 'test-drive' }, { linkId: 'contact' }],
        },
      ],
      footer: [
        {
          id: 'shop',
          heading: 'Shop',
          items: [{ linkId: 'models' }, { linkId: 'stock' }, { linkId: 'offers' }, { linkId: 'sell-my-car' }],
        },
        {
          id: 'services',
          heading: 'Services',
          items: [{ linkId: 'service' }, { linkId: 'test-drive' }, { linkId: 'finance' }],
        },
        {
          id: 'about',
          heading: 'About',
          items: [{ linkId: 'contact' }, { linkId: 'hyundai-au' }],
        },
      ],
      quickLinks: [{ linkId: 'stock' }, { linkId: 'service' }, { linkId: 'test-drive' }],
    },
  });
}

export function normalizeHyundaiNavigationSettings(input: unknown): HyundaiNavigationSettings {
  const fallback = createBareHyundaiNavigationSettings();
  const candidate = isRecord(input) ? input : {};
  const collections = isRecord(candidate.collections) ? candidate.collections : {};
  const domains = isRecord(candidate.domains) ? candidate.domains : {};

  const settings: HyundaiNavigationSettings = {
    domains: {
      themeUrl: normalizeBaseUrl(domains.themeUrl),
      hyundaiNationalUrl: normalizeBaseUrl(domains.hyundaiNationalUrl) || DEFAULT_HYUNDAI_NATIONAL_URL,
    },
    links: normalizeLinks(candidate.links),
    collections: {
      mainnav: normalizeCollectionItems(collections.mainnav),
      mobileSections: normalizeMobileSections(collections.mobileSections),
      footer: normalizeFooterColumns(collections.footer),
      quickLinks: normalizeCollectionItems(collections.quickLinks),
    },
    updatedAt: normalizeNullableString(candidate.updatedAt),
    updatedBy: normalizeNullableString(candidate.updatedBy),
  };

  return settings.links.length ? settings : fallback;
}

export function compileHyundaiNavigationSitelinks(
  settings: HyundaiNavigationSettings,
): HyundaiCompiledNavigation {
  const normalized = normalizeHyundaiNavigationSettings(settings);
  const links = new Map(normalized.links.map((link) => [link.id, link]));

  return {
    mainnav: normalized.collections.mainnav
      .map((item) => compileNavItem(item, links))
      .filter((item): item is HyundaiLegacyNavItem => Boolean(item)),
    mobilenav: normalized.collections.mobileSections
      .map((section) => ({
        heading: section.heading,
        links: section.items
          .map((item) => compileLegacyLink(item, links))
          .filter((item): item is HyundaiLegacyLink => Boolean(item)),
      }))
      .filter((section) => section.heading && section.links.length),
    footer: normalized.collections.footer
      .map((column) => ({
        heading: column.heading,
        links: column.items
          .map((item) => compileLegacyLink(item, links))
          .filter((item): item is HyundaiLegacyLink => Boolean(item)),
      }))
      .filter((section) => section.heading && section.links.length),
    quick_links: normalized.collections.quickLinks
      .map((item) => compileLegacyLink(item, links))
      .filter((item): item is HyundaiLegacyLink => Boolean(item)),
  };
}

export function applyHyundaiNavigationToSiteConfig<TConfig extends HyundaiSiteConfigLike>(
  config: TConfig,
  navigation: unknown,
): TConfig {
  const settings = normalizeHyundaiNavigationSettings(navigation);
  if (!settings.links.length) return config;

  const compiled = compileHyundaiNavigationSitelinks(settings);

  return {
    ...config,
    navigation: {
      ...(isRecord(config.navigation) ? config.navigation : {}),
      main: compiled.mainnav,
    },
    sitelinks: {
      ...(isRecord(config.sitelinks) ? config.sitelinks : {}),
      mainnav: compiled.mainnav,
      mobilenav: compiled.mobilenav,
      footer: compiled.footer,
    },
    quick_links: compiled.quick_links,
  };
}

function createBareHyundaiNavigationSettings(): HyundaiNavigationSettings {
  return {
    domains: {
      themeUrl: '',
      hyundaiNationalUrl: DEFAULT_HYUNDAI_NATIONAL_URL,
    },
    links: [],
    collections: {
      mainnav: [],
      mobileSections: [],
      footer: [],
      quickLinks: [],
    },
    updatedAt: null,
    updatedBy: null,
  };
}

function normalizeLinks(input: unknown): HyundaiNavigationLink[] {
  if (!Array.isArray(input)) return [];

  const seen = new Set<string>();
  return input
    .map((item) => {
      if (!isRecord(item)) return null;
      const id = normalizeString(item.id);
      const label = normalizeString(item.label);
      const url = normalizeString(item.url);
      if (!id || !label || !url || seen.has(id)) return null;
      seen.add(id);

      return {
        id,
        label,
        url,
        destinationScope: normalizeDestinationScope(item.destinationScope),
        target: item.target === '_blank' ? '_blank' : '_self',
      };
    })
    .filter((item): item is HyundaiNavigationLink => Boolean(item));
}

function normalizeMobileSections(input: unknown): HyundaiNavigationMobileSection[] {
  if (!Array.isArray(input)) return [];

  return input
    .map((item) => {
      if (!isRecord(item)) return null;
      const id = normalizeString(item.id);
      const heading = normalizeString(item.heading);
      const items = normalizeCollectionItems(item.items);
      if (!id || !heading || !items.length) return null;
      return { id, heading, items };
    })
    .filter((item): item is HyundaiNavigationMobileSection => Boolean(item));
}

function normalizeFooterColumns(input: unknown): HyundaiNavigationFooterColumn[] {
  if (!Array.isArray(input)) return [];

  return input
    .map((item) => {
      if (!isRecord(item)) return null;
      const id = normalizeString(item.id);
      const heading = normalizeString(item.heading);
      const items = normalizeCollectionItems(item.items);
      if (!id || !heading || !items.length) return null;
      return { id, heading, items };
    })
    .filter((item): item is HyundaiNavigationFooterColumn => Boolean(item));
}

function normalizeCollectionItems(input: unknown): HyundaiNavigationCollectionItem[] {
  if (!Array.isArray(input)) return [];

  return input
    .map((item) => {
      if (!isRecord(item)) return null;
      const linkId = normalizeString(item.linkId);
      if (!linkId) return null;
      return {
        linkId,
        children: normalizeCollectionItems(item.children),
      };
    })
    .filter((item): item is HyundaiNavigationCollectionItem => Boolean(item));
}

function compileNavItem(
  item: HyundaiNavigationCollectionItem,
  links: Map<string, HyundaiNavigationLink>,
): HyundaiLegacyNavItem | null {
  const link = links.get(item.linkId);
  if (!link) return null;

  const children = item.children
    ?.map((child) => compileNavItem(child, links))
    .filter((child): child is HyundaiLegacyNavItem => Boolean(child));

  return {
    name: link.label,
    url: link.url,
    ...(link.target === '_blank' ? { target: link.target } : {}),
    ...(children?.length ? { children } : {}),
  };
}

function compileLegacyLink(
  item: HyundaiNavigationCollectionItem,
  links: Map<string, HyundaiNavigationLink>,
): HyundaiLegacyLink | null {
  const link = links.get(item.linkId);
  if (!link) return null;

  return {
    title: link.label,
    url: link.url,
    ...(link.target === '_blank' ? { target: link.target } : {}),
  };
}

function normalizeDestinationScope(input: unknown): HyundaiNavigationDestinationScope {
  switch (input) {
    case 'hyundaiNational':
    case 'inventory':
    case 'service':
    case 'phone':
    case 'email':
    case 'external':
      return input;
    default:
      return 'theme';
  }
}

function normalizeBaseUrl(input: unknown): string {
  const value = normalizeString(input).replace(/\/+$/, '');
  if (!value) return '';
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function normalizeNullableString(input: unknown): string | null {
  return normalizeString(input) || null;
}

function normalizeString(input: unknown): string {
  return typeof input === 'string' ? input.trim() : '';
}

function isRecord(input: unknown): input is Record<string, unknown> {
  return Boolean(input && typeof input === 'object' && !Array.isArray(input));
}
