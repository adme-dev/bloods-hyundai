import { defineComponent, reactive, computed, mergeProps, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrIncludeBooleanAttr, ssrLooseContain, ssrLooseEqual, ssrRenderList, ssrRenderAttr, ssrInterpolate } from 'vue/server-renderer';
import { _ as _export_sfc, k as useRouter, m as useVehiclesStore } from './server.mjs';
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
  __name: "MultiSelectSearch",
  __ssrInlineRender: true,
  setup(__props) {
    useRouter();
    const vehiclesStore = useVehiclesStore();
    const filters = reactive({
      condition: "",
      make: "",
      model: "",
      body: "",
      priceMin: "",
      priceMax: ""
    });
    const priceOptions = [5e3, 1e4, 15e3, 2e4, 25e3, 3e4, 4e4, 5e4, 6e4, 7e4, 8e4, 1e5];
    const vehicleCount = computed(() => vehiclesStore.vehicleCount);
    const storeFilters = computed(() => vehiclesStore.filters);
    const availableMakes = computed(() => {
      return storeFilters.value?.make?.map((m) => m.displayValue || m) || ["Hyundai"];
    });
    const availableModels = computed(() => {
      if (!filters.make) {
        return storeFilters.value?.model?.map((m) => m.displayValue || m) || [];
      }
      return storeFilters.value?.model?.map((m) => m.displayValue || m) || [];
    });
    const availableBodies = computed(() => {
      return storeFilters.value?.body?.map((b) => b.displayValue || b) || ["Sedan", "SUV", "Hatchback", "Wagon", "Ute", "Van"];
    });
    const formatNumber = (num) => {
      return num.toLocaleString("en-AU");
    };
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "multi-select-search uk-container" }, _attrs))} data-v-f60fce89><div class="uk-card uk-card-default uk-card-body uk-border-rounded search-card" data-v-f60fce89><h3 class="uk-text-center uk-margin-bottom" data-v-f60fce89>Find Your Perfect Vehicle</h3><form class="uk-grid-small" uk-grid data-v-f60fce89><div class="uk-width-1-2 uk-width-1-5@m" data-v-f60fce89><label class="uk-form-label" data-v-f60fce89>Condition</label><select class="uk-select" data-v-f60fce89><option value="" data-v-f60fce89${ssrIncludeBooleanAttr(Array.isArray(unref(filters).condition) ? ssrLooseContain(unref(filters).condition, "") : ssrLooseEqual(unref(filters).condition, "")) ? " selected" : ""}>All</option><option value="new" data-v-f60fce89${ssrIncludeBooleanAttr(Array.isArray(unref(filters).condition) ? ssrLooseContain(unref(filters).condition, "new") : ssrLooseEqual(unref(filters).condition, "new")) ? " selected" : ""}>New</option><option value="demo" data-v-f60fce89${ssrIncludeBooleanAttr(Array.isArray(unref(filters).condition) ? ssrLooseContain(unref(filters).condition, "demo") : ssrLooseEqual(unref(filters).condition, "demo")) ? " selected" : ""}>Demo</option><option value="used" data-v-f60fce89${ssrIncludeBooleanAttr(Array.isArray(unref(filters).condition) ? ssrLooseContain(unref(filters).condition, "used") : ssrLooseEqual(unref(filters).condition, "used")) ? " selected" : ""}>Used</option></select></div><div class="uk-width-1-2 uk-width-1-5@m" data-v-f60fce89><label class="uk-form-label" data-v-f60fce89>Make</label><select class="uk-select" data-v-f60fce89><option value="" data-v-f60fce89${ssrIncludeBooleanAttr(Array.isArray(unref(filters).make) ? ssrLooseContain(unref(filters).make, "") : ssrLooseEqual(unref(filters).make, "")) ? " selected" : ""}>All Makes</option><!--[-->`);
      ssrRenderList(unref(availableMakes), (make) => {
        _push(`<option${ssrRenderAttr("value", make)} data-v-f60fce89${ssrIncludeBooleanAttr(Array.isArray(unref(filters).make) ? ssrLooseContain(unref(filters).make, make) : ssrLooseEqual(unref(filters).make, make)) ? " selected" : ""}>${ssrInterpolate(make)}</option>`);
      });
      _push(`<!--]--></select></div><div class="uk-width-1-2 uk-width-1-5@m" data-v-f60fce89><label class="uk-form-label" data-v-f60fce89>Model</label><select class="uk-select" data-v-f60fce89><option value="" data-v-f60fce89${ssrIncludeBooleanAttr(Array.isArray(unref(filters).model) ? ssrLooseContain(unref(filters).model, "") : ssrLooseEqual(unref(filters).model, "")) ? " selected" : ""}>All Models</option><!--[-->`);
      ssrRenderList(unref(availableModels), (model) => {
        _push(`<option${ssrRenderAttr("value", model)} data-v-f60fce89${ssrIncludeBooleanAttr(Array.isArray(unref(filters).model) ? ssrLooseContain(unref(filters).model, model) : ssrLooseEqual(unref(filters).model, model)) ? " selected" : ""}>${ssrInterpolate(model)}</option>`);
      });
      _push(`<!--]--></select></div><div class="uk-width-1-2 uk-width-1-5@m" data-v-f60fce89><label class="uk-form-label" data-v-f60fce89>Body Type</label><select class="uk-select" data-v-f60fce89><option value="" data-v-f60fce89${ssrIncludeBooleanAttr(Array.isArray(unref(filters).body) ? ssrLooseContain(unref(filters).body, "") : ssrLooseEqual(unref(filters).body, "")) ? " selected" : ""}>All Types</option><!--[-->`);
      ssrRenderList(unref(availableBodies), (body) => {
        _push(`<option${ssrRenderAttr("value", body)} data-v-f60fce89${ssrIncludeBooleanAttr(Array.isArray(unref(filters).body) ? ssrLooseContain(unref(filters).body, body) : ssrLooseEqual(unref(filters).body, body)) ? " selected" : ""}>${ssrInterpolate(body)}</option>`);
      });
      _push(`<!--]--></select></div><div class="uk-width-1-1 uk-width-1-5@m uk-flex uk-flex-bottom" data-v-f60fce89><button type="submit" class="uk-button uk-button-primary uk-width-1-1" data-v-f60fce89><span uk-icon="search" data-v-f60fce89></span> Search </button></div></form><div class="uk-margin-top" data-v-f60fce89><div class="uk-grid-small uk-child-width-1-2@s" uk-grid data-v-f60fce89><div data-v-f60fce89><label class="uk-form-label" data-v-f60fce89>Min Price</label><select class="uk-select" data-v-f60fce89><option value="" data-v-f60fce89${ssrIncludeBooleanAttr(Array.isArray(unref(filters).priceMin) ? ssrLooseContain(unref(filters).priceMin, "") : ssrLooseEqual(unref(filters).priceMin, "")) ? " selected" : ""}>No Min</option><!--[-->`);
      ssrRenderList(priceOptions, (price) => {
        _push(`<option${ssrRenderAttr("value", price)} data-v-f60fce89${ssrIncludeBooleanAttr(Array.isArray(unref(filters).priceMin) ? ssrLooseContain(unref(filters).priceMin, price) : ssrLooseEqual(unref(filters).priceMin, price)) ? " selected" : ""}> $${ssrInterpolate(formatNumber(price))}</option>`);
      });
      _push(`<!--]--></select></div><div data-v-f60fce89><label class="uk-form-label" data-v-f60fce89>Max Price</label><select class="uk-select" data-v-f60fce89><option value="" data-v-f60fce89${ssrIncludeBooleanAttr(Array.isArray(unref(filters).priceMax) ? ssrLooseContain(unref(filters).priceMax, "") : ssrLooseEqual(unref(filters).priceMax, "")) ? " selected" : ""}>No Max</option><!--[-->`);
      ssrRenderList(priceOptions, (price) => {
        _push(`<option${ssrRenderAttr("value", price)} data-v-f60fce89${ssrIncludeBooleanAttr(Array.isArray(unref(filters).priceMax) ? ssrLooseContain(unref(filters).priceMax, price) : ssrLooseEqual(unref(filters).priceMax, price)) ? " selected" : ""}> $${ssrInterpolate(formatNumber(price))}</option>`);
      });
      _push(`<!--]--></select></div></div></div><div class="uk-margin-top uk-text-center uk-text-muted" data-v-f60fce89>`);
      if (unref(vehicleCount) > 0) {
        _push(`<span data-v-f60fce89>${ssrInterpolate(unref(vehicleCount))} vehicles available </span>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/search/MultiSelectSearch.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const MultiSelectSearch = /* @__PURE__ */ Object.assign(_export_sfc(_sfc_main, [["__scopeId", "data-v-f60fce89"]]), { __name: "MultiSelectSearch" });

export { MultiSelectSearch as default };
//# sourceMappingURL=MultiSelectSearch-DDPfD_6w.mjs.map
