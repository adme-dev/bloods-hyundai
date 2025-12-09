import { _ as _export_sfc, e as useNuxtApp, d as __nuxt_component_0$1 } from './server.mjs';
import { defineComponent, ref, withAsyncContext, computed, mergeProps, unref, withCtx, createTextVNode, createVNode, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderStyle, ssrRenderClass, ssrRenderList, ssrRenderAttr, ssrInterpolate, ssrRenderComponent } from 'vue/server-renderer';
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

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "NavModels",
  __ssrInlineRender: true,
  async setup(__props) {
    let __temp, __restore;
    const { $uikit } = useNuxtApp();
    const selectedCategory = ref("All");
    const itemToShow = ref(null);
    const showMobileFilter = ref(false);
    const { data: apiData, pending } = ([__temp, __restore] = withAsyncContext(() => useFetch("/api/all-variants", {
      lazy: true,
      default: () => ({ variants: [], groupedByCategory: {} })
    }, "$IWCUN6aAFZ")), __temp = await __temp, __restore(), __temp);
    const vehicleCategories = computed(() => {
      const grouped = apiData.value?.groupedByCategory;
      if (grouped && Object.keys(grouped).length > 0) {
        return Object.keys(grouped);
      }
      return [];
    });
    const groupedVehicles = computed(() => {
      const grouped = apiData.value?.groupedByCategory || {};
      if (selectedCategory.value === "All") {
        const result = {};
        Object.entries(grouped).forEach(([categoryName, categoryData]) => {
          const models = categoryData.models || categoryData;
          if (Array.isArray(models) && models.length > 0) {
            result[categoryName] = models;
          }
        });
        return result;
      }
      if (grouped[selectedCategory.value]) {
        const categoryData = grouped[selectedCategory.value];
        const models = categoryData.models || categoryData;
        if (Array.isArray(models) && models.length > 0) {
          return { [selectedCategory.value]: models };
        }
      }
      return {};
    });
    const closeModel = () => {
    };
    const capitalizeFirstLetter = (str) => {
      if (typeof str !== "string") return "";
      return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0$1;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "uk-flex uk-grid-collapse groupedMakes uk-grid" }, _attrs))} data-v-b1b74159><div class="uk-width-1-1" data-v-b1b74159>`);
      if (unref(pending)) {
        _push(`<div class="showroom-menu uk-background-default uk-padding uk-text-center" data-v-b1b74159><div uk-spinner data-v-b1b74159></div><p class="uk-margin-small-top" data-v-b1b74159>Loading vehicles...</p></div>`);
      } else if (unref(vehicleCategories) && unref(vehicleCategories).length > 0) {
        _push(`<div class="showroom-menu uk-background-default" data-v-b1b74159><div class="uk-hidden@l" data-v-b1b74159><div class="uk-padding uk-padding-remove-bottom uk-link uk-text-bold" data-v-b1b74159><span class="uk-padding-small uk-margin-small-right" uk-icon="icon: settings; ratio: 1.2" data-v-b1b74159></span> Filter </div><ul class="uk-list uk-margin-medium-left" style="${ssrRenderStyle(unref(showMobileFilter) ? null : { display: "none" })}" data-v-b1b74159><li class="${ssrRenderClass({ "uk-active": unref(itemToShow) === -1 })}" data-v-b1b74159><a href="#" class="uk-text-bold" data-v-b1b74159> All </a></li><!--[-->`);
        ssrRenderList(unref(vehicleCategories), (category, index) => {
          _push(`<li class="${ssrRenderClass({ "uk-active": unref(itemToShow) === index })}" data-v-b1b74159><a${ssrRenderAttr("href", "#" + category)} class="uk-text-bold" data-v-b1b74159>${ssrInterpolate(capitalizeFirstLetter(category))}</a></li>`);
        });
        _push(`<!--]--><li data-v-b1b74159>`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: "/car-sales?search_keywords=hyundai",
          class: "uk-dropdown-close uk-text-bold uk-text-capitalize",
          onClick: closeModel
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(` In stock `);
            } else {
              return [
                createTextVNode(" In stock ")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</li></ul></div><ul class="uk-subnav model--Category showroomnav uk-tab uk-flex uk-flex-center@s uk-flex-nowrap uk-margin-remove-top uk-light uk-visible@l" data-v-b1b74159><li class="${ssrRenderClass({ "uk-active": unref(itemToShow) === -1 })}" data-v-b1b74159><a href="#" class="uk-text-bold model-Cat-Btn" data-v-b1b74159> All </a></li><!--[-->`);
        ssrRenderList(unref(vehicleCategories), (category, index) => {
          _push(`<li class="${ssrRenderClass({ "uk-active": unref(itemToShow) === index })}" data-v-b1b74159><a${ssrRenderAttr("href", "#" + category)} class="uk-text-bold model-Cat-Btn uk-text-capitalize" data-v-b1b74159>${ssrInterpolate(capitalizeFirstLetter(category))}</a></li>`);
        });
        _push(`<!--]--><li data-v-b1b74159>`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: "/car-sales?search_keywords=hyundai",
          class: "uk-dropdown-close uk-text-bold uk-text-capitalize model-Cat-Btn",
          onClick: closeModel
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(` In stock `);
            } else {
              return [
                createTextVNode(" In stock ")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</li><li class="close-btn uk-visible@l" data-v-b1b74159><a href="#" class="close-link" title="Close menu" data-v-b1b74159><svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" data-v-b1b74159><path fill="none" stroke="#ffffff" stroke-width="1.5" d="M16,16 L4,4" data-v-b1b74159></path><path fill="none" stroke="#ffffff" stroke-width="1.5" d="M16,4 L4,16" data-v-b1b74159></path></svg></a></li></ul><!--[-->`);
        ssrRenderList(unref(groupedVehicles), (vehicles, categoryName) => {
          _push(`<div class="model-range-mnu" data-v-b1b74159><div class="uk-margin-medium-left uk-margin-medium-top" data-v-b1b74159><div${ssrRenderAttr("id", categoryName)} class="uk-h3 uk-width-1-1 uk-text-bold uk-margin-remove" data-v-b1b74159>${ssrInterpolate(categoryName)}</div>`);
          if (vehicles[0]?.categoryDescription) {
            _push(`<div class="uk-visible@s" data-v-b1b74159>${vehicles[0].categoryDescription ?? ""}</div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div><hr class="uk-margin-remove" data-v-b1b74159><div class="uk-margin-medium-left model-wrap uk-grid-collapse uk-flex uk-flex-left uk-grid" data-v-b1b74159><!--[-->`);
          ssrRenderList(vehicles, (vehicle, vehicleIndex) => {
            _push(`<div class="uk-width-1-2@s uk-width-1-4@l uk-width-1-5@xl vehicle-item" data-v-b1b74159><div data-v-b1b74159><div data-v-b1b74159>`);
            _push(ssrRenderComponent(_component_NuxtLink, {
              to: "/vehicle/" + vehicle.slug,
              class: "uk-text-muted",
              onClick: closeModel
            }, {
              default: withCtx((_, _push2, _parent2, _scopeId) => {
                if (_push2) {
                  _push2(`<img${ssrRenderAttr("src", `${vehicle.image}?width=357&auto_optimize=medium`)}${ssrRenderAttr("alt", vehicle.name)} class="uk-display-block" width="357" height="185" loading="lazy" data-v-b1b74159${_scopeId}>`);
                } else {
                  return [
                    createVNode("img", {
                      src: `${vehicle.image}?width=357&auto_optimize=medium`,
                      alt: vehicle.name,
                      class: "uk-display-block",
                      width: "357",
                      height: "185",
                      loading: "lazy"
                    }, null, 8, ["src", "alt"])
                  ];
                }
              }),
              _: 2
            }, _parent));
            _push(`</div><div class="uk-grid-collapse uk-margin-medium-left uk-margin-small-bottom" data-v-b1b74159><div class="uk-width-1-1 uk-text-bold uk-text-secondary uk-text-left" data-v-b1b74159>${ssrInterpolate(vehicle.name)}</div><div class="uk-width-expand uk-text-center" data-v-b1b74159><div class="uk-child-width-auto uk-grid" data-v-b1b74159><div data-v-b1b74159>`);
            _push(ssrRenderComponent(_component_NuxtLink, {
              to: "/vehicle/" + vehicle.slug,
              class: "uk-text-center uk-button uk-button-text uk-button-small uk-text-primary uk-text-capitalize uk-padding-remove-left",
              onClick: closeModel
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
            _push(`</div><div data-v-b1b74159>`);
            _push(ssrRenderComponent(_component_NuxtLink, {
              to: `/variant/${vehicle.slug}`,
              class: "uk-text-center uk-button uk-button-text uk-button-small uk-text-primary uk-text-capitalize",
              onClick: closeModel
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
            _push(`</div><div data-v-b1b74159>`);
            _push(ssrRenderComponent(_component_NuxtLink, {
              to: `/build/${vehicle.slug}`,
              class: "uk-text-center uk-button uk-button-text uk-button-small uk-text-primary uk-text-capitalize",
              onClick: closeModel
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
            _push(`</div></div></div></div></div></div>`);
          });
          _push(`<!--]--></div></div>`);
        });
        _push(`<!--]--></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div><div class="uk-width-1-1 menu-side-nav uk-margin-auto-top uk-background-default" data-v-b1b74159><hr class="uk-margin-remove-bottom" data-v-b1b74159><div class="uk-padding uk-text-left" data-v-b1b74159><div class="uk-text-muted uk-text-small space33" data-v-b1b74159><div class="uk-width-1-1 uk-margin-small-bottom uk-h3 uk-text-bold" data-v-b1b74159>Explore more</div></div><ul class="uk-child-width-1-3@s uk-child-width-expand@m uk-grid-collapse uk-grid" uk-margin data-v-b1b74159><li class="uk-margin-small-top" data-v-b1b74159>`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/special-offers",
        class: "uk-button uk-button-text uk-text-light uk-text-primary uk-text-bold uk-text-capitalize uk-width-auto",
        onClick: closeModel
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
      _push(`</li><li class="uk-margin-small-top" data-v-b1b74159>`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/car-sales?condition=used",
        class: "uk-button uk-button-text uk-text-light uk-text-primary uk-text-bold uk-text-capitalize uk-width-auto",
        onClick: closeModel
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
      _push(`</li><li class="uk-margin-small-top" data-v-b1b74159>`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/build-and-price",
        class: "uk-button uk-button-text uk-text-light uk-text-primary uk-text-bold uk-text-capitalize uk-width-auto",
        onClick: closeModel
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(` Build &amp; price `);
          } else {
            return [
              createTextVNode(" Build & price ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</li><li class="uk-margin-small-top" data-v-b1b74159><a href="#" uk-toggle="target: #global-search-modal" class="uk-button uk-button-text uk-text-light uk-text-primary uk-text-bold uk-text-capitalize uk-width-auto" data-v-b1b74159> Stock Search </a></li><li class="uk-margin-small-top" data-v-b1b74159>`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/finance",
        class: "uk-button uk-button-text uk-text-light uk-text-primary uk-text-bold uk-text-capitalize uk-width-auto",
        onClick: closeModel
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(` Finance options `);
          } else {
            return [
              createTextVNode(" Finance options ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</li><li class="uk-margin-small-top" data-v-b1b74159>`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/sell-my-car",
        class: "uk-button uk-button-text uk-text-light uk-text-primary uk-text-bold uk-text-capitalize uk-width-auto",
        onClick: closeModel
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(` Sell your car `);
          } else {
            return [
              createTextVNode(" Sell your car ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</li><li class="uk-margin-small-top last-column" data-v-b1b74159>`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/test-drive",
        class: "uk-button uk-button-text uk-text-light uk-text-primary uk-text-bold uk-text-capitalize uk-width-auto",
        onClick: closeModel
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(` Book a test drive `);
          } else {
            return [
              createTextVNode(" Book a test drive ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</li></ul></div></div></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/models/NavModels.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const NavModels = /* @__PURE__ */ Object.assign(_export_sfc(_sfc_main, [["__scopeId", "data-v-b1b74159"]]), { __name: "NavModels" });

export { NavModels as default };
//# sourceMappingURL=NavModels-CfrzW5LW.mjs.map
