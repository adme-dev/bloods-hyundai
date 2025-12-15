/**
 * Account Activation Endpoint
 * Allows invited staff members to set their password and activate their account
 */

import { eq, and, gt } from 'drizzle-orm';
import { db } from '../../utils/db';
import { users, dealers } from '../../database/schema';
import { hashPassword } from '../../utils/password';
import { sendWelcomeEmail } from '../../utils/staffEmail';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { token, password, confirmPassword } = body;

  // Validate input
  if (!token) {
    throw createError({
      statusCode: 400,
      message: 'Activation token is required',
    });
  }

  if (!password || password.length < 8) {
    throw createError({
      statusCode: 400,
      message: 'Password must be at least 8 characters',
    });
  }

  if (password !== confirmPassword) {
    throw createError({
      statusCode: 400,
      message: 'Passwords do not match',
    });
  }

  try {
    // Find user with valid invitation token
    const [user] = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.invitationToken, token),
          gt(users.invitationTokenExpiry, new Date())
        )
      )
      .limit(1);

    if (!user) {
      throw createError({
        statusCode: 400,
        message: 'Invalid or expired activation link. Please request a new invitation.',
      });
    }

    // Check if already activated
    if (user.status === 'active' && user.passwordHash) {
      throw createError({
        statusCode: 400,
        message: 'This account has already been activated. Please log in.',
      });
    }

    // Hash the new password
    const passwordHash = await hashPassword(password);

    // Update user - activate account
    await db
      .update(users)
      .set({
        passwordHash,
        status: 'active',
        emailVerified: true,
        activatedAt: new Date(),
        invitationToken: null, // Clear the token
        invitationTokenExpiry: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    // Get dealer info for welcome email
    const [dealer] = await db
      .select()
      .from(dealers)
      .where(eq(dealers.id, user.dealerId))
      .limit(1);

    // Send welcome email
    if (dealer) {
      const config = useRuntimeConfig();
      const baseUrl = config.public?.siteUrl || process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000';
      const loginUrl = `${baseUrl}/admin/login`;

      await sendWelcomeEmail(
        user.email,
        user.firstName,
        dealer.name,
        loginUrl,
        user.dealerId
      );
    }

    return {
      success: true,
      message: 'Your account has been activated. You can now log in.',
      user: {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  } catch (error: any) {
    console.error('Error activating account:', error);
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      message: 'Failed to activate account. Please try again.',
    });
  }
});




