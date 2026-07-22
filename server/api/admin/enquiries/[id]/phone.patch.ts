import { and, eq } from 'drizzle-orm';
import { enquiries } from '../../../../database/schema';
import { db } from '../../../../utils/db';
import { logEnquiryActivity } from '../../../../utils/enquiryActivity';
import { validateRequiredCustomerPhone } from '~~/shared/utils/customerPhone';

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  const dealerId = event.context.dealerId;
  const enquiryId = getRouterParam(event, 'id');

  if (!user || !dealerId) throw createError({ statusCode: 401, message: 'Unauthorized' });
  if (!enquiryId) throw createError({ statusCode: 400, message: 'Enquiry ID is required' });

  const body = await readBody<{ phone?: unknown }>(event);
  const phoneValidation = validateRequiredCustomerPhone(body?.phone);
  if (!phoneValidation.ok) {
    throw createError({ statusCode: 400, message: phoneValidation.error });
  }

  const current = await db.query.enquiries.findFirst({
    where: and(eq(enquiries.id, enquiryId), eq(enquiries.dealerId, dealerId)),
    columns: { id: true, phone: true },
  });
  if (!current) throw createError({ statusCode: 404, message: 'Enquiry not found' });

  if (current.phone !== phoneValidation.phone) {
    await db.transaction(async (tx) => {
      await tx.update(enquiries).set({
        phone: phoneValidation.phone,
        updatedAt: new Date(),
      }).where(and(eq(enquiries.id, enquiryId), eq(enquiries.dealerId, dealerId)));

      await logEnquiryActivity({
        dealerId,
        enquiryId,
        userId: user.userId,
        action: 'Customer phone updated',
        entityType: 'contact',
        oldValue: { hadPhone: Boolean(current.phone) },
        newValue: { hasPhone: true, reason: 'Dealer Studio delivery recovery' },
      }, tx);
    });
  }

  return { success: true, phone: phoneValidation.phone };
});
