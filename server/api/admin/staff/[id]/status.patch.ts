import { eq } from 'drizzle-orm';
import { db, withTenantContext } from '../../../../utils/db';
import { users } from '../../../../database/schema';

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  const dealerId = event.context.dealerId;
  
  if (!user || !dealerId) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized',
    });
  }

  // Only admins can change staff status
  if (user.role !== 'dealer_admin') {
    throw createError({
      statusCode: 403,
      message: 'Only admins can change staff status',
    });
  }

  const staffId = getRouterParam(event, 'id');
  const body = await readBody(event);
  const { isActive } = body;

  if (!staffId) {
    throw createError({
      statusCode: 400,
      message: 'Staff member ID is required',
    });
  }

  if (typeof isActive !== 'boolean') {
    throw createError({
      statusCode: 400,
      message: 'Invalid status',
    });
  }

  try {
    await withTenantContext(dealerId, async () => {
      await db
        .update(users)
        .set({ isActive, updatedAt: new Date() })
        .where(eq(users.id, staffId));
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating staff status:', error);
    throw createError({
      statusCode: 500,
      message: 'Failed to update staff status',
    });
  }
});









