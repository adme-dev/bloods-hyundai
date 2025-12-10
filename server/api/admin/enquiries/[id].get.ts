import { db } from '../../../utils/db';
import { enquiries } from '../../../database/schema';
import { eq, and } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  const dealerId = event.context.dealerId;
  
  if (!id) {
    throw createError({ statusCode: 400, message: 'Enquiry ID is required' });
  }
  
  const enquiry = await db.query.enquiries.findFirst({
    where: and(
      eq(enquiries.id, id),
      eq(enquiries.dealerId, dealerId)
    ),
    with: {
      assignedUser: true,
      notes: {
        with: {
          user: true,
        },
        orderBy: (notes, { desc }) => [desc(notes.createdAt)],
      },
      activityLogs: {
        with: {
          user: true,
        },
        orderBy: (logs, { desc }) => [desc(logs.createdAt)],
      },
    },
  });
  
  if (!enquiry) {
    throw createError({ statusCode: 404, message: 'Enquiry not found' });
  }
  
  const { notes = [], activityLogs = [], ...enquiryData } = enquiry;
  
  return {
    enquiry: enquiryData,
    notes,
    activityLog: activityLogs,
  };
});

