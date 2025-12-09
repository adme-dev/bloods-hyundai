import { defineComponent, computed, ref, withAsyncContext, mergeProps, defineAsyncComponent, unref, isRef, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate, ssrRenderStyle } from 'vue/server-renderer';
import { u as useSiteMeta } from './useSiteMeta-CKVCOIy3.mjs';
import { _ as _export_sfc, u as useMainStore, a as useRoute } from './server.mjs';
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
const __nuxt_component_1_lazy = defineAsyncComponent(() => import('./PostContent-ViI540rn.mjs').then((c) => c.default || c));
const __nuxt_component_2_lazy = defineAsyncComponent(() => import('./ContactDetails-D5iTKAAn.mjs').then((c) => c.default || c));
const __nuxt_component_3_lazy = defineAsyncComponent(() => import('./SlidingTabs-D2TUIMKj.mjs').then((c) => c.default || c));
const __nuxt_component_4_lazy = defineAsyncComponent(() => import('./ContactForm-CELiM3He.mjs').then((c) => c.default || c));
const __nuxt_component_5_lazy = defineAsyncComponent(() => import('./FinanceForm-Be8BTUO5.mjs').then((c) => c.default || c));
const __nuxt_component_6_lazy = defineAsyncComponent(() => import('./ServiceForm-CF-7cQVL.mjs').then((c) => c.default || c));
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "contact",
  __ssrInlineRender: true,
  async setup(__props) {
    let __temp, __restore;
    useSiteMeta({
      title: "Contact Us",
      description: "Contact Sale Hyundai for sales, service, parts, and finance enquiries."
    });
    const mainStore = useMainStore();
    const siteName = computed(() => mainStore.site?.name || "Sale Hyundai");
    const route = useRoute();
    const isContactPage = computed(
      () => ["/contact", "/contact-us"].includes(route.fullPath)
    );
    const activeTab = ref(0);
    const tabs = ["Sales", "Parts", "Finance", "Service", "General"];
    const pageSlug = computed(() => mainStore.site?.pages?.contact || "contact");
    const { data: page } = ([__temp, __restore] = withAsyncContext(() => useFetch(`/api/pages/${pageSlug.value}`, {
      lazy: true,
      default: () => null
    }, "$kcj30KMuLU")), __temp = await __temp, __restore(), __temp);
    return (_ctx, _push, _parent, _attrs) => {
      const _component_LazyPageSchema = __nuxt_component_0_lazy;
      const _component_LazyPostContent = __nuxt_component_1_lazy;
      const _component_LazyContactDetails = __nuxt_component_2_lazy;
      const _component_LazySlidingTabs = __nuxt_component_3_lazy;
      const _component_LazyContactForm = __nuxt_component_4_lazy;
      const _component_LazyFinanceForm = __nuxt_component_5_lazy;
      const _component_LazyServiceForm = __nuxt_component_6_lazy;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "contact-page uk-background-muted multi-form" }, _attrs))} data-v-deef96d8>`);
      _push(ssrRenderComponent(_component_LazyPageSchema, null, null, _parent));
      if (unref(page)) {
        _push(`<div data-v-deef96d8>`);
        _push(ssrRenderComponent(_component_LazyPostContent, {
          content: unref(page).content?.rendered || ""
        }, null, _parent));
        _push(`</div>`);
      } else {
        _push(`<!---->`);
      }
      if (unref(isContactPage)) {
        _push(ssrRenderComponent(_component_LazyContactDetails, { classes: "uk-padding-small uk-background-default uk-box-shadow-small" }, null, _parent));
      } else {
        _push(`<!---->`);
      }
      _push(`<div class="contact-form uk-padding-small" data-v-deef96d8><div class="uk-text-center uk-margin-medium-top" data-v-deef96d8><div class="uk-h1 uk-margin-remove" data-v-deef96d8>Contact ${ssrInterpolate(unref(siteName))}</div></div><div class="uk-container uk-flex uk-flex-center uk-margin-auto uk-margin-auto multiform uk-list uk-text-secondary uk-subnav-pill uk-margin-medium-top uk-grid-collapse" data-v-deef96d8>`);
      _push(ssrRenderComponent(_component_LazySlidingTabs, {
        modelValue: unref(activeTab),
        "onUpdate:modelValue": ($event) => isRef(activeTab) ? activeTab.value = $event : null,
        tabs
      }, null, _parent));
      _push(`</div><ul class="uk-grid-collapse uk-margin-auto uk-flex uk-flex-center uk-container uk-container-large uk-grid" data-v-deef96d8><li class="uk-width-1-1" style="${ssrRenderStyle(unref(activeTab) === 0 ? null : { display: "none" })}" data-v-deef96d8>`);
      _push(ssrRenderComponent(_component_LazyContactForm, {
        id: "sales",
        "active-hours-tab": "contact_form",
        "form-type": "contact"
      }, null, _parent));
      _push(`</li><li class="uk-width-1-1" style="${ssrRenderStyle(unref(activeTab) === 1 ? null : { display: "none" })}" data-v-deef96d8>`);
      _push(ssrRenderComponent(_component_LazyContactForm, {
        id: "parts",
        "active-hours-tab": "parts_form",
        "form-type": "parts"
      }, null, _parent));
      _push(`</li><li class="uk-width-1-1@l" style="${ssrRenderStyle(unref(activeTab) === 2 ? null : { display: "none" })}" data-v-deef96d8><div class="uk-width-1-2@l uk-padding uk-margin-auto uk-text-center" data-v-deef96d8><h3 data-v-deef96d8>Do you need assistance in sourcing car finance? Our friendly team at ${ssrInterpolate(unref(siteName))} can help you find the best solution to suit your needs and budget.</h3></div>`);
      _push(ssrRenderComponent(_component_LazyFinanceForm, { id: "finance" }, null, _parent));
      _push(`</li><li class="uk-width-3-5@l" style="${ssrRenderStyle(unref(activeTab) === 3 ? null : { display: "none" })}" data-v-deef96d8>`);
      _push(ssrRenderComponent(_component_LazyServiceForm, { id: "service" }, null, _parent));
      _push(`</li><li class="uk-width-1-1" style="${ssrRenderStyle(unref(activeTab) === 4 ? null : { display: "none" })}" data-v-deef96d8>`);
      _push(ssrRenderComponent(_component_LazyContactForm, {
        id: "general",
        "active-hours-tab": "contact_form",
        "form-type": "contact"
      }, null, _parent));
      _push(`</li></ul></div></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/contact.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const contact = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-deef96d8"]]);

export { contact as default };
//# sourceMappingURL=contact-CIJz01LH.mjs.map
