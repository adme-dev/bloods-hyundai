import { and, eq } from 'drizzle-orm';
import { db } from '../../../../utils/db';
import { enquiries, enquiryNotes } from '../../../../database/schema';
import { logEnquiryActivity } from '../../../../utils/enquiryActivity';

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  const dealerId = event.context.dealerId;

  if (!user || !dealerId) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized',
    });
  }

  const enquiryId = getRouterParam(event, 'id');
  if (!enquiryId) {
    throw createError({ statusCode: 400, message: 'Enquiry ID is required' });
  }

  const body = await readBody(event);
  const { content } = body;

  if (!content || !content.trim()) {
    throw createError({
      statusCode: 400,
      message: 'Note content is required',
    });
  }

  // Verify the enquiry belongs to the caller's dealer (tenancy / IDOR guard).
  const owning = await db.query.enquiries.findFirst({
    where: and(eq(enquiries.id, enquiryId), eq(enquiries.dealerId, dealerId)),
    columns: { id: true },
  });
  if (!owning) {
    throw createError({ statusCode: 404, message: 'Enquiry not found' });
  }

  try {
    let newNote: typeof enquiryNotes.$inferSelect | undefined;

    await db.transaction(async (tx) => {
      const [note] = await tx
        .insert(enquiryNotes)
        .values({
          enquiryId,
          userId: user.userId,
          content: content.trim(),
        })
        .returning();

      newNote = note;

      await logEnquiryActivity(
        {
          dealerId,
          enquiryId,
          userId: user.userId,
          action: 'Added a note',
        },
        tx,
      );
    });

    return { success: true, note: newNote };
  } catch (error) {
    console.error('Error adding note:', error);
    throw createError({
      statusCode: 500,
      message: 'Failed to add note',
    });
  }
});
