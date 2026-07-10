// server/utils/metrics/avgSaleValue.ts

/** Parse a user-entered average sale value into a stored number (AUD, 2dp) or null.
 * Null/empty/non-numeric/<= 0 all normalize to null (ROAS then stays hidden). */
export function parseAvgSaleValue(input: unknown): number | null {
  if (input === null || input === undefined || input === '') return null;
  const n = Number(input);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 100) / 100;
}
