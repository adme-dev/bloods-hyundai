import { _ as _export_sfc, e as useNuxtApp, k as useRouter, u as useMainStore, d as __nuxt_component_0$1, j as __nuxt_component_1$1 } from './server.mjs';
import { defineComponent, ref, computed, mergeProps, unref, withCtx, createTextVNode, toDisplayString, createVNode, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrInterpolate, ssrRenderAttr, ssrRenderList, ssrRenderComponent } from 'vue/server-renderer';
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
  __name: "MobileNavNew",
  __ssrInlineRender: true,
  setup(__props) {
    const { $uikit } = useNuxtApp();
    useRouter();
    const mainStore = useMainStore();
    const searchQuery = ref("");
    const siteName = computed(() => mainStore.site?.name || "Sale Hyundai");
    const showroomAddress = computed(() => mainStore.site?.showroom_address || "");
    const serviceAddress = computed(() => mainStore.site?.service_address || mainStore.site?.showroom_address || "");
    const phoneSales = computed(() => mainStore.site?.phone || "");
    const phoneService = computed(() => mainStore.site?.phone_service || mainStore.site?.phone || "");
    const phoneSalesFormatted = computed(() => phoneSales.value.replace(/[^0-9]/g, ""));
    const phoneServiceFormatted = computed(() => phoneService.value.replace(/[^0-9]/g, ""));
    const social = computed(() => mainStore.site?.social || {});
    const serviceBookingUrl = computed(() => mainStore.site?.service_booking_url || "#");
    const footerLinks = computed(() => {
      return mainStore.site?.footer || [
        { heading: "Shop", links: [{ title: "New Cars", url: "/build-and-price" }, { title: "Used Cars", url: "/car-sales" }] },
        { heading: "Services", links: [{ title: "Service", url: "/service" }, { title: "Finance", url: "/finance" }] },
        { heading: "Contact", links: [{ title: "Contact Us", url: "/contact" }] }
      ];
    });
    computed(() => {
      return mainStore.site?.trading_hours || {
        sales: { "Mon-Fri": "8:30am - 5:30pm", Saturday: "8:30am - 4pm", Sunday: "Closed" },
        service: { "Mon-Fri": "7:30am - 5:00pm", Saturday: "8:00am - 12pm", Sunday: "Closed" }
      };
    });
    const closeNav = () => {
    };
    const isLinkExternal = (url) => {
      return /^(http|https):\/\//.test(url);
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0$1;
      const _component_ClientOnly = __nuxt_component_1$1;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "uk-background-default" }, _attrs))} data-v-e378739b><div id="mobile-nav-drawer" uk-offcanvas="mode: slide; overlay: true" data-v-e378739b><div class="uk-offcanvas-bar uk-padding-remove" data-v-e378739b><div class="uk-padding-small uk-background-primary uk-light uk-flex uk-flex-between uk-flex-middle" data-v-e378739b><span class="uk-h4 uk-margin-remove" data-v-e378739b>${ssrInterpolate(unref(siteName))}</span><button class="uk-offcanvas-close uk-icon" type="button" uk-close data-v-e378739b></button></div><div class="uk-padding-small" data-v-e378739b><form data-v-e378739b><div class="uk-inline uk-width-1-1" data-v-e378739b><span class="uk-form-icon" uk-icon="icon: search" data-v-e378739b></span><input${ssrRenderAttr("value", unref(searchQuery))} type="text" class="uk-input" placeholder="Search vehicles..." data-v-e378739b></div></form><a${ssrRenderAttr("href", unref(serviceBookingUrl))} target="_blank" class="uk-button uk-button-secondary uk-button-large uk-border-rounded uk-width-1-1 uk-margin-medium-top" data-v-e378739b> Book a Service </a></div><ul class="uk-padding-small uk-overflow-hidden uk-margin-large-bottom" uk-accordion="multiple: true" data-v-e378739b><li data-v-e378739b><a href="#" class="uk-accordion-title nav-title uk-text-bold" data-v-e378739b> Stock Search <span class="uk-float-right" uk-icon="arrow-right" data-v-e378739b></span></a></li><li data-v-e378739b><a href="#offcanvas-models" uk-toggle class="uk-accordion-title nav-title uk-text-bold" data-v-e378739b> Models <span class="uk-float-right" uk-icon="arrow-right" data-v-e378739b></span></a></li><!--[-->`);
      ssrRenderList(unref(footerLinks), (section, index) => {
        _push(`<li class="uk-open" data-v-e378739b><a class="uk-accordion-title nav-title toggle uk-text-bold" href="#" data-v-e378739b>${ssrInterpolate(section.heading)} <span class="uk-float-right" uk-icon="chevron-down" data-v-e378739b></span></a><div class="uk-accordion-content nav-content" data-v-e378739b><ul class="uk-list uk-h4 uk-link-text uk-margin-small-left" data-v-e378739b>`);
        if (index === 0) {
          _push(`<li data-v-e378739b><a href="#" class="mb-link" data-v-e378739b>Stock Search</a></li>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<!--[-->`);
        ssrRenderList(section.links, (link) => {
          _push(`<li class="el-content uk-panel" data-v-e378739b>`);
          if (isLinkExternal(link.url)) {
            _push(`<a${ssrRenderAttr("href", link.url)} class="mb-link" rel="nofollow" target="_blank" data-v-e378739b>${ssrInterpolate(link.title)}</a>`);
          } else {
            _push(ssrRenderComponent(_component_NuxtLink, {
              to: link.url,
              title: link.title,
              class: "mb-link",
              onClick: closeNav
            }, {
              default: withCtx((_, _push2, _parent2, _scopeId) => {
                if (_push2) {
                  _push2(`${ssrInterpolate(link.title)}`);
                } else {
                  return [
                    createTextVNode(toDisplayString(link.title), 1)
                  ];
                }
              }),
              _: 2
            }, _parent));
          }
          _push(`</li>`);
        });
        _push(`<!--]--></ul></div></li>`);
      });
      _push(`<!--]--><li data-v-e378739b><a class="uk-accordion-title nav-title toggle uk-text-bold" href="#" data-v-e378739b> Trading Hours <span class="uk-float-right" uk-icon="chevron-down" data-v-e378739b></span></a><div class="uk-accordion-content nav-content" data-v-e378739b>`);
      _push(ssrRenderComponent(_component_ClientOnly, null, {
        fallback: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="uk-padding-small uk-text-muted" data-v-e378739b${_scopeId}>Loading hours...</div>`);
          } else {
            return [
              createVNode("div", { class: "uk-padding-small uk-text-muted" }, "Loading hours...")
            ];
          }
        })
      }, _parent));
      _push(`</div></li><li class="uk-nav-divider" data-v-e378739b></li><li data-v-e378739b>`);
      if (unref(social)) {
        _push(`<div class="uk-child-width-auto uk-grid-small uk-flex-inline uk-margin-small-top uk-margin-small-left uk-grid" uk-grid data-v-e378739b><!--[-->`);
        ssrRenderList(unref(social), (url, platform) => {
          _push(`<div data-v-e378739b><a class="el-link uk-icon-button uk-icon" target="_blank" rel="noreferrer"${ssrRenderAttr("href", url)}${ssrRenderAttr("uk-icon", `icon:${platform}`)} data-v-e378739b></a></div>`);
        });
        _push(`<!--]--></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</li><li data-v-e378739b><div class="uk-padding-small" data-v-e378739b><div class="uk-text-bold nav-title" data-v-e378739b>Showroom:</div><div class="uk-margin-small-left" data-v-e378739b><p data-v-e378739b>${ssrInterpolate(unref(showroomAddress))}</p><a${ssrRenderAttr("href", `tel:${unref(phoneSalesFormatted)}`)} class="forcelink uk-display-block" data-v-e378739b><span class="uk-link-heading uk-text-secondary" data-v-e378739b> Sales: <b data-v-e378739b>${ssrInterpolate(unref(phoneSales))}</b></span></a></div></div></li><li data-v-e378739b><div class="uk-padding-small" data-v-e378739b><div class="uk-text-bold nav-title" data-v-e378739b>Service / Parts:</div><div class="uk-margin-small-left" data-v-e378739b><p data-v-e378739b>${ssrInterpolate(unref(serviceAddress))}</p><a${ssrRenderAttr("href", `tel:${unref(phoneServiceFormatted)}`)} class="forcelink uk-display-block" data-v-e378739b><span class="uk-link-heading uk-text-secondary" data-v-e378739b> Service / Parts: <b data-v-e378739b>${ssrInterpolate(unref(phoneService))}</b></span></a></div></div></li></ul></div></div></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/menus/MobileNavNew.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const MobileNavNew = /* @__PURE__ */ Object.assign(_export_sfc(_sfc_main, [["__scopeId", "data-v-e378739b"]]), { __name: "MobileNavNew" });

export { MobileNavNew as default };
//# sourceMappingURL=MobileNavNew-D8a1BjWd.mjs.map
