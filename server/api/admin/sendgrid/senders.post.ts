/**
 * Create a new sender identity in SendGrid
 * This will trigger a verification email to the sender's email address
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

  const body = await readBody(event);
  const { 
    nickname, 
    fromEmail, 
    fromName, 
    replyToEmail, 
    replyToName,
    address,
    city,
    state,
    zip,
    country 
  } = body;

  if (!fromEmail || !fromName || !nickname) {
    throw createError({ 
      statusCode: 400, 
      message: 'Nickname, from email and from name are required' 
    });
  }

  try {
    // Create sender identity
    const response = await fetch('https://api.sendgrid.com/v3/verified_senders', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nickname,
        from_email: fromEmail,
        from_name: fromName,
        reply_to: replyToEmail || fromEmail,
        reply_to_name: replyToName || fromName,
        address: address || '123 Main Street',
        city: city || 'Sydney',
        state: state || 'NSW',
        zip: zip || '2000',
        country: country || 'Australia',
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('SendGrid API error:', data);
      throw createError({ 
        statusCode: response.status, 
        message: data.errors?.[0]?.message || 'Failed to create sender' 
      });
    }
    
    return {
      success: true,
      sender: data,
      message: `Verification email sent to ${fromEmail}. Please check your inbox and click the verification link.`,
    };
  } catch (error: any) {
    console.error('Failed to create SendGrid sender:', error);
    throw createError({ 
      statusCode: error.statusCode || 500, 
      message: error.message || 'Failed to create sender' 
    });
  }
});

