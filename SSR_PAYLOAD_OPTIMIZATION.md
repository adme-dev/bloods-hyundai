# SSR Payload Optimization

This document describes the performance optimization implemented to reduce initial page load times, particularly for the homepage.

## Problem

The original implementation embedded ~700KB of vehicle data in the SSR HTML payload for **every page**, including the homepage. This caused slow initial load times, especially on mobile networks.

## Solution

Implemented a route-aware SSR payload strategy:

1. **Homepage**: Uses lightweight `/api/homepage-filters` endpoint (~10KB) that queries Supabase directly for filter aggregates only
2. **Car Sales Pages**: Full vehicle data preloaded via SSR for immediate search/filter functionality

## Results

| Page | Before | After | Reduction |
|------|--------|-------|-----------|
| Homepage (`/`) | ~542KB | ~145KB | **73%** |
| Car Sales (`/car-sales`) | ~542KB | ~542KB | 0% (intentional) |

The `/api/homepage-filters` endpoint returns ~10KB in ~8ms.

## Architecture

### Files Modified

1. **`app/plugins/vehicles-data.server.ts`** - Route-aware plugin that only preloads full vehicle data on pages that need it:
   - `/car-sales`
   - `/vehicle-for-sale`
   - `/cars-for-sale`
   - `/favorites`

2. **`app/stores/vehicles.ts`** - Updated `fetchVehicles()` to fall back to client-side fetch when no SSR payload data exists (homepage case)

3. **`server/api/homepage-filters.ts`** - New lightweight endpoint that queries Supabase directly for filter aggregates

### Data Flow

```
Homepage Load:
  1. SSR skips vehicle data preload (route not in ROUTES_NEEDING_FULL_DATA)
  2. FrontSearch component calls fetchVehicles()
  3. fetchVehicles() finds no payload data, fetches client-side from /api/carsales-feed
  4. User sees fast initial page load, filters appear after client fetch

Car Sales Page Load:
  1. SSR plugin detects route needs full data
  2. Plugin fetches /api/carsales-feed and embeds in payload
  3. Client hydrates with full vehicle data immediately available
  4. No additional client-side fetch needed
```

### Business Logic

The `/api/homepage-filters` endpoint applies the same filtering logic as `/api/carsales-feed`:

- **Blood Motor Group** (new-cars bucket): Include all vehicles
- **Blood Hyundai / Geelong Mazda**:
  - Hyundai brand: Include demo and new only
  - Other brands: Include used only

## Environment Variables

Required for the homepage-filters endpoint:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-service-role-key
```

## Future Improvements

1. **Caching**: Add Nitro caching to `/api/homepage-filters` for even faster responses
2. **Edge Functions**: Move filter aggregation to edge for lower latency
3. **Incremental Loading**: Load vehicle thumbnails progressively on homepage
