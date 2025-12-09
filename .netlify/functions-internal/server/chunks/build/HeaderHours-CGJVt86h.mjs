import { defineComponent, computed, mergeProps, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderAttr, ssrRenderList, ssrRenderClass, ssrInterpolate } from 'vue/server-renderer';
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
  __name: "HeaderHours",
  __ssrInlineRender: true,
  props: {
    activeTab: { default: "contact_form" },
    switchId: { default: "hours-switcher" },
    showTabs: { type: Boolean, default: true }
  },
  setup(__props) {
    const mainStore = useMainStore();
    const departments = computed(() => {
      const siteHours = mainStore.site?.trading_hours;
      if (siteHours && typeof siteHours === "object" && !Array.isArray(siteHours)) {
        if (siteHours.sales || siteHours.service || siteHours.parts) {
          return siteHours;
        }
        return {
          sales: {
            name: "Sales",
            hours: siteHours
          },
          service: {
            name: "Service",
            hours: siteHours
          },
          parts: {
            name: "Parts",
            hours: siteHours
          }
        };
      }
      const defaultHours = {
        Monday: "8:30am - 5:30pm",
        Tuesday: "8:30am - 5:30pm",
        Wednesday: "8:30am - 5:30pm",
        Thursday: "8:30am - 5:30pm",
        Friday: "8:30am - 5:30pm",
        Saturday: "8:30am - 4:00pm",
        Sunday: "Closed"
      };
      return {
        sales: {
          name: "Sales",
          hours: defaultHours
        },
        service: {
          name: "Service",
          hours: defaultHours
        },
        parts: {
          name: "Parts",
          hours: defaultHours
        }
      };
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "trading-hours" }, _attrs))} data-v-f12d5409><div class="trading-title uk-text-center uk-margin-small-bottom" data-v-f12d5409><h3 class="uk-h4 uk-text-bold" data-v-f12d5409>Trading Hours</h3></div>`);
      if (__props.showTabs) {
        _push(`<ul${ssrRenderAttr("id", __props.switchId)} class="uk-subnav uk-subnav-pill uk-flex uk-flex-center" uk-switcher data-v-f12d5409><!--[-->`);
        ssrRenderList(unref(departments), (department, key) => {
          _push(`<li class="${ssrRenderClass({ "uk-active": __props.activeTab === key })}" data-v-f12d5409><a href="#" data-v-f12d5409>${ssrInterpolate(department.name)}</a></li>`);
        });
        _push(`<!--]--></ul>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<ul class="uk-switcher uk-margin" data-v-f12d5409><!--[-->`);
      ssrRenderList(unref(departments), (department, key) => {
        _push(`<li data-v-f12d5409><div class="uk-card uk-card-default uk-card-body uk-card-small" data-v-f12d5409><table class="uk-table uk-table-small uk-table-divider uk-margin-remove" data-v-f12d5409><tbody data-v-f12d5409><!--[-->`);
        ssrRenderList(department.hours, (hours, day) => {
          _push(`<tr data-v-f12d5409><td class="uk-text-bold" data-v-f12d5409>${ssrInterpolate(day)}</td><td class="uk-text-right" data-v-f12d5409>${ssrInterpolate(hours)}</td></tr>`);
        });
        _push(`<!--]--></tbody></table></div></li>`);
      });
      _push(`<!--]--></ul></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/page-elements/HeaderHours.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const HeaderHours = /* @__PURE__ */ Object.assign(_export_sfc(_sfc_main, [["__scopeId", "data-v-f12d5409"]]), { __name: "HeaderHours" });

export { HeaderHours as default };
//# sourceMappingURL=HeaderHours-CGJVt86h.mjs.map
