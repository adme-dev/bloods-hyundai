import { db } from '../../utils/db';
import { users, dealers } from '../../database/schema';
import { eq, and } from 'drizzle-orm';
import { verifyPassword } from '../../utils/password';
import { signAccessToken, signRefreshToken } from '../../utils/jwt';

export default defineEventHandler(async (event) => {
  try {
    const { email, password } = await readBody(event);
    
    if (!email || !password) {
      throw createError({
        statusCode: 400,
        message: 'Email and password are required',
      });
    }
    
    // Find user by email
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
      with: {
        dealer: true,
      },
    });
    
    if (!user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid email or password',
      });
    }
    
    // Check if user is active
    if (!user.isActive) {
      throw createError({
        statusCode: 403,
        message: 'Account is inactive. Please contact your administrator.',
      });
    }
    
    // Check if dealer is active
    if (!user.dealer.isActive) {
      throw createError({
        statusCode: 403,
        message: 'Dealer account is inactive.',
      });
    }
    
    // Verify password
    const isValidPassword = await verifyPassword(password, user.passwordHash);
    
    if (!isValidPassword) {
      throw createError({
        statusCode: 401,
        message: 'Invalid email or password',
      });
    }
    
    // Update last login
    await db
      .update(users)
      .set({ lastLogin: new Date() })
      .where(eq(users.id, user.id));
    
    // Generate tokens
    const accessToken = await signAccessToken({
      userId: user.id,
      dealerId: user.dealerId,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
    });
    
    const refreshToken = await signRefreshToken({
      userId: user.id,
      dealerId: user.dealerId,
    });
    
    // Set HTTP-only cookies
    setCookie(event, 'auth_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60, // 1 hour
      path: '/',
    });
    
    setCookie(event, 'refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });
    
    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        department: user.department,
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
    console.error('[Auth Login] Error:', error?.message || error);
    console.error('[Auth Login] Stack:', error?.stack);
    
    if (error.statusCode) {
      throw error;
    }
    
    throw createError({
      statusCode: 500,
      message: process.env.NODE_ENV === 'production' 
        ? 'Login failed. Please try again.' 
        : `Login failed: ${error?.message || 'Unknown error'}`,
    });
  }
});










