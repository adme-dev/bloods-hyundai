// server/utils/metrics/roas.ts
export function roasBasis(input: { conversionsValue: number; crmLeads: number; avgSaleValue: number | null }): number | null {
  if (input.conversionsValue > 0) return input.conversionsValue;
  if (input.avgSaleValue && input.crmLeads > 0) return input.crmLeads * input.avgSaleValue;
  return null;
}
export function computeRoas(revenue: number | null, spend: number): number | null {
  if (revenue == null || spend <= 0) return null;
  return Math.round((revenue / spend) * 100) / 100;
}
