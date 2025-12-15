import { db, withTenantContext } from '../../../../utils/db';
import { enquiryNotes, enquiryActivityLog } from '../../../../database/schema';

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
  const body = await readBody(event);
  const { content } = body;

  if (!content || !content.trim()) {
    throw createError({
      statusCode: 400,
      message: 'Note content is required',
    });
  }

  try {
    let newNote;
    
    await withTenantContext(dealerId, async () => {
      // Create note
      const [note] = await db.insert(enquiryNotes).values({
        enquiryId,
        userId: user.id,
        content: content.trim(),
      }).returning();

      newNote = note;

      // Log activity
      await db.insert(enquiryActivityLog).values({
        enquiryId,
        userId: user.id,
        action: 'Added a note',
      });
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






