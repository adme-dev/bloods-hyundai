import { _ as _export_sfc, u as useMainStore, m as useVehiclesStore, d as __nuxt_component_0$1 } from './server.mjs';
import { defineComponent, ref, computed, watch, unref, withCtx, createBlock, createCommentVNode, createVNode, openBlock, toDisplayString, createTextVNode, useSSRContext, toValue } from 'vue';
import { ssrRenderTeleport, ssrRenderAttr, ssrInterpolate, ssrRenderList, ssrRenderComponent } from 'vue/server-renderer';
import Fuse from 'fuse.js';
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

typeof WorkerGlobalScope !== "undefined" && globalThis instanceof WorkerGlobalScope;
const noop = () => {
};
function createFilterWrapper(filter, fn) {
  function wrapper(...args) {
    return new Promise((resolve, reject) => {
      Promise.resolve(filter(() => fn.apply(this, args), {
        fn,
        thisArg: this,
        args
      })).then(resolve).catch(reject);
    });
  }
  return wrapper;
}
function debounceFilter(ms, options = {}) {
  let timer;
  let maxTimer;
  let lastRejector = noop;
  const _clearTimeout = (timer$1) => {
    clearTimeout(timer$1);
    lastRejector();
    lastRejector = noop;
  };
  let lastInvoker;
  const filter = (invoke$1) => {
    const duration = toValue(ms);
    const maxDuration = toValue(options.maxWait);
    if (timer) _clearTimeout(timer);
    if (duration <= 0 || maxDuration !== void 0 && maxDuration <= 0) {
      if (maxTimer) {
        _clearTimeout(maxTimer);
        maxTimer = void 0;
      }
      return Promise.resolve(invoke$1());
    }
    return new Promise((resolve, reject) => {
      lastRejector = options.rejectOnCancel ? reject : resolve;
      lastInvoker = invoke$1;
      if (maxDuration && !maxTimer) maxTimer = setTimeout(() => {
        if (timer) _clearTimeout(timer);
        maxTimer = void 0;
        resolve(lastInvoker());
      }, maxDuration);
      timer = setTimeout(() => {
        if (maxTimer) _clearTimeout(maxTimer);
        maxTimer = void 0;
        resolve(invoke$1());
      }, duration);
    });
  };
  return filter;
}
// @__NO_SIDE_EFFECTS__
function useDebounceFn(fn, ms = 200, options = {}) {
  return createFilterWrapper(debounceFilter(ms, options), fn);
}
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "GlobalSearch",
  __ssrInlineRender: true,
  setup(__props) {
    const mainStore = useMainStore();
    const vehiclesStore = useVehiclesStore();
    const isOpen = ref(false);
    const searchQuery = ref("");
    ref(null);
    const isSearching = ref(false);
    const vehicleFuse = computed(() => {
      return new Fuse(vehiclesStore.vehicles, {
        keys: ["title", "make.displayValue", "model.displayValue"],
        threshold: 0.3
      });
    });
    const modelFuse = computed(() => {
      return new Fuse(mainStore.models, {
        keys: ["name", "title.rendered", "slug"],
        threshold: 0.3
      });
    });
    const results = ref({
      vehicles: [],
      models: [],
      pages: []
    });
    const hasResults = computed(() => {
      return results.value.vehicles.length > 0 || results.value.models.length > 0 || results.value.pages.length > 0;
    });
    const debouncedSearch = /* @__PURE__ */ useDebounceFn(() => {
      if (!searchQuery.value.trim()) {
        results.value = { vehicles: [], models: [], pages: [] };
        return;
      }
      isSearching.value = true;
      const vehicleResults = vehicleFuse.value.search(searchQuery.value);
      results.value.vehicles = vehicleResults.map((r) => r.item);
      const modelResults = modelFuse.value.search(searchQuery.value);
      results.value.models = modelResults.map((r) => r.item);
      results.value.pages = [];
      isSearching.value = false;
    }, 300);
    watch(searchQuery, () => {
      debouncedSearch();
    });
    const close = () => {
      isOpen.value = false;
      searchQuery.value = "";
      results.value = { vehicles: [], models: [], pages: [] };
    };
    const getVehicleLink = (vehicle) => {
      const slug = (vehicle.title || "").toLowerCase().replace(/[^a-z0-9 -]/g, "").replace(/\s+/g, "-");
      return `/vehicle-for-sale/${vehicle.stockid}/${slug}`;
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0$1;
      ssrRenderTeleport(_push, (_push2) => {
        if (unref(isOpen)) {
          _push2(`<div class="global-search-overlay" data-v-01afd6ea><div class="global-search-modal" data-v-01afd6ea><div class="search-header" data-v-01afd6ea><div class="search-input-wrapper" data-v-01afd6ea><span uk-icon="search" class="search-icon" data-v-01afd6ea></span><input${ssrRenderAttr("value", unref(searchQuery))} type="text" placeholder="Search vehicles, models, pages..." class="search-input" data-v-01afd6ea>`);
          if (unref(searchQuery)) {
            _push2(`<button class="clear-button" data-v-01afd6ea><span uk-icon="close" data-v-01afd6ea></span></button>`);
          } else {
            _push2(`<!---->`);
          }
          _push2(`</div><button class="close-button" data-v-01afd6ea><span uk-icon="close" data-v-01afd6ea></span></button></div><div class="search-results" data-v-01afd6ea>`);
          if (unref(isSearching)) {
            _push2(`<div class="search-loading" data-v-01afd6ea><div uk-spinner data-v-01afd6ea></div><span data-v-01afd6ea>Searching...</span></div>`);
          } else if (unref(searchQuery) && !unref(hasResults)) {
            _push2(`<div class="search-no-results" data-v-01afd6ea><span uk-icon="icon: search; ratio: 2" class="uk-text-muted" data-v-01afd6ea></span><p data-v-01afd6ea>No results found for &quot;${ssrInterpolate(unref(searchQuery))}&quot;</p></div>`);
          } else if (unref(hasResults)) {
            _push2(`<div class="search-results-content" data-v-01afd6ea>`);
            if (unref(results).vehicles?.length) {
              _push2(`<div class="results-section" data-v-01afd6ea><h3 class="results-heading" data-v-01afd6ea>Vehicles</h3><div class="results-list" data-v-01afd6ea><!--[-->`);
              ssrRenderList(unref(results).vehicles.slice(0, 5), (vehicle) => {
                _push2(ssrRenderComponent(_component_NuxtLink, {
                  key: vehicle.stockid,
                  to: getVehicleLink(vehicle),
                  class: "result-item vehicle-result",
                  onClick: close
                }, {
                  default: withCtx((_, _push3, _parent2, _scopeId) => {
                    if (_push3) {
                      if (vehicle.thumb) {
                        _push3(`<img${ssrRenderAttr("src", vehicle.thumb)}${ssrRenderAttr("alt", vehicle.title)} class="result-image" data-v-01afd6ea${_scopeId}>`);
                      } else {
                        _push3(`<!---->`);
                      }
                      _push3(`<div class="result-info" data-v-01afd6ea${_scopeId}><span class="result-title" data-v-01afd6ea${_scopeId}>${ssrInterpolate(vehicle.title)}</span><span class="result-meta" data-v-01afd6ea${_scopeId}>${ssrInterpolate(vehicle.price?.displayValue || "POA")}</span></div>`);
                    } else {
                      return [
                        vehicle.thumb ? (openBlock(), createBlock("img", {
                          key: 0,
                          src: vehicle.thumb,
                          alt: vehicle.title,
                          class: "result-image"
                        }, null, 8, ["src", "alt"])) : createCommentVNode("", true),
                        createVNode("div", { class: "result-info" }, [
                          createVNode("span", { class: "result-title" }, toDisplayString(vehicle.title), 1),
                          createVNode("span", { class: "result-meta" }, toDisplayString(vehicle.price?.displayValue || "POA"), 1)
                        ])
                      ];
                    }
                  }),
                  _: 2
                }, _parent));
              });
              _push2(`<!--]--></div></div>`);
            } else {
              _push2(`<!---->`);
            }
            if (unref(results).models?.length) {
              _push2(`<div class="results-section" data-v-01afd6ea><h3 class="results-heading" data-v-01afd6ea>Models</h3><div class="results-list" data-v-01afd6ea><!--[-->`);
              ssrRenderList(unref(results).models.slice(0, 5), (model) => {
                _push2(ssrRenderComponent(_component_NuxtLink, {
                  key: model.slug,
                  to: `/vehicle/${model.slug}`,
                  class: "result-item",
                  onClick: close
                }, {
                  default: withCtx((_, _push3, _parent2, _scopeId) => {
                    if (_push3) {
                      _push3(`<div class="result-info" data-v-01afd6ea${_scopeId}><span class="result-title" data-v-01afd6ea${_scopeId}>${ssrInterpolate(model.title?.rendered || model.name)}</span></div>`);
                    } else {
                      return [
                        createVNode("div", { class: "result-info" }, [
                          createVNode("span", { class: "result-title" }, toDisplayString(model.title?.rendered || model.name), 1)
                        ])
                      ];
                    }
                  }),
                  _: 2
                }, _parent));
              });
              _push2(`<!--]--></div></div>`);
            } else {
              _push2(`<!---->`);
            }
            if (unref(results).pages?.length) {
              _push2(`<div class="results-section" data-v-01afd6ea><h3 class="results-heading" data-v-01afd6ea>Pages</h3><div class="results-list" data-v-01afd6ea><!--[-->`);
              ssrRenderList(unref(results).pages.slice(0, 5), (page) => {
                _push2(ssrRenderComponent(_component_NuxtLink, {
                  key: page.slug,
                  to: `/${page.slug}`,
                  class: "result-item",
                  onClick: close
                }, {
                  default: withCtx((_, _push3, _parent2, _scopeId) => {
                    if (_push3) {
                      _push3(`<div class="result-info" data-v-01afd6ea${_scopeId}><span class="result-title" data-v-01afd6ea${_scopeId}>${ssrInterpolate(page.title)}</span></div>`);
                    } else {
                      return [
                        createVNode("div", { class: "result-info" }, [
                          createVNode("span", { class: "result-title" }, toDisplayString(page.title), 1)
                        ])
                      ];
                    }
                  }),
                  _: 2
                }, _parent));
              });
              _push2(`<!--]--></div></div>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div>`);
          } else {
            _push2(`<div class="quick-links" data-v-01afd6ea><h3 class="results-heading" data-v-01afd6ea>Quick Links</h3><div class="quick-links-grid" data-v-01afd6ea>`);
            _push2(ssrRenderComponent(_component_NuxtLink, {
              to: "/car-sales",
              class: "quick-link",
              onClick: close
            }, {
              default: withCtx((_, _push3, _parent2, _scopeId) => {
                if (_push3) {
                  _push3(`<span uk-icon="car" data-v-01afd6ea${_scopeId}></span> Used Cars `);
                } else {
                  return [
                    createVNode("span", { "uk-icon": "car" }),
                    createTextVNode(" Used Cars ")
                  ];
                }
              }),
              _: 1
            }, _parent));
            _push2(ssrRenderComponent(_component_NuxtLink, {
              to: "/special-offers",
              class: "quick-link",
              onClick: close
            }, {
              default: withCtx((_, _push3, _parent2, _scopeId) => {
                if (_push3) {
                  _push3(`<span uk-icon="tag" data-v-01afd6ea${_scopeId}></span> Special Offers `);
                } else {
                  return [
                    createVNode("span", { "uk-icon": "tag" }),
                    createTextVNode(" Special Offers ")
                  ];
                }
              }),
              _: 1
            }, _parent));
            _push2(ssrRenderComponent(_component_NuxtLink, {
              to: "/test-drive",
              class: "quick-link",
              onClick: close
            }, {
              default: withCtx((_, _push3, _parent2, _scopeId) => {
                if (_push3) {
                  _push3(`<span uk-icon="calendar" data-v-01afd6ea${_scopeId}></span> Test Drive `);
                } else {
                  return [
                    createVNode("span", { "uk-icon": "calendar" }),
                    createTextVNode(" Test Drive ")
                  ];
                }
              }),
              _: 1
            }, _parent));
            _push2(ssrRenderComponent(_component_NuxtLink, {
              to: "/contact",
              class: "quick-link",
              onClick: close
            }, {
              default: withCtx((_, _push3, _parent2, _scopeId) => {
                if (_push3) {
                  _push3(`<span uk-icon="receiver" data-v-01afd6ea${_scopeId}></span> Contact Us `);
                } else {
                  return [
                    createVNode("span", { "uk-icon": "receiver" }),
                    createTextVNode(" Contact Us ")
                  ];
                }
              }),
              _: 1
            }, _parent));
            _push2(`</div></div>`);
          }
          _push2(`</div></div></div>`);
        } else {
          _push2(`<!---->`);
        }
      }, "body", false, _parent);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/page-elements/GlobalSearch.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const GlobalSearch = /* @__PURE__ */ Object.assign(_export_sfc(_sfc_main, [["__scopeId", "data-v-01afd6ea"]]), { __name: "GlobalSearch" });

export { GlobalSearch as default };
//# sourceMappingURL=GlobalSearch-vywqn1bX.mjs.map
