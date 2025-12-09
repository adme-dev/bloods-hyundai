import { defineComponent, computed, withAsyncContext, mergeProps, defineAsyncComponent, unref, withCtx, createTextVNode, useSSRContext } from 'vue';
import { _ as _export_sfc, a as useRoute, u as useMainStore, d as __nuxt_component_0$1 } from './server.mjs';
import { ssrRenderAttrs, ssrRenderComponent, ssrRenderStyle, ssrInterpolate, ssrRenderList } from 'vue/server-renderer';
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
const ContentSection = defineComponent({
  props: {
    section: { type: Object, required: true }
  },
  template: `
    <div 
      class="uk-section"
      :class="sectionClasses"
    >
      <div class="uk-container" :class="section.narrow ? 'uk-container-small' : ''">
        <h2 v-if="section.title" class="uk-text-center uk-margin-medium-bottom">{{ section.title }}</h2>
        
        <!-- Text content -->
        <div v-if="section.type === 'text'" v-html="section.content"></div>
        
        <!-- Image -->
        <img v-else-if="section.type === 'image'" :src="section.image" :alt="section.alt || section.title" class="uk-width-1-1" />
        
        <!-- Cards -->
        <div v-else-if="section.type === 'cards'" class="uk-grid uk-child-width-1-2@s uk-child-width-1-3@m" uk-grid>
          <div v-for="(card, i) in section.cards" :key="i">
            <div class="uk-card uk-card-default uk-card-body">
              <h3 class="uk-card-title">{{ card.title }}</h3>
              <p>{{ card.text }}</p>
            </div>
          </div>
        </div>
        
        <!-- CTA -->
        <div v-else-if="section.type === 'cta'" class="uk-text-center">
          <p v-if="section.text" class="uk-text-lead">{{ section.text }}</p>
          <NuxtLink v-if="section.link" :to="section.link" class="uk-button uk-button-primary uk-button-large">
            {{ section.buttonText || 'Learn More' }}
          </NuxtLink>
        </div>
        
        <!-- Default: raw HTML -->
        <div v-else v-html="section.content || section.html"></div>
      </div>
    </div>
  `,
  computed: {
    sectionClasses() {
      const classes = [];
      if (this.section.background === "muted") classes.push("uk-section-muted");
      if (this.section.background === "primary") classes.push("uk-section-primary", "uk-light");
      if (this.section.background === "secondary") classes.push("uk-section-secondary", "uk-light");
      return classes;
    }
  }
});
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "[slug]",
  __ssrInlineRender: true,
  async setup(__props) {
    let __temp, __restore;
    const route = useRoute();
    useMainStore();
    const slug = computed(() => route.params.slug);
    const { data: page, pending } = ([__temp, __restore] = withAsyncContext(() => useFetch(`/api/page/${slug.value}`, {
      lazy: true,
      transform: (data) => data?.page || data
    }, "$jmFRNJFWeo")), __temp = await __temp, __restore(), __temp);
    useSiteMeta({
      title: () => page.value?.seoTitle || page.value?.title || slug.value,
      description: () => page.value?.seoDescription || page.value?.excerpt,
      image: () => page.value?.hero?.image
    });
    const heroStyle = computed(() => {
      if (!page.value?.hero?.image) return {};
      return {
        backgroundImage: `url(${page.value.hero.image})`
      };
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_LazyPageSchema = __nuxt_component_0_lazy;
      const _component_NuxtLink = __nuxt_component_0$1;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "page-content" }, _attrs))} data-v-5b9bddeb>`);
      _push(ssrRenderComponent(_component_LazyPageSchema, null, null, _parent));
      if (unref(pending)) {
        _push(`<div class="uk-section uk-text-center" data-v-5b9bddeb><div uk-spinner="ratio: 2" data-v-5b9bddeb></div></div>`);
      } else if (unref(page)) {
        _push(`<div data-v-5b9bddeb>`);
        if (unref(page).hero) {
          _push(`<div class="page-hero uk-section uk-section-large uk-background-cover uk-light" style="${ssrRenderStyle(unref(heroStyle))}" data-v-5b9bddeb><div class="uk-container" data-v-5b9bddeb><h1 class="uk-heading-medium" data-v-5b9bddeb>${ssrInterpolate(unref(page).title)}</h1>`);
          if (unref(page).subtitle) {
            _push(`<p class="uk-text-lead" data-v-5b9bddeb>${ssrInterpolate(unref(page).subtitle)}</p>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div></div>`);
        } else {
          _push(`<div class="uk-section uk-section-primary uk-light" data-v-5b9bddeb><div class="uk-container" data-v-5b9bddeb><h1 class="uk-heading-small" data-v-5b9bddeb>${ssrInterpolate(unref(page).title)}</h1></div></div>`);
        }
        _push(`<!--[-->`);
        ssrRenderList(unref(page).sections, (section, index) => {
          _push(ssrRenderComponent(unref(ContentSection), { section }, null, _parent));
        });
        _push(`<!--]-->`);
        if (unref(page).content && !unref(page).sections?.length) {
          _push(`<div class="uk-section" data-v-5b9bddeb><div class="uk-container uk-container-small" data-v-5b9bddeb><div class="page-body" data-v-5b9bddeb>${unref(page).content ?? ""}</div></div></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
      } else {
        _push(`<div class="uk-section uk-text-center" data-v-5b9bddeb><h2 data-v-5b9bddeb>Page Not Found</h2><p class="uk-text-muted" data-v-5b9bddeb>The page you&#39;re looking for doesn&#39;t exist.</p>`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: "/",
          class: "uk-button uk-button-primary"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`Return Home`);
            } else {
              return [
                createTextVNode("Return Home")
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/[slug].vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const _slug_ = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-5b9bddeb"]]);

export { _slug_ as default };
//# sourceMappingURL=_slug_-CLDeKwbL.mjs.map
