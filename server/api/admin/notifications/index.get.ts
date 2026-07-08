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

  // Get user's last seen timestamp
  const userRecord = await db.query.users.findFirst({
    where: eq(users.id, user.userId),
    columns: {
      lastSeenNotificationsAt: true,
    },
  });

  const lastSeenAt = userRecord?.lastSeenNotificationsAt || new Date(0);
  const now = new Date();

  // Calculate cutoff date (7 days ago for notifications)
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 7);

  const notifications: Notification[] = [];

  // 1. Get new enquiries (created in last 7 days)
  const newEnquiries = await db.query.enquiries.findMany({
    where: and(
      eq(enquiries.dealerId, user.dealerId),
      gt(enquiries.createdAt, cutoffDate),
      isNull(enquiries.archivedAt)
    ),
    orderBy: [desc(enquiries.createdAt)],
    limit: limit,
  });

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
      read: new Date(enquiry.createdAt) <= lastSeenAt,
      createdAt: enquiry.createdAt.toISOString(),
      link: `/admin/enquiries/${enquiry.id}`,
      metadata: { enquiryId: enquiry.id },
    });
  });

  // 2. Get enquiries assigned to this user (notify about assignments)
  const assignedEnquiries = await db.query.enquiries.findMany({
    where: and(
      eq(enquiries.dealerId, user.dealerId),
      eq(enquiries.assignedTo, user.userId),
      gt(enquiries.updatedAt, cutoffDate),
      isNull(enquiries.archivedAt)
    ),
    orderBy: [desc(enquiries.updatedAt)],
    limit: 10,
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
        read: new Date(enquiry.updatedAt) <= lastSeenAt,
        createdAt: enquiry.updatedAt.toISOString(),
        link: `/admin/enquiries/${enquiry.id}`,
        metadata: { enquiryId: enquiry.id },
      });
    }
  });

  // 3. Get snoozed enquiries that have expired
  const expiredSnoozedEnquiries = await db.query.enquiries.findMany({
    where: and(
      eq(enquiries.dealerId, user.dealerId),
      lte(enquiries.snoozedUntil, now),
      gt(enquiries.snoozedUntil, cutoffDate),
      isNull(enquiries.archivedAt)
    ),
    orderBy: [desc(enquiries.snoozedUntil)],
    limit: 10,
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
        read: new Date(enquiry.snoozedUntil) <= lastSeenAt,
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
