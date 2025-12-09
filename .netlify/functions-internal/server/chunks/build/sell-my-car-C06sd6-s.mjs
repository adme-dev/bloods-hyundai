import { defineComponent, reactive, ref, mergeProps, defineAsyncComponent, unref, withCtx, createTextVNode, useSSRContext } from 'vue';
import { _ as _export_sfc, d as __nuxt_component_0$1 } from './server.mjs';
import { ssrRenderAttrs, ssrRenderComponent, ssrRenderAttr, ssrIncludeBooleanAttr, ssrLooseContain, ssrLooseEqual, ssrRenderList, ssrInterpolate } from 'vue/server-renderer';
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
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "sell-my-car",
  __ssrInlineRender: true,
  setup(__props) {
    useSiteMeta({
      title: "Sell Your Car",
      description: "Sell your car to Sale Hyundai. Get a fair price with no hassle."
    });
    const currentYear = (/* @__PURE__ */ new Date()).getFullYear();
    const years = Array.from({ length: 30 }, (_, i) => currentYear - i);
    const form = reactive({
      make: "",
      model: "",
      year: "",
      odometer: "",
      registration: "",
      condition: "",
      description: "",
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      consent: false
    });
    const submitting = ref(false);
    const submitted = ref(false);
    return (_ctx, _push, _parent, _attrs) => {
      const _component_LazyPageSchema = __nuxt_component_0_lazy;
      const _component_NuxtLink = __nuxt_component_0$1;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "sell-my-car-page" }, _attrs))} data-v-489eaf00>`);
      _push(ssrRenderComponent(_component_LazyPageSchema, null, null, _parent));
      _push(`<div class="uk-section uk-section-primary uk-light uk-text-center" data-v-489eaf00><div class="uk-container" data-v-489eaf00><h1 class="uk-heading-medium" data-v-489eaf00>Sell Your Car</h1><p class="uk-text-lead" data-v-489eaf00> Get a fair price for your vehicle. No hassle, no hidden fees. </p></div></div><div class="uk-section uk-section-muted" data-v-489eaf00><div class="uk-container" data-v-489eaf00><h2 class="uk-text-center uk-margin-medium-bottom" data-v-489eaf00>How It Works</h2><div class="uk-grid uk-grid-medium uk-child-width-1-3@m" uk-grid data-v-489eaf00><div data-v-489eaf00><div class="uk-card uk-card-default uk-card-body uk-text-center" data-v-489eaf00><span class="step-number" data-v-489eaf00>1</span><span uk-icon="icon: file-edit; ratio: 2" class="uk-margin-small-bottom uk-text-primary" data-v-489eaf00></span><h3 data-v-489eaf00>Submit Details</h3><p class="uk-text-muted" data-v-489eaf00>Fill out the form with your vehicle information and upload photos.</p></div></div><div data-v-489eaf00><div class="uk-card uk-card-default uk-card-body uk-text-center" data-v-489eaf00><span class="step-number" data-v-489eaf00>2</span><span uk-icon="icon: search; ratio: 2" class="uk-margin-small-bottom uk-text-primary" data-v-489eaf00></span><h3 data-v-489eaf00>Get Valuation</h3><p class="uk-text-muted" data-v-489eaf00>Our team will assess your vehicle and provide a competitive offer.</p></div></div><div data-v-489eaf00><div class="uk-card uk-card-default uk-card-body uk-text-center" data-v-489eaf00><span class="step-number" data-v-489eaf00>3</span><span uk-icon="icon: check; ratio: 2" class="uk-margin-small-bottom uk-text-primary" data-v-489eaf00></span><h3 data-v-489eaf00>Get Paid</h3><p class="uk-text-muted" data-v-489eaf00>Accept the offer and receive payment. Simple as that.</p></div></div></div></div></div><div class="uk-section" data-v-489eaf00><div class="uk-container uk-container-small" data-v-489eaf00><div class="uk-card uk-card-default uk-card-body" data-v-489eaf00><h2 class="uk-card-title uk-text-center uk-margin-medium-bottom" data-v-489eaf00> Tell Us About Your Car </h2><form class="uk-form-stacked" data-v-489eaf00><h3 class="uk-h4 uk-margin-medium-top" data-v-489eaf00>Vehicle Details</h3><div class="uk-grid uk-grid-small uk-child-width-1-2@s" uk-grid data-v-489eaf00><div data-v-489eaf00><label class="uk-form-label" for="make" data-v-489eaf00>Make *</label><input id="make"${ssrRenderAttr("value", unref(form).make)} type="text" class="uk-input" required data-v-489eaf00></div><div data-v-489eaf00><label class="uk-form-label" for="model" data-v-489eaf00>Model *</label><input id="model"${ssrRenderAttr("value", unref(form).model)} type="text" class="uk-input" required data-v-489eaf00></div></div><div class="uk-grid uk-grid-small uk-child-width-1-3@s" uk-grid data-v-489eaf00><div data-v-489eaf00><label class="uk-form-label" for="year" data-v-489eaf00>Year *</label><select id="year" class="uk-select" required data-v-489eaf00><option value="" data-v-489eaf00${ssrIncludeBooleanAttr(Array.isArray(unref(form).year) ? ssrLooseContain(unref(form).year, "") : ssrLooseEqual(unref(form).year, "")) ? " selected" : ""}>Select year</option><!--[-->`);
      ssrRenderList(unref(years), (year) => {
        _push(`<option${ssrRenderAttr("value", year)} data-v-489eaf00${ssrIncludeBooleanAttr(Array.isArray(unref(form).year) ? ssrLooseContain(unref(form).year, year) : ssrLooseEqual(unref(form).year, year)) ? " selected" : ""}>${ssrInterpolate(year)}</option>`);
      });
      _push(`<!--]--></select></div><div data-v-489eaf00><label class="uk-form-label" for="odometer" data-v-489eaf00>Odometer (km) *</label><input id="odometer"${ssrRenderAttr("value", unref(form).odometer)} type="number" class="uk-input" required data-v-489eaf00></div><div data-v-489eaf00><label class="uk-form-label" for="registration" data-v-489eaf00>Registration *</label><input id="registration"${ssrRenderAttr("value", unref(form).registration)} type="text" class="uk-input" required data-v-489eaf00></div></div><div class="uk-margin" data-v-489eaf00><label class="uk-form-label" for="condition" data-v-489eaf00>Condition *</label><select id="condition" class="uk-select" required data-v-489eaf00><option value="" data-v-489eaf00${ssrIncludeBooleanAttr(Array.isArray(unref(form).condition) ? ssrLooseContain(unref(form).condition, "") : ssrLooseEqual(unref(form).condition, "")) ? " selected" : ""}>Select condition</option><option value="excellent" data-v-489eaf00${ssrIncludeBooleanAttr(Array.isArray(unref(form).condition) ? ssrLooseContain(unref(form).condition, "excellent") : ssrLooseEqual(unref(form).condition, "excellent")) ? " selected" : ""}>Excellent - Like new</option><option value="good" data-v-489eaf00${ssrIncludeBooleanAttr(Array.isArray(unref(form).condition) ? ssrLooseContain(unref(form).condition, "good") : ssrLooseEqual(unref(form).condition, "good")) ? " selected" : ""}>Good - Minor wear</option><option value="fair" data-v-489eaf00${ssrIncludeBooleanAttr(Array.isArray(unref(form).condition) ? ssrLooseContain(unref(form).condition, "fair") : ssrLooseEqual(unref(form).condition, "fair")) ? " selected" : ""}>Fair - Normal wear</option><option value="poor" data-v-489eaf00${ssrIncludeBooleanAttr(Array.isArray(unref(form).condition) ? ssrLooseContain(unref(form).condition, "poor") : ssrLooseEqual(unref(form).condition, "poor")) ? " selected" : ""}>Poor - Needs work</option></select></div><div class="uk-margin" data-v-489eaf00><label class="uk-form-label" for="description" data-v-489eaf00>Description</label><textarea id="description" class="uk-textarea" rows="3" placeholder="Any additional details about your vehicle (features, history, etc.)" data-v-489eaf00>${ssrInterpolate(unref(form).description)}</textarea></div><h3 class="uk-h4 uk-margin-medium-top" data-v-489eaf00>Your Contact Details</h3><div class="uk-grid uk-grid-small uk-child-width-1-2@s" uk-grid data-v-489eaf00><div data-v-489eaf00><label class="uk-form-label" for="firstName" data-v-489eaf00>First Name *</label><input id="firstName"${ssrRenderAttr("value", unref(form).firstName)} type="text" class="uk-input" required data-v-489eaf00></div><div data-v-489eaf00><label class="uk-form-label" for="lastName" data-v-489eaf00>Last Name *</label><input id="lastName"${ssrRenderAttr("value", unref(form).lastName)} type="text" class="uk-input" required data-v-489eaf00></div></div><div class="uk-grid uk-grid-small uk-child-width-1-2@s" uk-grid data-v-489eaf00><div data-v-489eaf00><label class="uk-form-label" for="email" data-v-489eaf00>Email *</label><input id="email"${ssrRenderAttr("value", unref(form).email)} type="email" class="uk-input" required data-v-489eaf00></div><div data-v-489eaf00><label class="uk-form-label" for="phone" data-v-489eaf00>Phone *</label><input id="phone"${ssrRenderAttr("value", unref(form).phone)} type="tel" class="uk-input" required data-v-489eaf00></div></div><div class="uk-margin" data-v-489eaf00><label data-v-489eaf00><input${ssrIncludeBooleanAttr(Array.isArray(unref(form).consent) ? ssrLooseContain(unref(form).consent, null) : unref(form).consent) ? " checked" : ""} type="checkbox" class="uk-checkbox" required data-v-489eaf00> I agree to the `);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/privacy-policy",
        target: "_blank"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`Privacy Policy`);
          } else {
            return [
              createTextVNode("Privacy Policy")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</label></div><div class="uk-margin-medium-top" data-v-489eaf00><button type="submit" class="uk-button uk-button-primary uk-width-1-1"${ssrIncludeBooleanAttr(unref(submitting)) ? " disabled" : ""} data-v-489eaf00>`);
      if (unref(submitting)) {
        _push(`<span uk-spinner="ratio: 0.6" data-v-489eaf00></span>`);
      } else {
        _push(`<!---->`);
      }
      _push(` ${ssrInterpolate(unref(submitting) ? "Submitting..." : "Get Your Valuation")}</button></div></form>`);
      if (unref(submitted)) {
        _push(`<div class="uk-alert-success uk-margin-top" uk-alert data-v-489eaf00><p data-v-489eaf00><strong data-v-489eaf00>Thank you!</strong> We&#39;ve received your vehicle details. Our team will review and contact you within 24-48 hours with a valuation. </p></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div></div></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/sell-my-car.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const sellMyCar = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-489eaf00"]]);

export { sellMyCar as default };
//# sourceMappingURL=sell-my-car-C06sd6-s.mjs.map
