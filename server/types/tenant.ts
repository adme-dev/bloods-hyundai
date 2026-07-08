export type HyundaiTenantStatus = 'active' | 'staging' | 'disabled';

export type HyundaiTenantOem = 'hyundai';

export interface HyundaiTenantDomain {
  hostname: string;
  isPrimary: boolean;
  isActive: boolean;
}

export interface HyundaiTenantBrandingSettings {
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor?: string;
  accentColor?: string;
  dealerDisplayName?: string;
}

export interface HyundaiTenantNavigationSettings {
  main?: unknown[];
  footer?: unknown[];
  quickLinks?: unknown[];
}

export interface HyundaiTenantHomepageSettings {
  banners?: unknown[];
  thumbnails?: unknown[];
  ticker?: unknown[];
  footerBlocks?: unknown[];
}

export interface HyundaiTenantInventorySettings {
  provider?: 'carsales' | 'driveagent' | 'supabase' | 'custom';
  feedSources?: Array<{
    url: string;
    role: 'primary' | 'group' | 'secondary';
  }>;
  feedUrls?: string[];
  primarySellerIds?: string[];
  groupSellerIds?: string[];
  secondarySellerIds?: string[];
}

export interface HyundaiTenantChatbotSettings {
  enabled?: boolean;
  displayName?: string;
  quickActions?: unknown[];
  nudgeEnabled?: boolean;
  leadDepartment?: string;
}

export interface HyundaiTenantSeoSettings {
  siteName?: string;
  defaultTitle?: string;
  defaultDescription?: string;
  canonicalBaseUrl?: string;
}

export interface HyundaiTenantSettings {
  branding?: HyundaiTenantBrandingSettings;
  navigation?: HyundaiTenantNavigationSettings;
  homepage?: HyundaiTenantHomepageSettings;
  inventory?: HyundaiTenantInventorySettings;
  chatbot?: HyundaiTenantChatbotSettings;
  service?: Record<string, unknown>;
  seo?: HyundaiTenantSeoSettings;
  scripts?: Record<string, unknown>;
  integrations?: Record<string, unknown>;
  siteConfig?: Record<string, unknown>;
}

export interface HyundaiTenant {
  id?: string;
  slug: string;
  name: string;
  domains: HyundaiTenantDomain[];
  siteUrl?: string;
  oem: HyundaiTenantOem;
  status: HyundaiTenantStatus;
  timezone: string;
  locale: string;
  settings: HyundaiTenantSettings;
}

export interface TenantResolutionResult {
  tenant: HyundaiTenant;
  hostname: string;
  source: 'database' | 'fallback-map' | 'env-fallback' | 'default';
}
