import { H3Event } from 'h3';

/**
 * GET /api/vehicle-detail/[id]
 * Fetches a single vehicle from the carsales feed by identifier
 */
export default defineEventHandler(async (event: H3Event) => {
  const vehicleId = getRouterParam(event, 'id');
  
  if (!vehicleId) {
    throw createError({
      statusCode: 400,
      message: 'Vehicle ID is required',
    });
  }

  try {
    // Fetch all vehicles from carsales-feed
    const config = useRuntimeConfig();
    let feedUrl = '/api/carsales-feed';
    
    // In development, use explicit localhost URL
    if (process.env.NODE_ENV === 'development' || !event.node.req.headers.host) {
      const port = process.env.PORT || 3000;
      feedUrl = `http://localhost:${port}/api/carsales-feed`;
    } else {
      // In production, construct from request headers
      const protocol = event.node.req.headers['x-forwarded-proto'] || 'https';
      const host = event.node.req.headers.host;
      feedUrl = `${protocol}://${host}/api/carsales-feed`;
    }
    
    console.log(`[Vehicle Detail API] Fetching vehicle ${vehicleId} from carsales feed`);
    
    const feedResponse = await $fetch<{ vehiclesData: any[]; filters: any[] }>(feedUrl, {
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!feedResponse || !feedResponse.vehiclesData) {
      throw createError({
        statusCode: 500,
        message: 'Failed to fetch vehicles from feed',
      });
    }
    
    // Find the vehicle by identifier, stockid, or id
    console.log(`[Vehicle Detail API] Searching for vehicle ID: ${vehicleId}`);
    console.log(`[Vehicle Detail API] Total vehicles in feed: ${feedResponse.vehiclesData.length}`);
    
    // Log first vehicle structure for debugging
    if (feedResponse.vehiclesData.length > 0) {
      const firstVehicle = feedResponse.vehiclesData[0];
      console.log(`[Vehicle Detail API] Sample vehicle IDs:`, {
        identifier: firstVehicle.identifier,
        stockid: firstVehicle.stockid,
        id: firstVehicle.id,
        title: firstVehicle.title
      });
    }
    
    const vehicle = feedResponse.vehiclesData.find((v: any) => {
      const vIdentifier = v.identifier;
      const vStockid = v.stockid;
      const vId = v.id;
      
      // Try matching against all possible ID fields
      const matches = 
        (vIdentifier && String(vIdentifier) === String(vehicleId)) ||
        (vStockid && String(vStockid) === String(vehicleId)) ||
        (vId && String(vId) === String(vehicleId));
      
      if (matches) {
        console.log(`[Vehicle Detail API] Found match:`, {
          identifier: vIdentifier,
          stockid: vStockid,
          id: vId,
          title: v.title
        });
      }
      
      return matches;
    });
    
    if (!vehicle) {
      // Log all vehicle IDs for debugging
      console.log(`[Vehicle Detail API] Available vehicle IDs:`, 
        feedResponse.vehiclesData.slice(0, 5).map((v: any) => ({
          identifier: v.identifier,
          stockid: v.stockid,
          id: v.id,
          title: v.title
        }))
      );
      
      throw createError({
        statusCode: 404,
        message: `Vehicle not found: ${vehicleId}`,
      });
    }
    
    console.log(`[Vehicle Detail API] Found vehicle: ${vehicle.title || vehicleId}`);
    
    return {
      success: true,
      vehicle,
    };
  } catch (error: any) {
    console.error(`[Vehicle Detail API] Error fetching vehicle ${vehicleId}:`, error.message);
    
    // If it's already a createError, rethrow it
    if (error.statusCode) {
      throw error;
    }
    
    throw createError({
      statusCode: 500,
      message: `Failed to fetch vehicle data: ${error.message}`,
    });
  }
});

