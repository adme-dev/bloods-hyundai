/**
 * Resend verification email for a sender
 */
export default defineEventHandler(async (event) => {
  const user = event.context.user;
  if (!user || user.role !== 'dealer_admin') {
    throw createError({ statusCode: 403, message: 'Admin access required' });
  }

  const config = useRuntimeConfig();
  const apiKey = config.sendgridApiKey;

  if (!apiKey) {
    throw createError({ statusCode: 500, message: 'SendGrid API key not configured' });
  }

  const senderId = getRouterParam(event, 'id');
  if (!senderId) {
    throw createError({ statusCode: 400, message: 'Sender ID is required' });
  }

  try {
    const response = await fetch(`https://api.sendgrid.com/v3/verified_senders/resend/${senderId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok && response.status !== 204) {
      const error = await response.json().catch(() => ({}));
      console.error('SendGrid API error:', error);
      throw createError({ 
        statusCode: response.status, 
        message: error.errors?.[0]?.message || 'Failed to resend verification' 
      });
    }
    
    return {
      success: true,
      message: 'Verification email resent successfully',
    };
  } catch (error: any) {
    console.error('Failed to resend verification:', error);
    throw createError({ 
      statusCode: error.statusCode || 500, 
      message: error.message || 'Failed to resend verification' 
    });
  }
});

