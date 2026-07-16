import { fetchDealerStudioApiKeyDetails } from '../../../../utils/dealerStudio/client';
import { resolveDealerStudioApiKey } from '../../../../utils/dealerStudio/credential';

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  if (!user?.dealerId) throw createError({ statusCode: 401, message: 'Unauthorized' });
  if (!['admin', 'dealer_admin'].includes(user.role)) {
    throw createError({ statusCode: 403, message: 'Insufficient permissions' });
  }

  try {
    const apiKey = await resolveDealerStudioApiKey(user.dealerId);
    const details = await fetchDealerStudioApiKeyDetails(apiKey);
    if (!details.permissions.includes('create:lead')) {
      throw new Error('Insufficient permissions: Dealer Studio key requires create:lead');
    }
    return {
      success: true,
      permissions: details.permissions,
      dealerships: details.dealerships,
    };
  } catch (error: any) {
    throw createError({ statusCode: 422, message: error?.message || 'Dealer Studio connection failed' });
  }
});
