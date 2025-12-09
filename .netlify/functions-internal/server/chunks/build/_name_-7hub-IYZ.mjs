import { defineComponent, computed, ref, watch, reactive, mergeProps, defineAsyncComponent, unref, withCtx, createTextVNode, createVNode, toDisplayString, useSSRContext } from 'vue';
import { _ as _export_sfc, a as useRoute, b as useRuntimeConfig, d as __nuxt_component_0$1, j as __nuxt_component_1$1 } from './server.mjs';
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate, ssrRenderClass, ssrRenderAttr, ssrRenderList, ssrIncludeBooleanAttr, ssrLooseContain } from 'vue/server-renderer';
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
    computed(() => route.params.name);
    const loading = ref(true);
    const error = ref(null);
    const offer = ref(null);
    const otherVariants = ref([]);
    const variantsWithOffers = ref([]);
    ref(false);
    watch(() => route.params.id, () => {
      fetchOffer();
    });
    const fetchOffer = async () => {
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
        otherVariants.value = response.otherVariants || [];
        variantsWithOffers.value = response.variantsWithOffers || [];
      } catch (err) {
        error.value = err.message || "Failed to load offer";
        console.error("Offer fetch error:", err);
      } finally {
        loading.value = false;
      }
    };
    useSiteMeta({
      title: () => offer.value ? `${offer.value.model} ${offer.value.variantName || ""} Offer` : "Special Offer",
      description: () => offer.value?.offerDescription || `Check out the latest ${offer.value?.model || ""} offer at Sale Hyundai.`,
      image: () => offer.value?.heroImage || offer.value?.image
    });
    const form = reactive({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      postcode: "",
      message: "",
      consent: false
    });
    const submitting = ref(false);
    const submitted = ref(false);
    const getVariantLink = (variant) => {
      const slug = variant.name?.toLowerCase().replace(/\s+/g, "-") || variant.id;
      return `/special-offer/${variant.id}/${slug}`;
    };
    const getCardTitle = (variant) => {
      return variant.name || variant.variantName || "Variant";
    };
    const getVariantSpecs = (variant) => {
      return [variant.engineType, variant.transmission].filter(Boolean).join(" • ");
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_LazyPageSchema = __nuxt_component_0_lazy;
      const _component_NuxtLink = __nuxt_component_0$1;
      const _component_ClientOnly = __nuxt_component_1$1;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "offer-detail-page" }, _attrs))} data-v-a9de5967>`);
      _push(ssrRenderComponent(_component_LazyPageSchema, null, null, _parent));
      if (unref(loading)) {
        _push(`<div class="uk-flex uk-height-medium uk-background-secondary uk-light" uk-height-viewport="offset-top: true" data-v-a9de5967><div class="uk-margin-auto uk-margin-auto-vertical uk-text-center" data-v-a9de5967><div uk-spinner="ratio: 2" data-v-a9de5967></div><p class="uk-margin-small-top" data-v-a9de5967>Loading offer details...</p></div></div>`);
      } else if (unref(error)) {
        _push(`<div class="uk-section uk-text-center" data-v-a9de5967><p class="uk-text-danger" data-v-a9de5967>${ssrInterpolate(unref(error))}</p>`);
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
        _push(`<div class="offer-content" data-v-a9de5967>`);
        _push(ssrRenderComponent(_component_ClientOnly, null, {}, _parent));
        _push(`<div class="offer-page-title uk-section uk-section-small uk-background-muted" data-v-a9de5967><div class="uk-container" data-v-a9de5967><h1 class="uk-h2 uk-margin-remove" data-v-a9de5967>${ssrInterpolate(unref(offer).model)} Offer Details.</h1></div></div><div class="offer-hero-section uk-section uk-section-large uk-background-secondary uk-light" data-v-a9de5967><div class="uk-container" data-v-a9de5967><div class="uk-grid uk-grid-large uk-flex-middle" uk-grid data-v-a9de5967><div class="uk-width-1-2@m hero-info" data-v-a9de5967><h2 class="uk-h1 uk-margin-remove" data-v-a9de5967>${ssrInterpolate(unref(offer).model)}</h2><h3 class="uk-h3 uk-margin-small-top uk-text-muted" data-v-a9de5967>${ssrInterpolate(unref(offer).variantName)}</h3>`);
        if (unref(offer).specifications) {
          _push(`<p class="uk-text-meta" data-v-a9de5967>${ssrInterpolate(unref(offer).specifications || `${unref(offer).engineType || ""} ${unref(offer).transmission || ""}`.trim())}</p>`);
        } else {
          _push(`<!---->`);
        }
        if (unref(offer).hasValueOffer && unref(offer).offerAmount) {
          _push(`<div class="hero-offer uk-margin-medium-top" data-v-a9de5967><span class="${ssrRenderClass([{ "uk-label-warning": unref(offer).offerType !== "Driveaway Offer" }, "offer-label uk-label"])}" data-v-a9de5967>${ssrInterpolate(unref(offer).offerType === "Driveaway Offer" ? "DRIVE AWAY FROM" : "VALUE OFFER")}</span><div class="uk-h1 uk-margin-small-top uk-margin-remove-bottom" data-v-a9de5967>${ssrInterpolate(unref(offer).offerAmount)} `);
          if (unref(offer).offerCode) {
            _push(`<sup class="uk-text-small" data-v-a9de5967>[${ssrInterpolate(unref(offer).offerCode)}]</sup>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div>`);
          if (unref(offer).offerDescription) {
            _push(`<p class="uk-text-muted uk-margin-small-top" data-v-a9de5967>${ssrInterpolate(unref(offer).offerDescription)}</p>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div><div class="uk-width-1-2@m" data-v-a9de5967><img${ssrRenderAttr("src", unref(offer).heroImage || unref(offer).image)}${ssrRenderAttr("alt", unref(offer).imageAltText || unref(offer).model)} class="uk-width-1-1" loading="lazy" data-v-a9de5967></div></div></div></div><div class="offer-cta-section uk-section uk-section-small" data-v-a9de5967><div class="uk-container" data-v-a9de5967><div class="uk-flex uk-flex-center uk-grid-small" uk-grid data-v-a9de5967><div data-v-a9de5967><button class="uk-button uk-button-primary uk-button-large" data-v-a9de5967> Contact a Dealer </button></div><div data-v-a9de5967><button class="uk-button uk-button-secondary uk-button-large" data-v-a9de5967> Book a Test Drive </button></div></div></div></div>`);
        if (!unref(offer).hasValueOffer && unref(variantsWithOffers).length > 0) {
          _push(`<div class="uk-section uk-section-muted" data-v-a9de5967><div class="uk-container" data-v-a9de5967><h3 data-v-a9de5967>${ssrInterpolate(unref(offer).model)} variants with current offers:</h3><div class="uk-grid uk-grid-small uk-child-width-1-2@s uk-child-width-1-3@m" uk-grid data-v-a9de5967><!--[-->`);
          ssrRenderList(unref(variantsWithOffers), (variant) => {
            _push(`<div data-v-a9de5967>`);
            _push(ssrRenderComponent(_component_NuxtLink, {
              to: getVariantLink(variant),
              class: "uk-card uk-card-default uk-card-body uk-card-hover uk-display-block"
            }, {
              default: withCtx((_, _push2, _parent2, _scopeId) => {
                if (_push2) {
                  _push2(`<div class="uk-text-bold" data-v-a9de5967${_scopeId}>${ssrInterpolate(variant.name)}</div><div class="uk-h4 uk-text-primary uk-margin-remove" data-v-a9de5967${_scopeId}>${ssrInterpolate(variant.offerAmount)} <span class="uk-text-small" data-v-a9de5967${_scopeId}>[${ssrInterpolate(variant.offerCode)}]</span></div>`);
                } else {
                  return [
                    createVNode("div", { class: "uk-text-bold" }, toDisplayString(variant.name), 1),
                    createVNode("div", { class: "uk-h4 uk-text-primary uk-margin-remove" }, [
                      createTextVNode(toDisplayString(variant.offerAmount) + " ", 1),
                      createVNode("span", { class: "uk-text-small" }, "[" + toDisplayString(variant.offerCode) + "]", 1)
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
        if (unref(otherVariants)?.length > 0) {
          _push(`<div class="uk-section" data-v-a9de5967><div class="uk-container" data-v-a9de5967><h2 class="uk-h3 uk-margin-medium-bottom" data-v-a9de5967>More ${ssrInterpolate(unref(offer).model)} offers.</h2><div uk-slider="finite: true" data-v-a9de5967><div class="uk-position-relative uk-visible-toggle" tabindex="-1" data-v-a9de5967><ul class="uk-slider-items uk-child-width-1-1 uk-child-width-1-2@s uk-child-width-1-3@m uk-grid uk-grid-medium" data-v-a9de5967><!--[-->`);
          ssrRenderList(unref(otherVariants), (variant) => {
            _push(`<li data-v-a9de5967><div class="${ssrRenderClass([{ "has-value-offer": variant.hasValueOffer }, "uk-card uk-card-default uk-card-hover offer-card"])}" data-v-a9de5967><div class="uk-card-body" data-v-a9de5967><h3 class="uk-card-title" data-v-a9de5967>${ssrInterpolate(getCardTitle(variant))}</h3><p class="uk-text-meta" data-v-a9de5967>${ssrInterpolate(getVariantSpecs(variant))}</p>`);
            if (variant.hasValueOffer) {
              _push(`<div class="uk-margin-small-top" data-v-a9de5967><span class="${ssrRenderClass([{ "uk-label-warning": variant.offerType !== "Driveaway Offer" }, "uk-label"])}" data-v-a9de5967>${ssrInterpolate(variant.offerType === "Driveaway Offer" ? "DRIVE AWAY" : "VALUE OFFER")}</span><div class="uk-h4 uk-text-primary uk-margin-small-top" data-v-a9de5967>${ssrInterpolate(variant.offerAmount)} `);
              if (variant.offerCode) {
                _push(`<sup data-v-a9de5967>[${ssrInterpolate(variant.offerCode)}]</sup>`);
              } else {
                _push(`<!---->`);
              }
              _push(`</div></div>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</div><div class="uk-card-media-bottom" data-v-a9de5967><img${ssrRenderAttr("src", variant.image || unref(offer).modelImage)}${ssrRenderAttr("alt", variant.name)} class="uk-width-1-1" loading="lazy" data-v-a9de5967></div><div class="uk-card-footer" data-v-a9de5967>`);
            _push(ssrRenderComponent(_component_NuxtLink, {
              to: getVariantLink(variant),
              class: "uk-button uk-button-text"
            }, {
              default: withCtx((_, _push2, _parent2, _scopeId) => {
                if (_push2) {
                  _push2(` View Details <span uk-icon="arrow-right" data-v-a9de5967${_scopeId}></span>`);
                } else {
                  return [
                    createTextVNode(" View Details "),
                    createVNode("span", { "uk-icon": "arrow-right" })
                  ];
                }
              }),
              _: 2
            }, _parent));
            _push(`</div></div></li>`);
          });
          _push(`<!--]--></ul><a class="uk-position-center-left uk-position-small uk-hidden-hover" href="#" uk-slidenav-previous uk-slider-item="previous" data-v-a9de5967></a><a class="uk-position-center-right uk-position-small uk-hidden-hover" href="#" uk-slidenav-next uk-slider-item="next" data-v-a9de5967></a></div><ul class="uk-slider-nav uk-dotnav uk-flex-center uk-margin" data-v-a9de5967></ul></div></div></div>`);
        } else {
          _push(`<!---->`);
        }
        if (unref(offer).features?.length) {
          _push(`<div class="uk-section uk-section-muted" data-v-a9de5967><div class="uk-container" data-v-a9de5967><h2 class="uk-h3 uk-margin-medium-bottom" data-v-a9de5967>Key Features</h2><ul class="uk-list uk-list-disc uk-column-1-2@m uk-column-1-3@l" data-v-a9de5967><!--[-->`);
          ssrRenderList(unref(offer).features, (feature, index) => {
            _push(`<li data-v-a9de5967><span data-v-a9de5967>${(feature.text || feature) ?? ""}</span></li>`);
          });
          _push(`<!--]--></ul></div></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<div id="enquiry-form" class="uk-section uk-section-primary uk-light" data-v-a9de5967><div class="uk-container uk-container-small" data-v-a9de5967><h2 class="uk-text-center uk-margin-medium-bottom" data-v-a9de5967>Enquire About This Offer</h2><div class="uk-card uk-card-default uk-card-body" data-v-a9de5967><form class="uk-form-stacked" data-v-a9de5967><div class="uk-grid uk-grid-small uk-child-width-1-2@s" uk-grid data-v-a9de5967><div data-v-a9de5967><label class="uk-form-label" data-v-a9de5967>First Name *</label><input${ssrRenderAttr("value", unref(form).firstName)} type="text" class="uk-input" required data-v-a9de5967></div><div data-v-a9de5967><label class="uk-form-label" data-v-a9de5967>Last Name *</label><input${ssrRenderAttr("value", unref(form).lastName)} type="text" class="uk-input" required data-v-a9de5967></div></div><div class="uk-grid uk-grid-small uk-child-width-1-2@s" uk-grid data-v-a9de5967><div data-v-a9de5967><label class="uk-form-label" data-v-a9de5967>Email *</label><input${ssrRenderAttr("value", unref(form).email)} type="email" class="uk-input" required data-v-a9de5967></div><div data-v-a9de5967><label class="uk-form-label" data-v-a9de5967>Phone *</label><input${ssrRenderAttr("value", unref(form).phone)} type="tel" class="uk-input" required data-v-a9de5967></div></div><div class="uk-margin" data-v-a9de5967><label class="uk-form-label" data-v-a9de5967>Postcode</label><input${ssrRenderAttr("value", unref(form).postcode)} type="text" class="uk-input uk-form-width-small" maxlength="4" data-v-a9de5967></div><div class="uk-margin" data-v-a9de5967><label class="uk-form-label" data-v-a9de5967>Message</label><textarea class="uk-textarea" rows="3" data-v-a9de5967>${ssrInterpolate(unref(form).message)}</textarea></div><div class="uk-margin" data-v-a9de5967><label data-v-a9de5967><input${ssrIncludeBooleanAttr(Array.isArray(unref(form).consent) ? ssrLooseContain(unref(form).consent, null) : unref(form).consent) ? " checked" : ""} type="checkbox" class="uk-checkbox" required data-v-a9de5967> I agree to the `);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: "/privacy-policy",
          target: "_blank",
          class: "uk-link-muted"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`Privacy Policy`);
            } else {
              return [
                createTextVNode("Privacy Policy")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</label></div><div class="uk-margin-medium-top" data-v-a9de5967><button type="submit" class="uk-button uk-button-primary uk-button-large uk-width-1-1"${ssrIncludeBooleanAttr(unref(submitting)) ? " disabled" : ""} data-v-a9de5967>${ssrInterpolate(unref(submitting) ? "Sending..." : "Submit Enquiry")}</button></div></form>`);
        if (unref(submitted)) {
          _push(`<div class="uk-alert-success uk-margin-top" uk-alert data-v-a9de5967><p data-v-a9de5967><strong data-v-a9de5967>Thank you!</strong> We&#39;ll be in touch soon about this offer.</p></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></div></div>`);
        if (unref(offer).disclaimer || unref(offer).terms) {
          _push(`<div class="uk-section uk-section-small uk-background-muted" data-v-a9de5967><div class="uk-container" data-v-a9de5967><details class="uk-text-small uk-text-muted" data-v-a9de5967><summary data-v-a9de5967>Terms &amp; Conditions</summary><div class="uk-margin-small-top" data-v-a9de5967>${(unref(offer).disclaimer || unref(offer).terms) ?? ""}</div></details></div></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
      } else {
        _push(`<div class="uk-section uk-text-center" data-v-a9de5967><h2 data-v-a9de5967>Offer Not Found</h2><p class="uk-text-muted" data-v-a9de5967>This offer may have expired or is no longer available.</p>`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: "/special-offers",
          class: "uk-button uk-button-primary"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(` View Current Offers `);
            } else {
              return [
                createTextVNode(" View Current Offers ")
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/special-offer/[id]/[name].vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const _name_ = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-a9de5967"]]);

export { _name_ as default };
//# sourceMappingURL=_name_-7hub-IYZ.mjs.map
