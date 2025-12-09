import { defineComponent, computed, ref, watch, mergeProps, defineAsyncComponent, withCtx, createTextVNode, unref, toDisplayString, createVNode, useSSRContext } from 'vue';
import { _ as _export_sfc, a as useRoute, b as useRuntimeConfig, d as __nuxt_component_0$1 } from './server.mjs';
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate, ssrRenderList, ssrRenderAttr, ssrRenderClass } from 'vue/server-renderer';
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
const perPage = 24;
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "[...slug]",
  __ssrInlineRender: true,
  setup(__props) {
    const route = useRoute();
    const config = useRuntimeConfig();
    const slug = computed(() => {
      const params = route.params.slug;
      return Array.isArray(params) ? params : [params];
    });
    const condition = computed(() => slug.value[0] || "");
    const make = computed(() => slug.value[1] || "");
    const model = computed(() => slug.value[2] || "");
    const loading = ref(true);
    const vehicles = ref([]);
    const totalCount = ref(0);
    const currentPage = ref(1);
    const totalPages = computed(() => Math.ceil(totalCount.value / perPage));
    const visiblePages = computed(() => {
      const pages = [];
      const start = Math.max(1, currentPage.value - 2);
      const end = Math.min(totalPages.value, start + 4);
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      return pages;
    });
    const pageTitle = computed(() => {
      const parts = [];
      if (condition.value) {
        parts.push(titleCase(condition.value));
      }
      if (make.value) {
        parts.push(titleCase(make.value));
      }
      if (model.value) {
        parts.push(titleCase(model.value));
      }
      if (parts.length === 0) {
        return "Cars for Sale";
      }
      return `${parts.join(" ")} Cars for Sale`;
    });
    const seoHeading = computed(() => {
      if (model.value && make.value) {
        return `${titleCase(make.value)} ${titleCase(model.value)} for Sale`;
      }
      if (make.value) {
        return `${titleCase(make.value)} Cars for Sale`;
      }
      if (condition.value) {
        return `${titleCase(condition.value)} Cars for Sale`;
      }
      return "Cars for Sale";
    });
    const seoContent = computed(() => {
      if (make.value === "hyundai") {
        return `<p>Browse our selection of quality ${condition.value || ""} Hyundai ${model.value || "vehicles"} at Sale Hyundai. As your local Hyundai dealer, we offer competitive prices and expert service on all our vehicles.</p>`;
      }
      return `<p>Find your perfect ${condition.value || ""} ${make.value || ""} ${model.value || "car"} at Sale Hyundai. We stock a wide range of quality vehicles with competitive pricing and flexible finance options.</p>`;
    });
    const relatedLinks = computed(() => {
      const links = [];
      if (model.value && make.value) {
        links.push({ path: `/cars-for-sale/${condition.value}/${make.value}`, label: `All ${titleCase(make.value)}` });
      }
      if (make.value && !model.value) {
        if (condition.value !== "new") {
          links.push({ path: `/cars-for-sale/new/${make.value}`, label: `New ${titleCase(make.value)}` });
        }
        if (condition.value !== "used") {
          links.push({ path: `/cars-for-sale/used/${make.value}`, label: `Used ${titleCase(make.value)}` });
        }
        if (condition.value !== "demo") {
          links.push({ path: `/cars-for-sale/demo/${make.value}`, label: `Demo ${titleCase(make.value)}` });
        }
      }
      links.push({ path: "/car-sales", label: "All Vehicles" });
      return links;
    });
    watch(() => route.params.slug, () => {
      currentPage.value = 1;
      fetchVehicles();
    });
    const fetchVehicles = async () => {
      loading.value = true;
      try {
        const params = {
          page: currentPage.value,
          limit: perPage
        };
        if (condition.value) params.condition = condition.value;
        if (make.value) params.make = make.value;
        if (model.value) params.model = model.value;
        const response = await $fetch(`${config.public.apiUrl}/search`, { params });
        vehicles.value = response.vehicles || [];
        totalCount.value = response.total || vehicles.value.length;
      } catch (err) {
        console.error("Failed to fetch vehicles:", err);
        vehicles.value = [];
      } finally {
        loading.value = false;
      }
    };
    const titleCase = (str) => {
      if (!str) return "";
      return str.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
    };
    useSiteMeta({
      title: pageTitle,
      description: () => `Browse ${totalCount.value} ${condition.value || ""} ${make.value || ""} ${model.value || ""} cars for sale at Sale Hyundai. Competitive prices and finance available.`
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_LazyPageSchema = __nuxt_component_0_lazy;
      const _component_NuxtLink = __nuxt_component_0$1;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "taxonomy-page" }, _attrs))} data-v-f318cd41>`);
      _push(ssrRenderComponent(_component_LazyPageSchema, null, null, _parent));
      _push(`<div class="uk-section uk-section-small uk-background-secondary uk-light" data-v-f318cd41><div class="uk-container" data-v-f318cd41><nav aria-label="Breadcrumb" class="uk-margin-small-bottom" data-v-f318cd41><ul class="uk-breadcrumb uk-margin-remove" data-v-f318cd41><li data-v-f318cd41>`);
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
      _push(`</li><li data-v-f318cd41>`);
      _push(ssrRenderComponent(_component_NuxtLink, { to: "/car-sales" }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`Car Sales`);
          } else {
            return [
              createTextVNode("Car Sales")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</li>`);
      if (unref(condition)) {
        _push(`<li data-v-f318cd41>`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: `/cars-for-sale/${unref(condition)}`
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`${ssrInterpolate(titleCase(unref(condition)))}`);
            } else {
              return [
                createTextVNode(toDisplayString(titleCase(unref(condition))), 1)
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</li>`);
      } else {
        _push(`<!---->`);
      }
      if (unref(make)) {
        _push(`<li data-v-f318cd41>`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: `/cars-for-sale/${unref(condition)}/${unref(make)}`
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`${ssrInterpolate(titleCase(unref(make)))}`);
            } else {
              return [
                createTextVNode(toDisplayString(titleCase(unref(make))), 1)
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</li>`);
      } else {
        _push(`<!---->`);
      }
      if (unref(model)) {
        _push(`<li class="uk-disabled" data-v-f318cd41><span data-v-f318cd41>${ssrInterpolate(titleCase(unref(model)))}</span></li>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</ul></nav><h1 class="uk-h2 uk-margin-remove" data-v-f318cd41>${ssrInterpolate(unref(pageTitle))}</h1>`);
      if (unref(totalCount) > 0) {
        _push(`<p class="uk-text-meta uk-margin-small-top" data-v-f318cd41>${ssrInterpolate(unref(totalCount))} vehicle${ssrInterpolate(unref(totalCount) !== 1 ? "s" : "")} found </p>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div>`);
      if (unref(loading)) {
        _push(`<div class="uk-section uk-text-center" data-v-f318cd41><div uk-spinner="ratio: 2" data-v-f318cd41></div></div>`);
      } else {
        _push(`<div class="uk-section" data-v-f318cd41><div class="uk-container" data-v-f318cd41>`);
        if (unref(vehicles).length === 0) {
          _push(`<div class="uk-text-center" data-v-f318cd41><p class="uk-text-large uk-text-muted" data-v-f318cd41>No vehicles found matching your criteria.</p>`);
          _push(ssrRenderComponent(_component_NuxtLink, {
            to: "/car-sales",
            class: "uk-button uk-button-primary uk-margin-top"
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(` View All Vehicles `);
              } else {
                return [
                  createTextVNode(" View All Vehicles ")
                ];
              }
            }),
            _: 1
          }, _parent));
          _push(`</div>`);
        } else {
          _push(`<div class="uk-grid uk-grid-medium uk-child-width-1-2@s uk-child-width-1-3@m uk-child-width-1-4@l" uk-grid data-v-f318cd41><!--[-->`);
          ssrRenderList(unref(vehicles), (vehicle) => {
            _push(`<div data-v-f318cd41><div class="uk-card uk-card-default uk-card-hover" data-v-f318cd41><div class="uk-card-media-top uk-position-relative" data-v-f318cd41>`);
            _push(ssrRenderComponent(_component_NuxtLink, {
              to: `/vehicle-for-sale/${vehicle.id}/${vehicle.slug}`
            }, {
              default: withCtx((_, _push2, _parent2, _scopeId) => {
                if (_push2) {
                  _push2(`<img${ssrRenderAttr("src", vehicle.images?.[0] || vehicle.image)}${ssrRenderAttr("alt", vehicle.title)} class="uk-width-1-1" loading="lazy" data-v-f318cd41${_scopeId}>`);
                } else {
                  return [
                    createVNode("img", {
                      src: vehicle.images?.[0] || vehicle.image,
                      alt: vehicle.title,
                      class: "uk-width-1-1",
                      loading: "lazy"
                    }, null, 8, ["src", "alt"])
                  ];
                }
              }),
              _: 2
            }, _parent));
            if (vehicle.condition) {
              _push(`<span class="${ssrRenderClass([vehicle.condition.toLowerCase(), "condition-badge"])}" data-v-f318cd41>${ssrInterpolate(vehicle.condition)}</span>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</div><div class="uk-card-body uk-padding-small" data-v-f318cd41><h3 class="uk-card-title uk-margin-small-bottom" data-v-f318cd41>`);
            _push(ssrRenderComponent(_component_NuxtLink, {
              to: `/vehicle-for-sale/${vehicle.id}/${vehicle.slug}`,
              class: "uk-link-reset"
            }, {
              default: withCtx((_, _push2, _parent2, _scopeId) => {
                if (_push2) {
                  _push2(`${ssrInterpolate(vehicle.title || `${vehicle.year} ${vehicle.make} ${vehicle.model}`)}`);
                } else {
                  return [
                    createTextVNode(toDisplayString(vehicle.title || `${vehicle.year} ${vehicle.make} ${vehicle.model}`), 1)
                  ];
                }
              }),
              _: 2
            }, _parent));
            _push(`</h3><div class="uk-h4 uk-text-primary uk-margin-remove" data-v-f318cd41>${ssrInterpolate(vehicle.price ? `$${vehicle.price.toLocaleString()}` : "POA")}</div><ul class="uk-list uk-text-small uk-text-muted uk-margin-small-top" data-v-f318cd41>`);
            if (vehicle.year) {
              _push(`<li data-v-f318cd41>${ssrInterpolate(vehicle.year)}</li>`);
            } else {
              _push(`<!---->`);
            }
            if (vehicle.odometer) {
              _push(`<li data-v-f318cd41>${ssrInterpolate(vehicle.odometer.toLocaleString())} km</li>`);
            } else {
              _push(`<!---->`);
            }
            if (vehicle.transmission) {
              _push(`<li data-v-f318cd41>${ssrInterpolate(vehicle.transmission)}</li>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</ul></div></div></div>`);
          });
          _push(`<!--]--></div>`);
        }
        if (unref(totalPages) > 1) {
          _push(`<div class="uk-margin-large-top uk-text-center" data-v-f318cd41><ul class="uk-pagination uk-flex-center" data-v-f318cd41><li class="${ssrRenderClass({ "uk-disabled": unref(currentPage) === 1 })}" data-v-f318cd41><a href="#" data-v-f318cd41><span uk-pagination-previous data-v-f318cd41></span></a></li><!--[-->`);
          ssrRenderList(unref(visiblePages), (page) => {
            _push(`<li class="${ssrRenderClass({ "uk-active": page === unref(currentPage) })}" data-v-f318cd41><a href="#" data-v-f318cd41>${ssrInterpolate(page)}</a></li>`);
          });
          _push(`<!--]--><li class="${ssrRenderClass({ "uk-disabled": unref(currentPage) === unref(totalPages) })}" data-v-f318cd41><a href="#" data-v-f318cd41><span uk-pagination-next data-v-f318cd41></span></a></li></ul></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<div class="uk-margin-large-top uk-section uk-section-muted uk-padding" data-v-f318cd41><h2 data-v-f318cd41>${ssrInterpolate(unref(seoHeading))}</h2><div data-v-f318cd41>${unref(seoContent) ?? ""}</div></div>`);
        if (unref(relatedLinks).length > 0) {
          _push(`<div class="uk-margin-large-top" data-v-f318cd41><h3 data-v-f318cd41>Browse More</h3><div class="uk-grid uk-grid-small uk-child-width-auto" uk-grid data-v-f318cd41><!--[-->`);
          ssrRenderList(unref(relatedLinks), (link) => {
            _push(`<div data-v-f318cd41>`);
            _push(ssrRenderComponent(_component_NuxtLink, {
              to: link.path,
              class: "uk-button uk-button-default uk-button-small"
            }, {
              default: withCtx((_, _push2, _parent2, _scopeId) => {
                if (_push2) {
                  _push2(`${ssrInterpolate(link.label)}`);
                } else {
                  return [
                    createTextVNode(toDisplayString(link.label), 1)
                  ];
                }
              }),
              _: 2
            }, _parent));
            _push(`</div>`);
          });
          _push(`<!--]--></div></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></div>`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/cars-for-sale/[...slug].vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const ____slug_ = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-f318cd41"]]);

export { ____slug_ as default };
//# sourceMappingURL=_...slug_-Dt8ePwBS.mjs.map
