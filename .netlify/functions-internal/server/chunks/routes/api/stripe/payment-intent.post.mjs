import { d as defineEventHandler, r as readBody, u as useRuntimeConfig, c as createError } from '../../../nitro/nitro.mjs';
import Stripe from 'stripe';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'vue';
import 'consola';

const paymentIntent_post = defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const body = await readBody(event);
  if (!config.stripeSecretKey) {
    throw createError({
      statusCode: 500,
      statusMessage: "Stripe is not configured"
    });
  }
  const stripe = new Stripe(config.stripeSecretKey, {
    apiVersion: "2024-11-20.acacia"
  });
  try {
    let amount = 5e4;
    try {
      const depositData = await $fetch(`${config.public.apiUrl}/deposit-amount`);
      amount = depositData.amount * 100;
    } catch (error) {
      console.error("Error getting deposit amount, using default:", error);
    }
    const paymentIntent = await stripe.paymentIntents.create({
      currency: "aud",
      amount,
      payment_method_types: ["card"],
      description: body.description || "Vehicle deposit"
    });
    return {
      clientSecret: paymentIntent.client_secret
    };
  } catch (error) {
    console.error("Stripe error:", error);
    throw createError({
      statusCode: 400,
      statusMessage: "Payment intent creation failed",
      message: error.message
    });
  }
});

export { paymentIntent_post as default };
//# sourceMappingURL=payment-intent.post.mjs.map
