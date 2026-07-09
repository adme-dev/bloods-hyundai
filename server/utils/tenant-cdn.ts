import { resolveDealerSlugAliases } from './tenant';

export function buildTenantCdnUrls(cdnUrl: string, dealerSlug: string, path: string): string[] {
  const trimmed = cdnUrl.replace(/\/+$/, '');
  const tenantMatch = trimmed.match(/\/files\/([^/]+)$/);
  const aliases = resolveDealerSlugAliases(dealerSlug);
  const tenantSlug = tenantMatch?.[1];
  const allowLegacyPath = !tenantSlug || aliases.includes(tenantSlug);

  return Array.from(new Set([
    ...aliases.map((slug) => {
      const tenantBase = tenantMatch
        ? trimmed.replace(/\/files\/[^/]+$/, `/files/${slug}`)
        : `${trimmed}/files/${slug}`;
      return `${tenantBase}/${path}`;
    }),
    ...(allowLegacyPath ? [`${trimmed}/${path}`] : []),
  ]));
}
