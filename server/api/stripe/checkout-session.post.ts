/**
 * POST /api/stripe/checkout-session
 * Creates a Stripe checkout session
 * Migrated from: src/functions/create-checkout-session.js
 */
import Stripe from 'stripe';

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const body = await readBody(event);

  if (!config.stripeSecretKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Stripe is not configured',
    });
  }

  const stripe = new Stripe(config.stripeSecretKey, {
    apiVersion: '2024-11-20.acacia',
  });

  try {
    let hostname = body.hostname;
    if (hostname === 'localhost') hostname = 'localhost:3000';

    const protocol = hostname.includes('localhost') ? 'http' : 'https';

    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: config.stripePriceId || process.env.NUXT_STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      payment_intent_data: {
        description: `Deposit for ${body.vehicle?.year?.displayValue?.[0] || ''} ${body.vehicle?.make?.displayValue?.[0] || ''} ${body.vehicle?.model?.displayValue?.[0] || ''} - v${body.vehicle?.stockid || ''}`,
        metadata: {
          'vehicle-id': body.vehicle?.stockid || '',
        },
      },
      payment_method_types: ['card'],
      mode: 'payment',
      success_url: `${protocol}://${hostname}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${protocol}://${hostname}${body.currentPath || '/'}?cancel=true&session_id={CHECKOUT_SESSION_ID}`,
    });

    return {
      session,
    };
  } catch (error: any) {
    console.error('Stripe checkout error:', error);
    throw createError({
      statusCode: 400,
      statusMessage: 'Checkout session creation failed',
      message: error.message,
    });
  }
});



