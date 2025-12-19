<template>
  <Transition name="slide-down">
    <div 
      v-show="isVisible"
      class="vehicle-sticky-bar"
    >
      <div class="sticky-bar-container">
        <!-- Vehicle Image & Info -->
        <div class="sticky-bar-info">
          <div class="sticky-bar-image">
            <img 
              v-if="image" 
              :src="image" 
              :alt="title"
              loading="lazy"
            />
            <div v-else class="sticky-bar-image-placeholder">
              <svg class="h-6 w-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <div class="sticky-bar-details">
            <h2 class="sticky-bar-title">{{ title }}</h2>
          </div>
        </div>

        <!-- Pricing -->
        <div class="sticky-bar-pricing">
          <div class="sticky-bar-price-group">
            <span class="sticky-bar-price-label">DRIVE AWAY FROM</span>
            <span class="sticky-bar-price">{{ price }}</span>
          </div>
          <span class="sticky-bar-or">OR</span>
          <div class="sticky-bar-price-group">
            <span class="sticky-bar-weekly">{{ perWeek }} p/w<sup>*</sup></span>
            <span class="sticky-bar-weekly-label">To Approved Purchasers</span>
          </div>
        </div>

        <!-- Actions -->
        <div class="sticky-bar-actions">
          <NuxtLink 
            to="/sell-my-car" 
            class="sticky-bar-btn sticky-bar-btn--secondary"
          >
            Sell your car
          </NuxtLink>
          <button 
            type="button"
            class="sticky-bar-btn sticky-bar-btn--primary"
            @click="$emit('enquire')"
          >
            Enquire
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
interface Props {
  title: string
  price: string
  perWeek?: string
  image?: string
  scrollThreshold?: number
}

const props = withDefaults(defineProps<Props>(), {
  scrollThreshold: 400,
  perWeek: '',
  image: '',
})

defineEmits<{
  enquire: []
}>()

const isVisible = ref(false)
const lastScrollY = ref(0)

// Track scroll position - show when past threshold, hide when scrolling back to top
const handleScroll = () => {
  const currentScrollY = window.scrollY
  const scrollDelta = currentScrollY - lastScrollY.value
  
  // Show bar when scrolled past threshold
  if (currentScrollY > props.scrollThreshold) {
    // Only show when scrolling down (not on initial scroll up)
    if (scrollDelta > 0 || isVisible.value) {
      isVisible.value = true
    }
  }
  
  // Hide when back near the header area (user wants to see original content)
  if (currentScrollY < props.scrollThreshold - 100) {
    isVisible.value = false
  }
  
  // Always hide when near the very top
  if (currentScrollY < 100) {
    isVisible.value = false
  }
  
  lastScrollY.value = currentScrollY
}

// Throttle scroll handler for performance
let ticking = false
const throttledScroll = () => {
  if (!ticking) {
    window.requestAnimationFrame(() => {
      handleScroll()
      ticking = false
    })
    ticking = true
  }
}

onMounted(() => {
  window.addEventListener('scroll', throttledScroll, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', throttledScroll)
})
</script>

<style scoped>
.vehicle-sticky-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background-color: #001E50;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
}

.sticky-bar-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0.75rem 1.5rem;
}

/* Vehicle Info Section */
.sticky-bar-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-shrink: 0;
}

.sticky-bar-image {
  width: 80px;
  height: 50px;
  border-radius: 6px;
  overflow: hidden;
  background-color: rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
}

.sticky-bar-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.sticky-bar-image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sticky-bar-details {
  min-width: 0;
}

.sticky-bar-title {
  color: #fff;
  font-size: 0.9375rem;
  font-weight: 600;
  line-height: 1.3;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 280px;
}

/* Pricing Section */
.sticky-bar-pricing {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-shrink: 0;
}

.sticky-bar-price-group {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.sticky-bar-price-label {
  font-size: 0.625rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.6);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.sticky-bar-price {
  font-size: 1.5rem;
  font-weight: 700;
  color: #fff;
  line-height: 1.2;
}

.sticky-bar-or {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: #000;
  color: #fff;
  font-size: 0.75rem;
  font-weight: 600;
  flex-shrink: 0;
}

.sticky-bar-weekly {
  font-size: 1.375rem;
  font-weight: 700;
  color: #fff;
  line-height: 1.2;
}

.sticky-bar-weekly sup {
  font-size: 0.625rem;
  color: rgba(255, 255, 255, 0.8);
}

.sticky-bar-weekly-label {
  font-size: 0.625rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.6);
}

/* Actions Section */
.sticky-bar-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
}

.sticky-bar-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.625rem 1.25rem;
  font-size: 0.875rem;
  font-weight: 600;
  border-radius: 9999px;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  text-decoration: none;
}

.sticky-bar-btn--secondary {
  background-color: #fff;
  color: #001E50;
  border: 1px solid #fff;
}

.sticky-bar-btn--secondary:hover {
  background-color: #f1f5f9;
  border-color: #f1f5f9;
}

.sticky-bar-btn--primary {
  background-color: #e63312;
  color: #fff;
  border: 1px solid #e63312;
}

.sticky-bar-btn--primary:hover {
  background-color: #cc2d10;
  border-color: #cc2d10;
}

/* Slide transition */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}

/* Responsive - hide on mobile/tablet, show only on desktop */
@media (max-width: 1023px) {
  .vehicle-sticky-bar {
    display: none;
  }
}

/* Compact on smaller desktops */
@media (min-width: 1024px) and (max-width: 1279px) {
  .sticky-bar-container {
    padding: 0.625rem 1rem;
    gap: 1rem;
  }
  
  .sticky-bar-title {
    max-width: 180px;
    font-size: 0.8125rem;
  }
  
  .sticky-bar-image {
    width: 64px;
    height: 40px;
  }
  
  .sticky-bar-price {
    font-size: 1.25rem;
  }
  
  .sticky-bar-weekly {
    font-size: 1.125rem;
  }
  
  .sticky-bar-btn {
    padding: 0.5rem 1rem;
    font-size: 0.8125rem;
  }
}
</style>
