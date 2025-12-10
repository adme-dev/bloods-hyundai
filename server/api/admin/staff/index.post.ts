import { eq, and } from 'drizzle-orm';
import { db, withTenantContext } from '../../../utils/db';
import { users, dealers } from '../../../database/schema';
import { 
  generateInvitationToken, 
  getInvitationTokenExpiry, 
  sendStaffInvitationEmail 
} from '../../../utils/staffEmail';

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  const dealerId = event.context.dealerId;
  
  if (!user || !dealerId) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized',
    });
  }

  // Only admins can add staff
  if (user.role !== 'dealer_admin') {
    throw createError({
      statusCode: 403,
      message: 'Only admins can add staff members',
    });
  }

  const body = await readBody(event);
  const { email, firstName, lastName, role, department } = body;

  // Password is no longer required - staff will set it via invitation
  if (!email || !firstName || !lastName || !role) {
    throw createError({
      statusCode: 400,
      message: 'Email, first name, last name, and role are required',
    });
  }

  const validRoles = [
    'dealer_admin',
    'general_manager',
    'sales_manager',
    'sales',
    'finance_manager',
    'service_manager',
    'service_advisor',
    'technician',
    'parts_manager',
    'parts',
  ];

  if (!validRoles.includes(role)) {
    throw createError({
      statusCode: 400,
      message: `Invalid role. Must be one of: ${validRoles.join(', ')}`,
    });
  }

  try {
    // Check if email already exists for this dealer
    const existing = await db
      .select()
      .from(users)
      .where(and(eq(users.email, email), eq(users.dealerId, dealerId)))
      .limit(1);

    if (existing.length > 0) {
      throw createError({
        statusCode: 400,
        message: 'A staff member with this email already exists',
      });
    }

    // Get dealer info for the email
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

    // Generate invitation token
    const invitationToken = generateInvitationToken();
    const invitationTokenExpiry = getInvitationTokenExpiry();

    // Create user with 'invited' status (no password yet)
    let newUser: any;
    await withTenantContext(dealerId, async () => {
      const [created] = await db.insert(users).values({
        dealerId,
        email: email.toLowerCase().trim(),
        firstName,
        lastName,
        role,
        department: department || null,
        status: 'invited',
        isActive: true,
        emailVerified: false,
        invitationToken,
        invitationTokenExpiry,
        invitedAt: new Date(),
        invitedBy: user.id,
      }).returning();

      newUser = created;
    });

    // Build activation link
    const config = useRuntimeConfig();
    const baseUrl = config.public?.siteUrl || process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const activationLink = `${baseUrl}/admin/activate?token=${invitationToken}`;

    // Send invitation email
    const emailSent = await sendStaffInvitationEmail({
      recipientEmail: email,
      recipientName: firstName,
      inviterName: `${user.firstName} ${user.lastName}`,
      dealerName: dealer.name,
      role,
      activationLink,
      expiresIn: '7 days',
    }, dealerId);

    return { 
      success: true,
      emailSent,
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role,
        status: newUser.status,
      },
      message: emailSent 
        ? `Invitation sent to ${email}` 
        : `Staff member created. Invitation email could not be sent - please share the activation link manually.`,
    };
  } catch (error: any) {
    console.error('Error creating staff member:', error);
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      message: 'Failed to create staff member',
    });
  }
});


