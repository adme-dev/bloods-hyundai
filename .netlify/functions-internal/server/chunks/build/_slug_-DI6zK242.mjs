import { defineComponent, computed, withAsyncContext, ref, watch, mergeProps, defineAsyncComponent, unref, withCtx, createTextVNode, useSSRContext } from 'vue';
import { _ as _export_sfc, a as useRoute, d as __nuxt_component_0$1 } from './server.mjs';
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate, ssrRenderList, ssrRenderClass, ssrRenderStyle, ssrRenderAttr } from 'vue/server-renderer';
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
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "[slug]",
  __ssrInlineRender: true,
  async setup(__props) {
    let __temp, __restore;
    const route = useRoute();
    const slug = computed(() => route.params.slug);
    const { data, pending } = ([__temp, __restore] = withAsyncContext(() => useFetch("/api/variant-details", {
      params: { variantId: slug },
      lazy: true
    }, "$JixV42wUum")), __temp = await __temp, __restore(), __temp);
    const variants = computed(() => data.value?.variants || []);
    const modelName = computed(() => data.value?.variant?.name || slug.value);
    const selectedVariant = ref(null);
    watch(variants, (newVariants) => {
      if (newVariants?.length && !selectedVariant.value) {
        selectedVariant.value = newVariants[0];
      }
    }, { immediate: true });
    useSiteMeta({
      title: () => `Build Your ${modelName.value}`,
      description: () => `Configure and price your ${modelName.value}. Choose from available variants and options.`
    });
    const formatPrice = (price) => {
      if (!price) return "POA";
      return `$${price.toLocaleString()}`;
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_LazyPageSchema = __nuxt_component_0_lazy;
      const _component_NuxtLink = __nuxt_component_0$1;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "build-page" }, _attrs))} data-v-f9a10335>`);
      _push(ssrRenderComponent(_component_LazyPageSchema, null, null, _parent));
      if (unref(pending)) {
        _push(`<div class="uk-section uk-text-center" data-v-f9a10335><div uk-spinner="ratio: 2" data-v-f9a10335></div><p class="uk-margin-top" data-v-f9a10335>Loading configurator...</p></div>`);
      } else if (unref(variants)?.length) {
        _push(`<div data-v-f9a10335><div class="uk-section uk-section-secondary uk-light" data-v-f9a10335><div class="uk-container" data-v-f9a10335><h1 class="uk-heading-small" data-v-f9a10335>Build Your ${ssrInterpolate(unref(modelName))}</h1><p class="uk-text-lead" data-v-f9a10335>Choose your variant and customize your vehicle.</p></div></div><div class="uk-section" data-v-f9a10335><div class="uk-container" data-v-f9a10335><h2 data-v-f9a10335>Select Your Variant</h2><div class="uk-grid uk-grid-medium uk-child-width-1-2@s uk-child-width-1-3@m" uk-grid data-v-f9a10335><!--[-->`);
        ssrRenderList(unref(variants), (variant) => {
          _push(`<div data-v-f9a10335><div class="${ssrRenderClass([{ "uk-card-primary": unref(selectedVariant)?.id === variant.id }, "uk-card uk-card-default uk-card-hover"])}" style="${ssrRenderStyle({ "cursor": "pointer" })}" data-v-f9a10335><div class="uk-card-media-top" data-v-f9a10335><img${ssrRenderAttr("src", variant.image)}${ssrRenderAttr("alt", variant.name)} class="uk-width-1-1" loading="lazy" data-v-f9a10335></div><div class="uk-card-body" data-v-f9a10335><h3 class="uk-card-title" data-v-f9a10335>${ssrInterpolate(variant.name)}</h3><p class="uk-h4" data-v-f9a10335>${ssrInterpolate(variant.formattedPrice || formatPrice(variant.price))}</p>`);
          if (variant.highlights) {
            _push(`<ul class="uk-list uk-list-disc uk-text-small" data-v-f9a10335><!--[-->`);
            ssrRenderList(variant.highlights?.slice(0, 3), (h, i) => {
              _push(`<li data-v-f9a10335>${ssrInterpolate(h)}</li>`);
            });
            _push(`<!--]--></ul>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div></div></div>`);
        });
        _push(`<!--]--></div></div></div>`);
        if (unref(selectedVariant)) {
          _push(`<div class="uk-section uk-section-muted" data-v-f9a10335><div class="uk-container" data-v-f9a10335><div class="uk-grid uk-grid-large" uk-grid data-v-f9a10335><div class="uk-width-2-3@m" data-v-f9a10335><h2 data-v-f9a10335>${ssrInterpolate(unref(selectedVariant).name)}</h2>`);
          if (unref(selectedVariant).features) {
            _push(`<div class="uk-margin-medium-top" data-v-f9a10335><h3 data-v-f9a10335>Standard Features</h3><ul class="uk-list uk-list-disc uk-column-1-2@m" data-v-f9a10335><!--[-->`);
            ssrRenderList(unref(selectedVariant).features, (feature, index) => {
              _push(`<li data-v-f9a10335>${ssrInterpolate(feature)}</li>`);
            });
            _push(`<!--]--></ul></div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div><div class="uk-width-1-3@m" data-v-f9a10335><div class="uk-card uk-card-default uk-card-body uk-position-sticky" style="${ssrRenderStyle({ "top": "100px" })}" data-v-f9a10335><h3 class="uk-card-title" data-v-f9a10335>Your Build</h3><dl class="uk-description-list" data-v-f9a10335><dt data-v-f9a10335>Variant</dt><dd class="uk-text-bold" data-v-f9a10335>${ssrInterpolate(unref(selectedVariant).name)}</dd><dt data-v-f9a10335>Price</dt><dd class="uk-h3" data-v-f9a10335>${ssrInterpolate(unref(selectedVariant).formattedPrice || formatPrice(unref(selectedVariant).price))}</dd></dl><div class="uk-margin-medium-top" data-v-f9a10335>`);
          _push(ssrRenderComponent(_component_NuxtLink, {
            to: `/variant/${unref(slug)}`,
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
          _push(ssrRenderComponent(_component_NuxtLink, {
            to: "/test-drive",
            class: "uk-button uk-button-default uk-width-1-1 uk-margin-small-top"
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
          _push(`</div></div></div></div></div></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
      } else {
        _push(`<div class="uk-section uk-text-center" data-v-f9a10335><h2 data-v-f9a10335>Model Not Found</h2>`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: "/build-and-price",
          class: "uk-button uk-button-primary"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`View All Models`);
            } else {
              return [
                createTextVNode("View All Models")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</div>`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/build/[slug].vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const _slug_ = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-f9a10335"]]);

export { _slug_ as default };
//# sourceMappingURL=_slug_-DI6zK242.mjs.map
