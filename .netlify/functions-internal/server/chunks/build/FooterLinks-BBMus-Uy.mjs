import { _ as _export_sfc, u as useMainStore, j as __nuxt_component_1$1, d as __nuxt_component_0$1 } from './server.mjs';
import { defineComponent, computed, mergeProps, unref, withCtx, createVNode, createTextVNode, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate, ssrRenderAttr } from 'vue/server-renderer';
import { p as publicAssetsURL } from '../routes/renderer.mjs';
import '../nitro/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'consola';
import 'vue-router';
import 'lodash-es';
import 'vue-bundle-renderer/runtime';
import 'unhead/server';
import 'devalue';
import 'unhead/utils';

const _imports_0 = publicAssetsURL("/assets/logos/logo-white-sm.svg");
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "FooterLinks",
  __ssrInlineRender: true,
  setup(__props) {
    const mainStore = useMainStore();
    const siteName = computed(() => mainStore.site?.name || "Sale Hyundai");
    const showroomAddress = computed(() => mainStore.site?.showroom_address || "");
    const phone = computed(() => mainStore.site?.phone || "");
    const phoneFormatted = computed(() => phone.value.replace(/[^0-9]/g, ""));
    computed(() => {
      const socialData = mainStore.site?.social;
      if (!socialData || Array.isArray(socialData) && socialData.length === 0) {
        return null;
      }
      return socialData;
    });
    const currentYear = (/* @__PURE__ */ new Date()).getFullYear();
    computed(() => {
      return mainStore.site?.sitelinks?.footer || [
        {
          heading: "Shop",
          links: [
            { title: "New Cars", url: "/build-and-price" },
            { title: "Used Cars", url: "/car-sales" },
            { title: "Special Offers", url: "/special-offers" },
            { title: "Sell Your Car", url: "/sell-my-car" }
          ]
        },
        {
          heading: "Services",
          links: [
            { title: "Book a Service", url: "/service" },
            { title: "Parts", url: "/parts" },
            { title: "Finance", url: "/finance" },
            { title: "Insurance", url: "/insurance" }
          ]
        },
        {
          heading: "About",
          links: [
            { title: "Contact Us", url: "/contact" },
            { title: "About Us", url: "/about" },
            { title: "Careers", url: "/careers" },
            { title: "Site Map", url: "/site-map" }
          ]
        }
      ];
    });
    const vehicles = computed(() => mainStore.models || []);
    computed(() => {
      const categories = /* @__PURE__ */ new Set();
      vehicles.value.forEach((v) => {
        if (v.category) categories.add(v.category);
      });
      return Array.from(categories);
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_ClientOnly = __nuxt_component_1$1;
      const _component_NuxtLink = __nuxt_component_0$1;
      _push(`<div${ssrRenderAttrs(mergeProps({
        class: "uk-background-secondary uk-light",
        role: "contentinfo"
      }, _attrs))} data-v-7106c8f6><div class="site-footer uk-width-1-1" data-v-7106c8f6><div class="uk-section uk-section-small" data-v-7106c8f6><div class="uk-container uk-container-large" data-v-7106c8f6>`);
      _push(ssrRenderComponent(_component_ClientOnly, null, {}, _parent));
      _push(`<div class="uk-width-1-1 uk-margin-medium-top" data-v-7106c8f6><div class="uk-h5 uk-text-bold uk-text-capitalize uk-flex uk-flex-middle" data-v-7106c8f6><div class="uk-margin-auto-right" data-v-7106c8f6><div data-v-7106c8f6>${ssrInterpolate(unref(siteName))}</div><div class="uk-text-muted" data-v-7106c8f6>${ssrInterpolate(unref(showroomAddress))}</div><div data-v-7106c8f6><a${ssrRenderAttr("href", `tel:${unref(phoneFormatted)}`)} class="forcelink" data-v-7106c8f6><span class="uk-button uk-button-text" data-v-7106c8f6> Sales / Service / Parts: <b data-v-7106c8f6>${ssrInterpolate(unref(phone))}</b></span></a></div></div><div data-v-7106c8f6><img${ssrRenderAttr("src", _imports_0)} width="60" height="32" class="nav-logo logo-white" loading="lazy"${ssrRenderAttr("alt", unref(siteName))} data-v-7106c8f6></div></div><hr class="uk-visible@m" data-v-7106c8f6></div>`);
      _push(ssrRenderComponent(_component_ClientOnly, null, {
        fallback: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="uk-text-center uk-padding" data-v-7106c8f6${_scopeId}>Loading...</div>`);
          } else {
            return [
              createVNode("div", { class: "uk-text-center uk-padding" }, "Loading...")
            ];
          }
        })
      }, _parent));
      _push(`<div class="uk-margin-medium-top uk-text-center uk-text-small uk-text-muted" data-v-7106c8f6><hr data-v-7106c8f6><p data-v-7106c8f6> © ${ssrInterpolate(unref(currentYear))} ${ssrInterpolate(unref(siteName))}. All rights reserved. `);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/privacy-policy",
        class: "uk-text-muted"
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
      _push(` | `);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/terms-conditions",
        class: "uk-text-muted"
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
      _push(`</p><p class="uk-text-meta" data-v-7106c8f6> Recommended driveaway prices shown are based on postcode 3850 and are subject to change. Please contact dealer for final pricing. </p></div></div></div></div></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/page-elements/FooterLinks.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const FooterLinks = /* @__PURE__ */ Object.assign(_export_sfc(_sfc_main, [["__scopeId", "data-v-7106c8f6"]]), { __name: "FooterLinks" });

export { FooterLinks as default };
//# sourceMappingURL=FooterLinks-BBMus-Uy.mjs.map
