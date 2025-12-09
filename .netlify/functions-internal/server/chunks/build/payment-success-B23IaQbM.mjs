import { _ as _export_sfc, a as useRoute, d as __nuxt_component_0$1 } from './server.mjs';
import { defineComponent, computed, withAsyncContext, mergeProps, unref, withCtx, createTextVNode, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrInterpolate, ssrRenderComponent } from 'vue/server-renderer';
import { u as useSiteMeta } from './useSiteMeta-CKVCOIy3.mjs';
import { u as useFetch } from './fetch-5f528j00.mjs';
import '../nitro/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'consola';
import '../routes/renderer.mjs';
import 'vue-bundle-renderer/runtime';
import 'unhead/server';
import 'devalue';
import 'unhead/utils';
import 'vue-router';
import 'lodash-es';
import '@vue/shared';

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "payment-success",
  __ssrInlineRender: true,
  async setup(__props) {
    let __temp, __restore;
    useSiteMeta({
      title: "Payment Successful",
      description: "Your vehicle deposit has been successfully processed."
    });
    const route = useRoute();
    const sessionId = computed(() => route.query.session_id);
    const { data: sessionData, pending, error } = ([__temp, __restore] = withAsyncContext(() => useFetch("/api/stripe/retrieve-session", {
      method: "POST",
      body: {
        id: sessionId.value
      },
      lazy: true,
      immediate: !!sessionId.value
    }, "$pS0p6tpd93")), __temp = await __temp, __restore(), __temp);
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0$1;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "payment-success-page" }, _attrs))} data-v-921d8ddf><div class="uk-section uk-section-large" data-v-921d8ddf><div class="uk-container uk-container-small uk-text-center" data-v-921d8ddf>`);
      if (unref(pending)) {
        _push(`<div class="uk-padding-large" data-v-921d8ddf><div uk-spinner="ratio: 2" data-v-921d8ddf></div><p class="uk-margin-top" data-v-921d8ddf>Confirming your payment...</p></div>`);
      } else if (unref(sessionData)) {
        _push(`<div class="success-content" data-v-921d8ddf><div class="success-icon" data-v-921d8ddf><span uk-icon="icon: check; ratio: 4" class="uk-text-success" data-v-921d8ddf></span></div><h1 class="uk-heading-small uk-margin-medium-top" data-v-921d8ddf>Payment Successful!</h1><p class="uk-text-lead uk-text-muted" data-v-921d8ddf> Thank you for your deposit. Your vehicle has been secured. </p><div class="uk-card uk-card-default uk-card-body uk-margin-medium-top" data-v-921d8ddf><h3 class="uk-card-title" data-v-921d8ddf>Order Details</h3><dl class="uk-description-list uk-description-list-divider" data-v-921d8ddf><dt data-v-921d8ddf>Vehicle</dt><dd data-v-921d8ddf>${ssrInterpolate(unref(sessionData).description)}</dd><dt data-v-921d8ddf>Reference</dt><dd data-v-921d8ddf>${ssrInterpolate(unref(sessionData).vehicleId)}</dd></dl></div><div class="uk-margin-large-top" data-v-921d8ddf><p class="uk-text-muted" data-v-921d8ddf> A confirmation email has been sent to your registered email address. One of our team members will be in touch within 24 hours. </p></div><div class="uk-margin-medium-top" data-v-921d8ddf>`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: "/",
          class: "uk-button uk-button-primary uk-button-large"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(` Return to Home `);
            } else {
              return [
                createTextVNode(" Return to Home ")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</div></div>`);
      } else if (unref(error)) {
        _push(`<div class="error-content" data-v-921d8ddf><div class="error-icon" data-v-921d8ddf><span uk-icon="icon: warning; ratio: 4" class="uk-text-danger" data-v-921d8ddf></span></div><h1 class="uk-heading-small uk-margin-medium-top" data-v-921d8ddf>Something went wrong</h1><p class="uk-text-lead uk-text-muted" data-v-921d8ddf> We couldn&#39;t verify your payment. Please contact us for assistance. </p><div class="uk-margin-medium-top" data-v-921d8ddf>`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: "/contact",
          class: "uk-button uk-button-primary uk-button-large"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(` Contact Us `);
            } else {
              return [
                createTextVNode(" Contact Us ")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/payment-success.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const paymentSuccess = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-921d8ddf"]]);

export { paymentSuccess as default };
//# sourceMappingURL=payment-success-B23IaQbM.mjs.map
