import { _ as _export_sfc, u as useMainStore, c as useHead, d as __nuxt_component_0$1, j as __nuxt_component_1$1 } from './server.mjs';
import { defineComponent, ref, computed, mergeProps, unref, createVNode, resolveDynamicComponent, withCtx, createTextVNode, toDisplayString, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderList, ssrRenderAttr, ssrRenderVNode, ssrRenderClass, ssrRenderComponent, ssrInterpolate } from 'vue/server-renderer';
import { i as isDateInRange } from './date-Bw6Y8X9p.mjs';
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
  __name: "FrontSlider",
  __ssrInlineRender: true,
  setup(__props) {
    const mainStore = useMainStore();
    const slider = ref(null);
    ref(0);
    const siteName = computed(() => mainStore.site?.name || "Sale Hyundai");
    const homeSlides = computed(() => {
      const slides = mainStore.site?.promotional?.[0]?.slides || [];
      return slides.filter((slide) => isDateInRange(slide.start, slide.end));
    });
    const isLinkExternal = (link) => {
      return /^(http|https):\/\//.test(link);
    };
    const linkComponent = (link) => {
      return isLinkExternal(link) ? "a" : __nuxt_component_0$1;
    };
    const formatLink = (link) => {
      if (/^https?:\/\//.test(link)) {
        return link;
      }
      return "https://" + link;
    };
    const formatSlideTitle = (link) => {
      if (!link) return siteName.value;
      const parts = link.replace("-", " ").split("/");
      return parts[2] || parts[1] || siteName.value;
    };
    const strippedHeadingContent = (content) => {
      if (!content) return "";
      return content.replace(/<[^>]*>/g, "");
    };
    useHead(() => {
      if (!homeSlides.value?.length) return {};
      return {
        link: [{
          rel: "preload",
          fetchpriority: "high",
          as: "image",
          href: homeSlides.value[0].desktop,
          type: "image/jpg"
        }]
      };
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0$1;
      const _component_ClientOnly = __nuxt_component_1$1;
      _push(`<div${ssrRenderAttrs(mergeProps({
        ref_key: "slider",
        ref: slider,
        class: "hero-slider uk-margin-small-top uk-position-relative uk-overflow-hidden uk-visible-toggle",
        tabindex: "-1",
        "uk-slider": "finite: true; autoplay: true; autoplay-interval: 3500"
      }, _attrs))} data-v-81bf97cd><div class="uk-position-relative uk-visible-toggle" data-v-81bf97cd><div class="uk-slider-items uk-grid uk-grid-small" data-v-81bf97cd><!--[-->`);
      ssrRenderList(unref(homeSlides), (slide, index) => {
        _push(`<div class="uk-width-4-5@s"${ssrRenderAttr("data-index", index)} data-v-81bf97cd><div class="uk-panel" data-v-81bf97cd><a href="#" class="slide-overlay uk-position-cover"${ssrRenderAttr("uk-slider-item", index)} aria-label="View this slide" data-v-81bf97cd></a>`);
        if (slide.link) {
          ssrRenderVNode(_push, createVNode(resolveDynamicComponent(linkComponent(slide.link)), {
            class: "uk-height-1-1 uk-width-1-1 uk-position-absolute uk-position-z-index slide-link",
            to: !isLinkExternal(slide.link) ? slide.link : void 0,
            href: isLinkExternal(slide.link) ? formatLink(slide.link) : void 0,
            "aria-label": slide.heading_content || formatSlideTitle(slide.link),
            target: isLinkExternal(slide.link) ? "_blank" : void 0,
            rel: isLinkExternal(slide.link) ? "noopener noreferrer" : void 0
          }, null), _parent);
        } else {
          _push(`<!---->`);
        }
        if (slide.desktop) {
          _push(`<div data-v-81bf97cd><picture data-v-81bf97cd><source${ssrRenderAttr("srcset", `${slide.desktop}?width=1600`)} media="(min-width: 960px)" data-v-81bf97cd><source${ssrRenderAttr("srcset", `${slide.mobile}?width=566`)} media="(max-width: 959px)" data-v-81bf97cd><img${ssrRenderAttr("src", index === 0 ? `${slide.desktop}?width=1600` : `${slide.mobile}?width=566`)} class="uk-width-1-1 slide-image" width="1800" height="1200"${ssrRenderAttr("alt", strippedHeadingContent(slide.heading_content))}${ssrRenderAttr("loading", index === 0 ? "eager" : "lazy")} data-v-81bf97cd></picture>`);
          if (slide.button_text) {
            _push(`<div class="uk-position-bottom-left uk-width-medium uk-padding uk-text-left" data-v-81bf97cd><h2 class="${ssrRenderClass([slide.contrast, "uk-heading-small uk-margin-remove uk-text-normal"])}" uk-slider-parallax="x: 100,-100" data-v-81bf97cd>${slide.heading_content ?? ""}</h2><p class="${ssrRenderClass([slide.contrast, "uk-heading-small uk-margin-small-top"])}" uk-slider-parallax="x: 200,-200" data-v-81bf97cd>${slide.sub_heading ?? ""}</p>`);
            if (slide.button_text) {
              _push(`<div class="uk-animation-fade" data-v-81bf97cd><div class="uk-margin-small-top" data-v-81bf97cd>`);
              if (slide.link) {
                _push(ssrRenderComponent(_component_NuxtLink, {
                  class: [[slide.contrast, slide.button_colour], "uk-button uk-text-bold uk-border-pill uk-margin-small-top uk-width-auto uk-padding-left"],
                  "uk-slider-parallax": "x: 300,-300",
                  to: slide.link
                }, {
                  default: withCtx((_, _push2, _parent2, _scopeId) => {
                    if (_push2) {
                      _push2(`${ssrInterpolate(slide.button_text)}`);
                    } else {
                      return [
                        createTextVNode(toDisplayString(slide.button_text), 1)
                      ];
                    }
                  }),
                  _: 2
                }, _parent));
              } else {
                _push(`<!---->`);
              }
              _push(`</div></div>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div>`);
        } else {
          _push(`<!---->`);
        }
        _push(ssrRenderComponent(_component_ClientOnly, null, {}, _parent));
        _push(`</div></div>`);
      });
      _push(`<!--]--></div></div><ul class="uk-slider-nav uk-dotnav uk-flex-center uk-margin" data-v-81bf97cd></ul></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/page-elements/FrontSlider.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const FrontSlider = /* @__PURE__ */ Object.assign(_export_sfc(_sfc_main, [["__scopeId", "data-v-81bf97cd"]]), { __name: "FrontSlider" });

export { FrontSlider as default };
//# sourceMappingURL=FrontSlider-Deu-rbp5.mjs.map
