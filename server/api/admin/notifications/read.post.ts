import { db } from '../../../utils/db';
import { users } from '../../../database/schema';
import { eq } from 'drizzle-orm';

/**
 * Mark notifications as read
 * Updates the user's lastSeenNotificationsAt timestamp
 */
export default defineEventHandler(async (event) => {
  const user = event.context.user;
  if (!user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' });
  }

  const body = await readBody(event);
  const { all, ids } = body as { all?: boolean; ids?: string[] };

  if (!all && (!ids || ids.length === 0)) {
    throw createError({
      statusCode: 400,
      message: 'Either "all" or "ids" must be provided',
    });
  }

  const now = new Date();

  // Update user's lastSeenNotificationsAt
  // For individual IDs, we still update the timestamp since our notification
  // read status is determined by comparing createdAt with lastSeenNotificationsAt
  await db
    .update(users)
    .set({
      lastSeenNotificationsAt: now,
      updatedAt: now,
    })
    .where(eq(users.id, user.id));

  return {
    success: true,
    markedAt: now.toISOString(),
  };
});
