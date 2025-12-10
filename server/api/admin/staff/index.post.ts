import { eq } from 'drizzle-orm';
import { db, withTenantContext } from '../../../utils/db';
import { users } from '../../../database/schema';
import { hashPassword } from '../../../utils/password';

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
  const { email, firstName, lastName, role, password } = body;

  if (!email || !firstName || !lastName || !role || !password) {
    throw createError({
      statusCode: 400,
      message: 'All fields are required',
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
    // Check if email already exists
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing.length > 0) {
      throw createError({
        statusCode: 400,
        message: 'Email already exists',
      });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    let newUser;
    await withTenantContext(dealerId, async () => {
      const [created] = await db.insert(users).values({
        dealerId,
        email,
        passwordHash,
        firstName,
        lastName,
        role,
        isActive: true,
      }).returning();

      newUser = created;
    });

    return { 
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role,
      },
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


