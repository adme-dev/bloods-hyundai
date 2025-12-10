import { db } from '../../../utils/db';
import { enquiries } from '../../../database/schema';
import { eq, desc, and, gt, isNull } from 'drizzle-orm';

/**
 * Get latest enquiries since a given timestamp
 * Used for real-time polling updates
 */
export default defineEventHandler(async (event) => {
  const user = event.context.user;
  if (!user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' });
  }

  const query = getQuery(event);
  const since = query.since ? new Date(query.since as string) : new Date(Date.now() - 60000); // Default: last minute

  // Get new enquiries since the given timestamp
  const newEnquiries = await db.query.enquiries.findMany({
    where: and(
      eq(enquiries.dealerId, user.dealerId),
      gt(enquiries.createdAt, since),
      isNull(enquiries.archivedAt)
    ),
    with: {
      assignedUser: {
        columns: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: [desc(enquiries.createdAt)],
    limit: 20,
  });

  // Get updated enquiries (where updatedAt > since but createdAt <= since)
  const updatedEnquiries = await db.query.enquiries.findMany({
    where: and(
      eq(enquiries.dealerId, user.dealerId),
      gt(enquiries.updatedAt, since),
      isNull(enquiries.archivedAt)
    ),
    with: {
      assignedUser: {
        columns: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: [desc(enquiries.updatedAt)],
    limit: 20,
  });

  return {
    new: newEnquiries,
    updated: updatedEnquiries,
    timestamp: new Date().toISOString(),
  };
});

