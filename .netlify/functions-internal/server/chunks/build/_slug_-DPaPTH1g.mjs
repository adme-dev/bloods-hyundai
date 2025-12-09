import { defineComponent, computed, withAsyncContext, defineAsyncComponent, watch, mergeProps, unref, withCtx, createTextVNode, toDisplayString, createVNode, resolveDynamicComponent, useSSRContext } from 'vue';
import { _ as _export_sfc, a as useRoute, d as __nuxt_component_0$1, j as __nuxt_component_1$1 } from './server.mjs';
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate, ssrRenderList, ssrRenderClass, ssrRenderVNode } from 'vue/server-renderer';
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
const __nuxt_component_3_lazy = defineAsyncComponent(() => import('./VariantSlider-DZODv2DH.mjs').then((c) => c.default || c));
const __nuxt_component_4_lazy = defineAsyncComponent(() => import('./RelatedVehicles-DrrGxWl2.mjs').then((c) => c.default || c));
const __nuxt_component_5_lazy = defineAsyncComponent(() => import('./PostContent-ViI540rn.mjs').then((c) => c.default || c));
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "[slug]",
  __ssrInlineRender: true,
  async setup(__props) {
    let __temp, __restore;
    const route = useRoute();
    const slug = computed(() => route.params.slug);
    const { data: apiResponse, pending, error } = ([__temp, __restore] = withAsyncContext(() => useFetch(() => `/api/vehicle/${slug.value}`, {
      key: `vehicle-${slug.value}`,
      watch: [slug]
    }, "$M5HyHB9gfu")), __temp = await __temp, __restore(), __temp);
    const vehicle = computed(() => apiResponse.value?.vehicle || null);
    const heroSlide = computed(() => vehicle.value?.header?.slides?.[0] || {});
    const dynamicFormComponent = computed(() => {
      if (!vehicle.value?.form) return null;
      if (vehicle.value.form === "Register" || vehicle.value.form === "Contact") {
        return defineAsyncComponent(() => import('./ContactForm-CELiM3He.mjs'));
      }
      return null;
    });
    useSiteMeta({
      title: () => vehicle.value?.model || "Vehicle",
      description: () => vehicle.value?.description || `Explore the ${vehicle.value?.model || "vehicle"} at Sale Hyundai.`,
      image: () => heroSlide.value?.desktop || ""
    });
    watch(vehicle, () => {
      if (vehicle.value) ;
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_LazyPageSchema = __nuxt_component_0_lazy;
      const _component_NuxtLink = __nuxt_component_0$1;
      const _component_ClientOnly = __nuxt_component_1$1;
      const _component_LazyVariantSlider = __nuxt_component_3_lazy;
      const _component_LazyRelatedVehicles = __nuxt_component_4_lazy;
      const _component_LazyPostContent = __nuxt_component_5_lazy;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "vehicle-detail-page" }, _attrs))} data-v-d2ce0af0>`);
      _push(ssrRenderComponent(_component_LazyPageSchema, null, null, _parent));
      if (unref(pending)) {
        _push(`<div class="uk-flex uk-height-medium uk-background-secondary uk-light" uk-height-viewport="offset-top: true" data-v-d2ce0af0><div class="uk-margin-auto uk-margin-auto-vertical uk-text-center" data-v-d2ce0af0><div uk-spinner="ratio: 2" data-v-d2ce0af0></div><div class="uk-padding-small" data-v-d2ce0af0>Loading vehicle...</div></div></div>`);
      } else if (unref(vehicle)) {
        _push(`<div data-v-d2ce0af0>`);
        if (unref(vehicle).header?.slides) {
          _push(`<div id="top" class="uk-position-relative uk-background-secondary" data-v-d2ce0af0><div class="uk-width-1-1 uk-overflow-hidden uk-inline" data-v-d2ce0af0><div class="uk-position-bottom uk-position-z-index uk-light" data-v-d2ce0af0><div class="uk-container uk-container-large" data-v-d2ce0af0><div class="uk-padding spec-strip-grid uk-grid" uk-grid data-v-d2ce0af0><div class="uk-width-1-1 spec-strip-header uk-margin-medium-bottom" data-v-d2ce0af0><span class="uk-h1 uk-text-bold" data-v-d2ce0af0>${ssrInterpolate(unref(heroSlide).heading)}</span><div class="uk-h4 uk-margin-remove-top" data-v-d2ce0af0>${ssrInterpolate(unref(heroSlide).sub_heading)}</div></div><!--[-->`);
          ssrRenderList(unref(heroSlide).bottom_strip, (item, index) => {
            _push(`<div class="uk-width-auto spec-strip" data-v-d2ce0af0><div class="uk-h5 uk-margin-remove-bottom" data-v-d2ce0af0>${item.heading ?? ""}</div><div class="uk-text-small uk-text-light uk-margin-small-bottom" data-v-d2ce0af0>${item.sub_heading ?? ""}</div></div>`);
          });
          _push(`<!--]--><div class="uk-width-1-1 uk-width-auto@m uk-margin-auto-left@m" data-v-d2ce0af0>`);
          if (unref(vehicle).form) {
            _push(ssrRenderComponent(_component_NuxtLink, {
              to: "#register",
              class: "uk-width-1-1 uk-width-auto@s uk-button uk-button-default tm-button-default text-inherit heading-btn"
            }, {
              default: withCtx((_, _push2, _parent2, _scopeId) => {
                if (_push2) {
                  _push2(`${ssrInterpolate(unref(heroSlide).button)}`);
                } else {
                  return [
                    createTextVNode(toDisplayString(unref(heroSlide).button), 1)
                  ];
                }
              }),
              _: 1
            }, _parent));
          } else {
            _push(ssrRenderComponent(_component_NuxtLink, {
              to: `/build/${unref(vehicle).model || unref(slug)}`,
              class: "uk-width-1-1 uk-width-auto@s uk-button uk-button-default tm-button-default text-inherit heading-btn"
            }, {
              default: withCtx((_, _push2, _parent2, _scopeId) => {
                if (_push2) {
                  _push2(`${ssrInterpolate(unref(heroSlide).button || "Build & Price")}`);
                } else {
                  return [
                    createTextVNode(toDisplayString(unref(heroSlide).button || "Build & Price"), 1)
                  ];
                }
              }),
              _: 1
            }, _parent));
          }
          _push(`</div></div></div><div class="uk-container uk-container-large uk-margin-small-bottom uk-text-center bounce uk-visible@s" data-v-d2ce0af0><a href="#start" uk-scroll="offset:140" data-v-d2ce0af0><span uk-icon="icon: chevron-down; ratio: 1.3" data-v-d2ce0af0></span></a></div></div><div class="uk-overflow-hidden" uk-height-viewport data-v-d2ce0af0>`);
          _push(ssrRenderComponent(_component_ClientOnly, null, {}, _parent));
          _push(`</div><div class="uk-position-bottom uk-width-1-1 uk-gradient" data-v-d2ce0af0></div></div></div>`);
        } else {
          _push(`<!---->`);
        }
        if (unref(vehicle).form) {
          _push(`<div class="${ssrRenderClass([unref(vehicle).formbg === "uk-light" ? "uk-background-secondary uk-light" : ""])}" data-v-d2ce0af0><div class="${ssrRenderClass([[unref(vehicle).form === "Contact" ? "uk-container-large" : "uk-container-xsmall"], "uk-container form-wrap"])}" data-v-d2ce0af0>`);
          ssrRenderVNode(_push, createVNode(resolveDynamicComponent(unref(dynamicFormComponent)), {
            activeHoursTab: "register",
            class: "uk-margin-large-bottom uk-margin-large-top",
            id: "register"
          }, null), _parent);
          _push(`</div></div>`);
        } else {
          _push(`<div id="start" class="uk-margin-large-top" data-v-d2ce0af0>`);
          if (unref(vehicle).model) {
            _push(ssrRenderComponent(_component_LazyVariantSlider, {
              model: unref(vehicle).model,
              "model-title": unref(slug)
            }, null, _parent));
          } else {
            _push(`<!---->`);
          }
          _push(`</div>`);
        }
        _push(`<div class="uk-background-muted" data-v-d2ce0af0>`);
        _push(ssrRenderComponent(_component_LazyRelatedVehicles, {
          model: unref(slug),
          title: "Available Stock"
        }, null, _parent));
        _push(`</div>`);
        if (unref(vehicle).content?.rendered) {
          _push(`<div class="uk-section" data-v-d2ce0af0>`);
          _push(ssrRenderComponent(_component_LazyPostContent, {
            content: unref(vehicle).content.rendered
          }, null, _parent));
          _push(`</div>`);
        } else {
          _push(`<!---->`);
        }
        if (!unref(vehicle).form) {
          _push(`<div class="uk-section uk-section-primary uk-light uk-text-center" data-v-d2ce0af0><div class="uk-container" data-v-d2ce0af0><h2 data-v-d2ce0af0>Ready to Experience the ${ssrInterpolate(unref(vehicle).model)}?</h2><p class="uk-text-lead" data-v-d2ce0af0>Book a test drive today and discover what makes it special.</p><div class="uk-margin-medium-top uk-grid-small uk-flex-center" uk-grid data-v-d2ce0af0><div data-v-d2ce0af0>`);
          _push(ssrRenderComponent(_component_NuxtLink, {
            to: "/test-drive",
            class: "uk-button uk-button-default uk-button-large"
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
          _push(`</div><div data-v-d2ce0af0>`);
          _push(ssrRenderComponent(_component_NuxtLink, {
            to: `/variant/${unref(slug)}`,
            class: "uk-button uk-button-secondary uk-button-large"
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
          _push(`</div></div></div></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
      } else {
        _push(`<div class="uk-section uk-text-center" data-v-d2ce0af0><div class="uk-container" data-v-d2ce0af0><h2 data-v-d2ce0af0>Vehicle Not Found</h2><p class="uk-text-muted" data-v-d2ce0af0>We couldn&#39;t find the vehicle you&#39;re looking for.</p>`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: "/build-and-price",
          class: "uk-button uk-button-primary"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(` View All Models `);
            } else {
              return [
                createTextVNode(" View All Models ")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</div></div>`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/vehicle/[slug].vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const _slug_ = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-d2ce0af0"]]);

export { _slug_ as default };
//# sourceMappingURL=_slug_-DPaPTH1g.mjs.map
