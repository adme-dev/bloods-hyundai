import { d as defineEventHandler, r as readBody, u as useRuntimeConfig } from '../../../nitro/nitro.mjs';
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

const createCheckoutSession_post = defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const body = await readBody(event);
  if (!config.stripeSecretKey) {
    return {
      success: false,
      error: "Stripe not configured"
    };
  }
  const stripe = new Stripe(config.stripeSecretKey, {
    apiVersion: "2023-10-16"
  });
  const { vehicleId, vehicleName, amount, customerEmail } = body;
  if (!vehicleId || !amount) {
    return {
      success: false,
      error: "Vehicle ID and amount are required"
    };
  }
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "aud",
            product_data: {
              name: `Deposit for ${vehicleName || "Vehicle"}`,
              description: `Vehicle ID: ${vehicleId}`
            },
            unit_amount: Math.round(amount * 100)
            // Convert to cents
          },
          quantity: 1
        }
      ],
      mode: "payment",
      success_url: `${config.public.siteUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${config.public.siteUrl}/secure-vehicle/${vehicleId}`,
      customer_email: customerEmail,
      metadata: {
        vehicleId,
        vehicleName
      }
    });
    return {
      success: true,
      sessionId: session.id,
      url: session.url
    };
  } catch (error) {
    console.error("[Stripe] Checkout session error:", error);
    return {
      success: false,
      error: error.message || "Failed to create checkout session"
    };
  }
});

export { createCheckoutSession_post as default };
//# sourceMappingURL=create-checkout-session.post.mjs.map
