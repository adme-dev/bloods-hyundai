import { eq } from 'drizzle-orm';
import { dealers } from '../../../../database/schema';
import { db } from '../../../../utils/db';
import {
  createDealerStudioLead,
  fetchDealerStudioApiKeyDetails,
} from '../../../../utils/dealerStudio/client';
import { resolveDealerStudioApiKey } from '../../../../utils/dealerStudio/credential';
import { buildDealerStudioSandboxLead } from '../../../../utils/dealerStudio/sandbox';
import {
  readDealerStudioSettings,
  validateDealerStudioSandboxSettings,
  writeDealerStudioSettings,
} from '../../../../utils/dealerStudio/settings';
import { checkRateLimit } from '../../../../utils/intakeAbuse';

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  if (!user?.dealerId) throw createError({ statusCode: 401, message: 'Unauthorized' });
  if (!['admin', 'dealer_admin'].includes(user.role)) {
    throw createError({ statusCode: 403, message: 'Insufficient permissions' });
  }
  if (!checkRateLimit(`dealer-studio-sandbox:${user.dealerId}:${user.id}`, Date.now())) {
    throw createError({ statusCode: 429, message: 'Too many sandbox leads. Wait before sending another test.' });
  }

  const [dealer] = await db.select({ settings: dealers.settings })
    .from(dealers)
    .where(eq(dealers.id, user.dealerId))
    .limit(1);
  if (!dealer) throw createError({ statusCode: 404, message: 'Dealer not found' });

  const settings = readDealerStudioSettings(dealer.settings);
  if (!settings.sandboxMode) {
    throw createError({ statusCode: 409, message: 'Save and activate sandbox mode before sending a test lead' });
  }
  const settingsErrors = validateDealerStudioSandboxSettings(settings);
  if (settingsErrors.length) {
    throw createError({ statusCode: 409, message: settingsErrors.join('; ') });
  }
  if (settings.dealershipId && settings.dealershipId === settings.sandboxDealershipId) {
    throw createError({ statusCode: 409, message: 'The production dealership cannot be used as the sandbox destination' });
  }

  let apiKey: string;
  let details;
  try {
    apiKey = await resolveDealerStudioApiKey(user.dealerId);
    details = await fetchDealerStudioApiKeyDetails(apiKey);
  } catch (error: any) {
    throw createError({ statusCode: 422, message: error?.message || 'Dealer Studio connection failed' });
  }
  if (!details.permissions.includes('create:lead')) {
    throw createError({ statusCode: 422, message: 'Insufficient permissions: Dealer Studio key requires create:lead' });
  }
  const dealership = details.dealerships.find(item => item.id === settings.sandboxDealershipId);
  const location = dealership?.locations.find(item => item.id === settings.sandboxLocationId);
  if (!dealership || !location) {
    throw createError({ statusCode: 409, message: 'The saved sandbox destination is no longer authorised for this API key' });
  }
  if (settings.sandboxDefaultUserEmail
    && !dealership.users.some(item => item.email === settings.sandboxDefaultUserEmail)) {
    throw createError({ statusCode: 409, message: 'The saved sandbox salesperson is no longer authorised for this API key' });
  }

  const sentAt = new Date();
  const result = await createDealerStudioLead(
    apiKey,
    buildDealerStudioSandboxLead(settings, sentAt),
  );
  if (!result.ok) {
    const statusCode = result.kind === 'retryable' ? 503 : result.kind === 'ambiguous' ? 502 : 422;
    const message = result.kind === 'ambiguous'
      ? `${result.error}. Check the test dealership before sending again.`
      : result.error;
    throw createError({ statusCode, message });
  }

  const nextSettings = {
    ...settings,
    sandboxLastSentAt: sentAt.toISOString(),
    sandboxLastLeadId: String(result.leadId),
    sandboxLastLeadClusterId: String(result.leadClusterId),
  };
  let recorded = true;
  try {
    await db.update(dealers).set({
      settings: writeDealerStudioSettings(dealer.settings, nextSettings),
      updatedAt: new Date(),
    }).where(eq(dealers.id, user.dealerId));
  } catch {
    recorded = false;
    console.error('[dealer-studio-sandbox] Lead created but local status could not be recorded', {
      dealerId: user.dealerId,
      leadId: result.leadId,
    });
  }

  return {
    success: true,
    leadId: result.leadId,
    leadClusterId: result.leadClusterId,
    sentAt,
    recorded,
  };
});
