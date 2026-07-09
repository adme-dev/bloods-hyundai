/**
 * POST /api/stripe/payment-intent
 * Creates a Stripe payment intent for deposits
 * Migrated from: src/functions/create-payment-intent.js
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
    apiVersion: '2025-02-24.acacia',
  });

  try {
    // Fetch deposit amount from API
    let amount = 50000; // Default $500 in cents
    try {
      const depositData = await $fetch<{ amount: number }>(`${config.public.apiUrl}/deposit-amount`);
      amount = depositData.amount * 100;
    } catch (error) {
      console.error('Error getting deposit amount, using default:', error);
    }

    const paymentIntent = await stripe.paymentIntents.create({
      currency: 'aud',
      amount,
      payment_method_types: ['card'],
      description: body.description || 'Vehicle deposit',
    });

    return {
      clientSecret: paymentIntent.client_secret,
    };
  } catch (error: any) {
    console.error('Stripe error:', error);
    throw createError({
      statusCode: 400,
      statusMessage: 'Payment intent creation failed',
      message: error.message,
    });
  }
});








