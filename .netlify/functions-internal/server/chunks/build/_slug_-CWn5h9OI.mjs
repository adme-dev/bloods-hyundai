import { defineComponent, computed, withAsyncContext, mergeProps, defineAsyncComponent, unref, withCtx, createTextVNode, useSSRContext } from 'vue';
import { _ as _export_sfc, a as useRoute, u as useMainStore, b as useRuntimeConfig, d as __nuxt_component_0$1 } from './server.mjs';
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate, ssrRenderList, ssrRenderAttr, ssrRenderStyle, ssrRenderClass } from 'vue/server-renderer';
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
    const mainStore = useMainStore();
    const config = useRuntimeConfig();
    const vehicleId = computed(() => route.params.id);
    const { data: vehicle, pending } = ([__temp, __restore] = withAsyncContext(() => useFetch(`${config.public.apiUrl}/vehicle/${vehicleId.value}`, {
      lazy: true,
      transform: (data) => data.vehicle || data
    }, "$CvXz5M0KMK")), __temp = await __temp, __restore(), __temp);
    useSiteMeta({
      title: () => vehicle.value?.title || "Vehicle for Sale",
      description: () => `${vehicle.value?.year || ""} ${vehicle.value?.make || ""} ${vehicle.value?.model || ""} for sale at Sale Hyundai.`,
      image: () => vehicle.value?.images?.[0]
    });
    const phone = computed(() => mainStore.site?.phone?.replace(/\s/g, "") || "");
    const conditionClass = computed(() => {
      switch (vehicle.value?.condition?.toLowerCase()) {
        case "new":
          return "uk-badge-success";
        case "demo":
          return "uk-badge-warning";
        default:
          return "";
      }
    });
    const formatKey = (key) => {
      return key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase()).trim();
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_LazyPageSchema = __nuxt_component_0_lazy;
      const _component_NuxtLink = __nuxt_component_0$1;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "vehicle-for-sale-page" }, _attrs))} data-v-6d985102>`);
      _push(ssrRenderComponent(_component_LazyPageSchema, null, null, _parent));
      if (unref(pending)) {
        _push(`<div class="uk-section uk-text-center" data-v-6d985102><div uk-spinner="ratio: 2" data-v-6d985102></div></div>`);
      } else if (unref(vehicle)) {
        _push(`<div data-v-6d985102><div class="uk-section uk-section-small" data-v-6d985102><div class="uk-container" data-v-6d985102><ul class="uk-breadcrumb" data-v-6d985102><li data-v-6d985102>`);
        _push(ssrRenderComponent(_component_NuxtLink, { to: "/" }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`Home`);
            } else {
              return [
                createTextVNode("Home")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</li><li data-v-6d985102>`);
        _push(ssrRenderComponent(_component_NuxtLink, { to: "/car-sales" }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`Cars for Sale`);
            } else {
              return [
                createTextVNode("Cars for Sale")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</li><li data-v-6d985102><span data-v-6d985102>${ssrInterpolate(unref(vehicle).title)}</span></li></ul></div></div><div class="uk-section uk-padding-remove-top" data-v-6d985102><div class="uk-container" data-v-6d985102><div class="uk-grid uk-grid-large" uk-grid data-v-6d985102><div class="uk-width-2-3@m" data-v-6d985102>`);
        if (unref(vehicle).images?.length) {
          _push(`<div uk-slideshow="animation: fade; ratio: 4:3" data-v-6d985102><div class="uk-position-relative" data-v-6d985102><ul class="uk-slideshow-items" data-v-6d985102><!--[-->`);
          ssrRenderList(unref(vehicle).images, (image, index) => {
            _push(`<li data-v-6d985102><img${ssrRenderAttr("src", image)}${ssrRenderAttr("alt", `${unref(vehicle).title} - Image ${index + 1}`)} uk-cover data-v-6d985102></li>`);
          });
          _push(`<!--]--></ul><a class="uk-position-center-left uk-position-small uk-hidden-hover" href="#" uk-slidenav-previous uk-slideshow-item="previous" data-v-6d985102></a><a class="uk-position-center-right uk-position-small uk-hidden-hover" href="#" uk-slidenav-next uk-slideshow-item="next" data-v-6d985102></a></div><ul class="uk-slideshow-nav uk-dotnav uk-flex-center uk-margin" data-v-6d985102></ul></div>`);
        } else {
          _push(`<div class="uk-background-muted uk-padding-large uk-text-center" data-v-6d985102><span uk-icon="icon: image; ratio: 3" class="uk-text-muted" data-v-6d985102></span><p class="uk-text-muted uk-margin-small-top" data-v-6d985102>No image available</p></div>`);
        }
        if (unref(vehicle).specifications) {
          _push(`<div class="uk-card uk-card-default uk-card-body uk-margin-top" data-v-6d985102><h3 data-v-6d985102>Specifications</h3><div class="uk-grid uk-grid-small uk-child-width-1-2@s uk-child-width-1-3@m" uk-grid data-v-6d985102><!--[-->`);
          ssrRenderList(unref(vehicle).specifications, (value, key) => {
            _push(`<div data-v-6d985102><dt class="uk-text-muted uk-text-small" data-v-6d985102>${ssrInterpolate(formatKey(key))}</dt><dd class="uk-text-bold" data-v-6d985102>${ssrInterpolate(value)}</dd></div>`);
          });
          _push(`<!--]--></div></div>`);
        } else {
          _push(`<!---->`);
        }
        if (unref(vehicle).description) {
          _push(`<div class="uk-card uk-card-default uk-card-body uk-margin-top" data-v-6d985102><h3 data-v-6d985102>Description</h3><div data-v-6d985102>${unref(vehicle).description ?? ""}</div></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div><div class="uk-width-1-3@m" data-v-6d985102><div class="uk-card uk-card-default uk-card-body uk-position-sticky" style="${ssrRenderStyle({ "top": "80px" })}" data-v-6d985102>`);
        if (unref(vehicle).condition) {
          _push(`<span class="${ssrRenderClass([unref(conditionClass), "uk-badge"])}" data-v-6d985102>${ssrInterpolate(unref(vehicle).condition)}</span>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<h1 class="uk-h3 uk-margin-small-top" data-v-6d985102>${ssrInterpolate(unref(vehicle).title)}</h1><div class="uk-h2 uk-text-primary uk-margin-small" data-v-6d985102>${ssrInterpolate(unref(vehicle).price ? "$" + unref(vehicle).price.toLocaleString() : "POA")}</div><ul class="uk-list uk-list-divider" data-v-6d985102>`);
        if (unref(vehicle).year) {
          _push(`<li data-v-6d985102><strong data-v-6d985102>Year:</strong> ${ssrInterpolate(unref(vehicle).year)}</li>`);
        } else {
          _push(`<!---->`);
        }
        if (unref(vehicle).odometer) {
          _push(`<li data-v-6d985102><strong data-v-6d985102>Odometer:</strong> ${ssrInterpolate(unref(vehicle).odometer.toLocaleString())} km</li>`);
        } else {
          _push(`<!---->`);
        }
        if (unref(vehicle).transmission) {
          _push(`<li data-v-6d985102><strong data-v-6d985102>Transmission:</strong> ${ssrInterpolate(unref(vehicle).transmission)}</li>`);
        } else {
          _push(`<!---->`);
        }
        if (unref(vehicle).fuelType) {
          _push(`<li data-v-6d985102><strong data-v-6d985102>Fuel:</strong> ${ssrInterpolate(unref(vehicle).fuelType)}</li>`);
        } else {
          _push(`<!---->`);
        }
        if (unref(vehicle).colour) {
          _push(`<li data-v-6d985102><strong data-v-6d985102>Colour:</strong> ${ssrInterpolate(unref(vehicle).colour)}</li>`);
        } else {
          _push(`<!---->`);
        }
        if (unref(vehicle).stockNumber) {
          _push(`<li data-v-6d985102><strong data-v-6d985102>Stock #:</strong> ${ssrInterpolate(unref(vehicle).stockNumber)}</li>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</ul><div class="uk-margin-top" data-v-6d985102>`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: `/vehicle-enquire/${unref(vehicle).condition}-${unref(vehicle).year}-${unref(vehicle).make}-${unref(vehicle).model}-${unref(vehicle).stockNumber}`,
          class: "uk-button uk-button-primary uk-width-1-1"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(` Enquire Now `);
            } else {
              return [
                createTextVNode(" Enquire Now ")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: "/test-drive",
          class: "uk-button uk-button-default uk-width-1-1 uk-margin-small-top"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(` Book Test Drive `);
            } else {
              return [
                createTextVNode(" Book Test Drive ")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</div><div class="uk-margin-top uk-text-center" data-v-6d985102><p class="uk-text-muted uk-text-small" data-v-6d985102>Have questions?</p><a${ssrRenderAttr("href", `tel:${unref(phone)}`)} class="uk-button uk-button-text" data-v-6d985102><span uk-icon="receiver" data-v-6d985102></span> Call Us </a></div></div></div></div></div></div></div>`);
      } else {
        _push(`<div class="uk-section uk-text-center" data-v-6d985102><h2 data-v-6d985102>Vehicle Not Found</h2>`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: "/car-sales",
          class: "uk-button uk-button-primary"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`Browse All Vehicles`);
            } else {
              return [
                createTextVNode("Browse All Vehicles")
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/vehicle-for-sale/[id]/[slug].vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const _slug_ = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-6d985102"]]);

export { _slug_ as default };
//# sourceMappingURL=_slug_-CWn5h9OI.mjs.map
