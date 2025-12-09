import { defineComponent, computed, ref, reactive, mergeProps, defineAsyncComponent, unref, withCtx, createTextVNode, useSSRContext } from 'vue';
import { _ as _export_sfc, a as useRoute, d as __nuxt_component_0$1 } from './server.mjs';
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate, ssrRenderAttr, ssrRenderStyle, ssrIncludeBooleanAttr, ssrLooseContain } from 'vue/server-renderer';
import { u as useSiteMeta } from './useSiteMeta-CKVCOIy3.mjs';
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

const __nuxt_component_0_lazy = defineAsyncComponent(() => import('./PageSchema-G9WhHOpc.mjs').then((c) => c.default || c));
const depositAmount = 500;
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "[id]",
  __ssrInlineRender: true,
  setup(__props) {
    const route = useRoute();
    computed(() => route.params.id);
    const formattedDeposit = computed(() => `$${depositAmount.toLocaleString()}`);
    const vehicle = ref(null);
    const processing = ref(false);
    const paymentSuccess = ref(false);
    const paymentError = ref(null);
    const cardError = ref(null);
    const form = reactive({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      agreeTerms: false
    });
    useSiteMeta({
      title: () => `Reserve ${vehicle.value?.title || "Vehicle"}`,
      description: "Secure your vehicle with a refundable deposit."
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_LazyPageSchema = __nuxt_component_0_lazy;
      const _component_NuxtLink = __nuxt_component_0$1;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "secure-vehicle-page" }, _attrs))} data-v-7fa5215f>`);
      _push(ssrRenderComponent(_component_LazyPageSchema, null, null, _parent));
      _push(`<div class="uk-container uk-margin-large-top uk-margin-large-bottom" data-v-7fa5215f><div class="uk-grid uk-grid-large" uk-grid data-v-7fa5215f><div class="uk-width-1-2@m" data-v-7fa5215f>`);
      if (unref(vehicle)) {
        _push(`<div class="uk-card uk-card-default uk-card-body" data-v-7fa5215f><h3 class="uk-card-title" data-v-7fa5215f>${ssrInterpolate(unref(vehicle).title)}</h3>`);
        if (unref(vehicle).images?.[0]) {
          _push(`<img${ssrRenderAttr("src", unref(vehicle).images[0])}${ssrRenderAttr("alt", unref(vehicle).title)} class="uk-width-1-1 uk-margin" data-v-7fa5215f>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<ul class="uk-list uk-list-divider" data-v-7fa5215f>`);
        if (unref(vehicle).year) {
          _push(`<li data-v-7fa5215f><strong data-v-7fa5215f>Year:</strong> ${ssrInterpolate(unref(vehicle).year)}</li>`);
        } else {
          _push(`<!---->`);
        }
        if (unref(vehicle).odometer) {
          _push(`<li data-v-7fa5215f><strong data-v-7fa5215f>Odometer:</strong> ${ssrInterpolate(unref(vehicle).odometer?.toLocaleString())} km</li>`);
        } else {
          _push(`<!---->`);
        }
        if (unref(vehicle).transmission) {
          _push(`<li data-v-7fa5215f><strong data-v-7fa5215f>Transmission:</strong> ${ssrInterpolate(unref(vehicle).transmission)}</li>`);
        } else {
          _push(`<!---->`);
        }
        if (unref(vehicle).stockNumber) {
          _push(`<li data-v-7fa5215f><strong data-v-7fa5215f>Stock #:</strong> ${ssrInterpolate(unref(vehicle).stockNumber)}</li>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</ul><div class="uk-h2 uk-text-primary" data-v-7fa5215f>${ssrInterpolate(unref(vehicle).price ? `$${unref(vehicle).price.toLocaleString()}` : "POA")}</div></div>`);
      } else {
        _push(`<div class="uk-text-center uk-padding" data-v-7fa5215f><div uk-spinner data-v-7fa5215f></div></div>`);
      }
      _push(`</div><div class="uk-width-1-2@m" data-v-7fa5215f><div class="uk-card uk-card-default uk-card-body" data-v-7fa5215f><div class="uk-text-small uk-text-muted" data-v-7fa5215f>Vehicle Reservation Deposit</div><h3 class="uk-margin-remove uk-text-bold" data-v-7fa5215f>${ssrInterpolate(unref(formattedDeposit))}</h3>`);
      if (unref(paymentSuccess)) {
        _push(`<div class="uk-alert-success uk-margin-top" uk-alert data-v-7fa5215f><p data-v-7fa5215f><strong data-v-7fa5215f>Payment Successful!</strong> Your vehicle has been reserved.</p></div>`);
      } else {
        _push(`<!---->`);
      }
      if (unref(paymentError)) {
        _push(`<div class="uk-alert-danger uk-margin-top" uk-alert data-v-7fa5215f><p data-v-7fa5215f>${ssrInterpolate(unref(paymentError))}</p></div>`);
      } else {
        _push(`<!---->`);
      }
      if (!unref(paymentSuccess)) {
        _push(`<form class="uk-form-stacked uk-margin-top" data-v-7fa5215f><div class="uk-grid uk-grid-small uk-child-width-1-2@s" uk-grid data-v-7fa5215f><div data-v-7fa5215f><label class="uk-form-label" data-v-7fa5215f>First Name *</label><input${ssrRenderAttr("value", unref(form).firstName)} type="text" class="uk-input" required data-v-7fa5215f></div><div data-v-7fa5215f><label class="uk-form-label" data-v-7fa5215f>Last Name *</label><input${ssrRenderAttr("value", unref(form).lastName)} type="text" class="uk-input" required data-v-7fa5215f></div></div><div class="uk-margin" data-v-7fa5215f><label class="uk-form-label" data-v-7fa5215f>Email *</label><input${ssrRenderAttr("value", unref(form).email)} type="email" class="uk-input" required data-v-7fa5215f></div><div class="uk-margin" data-v-7fa5215f><label class="uk-form-label" data-v-7fa5215f>Phone *</label><input${ssrRenderAttr("value", unref(form).phone)} type="tel" class="uk-input" required data-v-7fa5215f></div><div class="uk-margin" data-v-7fa5215f><label class="uk-form-label" data-v-7fa5215f>Card Details</label><div id="card-element" class="uk-padding-small uk-background-muted" style="${ssrRenderStyle({ "min-height": "50px" })}" data-v-7fa5215f><p class="uk-text-center uk-text-muted uk-margin-small" data-v-7fa5215f> Loading payment form... </p></div>`);
        if (unref(cardError)) {
          _push(`<div class="uk-text-danger uk-text-small uk-margin-small-top" data-v-7fa5215f>${ssrInterpolate(unref(cardError))}</div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div><div class="uk-margin" data-v-7fa5215f><label data-v-7fa5215f><input${ssrIncludeBooleanAttr(Array.isArray(unref(form).agreeTerms) ? ssrLooseContain(unref(form).agreeTerms, null) : unref(form).agreeTerms) ? " checked" : ""} type="checkbox" class="uk-checkbox" required data-v-7fa5215f> I agree to the `);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: "/terms-conditions",
          target: "_blank"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`Terms &amp; Conditions`);
            } else {
              return [
                createTextVNode("Terms & Conditions")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</label></div><div class="uk-margin-medium-top" data-v-7fa5215f><button type="submit" class="uk-button uk-button-primary uk-button-large uk-width-1-1"${ssrIncludeBooleanAttr(unref(processing)) ? " disabled" : ""} data-v-7fa5215f>`);
        if (unref(processing)) {
          _push(`<span uk-spinner="ratio: 0.6" data-v-7fa5215f></span>`);
        } else {
          _push(`<!---->`);
        }
        _push(` ${ssrInterpolate(unref(processing) ? "Processing..." : `Pay ${unref(formattedDeposit)}`)}</button></div><p class="uk-text-meta uk-text-center uk-margin-top" data-v-7fa5215f><span uk-icon="lock" class="uk-margin-small-right" data-v-7fa5215f></span> Secure payment powered by Stripe </p></form>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div></div></div></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/secure-vehicle/[id].vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const _id_ = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-7fa5215f"]]);

export { _id_ as default };
//# sourceMappingURL=_id_-PP_Lokbz.mjs.map
