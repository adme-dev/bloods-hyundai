import { _ as _export_sfc, b as useRuntimeConfig, d as __nuxt_component_0$1 } from './server.mjs';
import { defineComponent, ref, computed, watch, mergeProps, unref, withCtx, createVNode, createTextVNode, toDisplayString, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrInterpolate, ssrRenderList, ssrRenderComponent, ssrRenderAttr, ssrRenderClass } from 'vue/server-renderer';
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
  __name: "RelatedVehicles",
  __ssrInlineRender: true,
  props: {
    model: {},
    title: {},
    limit: { default: 8 }
  },
  setup(__props) {
    const props = __props;
    const config = useRuntimeConfig();
    const loading = ref(true);
    const vehicles = ref([]);
    const viewAllLink = computed(() => {
      if (props.model) {
        return `/car-sales?make=hyundai&model=${props.model}`;
      }
      return "/car-sales";
    });
    watch(() => props.model, () => {
      fetchVehicles();
    });
    const fetchVehicles = async () => {
      loading.value = true;
      try {
        const params = {
          make: "hyundai",
          limit: props.limit
        };
        if (props.model) {
          params.model = props.model;
        }
        const response = await $fetch(`${config.public.apiUrl}/search`, { params });
        vehicles.value = response.vehicles || [];
      } catch (err) {
        console.error("Failed to fetch related vehicles:", err);
        vehicles.value = [];
      } finally {
        loading.value = false;
      }
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0$1;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "related-vehicles uk-section" }, _attrs))} data-v-8cb497f5><div class="uk-container" data-v-8cb497f5><h2 class="uk-text-center uk-margin-medium-bottom" data-v-8cb497f5>${ssrInterpolate(__props.title || "Related Vehicles")}</h2>`);
      if (unref(loading)) {
        _push(`<div class="uk-text-center uk-padding" data-v-8cb497f5><div uk-spinner data-v-8cb497f5></div></div>`);
      } else if (unref(vehicles).length) {
        _push(`<div uk-slider="finite: true" data-v-8cb497f5><div class="uk-position-relative uk-visible-toggle" tabindex="-1" data-v-8cb497f5><ul class="uk-slider-items uk-child-width-1-1 uk-child-width-1-2@s uk-child-width-1-3@m uk-child-width-1-4@l uk-grid uk-grid-medium" data-v-8cb497f5><!--[-->`);
        ssrRenderList(unref(vehicles), (vehicle) => {
          _push(`<li data-v-8cb497f5><div class="uk-card uk-card-default uk-card-hover" data-v-8cb497f5><div class="uk-card-media-top" data-v-8cb497f5>`);
          _push(ssrRenderComponent(_component_NuxtLink, {
            to: `/vehicle-for-sale/${vehicle.id}/${vehicle.slug}`
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`<img${ssrRenderAttr("src", vehicle.images?.[0] || vehicle.image)}${ssrRenderAttr("alt", vehicle.title)} class="uk-width-1-1" loading="lazy" data-v-8cb497f5${_scopeId}>`);
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
            _push(`<span class="${ssrRenderClass([vehicle.condition.toLowerCase(), "condition-badge"])}" data-v-8cb497f5>${ssrInterpolate(vehicle.condition)}</span>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div><div class="uk-card-body uk-padding-small" data-v-8cb497f5><h3 class="uk-card-title uk-margin-small-bottom" data-v-8cb497f5>`);
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
          _push(`</h3><div class="uk-h4 uk-text-primary uk-margin-remove" data-v-8cb497f5>${ssrInterpolate(vehicle.price ? `$${vehicle.price.toLocaleString()}` : "POA")}</div><ul class="uk-list uk-text-small uk-text-muted uk-margin-small-top" data-v-8cb497f5>`);
          if (vehicle.year) {
            _push(`<li data-v-8cb497f5>${ssrInterpolate(vehicle.year)}</li>`);
          } else {
            _push(`<!---->`);
          }
          if (vehicle.odometer) {
            _push(`<li data-v-8cb497f5>${ssrInterpolate(vehicle.odometer.toLocaleString())} km</li>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</ul></div></div></li>`);
        });
        _push(`<!--]--></ul><a class="uk-position-center-left uk-position-small uk-hidden-hover" href="#" uk-slidenav-previous uk-slider-item="previous" data-v-8cb497f5></a><a class="uk-position-center-right uk-position-small uk-hidden-hover" href="#" uk-slidenav-next uk-slider-item="next" data-v-8cb497f5></a></div><ul class="uk-slider-nav uk-dotnav uk-flex-center uk-margin" data-v-8cb497f5></ul></div>`);
      } else {
        _push(`<div class="uk-text-center uk-text-muted" data-v-8cb497f5><p data-v-8cb497f5>No vehicles available at this time.</p></div>`);
      }
      if (unref(vehicles).length) {
        _push(`<div class="uk-text-center uk-margin-medium-top" data-v-8cb497f5>`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: unref(viewAllLink),
          class: "uk-button uk-button-default"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(` View All ${ssrInterpolate(__props.model ? __props.model.replace(/-/g, " ") : "")} Stock `);
            } else {
              return [
                createTextVNode(" View All " + toDisplayString(__props.model ? __props.model.replace(/-/g, " ") : "") + " Stock ", 1)
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/models/RelatedVehicles.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const RelatedVehicles = /* @__PURE__ */ Object.assign(_export_sfc(_sfc_main, [["__scopeId", "data-v-8cb497f5"]]), { __name: "RelatedVehicles" });

export { RelatedVehicles as default };
//# sourceMappingURL=RelatedVehicles-DrrGxWl2.mjs.map
