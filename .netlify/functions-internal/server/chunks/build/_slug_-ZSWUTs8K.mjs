import { defineComponent, computed, withAsyncContext, reactive, ref, mergeProps, defineAsyncComponent, unref, withCtx, createTextVNode, useSSRContext } from 'vue';
import { a as useRoute, d as __nuxt_component_0$1 } from './server.mjs';
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate, ssrRenderAttr, ssrRenderList, ssrIncludeBooleanAttr, ssrLooseContain } from 'vue/server-renderer';
import { u as useFetch } from './fetch-5f528j00.mjs';
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
import '@vue/shared';

const __nuxt_component_0_lazy = defineAsyncComponent(() => import('./PageSchema-G9WhHOpc.mjs').then((c) => c.default || c));
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "[slug]",
  __ssrInlineRender: true,
  async setup(__props) {
    let __temp, __restore;
    const route = useRoute();
    const slug = computed(() => route.params.slug);
    const { data: variant, pending } = ([__temp, __restore] = withAsyncContext(() => useFetch("/api/variant-details", {
      params: { variantId: slug },
      transform: (data) => data.variant,
      lazy: true
    }, "$evuQk_X4H8")), __temp = await __temp, __restore(), __temp);
    useSiteMeta({
      title: () => `Enquire - ${variant.value?.name || "Vehicle"}`,
      description: () => `Get a quote for the ${variant.value?.name || "vehicle"} at Sale Hyundai.`
    });
    const form = reactive({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      postcode: "",
      comments: "",
      testDrive: false,
      consent: false
    });
    const submitting = ref(false);
    const submitted = ref(false);
    return (_ctx, _push, _parent, _attrs) => {
      const _component_LazyPageSchema = __nuxt_component_0_lazy;
      const _component_NuxtLink = __nuxt_component_0$1;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "variant-enquire-page" }, _attrs))}>`);
      _push(ssrRenderComponent(_component_LazyPageSchema, null, null, _parent));
      if (unref(pending)) {
        _push(`<div class="uk-section uk-text-center"><div uk-spinner="ratio: 2"></div><p class="uk-margin-top">Loading...</p></div>`);
      } else if (unref(variant)) {
        _push(`<div><div class="uk-section uk-section-primary uk-light"><div class="uk-container"><div class="uk-grid uk-grid-large uk-flex-middle" uk-grid><div class="uk-width-1-2@m"><h1 class="uk-heading-small">Enquire About ${ssrInterpolate(unref(variant).name)}</h1>`);
        if (unref(variant).startingPrice) {
          _push(`<p class="uk-h3 uk-margin-small-top"> From ${ssrInterpolate(unref(variant).startingPrice)}</p>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div><div class="uk-width-1-2@m">`);
        if (unref(variant).image) {
          _push(`<img${ssrRenderAttr("src", unref(variant).image)}${ssrRenderAttr("alt", unref(variant).name)} class="uk-width-1-1">`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></div></div></div><div class="uk-section"><div class="uk-container"><div class="uk-grid uk-grid-large" uk-grid><div class="uk-width-1-3@m"><div class="uk-card uk-card-default uk-card-body"><h3 class="uk-card-title">${ssrInterpolate(unref(variant).name)}</h3>`);
        if (unref(variant).highlights) {
          _push(`<ul class="uk-list uk-list-disc"><!--[-->`);
          ssrRenderList(unref(variant).highlights, (highlight, index) => {
            _push(`<li>${ssrInterpolate(highlight)}</li>`);
          });
          _push(`<!--]--></ul>`);
        } else {
          _push(`<!---->`);
        }
        if (unref(variant).specifications) {
          _push(`<div class="uk-margin-top"><h4>Key Specs</h4><dl class="uk-description-list"><!--[-->`);
          ssrRenderList(unref(variant).specifications, (value, key) => {
            _push(`<!--[--><dt>${ssrInterpolate(key)}</dt><dd>${ssrInterpolate(value)}</dd><!--]-->`);
          });
          _push(`<!--]--></dl></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></div><div class="uk-width-2-3@m"><div class="uk-card uk-card-default uk-card-body"><h2 class="uk-card-title">Get a Quote</h2><p class="uk-text-muted">Fill in your details and we&#39;ll get back to you with a personalized quote.</p><form class="uk-form-stacked uk-margin-medium-top"><div class="uk-grid uk-grid-small uk-child-width-1-2@s" uk-grid><div><label class="uk-form-label">First Name *</label><input${ssrRenderAttr("value", unref(form).firstName)} type="text" class="uk-input" required></div><div><label class="uk-form-label">Last Name *</label><input${ssrRenderAttr("value", unref(form).lastName)} type="text" class="uk-input" required></div></div><div class="uk-grid uk-grid-small uk-child-width-1-2@s" uk-grid><div><label class="uk-form-label">Email *</label><input${ssrRenderAttr("value", unref(form).email)} type="email" class="uk-input" required></div><div><label class="uk-form-label">Phone *</label><input${ssrRenderAttr("value", unref(form).phone)} type="tel" class="uk-input" required></div></div><div class="uk-margin"><label class="uk-form-label">Postcode</label><input${ssrRenderAttr("value", unref(form).postcode)} type="text" class="uk-input uk-form-width-small" maxlength="4"></div><div class="uk-margin"><label class="uk-form-label">Comments</label><textarea class="uk-textarea" rows="3">${ssrInterpolate(unref(form).comments)}</textarea></div><div class="uk-margin"><label><input${ssrIncludeBooleanAttr(Array.isArray(unref(form).testDrive) ? ssrLooseContain(unref(form).testDrive, null) : unref(form).testDrive) ? " checked" : ""} type="checkbox" class="uk-checkbox"> I&#39;d like to book a test drive </label></div><div class="uk-margin"><label><input${ssrIncludeBooleanAttr(Array.isArray(unref(form).consent) ? ssrLooseContain(unref(form).consent, null) : unref(form).consent) ? " checked" : ""} type="checkbox" class="uk-checkbox" required> I agree to the `);
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
        _push(`</label></div><div class="uk-margin-medium-top"><button type="submit" class="uk-button uk-button-primary uk-button-large"${ssrIncludeBooleanAttr(unref(submitting)) ? " disabled" : ""}>${ssrInterpolate(unref(submitting) ? "Sending..." : "Submit Enquiry")}</button></div></form>`);
        if (unref(submitted)) {
          _push(`<div class="uk-alert-success uk-margin-top" uk-alert><p><strong>Thank you!</strong> We&#39;ve received your enquiry and will be in touch soon.</p></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></div></div></div></div></div>`);
      } else {
        _push(`<div class="uk-section uk-text-center"><h2>Vehicle Not Found</h2>`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: "/build-and-price",
          class: "uk-button uk-button-primary"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`View All Models`);
            } else {
              return [
                createTextVNode("View All Models")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</div>`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/variant/[slug].vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=_slug_-ZSWUTs8K.mjs.map
