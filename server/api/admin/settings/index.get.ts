import { eq } from 'drizzle-orm';
import { db } from '../../../utils/db';
import { dealers } from '../../../database/schema';

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  const dealerId = event.context.dealerId;
  
  if (!user || !dealerId) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized',
    });
  }

  try {
    const [dealer] = await db
      .select({
        id: dealers.id,
        slug: dealers.slug,
        name: dealers.name,
        apiKey: dealers.apiKey,
        email: dealers.email,
        phone: dealers.phone,
        address: dealers.address,
        suburb: dealers.suburb,
        state: dealers.state,
        postcode: dealers.postcode,
        logoUrl: dealers.logoUrl,
        primaryColor: dealers.primaryColor,
        websiteUrl: dealers.websiteUrl,
        oem: dealers.oem,
        isActive: dealers.isActive,
        subscriptionTier: dealers.subscriptionTier,
      })
      .from(dealers)
      .where(eq(dealers.id, dealerId))
      .limit(1);

    if (!dealer) {
      throw createError({
        statusCode: 404,
        message: 'Dealer not found',
      });
    }

    return { dealer };
  } catch (error: any) {
    console.error('Error fetching dealer settings:', error);
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch dealer settings',
    });
  }
});

