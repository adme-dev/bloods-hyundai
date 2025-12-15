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

  // Only admins and managers can update branding settings
  if (!['admin', 'manager'].includes(user.role)) {
    throw createError({
      statusCode: 403,
      message: 'Insufficient permissions',
    });
  }

  const body = await readBody(event);

  // Validate and sanitize URLs
  const urlFields = ['logoUrl', 'websiteUrl', 'facebookUrl', 'instagramUrl', 'linkedinUrl', 'youtubeUrl', 'twitterUrl'];
  const updateData: Record<string, string | null> = {};

  for (const field of urlFields) {
    if (field in body) {
      const value = body[field]?.trim() || null;

      // Validate URL format if provided
      if (value) {
        try {
          new URL(value);
          updateData[field] = value;
        } catch {
          throw createError({
            statusCode: 400,
            message: `Invalid URL format for ${field}`,
          });
        }
      } else {
        updateData[field] = null;
      }
    }
  }

  // Handle primary color (hex format)
  if ('primaryColor' in body) {
    const color = body.primaryColor?.trim() || null;
    if (color && !/^#[0-9A-Fa-f]{6}$/.test(color)) {
      throw createError({
        statusCode: 400,
        message: 'Invalid color format. Use hex format like #001E50',
      });
    }
    updateData.primaryColor = color;
  }

  if (Object.keys(updateData).length === 0) {
    throw createError({
      statusCode: 400,
      message: 'No valid fields to update',
    });
  }

  try {
    // Add updated timestamp
    const [updated] = await db
      .update(dealers)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(dealers.id, dealerId))
      .returning({
        id: dealers.id,
        logoUrl: dealers.logoUrl,
        primaryColor: dealers.primaryColor,
        websiteUrl: dealers.websiteUrl,
        facebookUrl: dealers.facebookUrl,
        instagramUrl: dealers.instagramUrl,
        linkedinUrl: dealers.linkedinUrl,
        youtubeUrl: dealers.youtubeUrl,
        twitterUrl: dealers.twitterUrl,
      });

    return {
      success: true,
      message: 'Branding settings updated successfully',
      dealer: updated,
    };
  } catch (error: any) {
    console.error('Error updating branding settings:', error);
    throw createError({
      statusCode: 500,
      message: 'Failed to update branding settings',
    });
  }
});
