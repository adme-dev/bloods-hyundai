import { _ as _export_sfc, b as useRuntimeConfig, d as __nuxt_component_0$1 } from './server.mjs';
import { defineComponent, ref, watch, mergeProps, unref, withCtx, createTextVNode, toDisplayString, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrInterpolate, ssrRenderList, ssrRenderAttr, ssrRenderComponent } from 'vue/server-renderer';
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
  __name: "VariantSlider",
  __ssrInlineRender: true,
  props: {
    model: {},
    modelTitle: {}
  },
  setup(__props) {
    const props = __props;
    const config = useRuntimeConfig();
    const loading = ref(true);
    const variants = ref([]);
    watch(() => props.model, () => {
      fetchVariants();
    });
    const fetchVariants = async () => {
      loading.value = true;
      try {
        const response = await $fetch(`${config.public.apiUrl}/get-car-calculator`, {
          params: {
            modelname: props.model,
            postcode: "3000",
            displaypowertrain: true
          }
        });
        if (response.variants) {
          variants.value = response.variants.slice(0, 8);
        } else if (response.variantGroups) {
          variants.value = response.variantGroups.flatMap((g) => g.variants || [g]).slice(0, 8);
        }
      } catch (err) {
        console.error("Failed to fetch variants:", err);
        variants.value = [];
      } finally {
        loading.value = false;
      }
    };
    const formatPrice = (price) => {
      return price?.toLocaleString() || "0";
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0$1;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "variant-slider uk-section" }, _attrs))} data-v-cec3a889><div class="uk-container" data-v-cec3a889><h2 class="uk-text-center uk-margin-medium-bottom" data-v-cec3a889>${ssrInterpolate(__props.modelTitle)} Range </h2>`);
      if (unref(loading)) {
        _push(`<div class="uk-text-center uk-padding" data-v-cec3a889><div uk-spinner data-v-cec3a889></div><p class="uk-margin-small-top" data-v-cec3a889>Loading variants...</p></div>`);
      } else if (unref(variants).length) {
        _push(`<div uk-slider="finite: true" data-v-cec3a889><div class="uk-position-relative uk-visible-toggle" tabindex="-1" data-v-cec3a889><ul class="uk-slider-items uk-child-width-1-1 uk-child-width-1-2@s uk-child-width-1-3@m uk-child-width-1-4@l uk-grid uk-grid-medium" data-v-cec3a889><!--[-->`);
        ssrRenderList(unref(variants), (variant) => {
          _push(`<li data-v-cec3a889><div class="uk-card uk-card-default uk-card-hover variant-card" data-v-cec3a889><div class="uk-card-media-top" data-v-cec3a889><img${ssrRenderAttr("src", variant.image || variant.colourImage)}${ssrRenderAttr("alt", variant.name)} class="uk-width-1-1" loading="lazy" data-v-cec3a889></div><div class="uk-card-body" data-v-cec3a889><h3 class="uk-card-title uk-text-bold uk-margin-small-bottom" data-v-cec3a889>${ssrInterpolate(variant.name)}</h3>`);
          if (variant.engineType || variant.transmission) {
            _push(`<p class="uk-text-meta uk-margin-remove" data-v-cec3a889>${ssrInterpolate([variant.engineType, variant.transmission].filter(Boolean).join(" • "))}</p>`);
          } else {
            _push(`<!---->`);
          }
          if (variant.driveawayPrice || variant.price) {
            _push(`<div class="uk-h4 uk-text-primary uk-margin-small-top" data-v-cec3a889> From $${ssrInterpolate(formatPrice(variant.driveawayPrice || variant.price))} <sup class="uk-text-small" data-v-cec3a889>[D]</sup></div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`<div class="uk-margin-top" data-v-cec3a889>`);
          _push(ssrRenderComponent(_component_NuxtLink, {
            to: `/calculator/${__props.model}`,
            class: "uk-button uk-button-primary uk-button-small uk-width-1-1"
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
            _: 2
          }, _parent));
          _push(`</div></div></div></li>`);
        });
        _push(`<!--]--></ul><a class="uk-position-center-left uk-position-small uk-hidden-hover" href="#" uk-slidenav-previous uk-slider-item="previous" data-v-cec3a889></a><a class="uk-position-center-right uk-position-small uk-hidden-hover" href="#" uk-slidenav-next uk-slider-item="next" data-v-cec3a889></a></div><ul class="uk-slider-nav uk-dotnav uk-flex-center uk-margin" data-v-cec3a889></ul></div>`);
      } else {
        _push(`<div class="uk-text-center uk-text-muted" data-v-cec3a889><p data-v-cec3a889>No variants available at this time.</p></div>`);
      }
      _push(`<div class="uk-text-center uk-margin-medium-top" data-v-cec3a889>`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: `/build/${__props.model}`,
        class: "uk-button uk-button-default"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(` View All ${ssrInterpolate(__props.modelTitle)} Variants `);
          } else {
            return [
              createTextVNode(" View All " + toDisplayString(__props.modelTitle) + " Variants ", 1)
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div></div></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/models/VariantSlider.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const VariantSlider = /* @__PURE__ */ Object.assign(_export_sfc(_sfc_main, [["__scopeId", "data-v-cec3a889"]]), { __name: "VariantSlider" });

export { VariantSlider as default };
//# sourceMappingURL=VariantSlider-DZODv2DH.mjs.map
