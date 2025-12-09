import { defineComponent, withAsyncContext, computed, mergeProps, defineAsyncComponent, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrRenderList, ssrInterpolate } from 'vue/server-renderer';
import { u as useSiteMeta } from './useSiteMeta-CKVCOIy3.mjs';
import { u as useFetch } from './fetch-5f528j00.mjs';
import { _ as _export_sfc } from './server.mjs';
import 'node:crypto';
import '@vue/shared';
import '../nitro/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'consola';
import '../routes/renderer.mjs';
import 'vue-bundle-renderer/runtime';
import 'unhead/server';
import 'devalue';
import 'unhead/utils';
import 'vue-router';
import 'lodash-es';

const __nuxt_component_0_lazy = defineAsyncComponent(() => import('./PageSchema-G9WhHOpc.mjs').then((c) => c.default || c));
const ModelCard = defineComponent({
  props: {
    vehicle: {
      type: Object,
      required: true
    }
  },
  template: `
    <div class="uk-card uk-card-default uk-card-hover">
      <div class="uk-card-media-top">
        <NuxtLink :to="'/build/' + vehicle.slug">
          <img 
            :src="vehicle.image" 
            :alt="vehicle.name"
            class="uk-width-1-1"
            loading="lazy"
          />
        </NuxtLink>
      </div>
      <div class="uk-card-body uk-text-center">
        <h3 class="uk-card-title uk-margin-small-bottom">{{ vehicle.name }}</h3>
        <p v-if="vehicle.startingPrice" class="uk-text-meta">
          From {{ vehicle.startingPrice }}
        </p>
        <div class="uk-margin-small-top">
          <NuxtLink 
            :to="'/build/' + vehicle.slug"
            class="uk-button uk-button-primary uk-button-small"
          >
            Build & Price
          </NuxtLink>
        </div>
      </div>
    </div>
  `
});
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "build-and-price",
  __ssrInlineRender: true,
  async setup(__props) {
    let __temp, __restore;
    useSiteMeta({
      title: "Build & Price",
      description: "Configure and price your perfect Hyundai vehicle. Explore all models and customize your car."
    });
    const { data, pending } = ([__temp, __restore] = withAsyncContext(() => useFetch("/api/all-variants", {
      lazy: true,
      default: () => ({ variants: [], groupedByCategory: {} })
    }, "$CdZW3ZF8tB")), __temp = await __temp, __restore(), __temp);
    const vehicles = computed(() => data.value?.variants || []);
    const categories = computed(() => {
      const grouped = data.value?.groupedByCategory || {};
      return Object.keys(grouped);
    });
    const getVehiclesByCategory = (category) => {
      return vehicles.value.filter((v) => v.category === category);
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_LazyPageSchema = __nuxt_component_0_lazy;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "build-and-price-page" }, _attrs))} data-v-b0ad49c9>`);
      _push(ssrRenderComponent(_component_LazyPageSchema, null, null, _parent));
      _push(`<div class="uk-section uk-section-primary uk-light uk-text-center" data-v-b0ad49c9><div class="uk-container" data-v-b0ad49c9><h1 class="uk-heading-medium" data-v-b0ad49c9>Build &amp; Price</h1><p class="uk-text-lead" data-v-b0ad49c9>Configure your perfect Hyundai</p></div></div>`);
      if (unref(pending)) {
        _push(`<div class="uk-section uk-text-center" data-v-b0ad49c9><div uk-spinner="ratio: 2" data-v-b0ad49c9></div><p class="uk-margin-top" data-v-b0ad49c9>Loading models...</p></div>`);
      } else {
        _push(`<div class="uk-section" data-v-b0ad49c9><div class="uk-container" data-v-b0ad49c9><div class="uk-margin-medium-bottom" data-v-b0ad49c9><ul class="uk-subnav uk-subnav-pill uk-flex-center" uk-switcher data-v-b0ad49c9><li class="uk-active" data-v-b0ad49c9><a href="#" data-v-b0ad49c9>All</a></li><!--[-->`);
        ssrRenderList(unref(categories), (category) => {
          _push(`<li data-v-b0ad49c9><a href="#" data-v-b0ad49c9>${ssrInterpolate(category)}</a></li>`);
        });
        _push(`<!--]--></ul></div><ul class="uk-switcher" data-v-b0ad49c9><li data-v-b0ad49c9><div class="uk-grid uk-grid-medium uk-child-width-1-2@s uk-child-width-1-3@m uk-child-width-1-4@l" uk-grid data-v-b0ad49c9><!--[-->`);
        ssrRenderList(unref(vehicles), (vehicle) => {
          _push(`<div data-v-b0ad49c9>`);
          _push(ssrRenderComponent(unref(ModelCard), { vehicle }, null, _parent));
          _push(`</div>`);
        });
        _push(`<!--]--></div></li><!--[-->`);
        ssrRenderList(unref(categories), (category) => {
          _push(`<li data-v-b0ad49c9><div class="uk-grid uk-grid-medium uk-child-width-1-2@s uk-child-width-1-3@m uk-child-width-1-4@l" uk-grid data-v-b0ad49c9><!--[-->`);
          ssrRenderList(getVehiclesByCategory(category), (vehicle) => {
            _push(`<div data-v-b0ad49c9>`);
            _push(ssrRenderComponent(unref(ModelCard), { vehicle }, null, _parent));
            _push(`</div>`);
          });
          _push(`<!--]--></div></li>`);
        });
        _push(`<!--]--></ul></div></div>`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/build-and-price.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const buildAndPrice = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-b0ad49c9"]]);

export { buildAndPrice as default };
//# sourceMappingURL=build-and-price-C_NO_yAs.mjs.map
