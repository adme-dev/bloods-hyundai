import { d as defineEventHandler, r as readBody, c as createError, u as useRuntimeConfig } from '../../nitro/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'vue';
import 'consola';

const form_post = defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const body = await readBody(event);
  if (!body || !body.payload) {
    throw createError({
      statusCode: 400,
      message: "Form payload is required"
    });
  }
  const { payload, formid } = body;
  try {
    const apiUrl = config.public.apiUrl || "https://your-api.com";
    console.log("[Form API] Submitting form:", formid);
    const response = await $fetch(`${apiUrl}/form`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: {
        payload,
        formid
      }
    });
    return {
      success: true,
      message: "Form submitted successfully",
      data: response
    };
  } catch (error) {
    console.error("[Form API] Error:", error.message);
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to submit form"
    });
  }
});

export { form_post as default };
//# sourceMappingURL=form.post.mjs.map
