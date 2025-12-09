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

const checkoutSession_post = defineEventHandler(async (event) => {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k;
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
    let hostname = body.hostname;
    if (hostname === "localhost") hostname = "localhost:3000";
    const protocol = hostname.includes("localhost") ? "http" : "https";
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: config.stripePriceId || process.env.NUXT_STRIPE_PRICE_ID,
          quantity: 1
        }
      ],
      payment_intent_data: {
        description: `Deposit for ${((_c = (_b = (_a = body.vehicle) == null ? void 0 : _a.year) == null ? void 0 : _b.displayValue) == null ? void 0 : _c[0]) || ""} ${((_f = (_e = (_d = body.vehicle) == null ? void 0 : _d.make) == null ? void 0 : _e.displayValue) == null ? void 0 : _f[0]) || ""} ${((_i = (_h = (_g = body.vehicle) == null ? void 0 : _g.model) == null ? void 0 : _h.displayValue) == null ? void 0 : _i[0]) || ""} - v${((_j = body.vehicle) == null ? void 0 : _j.stockid) || ""}`,
        metadata: {
          "vehicle-id": ((_k = body.vehicle) == null ? void 0 : _k.stockid) || ""
        }
      },
      payment_method_types: ["card"],
      mode: "payment",
      success_url: `${protocol}://${hostname}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${protocol}://${hostname}${body.currentPath || "/"}?cancel=true&session_id={CHECKOUT_SESSION_ID}`
    });
    return {
      session
    };
  } catch (error) {
    console.error("Stripe checkout error:", error);
    throw createError({
      statusCode: 400,
      statusMessage: "Checkout session creation failed",
      message: error.message
    });
  }
});

export { checkoutSession_post as default };
//# sourceMappingURL=checkout-session.post.mjs.map
