import type { HyundaiTenantInventorySettings, HyundaiTenantSettings } from '../types/tenant';

export const BLOOD_HYUNDAI_INVENTORY_SETTINGS: HyundaiTenantInventorySettings = {
  provider: 'carsales',
  sources: [
    {
      provider: 'carsales',
      transport: 'json-feed',
      url: 'https://tsheefvkecaervnrxvdf.supabase.co/storage/v1/object/public/bucket/blood-hyundai/data.json',
      role: 'primary',
      sellerIds: ['49b41e33-6e72-b64d-43a2-7897e61c1bf0'],
      enabled: true,
    },
    {
      provider: 'carsales',
      transport: 'json-feed',
      url: 'https://tsheefvkecaervnrxvdf.supabase.co/storage/v1/object/public/bucket/blood-motor-group/data.json',
      role: 'group',
      sellerIds: ['646680a2-406b-2430-bde8-761a48e4a2ed'],
      enabled: true,
    },
    {
      provider: 'carsales',
      transport: 'json-feed',
      url: 'https://tsheefvkecaervnrxvdf.supabase.co/storage/v1/object/public/bucket/geelong-mazda/data.json',
      role: 'secondary',
      sellerIds: ['41bba4aa-6460-dbd6-30f7-7f31dfa5ef61'],
      enabled: true,
    },
  ],
  primarySellerIds: ['49b41e33-6e72-b64d-43a2-7897e61c1bf0'],
  groupSellerIds: ['646680a2-406b-2430-bde8-761a48e4a2ed'],
  secondarySellerIds: ['41bba4aa-6460-dbd6-30f7-7f31dfa5ef61'],
};

const DEFAULT_TENANT_SETTINGS: Record<string, HyundaiTenantSettings> = {
  'blood-hyundai': {
    inventory: BLOOD_HYUNDAI_INVENTORY_SETTINGS,
  },
  'bloods-hyundai': {
    inventory: BLOOD_HYUNDAI_INVENTORY_SETTINGS,
  },
};

export function getDefaultTenantSettings(dealerSlug: string): HyundaiTenantSettings {
  return DEFAULT_TENANT_SETTINGS[dealerSlug] || {};
}
