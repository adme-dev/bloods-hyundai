import { defineComponent, ref, mergeProps, defineAsyncComponent, unref, withCtx, createTextVNode, useSSRContext } from 'vue';
import { _ as _export_sfc, d as __nuxt_component_0$1 } from './server.mjs';
import { ssrRenderAttrs, ssrRenderComponent, ssrRenderList, ssrRenderAttr, ssrInterpolate } from 'vue/server-renderer';
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
  __name: "compare-vehicles-for-sale",
  __ssrInlineRender: true,
  setup(__props) {
    useSiteMeta({
      title: "Compare Vehicles",
      description: "Compare your saved vehicles side by side at Sale Hyundai."
    });
    const savedVehicles = ref([]);
    const comparisonFields = [
      { key: "year", label: "Year" },
      { key: "make", label: "Make" },
      { key: "model", label: "Model" },
      { key: "variant", label: "Variant" },
      { key: "condition", label: "Condition" },
      { key: "odometer", label: "Odometer" },
      { key: "body", label: "Body Type" },
      { key: "transmission", label: "Transmission" },
      { key: "fuelType", label: "Fuel Type" },
      { key: "engine", label: "Engine" },
      { key: "colour", label: "Colour" },
      { key: "driveType", label: "Drive Type" },
      { key: "seats", label: "Seats" },
      { key: "doors", label: "Doors" }
    ];
    const getFieldValue = (vehicle, key) => {
      const value = vehicle[key];
      if (value === void 0 || value === null || value === "") {
        return "-";
      }
      if (key === "odometer" && typeof value === "number") {
        return `${value.toLocaleString()} km`;
      }
      if (key === "price" && typeof value === "number") {
        return `$${value.toLocaleString()}`;
      }
      return value;
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_LazyPageSchema = __nuxt_component_0_lazy;
      const _component_NuxtLink = __nuxt_component_0$1;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "compare-page" }, _attrs))} data-v-bdfbe22c>`);
      _push(ssrRenderComponent(_component_LazyPageSchema, null, null, _parent));
      _push(`<div class="uk-section uk-section-small uk-background-muted" data-v-bdfbe22c><div class="uk-container" data-v-bdfbe22c><h1 class="uk-h2 uk-margin-remove" data-v-bdfbe22c>Compare Saved Vehicles</h1><p class="uk-text-meta uk-margin-small-top" data-v-bdfbe22c>Compare up to 3 vehicles side by side</p></div></div>`);
      if (unref(savedVehicles).length === 0) {
        _push(`<div class="uk-section uk-text-center" data-v-bdfbe22c><div class="uk-container uk-container-small" data-v-bdfbe22c><span uk-icon="icon: heart; ratio: 4" class="uk-text-muted" data-v-bdfbe22c></span><h2 class="uk-h3 uk-margin-top" data-v-bdfbe22c>No Saved Vehicles</h2><p class="uk-text-muted" data-v-bdfbe22c> You haven&#39;t saved any vehicles yet. Browse our inventory and click the heart icon to save vehicles for comparison. </p>`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: "/car-sales",
          class: "uk-button uk-button-primary uk-margin-top"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(` Browse Vehicles `);
            } else {
              return [
                createTextVNode(" Browse Vehicles ")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</div></div>`);
      } else {
        _push(`<div class="uk-section" data-v-bdfbe22c><div class="uk-container" data-v-bdfbe22c><div class="compare-grid" data-v-bdfbe22c><div class="compare-row compare-header" data-v-bdfbe22c><div class="compare-label" data-v-bdfbe22c></div><!--[-->`);
        ssrRenderList(unref(savedVehicles).slice(0, 3), (vehicle) => {
          _push(`<div class="compare-cell" data-v-bdfbe22c><div class="uk-card uk-card-default uk-card-small" data-v-bdfbe22c><div class="uk-card-media-top uk-position-relative" data-v-bdfbe22c><img${ssrRenderAttr("src", vehicle.images?.[0] || vehicle.image)}${ssrRenderAttr("alt", vehicle.title)} class="uk-width-1-1" loading="lazy" data-v-bdfbe22c><button class="uk-position-top-right uk-close uk-padding-small" type="button" title="Remove from comparison" data-v-bdfbe22c><span uk-icon="close" data-v-bdfbe22c></span></button></div><div class="uk-card-body" data-v-bdfbe22c><h3 class="uk-card-title uk-margin-small-bottom" data-v-bdfbe22c>${ssrInterpolate(vehicle.title || `${vehicle.year} ${vehicle.make} ${vehicle.model}`)}</h3><div class="uk-h4 uk-text-primary uk-margin-remove" data-v-bdfbe22c>${ssrInterpolate(vehicle.price ? `$${vehicle.price.toLocaleString()}` : "POA")}</div><div class="uk-margin-small-top" data-v-bdfbe22c>`);
          _push(ssrRenderComponent(_component_NuxtLink, {
            to: `/vehicle-for-sale/${vehicle.id}/${vehicle.slug}`,
            class: "uk-button uk-button-primary uk-button-small uk-width-1-1"
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(` View Details `);
              } else {
                return [
                  createTextVNode(" View Details ")
                ];
              }
            }),
            _: 2
          }, _parent));
          _push(`</div></div></div></div>`);
        });
        _push(`<!--]--></div><!--[-->`);
        ssrRenderList(comparisonFields, (field) => {
          _push(`<div class="compare-row" data-v-bdfbe22c><div class="compare-label" data-v-bdfbe22c>${ssrInterpolate(field.label)}</div><!--[-->`);
          ssrRenderList(unref(savedVehicles).slice(0, 3), (vehicle) => {
            _push(`<div class="compare-cell" data-v-bdfbe22c>${ssrInterpolate(getFieldValue(vehicle, field.key))}</div>`);
          });
          _push(`<!--]--></div>`);
        });
        _push(`<!--]--></div><div class="uk-margin-large-top uk-flex uk-flex-center uk-grid-small" uk-grid data-v-bdfbe22c><div data-v-bdfbe22c><button class="uk-button uk-button-default" data-v-bdfbe22c> Clear All </button></div><div data-v-bdfbe22c>`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: "/car-sales",
          class: "uk-button uk-button-secondary"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(` Browse More Vehicles `);
            } else {
              return [
                createTextVNode(" Browse More Vehicles ")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</div></div></div></div>`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/compare-vehicles-for-sale.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const compareVehiclesForSale = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-bdfbe22c"]]);

export { compareVehiclesForSale as default };
//# sourceMappingURL=compare-vehicles-for-sale-Ddek1Sw6.mjs.map
