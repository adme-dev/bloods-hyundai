import { defineComponent, computed, ref, reactive, watch, mergeProps, defineAsyncComponent, unref, withCtx, createTextVNode, createVNode, toDisplayString, useSSRContext } from 'vue';
import { _ as _export_sfc, a as useRoute, b as useRuntimeConfig, d as __nuxt_component_0$1 } from './server.mjs';
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate, ssrRenderClass, ssrRenderAttr, ssrRenderList, ssrRenderStyle, ssrIncludeBooleanAttr } from 'vue/server-renderer';
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
  __name: "[name]",
  __ssrInlineRender: true,
  setup(__props) {
    const route = useRoute();
    const config = useRuntimeConfig();
    const offerId = computed(() => route.params.id);
    const loading = ref(true);
    const error = ref(null);
    const offer = ref(null);
    const showTestDriveModal = ref(false);
    const submitting = ref(false);
    const enquiryForm = reactive({
      name: "",
      email: "",
      phone: "",
      message: ""
    });
    const staticDisclaimers = [
      {
        code: "H1",
        title: "7 Year Unlimited Km Warranty",
        text: "In addition to the 5 Year Standard New Car Warranty, Hyundai provides an extended warranty for up to a further 2 years when all servicing is with Hyundai."
      },
      {
        code: "H2",
        title: "Genuine Service Plan",
        text: "For the benefit of Hyundai owners, Hyundai provides online quotes for scheduled maintenance services at participating authorised Hyundai dealers."
      },
      {
        code: "H3",
        title: "Premium Roadside Support Plan",
        text: "12 months included Premium Roadside Support when you buy a new Hyundai from a participating authorised Hyundai Dealer."
      },
      {
        code: "H4",
        title: "Sat Nav Update Plan",
        text: "Applies to new Hyundai vehicles with factory-fitted satellite navigation. Updates are delivered annually."
      }
    ];
    watch(() => route.params.id, () => {
      loadOfferDetails();
    });
    const loadOfferDetails = async () => {
      loading.value = true;
      error.value = null;
      try {
        const response = await $fetch(`${config.public.apiUrl}/get-hyundai-offer-by-id`, {
          params: { offerId: offerId.value }
        });
        if (response.error) {
          throw new Error(response.error);
        }
        offer.value = response.offer || response;
      } catch (err) {
        error.value = err.message || "Failed to load offer details";
        console.error("Offer load error:", err);
      } finally {
        loading.value = false;
      }
    };
    const variantsWithOffers = computed(() => {
      if (!offer.value?.allVariants) return [];
      return offer.value.allVariants.filter((v) => v.hasValueOffer && v.id !== offer.value.id).slice(0, 5);
    });
    const otherVariants = computed(() => {
      if (!offer.value?.allVariants) return [];
      return offer.value.allVariants.filter(
        (v) => v.id !== offer.value.id && (v.hasValueOffer || v.price || v.formattedPrice)
      );
    });
    const globalDisclaimers = computed(() => offer.value?.globalDisclaimers || []);
    const modelDisclaimers = computed(() => {
      if (!offer.value?.allVariants) return [];
      const seenCodes = /* @__PURE__ */ new Set();
      const disclaimers = [];
      for (const variant of offer.value.allVariants) {
        if (variant.offers && Array.isArray(variant.offers)) {
          for (const o of variant.offers) {
            const code = o.disclaimerCode || o.disclaimerCitation;
            const text = o.disclaimer;
            if (code && text && !seenCodes.has(code)) {
              seenCodes.add(code);
              disclaimers.push({ code, text });
            }
          }
        }
        if (variant.offerCode && variant.offerDisclaimer && !seenCodes.has(variant.offerCode)) {
          seenCodes.add(variant.offerCode);
          disclaimers.push({ code: variant.offerCode, text: variant.offerDisclaimer });
        }
      }
      return disclaimers;
    });
    const hasDisclaimers = computed(() => {
      return modelDisclaimers.value.length > 0 || globalDisclaimers.value.length > 0;
    });
    const getVariantLink = (variant) => {
      const slug = variant.name?.toLowerCase().replace(/\s+/g, "-") || variant.id;
      return `/offer/${variant.id}/${slug}`;
    };
    const getCardTitle = (variant) => {
      return variant.displayName || variant.name || "Variant";
    };
    const getVariantSpecs = (variant) => {
      return variant.specifications || `${variant.engineType || ""} ${variant.transmission || ""}`.trim();
    };
    useSiteMeta({
      title: () => `${offer.value?.model || "Special"} Offer - ${offer.value?.variantName || ""}`,
      description: () => offer.value?.offerDescription || `Special offer on the ${offer.value?.model}`,
      image: () => offer.value?.heroImage || offer.value?.image
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_LazyPageSchema = __nuxt_component_0_lazy;
      const _component_NuxtLink = __nuxt_component_0$1;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "offer-detail-page" }, _attrs))} data-v-ec27e530>`);
      _push(ssrRenderComponent(_component_LazyPageSchema, null, null, _parent));
      if (unref(loading)) {
        _push(`<div class="uk-section uk-text-center" data-v-ec27e530><div uk-spinner="ratio: 2" data-v-ec27e530></div><p class="uk-margin-top" data-v-ec27e530>Loading offer details...</p></div>`);
      } else if (unref(error)) {
        _push(`<div class="uk-section uk-text-center" data-v-ec27e530><p class="uk-text-danger" data-v-ec27e530>${ssrInterpolate(unref(error))}</p>`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: "/special-offers",
          class: "uk-button uk-button-primary"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(` Back to Offers `);
            } else {
              return [
                createTextVNode(" Back to Offers ")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</div>`);
      } else if (unref(offer)) {
        _push(`<div class="offer-content" data-v-ec27e530><div class="uk-section uk-section-small uk-background-muted" data-v-ec27e530><div class="uk-container" data-v-ec27e530><h1 class="uk-h2 uk-margin-remove" data-v-ec27e530>${ssrInterpolate(unref(offer).model)} Offer Details</h1></div></div><div class="offer-hero uk-section uk-section-large uk-background-secondary uk-light" data-v-ec27e530><div class="uk-container" data-v-ec27e530><div class="uk-grid uk-grid-large uk-flex-middle" uk-grid data-v-ec27e530><div class="uk-width-1-2@m" data-v-ec27e530><h2 class="uk-heading-small uk-margin-remove" data-v-ec27e530>${ssrInterpolate(unref(offer).model)}</h2><h3 class="uk-h3 uk-margin-small-top uk-text-muted" data-v-ec27e530>${ssrInterpolate(unref(offer).variantName)}</h3>`);
        if (unref(offer).specifications) {
          _push(`<p class="uk-text-meta" data-v-ec27e530>${ssrInterpolate(unref(offer).specifications)}</p>`);
        } else {
          _push(`<!---->`);
        }
        if (unref(offer).hasValueOffer && unref(offer).offerAmount) {
          _push(`<div class="uk-margin-medium-top" data-v-ec27e530><span class="${ssrRenderClass([unref(offer).offerType === "Driveaway Offer" ? "uk-label-success" : "uk-label-warning", "uk-label uk-margin-small-bottom"])}" data-v-ec27e530>${ssrInterpolate(unref(offer).offerType === "Driveaway Offer" ? "DRIVE AWAY FROM" : "VALUE OFFER")}</span><div class="uk-h1 uk-margin-small-top" data-v-ec27e530>${ssrInterpolate(unref(offer).offerAmount)} `);
          if (unref(offer).offerCode) {
            _push(`<span class="uk-text-small" data-v-ec27e530>[${ssrInterpolate(unref(offer).offerCode)}]</span>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div>`);
          if (unref(offer).offerDescription) {
            _push(`<p class="uk-text-muted" data-v-ec27e530>${ssrInterpolate(unref(offer).offerDescription)}</p>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div><div class="uk-width-1-2@m" data-v-ec27e530>`);
        if (unref(offer).heroImage || unref(offer).image) {
          _push(`<img${ssrRenderAttr("src", unref(offer).heroImage || unref(offer).image)}${ssrRenderAttr("alt", unref(offer).imageAltText || unref(offer).model)} class="uk-width-1-1" loading="eager" data-v-ec27e530>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></div></div></div><div class="uk-section uk-section-small" data-v-ec27e530><div class="uk-container" data-v-ec27e530><div class="uk-flex uk-flex-center uk-grid-small" uk-grid data-v-ec27e530><div data-v-ec27e530><button class="uk-button uk-button-primary uk-button-large" data-v-ec27e530> Contact a dealer </button></div><div data-v-ec27e530>`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: "/test-drive",
          class: "uk-button uk-button-default uk-button-large"
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
        _push(`</div></div></div></div>`);
        if (!unref(offer).hasValueOffer && unref(variantsWithOffers).length > 0) {
          _push(`<div class="uk-section uk-section-muted" data-v-ec27e530><div class="uk-container" data-v-ec27e530><h3 data-v-ec27e530>${ssrInterpolate(unref(offer).model)} variants with current offers:</h3><div class="uk-grid uk-grid-small uk-child-width-1-2@s uk-child-width-1-3@m" uk-grid data-v-ec27e530><!--[-->`);
          ssrRenderList(unref(variantsWithOffers), (variant) => {
            _push(`<div data-v-ec27e530>`);
            _push(ssrRenderComponent(_component_NuxtLink, {
              to: getVariantLink(variant),
              class: "uk-card uk-card-default uk-card-body uk-card-small uk-display-block"
            }, {
              default: withCtx((_, _push2, _parent2, _scopeId) => {
                if (_push2) {
                  _push2(`<span class="uk-text-bold" data-v-ec27e530${_scopeId}>${ssrInterpolate(variant.name)}</span><span class="uk-text-primary uk-float-right" data-v-ec27e530${_scopeId}>${ssrInterpolate(variant.offerAmount)} <span class="uk-text-meta" data-v-ec27e530${_scopeId}>[${ssrInterpolate(variant.offerCode)}]</span></span>`);
                } else {
                  return [
                    createVNode("span", { class: "uk-text-bold" }, toDisplayString(variant.name), 1),
                    createVNode("span", { class: "uk-text-primary uk-float-right" }, [
                      createTextVNode(toDisplayString(variant.offerAmount) + " ", 1),
                      createVNode("span", { class: "uk-text-meta" }, "[" + toDisplayString(variant.offerCode) + "]", 1)
                    ])
                  ];
                }
              }),
              _: 2
            }, _parent));
            _push(`</div>`);
          });
          _push(`<!--]--></div></div></div>`);
        } else {
          _push(`<!---->`);
        }
        if (unref(otherVariants).length > 0) {
          _push(`<div class="uk-section" data-v-ec27e530><div class="uk-container" data-v-ec27e530><h2 class="uk-h3 uk-margin-medium-bottom" data-v-ec27e530>More ${ssrInterpolate(unref(offer).model)} offers</h2><div uk-slider="sets: true" data-v-ec27e530><div class="uk-position-relative uk-visible-toggle" tabindex="-1" data-v-ec27e530><ul class="uk-slider-items uk-child-width-1-2@s uk-child-width-1-3@m uk-grid uk-grid-match" data-v-ec27e530><!--[-->`);
          ssrRenderList(unref(otherVariants), (variant) => {
            _push(`<li data-v-ec27e530><div class="uk-card uk-card-default uk-card-hover" data-v-ec27e530><div class="uk-card-body" data-v-ec27e530><h3 class="uk-card-title uk-text-truncate" data-v-ec27e530>${ssrInterpolate(getCardTitle(variant))}</h3><p class="uk-text-meta" data-v-ec27e530>${ssrInterpolate(getVariantSpecs(variant))}</p>`);
            if (variant.hasValueOffer) {
              _push(`<div class="uk-margin-small-top" data-v-ec27e530><span class="${ssrRenderClass([variant.offerType === "Driveaway Offer" ? "uk-label-success" : "uk-label-warning", "uk-label uk-label-small"])}" data-v-ec27e530>${ssrInterpolate(variant.offerType === "Driveaway Offer" ? "DRIVE AWAY" : "VALUE OFFER")}</span><div class="uk-h4 uk-margin-small-top uk-margin-remove-bottom" data-v-ec27e530>${ssrInterpolate(variant.offerAmount)} `);
              if (variant.offerCode) {
                _push(`<span class="uk-text-small uk-text-muted" data-v-ec27e530>[${ssrInterpolate(variant.offerCode)}]</span>`);
              } else {
                _push(`<!---->`);
              }
              _push(`</div></div>`);
            } else {
              _push(`<!---->`);
            }
            if (variant.image || unref(offer).modelImage) {
              _push(`<img${ssrRenderAttr("src", variant.image || unref(offer).modelImage)}${ssrRenderAttr("alt", variant.name)} class="uk-width-1-1 uk-margin-small-top" loading="lazy" data-v-ec27e530>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</div><div class="uk-card-footer" data-v-ec27e530>`);
            _push(ssrRenderComponent(_component_NuxtLink, {
              to: getVariantLink(variant),
              class: "uk-button uk-button-text"
            }, {
              default: withCtx((_, _push2, _parent2, _scopeId) => {
                if (_push2) {
                  _push2(` Go to offer <span uk-icon="arrow-right" data-v-ec27e530${_scopeId}></span>`);
                } else {
                  return [
                    createTextVNode(" Go to offer "),
                    createVNode("span", { "uk-icon": "arrow-right" })
                  ];
                }
              }),
              _: 2
            }, _parent));
            _push(`</div></div></li>`);
          });
          _push(`<!--]--></ul><a class="uk-position-center-left uk-position-small uk-hidden-hover" href="#" uk-slidenav-previous uk-slider-item="previous" data-v-ec27e530></a><a class="uk-position-center-right uk-position-small uk-hidden-hover" href="#" uk-slidenav-next uk-slider-item="next" data-v-ec27e530></a></div><ul class="uk-slider-nav uk-dotnav uk-flex-center uk-margin" data-v-ec27e530></ul></div></div></div>`);
        } else {
          _push(`<!---->`);
        }
        if (unref(hasDisclaimers)) {
          _push(`<div class="uk-section uk-section-muted" data-v-ec27e530><div class="uk-container uk-container-small" data-v-ec27e530><h4 class="uk-h5" data-v-ec27e530>Disclaimers</h4><!--[-->`);
          ssrRenderList(unref(globalDisclaimers), (disclaimer, index) => {
            _push(`<div class="uk-margin-small" data-v-ec27e530><p class="uk-text-small uk-text-muted" data-v-ec27e530>${ssrInterpolate(disclaimer.disclaimer)}</p></div>`);
          });
          _push(`<!--]--><!--[-->`);
          ssrRenderList(unref(modelDisclaimers), (disclaimer, index) => {
            _push(`<div class="uk-margin-small" data-v-ec27e530><p class="uk-text-small" data-v-ec27e530><span class="uk-text-bold" data-v-ec27e530>[${ssrInterpolate(disclaimer.code)}]</span> ${ssrInterpolate(disclaimer.text)}</p></div>`);
          });
          _push(`<!--]--><details class="uk-margin-top" data-v-ec27e530><summary class="uk-text-bold uk-text-small" data-v-ec27e530>myHyundai Care Benefits</summary><!--[-->`);
          ssrRenderList(staticDisclaimers, (disclaimer) => {
            _push(`<div class="uk-margin-small" data-v-ec27e530><p class="uk-text-small" data-v-ec27e530><span class="uk-text-bold" data-v-ec27e530>[${ssrInterpolate(disclaimer.code)}] ${ssrInterpolate(disclaimer.title)}</span><br data-v-ec27e530><span class="uk-text-muted" data-v-ec27e530>${ssrInterpolate(disclaimer.text)}</span></p></div>`);
          });
          _push(`<!--]--></details></div></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<div class="uk-section uk-section-small" data-v-ec27e530><div class="uk-container" data-v-ec27e530>`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: "/special-offers",
          class: "uk-button uk-button-text"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`<span uk-icon="arrow-left" data-v-ec27e530${_scopeId}></span> Back to all offers `);
            } else {
              return [
                createVNode("span", { "uk-icon": "arrow-left" }),
                createTextVNode(" Back to all offers ")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</div></div>`);
        if (unref(showTestDriveModal)) {
          _push(`<div class="uk-modal uk-open" style="${ssrRenderStyle({ "display": "block" })}" data-v-ec27e530><div class="uk-modal-dialog uk-modal-body" data-v-ec27e530><button class="uk-modal-close-default" type="button" uk-close data-v-ec27e530></button><h2 class="uk-modal-title" data-v-ec27e530>Contact Us About This Offer</h2><form class="uk-form-stacked" data-v-ec27e530><div class="uk-margin" data-v-ec27e530><label class="uk-form-label" data-v-ec27e530>Name *</label><input${ssrRenderAttr("value", unref(enquiryForm).name)} type="text" class="uk-input" required data-v-ec27e530></div><div class="uk-margin" data-v-ec27e530><label class="uk-form-label" data-v-ec27e530>Email *</label><input${ssrRenderAttr("value", unref(enquiryForm).email)} type="email" class="uk-input" required data-v-ec27e530></div><div class="uk-margin" data-v-ec27e530><label class="uk-form-label" data-v-ec27e530>Phone *</label><input${ssrRenderAttr("value", unref(enquiryForm).phone)} type="tel" class="uk-input" required data-v-ec27e530></div><div class="uk-margin" data-v-ec27e530><label class="uk-form-label" data-v-ec27e530>Message</label><textarea class="uk-textarea" rows="3" data-v-ec27e530>${ssrInterpolate(unref(enquiryForm).message)}</textarea></div><button type="submit" class="uk-button uk-button-primary uk-width-1-1"${ssrIncludeBooleanAttr(unref(submitting)) ? " disabled" : ""} data-v-ec27e530>${ssrInterpolate(unref(submitting) ? "Sending..." : "Submit Enquiry")}</button></form></div></div>`);
        } else {
          _push(`<!---->`);
        }
        if (unref(showTestDriveModal)) {
          _push(`<div class="uk-modal-backdrop" data-v-ec27e530></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/offer/[id]/[name].vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const _name_ = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-ec27e530"]]);

export { _name_ as default };
//# sourceMappingURL=_name_-OSbHT6f-.mjs.map
