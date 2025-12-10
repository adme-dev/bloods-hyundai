import { verifyAccessToken } from '../utils/jwt';

/**
 * Auth Middleware
 * 
 * Protects /api/admin/* routes by verifying JWT token
 * Sets user context for use in handlers
 */
export default defineEventHandler(async (event) => {
  const path = event.path;
  
  // Only apply to admin routes
  if (!path.startsWith('/api/admin')) {
    return;
  }
  
  try {
    const token = getCookie(event, 'auth_token');
    
    if (!token) {
      throw createError({
        statusCode: 401,
        message: 'Authentication required',
      });
    }
    
    // Verify token
    const payload = await verifyAccessToken(token);
    
    // Set user context for use in handlers and tenant middleware
    event.context.user = payload;
    event.context.userId = payload.userId;
    event.context.dealerId = payload.dealerId;
    
  } catch (error: any) {
    throw createError({
      statusCode: 401,
      message: 'Invalid or expired token. Please log in again.',
    });
  }
});


