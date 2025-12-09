import { defineComponent, computed, mergeProps, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrInterpolate, ssrRenderComponent } from 'vue/server-renderer';
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

const DepartmentInfo = defineComponent({
  props: {
    department: { type: Object, required: true },
    actionLink: { type: String, default: "" },
    actionText: { type: String, default: "" }
  },
  emits: ["search"],
  setup(props, { emit }) {
    const formatPhone = (phone) => {
      if (!phone) return "";
      return phone.replace(/[^0-9+]/g, "");
    };
    const formatTime = (time) => {
      if (!time) return "";
      const d = new Date(time);
      const hours = d.getHours();
      const mins = d.getMinutes().toString().padStart(2, "0");
      const period = hours >= 12 ? "pm" : "am";
      const hour12 = hours > 12 ? hours - 12 : hours || 12;
      return `${hour12}:${mins}${period}`;
    };
    return { formatPhone, formatTime, emit };
  },
  template: `
    <div class="department-info">
      <!-- Address -->
      <div v-if="department.address" class="uk-margin-small">
        <span uk-icon="location" class="uk-margin-small-right"></span>
        <span>{{ department.address }}</span>
      </div>

      <!-- Directions -->
      <div v-if="department.map_directions" class="uk-margin-small">
        <a :href="department.map_directions" target="_blank" class="uk-link-muted">
          <span uk-icon="forward" class="uk-margin-small-right"></span>
          Get Directions
        </a>
      </div>

      <!-- Phone -->
      <div v-if="department.phone" class="uk-margin-small">
        <a :href="'tel:' + formatPhone(department.phone)" class="uk-link-text">
          <span uk-icon="receiver" class="uk-margin-small-right uk-text-primary"></span>
          {{ department.phone }}
        </a>
      </div>

      <!-- Action Link -->
      <div v-if="actionLink" class="uk-margin-small">
        <NuxtLink :to="actionLink" class="uk-link-text">
          <span uk-icon="cog" class="uk-margin-small-right uk-text-primary"></span>
          {{ actionText }}
        </NuxtLink>
      </div>

      <!-- Search Stock -->
      <div v-if="!actionLink" class="uk-margin-small">
        <a href="#" @click.prevent="emit('search')" class="uk-link-text">
          <span uk-icon="search" class="uk-margin-small-right uk-text-primary"></span>
          Search Our Stock
        </a>
      </div>

      <!-- Trading Hours -->
      <div v-if="department.trading" class="uk-margin-top">
        <div class="uk-text-bold uk-margin-small-bottom">
          <span uk-icon="clock" class="uk-margin-small-right"></span>
          Trading Hours
        </div>
        <ul class="uk-list uk-list-collapse uk-text-small">
          <li class="uk-flex uk-flex-between">
            <span>Monday – Friday</span>
            <span v-if="department.trading.monday?.[0]?.open">
              {{ formatTime(department.trading.monday[0].open) }} – {{ formatTime(department.trading.friday?.[0]?.close) }}
            </span>
          </li>
          <li class="uk-flex uk-flex-between">
            <span>Saturday</span>
            <span v-if="department.trading.saturday?.[0]?.current?.value !== 'open'">
              {{ department.trading.saturday?.[0]?.current?.label || 'Closed' }}
            </span>
            <span v-else>
              {{ formatTime(department.trading.saturday?.[0]?.open) }} – {{ formatTime(department.trading.saturday?.[0]?.close) }}
            </span>
          </li>
          <li class="uk-flex uk-flex-between">
            <span>Sunday</span>
            <span v-if="department.trading.sunday?.[0]?.current?.value !== 'open'">
              {{ department.trading.sunday?.[0]?.current?.label || 'Closed' }}
            </span>
            <span v-else>
              {{ formatTime(department.trading.sunday?.[0]?.open) }} – {{ formatTime(department.trading.sunday?.[0]?.close) }}
            </span>
          </li>
        </ul>
      </div>
    </div>
  `
});
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "ContactDetails",
  __ssrInlineRender: true,
  setup(__props) {
    const mainStore = useMainStore();
    const siteName = computed(() => mainStore.site?.name || "Sale Hyundai");
    const description = computed(() => mainStore.site?.description || "");
    const lmct = computed(() => mainStore.site?.lmct || "");
    const departments = computed(() => mainStore.site?.departments || {});
    const showSearch = () => {
    };
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "contact-details uk-section" }, _attrs))} data-v-4937f559><div class="uk-container" data-v-4937f559><div class="uk-grid uk-grid-large uk-flex-middle" uk-grid data-v-4937f559><div class="uk-width-1-2@m" data-v-4937f559>`);
      if (unref(lmct)) {
        _push(`<div class="uk-text-meta" data-v-4937f559>LMCT: ${ssrInterpolate(unref(lmct))}</div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<h2 class="uk-h1" data-v-4937f559>${ssrInterpolate(unref(siteName))} Departments</h2>`);
      if (unref(description)) {
        _push(`<div data-v-4937f559>${unref(description) ?? ""}</div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div><div class="uk-width-1-2@m" data-v-4937f559><ul uk-accordion class="uk-accordion" data-v-4937f559>`);
      if (unref(departments).sales) {
        _push(`<li class="uk-open" data-v-4937f559><a class="uk-accordion-title" href="#" data-v-4937f559>General Enquiry</a><div class="uk-accordion-content" data-v-4937f559>`);
        _push(ssrRenderComponent(unref(DepartmentInfo), {
          department: unref(departments).sales,
          onSearch: showSearch
        }, null, _parent));
        _push(`</div></li>`);
      } else {
        _push(`<!---->`);
      }
      if (unref(departments).service) {
        _push(`<li data-v-4937f559><a class="uk-accordion-title" href="#" data-v-4937f559>Service Enquiry</a><div class="uk-accordion-content" data-v-4937f559>`);
        _push(ssrRenderComponent(unref(DepartmentInfo), {
          department: unref(departments).service,
          "action-link": "/service",
          "action-text": "Book a Service"
        }, null, _parent));
        _push(`</div></li>`);
      } else {
        _push(`<!---->`);
      }
      if (unref(departments).parts) {
        _push(`<li data-v-4937f559><a class="uk-accordion-title" href="#" data-v-4937f559>Parts Enquiry</a><div class="uk-accordion-content" data-v-4937f559>`);
        _push(ssrRenderComponent(unref(DepartmentInfo), {
          department: unref(departments).parts,
          "action-link": "/parts",
          "action-text": "Parts Enquiry"
        }, null, _parent));
        _push(`</div></li>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</ul></div></div></div></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/page-elements/ContactDetails.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const ContactDetails = /* @__PURE__ */ Object.assign(_export_sfc(_sfc_main, [["__scopeId", "data-v-4937f559"]]), { __name: "ContactDetails" });

export { ContactDetails as default };
//# sourceMappingURL=ContactDetails-D5iTKAAn.mjs.map
