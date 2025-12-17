/**
 * API route to retrieve a Stripe checkout session
 */
import Stripe from 'stripe';

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const body = await readBody(event);
  
  if (!config.stripeSecretKey) {
    return {
      success: false,
      error: 'Stripe not configured',
    };
  }
  
  const stripe = new Stripe(config.stripeSecretKey, {
    apiVersion: '2023-10-16',
  });
  
  const { id } = body;
  
  if (!id) {
    return {
      success: false,
      error: 'Session ID is required',
    };
  }
  
  try {
    const session = await stripe.checkout.sessions.retrieve(id);
    
    return {
      success: true,
      status: session.payment_status,
      vehicleId: session.metadata?.vehicleId,
      description: session.metadata?.vehicleName,
      customerEmail: session.customer_details?.email,
      amountTotal: (session.amount_total || 0) / 100,
    };
  } catch (error: any) {
    console.error('[Stripe] Retrieve session error:', error);
    
    return {
      success: false,
      error: error.message || 'Failed to retrieve session',
    };
  }
});








