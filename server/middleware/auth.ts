import { verifyAccessToken, verifyRefreshToken, signAccessToken } from '../utils/jwt';
import { db } from '../utils/db';
import { users } from '../database/schema';
import { eq } from 'drizzle-orm';

/**
 * Auth Middleware
 *
 * Protects /api/admin/* routes by verifying JWT token
 * Sets user context for use in handlers
 * Automatically refreshes expired access tokens using refresh token
 */
export default defineEventHandler(async (event) => {
  const path = event.path;

  // Only apply to admin routes
  if (!path.startsWith('/api/admin')) {
    return;
  }

  const accessToken = getCookie(event, 'auth_token');
  const refreshToken = getCookie(event, 'refresh_token');

  // Try access token first
  if (accessToken) {
    try {
      const payload = await verifyAccessToken(accessToken);
      event.context.user = payload;
      event.context.userId = payload.userId;
      event.context.dealerId = payload.dealerId;
      return;
    } catch {
      // Access token invalid/expired, try refresh below
    }
  }

  // Try refresh token if access token failed
  if (refreshToken) {
    try {
      const refreshPayload = await verifyRefreshToken(refreshToken);

      // Fetch fresh user data from database
      const user = await db.query.users.findFirst({
        where: eq(users.id, refreshPayload.userId),
      });

      if (user && user.isActive) {
        // Generate new access token
        const newAccessToken = await signAccessToken({
          userId: user.id,
          dealerId: user.dealerId,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
        });

        // Set new access token cookie
        setCookie(event, 'auth_token', newAccessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60, // 1 hour
          path: '/',
        });

        // Set user context
        event.context.user = {
          userId: user.id,
          dealerId: user.dealerId,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
        };
        event.context.userId = user.id;
        event.context.dealerId = user.dealerId;
        return;
      }
    } catch {
      // Refresh token also invalid
    }
  }

  // No valid tokens
  throw createError({
    statusCode: 401,
    message: 'Authentication required. Please log in again.',
  });
});







