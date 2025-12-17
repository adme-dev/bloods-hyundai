/**
 * Get all verified senders from SendGrid
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
    // Fetch verified senders
    const response = await fetch('https://api.sendgrid.com/v3/verified_senders', {
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
        message: error.errors?.[0]?.message || 'Failed to fetch senders' 
      });
    }

    const data = await response.json();
    
    return {
      senders: data.results || [],
    };
  } catch (error: any) {
    console.error('Failed to fetch SendGrid senders:', error);
    throw createError({ 
      statusCode: 500, 
      message: error.message || 'Failed to fetch senders' 
    });
  }
});






