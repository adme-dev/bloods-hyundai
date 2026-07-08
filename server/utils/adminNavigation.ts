import {
  compileHyundaiNavigationSitelinks,
  createDefaultHyundaiNavigationSettings,
  normalizeHyundaiNavigationSettings,
  type HyundaiNavigationSettings,
} from '../../app/utils/siteNavigation';

export interface AdminNavigationDealerDefaults {
  themeUrl?: string | null;
  hyundaiNationalUrl?: string | null;
}

export function canManageHyundaiNavigation(role?: string | null): boolean {
  return role === 'dealer_admin' || role === 'admin' || role === 'manager';
}

export function buildAdminNavigationResponse(
  navigation: unknown,
  defaults: AdminNavigationDealerDefaults = {},
) {
  const defaultNavigation = createDefaultHyundaiNavigationSettings(defaults);
  const normalized = normalizeHyundaiNavigationSettings(navigation);
  const settings = normalized.links.length
    ? {
        ...normalized,
        domains: {
          ...defaultNavigation.domains,
          ...normalized.domains,
          themeUrl: normalized.domains.themeUrl || defaultNavigation.domains.themeUrl,
          hyundaiNationalUrl: normalized.domains.hyundaiNationalUrl || defaultNavigation.domains.hyundaiNationalUrl,
        },
      }
    : defaultNavigation;
  const compiled = compileHyundaiNavigationSitelinks(settings);

  return {
    navigation: settings,
    preview: {
      navigation: {
        main: compiled.mainnav,
      },
      sitelinks: {
        mainnav: compiled.mainnav,
        mobilenav: compiled.mobilenav,
        footer: compiled.footer,
      },
      quick_links: compiled.quick_links,
    },
  };
}

export function mergeDealerNavigationSettings(
  currentSettings: unknown,
  navigation: unknown,
  userId?: string | null,
  now: Date = new Date(),
): Record<string, any> {
  const current = isRecord(currentSettings) ? currentSettings : {};
  const normalized: HyundaiNavigationSettings = {
    ...normalizeHyundaiNavigationSettings(navigation),
    updatedAt: now.toISOString(),
    updatedBy: userId || null,
  };

  return {
    ...current,
    navigation: normalized,
  };
}

export function dealerNavigationDefaults(dealer: {
  websiteUrl?: string | null;
  settings?: unknown;
}): AdminNavigationDealerDefaults {
  const settings = isRecord(dealer.settings) ? dealer.settings : {};

  return {
    themeUrl: dealer.websiteUrl || asString(settings.themeUrl) || asString(settings.siteUrl),
    hyundaiNationalUrl: asString(settings.hyundaiNationalUrl) || asString(settings.hyundai?.nationalUrl),
  };
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function isRecord(input: unknown): input is Record<string, any> {
  return Boolean(input && typeof input === 'object' && !Array.isArray(input));
}
