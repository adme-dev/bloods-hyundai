import { d as __nuxt_component_0$1 } from './server.mjs';
import { defineComponent, reactive, ref, computed, mergeProps, unref, withCtx, createTextVNode, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderAttr, ssrInterpolate, ssrIncludeBooleanAttr, ssrLooseContain, ssrLooseEqual, ssrRenderComponent } from 'vue/server-renderer';
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

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "ServiceForm",
  __ssrInlineRender: true,
  setup(__props) {
    const form = reactive({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      vehicleMake: "Hyundai",
      vehicleModel: "",
      vehicleRego: "",
      vehicleYear: "",
      vehicleVin: "",
      vehicleOdometer: "",
      preferredDate: "",
      preferredTime: "",
      serviceType: "",
      comments: "",
      consent: false
    });
    const submitting = ref(false);
    const submitted = ref(false);
    const minDate = computed(() => {
      const tomorrow = /* @__PURE__ */ new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const day = tomorrow.getDay();
      if (day === 0) tomorrow.setDate(tomorrow.getDate() + 1);
      if (day === 6) tomorrow.setDate(tomorrow.getDate() + 2);
      return tomorrow.toISOString().split("T")[0];
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0$1;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "service-form uk-section" }, _attrs))}><div class="uk-container uk-container-small"><div class="uk-text-center uk-margin-medium-bottom"><h2 class="uk-h1 uk-margin-remove">Book Your Service</h2><p class="uk-text-lead uk-text-muted">Schedule your next service appointment</p></div>`);
      if (unref(submitted)) {
        _push(`<div class="uk-alert-success uk-text-center" uk-alert><h3>Thank You!</h3><p>Your service booking request has been submitted. We&#39;ll be in touch to confirm your appointment.</p></div>`);
      } else {
        _push(`<form class="uk-form-stacked"><div class="uk-card uk-card-default uk-card-body uk-margin-bottom"><h3 class="uk-card-title">Your Details</h3><div class="uk-grid uk-grid-small" uk-grid><div class="uk-width-1-2@m"><label class="uk-form-label">First Name *</label><input${ssrRenderAttr("value", unref(form).firstName)} type="text" class="uk-input" required></div><div class="uk-width-1-2@m"><label class="uk-form-label">Last Name *</label><input${ssrRenderAttr("value", unref(form).lastName)} type="text" class="uk-input" required></div><div class="uk-width-1-2@m"><label class="uk-form-label">Email *</label><input${ssrRenderAttr("value", unref(form).email)} type="email" class="uk-input" required></div><div class="uk-width-1-2@m"><label class="uk-form-label">Phone *</label><input${ssrRenderAttr("value", unref(form).phone)} type="tel" class="uk-input" required></div></div></div><div class="uk-card uk-card-default uk-card-body uk-margin-bottom"><h3 class="uk-card-title">Vehicle Details</h3><div class="uk-grid uk-grid-small" uk-grid><div class="uk-width-1-2@m"><label class="uk-form-label">Vehicle Make *</label><input${ssrRenderAttr("value", unref(form).vehicleMake)} type="text" class="uk-input" placeholder="e.g. Hyundai" required></div><div class="uk-width-1-2@m"><label class="uk-form-label">Vehicle Model *</label><input${ssrRenderAttr("value", unref(form).vehicleModel)} type="text" class="uk-input" placeholder="e.g. Tucson" required></div><div class="uk-width-1-2@m"><label class="uk-form-label">Registration *</label><input${ssrRenderAttr("value", unref(form).vehicleRego)} type="text" class="uk-input" required></div><div class="uk-width-1-2@m"><label class="uk-form-label">Year *</label><input${ssrRenderAttr("value", unref(form).vehicleYear)} type="text" class="uk-input" maxlength="4" required></div><div class="uk-width-1-2@m"><label class="uk-form-label">VIN/Chassis # (optional)</label><input${ssrRenderAttr("value", unref(form).vehicleVin)} type="text" class="uk-input"></div><div class="uk-width-1-2@m"><label class="uk-form-label">Odometer *</label><input${ssrRenderAttr("value", unref(form).vehicleOdometer)} type="text" class="uk-input" placeholder="e.g. 45000" required></div></div></div><div class="uk-card uk-card-default uk-card-body uk-margin-bottom"><h3 class="uk-card-title">Preferred Booking</h3><div class="uk-grid uk-grid-small" uk-grid><div class="uk-width-1-2@m"><label class="uk-form-label">Preferred Date *</label><input${ssrRenderAttr("value", unref(form).preferredDate)} type="date" class="uk-input"${ssrRenderAttr("min", unref(minDate))} required></div><div class="uk-width-1-2@m"><label class="uk-form-label">Preferred Time</label><select class="uk-select"><option value=""${ssrIncludeBooleanAttr(Array.isArray(unref(form).preferredTime) ? ssrLooseContain(unref(form).preferredTime, "") : ssrLooseEqual(unref(form).preferredTime, "")) ? " selected" : ""}>Any time</option><option value="7:30 AM"${ssrIncludeBooleanAttr(Array.isArray(unref(form).preferredTime) ? ssrLooseContain(unref(form).preferredTime, "7:30 AM") : ssrLooseEqual(unref(form).preferredTime, "7:30 AM")) ? " selected" : ""}>7:30 AM</option><option value="8:00 AM"${ssrIncludeBooleanAttr(Array.isArray(unref(form).preferredTime) ? ssrLooseContain(unref(form).preferredTime, "8:00 AM") : ssrLooseEqual(unref(form).preferredTime, "8:00 AM")) ? " selected" : ""}>8:00 AM</option><option value="8:30 AM"${ssrIncludeBooleanAttr(Array.isArray(unref(form).preferredTime) ? ssrLooseContain(unref(form).preferredTime, "8:30 AM") : ssrLooseEqual(unref(form).preferredTime, "8:30 AM")) ? " selected" : ""}>8:30 AM</option><option value="9:00 AM"${ssrIncludeBooleanAttr(Array.isArray(unref(form).preferredTime) ? ssrLooseContain(unref(form).preferredTime, "9:00 AM") : ssrLooseEqual(unref(form).preferredTime, "9:00 AM")) ? " selected" : ""}>9:00 AM</option><option value="9:30 AM"${ssrIncludeBooleanAttr(Array.isArray(unref(form).preferredTime) ? ssrLooseContain(unref(form).preferredTime, "9:30 AM") : ssrLooseEqual(unref(form).preferredTime, "9:30 AM")) ? " selected" : ""}>9:30 AM</option><option value="10:00 AM"${ssrIncludeBooleanAttr(Array.isArray(unref(form).preferredTime) ? ssrLooseContain(unref(form).preferredTime, "10:00 AM") : ssrLooseEqual(unref(form).preferredTime, "10:00 AM")) ? " selected" : ""}>10:00 AM</option><option value="10:30 AM"${ssrIncludeBooleanAttr(Array.isArray(unref(form).preferredTime) ? ssrLooseContain(unref(form).preferredTime, "10:30 AM") : ssrLooseEqual(unref(form).preferredTime, "10:30 AM")) ? " selected" : ""}>10:30 AM</option><option value="11:00 AM"${ssrIncludeBooleanAttr(Array.isArray(unref(form).preferredTime) ? ssrLooseContain(unref(form).preferredTime, "11:00 AM") : ssrLooseEqual(unref(form).preferredTime, "11:00 AM")) ? " selected" : ""}>11:00 AM</option></select></div><div class="uk-width-1-1"><label class="uk-form-label">Service Type</label><select class="uk-select"><option value=""${ssrIncludeBooleanAttr(Array.isArray(unref(form).serviceType) ? ssrLooseContain(unref(form).serviceType, "") : ssrLooseEqual(unref(form).serviceType, "")) ? " selected" : ""}>Select service type</option><option value="logbook"${ssrIncludeBooleanAttr(Array.isArray(unref(form).serviceType) ? ssrLooseContain(unref(form).serviceType, "logbook") : ssrLooseEqual(unref(form).serviceType, "logbook")) ? " selected" : ""}>Logbook Service</option><option value="minor"${ssrIncludeBooleanAttr(Array.isArray(unref(form).serviceType) ? ssrLooseContain(unref(form).serviceType, "minor") : ssrLooseEqual(unref(form).serviceType, "minor")) ? " selected" : ""}>Minor Service</option><option value="major"${ssrIncludeBooleanAttr(Array.isArray(unref(form).serviceType) ? ssrLooseContain(unref(form).serviceType, "major") : ssrLooseEqual(unref(form).serviceType, "major")) ? " selected" : ""}>Major Service</option><option value="brake"${ssrIncludeBooleanAttr(Array.isArray(unref(form).serviceType) ? ssrLooseContain(unref(form).serviceType, "brake") : ssrLooseEqual(unref(form).serviceType, "brake")) ? " selected" : ""}>Brake Service</option><option value="tyres"${ssrIncludeBooleanAttr(Array.isArray(unref(form).serviceType) ? ssrLooseContain(unref(form).serviceType, "tyres") : ssrLooseEqual(unref(form).serviceType, "tyres")) ? " selected" : ""}>Tyres</option><option value="aircon"${ssrIncludeBooleanAttr(Array.isArray(unref(form).serviceType) ? ssrLooseContain(unref(form).serviceType, "aircon") : ssrLooseEqual(unref(form).serviceType, "aircon")) ? " selected" : ""}>Air Conditioning</option><option value="other"${ssrIncludeBooleanAttr(Array.isArray(unref(form).serviceType) ? ssrLooseContain(unref(form).serviceType, "other") : ssrLooseEqual(unref(form).serviceType, "other")) ? " selected" : ""}>Other</option></select></div><div class="uk-width-1-1"><label class="uk-form-label">Additional Comments</label><textarea class="uk-textarea" rows="3" placeholder="Any specific issues or requests?">${ssrInterpolate(unref(form).comments)}</textarea></div></div></div><div class="uk-margin"><label class="uk-text-small"><input${ssrIncludeBooleanAttr(Array.isArray(unref(form).consent) ? ssrLooseContain(unref(form).consent, null) : unref(form).consent) ? " checked" : ""} type="checkbox" class="uk-checkbox" required> I agree to the `);
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
        _push(` * </label></div><div class="uk-margin-medium-top"><button type="submit" class="uk-button uk-button-primary uk-button-large"${ssrIncludeBooleanAttr(unref(submitting)) ? " disabled" : ""}>${ssrInterpolate(unref(submitting) ? "Submitting..." : "Request Booking")}</button></div></form>`);
      }
      _push(`</div></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/page-elements/ServiceForm.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const ServiceForm = Object.assign(_sfc_main, { __name: "ServiceForm" });

export { ServiceForm as default };
//# sourceMappingURL=ServiceForm-CF-7cQVL.mjs.map
