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

const retrieveSession_post = defineEventHandler(async (event) => {
  var _a, _b, _c;
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
  const { id } = body;
  if (!id) {
    return {
      success: false,
      error: "Session ID is required"
    };
  }
  try {
    const session = await stripe.checkout.sessions.retrieve(id);
    return {
      success: true,
      status: session.payment_status,
      vehicleId: (_a = session.metadata) == null ? void 0 : _a.vehicleId,
      description: (_b = session.metadata) == null ? void 0 : _b.vehicleName,
      customerEmail: (_c = session.customer_details) == null ? void 0 : _c.email,
      amountTotal: (session.amount_total || 0) / 100
    };
  } catch (error) {
    console.error("[Stripe] Retrieve session error:", error);
    return {
      success: false,
      error: error.message || "Failed to retrieve session"
    };
  }
});

export { retrieveSession_post as default };
//# sourceMappingURL=retrieve-session.post.mjs.map
