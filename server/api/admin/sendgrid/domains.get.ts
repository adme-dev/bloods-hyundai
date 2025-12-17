/**
 * Get authenticated domains from SendGrid
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

  try {
    const response = await fetch('https://api.sendgrid.com/v3/whitelabel/domains', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('SendGrid API error:', error);
      throw createError({ 
        statusCode: response.status, 
        message: error.errors?.[0]?.message || 'Failed to fetch domains' 
      });
    }

    const domains = await response.json();
    
    return {
      domains: domains || [],
    };
  } catch (error: any) {
    console.error('Failed to fetch SendGrid domains:', error);
    throw createError({ 
      statusCode: 500, 
      message: error.message || 'Failed to fetch domains' 
    });
  }
});






