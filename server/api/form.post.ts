export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const body = await readBody(event);
  
  if (!body || !body.payload) {
    throw createError({
      statusCode: 400,
      message: 'Form payload is required',
    });
  }
  
  const { payload, formid } = body;
  
  try {
    // Use the configured API URL for form submissions
    const apiUrl = config.public.apiUrl || 'https://your-api.com';
    
    console.log('[Form API] Submitting form:', formid);
    
    const response = await $fetch<any>(`${apiUrl}/form`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: {
        payload,
        formid,
      },
    });
    
    return {
      success: true,
      message: 'Form submitted successfully',
      data: response,
    };
  } catch (error: any) {
    console.error('[Form API] Error:', error.message);
    
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to submit form',
    });
  }
});









