import { defineComponent, computed, ref, mergeProps, defineAsyncComponent, unref, withCtx, createTextVNode, createVNode, useSSRContext } from 'vue';
import { _ as _export_sfc, a as useRoute, d as __nuxt_component_0$1 } from './server.mjs';
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate, ssrRenderStyle, ssrRenderAttr, ssrRenderList, ssrRenderClass, ssrIncludeBooleanAttr } from 'vue/server-renderer';
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
  __name: "[model]",
  __ssrInlineRender: true,
  setup(__props) {
    const route = useRoute();
    const modelSlug = computed(() => route.params.model);
    const postcode = ref("3000");
    const loading = ref(true);
    const error = ref(null);
    const calculatorData = ref(null);
    const accessories = ref([]);
    const selectedPowertrain = ref("");
    const selectedVariantGroup = ref(null);
    const selectedVariant = ref(null);
    const selectedColour = ref(null);
    const selectedTrim = ref(null);
    const selectedAccessories = ref([]);
    const powertrains = computed(() => calculatorData.value?.powertrains || []);
    const filteredVariantGroups = computed(() => {
      if (!calculatorData.value?.variants) return [];
      if (!selectedPowertrain.value) return calculatorData.value.variants;
      return calculatorData.value.variants.filter(
        (v) => !v.powertrain || v.powertrain === selectedPowertrain.value
      );
    });
    const selectedColourImage = computed(() => {
      if (selectedColour.value?.image) return selectedColour.value.image;
      if (selectedVariant.value?.image) return selectedVariant.value.image;
      if (selectedVariantGroup.value?.image) return selectedVariantGroup.value.image;
      return null;
    });
    const basePrice = computed(() => {
      return selectedVariant.value?.price || selectedVariantGroup.value?.lowestPrice || 0;
    });
    const colourPrice = computed(() => {
      return (selectedColour.value?.price || 0) + (selectedTrim.value?.price || 0);
    });
    const accessoriesTotal = computed(() => {
      return selectedAccessories.value.reduce((sum, id) => {
        const acc = accessories.value.find((a) => a.id === id);
        return sum + (acc?.price || 0);
      }, 0);
    });
    const totalPrice = computed(() => {
      return basePrice.value + colourPrice.value + accessoriesTotal.value;
    });
    const formatPrice = (price) => {
      return price?.toLocaleString() || "0";
    };
    useSiteMeta({
      title: () => `Build & Price ${calculatorData.value?.model || modelSlug.value}`,
      description: () => `Configure and price your ${calculatorData.value?.model || modelSlug.value}. Choose colours, options and accessories.`
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_LazyPageSchema = __nuxt_component_0_lazy;
      const _component_NuxtLink = __nuxt_component_0$1;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "car-calculator-page" }, _attrs))} data-v-80c6c7be>`);
      _push(ssrRenderComponent(_component_LazyPageSchema, null, null, _parent));
      if (unref(loading)) {
        _push(`<div class="uk-section uk-text-center" data-v-80c6c7be><div uk-spinner="ratio: 2" data-v-80c6c7be></div><p class="uk-margin-top" data-v-80c6c7be>Loading ${ssrInterpolate(unref(modelSlug))}...</p></div>`);
      } else if (unref(error)) {
        _push(`<div class="uk-section uk-text-center" data-v-80c6c7be><h2 data-v-80c6c7be>Unable to load vehicle</h2><p class="uk-text-muted" data-v-80c6c7be>${ssrInterpolate(unref(error))}</p>`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: "/build-and-price",
          class: "uk-button uk-button-primary"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`Back to Vehicles`);
            } else {
              return [
                createTextVNode("Back to Vehicles")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</div>`);
      } else if (unref(calculatorData)) {
        _push(`<div class="calculator-layout" data-v-80c6c7be><div class="uk-grid uk-grid-collapse" uk-grid data-v-80c6c7be><div class="uk-width-2-5@m left-panel" data-v-80c6c7be><div class="sticky-content uk-position-sticky" style="${ssrRenderStyle({ "top": "80px" })}" data-v-80c6c7be><div class="vehicle-image-container uk-position-relative" data-v-80c6c7be>`);
        if (unref(selectedColourImage)) {
          _push(`<img${ssrRenderAttr("src", unref(selectedColourImage))}${ssrRenderAttr("alt", unref(calculatorData).model)} class="uk-width-1-1" data-v-80c6c7be>`);
        } else {
          _push(`<div class="uk-background-muted uk-padding-large uk-text-center" data-v-80c6c7be><span class="uk-h3" data-v-80c6c7be>${ssrInterpolate(unref(calculatorData).model)}</span></div>`);
        }
        _push(`</div><div class="quick-summary uk-card uk-card-default uk-card-body uk-margin-top" data-v-80c6c7be><h4 class="uk-card-title" data-v-80c6c7be>Your Selection</h4><dl class="uk-description-list" data-v-80c6c7be><dt data-v-80c6c7be>Model</dt><dd data-v-80c6c7be>${ssrInterpolate(unref(calculatorData).model)}</dd>`);
        if (unref(selectedVariantGroup)) {
          _push(`<!--[--><dt data-v-80c6c7be>Variant</dt><dd data-v-80c6c7be>${ssrInterpolate(unref(selectedVariantGroup).name)}</dd><!--]-->`);
        } else {
          _push(`<!---->`);
        }
        if (unref(selectedColour)) {
          _push(`<!--[--><dt data-v-80c6c7be>Colour</dt><dd data-v-80c6c7be>${ssrInterpolate(unref(selectedColour).name)}</dd><!--]-->`);
        } else {
          _push(`<!---->`);
        }
        if (unref(selectedTrim)) {
          _push(`<!--[--><dt data-v-80c6c7be>Interior</dt><dd data-v-80c6c7be>${ssrInterpolate(unref(selectedTrim).name)}</dd><!--]-->`);
        } else {
          _push(`<!---->`);
        }
        _push(`</dl></div></div></div><div class="uk-width-3-5@m right-panel" data-v-80c6c7be><div class="uk-padding" data-v-80c6c7be><div class="config-header uk-margin-medium-bottom" data-v-80c6c7be>`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: "/build-and-price",
          class: "uk-button uk-button-text uk-margin-bottom"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`<span uk-icon="arrow-left" data-v-80c6c7be${_scopeId}></span> Back to all vehicles `);
            } else {
              return [
                createVNode("span", { "uk-icon": "arrow-left" }),
                createTextVNode(" Back to all vehicles ")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`<h1 class="uk-heading-small uk-margin-remove-top" data-v-80c6c7be>${ssrInterpolate(unref(calculatorData).model)}</h1>`);
        if (unref(powertrains).length > 1) {
          _push(`<div class="uk-margin-top" data-v-80c6c7be><ul class="uk-subnav uk-subnav-pill" uk-switcher data-v-80c6c7be><!--[-->`);
          ssrRenderList(unref(powertrains), (powertrain) => {
            _push(`<li class="${ssrRenderClass({ "uk-active": unref(selectedPowertrain) === powertrain })}" data-v-80c6c7be><a href="#" data-v-80c6c7be>${ssrInterpolate(powertrain)}</a></li>`);
          });
          _push(`<!--]--></ul></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div><section class="uk-margin-large-bottom" data-v-80c6c7be><h2 class="uk-h3" data-v-80c6c7be>Select your ${ssrInterpolate(unref(calculatorData).model)}</h2><div class="uk-grid uk-grid-small uk-child-width-1-2@s" uk-grid data-v-80c6c7be><!--[-->`);
        ssrRenderList(unref(filteredVariantGroups), (group) => {
          _push(`<div data-v-80c6c7be><div class="${ssrRenderClass([{ "uk-card-primary uk-light": unref(selectedVariantGroup)?.id === group.id }, "uk-card uk-card-hover variant-card"])}" style="${ssrRenderStyle({ "cursor": "pointer" })}" data-v-80c6c7be>`);
          if (group.image) {
            _push(`<div class="uk-card-media-top" data-v-80c6c7be><img${ssrRenderAttr("src", group.image)}${ssrRenderAttr("alt", group.name)} data-v-80c6c7be></div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`<div class="uk-card-body" data-v-80c6c7be><h3 class="uk-card-title uk-margin-small-bottom" data-v-80c6c7be>${ssrInterpolate(group.name)}</h3>`);
          if (group.lowestPrice) {
            _push(`<div class="uk-h4 uk-margin-small" data-v-80c6c7be> From $${ssrInterpolate(formatPrice(group.lowestPrice))}<sup data-v-80c6c7be>[D]</sup></div>`);
          } else {
            _push(`<!---->`);
          }
          if (group.smartSenseIncluded) {
            _push(`<span class="uk-badge uk-badge-success" data-v-80c6c7be> SmartSense™ Included </span>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div></div></div>`);
        });
        _push(`<!--]--></div></section>`);
        if (unref(selectedVariantGroup)?.features?.length) {
          _push(`<section class="uk-margin-large-bottom" data-v-80c6c7be><h2 class="uk-h3" data-v-80c6c7be>Key Features</h2><ul class="uk-list uk-list-disc uk-column-1-2@m" data-v-80c6c7be><!--[-->`);
          ssrRenderList(unref(selectedVariantGroup).features.slice(0, 8), (feature, index) => {
            _push(`<li data-v-80c6c7be><span data-v-80c6c7be>${feature.text ?? ""}</span></li>`);
          });
          _push(`<!--]--></ul></section>`);
        } else {
          _push(`<!---->`);
        }
        if (unref(selectedVariant)?.colours?.length) {
          _push(`<section class="uk-margin-large-bottom" data-v-80c6c7be><h2 class="uk-h3" data-v-80c6c7be>Select Colour</h2><p class="uk-text-muted uk-text-small" data-v-80c6c7be>Recommended Retail Price (RRP) shown</p><div class="colour-grid uk-grid uk-grid-small uk-child-width-1-3@s uk-child-width-1-4@m" uk-grid data-v-80c6c7be><!--[-->`);
          ssrRenderList(unref(selectedVariant).colours, (colour) => {
            _push(`<div data-v-80c6c7be><div class="${ssrRenderClass([{ "uk-card-primary": unref(selectedColour)?.id === colour.id, "uk-disabled": colour.soldOut }, "colour-option uk-card uk-card-default uk-card-small uk-text-center"])}" style="${ssrRenderStyle({ "cursor": "pointer" })}" data-v-80c6c7be><div class="colour-swatch uk-margin-small" data-v-80c6c7be>`);
            if (colour.swatch) {
              _push(`<img${ssrRenderAttr("src", colour.swatch)}${ssrRenderAttr("alt", colour.name)} class="uk-border-circle" style="${ssrRenderStyle({ "width": "50px", "height": "50px" })}" data-v-80c6c7be>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</div><div class="uk-text-small" data-v-80c6c7be>${ssrInterpolate(colour.name)}</div><div class="uk-text-meta" data-v-80c6c7be>${ssrInterpolate(colour.price > 0 ? `+$${formatPrice(colour.price)}` : "Included")}</div>`);
            if (colour.soldOut) {
              _push(`<span class="uk-badge uk-badge-danger" data-v-80c6c7be>Sold Out</span>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</div></div>`);
          });
          _push(`<!--]--></div>`);
          if (unref(selectedColour)?.trims?.length) {
            _push(`<div class="uk-margin-top" data-v-80c6c7be><h3 class="uk-h4" data-v-80c6c7be>Interior</h3><div class="uk-grid uk-grid-small uk-child-width-1-3@s" uk-grid data-v-80c6c7be><!--[-->`);
            ssrRenderList(unref(selectedColour).trims, (trim) => {
              _push(`<div data-v-80c6c7be><div class="${ssrRenderClass([{ "uk-card-primary": unref(selectedTrim)?.id === trim.id }, "colour-option uk-card uk-card-default uk-card-small uk-text-center"])}" style="${ssrRenderStyle({ "cursor": "pointer" })}" data-v-80c6c7be><div class="colour-swatch uk-margin-small" data-v-80c6c7be>`);
              if (trim.swatch) {
                _push(`<img${ssrRenderAttr("src", trim.swatch)}${ssrRenderAttr("alt", trim.name)} class="uk-border-circle" style="${ssrRenderStyle({ "width": "50px", "height": "50px" })}" data-v-80c6c7be>`);
              } else {
                _push(`<!---->`);
              }
              _push(`</div><div class="uk-text-small" data-v-80c6c7be>${ssrInterpolate(trim.name)}</div><div class="uk-text-meta" data-v-80c6c7be>${ssrInterpolate(trim.price > 0 ? `+$${formatPrice(trim.price)}` : "Included")}</div></div></div>`);
            });
            _push(`<!--]--></div></div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</section>`);
        } else {
          _push(`<!---->`);
        }
        if (unref(accessories).length) {
          _push(`<section class="uk-margin-large-bottom" data-v-80c6c7be><h2 class="uk-h3" data-v-80c6c7be>Accessories</h2><div class="uk-grid uk-grid-small uk-child-width-1-2@s uk-child-width-1-3@m" uk-grid data-v-80c6c7be><!--[-->`);
          ssrRenderList(unref(accessories).slice(0, 12), (accessory) => {
            _push(`<div data-v-80c6c7be><label class="uk-card uk-card-default uk-card-small uk-card-hover" style="${ssrRenderStyle({ "cursor": "pointer" })}" data-v-80c6c7be><div class="uk-card-body" data-v-80c6c7be><div class="uk-flex uk-flex-between" data-v-80c6c7be><div data-v-80c6c7be><input type="checkbox" class="uk-checkbox uk-margin-small-right"${ssrIncludeBooleanAttr(unref(selectedAccessories).includes(accessory.id)) ? " checked" : ""} data-v-80c6c7be><span class="uk-text-bold" data-v-80c6c7be>${ssrInterpolate(accessory.name)}</span></div></div><div class="uk-text-primary uk-margin-small-top" data-v-80c6c7be>$${ssrInterpolate(formatPrice(accessory.price))}</div></div></label></div>`);
          });
          _push(`<!--]--></div></section>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<section class="price-summary uk-card uk-card-default uk-card-body" data-v-80c6c7be><h2 class="uk-h3" data-v-80c6c7be>Price Summary</h2><dl class="uk-description-list uk-description-list-divider" data-v-80c6c7be><div class="uk-flex uk-flex-between" data-v-80c6c7be><dt data-v-80c6c7be>Base Price</dt><dd data-v-80c6c7be>$${ssrInterpolate(formatPrice(unref(basePrice)))}</dd></div>`);
        if (unref(colourPrice) > 0) {
          _push(`<div class="uk-flex uk-flex-between" data-v-80c6c7be><dt data-v-80c6c7be>Colour (${ssrInterpolate(unref(selectedColour)?.name)})</dt><dd data-v-80c6c7be>+$${ssrInterpolate(formatPrice(unref(colourPrice)))}</dd></div>`);
        } else {
          _push(`<!---->`);
        }
        if (unref(accessoriesTotal) > 0) {
          _push(`<div class="uk-flex uk-flex-between" data-v-80c6c7be><dt data-v-80c6c7be>Accessories</dt><dd data-v-80c6c7be>+$${ssrInterpolate(formatPrice(unref(accessoriesTotal)))}</dd></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<div class="uk-flex uk-flex-between uk-margin-top" data-v-80c6c7be><dt class="uk-h3" data-v-80c6c7be>Total Drive Away*</dt><dd class="uk-h3 uk-text-primary" data-v-80c6c7be>$${ssrInterpolate(formatPrice(unref(totalPrice)))}</dd></div></dl><p class="uk-text-meta uk-margin-top" data-v-80c6c7be>*Price includes all on-road costs for postcode ${ssrInterpolate(unref(postcode))}</p><div class="uk-margin-medium-top uk-grid uk-grid-small" uk-grid data-v-80c6c7be><div class="uk-width-1-2@s" data-v-80c6c7be>`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: `/variant/${unref(modelSlug)}`,
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
        _push(`</div><div class="uk-width-1-2@s" data-v-80c6c7be>`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: "/test-drive",
          class: "uk-button uk-button-default uk-width-1-1"
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
        _push(`</div></div></section></div></div></div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/calculator/[model].vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const _model_ = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-80c6c7be"]]);

export { _model_ as default };
//# sourceMappingURL=_model_-Z_IbEy_s.mjs.map
