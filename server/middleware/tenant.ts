import { setTenantContext } from '../utils/db';

/**
 * Tenant Middleware
 * 
 * Automatically sets the tenant context (dealer_id) for Row-Level Security (RLS)
 * based on the authenticated user's JWT token.
 * 
 * This middleware runs on all /api/admin/* routes to ensure tenant isolation.
 * Public routes like /api/enquiry are excluded.
 */
export default defineEventHandler(async (event) => {
  const path = event.path;
  
  // Skip tenant context for public endpoints
  if (
    path.startsWith('/api/enquiry') ||
    path.startsWith('/api/auth/login') ||
    path.startsWith('/_nuxt') ||
    path.startsWith('/api/all-variants') ||
    path.startsWith('/api/vehicle') ||
    path.startsWith('/api/search') ||
    path.startsWith('/api/page') ||
    path.startsWith('/api/hyundai-offers') ||
    path.startsWith('/api/accessories') ||
    path.startsWith('/api/form') ||
    path.startsWith('/api/stripe') ||
    path.startsWith('/api/car-calculator') ||
    path.startsWith('/api/carsales-feed') ||
    path.startsWith('/api/reviews') ||
    path.startsWith('/api/variant')
  ) {
    return;
  }
  
  // Only apply to admin routes
  if (!path.startsWith('/api/admin')) {
    return;
  }
  
  try {
    // Get JWT token from cookie or Authorization header
    const token = getCookie(event, 'auth_token') || 
                  getHeader(event, 'authorization')?.replace('Bearer ', '');
    
    if (!token) {
      // No token - let the auth middleware handle this
      return;
    }
    
    // Get dealer_id from auth context (set by auth middleware)
    const dealerId = event.context.dealerId;
    
    if (dealerId) {
      // Set tenant context for this request
      await setTenantContext(dealerId);
      
      // Store dealer_id in event context for use in handlers
      event.context.dealerId = dealerId;
    }
  } catch (error) {
    console.error('[Tenant Middleware] Error setting tenant context:', error);
    // Don't throw - let the request continue but log the error
  }
});










