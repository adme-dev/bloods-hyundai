export type DealerStudioDeliveryStatus =
  | 'pending'
  | 'sending'
  | 'synced'
  | 'failed_validation'
  | 'failed_retryable'
  | 'failed_permanent';

export interface DealerStudioSettings {
  enabled: boolean;
  dealershipId: number | null;
  dealershipSlug: string | null;
  dealershipName: string | null;
  locationId: number | null;
  locationName: string | null;
  defaultUserEmail: string | null;
  lastTestedAt: string | null;
}

export interface DealerStudioDealership {
  id: number;
  name: string;
  slug: string;
  locations: Array<{ id: number; name: string; locationType: string | null }>;
  users: Array<{ id: number; name: string; email: string }>;
}

export interface DealerStudioApiKeyDetails {
  id: number;
  permissions: string[];
  dealerships: DealerStudioDealership[];
}

export interface DealerStudioLeadPayload {
  lead: Record<string, unknown>;
}

export type DealerStudioCreateResult =
  | { ok: true; leadId: number; leadClusterId: number }
  | {
      ok: false;
      kind: 'validation' | 'configuration' | 'retryable' | 'permanent';
      status: number | null;
      error: string;
    };

