/**
 * Resend Staff Invitation Endpoint
 * Generates a new invitation token and sends a new invitation email
 */

import { eq, and } from 'drizzle-orm';
import { db } from '../../../../utils/db';
import { users, dealers } from '../../../../database/schema';
import { 
  generateInvitationToken, 
  getInvitationTokenExpiry, 
  sendStaffInvitationEmail 
} from '../../../../utils/staffEmail';

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  const dealerId = event.context.dealerId;
  
  if (!user || !dealerId) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized',
    });
  }

  // Only admins can resend invitations
  if (user.role !== 'dealer_admin') {
    throw createError({
      statusCode: 403,
      message: 'Only admins can resend invitations',
    });
  }

  const staffId = getRouterParam(event, 'id');

  if (!staffId) {
    throw createError({
      statusCode: 400,
      message: 'Staff ID is required',
    });
  }

  try {
    // Find the staff member
    const [staffMember] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, staffId), eq(users.dealerId, dealerId)))
      .limit(1);

    if (!staffMember) {
      throw createError({
        statusCode: 404,
        message: 'Staff member not found',
      });
    }

    // Check if already activated
    if (staffMember.status === 'active' && staffMember.passwordHash) {
      throw createError({
        statusCode: 400,
        message: 'This staff member has already activated their account',
      });
    }

    // Get dealer info
    const [dealer] = await db
      .select()
      .from(dealers)
      .where(eq(dealers.id, dealerId))
      .limit(1);

    if (!dealer) {
      throw createError({
        statusCode: 404,
        message: 'Dealer not found',
      });
    }

    // Generate new invitation token
    const invitationToken = generateInvitationToken();
    const invitationTokenExpiry = getInvitationTokenExpiry();

    // Update user with new token
    await db
      .update(users)
      .set({
        invitationToken,
        invitationTokenExpiry,
        invitedAt: new Date(),
        invitedBy: user.id,
        status: 'invited',
        updatedAt: new Date(),
      })
      .where(eq(users.id, staffId));

    // Build activation link
    const config = useRuntimeConfig();
    const baseUrl = config.public?.siteUrl || process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const activationLink = `${baseUrl}/admin/activate?token=${invitationToken}`;

    // Send invitation email
    const emailSent = await sendStaffInvitationEmail({
      recipientEmail: staffMember.email,
      recipientName: staffMember.firstName,
      inviterName: `${user.firstName} ${user.lastName}`,
      dealerName: dealer.name,
      role: staffMember.role,
      activationLink,
      expiresIn: '7 days',
    }, dealerId);

    return {
      success: true,
      emailSent,
      message: emailSent 
        ? `Invitation resent to ${staffMember.email}` 
        : `New invitation created. Email could not be sent - please share the activation link manually.`,
      activationLink: emailSent ? undefined : activationLink, // Only return link if email failed
    };
  } catch (error: any) {
    console.error('Error resending invitation:', error);
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      message: 'Failed to resend invitation',
    });
  }
});





