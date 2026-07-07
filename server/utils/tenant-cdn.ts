export function buildTenantCdnUrls(cdnUrl: string, dealerSlug: string, path: string): string[] {
  const trimmed = cdnUrl.replace(/\/+$/, '');
  const tenantMatch = trimmed.match(/\/files\/([^/]+)$/);
  const tenantBase = tenantMatch
    ? trimmed.replace(/\/files\/[^/]+$/, `/files/${dealerSlug}`)
    : `${trimmed}/files/${dealerSlug}`;
  const allowLegacyPath = !tenantMatch || tenantMatch[1] === dealerSlug;

  return Array.from(new Set([
    `${tenantBase}/${path}`,
    ...(allowLegacyPath ? [`${trimmed}/${path}`] : []),
  ]));
}
