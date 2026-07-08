import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { H3Event } from 'h3';
import { resolveDealerSlugAliases } from './tenant';
import { resolveTenantContext } from './tenant-db';

export interface TenantVerificationTarget {
  hostname: string;
  expectedSlug: string;
  expectedName: string;
}

export interface TenantConfigSummary {
  path: string;
  name: string;
  hasNav: boolean;
  promotionalCount: number;
  websiteUrl?: string;
  phone?: string;
}

export interface TenantVerificationResult {
  hostname: string;
  expectedSlug: string;
  resolvedSlug: string;
  expectedName: string;
  resolvedName: string;
  source: string;
  config: TenantConfigSummary;
}

export const HYUNDAI_TENANT_VERIFICATION_TARGETS: TenantVerificationTarget[] = [
  {
    hostname: 'bloodhyundai.com.au',
    expectedSlug: 'bloods-hyundai',
    expectedName: 'Blood Hyundai',
  },
  {
    hostname: 'www.bloodhyundai.com.au',
    expectedSlug: 'bloods-hyundai',
    expectedName: 'Blood Hyundai',
  },
  {
    hostname: 'salehyundai.com.au',
    expectedSlug: 'sale-hyundai',
    expectedName: 'Sale Hyundai',
  },
  {
    hostname: 'www.salehyundai.com.au',
    expectedSlug: 'sale-hyundai',
    expectedName: 'Sale Hyundai',
  },
];

function createHostEvent(hostname: string): H3Event {
  return {
    node: {
      req: {
        headers: {
          host: hostname,
        },
      },
    },
  } as H3Event;
}

function getLocalConfigCandidates(dealerSlug: string, cwd: string): string[] {
  const dealerSpecificPaths = resolveDealerSlugAliases(dealerSlug).flatMap((slug) => [
    join(cwd, `server/data/site-config.${slug}.json`),
    join(cwd, `.nuxt/dev/server/data/site-config.${slug}.json`),
  ]);

  return [
    ...dealerSpecificPaths,
    join(cwd, 'server/data/site-config.json'),
    join(cwd, '.nuxt/dev/server/data/site-config.json'),
  ];
}

export function loadLocalSiteConfigSummary(
  dealerSlug: string,
  cwd = process.cwd()
): TenantConfigSummary {
  for (const candidatePath of getLocalConfigCandidates(dealerSlug, cwd)) {
    if (!existsSync(candidatePath)) {
      continue;
    }

    const config = JSON.parse(readFileSync(candidatePath, 'utf-8'));
    const nav = Array.isArray(config.navigation?.main)
      ? config.navigation.main
      : Array.isArray(config.sitelinks?.mainnav)
        ? config.sitelinks.mainnav
        : [];

    return {
      path: candidatePath,
      name: String(config.name || ''),
      hasNav: nav.length > 0,
      promotionalCount: Array.isArray(config.promotional) ? config.promotional.length : 0,
      websiteUrl: typeof config.websiteUrl === 'string' ? config.websiteUrl : undefined,
      phone: typeof config.phone === 'string' ? config.phone : undefined,
    };
  }

  throw new Error(`No local site config fallback found for tenant "${dealerSlug}"`);
}

function assertTenantConfigMatchesTarget(
  target: TenantVerificationTarget,
  result: TenantVerificationResult
): void {
  if (result.resolvedSlug !== target.expectedSlug) {
    throw new Error(
      `${target.hostname} resolved "${result.resolvedSlug}", expected "${target.expectedSlug}"`
    );
  }

  if (result.resolvedName !== target.expectedName) {
    throw new Error(
      `${target.hostname} resolved "${result.resolvedName}", expected "${target.expectedName}"`
    );
  }

  if (result.config.name !== target.expectedName) {
    throw new Error(
      `${target.hostname} loaded config "${result.config.name}", expected "${target.expectedName}"`
    );
  }

  if (!result.config.hasNav) {
    throw new Error(`${target.hostname} local config has no main navigation`);
  }
}

export async function verifyHyundaiTenantTargets(
  targets: TenantVerificationTarget[] = HYUNDAI_TENANT_VERIFICATION_TARGETS,
  cwd = process.cwd()
): Promise<TenantVerificationResult[]> {
  const results: TenantVerificationResult[] = [];

  for (const target of targets) {
    const context = await resolveTenantContext(createHostEvent(target.hostname));
    const result: TenantVerificationResult = {
      hostname: target.hostname,
      expectedSlug: target.expectedSlug,
      resolvedSlug: context.tenant.slug,
      expectedName: target.expectedName,
      resolvedName: context.tenant.name,
      source: context.source,
      config: loadLocalSiteConfigSummary(context.tenant.slug, cwd),
    };

    assertTenantConfigMatchesTarget(target, result);
    results.push(result);
  }

  return results;
}
