import { eq, and } from 'drizzle-orm';
import { db, withTenantContext } from '../../../../utils/db';
import { users } from '../../../../database/schema';

// Valid roles for dealership staff
const VALID_ROLES = [
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
] as const;

// Valid departments
const VALID_DEPARTMENTS = [
  'executive',
  'sales',
  'finance',
  'service',
  'parts',
  'admin',
] as const;

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  const dealerId = event.context.dealerId;

  if (!user || !dealerId) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized',
    });
  }

  // Only admins can edit staff
  if (user.role !== 'dealer_admin') {
    throw createError({
      statusCode: 403,
      message: 'Only admins can edit staff members',
    });
  }

  const staffId = getRouterParam(event, 'id');
  if (!staffId) {
    throw createError({
      statusCode: 400,
      message: 'Staff ID is required',
    });
  }

  const body = await readBody(event);
  const { firstName, lastName, email, role, department, phone } = body;

  // Build update object with only provided fields
  const updateData: Record<string, any> = {
    updatedAt: new Date(),
  };

  if (firstName !== undefined) {
    if (!firstName || firstName.trim().length === 0) {
      throw createError({
        statusCode: 400,
        message: 'First name cannot be empty',
      });
    }
    updateData.firstName = firstName.trim();
  }

  if (lastName !== undefined) {
    if (!lastName || lastName.trim().length === 0) {
      throw createError({
        statusCode: 400,
        message: 'Last name cannot be empty',
      });
    }
    updateData.lastName = lastName.trim();
  }

  if (email !== undefined) {
    if (!email || !email.includes('@')) {
      throw createError({
        statusCode: 400,
        message: 'Valid email is required',
      });
    }
    updateData.email = email.trim().toLowerCase();
  }

  if (role !== undefined) {
    if (!VALID_ROLES.includes(role)) {
      throw createError({
        statusCode: 400,
        message: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}`,
      });
    }
    updateData.role = role;
  }

  if (department !== undefined) {
    if (department && !VALID_DEPARTMENTS.includes(department)) {
      throw createError({
        statusCode: 400,
        message: `Invalid department. Must be one of: ${VALID_DEPARTMENTS.join(', ')}`,
      });
    }
    updateData.department = department || null;
  }

  // Phone is stored in a different way - we'll need to check schema
  // For now, skip phone as it's not in the users table

  try {
    let updatedUser;
    await withTenantContext(dealerId, async () => {
      // Check if email is being changed and if it already exists
      if (updateData.email) {
        const existing = await db
          .select()
          .from(users)
          .where(
            and(
              eq(users.email, updateData.email),
              eq(users.dealerId, dealerId)
            )
          )
          .limit(1);

        if (existing.length > 0 && existing[0].id !== staffId) {
          throw createError({
            statusCode: 400,
            message: 'Email already in use by another staff member',
          });
        }
      }

      // Update the user
      const [updated] = await db
        .update(users)
        .set(updateData)
        .where(and(eq(users.id, staffId), eq(users.dealerId, dealerId)))
        .returning();

      if (!updated) {
        throw createError({
          statusCode: 404,
          message: 'Staff member not found',
        });
      }

      updatedUser = updated;
    });

    return {
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        role: updatedUser.role,
        department: updatedUser.department,
        isActive: updatedUser.isActive,
      },
    };
  } catch (error: any) {
    console.error('Error updating staff member:', error);
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      message: 'Failed to update staff member',
    });
  }
});
