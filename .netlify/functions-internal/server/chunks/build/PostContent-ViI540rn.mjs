import { defineComponent, useSSRContext } from 'vue';
import { ssrRenderAttrs } from 'vue/server-renderer';

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "PostContent",
  __ssrInlineRender: true,
  props: {
    content: {}
  },
  setup(__props) {
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(_attrs)}>${__props.content ?? ""}</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/content/PostContent.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const PostContent = Object.assign(_sfc_main, { __name: "PostContent" });

export { PostContent as default };
//# sourceMappingURL=PostContent-ViI540rn.mjs.map
