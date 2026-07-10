import { db } from '../../../utils/db';
import { enquiries, users } from '../../../database/schema';
import { eq, desc, and, gt, isNull, or, lte } from 'drizzle-orm';

interface Notification {
  id: string;
  type: 'enquiry' | 'assignment' | 'snooze_expired' | 'system';
  subType?: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  link?: string;
  metadata?: Record<string, any>;
}

/**
 * Get notifications for the current user
 * Combines enquiries, assignments, and snoozed items into unified notifications
 */
export default defineEventHandler(async (event) => {
  const user = event.context.user;
  if (!user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' });
  }

  const query = getQuery(event);
  const limit = Math.min(Number(query.limit) || 20, 50);

  const now = new Date();

  // Calculate cutoff date (7 days ago for notifications)
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 7);

  const notifications: Notification[] = [];

  const userRecord = await loadNotificationState(user.userId);

  const [newEnquiries, assignedEnquiries, expiredSnoozedEnquiries] = await Promise.all([
    // 1. Get new enquiries (created in last 7 days).
    db.query.enquiries.findMany({
      where: and(
        eq(enquiries.dealerId, user.dealerId),
        gt(enquiries.createdAt, cutoffDate),
        isNull(enquiries.archivedAt)
      ),
      orderBy: [desc(enquiries.createdAt)],
      limit: limit,
    }),
    // 2. Get enquiries assigned to this user (notify about assignments).
    db.query.enquiries.findMany({
      where: and(
        eq(enquiries.dealerId, user.dealerId),
        eq(enquiries.assignedTo, user.userId),
        gt(enquiries.updatedAt, cutoffDate),
        isNull(enquiries.archivedAt)
      ),
      orderBy: [desc(enquiries.updatedAt)],
      limit: 10,
    }),
    // 3. Get snoozed enquiries that have expired.
    db.query.enquiries.findMany({
      where: and(
        eq(enquiries.dealerId, user.dealerId),
        lte(enquiries.snoozedUntil, now),
        gt(enquiries.snoozedUntil, cutoffDate),
        isNull(enquiries.archivedAt)
      ),
      orderBy: [desc(enquiries.snoozedUntil)],
      limit: 10,
    }),
  ]);

  const lastSeenAt = userRecord?.lastSeenNotificationsAt || new Date(0);
  const readSet = new Set(
    Array.isArray(userRecord?.readNotificationIds) ? (userRecord!.readNotificationIds as string[]) : [],
  );
  // A notification is read if the whole feed was marked read past its timestamp,
  // or it was individually dismissed. The latter survives later edits, so an
  // assignment no longer re-appears as unread every time the enquiry changes.
  const isRead = (id: string, ts: Date) => readSet.has(id) || new Date(ts) <= lastSeenAt;

  const enquiryTypeTitles: Record<string, string> = {
    contact: 'New contact enquiry',
    vehicle: 'New vehicle enquiry',
    finance: 'New finance enquiry',
    service: 'New service booking',
    parts: 'New parts enquiry',
    test_drive: 'New test drive request',
  };

  newEnquiries.forEach(enquiry => {
    notifications.push({
      id: enquiry.id,
      type: 'enquiry',
      subType: enquiry.type,
      title: enquiryTypeTitles[enquiry.type] || 'New enquiry',
      message: `${enquiry.firstName} ${enquiry.lastName} - ${enquiry.email}`,
      read: isRead(enquiry.id, enquiry.createdAt),
      createdAt: enquiry.createdAt.toISOString(),
      link: `/admin/enquiries/${enquiry.id}`,
      metadata: { enquiryId: enquiry.id },
    });
  });

  assignedEnquiries.forEach(enquiry => {
    // Only add if it's not already in the list and was assigned (updatedAt > createdAt)
    const alreadyAdded = notifications.some(n => n.id === enquiry.id);
    const wasAssigned = enquiry.updatedAt > enquiry.createdAt;

    if (!alreadyAdded && wasAssigned) {
      notifications.push({
        id: `assign-${enquiry.id}`,
        type: 'assignment',
        subType: enquiry.type,
        title: 'Enquiry assigned to you',
        message: `${enquiry.firstName} ${enquiry.lastName} - ${enquiry.type} enquiry`,
        read: isRead(`assign-${enquiry.id}`, enquiry.updatedAt),
        createdAt: enquiry.updatedAt.toISOString(),
        link: `/admin/enquiries/${enquiry.id}`,
        metadata: { enquiryId: enquiry.id },
      });
    }
  });

  expiredSnoozedEnquiries.forEach(enquiry => {
    const alreadyAdded = notifications.some(n =>
      n.id === enquiry.id || n.id === `assign-${enquiry.id}`
    );

    if (!alreadyAdded && enquiry.snoozedUntil) {
      notifications.push({
        id: `snooze-${enquiry.id}`,
        type: 'snooze_expired',
        subType: enquiry.type,
        title: 'Snooze expired',
        message: `${enquiry.firstName} ${enquiry.lastName} - Follow up needed`,
        read: isRead(`snooze-${enquiry.id}`, enquiry.snoozedUntil),
        createdAt: enquiry.snoozedUntil.toISOString(),
        link: `/admin/enquiries/${enquiry.id}`,
        metadata: { enquiryId: enquiry.id },
      });
    }
  });

  // Sort all notifications by createdAt descending
  notifications.sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return {
    notifications: notifications.slice(0, limit),
    lastSeenAt: lastSeenAt.toISOString(),
    totalUnread: notifications.filter(n => !n.read).length,
  };
});

async function loadNotificationState(userId: string): Promise<{
  lastSeenNotificationsAt: Date | null;
  readNotificationIds?: unknown;
} | null> {
  try {
    return await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        lastSeenNotificationsAt: true,
        readNotificationIds: true,
      },
    }) as { lastSeenNotificationsAt: Date | null; readNotificationIds?: unknown } | null;
  } catch (error) {
    console.warn('[Notifications] readNotificationIds fallback engaged:', error);
    return await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        lastSeenNotificationsAt: true,
      },
    }) as { lastSeenNotificationsAt: Date | null; readNotificationIds?: unknown } | null;
  }
}
