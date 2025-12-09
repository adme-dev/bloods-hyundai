import { defineComponent, computed, reactive, ref, mergeProps, defineAsyncComponent, unref, withCtx, createTextVNode, useSSRContext } from 'vue';
import { _ as _export_sfc, a as useRoute, d as __nuxt_component_0$1 } from './server.mjs';
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate, ssrRenderAttr, ssrIncludeBooleanAttr, ssrLooseContain } from 'vue/server-renderer';
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
  __name: "[...params]",
  __ssrInlineRender: true,
  setup(__props) {
    const route = useRoute();
    const params = computed(() => {
      const p = route.params.params;
      if (Array.isArray(p) && p.length > 0) {
        const parts = p[0].split("-");
        if (parts.length >= 5) {
          return {
            condition: parts[0],
            year: parts[1],
            make: parts[2],
            model: parts[3],
            stockId: parts.slice(4).join("-")
          };
        }
      }
      return null;
    });
    const vehicleInfo = computed(() => params.value);
    const vehicleTitle = computed(() => {
      if (!vehicleInfo.value) return "Vehicle";
      const { year, make, model, condition } = vehicleInfo.value;
      return `${condition === "used" ? "Used" : condition === "new" ? "New" : "Demo"} ${year} ${make} ${model}`.replace(/-/g, " ");
    });
    const form = reactive({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      postcode: "",
      message: "",
      testDrive: false,
      tradeIn: false,
      tradeInMake: "",
      tradeInModel: "",
      tradeInYear: "",
      consent: false
    });
    const submitting = ref(false);
    const submitted = ref(false);
    useSiteMeta({
      title: () => `Enquire - ${vehicleTitle.value}`,
      description: () => `Enquire about the ${vehicleTitle.value} at Sale Hyundai.`
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_LazyPageSchema = __nuxt_component_0_lazy;
      const _component_NuxtLink = __nuxt_component_0$1;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "vehicle-enquire-page" }, _attrs))} data-v-8e141c43>`);
      _push(ssrRenderComponent(_component_LazyPageSchema, null, null, _parent));
      _push(`<div class="uk-section uk-section-primary uk-light" data-v-8e141c43><div class="uk-container" data-v-8e141c43><h1 class="uk-heading-small" data-v-8e141c43>Enquire About This Vehicle</h1><p class="uk-text-lead" data-v-8e141c43>${ssrInterpolate(unref(vehicleTitle))}</p></div></div><div class="uk-section" data-v-8e141c43><div class="uk-container uk-container-small" data-v-8e141c43><div class="uk-card uk-card-default uk-card-body" data-v-8e141c43>`);
      if (unref(vehicleInfo)) {
        _push(`<div class="uk-margin-bottom uk-padding-small uk-background-muted" data-v-8e141c43><div class="uk-grid uk-grid-small uk-flex-middle" uk-grid data-v-8e141c43><div class="uk-width-auto" data-v-8e141c43><span uk-icon="icon: car; ratio: 2" class="uk-text-primary" data-v-8e141c43></span></div><div class="uk-width-expand" data-v-8e141c43><h3 class="uk-margin-remove" data-v-8e141c43>${ssrInterpolate(unref(vehicleTitle))}</h3><p class="uk-text-meta uk-margin-remove" data-v-8e141c43>Stock #${ssrInterpolate(unref(vehicleInfo).stockId)}</p></div></div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<form class="uk-form-stacked" data-v-8e141c43><h3 data-v-8e141c43>Your Details</h3><div class="uk-grid uk-grid-small uk-child-width-1-2@s" uk-grid data-v-8e141c43><div data-v-8e141c43><label class="uk-form-label" data-v-8e141c43>First Name *</label><input${ssrRenderAttr("value", unref(form).firstName)} type="text" class="uk-input" required data-v-8e141c43></div><div data-v-8e141c43><label class="uk-form-label" data-v-8e141c43>Last Name *</label><input${ssrRenderAttr("value", unref(form).lastName)} type="text" class="uk-input" required data-v-8e141c43></div></div><div class="uk-grid uk-grid-small uk-child-width-1-2@s" uk-grid data-v-8e141c43><div data-v-8e141c43><label class="uk-form-label" data-v-8e141c43>Email *</label><input${ssrRenderAttr("value", unref(form).email)} type="email" class="uk-input" required data-v-8e141c43></div><div data-v-8e141c43><label class="uk-form-label" data-v-8e141c43>Phone *</label><input${ssrRenderAttr("value", unref(form).phone)} type="tel" class="uk-input" required data-v-8e141c43></div></div><div class="uk-margin" data-v-8e141c43><label class="uk-form-label" data-v-8e141c43>Postcode</label><input${ssrRenderAttr("value", unref(form).postcode)} type="text" class="uk-input uk-form-width-small" maxlength="4" data-v-8e141c43></div><div class="uk-margin" data-v-8e141c43><label class="uk-form-label" data-v-8e141c43>Message</label><textarea class="uk-textarea" rows="4" placeholder="Any questions or comments?" data-v-8e141c43>${ssrInterpolate(unref(form).message)}</textarea></div><div class="uk-margin" data-v-8e141c43><label data-v-8e141c43><input${ssrIncludeBooleanAttr(Array.isArray(unref(form).testDrive) ? ssrLooseContain(unref(form).testDrive, null) : unref(form).testDrive) ? " checked" : ""} type="checkbox" class="uk-checkbox" data-v-8e141c43> I&#39;d like to book a test drive </label></div><div class="uk-margin" data-v-8e141c43><label data-v-8e141c43><input${ssrIncludeBooleanAttr(Array.isArray(unref(form).tradeIn) ? ssrLooseContain(unref(form).tradeIn, null) : unref(form).tradeIn) ? " checked" : ""} type="checkbox" class="uk-checkbox" data-v-8e141c43> I have a vehicle to trade in </label></div>`);
      if (unref(form).tradeIn) {
        _push(`<div class="uk-margin uk-padding-small uk-background-muted" data-v-8e141c43><h4 data-v-8e141c43>Trade-in Details</h4><div class="uk-grid uk-grid-small uk-child-width-1-3@s" uk-grid data-v-8e141c43><div data-v-8e141c43><label class="uk-form-label" data-v-8e141c43>Make</label><input${ssrRenderAttr("value", unref(form).tradeInMake)} type="text" class="uk-input" data-v-8e141c43></div><div data-v-8e141c43><label class="uk-form-label" data-v-8e141c43>Model</label><input${ssrRenderAttr("value", unref(form).tradeInModel)} type="text" class="uk-input" data-v-8e141c43></div><div data-v-8e141c43><label class="uk-form-label" data-v-8e141c43>Year</label><input${ssrRenderAttr("value", unref(form).tradeInYear)} type="text" class="uk-input" data-v-8e141c43></div></div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<div class="uk-margin" data-v-8e141c43><label data-v-8e141c43><input${ssrIncludeBooleanAttr(Array.isArray(unref(form).consent) ? ssrLooseContain(unref(form).consent, null) : unref(form).consent) ? " checked" : ""} type="checkbox" class="uk-checkbox" required data-v-8e141c43> I agree to the `);
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
      _push(`</label></div><div class="uk-margin-medium-top" data-v-8e141c43><button type="submit" class="uk-button uk-button-primary uk-button-large uk-width-1-1"${ssrIncludeBooleanAttr(unref(submitting)) ? " disabled" : ""} data-v-8e141c43>${ssrInterpolate(unref(submitting) ? "Sending..." : "Submit Enquiry")}</button></div></form>`);
      if (unref(submitted)) {
        _push(`<div class="uk-alert-success uk-margin-top" uk-alert data-v-8e141c43><p data-v-8e141c43><strong data-v-8e141c43>Thank you!</strong> Your enquiry has been submitted. We&#39;ll be in touch soon.</p></div>`);
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/vehicle-enquire/[...params].vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const ____params_ = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-8e141c43"]]);

export { ____params_ as default };
//# sourceMappingURL=_...params_-BhH-h2i3.mjs.map
