import { verifyAccessToken } from '../../utils/jwt';
import { db } from '../../utils/db';
import { users } from '../../database/schema';
import { eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  try {
    const token = getCookie(event, 'auth_token');
    
    if (!token) {
      throw createError({
        statusCode: 401,
        message: 'Not authenticated',
      });
    }
    
    const payload = await verifyAccessToken(token);
    
    // Get fresh user data from database
    const user = await db.query.users.findFirst({
      where: eq(users.id, payload.userId),
      with: {
        dealer: true,
      },
    });
    
    if (!user || !user.isActive) {
      throw createError({
        statusCode: 401,
        message: 'User not found or inactive',
      });
    }
    
    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        department: user.department,
        avatarUrl: user.avatarUrl,
        dealer: {
          id: user.dealer.id,
          name: user.dealer.name,
          slug: user.dealer.slug,
          logoUrl: user.dealer.logoUrl,
          primaryColor: user.dealer.primaryColor,
        },
      },
    };
  } catch (error: any) {
    if (error.statusCode) {
      throw error;
    }
    
    throw createError({
      statusCode: 401,
      message: 'Invalid or expired token',
    });
  }
});

