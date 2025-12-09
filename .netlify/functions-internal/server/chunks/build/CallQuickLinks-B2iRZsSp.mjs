import { defineComponent, computed, mergeProps, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderAttr } from 'vue/server-renderer';
import { _ as _export_sfc, u as useMainStore } from './server.mjs';
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
  __name: "CallQuickLinks",
  __ssrInlineRender: true,
  setup(__props) {
    const mainStore = useMainStore();
    const phone = computed(() => {
      const sitePhone = mainStore.site?.phone;
      return sitePhone ? sitePhone.replace(/\s/g, "") : "";
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "call-quick-link uk-hidden@m" }, _attrs))} data-v-9236782e><a${ssrRenderAttr("href", `tel:${unref(phone)}`)} class="call-button" data-v-9236782e><span uk-icon="icon: receiver; ratio: 1.2" data-v-9236782e></span><span class="call-text" data-v-9236782e>Call Now</span></a></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/page-elements/CallQuickLinks.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const CallQuickLinks = /* @__PURE__ */ Object.assign(_export_sfc(_sfc_main, [["__scopeId", "data-v-9236782e"]]), { __name: "CallQuickLinks" });

export { CallQuickLinks as default };
//# sourceMappingURL=CallQuickLinks-B2iRZsSp.mjs.map
