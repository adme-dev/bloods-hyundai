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

  if (all) {
    // Mark everything read up to now.
    await db
      .update(users)
      .set({ lastSeenNotificationsAt: now, updatedAt: now })
      .where(eq(users.id, user.userId));
  } else {
    // Mark only the specified notifications read (merge into the per-item set),
    // leaving the rest unread.
    const current = await db.query.users.findFirst({
      where: eq(users.id, user.userId),
      columns: { readNotificationIds: true },
    });
    const existing = Array.isArray(current?.readNotificationIds)
      ? (current!.readNotificationIds as string[])
      : [];
    const merged = Array.from(new Set([...existing, ...(ids ?? [])]));
    await db
      .update(users)
      .set({ readNotificationIds: merged, updatedAt: now })
      .where(eq(users.id, user.userId));
  }

  return {
    success: true,
    markedAt: now.toISOString(),
  };
});
