export type InventorySourceProvider = 'carsales' | 'driveagent' | 'supabase' | 'custom';

export type InventorySourceRole = 'primary' | 'group' | 'secondary';

export type InventorySourceTransport = 'json-feed' | 'api';

export interface InventoryFeedSource {
  url: string;
  role: InventorySourceRole;
}

export interface InventorySource extends InventoryFeedSource {
  provider: InventorySourceProvider;
  transport: InventorySourceTransport;
  sellerIds: string[];
  enabled: boolean;
}

export interface TenantInventorySettings {
  provider?: InventorySourceProvider;
  sources?: Array<{
    provider?: InventorySourceProvider;
    transport?: InventorySourceTransport;
    url?: string;
    role?: InventorySourceRole;
    sellerIds?: string[];
    enabled?: boolean;
  }>;
  feedSources?: Array<{
    url?: string;
    role?: InventorySourceRole;
  }>;
  feedUrls?: string[];
  primarySellerIds?: string[];
  groupSellerIds?: string[];
  secondarySellerIds?: string[];
}
