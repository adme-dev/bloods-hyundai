<template>
  <div v-if="activeTicker" class="header-ticker" :style="{ backgroundColor: tickerBackground }">
    <div class="max-w-[1400px] mx-auto px-4">
      <NuxtLink
        v-if="activeTicker.link"
        :to="activeTicker.link"
        class="ticker-content"
        :style="{ color: tickerTextColor }"
      >
        <span class="ticker-text">{{ tickerMessage }}</span>
        <span class="ticker-cta" :style="{ color: tickerCtaColor }">
          Shop now
          <svg class="w-4 h-4 inline-block ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </span>
      </NuxtLink>
      <div v-else class="ticker-content" :style="{ color: tickerTextColor }">
        <span class="ticker-text">{{ tickerMessage }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { isDateInRange } from '~/utils/date';

const mainStore = useMainStore();

/**
 * Calculate relative luminance of a color
 * Returns a value between 0 (black) and 1 (white)
 * Based on WCAG 2.0 formula
 */
const getRelativeLuminance = (hexColor: string): number => {
  // Remove # if present
  const hex = hexColor.replace('#', '');
  
  // Parse RGB values
  let r = parseInt(hex.substring(0, 2), 16) / 255;
  let g = parseInt(hex.substring(2, 4), 16) / 255;
  let b = parseInt(hex.substring(4, 6), 16) / 255;
  
  // Apply gamma correction
  r = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
  g = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
  b = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);
  
  // Calculate luminance
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/**
 * Determine if text should be light or dark based on background color
 * Returns true if background is dark (should use light text)
 */
const isDarkBackground = (hexColor: string): boolean => {
  const luminance = getRelativeLuminance(hexColor);
  // Threshold of 0.5 - below this is considered "dark"
  return luminance < 0.5;
};

// Get active ticker (filtered by date)
const activeTicker = computed(() => {
  const tickers = mainStore.site?.ticker || [];
  
  // Find first active ticker within date range
  const active = tickers.find((ticker: any) => {
    // Check date range using 'start' and 'end' fields (DD-MM-YYYY format)
    return isDateInRange(ticker.start, ticker.end);
  });
  
  return active || null;
});

// Ticker message - support both 'content' and 'heading' fields
const tickerMessage = computed(() => {
  if (!activeTicker.value) return '';
  return activeTicker.value.content || activeTicker.value.heading || '';
});

// Ticker background - support both 'background' and 'background_color' fields
const tickerBackground = computed(() => {
  if (!activeTicker.value) return '#001E50';
  return activeTicker.value.background || activeTicker.value.background_color || '#001E50';
});

// Automatically determine text color based on background luminance
const tickerTextColor = computed(() => {
  const bgColor = tickerBackground.value;
  return isDarkBackground(bgColor) ? '#ffffff' : '#1a1a1a';
});

// CTA link color - slightly different shade for contrast
const tickerCtaColor = computed(() => {
  const bgColor = tickerBackground.value;
  // For dark backgrounds: use a light blue/cyan
  // For light backgrounds: use a dark blue
  return isDarkBackground(bgColor) ? '#00aad2' : '#001E50';
});
</script>

<style scoped>
.header-ticker {
  padding: 10px 0;
  font-size: 0.875rem;
  text-align: center;
}

.ticker-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
  text-decoration: none;
}

a.ticker-content:hover {
  opacity: 0.9;
}

.ticker-text {
  font-weight: 500;
}

.ticker-cta {
  font-weight: 600;
  display: inline-flex;
  align-items: center;
}

@media (max-width: 640px) {
  .header-ticker {
    font-size: 0.75rem;
    padding: 8px 0;
  }
  
  .ticker-content {
    gap: 8px;
  }
}
</style>








