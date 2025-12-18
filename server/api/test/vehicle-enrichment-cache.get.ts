/**
 * Vehicle Enrichment Cache Test/Diagnostic Endpoint
 *
 * GET /api/test/vehicle-enrichment-cache
 *
 * Returns cache health, performance benchmarks, and data validation results.
 * Useful for monitoring and debugging the enrichment system.
 */

import { vehicleEnrichmentCache } from '../../services/vehicle-enrichment-cache';
import { groqEnrichmentService } from '../../services/groq-enrichment';

interface DiagnosticResult {
  timestamp: string;
  environment: {
    enrichmentEnabled: boolean;
    cacheAvailable: boolean;
    aiAvailable: boolean;
    supabaseConfigured: boolean;
    ancapApiAvailable: boolean;
    perplexityConfigured: boolean;
  };
  cacheStats: {
    totalSpecsRecords: number;
    totalAncapRecords: number;
    totalMarketRecords: number;
    oldestRecord?: string;
    newestRecord?: string;
  } | null;
  healthChecks: {
    cacheConnection: HealthCheckResult;
    aiConnection: HealthCheckResult;
    ancapApi: HealthCheckResult;
  };
  sampleQueries: {
    specsLookup: QueryResult;
    ancapLookup: QueryResult;
    marketLookup: QueryResult;
  };
  recommendations: string[];
}

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  latencyMs: number;
  message?: string;
}

interface QueryResult {
  success: boolean;
  latencyMs: number;
  found: boolean;
  error?: string;
}

export default defineEventHandler(async (event): Promise<DiagnosticResult> => {
  const startTime = Date.now();

  // Environment checks
  const environment = {
    enrichmentEnabled: process.env.DISABLE_ENRICHMENT !== 'true',
    cacheAvailable: vehicleEnrichmentCache.isAvailable(),
    aiAvailable: groqEnrichmentService.isAvailable(),
    supabaseConfigured: !!(
      process.env.NUXT_VEHICLE_SPECS_SUPABASE_URL &&
      process.env.NUXT_VEHICLE_SPECS_SUPABASE_KEY
    ),
    ancapApiAvailable: true, // ANCAP is a public API
    perplexityConfigured: !!process.env.PERPLEXITY_API_KEY,
  };

  // Get cache statistics
  let cacheStats = null;
  if (vehicleEnrichmentCache.isAvailable()) {
    cacheStats = await vehicleEnrichmentCache.getCacheStats();
  }

  // Run health checks
  const healthChecks = await runHealthChecks();

  // Run sample queries
  const sampleQueries = await runSampleQueries();

  // Generate recommendations
  const recommendations = generateRecommendations(environment, healthChecks, sampleQueries);

  return {
    timestamp: new Date().toISOString(),
    environment,
    cacheStats: cacheStats ? {
      totalSpecsRecords: cacheStats.totalSpecsRecords,
      totalAncapRecords: cacheStats.totalAncapRecords,
      totalMarketRecords: cacheStats.totalMarketRecords,
      oldestRecord: cacheStats.oldestRecord,
      newestRecord: cacheStats.newestRecord,
    } : null,
    healthChecks,
    sampleQueries,
    recommendations,
  };
});

/**
 * Run health checks on all services
 */
async function runHealthChecks(): Promise<DiagnosticResult['healthChecks']> {
  return {
    cacheConnection: await checkCacheConnection(),
    aiConnection: await checkAIConnection(),
    ancapApi: await checkANCAPApi(),
  };
}

/**
 * Check Supabase cache connection
 */
async function checkCacheConnection(): Promise<HealthCheckResult> {
  const start = Date.now();

  if (!vehicleEnrichmentCache.isAvailable()) {
    return {
      status: 'unhealthy',
      latencyMs: Date.now() - start,
      message: 'Supabase cache not configured',
    };
  }

  try {
    const stats = await vehicleEnrichmentCache.getCacheStats();
    const latency = Date.now() - start;

    if (latency > 1000) {
      return {
        status: 'degraded',
        latencyMs: latency,
        message: 'High latency detected',
      };
    }

    return {
      status: 'healthy',
      latencyMs: latency,
    };
  } catch (error: any) {
    return {
      status: 'unhealthy',
      latencyMs: Date.now() - start,
      message: error.message,
    };
  }
}

/**
 * Check Groq AI connection
 */
async function checkAIConnection(): Promise<HealthCheckResult> {
  const start = Date.now();

  if (!groqEnrichmentService.isAvailable()) {
    return {
      status: 'unhealthy',
      latencyMs: Date.now() - start,
      message: 'AI_API_KEY not configured',
    };
  }

  // We don't make an actual AI call here to avoid costs
  // Just verify the service is initialized
  return {
    status: 'healthy',
    latencyMs: Date.now() - start,
    message: 'Groq client initialized',
  };
}

/**
 * Check ANCAP API availability
 */
async function checkANCAPApi(): Promise<HealthCheckResult> {
  const start = Date.now();

  try {
    const response = await fetch('https://www.ancap.com.au/api/search?make=Toyota', {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(5000),
    });

    const latency = Date.now() - start;

    if (!response.ok) {
      return {
        status: 'degraded',
        latencyMs: latency,
        message: `API returned ${response.status}`,
      };
    }

    if (latency > 2000) {
      return {
        status: 'degraded',
        latencyMs: latency,
        message: 'High latency detected',
      };
    }

    return {
      status: 'healthy',
      latencyMs: latency,
    };
  } catch (error: any) {
    return {
      status: 'unhealthy',
      latencyMs: Date.now() - start,
      message: error.message,
    };
  }
}

/**
 * Run sample queries to test functionality
 */
async function runSampleQueries(): Promise<DiagnosticResult['sampleQueries']> {
  return {
    specsLookup: await testSpecsLookup(),
    ancapLookup: await testANCAPLookup(),
    marketLookup: await testMarketLookup(),
  };
}

/**
 * Test specs cache lookup
 */
async function testSpecsLookup(): Promise<QueryResult> {
  const start = Date.now();

  if (!vehicleEnrichmentCache.isAvailable()) {
    return {
      success: false,
      latencyMs: Date.now() - start,
      found: false,
      error: 'Cache not available',
    };
  }

  try {
    const result = await vehicleEnrichmentCache.getVehicleSpecs('Toyota', 'Camry', 2024);

    return {
      success: true,
      latencyMs: Date.now() - start,
      found: result !== null,
    };
  } catch (error: any) {
    return {
      success: false,
      latencyMs: Date.now() - start,
      found: false,
      error: error.message,
    };
  }
}

/**
 * Test ANCAP cache lookup
 */
async function testANCAPLookup(): Promise<QueryResult> {
  const start = Date.now();

  if (!vehicleEnrichmentCache.isAvailable()) {
    return {
      success: false,
      latencyMs: Date.now() - start,
      found: false,
      error: 'Cache not available',
    };
  }

  try {
    const result = await vehicleEnrichmentCache.getANCAPRating('Toyota', 'Camry', 2024);

    return {
      success: true,
      latencyMs: Date.now() - start,
      found: result !== null,
    };
  } catch (error: any) {
    return {
      success: false,
      latencyMs: Date.now() - start,
      found: false,
      error: error.message,
    };
  }
}

/**
 * Test market data cache lookup
 */
async function testMarketLookup(): Promise<QueryResult> {
  const start = Date.now();

  if (!vehicleEnrichmentCache.isAvailable()) {
    return {
      success: false,
      latencyMs: Date.now() - start,
      found: false,
      error: 'Cache not available',
    };
  }

  try {
    const result = await vehicleEnrichmentCache.getMarketData('Toyota', 'Camry', 2024);

    return {
      success: true,
      latencyMs: Date.now() - start,
      found: result !== null,
    };
  } catch (error: any) {
    return {
      success: false,
      latencyMs: Date.now() - start,
      found: false,
      error: error.message,
    };
  }
}

/**
 * Generate recommendations based on diagnostic results
 */
function generateRecommendations(
  env: DiagnosticResult['environment'],
  health: DiagnosticResult['healthChecks'],
  queries: DiagnosticResult['sampleQueries']
): string[] {
  const recommendations: string[] = [];

  if (!env.enrichmentEnabled) {
    recommendations.push('Vehicle enrichment is disabled. Set DISABLE_ENRICHMENT=false to enable.');
  }

  if (!env.cacheAvailable) {
    recommendations.push(
      'Supabase cache is not configured. Set NUXT_VEHICLE_SPECS_SUPABASE_URL and NUXT_VEHICLE_SPECS_SUPABASE_KEY.'
    );
  }

  if (!env.aiAvailable) {
    recommendations.push('AI enrichment is not configured. Set AI_API_KEY or GROQ_API_KEY.');
  }

  if (!env.perplexityConfigured) {
    recommendations.push(
      'Market data is limited. Consider setting PERPLEXITY_API_KEY for enhanced market intelligence.'
    );
  }

  if (health.cacheConnection.status === 'degraded') {
    recommendations.push('Cache connection is slow. Check Supabase region and connection pooling.');
  }

  if (health.cacheConnection.status === 'unhealthy') {
    recommendations.push('Cache connection failed. Verify Supabase credentials and network access.');
  }

  if (health.ancapApi.status !== 'healthy') {
    recommendations.push('ANCAP API issues detected. Safety ratings may be unavailable.');
  }

  if (!queries.specsLookup.found && queries.specsLookup.success) {
    recommendations.push('Cache is empty. Enrichment requests will hit AI on first access.');
  }

  if (recommendations.length === 0) {
    recommendations.push('All systems operational. No issues detected.');
  }

  return recommendations;
}
