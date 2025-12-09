import { e as useNuxtApp, a as useRoute, u as useMainStore, d as __nuxt_component_0$1 } from './server.mjs';
import { defineComponent, reactive, ref, computed, mergeProps, unref, withCtx, createTextVNode, defineAsyncComponent, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrInterpolate, ssrRenderAttr, ssrRenderClass, ssrRenderList, ssrRenderComponent, ssrRenderStyle } from 'vue/server-renderer';
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

const __nuxt_component_1_lazy = defineAsyncComponent(() => import('./HeaderHours-CGJVt86h.mjs').then((c) => c.default || c));
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "ContactForm",
  __ssrInlineRender: true,
  props: {
    activeHoursTab: { default: "contact_form" },
    id: { default: "contact-form" },
    formType: { default: "contact" }
  },
  setup(__props) {
    const { $uikit } = useNuxtApp();
    useRoute();
    const mainStore = useMainStore();
    const form = reactive({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      registration: "",
      message: ""
    });
    const errors = ref([]);
    const isSending = ref(false);
    const isSent = ref(false);
    const siteName = computed(() => mainStore.site?.name || "Sale Hyundai");
    const hasErrors = computed(() => errors.value.length > 0);
    const formattedPhoneNumber = computed(() => {
      let number = form.phone.replace(/\D/g, "");
      if (number.startsWith("04")) {
        if (number.length <= 4) return number;
        if (number.length <= 7) return `${number.slice(0, 4)} ${number.slice(4)}`;
        return `${number.slice(0, 4)} ${number.slice(4, 7)} ${number.slice(7)}`;
      } else {
        if (number.length <= 2) return number;
        if (number.length <= 6) return `(${number.slice(0, 2)}) ${number.slice(2)}`;
        return `(${number.slice(0, 2)}) ${number.slice(2, 6)} ${number.slice(6)}`;
      }
    });
    const isPhoneValid = computed(() => {
      const phone = formattedPhoneNumber.value;
      const mobileRegex = /^04\d{2}\s?\d{3}\s?\d{3}$/;
      const landlineRegex = /^\(0\d\)\s?\d{4}\s?\d{4}$/;
      return mobileRegex.test(phone) || landlineRegex.test(phone);
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0$1;
      const _component_LazyHeaderHours = __nuxt_component_1_lazy;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "contact-form uk-padding-small" }, _attrs))}><div class="uk-grid-column-small uk-grid-row-large uk-child-width-1-2@m" uk-grid><div><div class="uk-text-center uk-margin-medium-top"><div class="uk-h1 uk-text-bold uk-text-capitalize">Contact ${ssrInterpolate(unref(siteName))}</div><p>At ${ssrInterpolate(unref(siteName))}, your satisfaction is important to us. We&#39;re here to help.</p>`);
      if (__props.activeHoursTab === "parts_form") {
        _push(`<p> Genuine Hyundai Parts are designed to meet the highest level of quality <br class="uk-visible@m"> expected not only by Hyundai, but also by our customers. </p>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<div class="uk-h4 uk-margin-remove">Your Details</div></div><ul${ssrRenderAttr("id", __props.id)} class="uk-hidden" uk-switcher="animation: uk-animation-slide-left-medium, uk-animation-slide-right-medium"><li><a href="#"></a></li><li><a href="#"></a></li></ul><ul class="uk-switcher"><li><div class="uk-width-1-1 small-lead-form"><div class="uk-padding-small"><form novalidate class="${ssrRenderClass({ errors: unref(hasErrors) })}">`);
      if (unref(hasErrors)) {
        _push(`<div class="error-message"><div>Please correct the following error(s):</div><ul class="uk-list uk-list-hyphen uk-hidden"><!--[-->`);
        ssrRenderList(unref(errors), (error, index) => {
          _push(`<li>${ssrInterpolate(error)}</li>`);
        });
        _push(`<!--]--></ul></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<fieldset class="uk-fieldset uk-grid-small uk-grid"><div class="uk-width-1-2@m uk-inline"><input id="first_name"${ssrRenderAttr("value", unref(form).firstName)} class="uk-input uk-form-large" name="first_name" required placeholder="First Name" type="text"><label class="uk-form-label" for="first_name">First Name<sup>*</sup></label><span class="error-message uk-text-small">First name required</span><span class="uk-form-icon" uk-icon="icon: user"></span></div><div class="uk-width-1-2@m uk-inline"><input id="second_name"${ssrRenderAttr("value", unref(form).lastName)} class="uk-input uk-form-large" name="second_name" required placeholder="Last Name" type="text"><label class="uk-form-label" for="second_name">Last Name<sup>*</sup></label><span class="error-message uk-text-small">Last name required</span><span class="uk-form-icon" uk-icon="icon: user"></span></div><div class="uk-width-1-1 uk-inline"><input id="email_a"${ssrRenderAttr("value", unref(form).email)} class="uk-input uk-form-large" name="email_a" required placeholder="Email Address" type="email"><label class="uk-form-label" for="email_a">Email Address<sup>*</sup></label><span class="error-message uk-text-small">Email address required</span><span class="uk-form-icon" uk-icon="icon: mail"></span></div><div class="uk-width-1-1 uk-inline"><input id="phone_n"${ssrRenderAttr("value", unref(formattedPhoneNumber))} class="${ssrRenderClass([{ "error-phone-input": !unref(isPhoneValid) && unref(form).phone }, "uk-input uk-form-large"])}" name="phone_n" placeholder="Phone Number" type="tel"><label class="uk-form-label" for="phone_n">Phone Number<sup>*</sup></label><span class="error-message uk-text-small">Phone not valid</span>`);
      if (!unref(isPhoneValid) && unref(form).phone) {
        _push(`<span class="uk-text-small error-phone">Phone not valid</span>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<span class="uk-form-icon" uk-icon="icon: receiver"></span></div>`);
      if (__props.activeHoursTab === "parts_form") {
        _push(`<div class="uk-width-1-1 uk-inline"><input id="registration"${ssrRenderAttr("value", unref(form).registration)} class="uk-input uk-form-large" name="registration" placeholder="Vehicle Registration" type="text" required><label class="uk-form-label" for="registration">Vehicle Registration</label><span class="error-message uk-text-small">Vehicle Registration required</span><span class="uk-form-icon" uk-icon="icon: file-edit"></span></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<div class="uk-width-1-1 uk-inline message-textarea"><textarea rows="4" class="uk-textarea" name="message" placeholder="Message">${ssrInterpolate(unref(form).message)}</textarea><label class="uk-form-label" for="message">Message</label><span class="uk-form-icon" uk-icon="icon: commenting"></span></div><div class="uk-width-1-1"><p class="uk-text-meta uk-margin-small-top"> Your personal information will be collected, used and stored in strict accordance with our `);
      _push(ssrRenderComponent(_component_NuxtLink, {
        class: "uk-text-primary",
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
      _push(`. Our Privacy Policy contains details on how information is used, how you may access / correct information held and our privacy complaints processes. </p></div></fieldset></form><div class="uk-grid-small uk-margin-medium-top uk-child-width-1-2" uk-grid><div class="uk-margin-auto-left"><button class="uk-button uk-width-1-1 uk-button-primary"> Next </button></div></div></div></div></li><li><div class="uk-width-1-1 uk-inline"><div class="uk-overlay form-overlay-default uk-width-1-1 uk-height-1-1 uk-position-top-left uk-position-z-index" style="${ssrRenderStyle(unref(isSending) ? null : { display: "none" })}"><div class="uk-position-center uk-text-center"><div uk-spinner="ratio: 2"></div><p>Sending...</p></div></div><div class="uk-overlay form-overlay-default uk-width-1-1 uk-height-1-1 uk-position-top-left uk-position-z-index" style="${ssrRenderStyle(unref(isSent) ? null : { display: "none" })}"><div class="uk-position-center uk-text-center form-confirmation"><strong>Hi ${ssrInterpolate(unref(form).firstName)}</strong><div>Thank you for your enquiry. One of our staff members will be in touch shortly.</div></div></div><div class="uk-padding-small"><div><a href="#" class="uk-button uk-button-link uk-link-reset" uk-switcher-item="0"><span uk-icon="chevron-left"></span> Back </a><div class="uk-text-secondary uk-text-bold uk-float-right">Confirm &amp; Send</div></div><ul class="uk-list uk-list-divider uk-padding-small"><li>First Name: <div class="uk-float-right uk-text-bold">${ssrInterpolate(unref(form).firstName)}</div></li><li>Last Name: <div class="uk-float-right uk-text-bold">${ssrInterpolate(unref(form).lastName)}</div></li><li>Email Address: <div class="uk-float-right uk-text-bold">${ssrInterpolate(unref(form).email)}</div></li>`);
      if (unref(form).phone) {
        _push(`<li>Phone Number: <div class="uk-float-right uk-text-bold">${ssrInterpolate(unref(form).phone)}</div></li>`);
      } else {
        _push(`<!---->`);
      }
      if (unref(form).registration) {
        _push(`<li>Vehicle Registration: <div class="uk-float-right uk-text-bold">${ssrInterpolate(unref(form).registration)}</div></li>`);
      } else {
        _push(`<!---->`);
      }
      if (unref(form).message) {
        _push(`<li><div>Message:</div><div>${ssrInterpolate(unref(form).message)}</div></li>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</ul><div class="uk-grid-small uk-margin-small-top uk-margin-medium-bottom" uk-grid><div class="uk-margin-auto"><button class="uk-button uk-button-large border-radius-50 uk-width-1-1 uk-button-primary"> Send Enquiry </button></div></div></div></div></li></ul></div><div><div class="uk-text-center uk-margin-medium-top"><div class="uk-h1 uk-text-bold uk-margin-medium-bottom">Our Trading Hours</div></div><div class="uk-margin--top">`);
      _push(ssrRenderComponent(_component_LazyHeaderHours, {
        "active-tab": __props.activeHoursTab,
        "switch-id": __props.activeHoursTab
      }, null, _parent));
      _push(`</div></div></div></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/page-elements/ContactForm.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const ContactForm = Object.assign(_sfc_main, { __name: "ContactForm" });

export { ContactForm as default };
//# sourceMappingURL=ContactForm-CELiM3He.mjs.map
