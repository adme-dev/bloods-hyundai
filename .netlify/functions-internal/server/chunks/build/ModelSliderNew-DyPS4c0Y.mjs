import { _ as _export_sfc, d as __nuxt_component_0$1 } from './server.mjs';
import { defineComponent, ref, computed, unref, withCtx, createVNode, createTextVNode, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderList, ssrRenderClass, ssrInterpolate, ssrRenderComponent, ssrRenderAttr } from 'vue/server-renderer';
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
  __name: "ModelSliderNew",
  __ssrInlineRender: true,
  setup(__props) {
    const activeTab = ref(0);
    const vehicles = ref([]);
    const pending = ref(true);
    const filteredCategories = computed(() => {
      const categories = ["All"];
      const vehicleList = vehicles.value || [];
      vehicleList.forEach((vehicle) => {
        if (vehicle.category && !categories.includes(vehicle.category)) {
          categories.push(vehicle.category);
        }
      });
      return categories;
    });
    const filteredVehicles = computed(() => {
      const vehicleList = vehicles.value || [];
      const activeCategory = filteredCategories.value[activeTab.value];
      if (activeCategory === "All") {
        return vehicleList;
      }
      return vehicleList.filter((vehicle) => vehicle.category === activeCategory);
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0$1;
      _push(`<div${ssrRenderAttrs(_attrs)} data-v-b9577c28><div class="uk-container uk-text-center uk-margin-large-top uk-overflow-hidden" data-v-b9577c28><div class="uk-container uk-text-center uk-overflow-hidden" data-v-b9577c28><div class="uk-text-light space33" data-v-b9577c28>HYUNDAI RANGE</div><h2 class="uk-h2 uk-text-lighter uk-margin-small" data-v-b9577c28> A uniquely progressive collection of vehicles, each one the product of our defining commitment to creating a <span class="uk-text-bold uk-text-uppercase" data-v-b9577c28> better, smarter, more sustainable future. </span></h2></div></div>`);
      if (unref(pending)) {
        _push(`<div class="uk-text-center uk-padding" data-v-b9577c28><div uk-spinner data-v-b9577c28></div><p class="uk-margin-small-top" data-v-b9577c28>Loading vehicles...</p></div>`);
      } else if (unref(vehicles).length) {
        _push(`<div class="uk-margin-medium-top uk-width-expand@s" data-v-b9577c28><div class="showroom-menu uk-margin-medium-bottom" data-v-b9577c28><div class="uk-margin-auto uk-flex uk-flex-center" data-v-b9577c28><ul class="uk-subnav models--Category uk-flex-nowrap uk-margin-remove-top uk-overflow-auto" uk-tab data-v-b9577c28><!--[-->`);
        ssrRenderList(unref(filteredCategories), (category, index) => {
          _push(`<li class="${ssrRenderClass({ "uk-active": unref(activeTab) === index })}" data-v-b9577c28><a href="#" class="uk-text-primary uk-text-capitalize" data-v-b9577c28>${ssrInterpolate(category)}</a></li>`);
        });
        _push(`<!--]--></ul></div><div uk-slider class="slider" data-v-b9577c28><div class="uk-position-relative uk-margin-small-top uk-flex uk-flex-center@s uk-visible-toggle" tabindex="-1" data-v-b9577c28><div class="uk-grid-small uk-width-auto uk-slider-items uk-grid uk-grid-match" data-v-b9577c28><!--[-->`);
        ssrRenderList(unref(filteredVehicles), (vehicle, index) => {
          _push(`<div class="vehicle-item model-range" data-v-b9577c28><div class="uk-card uk-card-default uk-card-hover uk-height-1-1 uk-flex uk-flex-column" data-v-b9577c28><div class="uk-flex uk-flex-column uk-height-1-1" data-v-b9577c28><div class="uk-card-media-top" data-v-b9577c28>`);
          _push(ssrRenderComponent(_component_NuxtLink, {
            to: "/vehicle/" + vehicle.slug,
            class: "uk-text-muted"
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`<img${ssrRenderAttr("src", vehicle.image)}${ssrRenderAttr("alt", vehicle.name)} width="357" height="137" class="uk-width-1-1 uk-margin-medium-bottom" loading="lazy" data-v-b9577c28${_scopeId}>`);
              } else {
                return [
                  createVNode("img", {
                    src: vehicle.image,
                    alt: vehicle.name,
                    width: "357",
                    height: "137",
                    class: "uk-width-1-1 uk-margin-medium-bottom",
                    loading: "lazy"
                  }, null, 8, ["src", "alt"])
                ];
              }
            }),
            _: 2
          }, _parent));
          _push(`</div><div class="uk-card-body uk-padding uk-padding-remove-top uk-flex-1" data-v-b9577c28><div class="uk-width-1-1 uk-text-bold uk-text-lead uk-text-secondary uk-text-uppercase" data-v-b9577c28>${ssrInterpolate(vehicle.name)}</div>`);
          if (vehicle.categoryDescription) {
            _push(`<div class="uk-width-1-1 uk-text-meta uk-text-truncate" data-v-b9577c28>${ssrInterpolate(vehicle.categoryDescription)}</div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div><div class="uk-margin-medium-bottom" data-v-b9577c28><div class="uk-child-width-auto uk-flex uk-flex-center uk-grid-small uk-grid" data-v-b9577c28><div data-v-b9577c28>`);
          _push(ssrRenderComponent(_component_NuxtLink, {
            to: "/vehicle/" + vehicle.slug,
            class: "coloredsvg uk-text-center uk-button uk-button-primary uk-text-light uk-text-capitalize"
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(` Discover <span uk-icon="chevron-right" data-v-b9577c28${_scopeId}></span>`);
              } else {
                return [
                  createTextVNode(" Discover "),
                  createVNode("span", { "uk-icon": "chevron-right" })
                ];
              }
            }),
            _: 2
          }, _parent));
          _push(`</div><div data-v-b9577c28>`);
          _push(ssrRenderComponent(_component_NuxtLink, {
            to: "/calculator/" + vehicle.slug,
            class: "coloredsvg uk-text-center uk-button uk-button-primary uk-text-light uk-text-capitalize"
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(` Enquire <span uk-icon="chevron-right" data-v-b9577c28${_scopeId}></span>`);
              } else {
                return [
                  createTextVNode(" Enquire "),
                  createVNode("span", { "uk-icon": "chevron-right" })
                ];
              }
            }),
            _: 2
          }, _parent));
          _push(`</div></div></div></div></div></div>`);
        });
        _push(`<!--]--></div></div><ul class="uk-slider-nav uk-dotnav uk-flex-center uk-margin" data-v-b9577c28></ul><div class="uk-padding-small uk-flex uk-flex-center" data-v-b9577c28><a class="tm-slidenav uk-padding-small uk-margin-small-right uk-overlay-primary" href="#" uk-slider-item="previous" uk-slidenav-previous data-v-b9577c28></a><a class="tm-slidenav uk-padding-small uk-margin-small-left uk-overlay-primary" href="#" uk-slider-item="next" uk-slidenav-next data-v-b9577c28></a></div></div></div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<div class="uk-flex uk-flex-center" data-v-b9577c28><button class="uk-button uk-button-large uk-button-primary" title="Explore models" uk-toggle="target: #offcanvas-models" data-v-b9577c28> Explore all models </button></div></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/models/ModelSliderNew.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const ModelSliderNew = /* @__PURE__ */ Object.assign(_export_sfc(_sfc_main, [["__scopeId", "data-v-b9577c28"]]), { __name: "ModelSliderNew" });

export { ModelSliderNew as default };
//# sourceMappingURL=ModelSliderNew-DyPS4c0Y.mjs.map
