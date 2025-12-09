import { defineComponent, ref, watch, nextTick, mergeProps, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderList, ssrRenderClass, ssrInterpolate, ssrRenderStyle } from 'vue/server-renderer';
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
  __name: "SlidingTabs",
  __ssrInlineRender: true,
  props: {
    tabs: {},
    modelValue: {}
  },
  emits: ["update:modelValue"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const tabsContainer = ref(null);
    const tabRefs = ref([]);
    const indicatorStyle = ref({
      left: "0px",
      width: "0px"
    });
    const updateIndicator = () => {
      const activeTab = tabRefs.value[props.modelValue];
      if (activeTab && tabsContainer.value) {
        const containerRect = tabsContainer.value.getBoundingClientRect();
        const tabRect = activeTab.getBoundingClientRect();
        indicatorStyle.value = {
          left: `${tabRect.left - containerRect.left}px`,
          width: `${tabRect.width}px`
        };
      }
    };
    watch(() => props.modelValue, () => {
      nextTick(updateIndicator);
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({
        class: "sliding-tabs",
        ref_key: "tabsContainer",
        ref: tabsContainer
      }, _attrs))} data-v-b4898025><div class="tabs-wrapper" data-v-b4898025><!--[-->`);
      ssrRenderList(__props.tabs, (tab, index) => {
        _push(`<button class="${ssrRenderClass([{ "is-active": __props.modelValue === index }, "tab-button"])}" data-v-b4898025>${ssrInterpolate(tab)}</button>`);
      });
      _push(`<!--]--><div class="tab-indicator" style="${ssrRenderStyle(unref(indicatorStyle))}" data-v-b4898025></div></div></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/SlidingTabs.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const SlidingTabs = /* @__PURE__ */ Object.assign(_export_sfc(_sfc_main, [["__scopeId", "data-v-b4898025"]]), { __name: "SlidingTabs" });

export { SlidingTabs as default };
//# sourceMappingURL=SlidingTabs-D2TUIMKj.mjs.map
