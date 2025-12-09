import { defineComponent, withAsyncContext, computed, reactive, ref, mergeProps, defineAsyncComponent, unref, withCtx, createTextVNode, useSSRContext } from 'vue';
import { d as __nuxt_component_0$1 } from './server.mjs';
import { ssrRenderAttrs, ssrRenderComponent, ssrIncludeBooleanAttr, ssrLooseContain, ssrLooseEqual, ssrRenderList, ssrRenderAttr, ssrInterpolate } from 'vue/server-renderer';
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

const __nuxt_component_0_lazy = defineAsyncComponent(() => import('./PageSchema-G9WhHOpc.mjs').then((c) => c.default || c));
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "test-drive",
  __ssrInlineRender: true,
  async setup(__props) {
    let __temp, __restore;
    useSiteMeta({
      title: "Book a Test Drive",
      description: "Book a test drive at Sale Hyundai. Experience our range of vehicles."
    });
    const { data } = ([__temp, __restore] = withAsyncContext(() => useFetch("/api/all-variants", {
      lazy: true,
      default: () => ({ variants: [] })
    }, "$3rzjp5Yur8")), __temp = await __temp, __restore(), __temp);
    const vehicles = computed(() => data.value?.variants || []);
    const minDate = computed(() => {
      const tomorrow = /* @__PURE__ */ new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow.toISOString().split("T")[0];
    });
    const form = reactive({
      vehicle: "",
      preferredDate: "",
      preferredTime: "",
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      comments: "",
      consent: false
    });
    const submitting = ref(false);
    const submitted = ref(false);
    return (_ctx, _push, _parent, _attrs) => {
      const _component_LazyPageSchema = __nuxt_component_0_lazy;
      const _component_NuxtLink = __nuxt_component_0$1;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "test-drive-page" }, _attrs))}>`);
      _push(ssrRenderComponent(_component_LazyPageSchema, null, null, _parent));
      _push(`<div class="uk-section uk-section-primary uk-light uk-text-center"><div class="uk-container"><h1 class="uk-heading-medium">Book a Test Drive</h1><p class="uk-text-lead">Experience the Hyundai difference firsthand</p></div></div><div class="uk-section"><div class="uk-container uk-container-small"><div class="uk-card uk-card-default uk-card-body"><h2 class="uk-card-title uk-text-center uk-margin-medium-bottom"> Schedule Your Test Drive </h2><form class="uk-form-stacked"><div class="uk-margin"><label class="uk-form-label" for="vehicle">Select a Vehicle *</label><select id="vehicle" class="uk-select" required><option value=""${ssrIncludeBooleanAttr(Array.isArray(unref(form).vehicle) ? ssrLooseContain(unref(form).vehicle, "") : ssrLooseEqual(unref(form).vehicle, "")) ? " selected" : ""}>Choose a model</option><!--[-->`);
      ssrRenderList(unref(vehicles), (vehicle) => {
        _push(`<option${ssrRenderAttr("value", vehicle.name)}${ssrIncludeBooleanAttr(Array.isArray(unref(form).vehicle) ? ssrLooseContain(unref(form).vehicle, vehicle.name) : ssrLooseEqual(unref(form).vehicle, vehicle.name)) ? " selected" : ""}>${ssrInterpolate(vehicle.name)}</option>`);
      });
      _push(`<!--]--></select></div><div class="uk-grid uk-grid-small uk-child-width-1-2@s" uk-grid><div><label class="uk-form-label" for="date">Preferred Date *</label><input id="date"${ssrRenderAttr("value", unref(form).preferredDate)} type="date" class="uk-input"${ssrRenderAttr("min", unref(minDate))} required></div><div><label class="uk-form-label" for="time">Preferred Time</label><select id="time" class="uk-select"><option value=""${ssrIncludeBooleanAttr(Array.isArray(unref(form).preferredTime) ? ssrLooseContain(unref(form).preferredTime, "") : ssrLooseEqual(unref(form).preferredTime, "")) ? " selected" : ""}>Flexible</option><option value="9:00 AM"${ssrIncludeBooleanAttr(Array.isArray(unref(form).preferredTime) ? ssrLooseContain(unref(form).preferredTime, "9:00 AM") : ssrLooseEqual(unref(form).preferredTime, "9:00 AM")) ? " selected" : ""}>9:00 AM</option><option value="10:00 AM"${ssrIncludeBooleanAttr(Array.isArray(unref(form).preferredTime) ? ssrLooseContain(unref(form).preferredTime, "10:00 AM") : ssrLooseEqual(unref(form).preferredTime, "10:00 AM")) ? " selected" : ""}>10:00 AM</option><option value="11:00 AM"${ssrIncludeBooleanAttr(Array.isArray(unref(form).preferredTime) ? ssrLooseContain(unref(form).preferredTime, "11:00 AM") : ssrLooseEqual(unref(form).preferredTime, "11:00 AM")) ? " selected" : ""}>11:00 AM</option><option value="12:00 PM"${ssrIncludeBooleanAttr(Array.isArray(unref(form).preferredTime) ? ssrLooseContain(unref(form).preferredTime, "12:00 PM") : ssrLooseEqual(unref(form).preferredTime, "12:00 PM")) ? " selected" : ""}>12:00 PM</option><option value="1:00 PM"${ssrIncludeBooleanAttr(Array.isArray(unref(form).preferredTime) ? ssrLooseContain(unref(form).preferredTime, "1:00 PM") : ssrLooseEqual(unref(form).preferredTime, "1:00 PM")) ? " selected" : ""}>1:00 PM</option><option value="2:00 PM"${ssrIncludeBooleanAttr(Array.isArray(unref(form).preferredTime) ? ssrLooseContain(unref(form).preferredTime, "2:00 PM") : ssrLooseEqual(unref(form).preferredTime, "2:00 PM")) ? " selected" : ""}>2:00 PM</option><option value="3:00 PM"${ssrIncludeBooleanAttr(Array.isArray(unref(form).preferredTime) ? ssrLooseContain(unref(form).preferredTime, "3:00 PM") : ssrLooseEqual(unref(form).preferredTime, "3:00 PM")) ? " selected" : ""}>3:00 PM</option><option value="4:00 PM"${ssrIncludeBooleanAttr(Array.isArray(unref(form).preferredTime) ? ssrLooseContain(unref(form).preferredTime, "4:00 PM") : ssrLooseEqual(unref(form).preferredTime, "4:00 PM")) ? " selected" : ""}>4:00 PM</option></select></div></div><h3 class="uk-h4 uk-margin-medium-top">Your Contact Details</h3><div class="uk-grid uk-grid-small uk-child-width-1-2@s" uk-grid><div><label class="uk-form-label" for="firstName">First Name *</label><input id="firstName"${ssrRenderAttr("value", unref(form).firstName)} type="text" class="uk-input" required></div><div><label class="uk-form-label" for="lastName">Last Name *</label><input id="lastName"${ssrRenderAttr("value", unref(form).lastName)} type="text" class="uk-input" required></div></div><div class="uk-grid uk-grid-small uk-child-width-1-2@s" uk-grid><div><label class="uk-form-label" for="email">Email *</label><input id="email"${ssrRenderAttr("value", unref(form).email)} type="email" class="uk-input" required></div><div><label class="uk-form-label" for="phone">Phone *</label><input id="phone"${ssrRenderAttr("value", unref(form).phone)} type="tel" class="uk-input" required></div></div><div class="uk-margin"><label class="uk-form-label" for="comments">Additional Comments</label><textarea id="comments" class="uk-textarea" rows="3" placeholder="Any specific requirements or questions?">${ssrInterpolate(unref(form).comments)}</textarea></div><div class="uk-margin"><label><input${ssrIncludeBooleanAttr(Array.isArray(unref(form).consent) ? ssrLooseContain(unref(form).consent, null) : unref(form).consent) ? " checked" : ""} type="checkbox" class="uk-checkbox" required> I agree to the `);
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
      _push(`</label></div><div class="uk-margin-medium-top"><button type="submit" class="uk-button uk-button-primary uk-width-1-1"${ssrIncludeBooleanAttr(unref(submitting)) ? " disabled" : ""}>`);
      if (unref(submitting)) {
        _push(`<span uk-spinner="ratio: 0.6"></span>`);
      } else {
        _push(`<!---->`);
      }
      _push(` ${ssrInterpolate(unref(submitting) ? "Booking..." : "Book Test Drive")}</button></div></form>`);
      if (unref(submitted)) {
        _push(`<div class="uk-alert-success uk-margin-top" uk-alert><p><strong>Thank you!</strong> Your test drive request has been submitted. We&#39;ll contact you shortly to confirm your appointment. </p></div>`);
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/test-drive.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=test-drive-CHVvuV6A.mjs.map
