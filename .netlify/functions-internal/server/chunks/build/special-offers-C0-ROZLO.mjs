import { defineComponent, withAsyncContext, ref, computed, mergeProps, defineAsyncComponent, unref, withCtx, createVNode, createTextVNode, useSSRContext } from 'vue';
import { _ as _export_sfc, d as __nuxt_component_0$1 } from './server.mjs';
import { ssrRenderAttrs, ssrRenderComponent, ssrRenderClass, ssrRenderList, ssrInterpolate, ssrRenderAttr } from 'vue/server-renderer';
import { u as useSiteMeta } from './useSiteMeta-CKVCOIy3.mjs';
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

const __nuxt_component_0_lazy = defineAsyncComponent(() => import('./PageSchema-G9WhHOpc.mjs').then((c) => c.default || c));
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "special-offers",
  __ssrInlineRender: true,
  async setup(__props) {
    let __temp, __restore;
    useSiteMeta({
      title: "Special Offers",
      description: "Discover the latest Hyundai special offers and promotions at Sale Hyundai. Driveaway deals and value offers on new Hyundai vehicles."
    });
    const { data: offers, pending, error, refresh } = ([__temp, __restore] = withAsyncContext(() => useFetch("/api/hyundai-offers", {
      transform: (data) => data.offers || data || []
    }, "$w7zO7rQgZi")), __temp = await __temp, __restore(), __temp);
    const selectedModel = ref("");
    const availableModels = computed(() => {
      if (!offers.value) return [];
      const models = [...new Set(offers.value.map((o) => o.model))];
      return models.filter(Boolean).sort();
    });
    const filteredOffers = computed(() => {
      if (!offers.value) return [];
      if (!selectedModel.value) {
        return offers.value;
      }
      return offers.value.filter((o) => o.model === selectedModel.value);
    });
    const slugify = (text) => {
      if (!text) return "";
      return text.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]+/g, "");
    };
    const getOfferLink = (offer) => {
      const slug = offer.variantName ? slugify(`${offer.model}-${offer.variantName}`) : slugify(offer.model);
      return `/special-offer/${offer.id}/${slug}`;
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_LazyPageSchema = __nuxt_component_0_lazy;
      const _component_NuxtLink = __nuxt_component_0$1;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "offers-page" }, _attrs))} data-v-70eb862f>`);
      _push(ssrRenderComponent(_component_LazyPageSchema, null, null, _parent));
      _push(`<div class="uk-section uk-section-primary uk-light" data-v-70eb862f><div class="uk-container uk-text-center" data-v-70eb862f><h1 class="uk-heading-medium" data-v-70eb862f>Special Offers</h1><p class="uk-text-lead" data-v-70eb862f>Explore our latest Hyundai deals and promotions</p></div></div><div class="uk-section uk-section-small uk-background-muted" data-v-70eb862f><div class="uk-container" data-v-70eb862f><div class="uk-flex uk-flex-center uk-flex-wrap" uk-margin data-v-70eb862f><button class="${ssrRenderClass([unref(selectedModel) === "" ? "uk-button-primary" : "uk-button-default", "uk-button uk-margin-small-right uk-margin-small-bottom"])}" data-v-70eb862f> All Models </button><!--[-->`);
      ssrRenderList(unref(availableModels), (model) => {
        _push(`<button class="${ssrRenderClass([unref(selectedModel) === model ? "uk-button-primary" : "uk-button-default", "uk-button uk-margin-small-right uk-margin-small-bottom"])}" data-v-70eb862f>${ssrInterpolate(model)}</button>`);
      });
      _push(`<!--]--></div></div></div>`);
      if (unref(pending)) {
        _push(`<div class="uk-section uk-text-center" data-v-70eb862f><div uk-spinner="ratio: 2" data-v-70eb862f></div><p data-v-70eb862f>Loading offers...</p></div>`);
      } else if (unref(error)) {
        _push(`<div class="uk-section uk-text-center" data-v-70eb862f><p class="uk-text-danger" data-v-70eb862f>Unable to load offers. Please try again.</p><button class="uk-button uk-button-primary" data-v-70eb862f> Try Again </button></div>`);
      } else {
        _push(`<div class="uk-section" data-v-70eb862f><div class="uk-container" data-v-70eb862f>`);
        if (unref(filteredOffers).length > 0) {
          _push(`<p class="uk-text-meta uk-margin-bottom" data-v-70eb862f> Showing ${ssrInterpolate(unref(filteredOffers).length)} offer${ssrInterpolate(unref(filteredOffers).length !== 1 ? "s" : "")}</p>`);
        } else {
          _push(`<!---->`);
        }
        if (unref(filteredOffers).length > 0) {
          _push(`<div class="uk-grid uk-grid-medium uk-child-width-1-2@s uk-child-width-1-3@m uk-child-width-1-4@l" uk-grid data-v-70eb862f><!--[-->`);
          ssrRenderList(unref(filteredOffers), (offer) => {
            _push(`<div data-v-70eb862f><div class="${ssrRenderClass([{ "has-value-offer": offer.hasValueOffer }, "uk-card uk-card-default uk-card-hover offer-card"])}" data-v-70eb862f><div class="uk-card-media-top" data-v-70eb862f>`);
            _push(ssrRenderComponent(_component_NuxtLink, {
              to: getOfferLink(offer)
            }, {
              default: withCtx((_, _push2, _parent2, _scopeId) => {
                if (_push2) {
                  _push2(`<img${ssrRenderAttr("src", offer.image || offer.heroImage)}${ssrRenderAttr("alt", offer.imageAltText || offer.model)} loading="lazy" class="uk-width-1-1" data-v-70eb862f${_scopeId}>`);
                } else {
                  return [
                    createVNode("img", {
                      src: offer.image || offer.heroImage,
                      alt: offer.imageAltText || offer.model,
                      loading: "lazy",
                      class: "uk-width-1-1"
                    }, null, 8, ["src", "alt"])
                  ];
                }
              }),
              _: 2
            }, _parent));
            _push(`</div><div class="uk-card-body" data-v-70eb862f><h3 class="uk-card-title uk-margin-small-bottom" data-v-70eb862f>${ssrInterpolate(offer.model)}</h3>`);
            if (offer.variantName) {
              _push(`<p class="uk-text-meta uk-margin-remove" data-v-70eb862f>${ssrInterpolate(offer.variantName)}</p>`);
            } else {
              _push(`<!---->`);
            }
            if (offer.hasValueOffer) {
              _push(`<div class="offer-badge uk-margin-small-top" data-v-70eb862f><span class="${ssrRenderClass([{ "uk-label-warning": offer.offerType !== "Driveaway Offer" }, "offer-type uk-label"])}" data-v-70eb862f>${ssrInterpolate(offer.offerType === "Driveaway Offer" ? "DRIVE AWAY" : "VALUE OFFER")}</span><div class="offer-amount" data-v-70eb862f>${ssrInterpolate(offer.offerAmount)} `);
              if (offer.offerCode) {
                _push(`<sup class="uk-text-small" data-v-70eb862f>[${ssrInterpolate(offer.offerCode)}]</sup>`);
              } else {
                _push(`<!---->`);
              }
              _push(`</div></div>`);
            } else if (offer.startingPrice) {
              _push(`<div class="uk-margin-small-top" data-v-70eb862f><div class="uk-h4 uk-text-primary uk-margin-remove" data-v-70eb862f> From $${ssrInterpolate(offer.startingPrice.toLocaleString())}</div></div>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</div><div class="uk-card-footer" data-v-70eb862f>`);
            _push(ssrRenderComponent(_component_NuxtLink, {
              to: getOfferLink(offer),
              class: "uk-button uk-button-primary uk-button-small uk-width-1-1"
            }, {
              default: withCtx((_, _push2, _parent2, _scopeId) => {
                if (_push2) {
                  _push2(` View Details `);
                } else {
                  return [
                    createTextVNode(" View Details ")
                  ];
                }
              }),
              _: 2
            }, _parent));
            _push(`</div></div></div>`);
          });
          _push(`<!--]--></div>`);
        } else {
          _push(`<div class="uk-text-center uk-padding-large" data-v-70eb862f><span uk-icon="icon: tag; ratio: 3" class="uk-text-muted" data-v-70eb862f></span><h3 class="uk-margin-top" data-v-70eb862f>No Offers Found</h3><p class="uk-text-muted" data-v-70eb862f>`);
          if (unref(selectedModel)) {
            _push(`<!--[--> No special offers available for ${ssrInterpolate(unref(selectedModel))} at this time. <!--]-->`);
          } else {
            _push(`<!--[--> No special offers available at this time. <!--]-->`);
          }
          _push(`</p>`);
          _push(ssrRenderComponent(_component_NuxtLink, {
            to: "/build-and-price",
            class: "uk-button uk-button-default uk-margin-top"
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(` Browse All Models `);
              } else {
                return [
                  createTextVNode(" Browse All Models ")
                ];
              }
            }),
            _: 1
          }, _parent));
          _push(`</div>`);
        }
        _push(`<div class="uk-margin-large-top uk-text-small uk-text-muted" data-v-70eb862f><p data-v-70eb862f> * Offers valid for a limited time. See individual offer details for full terms and conditions. Driveaway prices include on-road costs and dealer delivery. Drive away pricing is based on postcode 3000. </p></div></div></div>`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/special-offers.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const specialOffers = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-70eb862f"]]);

export { specialOffers as default };
//# sourceMappingURL=special-offers-C0-ROZLO.mjs.map
