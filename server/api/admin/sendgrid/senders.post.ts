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

  const hasRequiredSenderDetails = [
    nickname,
    fromEmail,
    fromName,
    address,
    city,
    state,
    zip,
    country,
  ].every(value => typeof value === 'string' && value.trim().length > 0);

  if (!hasRequiredSenderDetails) {
    throw createError({ 
      statusCode: 400, 
      message: 'Sender identity and business address fields are required'
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
        nickname: nickname.trim(),
        from_email: fromEmail.trim(),
        from_name: fromName.trim(),
        reply_to: replyToEmail?.trim() || fromEmail.trim(),
        reply_to_name: replyToName?.trim() || fromName.trim(),
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        zip: zip.trim(),
        country: country.trim(),
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







