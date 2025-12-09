import { defineComponent, mergeProps, defineAsyncComponent, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderStyle, ssrRenderComponent } from 'vue/server-renderer';

const __nuxt_component_0_lazy = defineAsyncComponent(() => import('./NavModels-CfrzW5LW.mjs').then((c) => c.default || c));
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "VehicleModels",
  __ssrInlineRender: true,
  setup(__props) {
    return (_ctx, _push, _parent, _attrs) => {
      const _component_LazyNavModels = __nuxt_component_0_lazy;
      _push(`<div${ssrRenderAttrs(mergeProps({
        id: "offcanvas-models",
        "uk-offcanvas": "flip: true; overlay: true; mode: slide"
      }, _attrs))}><div class="uk-offcanvas-bar uk-padding-remove uk-background-secondary" style="${ssrRenderStyle({ "width": "100%", "max-width": "100%" })}">`);
      _push(ssrRenderComponent(_component_LazyNavModels, null, null, _parent));
      _push(`</div></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/page-elements/VehicleModels.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const VehicleModels = Object.assign(_sfc_main, { __name: "VehicleModels" });

export { VehicleModels as default };
//# sourceMappingURL=VehicleModels-udRLvdBw.mjs.map
