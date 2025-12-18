/**
 * Vehicle Enrichment Cache Service
 *
 * Manages the Supabase caching layer for vehicle enrichment data.
 * Provides cross-application data sharing with efficient cache lookups.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type {
  VehicleSpecsCache,
  ANCAPRatingCache,
  MarketDataCache,
  CacheStats,
  VehicleInput,
  VehicleEnrichment,
} from '../types/enrichment';

// Cache expiry constants (in days)
const SPECS_CACHE_DAYS = 90;
const ANCAP_CACHE_DAYS = 90;
const MARKET_CACHE_DAYS = 7;
const ENRICHMENT_CACHE_DAYS = 90;

// Interface for the vehicle_enrichments table row
interface VehicleEnrichmentRow {
  id: string;
  vehicle_id?: string;
  vehicle_fingerprint: string;
  enrichment_data: string | VehicleEnrichment;
  enriched_at: string;
  website_id?: string;
  created_at: string;
  updated_at: string;
}

class VehicleEnrichmentCacheService {
  private supabase: SupabaseClient | null = null;
  private initialized = false;

  /**
   * Initialize the Supabase client for enrichment cache
   */
  private initialize(): void {
    if (this.initialized) return;

    const supabaseUrl = process.env.NUXT_VEHICLE_SPECS_SUPABASE_URL;
    const supabaseKey = process.env.NUXT_VEHICLE_SPECS_SUPABASE_KEY ||
                        process.env.NUXT_VEHICLE_SPECS_SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.warn('[EnrichmentCache] Supabase credentials not configured - cache disabled');
      this.initialized = true;
      return;
    }

    try {
      this.supabase = createClient(supabaseUrl, supabaseKey);
      this.initialized = true;
      console.log('[EnrichmentCache] Supabase client initialized');
    } catch (error) {
      console.error('[EnrichmentCache] Failed to initialize Supabase:', error);
      this.initialized = true;
    }
  }

  /**
   * Check if cache is available
   */
  isAvailable(): boolean {
    this.initialize();
    return this.supabase !== null;
  }

  /**
   * Generate a vehicle fingerprint for cache lookups
   * Format: year-make-model[-variant][-transmission][-drivetrain]
   *
   * Enhanced format includes transmission and drivetrain for more accurate
   * specification lookups, especially for variants with different powertrains.
   */
  generateFingerprint(vehicle: VehicleInput | { make: string; model: string; year: number; variant?: string; transmission?: string; driveType?: string }): string {
    const parts = [
      vehicle.year.toString(),
      vehicle.make.toLowerCase(),
      vehicle.model.toLowerCase(),
    ];

    if ('variant' in vehicle && vehicle.variant) {
      parts.push(vehicle.variant.toLowerCase());
    }

    // Normalize and add transmission (auto/manual)
    if ('transmission' in vehicle && vehicle.transmission) {
      const transNorm = vehicle.transmission.toLowerCase();
      if (transNorm.includes('auto')) {
        parts.push('auto');
      } else if (transNorm.includes('manual')) {
        parts.push('manual');
      }
    }

    // Normalize and add drivetrain (fwd/rwd/awd/4wd)
    if ('driveType' in vehicle && vehicle.driveType) {
      const driveNorm = vehicle.driveType.toLowerCase();
      if (driveNorm.includes('front') || driveNorm === 'fwd') {
        parts.push('fwd');
      } else if (driveNorm.includes('rear') || driveNorm === 'rwd') {
        parts.push('rwd');
      } else if (driveNorm.includes('all') || driveNorm === 'awd') {
        parts.push('awd');
      } else if (driveNorm.includes('4wd') || driveNorm.includes('four')) {
        parts.push('4wd');
      }
    }

    return parts
      .join('-')
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  // ===========================================================================
  // UNIFIED VEHICLE ENRICHMENT CACHE (vehicle_enrichments table)
  // ===========================================================================

  /**
   * Get cached enrichment from the unified vehicle_enrichments table
   * This is the preferred method as it stores complete enrichment data
   */
  async getEnrichment(fingerprint: string): Promise<VehicleEnrichment | null> {
    if (!this.isAvailable()) return null;

    try {
      // Try exact match first
      let { data, error } = await this.supabase!
        .from('vehicle_enrichments')
        .select('*')
        .eq('vehicle_fingerprint', fingerprint)
        .order('enriched_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // If no exact match, try a fuzzy match without variant suffix
      if (!data && fingerprint.includes('-')) {
        const baseFingerprint = fingerprint.split('-').slice(0, 3).join('-');
        const result = await this.supabase!
          .from('vehicle_enrichments')
          .select('*')
          .ilike('vehicle_fingerprint', `${baseFingerprint}%`)
          .order('enriched_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        data = result.data;
        error = result.error;
      }

      if (error) {
        console.error('[EnrichmentCache] Error fetching enrichment:', error);
        return null;
      }

      if (!data) {
        return null;
      }

      // Check if cache is expired
      if (this.isCacheExpired(data.enriched_at, ENRICHMENT_CACHE_DAYS)) {
        console.log('[EnrichmentCache] Enrichment cache expired for', fingerprint);
        return null;
      }

      // Parse enrichment_data if it's a string
      const enrichmentData = typeof data.enrichment_data === 'string'
        ? JSON.parse(data.enrichment_data)
        : data.enrichment_data;

      return {
        ...enrichmentData,
        vehicleFingerprint: data.vehicle_fingerprint,
        enrichedAt: data.enriched_at,
      } as VehicleEnrichment;
    } catch (error) {
      console.error('[EnrichmentCache] Exception fetching enrichment:', error);
      return null;
    }
  }

  /**
   * Save enrichment to the unified vehicle_enrichments table
   */
  async saveEnrichment(
    fingerprint: string,
    enrichment: VehicleEnrichment,
    vehicleId?: string
  ): Promise<boolean> {
    if (!this.isAvailable()) return false;

    try {
      const { error } = await this.supabase!
        .from('vehicle_enrichments')
        .upsert(
          {
            vehicle_fingerprint: fingerprint,
            vehicle_id: vehicleId,
            enrichment_data: enrichment,
            enriched_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'vehicle_fingerprint',
          }
        );

      if (error) {
        console.error('[EnrichmentCache] Error saving enrichment:', error);
        return false;
      }

      console.log('[EnrichmentCache] Enrichment cached for', fingerprint);
      return true;
    } catch (error) {
      console.error('[EnrichmentCache] Exception saving enrichment:', error);
      return false;
    }
  }

  // ===========================================================================
  // VEHICLE SPECIFICATIONS CACHE (Legacy - vehicle_specifications table)
  // ===========================================================================

  /**
   * Get cached vehicle specifications
   */
  async getVehicleSpecs(
    make: string,
    model: string,
    year: number,
    variant?: string
  ): Promise<VehicleSpecsCache | null> {
    if (!this.isAvailable()) return null;

    try {
      let query = this.supabase!
        .from('vehicle_specifications')
        .select('*')
        .ilike('make', make)
        .ilike('model', model)
        .eq('year', year);

      if (variant) {
        query = query.ilike('variant', variant);
      }

      const { data, error } = await query.maybeSingle();

      if (error) {
        console.error('[EnrichmentCache] Error fetching specs:', error);
        return null;
      }

      // Check if cache is expired
      if (data && this.isCacheExpired(data.fetched_at, SPECS_CACHE_DAYS)) {
        console.log('[EnrichmentCache] Specs cache expired for', make, model, year);
        return null;
      }

      return data;
    } catch (error) {
      console.error('[EnrichmentCache] Exception fetching specs:', error);
      return null;
    }
  }

  /**
   * Save vehicle specifications to cache
   */
  async saveVehicleSpecs(specs: VehicleSpecsCache): Promise<boolean> {
    if (!this.isAvailable()) return false;

    try {
      const { error } = await this.supabase!
        .from('vehicle_specifications')
        .upsert(
          {
            ...specs,
            fetched_at: new Date().toISOString(),
          },
          {
            onConflict: 'make,model,year,variant',
          }
        );

      if (error) {
        console.error('[EnrichmentCache] Error saving specs:', error);
        return false;
      }

      console.log('[EnrichmentCache] Specs cached for', specs.make, specs.model, specs.year);
      return true;
    } catch (error) {
      console.error('[EnrichmentCache] Exception saving specs:', error);
      return false;
    }
  }

  // ===========================================================================
  // ANCAP RATINGS CACHE
  // ===========================================================================

  /**
   * Get cached ANCAP rating
   */
  async getANCAPRating(
    make: string,
    model: string,
    year: number,
    variant?: string
  ): Promise<ANCAPRatingCache | null> {
    if (!this.isAvailable()) return null;

    try {
      // First try exact match with variant
      if (variant) {
        const { data: exactMatch } = await this.supabase!
          .from('ancap_ratings')
          .select('*')
          .ilike('make', make)
          .ilike('model', model)
          .eq('year', year)
          .ilike('variant', variant)
          .maybeSingle();

        if (exactMatch && !this.isCacheExpired(exactMatch.fetched_at, ANCAP_CACHE_DAYS)) {
          return exactMatch;
        }
      }

      // Fallback to model-level match (ANCAP often rates by model, not variant)
      const { data, error } = await this.supabase!
        .from('ancap_ratings')
        .select('*')
        .ilike('make', make)
        .ilike('model', model)
        .lte('year', year)
        .order('year', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('[EnrichmentCache] Error fetching ANCAP:', error);
        return null;
      }

      if (data && this.isCacheExpired(data.fetched_at, ANCAP_CACHE_DAYS)) {
        return null;
      }

      return data;
    } catch (error) {
      console.error('[EnrichmentCache] Exception fetching ANCAP:', error);
      return null;
    }
  }

  /**
   * Save ANCAP rating to cache
   */
  async saveANCAPRating(rating: ANCAPRatingCache): Promise<boolean> {
    if (!this.isAvailable()) return false;

    try {
      const { error } = await this.supabase!
        .from('ancap_ratings')
        .upsert(
          {
            ...rating,
            fetched_at: new Date().toISOString(),
          },
          {
            onConflict: 'make,model,year,variant',
          }
        );

      if (error) {
        console.error('[EnrichmentCache] Error saving ANCAP:', error);
        return false;
      }

      console.log('[EnrichmentCache] ANCAP cached for', rating.make, rating.model, rating.year);
      return true;
    } catch (error) {
      console.error('[EnrichmentCache] Exception saving ANCAP:', error);
      return false;
    }
  }

  // ===========================================================================
  // MARKET DATA CACHE
  // ===========================================================================

  /**
   * Get cached market data
   */
  async getMarketData(
    make: string,
    model: string,
    year: number,
    condition?: string,
    kmsRange?: string,
    location?: string
  ): Promise<MarketDataCache | null> {
    if (!this.isAvailable()) return null;

    try {
      let query = this.supabase!
        .from('market_data_cache')
        .select('*')
        .ilike('make', make)
        .ilike('model', model)
        .eq('year', year);

      if (condition) {
        query = query.eq('condition', condition);
      }
      if (kmsRange) {
        query = query.eq('kms_range', kmsRange);
      }
      if (location) {
        query = query.ilike('location', location);
      }

      const { data, error } = await query.maybeSingle();

      if (error) {
        // Silently ignore "relation does not exist" errors - market_data_cache table is optional
        if (error.code !== '42P01') {
          console.error('[EnrichmentCache] Error fetching market data:', error);
        }
        return null;
      }

      // Market data has shorter cache expiry
      if (data && this.isCacheExpired(data.fetched_at, MARKET_CACHE_DAYS)) {
        console.log('[EnrichmentCache] Market data cache expired for', make, model, year);
        return null;
      }

      return data;
    } catch (error) {
      console.error('[EnrichmentCache] Exception fetching market data:', error);
      return null;
    }
  }

  /**
   * Save market data to cache
   */
  async saveMarketData(marketData: MarketDataCache): Promise<boolean> {
    if (!this.isAvailable()) return false;

    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + MARKET_CACHE_DAYS);

      const { error } = await this.supabase!
        .from('market_data_cache')
        .upsert(
          {
            ...marketData,
            fetched_at: new Date().toISOString(),
            cache_expires_at: expiresAt.toISOString(),
          },
          {
            onConflict: 'make,model,year,variant,condition,kms_range,location',
          }
        );

      if (error) {
        console.error('[EnrichmentCache] Error saving market data:', error);
        return false;
      }

      console.log('[EnrichmentCache] Market data cached for', marketData.make, marketData.model, marketData.year);
      return true;
    } catch (error) {
      console.error('[EnrichmentCache] Exception saving market data:', error);
      return false;
    }
  }

  // ===========================================================================
  // BATCH OPERATIONS
  // ===========================================================================

  /**
   * Batch get enrichment data for multiple vehicles
   */
  async batchGetEnrichment(
    vehicles: Array<{ make: string; model: string; year: number; variant?: string }>
  ): Promise<Map<string, { specs?: VehicleSpecsCache; ancap?: ANCAPRatingCache; market?: MarketDataCache }>> {
    const results = new Map<string, { specs?: VehicleSpecsCache; ancap?: ANCAPRatingCache; market?: MarketDataCache }>();

    if (!this.isAvailable() || vehicles.length === 0) {
      return results;
    }

    // Process in parallel with Promise.all
    await Promise.all(
      vehicles.map(async (vehicle) => {
        const fingerprint = this.generateFingerprint(vehicle);

        const [specs, ancap, market] = await Promise.all([
          this.getVehicleSpecs(vehicle.make, vehicle.model, vehicle.year, vehicle.variant),
          this.getANCAPRating(vehicle.make, vehicle.model, vehicle.year, vehicle.variant),
          this.getMarketData(vehicle.make, vehicle.model, vehicle.year),
        ]);

        results.set(fingerprint, {
          specs: specs || undefined,
          ancap: ancap || undefined,
          market: market || undefined,
        });
      })
    );

    return results;
  }

  // ===========================================================================
  // CACHE MANAGEMENT
  // ===========================================================================

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<CacheStats | null> {
    if (!this.isAvailable()) return null;

    try {
      const [specsCount, ancapCount, marketCount] = await Promise.all([
        this.supabase!.from('vehicle_specifications').select('*', { count: 'exact', head: true }),
        this.supabase!.from('ancap_ratings').select('*', { count: 'exact', head: true }),
        this.supabase!.from('market_data_cache').select('*', { count: 'exact', head: true }),
      ]);

      // Get oldest and newest records
      const [oldest, newest] = await Promise.all([
        this.supabase!
          .from('vehicle_specifications')
          .select('fetched_at')
          .order('fetched_at', { ascending: true })
          .limit(1)
          .maybeSingle(),
        this.supabase!
          .from('vehicle_specifications')
          .select('fetched_at')
          .order('fetched_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      return {
        totalSpecsRecords: specsCount.count || 0,
        totalAncapRecords: ancapCount.count || 0,
        totalMarketRecords: marketCount.count || 0,
        cacheHitRate: 0, // Would need to track this separately
        avgResponseTimeMs: 0, // Would need to track this separately
        lastUpdated: new Date().toISOString(),
        oldestRecord: oldest.data?.fetched_at,
        newestRecord: newest.data?.fetched_at,
      };
    } catch (error) {
      console.error('[EnrichmentCache] Error getting cache stats:', error);
      return null;
    }
  }

  /**
   * Clear expired cache entries
   */
  async clearExpiredCache(): Promise<{ specs: number; ancap: number; market: number }> {
    if (!this.isAvailable()) {
      return { specs: 0, ancap: 0, market: 0 };
    }

    const specsExpiry = new Date();
    specsExpiry.setDate(specsExpiry.getDate() - SPECS_CACHE_DAYS);

    const ancapExpiry = new Date();
    ancapExpiry.setDate(ancapExpiry.getDate() - ANCAP_CACHE_DAYS);

    try {
      const [specsResult, ancapResult, marketResult] = await Promise.all([
        this.supabase!
          .from('vehicle_specifications')
          .delete()
          .lt('fetched_at', specsExpiry.toISOString())
          .select('id'),
        this.supabase!
          .from('ancap_ratings')
          .delete()
          .lt('fetched_at', ancapExpiry.toISOString())
          .select('id'),
        this.supabase!
          .from('market_data_cache')
          .delete()
          .lt('cache_expires_at', new Date().toISOString())
          .select('id'),
      ]);

      return {
        specs: specsResult.data?.length || 0,
        ancap: ancapResult.data?.length || 0,
        market: marketResult.data?.length || 0,
      };
    } catch (error) {
      console.error('[EnrichmentCache] Error clearing expired cache:', error);
      return { specs: 0, ancap: 0, market: 0 };
    }
  }

  // ===========================================================================
  // PRIVATE HELPERS
  // ===========================================================================

  /**
   * Check if a cache entry is expired
   */
  private isCacheExpired(fetchedAt: string | null | undefined, maxDays: number): boolean {
    if (!fetchedAt) return true;

    const fetchDate = new Date(fetchedAt);
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() - maxDays);

    return fetchDate < expiryDate;
  }
}

// Export singleton instance
export const vehicleEnrichmentCache = new VehicleEnrichmentCacheService();

// Export class for testing
export { VehicleEnrichmentCacheService };
