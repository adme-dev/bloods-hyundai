import type { DealerStudioSettings } from './types';

export const DEFAULT_DEALER_STUDIO_SETTINGS: DealerStudioSettings = {
  enabled: false,
  dealershipId: null,
  dealershipSlug: null,
  dealershipName: null,
  locationId: null,
  locationName: null,
  defaultUserEmail: null,
  lastTestedAt: null,
  sandboxMode: false,
  sandboxDealershipId: null,
  sandboxDealershipSlug: null,
  sandboxDealershipName: null,
  sandboxLocationId: null,
  sandboxLocationName: null,
  sandboxDefaultUserEmail: null,
  sandboxConfirmedAt: null,
  sandboxLastSentAt: null,
  sandboxLastLeadId: null,
  sandboxLastLeadClusterId: null,
};

export function readDealerStudioSettings(settings: unknown): DealerStudioSettings {
  const root = isRecord(settings) ? settings : {};
  const stored = isRecord(root.externalCrm) && root.externalCrm.provider === 'dealer_studio'
    ? root.externalCrm
    : {};

  return {
    enabled: stored.enabled === true,
    dealershipId: positiveInteger(stored.dealershipId),
    dealershipSlug: optionalString(stored.dealershipSlug),
    dealershipName: optionalString(stored.dealershipName),
    locationId: positiveInteger(stored.locationId),
    locationName: optionalString(stored.locationName),
    defaultUserEmail: optionalString(stored.defaultUserEmail),
    lastTestedAt: optionalString(stored.lastTestedAt),
    sandboxMode: stored.sandboxMode === true,
    sandboxDealershipId: positiveInteger(stored.sandboxDealershipId),
    sandboxDealershipSlug: optionalString(stored.sandboxDealershipSlug),
    sandboxDealershipName: optionalString(stored.sandboxDealershipName),
    sandboxLocationId: positiveInteger(stored.sandboxLocationId),
    sandboxLocationName: optionalString(stored.sandboxLocationName),
    sandboxDefaultUserEmail: optionalString(stored.sandboxDefaultUserEmail),
    sandboxConfirmedAt: optionalString(stored.sandboxConfirmedAt),
    sandboxLastSentAt: optionalString(stored.sandboxLastSentAt),
    sandboxLastLeadId: optionalString(stored.sandboxLastLeadId),
    sandboxLastLeadClusterId: optionalString(stored.sandboxLastLeadClusterId),
  };
}

export function writeDealerStudioSettings(
  currentSettings: unknown,
  value: DealerStudioSettings,
): Record<string, unknown> {
  const current = isRecord(currentSettings) ? currentSettings : {};
  return {
    ...current,
    externalCrm: {
      provider: 'dealer_studio',
      ...value,
    },
  };
}

export function validateDealerStudioSettings(value: DealerStudioSettings): string[] {
  if (!value.enabled || value.sandboxMode) return [];
  const errors: string[] = [];
  if (!value.dealershipId || !value.dealershipSlug) errors.push('An authorised dealership is required');
  if (!value.locationId) errors.push('A dealership location is required');
  return errors;
}

export function validateDealerStudioSandboxSettings(value: DealerStudioSettings): string[] {
  const errors: string[] = [];
  if (!value.sandboxMode) errors.push('Sandbox mode is not active');
  if (!value.sandboxDealershipId || !value.sandboxDealershipSlug) errors.push('A confirmed sandbox dealership is required');
  if (!value.sandboxLocationId) errors.push('A sandbox dealership location is required');
  if (!value.sandboxConfirmedAt) errors.push('The sandbox dealership confirmation is required');
  return errors;
}

function isRecord(value: unknown): value is Record<string, any> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function optionalString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function positiveInteger(value: unknown): number | null {
  return typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : null;
}
