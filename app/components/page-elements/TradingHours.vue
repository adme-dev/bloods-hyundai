<template>
  <div class="trading-hours">
    <!-- Notice -->
    <div v-if="showNotice && notice" class="trading-notice uk-alert-warning uk-margin-small-bottom" uk-alert>
      <div class="uk-h5 uk-margin-remove" v-html="notice.heading"></div>
      <div class="uk-text-small" v-html="notice.sub_heading"></div>
    </div>

    <!-- Title -->
    <div class="uk-h5 uk-margin-small-bottom uk-text-bold">Trading Hours</div>

    <!-- Hours Table -->
    <div class="hours-table">
      <!-- Header -->
      <div class="hours-row hours-header uk-grid uk-grid-small uk-child-width-1-3 uk-text-uppercase uk-text-small uk-text-muted" uk-grid>
        <div>Day</div>
        <div>From</div>
        <div>To</div>
      </div>

      <!-- Days -->
      <div 
        v-for="(value, day, index) in processedHours" 
        :key="day"
        class="hours-row uk-grid uk-grid-small uk-child-width-1-3"
        :class="{ 'uk-text-primary uk-text-bold': isToday(index) }"
        uk-grid
      >
        <div class="uk-text-capitalize">{{ day }}</div>
        <template v-if="value.status === 'open'">
          <div>{{ value.open }}</div>
          <div>{{ value.close }}</div>
        </template>
        <div v-else class="uk-width-expand uk-text-muted">{{ value.status }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface TradingHour {
  open?: string;
  close?: string;
  status: string;
}

interface TradingHours {
  notice?: {
    heading: string;
    sub_heading: string;
    start: string;
    end: string;
  }[];
  monday?: TradingHour;
  tuesday?: TradingHour;
  wednesday?: TradingHour;
  thursday?: TradingHour;
  friday?: TradingHour;
  saturday?: TradingHour;
  sunday?: TradingHour;
}

interface Props {
  tradingHours?: TradingHours;
}

const props = defineProps<Props>();

// Notice
const notice = computed(() => props.tradingHours?.notice?.[0]);

const showNotice = computed(() => {
  if (!notice.value) return false;
  return isDateInRange(notice.value.start, notice.value.end);
});

// Process trading hours
const processedHours = computed(() => {
  if (!props.tradingHours) return {};
  
  const { notice, ...hours } = props.tradingHours;
  const result: Record<string, TradingHour> = {};
  
  const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  
  for (const day of dayOrder) {
    const hourData = hours[day as keyof typeof hours];
    if (hourData) {
      result[day] = {
        open: formatTime(hourData.open),
        close: formatTime(hourData.close),
        status: hourData.status || 'open',
      };
    }
  }
  
  return result;
});

// Check if today
const isToday = (index: number) => {
  const today = new Date().getDay();
  // Convert JS day (0=Sunday) to index (0=Monday)
  const adjustedToday = today === 0 ? 6 : today - 1;
  return adjustedToday === index;
};

// Date range check
const isDateInRange = (start: string, end: string) => {
  if (!start || !end) return false;
  const now = new Date();
  const startDate = new Date(start);
  const endDate = new Date(end);
  return now >= startDate && now <= endDate;
};

// Format time (convert 24h to 12h)
const formatTime = (time?: string) => {
  if (!time) return '';
  
  // If already in 12h format
  if (time.includes('am') || time.includes('pm') || time.includes('AM') || time.includes('PM')) {
    return time;
  }
  
  // Convert 24h to 12h
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'pm' : 'am';
  const hour12 = hours % 12 || 12;
  
  return `${hour12}:${String(minutes || 0).padStart(2, '0')}${period}`;
};
</script>

<style scoped>
.hours-row {
  padding: 8px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.hours-row:last-child {
  border-bottom: none;
}

.hours-header {
  font-size: 0.75rem;
  padding-bottom: 4px;
}
</style>




