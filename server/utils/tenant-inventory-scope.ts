import type { HyundaiTenantSettings } from '../types/tenant';
import {
  getAllSellerIds,
  getHomepageSellerConfig,
} from './inventory-config';

export function resolveTenantSellerIds(
  dealerSlug: string,
  tenantSettings: HyundaiTenantSettings = {}
): string[] {
  return getAllSellerIds(getHomepageSellerConfig(dealerSlug, tenantSettings.inventory));
}
