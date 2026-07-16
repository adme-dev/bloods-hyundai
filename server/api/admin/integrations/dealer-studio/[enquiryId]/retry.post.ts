import {
  processDueDealerStudioExports,
  resetDealerStudioDeliveryForRetry,
} from '../../../../../utils/dealerStudio/delivery';

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  if (!user?.dealerId) throw createError({ statusCode: 401, message: 'Unauthorized' });
  if (!['admin', 'dealer_admin', 'manager'].includes(user.role)) {
    throw createError({ statusCode: 403, message: 'Insufficient permissions' });
  }
  const enquiryId = getRouterParam(event, 'enquiryId');
  if (!enquiryId) throw createError({ statusCode: 422, message: 'Enquiry ID is required' });

  const reset = await resetDealerStudioDeliveryForRetry(user.dealerId, enquiryId);
  if (!reset) throw createError({ statusCode: 404, message: 'Retryable Dealer Studio delivery not found' });
  const [result] = await processDueDealerStudioExports({ dealerId: user.dealerId, enquiryId, limit: 1 });
  return { success: result?.status === 'synced', result };
});

