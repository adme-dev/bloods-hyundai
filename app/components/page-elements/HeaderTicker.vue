<template>
  <div v-if="activeTicker" class="header-ticker" :style="{ backgroundColor: activeTicker.background_color || '#001E50' }">
    <div class="uk-container">
      <div class="ticker-content" :style="{ color: activeTicker.text_color || '#ffffff' }">
        <span v-if="activeTicker.icon" class="ticker-icon" :uk-icon="activeTicker.icon"></span>
        <span class="ticker-text" v-html="activeTicker.message"></span>
        <NuxtLink 
          v-if="activeTicker.link"
          :to="activeTicker.link"
          class="ticker-link"
          :style="{ color: activeTicker.link_color || '#00aad2' }"
        >
          {{ activeTicker.link_text || 'Learn More' }}
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { isDateInRange } from '~/utils/date';

const mainStore = useMainStore();

// Get active ticker (filtered by date)
const activeTicker = computed(() => {
  const tickers = mainStore.site?.ticker || [];
  
  // Find first active ticker
  const active = tickers.find((ticker: any) => {
    if (!ticker.enabled) return false;
    return isDateInRange(ticker.start_date, ticker.end_date);
  });
  
  return active || null;
});
</script>

<style scoped>
.header-ticker {
  padding: 8px 0;
  font-size: 0.875rem;
  text-align: center;
}

.ticker-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
}

.ticker-icon {
  opacity: 0.8;
}

.ticker-text {
  font-weight: 500;
}

.ticker-link {
  font-weight: 600;
  text-decoration: underline;
  margin-left: 8px;
  
  &:hover {
    opacity: 0.8;
  }
}

@media (max-width: 640px) {
  .header-ticker {
    font-size: 0.75rem;
    padding: 6px 0;
  }
  
  .ticker-content {
    gap: 4px;
  }
}
</style>






