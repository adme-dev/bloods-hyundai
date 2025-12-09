import { _ as _export_sfc, u as useMainStore, d as __nuxt_component_0$1 } from './server.mjs';
import { defineComponent, computed, ref, reactive, mergeProps, unref, withCtx, createTextVNode, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderClass, ssrInterpolate, ssrRenderAttr, ssrRenderComponent, ssrIncludeBooleanAttr } from 'vue/server-renderer';
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
  __name: "FinanceForm",
  __ssrInlineRender: true,
  setup(__props) {
    const mainStore = useMainStore();
    const siteName = computed(() => mainStore.site?.name || "Sale Hyundai");
    const retail = ref(3e4);
    const downPayment = ref(200);
    const tradeIn = ref(0);
    const length = ref(60);
    const rate = ref(9.98);
    const activeTab = ref("weekly");
    const form = reactive({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      message: ""
    });
    const isSubmitting = ref(false);
    const isSubmitted = ref(false);
    const hasErrors = ref(false);
    const loanAmount = computed(() => retail.value - downPayment.value - tradeIn.value);
    const calcMonthlyPayment = computed(() => {
      const p = loanAmount.value;
      const r = rate.value / 1200;
      const n = length.value;
      const i = Math.pow(1 + r, n);
      const payment = p * r * i / (i - 1) || 0;
      return formatCurrency(payment);
    });
    const calcWeeklyPayment = computed(() => {
      const p = loanAmount.value;
      const r = rate.value / 1200;
      const n = length.value;
      const i = Math.pow(1 + r, n);
      const payment = p * r * i / (i - 1) || 0;
      return formatCurrency(payment * 12 / 52);
    });
    const calcTotalPayable = computed(() => {
      const p = loanAmount.value;
      const r = rate.value / 1200;
      const n = length.value;
      const i = Math.pow(1 + r, n);
      const monthly = p * r * i / (i - 1) || 0;
      return formatCurrency(monthly * n);
    });
    const calcTotalInterest = computed(() => {
      const p = loanAmount.value;
      const r = rate.value / 1200;
      const n = length.value;
      const i = Math.pow(1 + r, n);
      const monthly = p * r * i / (i - 1) || 0;
      return formatCurrency(monthly * n - p);
    });
    const formatCurrency = (value) => {
      return "$" + Math.round(value).toLocaleString("en-AU");
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0$1;
      _push(`<div${ssrRenderAttrs(mergeProps({
        id: "finance_form",
        class: "uk-child-width-1-2@m uk-grid-collapse uk-grid"
      }, _attrs))} data-v-1196108f><div class="uk-background-default" data-v-1196108f><div class="calculator-container" data-v-1196108f><div class="uk-card uk-flex payment-calculator uk-overflow-hidden uk-flex-column" data-v-1196108f><div class="uk-padding-small" data-v-1196108f><h4 class="uk-margin-remove uk-text-bold" data-v-1196108f>Quick repayment estimator</h4><div class="uk-margin-remove-top uk-text-small uk-text-muted" data-v-1196108f> Discover your weekly/monthly repayments<sup data-v-1196108f>~</sup></div></div><ul uk-tab class="uk-grid-collapse uk-child-width-expand uk-text-center payment-tab uk-grid" data-v-1196108f><li class="${ssrRenderClass({ "uk-active": unref(activeTab) === "weekly" })}" data-v-1196108f><a href="#" data-v-1196108f><h4 class="uk-h5 uk-text-bold uk-margin-remove" data-v-1196108f>Weekly Payment</h4></a></li><li class="${ssrRenderClass({ "uk-active": unref(activeTab) === "monthly" })}" data-v-1196108f><a href="#" data-v-1196108f><h4 class="uk-h5 uk-text-bold uk-margin-remove" data-v-1196108f>Monthly Payment</h4></a></li></ul><div class="filter-tab background-blue uk-padding-small text-blue uk-text-center" data-v-1196108f>`);
      if (unref(activeTab) === "weekly") {
        _push(`<div data-v-1196108f><div data-v-1196108f>Estimated payment:</div><div class="uk-h1 uk-text-bold text-blue uk-margin-remove" data-v-1196108f>${ssrInterpolate(unref(calcWeeklyPayment))}<sup data-v-1196108f>~</sup></div><div data-v-1196108f>per weekly</div><div class="uk-text-small" data-v-1196108f>over ${ssrInterpolate(unref(length))} months with ${ssrInterpolate(formatCurrency(unref(downPayment)))} deposit</div></div>`);
      } else {
        _push(`<div data-v-1196108f><div data-v-1196108f>Estimated payment:</div><div class="uk-h1 uk-text-bold text-blue uk-margin-remove" data-v-1196108f>${ssrInterpolate(unref(calcMonthlyPayment))}<sup data-v-1196108f>~</sup></div><div data-v-1196108f>per monthly</div><div class="uk-text-small" data-v-1196108f>over ${ssrInterpolate(unref(length))} months with ${ssrInterpolate(formatCurrency(unref(downPayment)))} deposit</div></div>`);
      }
      _push(`</div><div class="calculator-footer uk-position-relative uk-padding-small background-blue uk-light uk-flex-1" data-v-1196108f><div class="uk-grid-collapse uk-child-width-1-2 uk-text-center uk-grid" data-v-1196108f><div class="uk-text-small text-white" data-v-1196108f><div data-v-1196108f>Estimated Total</div><div data-v-1196108f>Interest Repayable</div><div class="uk-text-bold text-white" data-v-1196108f>${ssrInterpolate(unref(calcTotalInterest))}</div></div><div class="uk-text-small text-white left-border" data-v-1196108f><div data-v-1196108f>Estimated Total</div><div data-v-1196108f>Repayable</div><div class="uk-text-bold text-white" data-v-1196108f>${ssrInterpolate(unref(calcTotalPayable))}</div></div></div></div><form class="uk-padding" data-v-1196108f><label data-v-1196108f> Vehicle Price <span class="uk-text-bold uk-text-secondary" data-v-1196108f>${ssrInterpolate(formatCurrency(unref(retail)))}</span></label><input type="range"${ssrRenderAttr("value", unref(retail))}${ssrRenderAttr("min", 0)}${ssrRenderAttr("max", 15e4)} step="100" class="uk-range" data-v-1196108f><label class="uk-margin-small-top uk-display-block" data-v-1196108f> Down payment <span class="uk-text-bold uk-text-secondary" data-v-1196108f>${ssrInterpolate(formatCurrency(unref(downPayment)))}</span></label><input type="range"${ssrRenderAttr("value", unref(downPayment))}${ssrRenderAttr("min", 0)}${ssrRenderAttr("max", 5e4)} step="100" class="uk-range" data-v-1196108f><label class="uk-margin-small-top uk-display-block" data-v-1196108f> Trade-in value <span class="uk-text-bold uk-text-secondary" data-v-1196108f>${ssrInterpolate(formatCurrency(unref(tradeIn)))}</span></label><input type="range"${ssrRenderAttr("value", unref(tradeIn))}${ssrRenderAttr("min", 0)}${ssrRenderAttr("max", 5e4)} step="100" class="uk-range" data-v-1196108f><label class="uk-margin-small-top uk-display-block" data-v-1196108f> Term length <span class="uk-text-bold uk-text-secondary" data-v-1196108f>${ssrInterpolate(unref(length))} months</span><span class="uk-text-meta" data-v-1196108f> (${ssrInterpolate(Math.round(unref(length) / 12))} years)</span></label><input type="range"${ssrRenderAttr("value", unref(length))}${ssrRenderAttr("min", 12)}${ssrRenderAttr("max", 84)} step="12" class="uk-range" data-v-1196108f><label class="uk-margin-small-top uk-display-block" data-v-1196108f> Interest rate <span class="uk-text-bold uk-text-secondary" data-v-1196108f>${ssrInterpolate(unref(rate))}%</span></label><input type="range"${ssrRenderAttr("value", unref(rate))}${ssrRenderAttr("min", 0)}${ssrRenderAttr("max", 15)} step="0.1" class="uk-range" data-v-1196108f><div class="uk-width-auto uk-text-meta uk-margin-small-top" data-v-1196108f><sup data-v-1196108f>~</sup>The calculations performed and the results provided by the calculators on this website are estimates only and should be treated as a guide. For a quote or to apply for finance please contact us. </div></form></div></div></div><div class="uk-background-default" data-v-1196108f><div class="contact-form uk-padding-small" data-v-1196108f><div class="uk-text-center uk-margin-medium-top" data-v-1196108f><div class="uk-h2 uk-margin-remove" data-v-1196108f>START YOUR ADVENTURE</div><div class="uk-h4 uk-text-uppercase uk-margin-remove" data-v-1196108f>PRE-APPROVAL ${ssrInterpolate(unref(siteName))}</div></div>`);
      if (!unref(isSubmitted)) {
        _push(`<div class="uk-padding-small" data-v-1196108f><form class="${ssrRenderClass({ "errors": unref(hasErrors) })}" data-v-1196108f>`);
        if (unref(hasErrors)) {
          _push(`<div class="uk-alert uk-alert-danger" data-v-1196108f> Please correct the errors below. </div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<fieldset class="uk-fieldset uk-grid-small" uk-grid data-v-1196108f><div class="uk-width-1-2@m uk-inline" data-v-1196108f><span class="uk-form-icon" uk-icon="icon: user" data-v-1196108f></span><input${ssrRenderAttr("value", unref(form).firstName)} class="uk-input uk-form-large" type="text" placeholder="First Name" required data-v-1196108f></div><div class="uk-width-1-2@m uk-inline" data-v-1196108f><span class="uk-form-icon" uk-icon="icon: user" data-v-1196108f></span><input${ssrRenderAttr("value", unref(form).lastName)} class="uk-input uk-form-large" type="text" placeholder="Last Name" required data-v-1196108f></div><div class="uk-width-1-1 uk-inline" data-v-1196108f><span class="uk-form-icon" uk-icon="icon: mail" data-v-1196108f></span><input${ssrRenderAttr("value", unref(form).email)} class="uk-input uk-form-large" type="email" placeholder="Email Address" required data-v-1196108f></div><div class="uk-width-1-1 uk-inline" data-v-1196108f><span class="uk-form-icon" uk-icon="icon: receiver" data-v-1196108f></span><input${ssrRenderAttr("value", unref(form).phone)} class="uk-input uk-form-large" type="tel" placeholder="Phone Number" data-v-1196108f></div><div class="uk-width-1-1 uk-inline" data-v-1196108f><span class="uk-form-icon" uk-icon="icon: commenting" data-v-1196108f></span><textarea class="uk-textarea" rows="4" placeholder="Message" data-v-1196108f>${ssrInterpolate(unref(form).message)}</textarea></div><div class="uk-width-1-1 uk-text-center uk-padding-small" data-v-1196108f><div class="uk-h3" data-v-1196108f>LOAN DETAILS</div></div><div class="uk-width-1-3@m uk-inline" data-v-1196108f><span class="uk-form-icon" uk-icon="icon: credit-card" data-v-1196108f></span><input${ssrRenderAttr("value", formatCurrency(unref(retail)))} class="uk-input uk-form-large" type="text" placeholder="Loan Amount" disabled data-v-1196108f></div><div class="uk-width-1-3@m uk-inline" data-v-1196108f><span class="uk-form-icon" uk-icon="icon: credit-card" data-v-1196108f></span><input${ssrRenderAttr("value", formatCurrency(unref(downPayment)))} class="uk-input uk-form-large" type="text" placeholder="Down Payment" disabled data-v-1196108f></div><div class="uk-width-1-3@m uk-inline" data-v-1196108f><span class="uk-form-icon" uk-icon="icon: credit-card" data-v-1196108f></span><input${ssrRenderAttr("value", formatCurrency(unref(tradeIn)))} class="uk-input uk-form-large" type="text" placeholder="Trade-in Value" disabled data-v-1196108f></div><div class="uk-width-1-2@m uk-inline" data-v-1196108f><span class="uk-form-icon" uk-icon="icon: calendar" data-v-1196108f></span><input${ssrRenderAttr("value", `${unref(length)} months`)} class="uk-input uk-form-large" type="text" placeholder="Term Length" disabled data-v-1196108f></div><div class="uk-width-1-2@m uk-inline" data-v-1196108f><span class="uk-form-icon" uk-icon="icon: bolt" data-v-1196108f></span><input${ssrRenderAttr("value", `${unref(rate)}%`)} class="uk-input uk-form-large" type="text" placeholder="Interest Rate" disabled data-v-1196108f></div><div class="uk-width-1-1" data-v-1196108f><p class="uk-text-meta uk-margin-small-top" data-v-1196108f> Your personal information will be collected, used and stored in strict accordance with our `);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: "/privacy-policy",
          class: "uk-text-primary",
          target: "_blank"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`Privacy Policy`);
            } else {
              return [
                createTextVNode("Privacy Policy")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`. </p></div></fieldset><div class="uk-margin-medium-top uk-text-center" data-v-1196108f><button type="submit" class="uk-button uk-button-primary uk-button-large"${ssrIncludeBooleanAttr(unref(isSubmitting)) ? " disabled" : ""} data-v-1196108f>`);
        if (unref(isSubmitting)) {
          _push(`<span uk-spinner="ratio: 0.6" data-v-1196108f></span>`);
        } else {
          _push(`<!---->`);
        }
        _push(` ${ssrInterpolate(unref(isSubmitting) ? "Sending..." : "Send Enquiry")}</button></div></form></div>`);
      } else {
        _push(`<div class="uk-text-center uk-padding" data-v-1196108f><span uk-icon="icon: check; ratio: 3" class="uk-text-success" data-v-1196108f></span><h3 data-v-1196108f>Thank You, ${ssrInterpolate(unref(form).firstName)}!</h3><p data-v-1196108f>Your finance pre-approval enquiry has been submitted. One of our team members will be in touch shortly.</p></div>`);
      }
      _push(`</div></div></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/page-elements/FinanceForm.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const FinanceForm = /* @__PURE__ */ Object.assign(_export_sfc(_sfc_main, [["__scopeId", "data-v-1196108f"]]), { __name: "FinanceForm" });

export { FinanceForm as default };
//# sourceMappingURL=FinanceForm-Be8BTUO5.mjs.map
