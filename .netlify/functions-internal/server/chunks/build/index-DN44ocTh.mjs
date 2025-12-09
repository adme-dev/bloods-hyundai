import { defineComponent, ref, reactive, computed, mergeProps, defineAsyncComponent, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate, ssrRenderAttr, ssrRenderClass, ssrIncludeBooleanAttr, ssrLooseContain, ssrLooseEqual, ssrRenderList } from 'vue/server-renderer';
import { u as useSiteMeta } from './useSiteMeta-CKVCOIy3.mjs';
import { _ as _export_sfc, a as useRoute, k as useRouter } from './server.mjs';
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
const VehicleCard = defineComponent({
  props: {
    vehicle: { type: Object, required: true },
    viewMode: { type: String, default: "grid" }
  },
  template: `
    <div class="uk-card uk-card-default uk-card-hover vehicle-card">
      <div :class="viewMode === 'list' ? 'uk-grid uk-grid-collapse uk-child-width-1-3@s' : ''" uk-grid>
        <div class="uk-card-media-top">
          <NuxtLink :to="'/vehicle-for-sale/' + vehicle.id + '/' + vehicle.slug">
            <img 
              :src="vehicle.images?.[0] || ''"
              :alt="vehicle.title"
              class="uk-width-1-1"
              loading="lazy"
            />
          </NuxtLink>
        </div>
        <div class="uk-card-body" :class="viewMode === 'list' ? 'uk-width-2-3@s' : ''">
          <h3 class="uk-card-title uk-margin-small-bottom">
            <NuxtLink :to="'/vehicle-for-sale/' + vehicle.id + '/' + vehicle.slug" class="uk-link-reset">
              {{ vehicle.title }}
            </NuxtLink>
          </h3>
          <div class="uk-h3 uk-text-primary uk-margin-small-bottom">
            {{ vehicle.price ? '$' + vehicle.price.toLocaleString() : 'POA' }}
          </div>
          <ul class="uk-list uk-list-divider uk-text-small uk-text-muted">
            <li v-if="vehicle.year">{{ vehicle.year }}</li>
            <li v-if="vehicle.odometer">{{ vehicle.odometer.toLocaleString() }} km</li>
            <li v-if="vehicle.transmission">{{ vehicle.transmission }}</li>
          </ul>
          <NuxtLink 
            :to="'/vehicle-for-sale/' + vehicle.id + '/' + vehicle.slug"
            class="uk-button uk-button-primary uk-button-small uk-margin-small-top"
          >
            View Details
          </NuxtLink>
        </div>
      </div>
    </div>
  `
});
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "index",
  __ssrInlineRender: true,
  setup(__props) {
    useSiteMeta({
      title: "Used Cars for Sale",
      description: "Browse our selection of quality new, demo and used vehicles at Sale Hyundai."
    });
    useRoute();
    useRouter();
    const loading = ref(false);
    const vehicles = ref([]);
    const totalCount = ref(0);
    const currentPage = ref(1);
    const pageSize = ref(12);
    const sortBy = ref("price-asc");
    const viewMode = ref("grid");
    const searchKeywords = ref("");
    const filters = reactive({
      condition: [],
      make: "",
      priceMin: null,
      priceMax: null
    });
    const pageTitle = computed(() => {
      if (filters.condition.length === 1) {
        return `${filters.condition[0].charAt(0).toUpperCase() + filters.condition[0].slice(1)} Cars for Sale`;
      }
      return "Cars for Sale";
    });
    const resultsText = computed(() => {
      if (loading.value) return "Loading...";
      return `${totalCount.value} vehicle${totalCount.value !== 1 ? "s" : ""} found`;
    });
    const hasActiveFilters = computed(() => {
      return filters.condition.length > 0 || filters.make || filters.priceMin || filters.priceMax || searchKeywords.value;
    });
    const totalPages = computed(() => Math.ceil(totalCount.value / pageSize.value));
    const visiblePages = computed(() => {
      const pages = [];
      const start = Math.max(1, currentPage.value - 2);
      const end = Math.min(totalPages.value, start + 4);
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      return pages;
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_LazyPageSchema = __nuxt_component_0_lazy;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "car-sales-page" }, _attrs))} data-v-e421a08c>`);
      _push(ssrRenderComponent(_component_LazyPageSchema, null, null, _parent));
      _push(`<div class="uk-section uk-section-secondary uk-light" data-v-e421a08c><div class="uk-container" data-v-e421a08c><h1 class="uk-heading-small" data-v-e421a08c>${ssrInterpolate(unref(pageTitle))}</h1><p class="uk-text-lead" data-v-e421a08c>${ssrInterpolate(unref(resultsText))}</p></div></div><div class="uk-section" data-v-e421a08c><div class="uk-container" data-v-e421a08c><div class="uk-grid uk-grid-medium" uk-grid data-v-e421a08c><div class="uk-width-1-4@m" data-v-e421a08c><div class="uk-card uk-card-default uk-card-body filters-card" data-v-e421a08c><div class="uk-flex uk-flex-between uk-flex-middle uk-margin-small-bottom" data-v-e421a08c><h3 class="uk-card-title uk-margin-remove" data-v-e421a08c>Filters</h3>`);
      if (unref(hasActiveFilters)) {
        _push(`<button class="uk-button uk-button-text uk-text-danger" data-v-e421a08c> Clear All </button>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div><div class="uk-margin" data-v-e421a08c><label class="uk-form-label" data-v-e421a08c>Search</label><input${ssrRenderAttr("value", unref(searchKeywords))} type="text" class="uk-input" placeholder="Search vehicles..." data-v-e421a08c></div><div class="uk-margin" data-v-e421a08c><label class="uk-form-label" data-v-e421a08c>Condition</label><div class="uk-form-controls" data-v-e421a08c><label class="uk-margin-small-right" data-v-e421a08c><input${ssrIncludeBooleanAttr(Array.isArray(unref(filters).condition) ? ssrLooseContain(unref(filters).condition, "new") : unref(filters).condition) ? " checked" : ""} type="checkbox" value="new" class="uk-checkbox" data-v-e421a08c> New </label><label class="uk-margin-small-right" data-v-e421a08c><input${ssrIncludeBooleanAttr(Array.isArray(unref(filters).condition) ? ssrLooseContain(unref(filters).condition, "demo") : unref(filters).condition) ? " checked" : ""} type="checkbox" value="demo" class="uk-checkbox" data-v-e421a08c> Demo </label><label data-v-e421a08c><input${ssrIncludeBooleanAttr(Array.isArray(unref(filters).condition) ? ssrLooseContain(unref(filters).condition, "used") : unref(filters).condition) ? " checked" : ""} type="checkbox" value="used" class="uk-checkbox" data-v-e421a08c> Used </label></div></div><div class="uk-margin" data-v-e421a08c><label class="uk-form-label" data-v-e421a08c>Price Range</label><div class="uk-grid uk-grid-small" uk-grid data-v-e421a08c><div class="uk-width-1-2" data-v-e421a08c><input${ssrRenderAttr("value", unref(filters).priceMin)} type="number" class="uk-input uk-form-small" placeholder="Min" data-v-e421a08c></div><div class="uk-width-1-2" data-v-e421a08c><input${ssrRenderAttr("value", unref(filters).priceMax)} type="number" class="uk-input uk-form-small" placeholder="Max" data-v-e421a08c></div></div></div><div class="uk-margin" data-v-e421a08c><label class="uk-form-label" data-v-e421a08c>Make</label><select class="uk-select" data-v-e421a08c><option value="" data-v-e421a08c${ssrIncludeBooleanAttr(Array.isArray(unref(filters).make) ? ssrLooseContain(unref(filters).make, "") : ssrLooseEqual(unref(filters).make, "")) ? " selected" : ""}>All Makes</option><option value="hyundai" data-v-e421a08c${ssrIncludeBooleanAttr(Array.isArray(unref(filters).make) ? ssrLooseContain(unref(filters).make, "hyundai") : ssrLooseEqual(unref(filters).make, "hyundai")) ? " selected" : ""}>Hyundai</option></select></div><button class="uk-button uk-button-primary uk-width-1-1" data-v-e421a08c> Apply Filters </button></div></div><div class="uk-width-3-4@m" data-v-e421a08c><div class="uk-flex uk-flex-between uk-flex-middle uk-margin-bottom" data-v-e421a08c><div data-v-e421a08c><select class="uk-select uk-form-small" data-v-e421a08c><option value="price-asc" data-v-e421a08c${ssrIncludeBooleanAttr(Array.isArray(unref(sortBy)) ? ssrLooseContain(unref(sortBy), "price-asc") : ssrLooseEqual(unref(sortBy), "price-asc")) ? " selected" : ""}>Price: Low to High</option><option value="price-desc" data-v-e421a08c${ssrIncludeBooleanAttr(Array.isArray(unref(sortBy)) ? ssrLooseContain(unref(sortBy), "price-desc") : ssrLooseEqual(unref(sortBy), "price-desc")) ? " selected" : ""}>Price: High to Low</option><option value="year-desc" data-v-e421a08c${ssrIncludeBooleanAttr(Array.isArray(unref(sortBy)) ? ssrLooseContain(unref(sortBy), "year-desc") : ssrLooseEqual(unref(sortBy), "year-desc")) ? " selected" : ""}>Year: Newest First</option><option value="km-asc" data-v-e421a08c${ssrIncludeBooleanAttr(Array.isArray(unref(sortBy)) ? ssrLooseContain(unref(sortBy), "km-asc") : ssrLooseEqual(unref(sortBy), "km-asc")) ? " selected" : ""}>Odometer: Lowest First</option></select></div><div class="uk-button-group" data-v-e421a08c><button class="${ssrRenderClass([{ "uk-active": unref(viewMode) === "grid" }, "uk-button uk-button-default uk-button-small"])}" data-v-e421a08c><span uk-icon="grid" data-v-e421a08c></span></button><button class="${ssrRenderClass([{ "uk-active": unref(viewMode) === "list" }, "uk-button uk-button-default uk-button-small"])}" data-v-e421a08c><span uk-icon="list" data-v-e421a08c></span></button></div></div>`);
      if (unref(loading)) {
        _push(`<div class="uk-text-center uk-padding" data-v-e421a08c><div uk-spinner="ratio: 2" data-v-e421a08c></div></div>`);
      } else if (!unref(vehicles).length) {
        _push(`<div class="uk-text-center uk-padding" data-v-e421a08c><span uk-icon="icon: search; ratio: 3" class="uk-text-muted" data-v-e421a08c></span><h3 class="uk-margin-top" data-v-e421a08c>No vehicles found</h3><p class="uk-text-muted" data-v-e421a08c>Try adjusting your filters</p></div>`);
      } else {
        _push(`<div class="${ssrRenderClass([unref(viewMode) === "grid" ? "uk-child-width-1-2@s uk-child-width-1-3@l" : "uk-child-width-1-1", "uk-grid uk-grid-medium"])}" uk-grid data-v-e421a08c><!--[-->`);
        ssrRenderList(unref(vehicles), (vehicle) => {
          _push(`<div data-v-e421a08c>`);
          _push(ssrRenderComponent(unref(VehicleCard), {
            vehicle,
            "view-mode": unref(viewMode)
          }, null, _parent));
          _push(`</div>`);
        });
        _push(`<!--]--></div>`);
      }
      if (unref(totalPages) > 1) {
        _push(`<div class="uk-flex uk-flex-center uk-margin-large-top" data-v-e421a08c><ul class="uk-pagination" data-v-e421a08c><li class="${ssrRenderClass({ "uk-disabled": unref(currentPage) === 1 })}" data-v-e421a08c><a href="#" data-v-e421a08c><span uk-pagination-previous data-v-e421a08c></span></a></li><!--[-->`);
        ssrRenderList(unref(visiblePages), (page) => {
          _push(`<li class="${ssrRenderClass({ "uk-active": page === unref(currentPage) })}" data-v-e421a08c><a href="#" data-v-e421a08c>${ssrInterpolate(page)}</a></li>`);
        });
        _push(`<!--]--><li class="${ssrRenderClass({ "uk-disabled": unref(currentPage) === unref(totalPages) })}" data-v-e421a08c><a href="#" data-v-e421a08c><span uk-pagination-next data-v-e421a08c></span></a></li></ul></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div></div></div></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/car-sales/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const index = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-e421a08c"]]);

export { index as default };
//# sourceMappingURL=index-DN44ocTh.mjs.map
