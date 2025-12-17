/**
 * Validate Invitation Token Endpoint
 * Checks if an invitation token is valid before showing the activation form
 */

import { eq, and, gt } from 'drizzle-orm';
import { db } from '../../utils/db';
import { users, dealers } from '../../database/schema';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const token = query.token as string;

  if (!token) {
    throw createError({
      statusCode: 400,
      message: 'Token is required',
    });
  }

  try {
    // Find user with valid invitation token
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        status: users.status,
        dealerId: users.dealerId,
        invitationTokenExpiry: users.invitationTokenExpiry,
      })
      .from(users)
      .where(eq(users.invitationToken, token))
      .limit(1);

    if (!user) {
      return {
        valid: false,
        error: 'invalid',
        message: 'This activation link is invalid.',
      };
    }

    // Check if token is expired
    if (user.invitationTokenExpiry && new Date(user.invitationTokenExpiry) < new Date()) {
      return {
        valid: false,
        error: 'expired',
        message: 'This activation link has expired. Please contact your administrator for a new invitation.',
      };
    }

    // Check if already activated
    if (user.status === 'active') {
      return {
        valid: false,
        error: 'already_activated',
        message: 'This account has already been activated. Please log in.',
      };
    }

    // Get dealer name
    const [dealer] = await db
      .select({ name: dealers.name })
      .from(dealers)
      .where(eq(dealers.id, user.dealerId))
      .limit(1);

    return {
      valid: true,
      user: {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      dealerName: dealer?.name || 'Your Dealership',
    };
  } catch (error: any) {
    console.error('Error validating token:', error);
    throw createError({
      statusCode: 500,
      message: 'Failed to validate token',
    });
  }
});





