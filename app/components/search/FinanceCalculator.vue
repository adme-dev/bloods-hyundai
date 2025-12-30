<template>
  <div class="finance-calculator uk-card uk-card-default uk-card-body">
    <h4 class="uk-card-title uk-margin-remove-top">
      <span uk-icon="credit-card"></span>
      Finance Calculator
    </h4>

    <div class="calculator-display uk-text-center uk-padding-small uk-background-muted uk-border-rounded">
      <div class="uk-text-small uk-text-muted">Estimated {{ paymentFrequency }} repayment</div>
      <div class="uk-h2 uk-text-primary uk-margin-remove">
        {{ formattedPayment }}<sup>~</sup>
      </div>
      <div class="uk-text-small">
        over {{ termMonths }} months @ {{ interestRate }}% p.a.
      </div>
    </div>

    <div class="uk-margin-top">
      <!-- Vehicle Price -->
      <div class="slider-group">
        <div class="uk-flex uk-flex-between">
          <label class="uk-form-label">Vehicle Price</label>
          <span class="uk-text-bold">{{ formatCurrency(vehiclePrice) }}</span>
        </div>
        <input 
          type="range" 
          v-model.number="vehiclePrice" 
          :min="5000" 
          :max="150000" 
          step="1000"
          class="uk-range"
        />
      </div>

      <!-- Deposit -->
      <div class="slider-group">
        <div class="uk-flex uk-flex-between">
          <label class="uk-form-label">Deposit</label>
          <span class="uk-text-bold">{{ formatCurrency(deposit) }}</span>
        </div>
        <input 
          type="range" 
          v-model.number="deposit" 
          :min="0" 
          :max="Math.min(50000, vehiclePrice * 0.5)" 
          step="500"
          class="uk-range"
        />
      </div>

      <!-- Trade-in -->
      <div class="slider-group">
        <div class="uk-flex uk-flex-between">
          <label class="uk-form-label">Trade-in Value</label>
          <span class="uk-text-bold">{{ formatCurrency(tradeIn) }}</span>
        </div>
        <input 
          type="range" 
          v-model.number="tradeIn" 
          :min="0" 
          :max="50000" 
          step="500"
          class="uk-range"
        />
      </div>

      <!-- Term -->
      <div class="slider-group">
        <div class="uk-flex uk-flex-between">
          <label class="uk-form-label">Loan Term</label>
          <span class="uk-text-bold">{{ termMonths }} months</span>
        </div>
        <input 
          type="range" 
          v-model.number="termMonths" 
          :min="12" 
          :max="84" 
          step="12"
          class="uk-range"
        />
        <div class="uk-flex uk-flex-between uk-text-small uk-text-muted">
          <span>1 year</span>
          <span>7 years</span>
        </div>
      </div>

      <!-- Interest Rate -->
      <div class="slider-group">
        <div class="uk-flex uk-flex-between">
          <label class="uk-form-label">Interest Rate</label>
          <span class="uk-text-bold">{{ interestRate }}% p.a.</span>
        </div>
        <input 
          type="range" 
          v-model.number="interestRate" 
          :min="3" 
          :max="15" 
          step="0.25"
          class="uk-range"
        />
      </div>

      <!-- Payment Frequency Toggle -->
      <div class="uk-margin-top uk-flex uk-flex-center">
        <div class="uk-button-group">
          <button 
            class="uk-button uk-button-small"
            :class="paymentFrequency === 'weekly' ? 'uk-button-primary' : 'uk-button-default'"
            @click="paymentFrequency = 'weekly'"
          >
            Weekly
          </button>
          <button 
            class="uk-button uk-button-small"
            :class="paymentFrequency === 'fortnightly' ? 'uk-button-primary' : 'uk-button-default'"
            @click="paymentFrequency = 'fortnightly'"
          >
            Fortnightly
          </button>
          <button 
            class="uk-button uk-button-small"
            :class="paymentFrequency === 'monthly' ? 'uk-button-primary' : 'uk-button-default'"
            @click="paymentFrequency = 'monthly'"
          >
            Monthly
          </button>
        </div>
      </div>
    </div>

    <!-- Summary -->
    <div class="uk-margin-top uk-grid-small uk-child-width-1-2 uk-text-center" uk-grid>
      <div>
        <div class="uk-text-small uk-text-muted">Total Interest</div>
        <div class="uk-text-bold">{{ formatCurrency(totalInterest) }}</div>
      </div>
      <div>
        <div class="uk-text-small uk-text-muted">Total Repayable</div>
        <div class="uk-text-bold">{{ formatCurrency(totalRepayable) }}</div>
      </div>
    </div>

    <!-- Disclaimer -->
    <div class="uk-margin-top uk-text-meta uk-text-center">
      <sup>~</sup>This is an estimate only. Contact us for a personalised quote.
    </div>

    <!-- CTA -->
    <div class="uk-margin-top">
      <NuxtLink to="/finance" class="uk-button uk-button-primary uk-width-1-1">
        Apply for Finance
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  initialPrice?: number;
}>();

// Calculator state
const vehiclePrice = ref(props.initialPrice || 30000);
const deposit = ref(0);
const tradeIn = ref(0);
const termMonths = ref(60);
const interestRate = ref(7.99);
const paymentFrequency = ref<'weekly' | 'fortnightly' | 'monthly'>('weekly');

// Watch for prop changes
watch(() => props.initialPrice, (newPrice) => {
  if (newPrice) {
    vehiclePrice.value = newPrice;
  }
});

// Calculations
const loanAmount = computed(() => {
  return Math.max(0, vehiclePrice.value - deposit.value - tradeIn.value);
});

const monthlyPayment = computed(() => {
  const principal = loanAmount.value;
  const monthlyRate = interestRate.value / 100 / 12;
  const numPayments = termMonths.value;
  
  if (monthlyRate === 0) {
    return principal / numPayments;
  }
  
  const x = Math.pow(1 + monthlyRate, numPayments);
  return (principal * monthlyRate * x) / (x - 1);
});

const calculatedPayment = computed(() => {
  const monthly = monthlyPayment.value;
  switch (paymentFrequency.value) {
    case 'weekly':
      return (monthly * 12) / 52;
    case 'fortnightly':
      return (monthly * 12) / 26;
    default:
      return monthly;
  }
});

const formattedPayment = computed(() => {
  return formatCurrency(calculatedPayment.value);
});

const totalRepayable = computed(() => {
  return monthlyPayment.value * termMonths.value;
});

const totalInterest = computed(() => {
  return totalRepayable.value - loanAmount.value;
});

// Helpers
const formatCurrency = (value: number) => {
  return '$' + Math.round(value).toLocaleString('en-AU');
};
</script>

<style lang="scss" scoped>
.finance-calculator {
  border-radius: 8px;

  .slider-group {
    margin-bottom: 16px;

    .uk-form-label {
      font-size: 0.875rem;
      font-weight: 500;
    }
  }

  .uk-range {
    width: 100%;
    margin-top: 8px;
  }

  .calculator-display {
    margin-bottom: 20px;
  }
}
</style>









