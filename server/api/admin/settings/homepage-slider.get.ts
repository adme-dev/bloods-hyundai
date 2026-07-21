import { eq } from 'drizzle-orm';
import { dealers } from '../../../database/schema';
import { db } from '../../../utils/db';
import {
  HOMEPAGE_SLIDER_MAX_SLIDES,
  readHomepageSliderSettings,
  type HomepageSliderSettings,
} from '../../../../shared/homepageSlider';

const emptySettings = (): HomepageSliderSettings => ({
  version: 1,
  enabled: true,
  updatedAt: null,
  slides: [],
});

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  const dealerId = event.context.dealerId;
  if (!user || !dealerId) {
    throw createError({ statusCode: 401, message: 'Unauthorized' });
  }

  try {
    const [dealer] = await db
      .select({ settings: dealers.settings })
      .from(dealers)
      .where(eq(dealers.id, dealerId))
      .limit(1);

    if (!dealer) throw createError({ statusCode: 404, message: 'Dealer not found' });

    const settings = readHomepageSliderSettings(dealer.settings) || emptySettings();
    return {
      success: true,
      source: settings.updatedAt ? 'custom' : 'upstream',
      settings,
      limits: {
        maxSlides: HOMEPAGE_SLIDER_MAX_SLIDES,
        maxImageBytes: 10 * 1024 * 1024,
        acceptedImageTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      },
    };
  } catch (error: any) {
    if (error?.statusCode) throw error;
    console.error('Failed to load homepage slider settings:', error);
    throw createError({ statusCode: 500, message: 'Failed to load homepage slider settings' });
  }
});
