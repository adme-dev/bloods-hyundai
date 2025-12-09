import { defineComponent, ref, mergeProps, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrInterpolate, ssrRenderList, ssrRenderClass, ssrRenderAttr } from 'vue/server-renderer';
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
  __name: "GoogleReviews",
  __ssrInlineRender: true,
  setup(__props) {
    const loading = ref(true);
    const reviews = ref([]);
    const averageRating = ref(null);
    const totalReviews = ref(0);
    useReviewsStore();
    const getInitials = (name) => {
      if (!name) return "?";
      return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
    };
    const truncateText = (text, maxLength) => {
      if (!text || text.length <= maxLength) return text;
      return text.slice(0, maxLength).trim() + "...";
    };
    const formatDate = (timestamp) => {
      if (!timestamp) return "";
      return new Date(timestamp * 1e3).toLocaleDateString("en-AU", {
        year: "numeric",
        month: "short"
      });
    };
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "google-reviews" }, _attrs))} data-v-77df89c9><div class="uk-text-center uk-margin-medium-bottom" data-v-77df89c9><h2 data-v-77df89c9>What Our Customers Say</h2>`);
      if (unref(averageRating)) {
        _push(`<div class="uk-flex uk-flex-center uk-flex-middle uk-grid-small" uk-grid data-v-77df89c9><div data-v-77df89c9><span class="uk-h3 uk-margin-remove" data-v-77df89c9>${ssrInterpolate(unref(averageRating).toFixed(1))}</span></div><div data-v-77df89c9><div class="star-rating" data-v-77df89c9><!--[-->`);
        ssrRenderList(5, (star) => {
          _push(`<span class="${ssrRenderClass([{ "filled": star <= Math.round(unref(averageRating)) }, "star"])}" data-v-77df89c9>★</span>`);
        });
        _push(`<!--]--></div>`);
        if (unref(totalReviews)) {
          _push(`<p class="uk-text-muted uk-margin-remove" data-v-77df89c9> Based on ${ssrInterpolate(unref(totalReviews))} reviews </p>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
      if (unref(loading)) {
        _push(`<div class="uk-text-center uk-padding" data-v-77df89c9><div uk-spinner data-v-77df89c9></div></div>`);
      } else if (unref(reviews).length) {
        _push(`<div uk-slider="autoplay: true; autoplay-interval: 5000" data-v-77df89c9><div class="uk-position-relative uk-visible-toggle" tabindex="-1" data-v-77df89c9><ul class="uk-slider-items uk-child-width-1-1 uk-child-width-1-2@s uk-child-width-1-3@m uk-grid uk-grid-medium" data-v-77df89c9><!--[-->`);
        ssrRenderList(unref(reviews), (review) => {
          _push(`<li data-v-77df89c9><div class="uk-card uk-card-default uk-card-body review-card" data-v-77df89c9><div class="review-header uk-flex uk-flex-middle uk-margin-small-bottom" data-v-77df89c9><div class="reviewer-avatar" data-v-77df89c9>`);
          if (review.profile_photo_url) {
            _push(`<img${ssrRenderAttr("src", review.profile_photo_url)}${ssrRenderAttr("alt", review.author_name)} class="uk-border-circle" width="48" height="48" data-v-77df89c9>`);
          } else {
            _push(`<span class="avatar-placeholder" data-v-77df89c9>${ssrInterpolate(getInitials(review.author_name))}</span>`);
          }
          _push(`</div><div class="reviewer-info uk-margin-small-left" data-v-77df89c9><h4 class="uk-margin-remove" data-v-77df89c9>${ssrInterpolate(review.author_name)}</h4><div class="star-rating star-rating-small" data-v-77df89c9><!--[-->`);
          ssrRenderList(5, (star) => {
            _push(`<span class="${ssrRenderClass([{ "filled": star <= review.rating }, "star"])}" data-v-77df89c9>★</span>`);
          });
          _push(`<!--]--></div></div></div><p class="review-text" data-v-77df89c9>${ssrInterpolate(truncateText(review.text, 200))}</p><p class="review-date uk-text-small uk-text-muted" data-v-77df89c9>${ssrInterpolate(review.relative_time_description || formatDate(review.time))}</p></div></li>`);
        });
        _push(`<!--]--></ul><a class="uk-position-center-left uk-position-small uk-hidden-hover" href="#" uk-slidenav-previous uk-slider-item="previous" data-v-77df89c9></a><a class="uk-position-center-right uk-position-small uk-hidden-hover" href="#" uk-slidenav-next uk-slider-item="next" data-v-77df89c9></a></div><ul class="uk-slider-nav uk-dotnav uk-flex-center uk-margin" data-v-77df89c9></ul></div>`);
      } else {
        _push(`<div class="uk-text-center uk-text-muted" data-v-77df89c9><p data-v-77df89c9>No reviews available at this time.</p></div>`);
      }
      _push(`<div class="uk-text-center uk-margin-medium-top" data-v-77df89c9><a href="https://www.google.com/maps/place/Sale+Hyundai" target="_blank" rel="noopener noreferrer" class="google-badge" data-v-77df89c9><img src="https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_92x30dp.png" alt="Google" height="20" data-v-77df89c9><span data-v-77df89c9>View on Google</span></a></div></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/page-elements/GoogleReviews.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const GoogleReviews = /* @__PURE__ */ Object.assign(_export_sfc(_sfc_main, [["__scopeId", "data-v-77df89c9"]]), { __name: "GoogleReviews" });

export { GoogleReviews as default };
//# sourceMappingURL=GoogleReviews-cXzTGU_F.mjs.map
