import { defineComponent, ref, computed, mergeProps, defineAsyncComponent, unref, withCtx, createTextVNode, createVNode, useSSRContext } from 'vue';
import { _ as _export_sfc, u as useMainStore, d as __nuxt_component_0$1 } from './server.mjs';
import { ssrRenderAttrs, ssrRenderComponent, ssrRenderClass, ssrRenderList, ssrRenderAttr, ssrInterpolate } from 'vue/server-renderer';
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
const __nuxt_component_1_lazy = defineAsyncComponent(() => import('./PostContent-ViI540rn.mjs').then((c) => c.default || c));
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "vehicles",
  __ssrInlineRender: true,
  setup(__props) {
    const mainStore = useMainStore();
    const page = ref(null);
    const selectedCategory = ref("All");
    const vehicles2 = computed(() => mainStore.models || []);
    const categories = computed(() => {
      if (!vehicles2.value.length) return [];
      return [...new Set(vehicles2.value.map((v) => v.vehiclecat).filter(Boolean))];
    });
    const filteredVehicles = computed(() => {
      if (selectedCategory.value === "All") {
        return vehicles2.value;
      }
      return vehicles2.value.filter((v) => v.vehiclecat === selectedCategory.value);
    });
    const groupedModels = computed(() => {
      const grouped = {};
      filteredVehicles.value.forEach((model) => {
        const category = model.vehiclecat || "Other";
        if (!grouped[category]) grouped[category] = [];
        grouped[category].push(model);
      });
      return grouped;
    });
    const modelLink = (model) => {
      if (model.form) {
        return `/vehicle/${model.slug}`;
      }
      return `/build/${model.slug}`;
    };
    useSiteMeta({
      title: "New Hyundai Vehicles | Browse All Models",
      description: "Explore the complete range of new Hyundai vehicles. Find your perfect car, SUV, or EV today."
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_LazyPageSchema = __nuxt_component_0_lazy;
      const _component_LazyPostContent = __nuxt_component_1_lazy;
      const _component_NuxtLink = __nuxt_component_0$1;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "vehicles-page" }, _attrs))} data-v-0c33cabd>`);
      _push(ssrRenderComponent(_component_LazyPageSchema, null, null, _parent));
      if (unref(page)?.content?.rendered) {
        _push(ssrRenderComponent(_component_LazyPostContent, {
          content: unref(page).content.rendered
        }, null, _parent));
      } else {
        _push(`<!---->`);
      }
      _push(`<div class="uk-flex uk-grid-collapse uk-overflow-auto uk-background-default" data-v-0c33cabd><div class="uk-width-1-1" id="model-Cat" data-v-0c33cabd><div class="showroom-menu" data-v-0c33cabd><ul class="uk-subnav uk-flex uk-flex-center@s uk-flex-nowrap uk-overflow-auto uk-light" uk-sticky data-v-0c33cabd><li class="${ssrRenderClass({ "uk-active": unref(selectedCategory) === "All" })}" data-v-0c33cabd><a href="#model-Cat" class="uk-text-bold" uk-scroll data-v-0c33cabd> All </a></li><!--[-->`);
      ssrRenderList(unref(categories), (category) => {
        _push(`<li class="${ssrRenderClass({ "uk-active": unref(selectedCategory) === category })}" data-v-0c33cabd><a href="#model-Cat" class="uk-text-bold" uk-scroll data-v-0c33cabd><span data-v-0c33cabd>${category ?? ""}</span></a></li>`);
      });
      _push(`<!--]--><li data-v-0c33cabd>`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/car-sales?condition=used&make=hyundai",
        class: "uk-text-bold"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(` Used Hyundai&#39;s `);
          } else {
            return [
              createTextVNode(" Used Hyundai's ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</li></ul><div class="uk-width-1-1" data-v-0c33cabd><!--[-->`);
      ssrRenderList(unref(groupedModels), (models, categoryName) => {
        _push(`<div class="uk-margin-medium-bottom" data-v-0c33cabd><div class="uk-margin-medium-left" data-v-0c33cabd><h2 class="uk-h3 uk-text-bold uk-margin-remove" data-v-0c33cabd>${categoryName ?? ""}</h2>`);
        if (models[0]?.segment_desc) {
          _push(`<p class="uk-text-muted" data-v-0c33cabd>${models[0].segment_desc ?? ""}</p>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div><hr class="uk-margin-remove" data-v-0c33cabd><div class="uk-margin-medium-left uk-grid-collapse uk-flex uk-flex-left" uk-grid data-v-0c33cabd><!--[-->`);
        ssrRenderList(models, (model) => {
          _push(`<div class="uk-width-1-2@s uk-width-1-4@l uk-width-1-5@xl model-item" data-v-0c33cabd><div class="uk-padding-small" data-v-0c33cabd>`);
          _push(ssrRenderComponent(_component_NuxtLink, {
            to: modelLink(model),
            class: "uk-text-muted uk-display-block"
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`<img${ssrRenderAttr("src", model.model_image || model.image)}${ssrRenderAttr("alt", model.title?.rendered || model.title)} class="uk-display-block uk-width-1-1" width="357" height="137" loading="lazy" data-v-0c33cabd${_scopeId}>`);
              } else {
                return [
                  createVNode("img", {
                    src: model.model_image || model.image,
                    alt: model.title?.rendered || model.title,
                    class: "uk-display-block uk-width-1-1",
                    width: "357",
                    height: "137",
                    loading: "lazy"
                  }, null, 8, ["src", "alt"])
                ];
              }
            }),
            _: 2
          }, _parent));
          _push(`<div class="uk-margin-small-top" data-v-0c33cabd><div class="uk-text-bold uk-text-secondary uk-text-uppercase" data-v-0c33cabd>${ssrInterpolate(model.title?.rendered || model.title)}</div>`);
          if (model.startingPrice) {
            _push(`<div class="uk-margin-small-top" data-v-0c33cabd><div class="uk-text-muted uk-text-small" data-v-0c33cabd>From</div><div class="uk-text-bold uk-text-primary" data-v-0c33cabd>${ssrInterpolate(model.startingPrice)}</div></div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`<div class="uk-margin-small-top uk-child-width-auto uk-grid-small" uk-grid data-v-0c33cabd><div data-v-0c33cabd>`);
          _push(ssrRenderComponent(_component_NuxtLink, {
            to: `/vehicle/${model.slug}`,
            class: "uk-button uk-button-text uk-button-small uk-text-capitalize"
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(` Details `);
              } else {
                return [
                  createTextVNode(" Details ")
                ];
              }
            }),
            _: 2
          }, _parent));
          _push(`</div><div data-v-0c33cabd>`);
          _push(ssrRenderComponent(_component_NuxtLink, {
            to: `/variant/${model.variant_link || model.slug}`,
            class: "uk-button uk-button-text uk-button-small uk-text-capitalize"
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(` Enquire `);
              } else {
                return [
                  createTextVNode(" Enquire ")
                ];
              }
            }),
            _: 2
          }, _parent));
          _push(`</div>`);
          if (!model.form) {
            _push(`<div data-v-0c33cabd>`);
            _push(ssrRenderComponent(_component_NuxtLink, {
              to: `/build/${model.slug}`,
              class: "uk-button uk-button-text uk-button-small uk-text-capitalize"
            }, {
              default: withCtx((_, _push2, _parent2, _scopeId) => {
                if (_push2) {
                  _push2(` Range `);
                } else {
                  return [
                    createTextVNode(" Range ")
                  ];
                }
              }),
              _: 2
            }, _parent));
            _push(`</div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div></div></div></div>`);
        });
        _push(`<!--]--></div></div>`);
      });
      _push(`<!--]--></div></div></div><div class="uk-width-1-1 uk-border-top" data-v-0c33cabd><hr class="uk-margin-remove-bottom" data-v-0c33cabd><div class="uk-padding uk-text-left" data-v-0c33cabd><h3 class="uk-h3 uk-text-bold uk-margin-small-bottom" data-v-0c33cabd>Explore more</h3><ul class="uk-child-width-1-3@s uk-child-width-expand@m uk-grid-collapse uk-grid" uk-margin data-v-0c33cabd><li class="uk-margin-small-top" data-v-0c33cabd>`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/special-offers",
        class: "uk-button uk-button-text uk-text-primary uk-text-bold"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(` Latest Offers `);
          } else {
            return [
              createTextVNode(" Latest Offers ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</li><li class="uk-margin-small-top" data-v-0c33cabd>`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/car-sales?condition=used",
        class: "uk-button uk-button-text uk-text-primary uk-text-bold"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(` Used Cars `);
          } else {
            return [
              createTextVNode(" Used Cars ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</li><li class="uk-margin-small-top" data-v-0c33cabd>`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/build-and-price",
        class: "uk-button uk-button-text uk-text-primary uk-text-bold"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(` Build &amp; Price `);
          } else {
            return [
              createTextVNode(" Build & Price ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</li><li class="uk-margin-small-top" data-v-0c33cabd>`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/test-drive",
        class: "uk-button uk-button-text uk-text-primary uk-text-bold"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(` Book a Test Drive `);
          } else {
            return [
              createTextVNode(" Book a Test Drive ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</li><li class="uk-margin-small-top" data-v-0c33cabd>`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/sell-my-car",
        class: "uk-button uk-button-text uk-text-primary uk-text-bold"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(` Sell Your Car `);
          } else {
            return [
              createTextVNode(" Sell Your Car ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</li></ul></div></div></div></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/vehicles.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const vehicles = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-0c33cabd"]]);

export { vehicles as default };
//# sourceMappingURL=vehicles-BrQJ2iNb.mjs.map
