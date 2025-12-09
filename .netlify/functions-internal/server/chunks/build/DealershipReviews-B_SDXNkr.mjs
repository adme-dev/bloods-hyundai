import { defineComponent, computed, mergeProps, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderList, ssrRenderAttr, ssrInterpolate } from 'vue/server-renderer';
import { u as useReviewsStore } from './reviews-gPnOppbN.mjs';
import { _ as _export_sfc } from './server.mjs';
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
  __name: "DealershipReviews",
  __ssrInlineRender: true,
  setup(__props) {
    const reviewsStore = useReviewsStore();
    const positiveReviews = computed(() => {
      const reviews = reviewsStore.reviews || [];
      return reviews.filter((review) => review.rating >= 4).sort((a, b) => b.rating - a.rating).slice(0, 12);
    });
    const truncateText = (text, maxLength) => {
      if (!text) return "";
      if (text.length <= maxLength) return text;
      return text.substring(0, maxLength) + "...";
    };
    const getInitials = (name) => {
      if (!name) return "?";
      return name.split(" ").map((n) => n[0]).join("").toUpperCase().substring(0, 2);
    };
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "dealership-reviews" }, _attrs))} data-v-721c2154><div class="uk-container" data-v-721c2154><h2 class="uk-text-center uk-h1 uk-text-primary uk-text-bold uk-margin-medium-bottom" data-v-721c2154> Customer <b data-v-721c2154>Reviews</b></h2>`);
      if (unref(positiveReviews).length > 0) {
        _push(`<div data-v-721c2154><div class="uk-position-relative uk-visible-toggle" tabindex="-1" uk-slider="autoplay: true; autoplay-interval: 4000" data-v-721c2154><ul class="uk-slider-items uk-child-width-1-1 uk-child-width-1-2@s uk-child-width-1-3@m uk-grid-small uk-grid uk-grid-match" uk-height-match="target: &gt; li &gt; div &gt; .uk-card" data-v-721c2154><!--[-->`);
        ssrRenderList(unref(positiveReviews), (review) => {
          _push(`<li data-v-721c2154><div class="uk-card uk-padding-small uk-flex uk-flex-column" data-v-721c2154><div class="uk-flex uk-flex-middle uk-margin-bottom" data-v-721c2154>`);
          if (review.profile_photo_url) {
            _push(`<img${ssrRenderAttr("src", review.profile_photo_url)}${ssrRenderAttr("alt", review.author_name)} class="uk-border-circle review-avatar" width="60" height="60" data-v-721c2154>`);
          } else {
            _push(`<div class="uk-border-circle review-avatar-placeholder uk-flex uk-flex-center uk-flex-middle" data-v-721c2154>${ssrInterpolate(getInitials(review.author_name))}</div>`);
          }
          _push(`<div class="uk-margin-left" data-v-721c2154><h4 class="uk-card-title uk-margin-remove" data-v-721c2154>${ssrInterpolate(review.author_name)}</h4>`);
          if (review.dealership) {
            _push(`<div class="uk-text-small uk-text-muted" data-v-721c2154>${ssrInterpolate(review.dealership)}</div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div></div><div class="uk-flex-1 review-text" data-v-721c2154><p class="uk-text-small uk-margin-remove" data-v-721c2154>${ssrInterpolate(truncateText(review.text, 180))}</p></div><div class="uk-flex uk-flex-between uk-flex-middle uk-margin-small-top" data-v-721c2154><div class="uk-flex" data-v-721c2154><!--[-->`);
          ssrRenderList(5, (n) => {
            _push(`<span class="star" data-v-721c2154><svg width="18" height="18" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" data-v-721c2154><polygon${ssrRenderAttr("fill", n <= review.rating ? "#ffc107" : "#e0e0e0")} points="10 1 12.2 6.2 18 6.8 13.8 10.8 15 16.5 10 13.4 5 16.5 6.2 10.8 2 6.8 7.8 6.2" data-v-721c2154></polygon></svg></span>`);
          });
          _push(`<!--]--></div><span class="uk-text-meta uk-text-small" data-v-721c2154>${ssrInterpolate(review.relative_time_description)}</span></div></div></li>`);
        });
        _push(`<!--]--></ul><a class="uk-position-center-left uk-position-small uk-hidden-hover" href="#" uk-slidenav-previous uk-slider-item="previous" data-v-721c2154></a><a class="uk-position-center-right uk-position-small uk-hidden-hover" href="#" uk-slidenav-next uk-slider-item="next" data-v-721c2154></a></div><ul class="uk-slider-nav uk-dotnav uk-flex-center uk-margin-top" data-v-721c2154></ul><div class="uk-text-center uk-margin-top" data-v-721c2154><a href="https://www.google.com/maps" target="_blank" rel="noopener noreferrer" class="google-badge" data-v-721c2154><img src="https://www.gstatic.com/images/branding/product/1x/googleg_48dp.png" alt="Google" width="20" data-v-721c2154><span class="uk-margin-small-left" data-v-721c2154>View all reviews on Google</span></a></div></div>`);
      } else {
        _push(`<div class="uk-text-center uk-padding" data-v-721c2154><p class="uk-text-muted" data-v-721c2154>Loading reviews...</p><div uk-spinner data-v-721c2154></div></div>`);
      }
      _push(`</div></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/page-elements/DealershipReviews.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const DealershipReviews = /* @__PURE__ */ Object.assign(_export_sfc(_sfc_main, [["__scopeId", "data-v-721c2154"]]), { __name: "DealershipReviews" });

export { DealershipReviews as default };
//# sourceMappingURL=DealershipReviews-B_SDXNkr.mjs.map
