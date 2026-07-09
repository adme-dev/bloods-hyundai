import { eq } from 'drizzle-orm';
import { db, withTenantContext } from '../../../utils/db';
import { users } from '../../../database/schema';
import { verifyPassword, hashPassword } from '../../../utils/password';

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  const dealerId = event.context.dealerId;
  
  if (!user || !dealerId) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized',
    });
  }

  const body = await readBody(event);
  const { currentPassword, newPassword } = body;

  if (!currentPassword || !newPassword) {
    throw createError({
      statusCode: 400,
      message: 'Current and new password are required',
    });
  }

  if (newPassword.length < 8) {
    throw createError({
      statusCode: 400,
      message: 'New password must be at least 8 characters',
    });
  }

  try {
    // Get current user with password hash
    const [currentUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    if (!currentUser) {
      throw createError({
        statusCode: 404,
        message: 'User not found',
      });
    }

    // Verify current password
    if (!currentUser.passwordHash) {
      throw createError({
        statusCode: 401,
        message: 'Current password is incorrect',
      });
    }

    const isValid = await verifyPassword(currentPassword, currentUser.passwordHash);
    if (!isValid) {
      throw createError({
        statusCode: 401,
        message: 'Current password is incorrect',
      });
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // Update password
    await withTenantContext(dealerId, async () => {
      await db
        .update(users)
        .set({ 
          passwordHash: newPasswordHash,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error changing password:', error);
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      message: 'Failed to change password',
    });
  }
});









