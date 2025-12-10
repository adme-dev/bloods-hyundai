import { db } from '../../../utils/db';
import { dealers } from '../../../database/schema';
import { eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  if (!user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' });
  }

  // Only admins can update form settings
  if (user.role !== 'dealer_admin') {
    throw createError({ statusCode: 403, message: 'Only admins can update form settings' });
  }

  const slug = getRouterParam(event, 'slug');
  if (!slug) {
    throw createError({ statusCode: 400, message: 'Form slug is required' });
  }

  const body = await readBody(event);
  const { settings, notifications, confirmation } = body;


  // Get current dealer settings
  const [dealer] = await db
    .select()
    .from(dealers)
    .where(eq(dealers.id, user.dealerId));

  if (!dealer) {
    throw createError({ statusCode: 404, message: 'Dealer not found' });
  }

  // Update form settings in dealer's settings JSON
  const currentSettings = (dealer.settings as any) || {};
  const forms = currentSettings.forms || {};
  
  forms[slug] = {
    ...forms[slug],
    ...settings,
    notifications,
    confirmation,
    updatedAt: new Date().toISOString(),
  };

  await db
    .update(dealers)
    .set({
      settings: { ...currentSettings, forms },
    })
    .where(eq(dealers.id, user.dealerId));

  return {
    success: true,
    message: 'Form settings updated successfully',
  };
});

