<template>
  <div class="top-bar bg-[#1a1a1a] text-white text-sm">
    <div class="max-w-[1400px] mx-auto px-4 lg:px-8">
      <div class="flex items-center justify-between h-10">
        <!-- Left side - Google Reviews -->
        <a 
          :href="googleMapsUrl" 
          target="_blank" 
          rel="noopener noreferrer"
          class="hidden sm:flex items-center gap-2 hover:text-gray-300 transition-colors"
        >
          <!-- Google G icon -->
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          <span class="font-medium">Google Reviews</span>
          <span v-if="totalReviews > 0" class="text-gray-400">({{ totalReviews }})</span>
        </a>

        <!-- Right side - Address, Book a Service, Phone -->
        <div class="flex items-center gap-6 md:gap-8">
          <!-- Address -->
          <a 
            :href="mapDirections" 
            target="_blank" 
            rel="noopener noreferrer"
            class="flex items-center gap-2 hover:text-gray-300 transition-colors"
          >
            <!-- Location pin icon -->
            <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span class="truncate hidden lg:inline">{{ showroomAddress }}</span>
          </a>

          <!-- Book a Service -->
          <NuxtLink
            to="/service"
            class="hidden md:flex items-center gap-2 hover:text-gray-300 transition-colors"
          >
            <!-- Wrench/Service icon -->
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span class="font-medium">Book a Service</span>
          </NuxtLink>

          <!-- Book a Test Drive -->
          <NuxtLink
            to="/test-drive"
            class="hidden lg:flex items-center gap-2 hover:text-gray-300 transition-colors"
          >
            <!-- Car icon -->
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
            </svg>
            <span class="font-medium">Book a Test Drive</span>
          </NuxtLink>

          <!-- Phone -->
          <a 
            :href="`tel:${phoneFormatted}`" 
            class="flex items-center gap-2 hover:text-gray-300 transition-colors"
          >
            <!-- Phone icon -->
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <span class="font-medium">{{ phone }}</span>
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const mainStore = useMainStore();
const reviewsStore = useReviewsStore();

// Site data
const showroomAddress = computed(() => mainStore.site?.showroom_address || '');
const phone = computed(() => mainStore.site?.phone || '');
const phoneFormatted = computed(() => phone.value.replace(/[^0-9+]/g, ''));
const mapDirections = computed(() => mainStore.site?.map_directions || '#');

// Google Maps URL for reviews
const googleMapsUrl = computed(() => {
  const placeId = mainStore.site?.place_id;
  if (placeId) {
    return `https://search.google.com/local/reviews?placeid=${placeId}`;
  }
  return mapDirections.value;
});

// Reviews data
const totalReviews = computed(() => reviewsStore.totalReviews);

// Fetch reviews on mount if not already loaded
onMounted(async () => {
  if (reviewsStore.totalReviews === 0 && !reviewsStore.loading) {
    await reviewsStore.fetchGoogleReviews();
  }
});
</script>




