<template>
  <div v-if="hasData" class="google-reviews-container w-full">
    <!-- Mobile Layout: Stacked (map above, card below) -->
    <div class="md:hidden">
      <!-- Map -->
      <div class="w-full h-[300px] relative">
        <div v-if="loading" class="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-10">
          <div class="text-center">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p class="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
        <DeferredMapEmbed
          :src="mapUrl"
          class="w-full h-full border-0"
          title="Dealership location"
        />
      </div>
      
      <!-- Info Card (relative, below map) -->
      <div v-if="!loading && !error" class="w-full bg-white shadow-lg">
        <div class="p-4 flex flex-col">
          <!-- Google Rating Section -->
          <div class="mb-4" itemprop="aggregateRating" itemscope itemtype="http://schema.org/AggregateRating">
            <div class="flex items-center justify-between gap-3">
              <div class="flex items-center gap-3 flex-1">
                <!-- Google Logo -->
                <svg viewBox="0 0 512 512" class="w-12 h-12 flex-shrink-0">
                  <g fill="none" fill-rule="evenodd">
                    <path d="M482.56 261.36c0-16.73-1.5-32.83-4.29-48.27H256v91.29h127.01c-5.47 29.5-22.1 54.49-47.09 71.23v59.21h76.27c44.63-41.09 70.37-101.59 70.37-173.46z" fill="#4285f4"></path>
                    <path d="M256 492c63.72 0 117.14-21.13 156.19-57.18l-76.27-59.21c-21.13 14.16-48.17 22.53-79.92 22.53-61.47 0-113.49-41.51-132.05-97.3H45.1v61.15c38.83 77.13 118.64 130.01 210.9 130.01z" fill="#34a853"></path>
                    <path d="M123.95 300.84c-4.72-14.16-7.4-29.29-7.4-44.84s2.68-30.68 7.4-44.84V150.01H45.1C29.12 181.87 20 217.92 20 256c0 38.08 9.12 74.13 25.1 105.99l78.85-61.15z" fill="#fbbc05"></path>
                    <path d="M256 113.86c34.65 0 65.76 11.91 90.22 35.29l67.69-67.69C373.03 43.39 319.61 20 256 20c-92.25 0-172.07 52.89-210.9 130.01l78.85 61.15c18.56-55.78 70.59-97.3 132.05-97.3z" fill="#ea4335"></path>
                    <path d="M20 20h472v472H20V20z"></path>
                  </g>
                </svg>
                <!-- Rating Info -->
                <div class="flex-1">
                  <div class="text-sm font-medium text-gray-700 leading-none mb-1">Google Rating</div>
                  <div class="flex items-center gap-1.5 mb-0.5">
                    <span itemprop="ratingValue" class="text-[26px] font-semibold text-gray-900 leading-none">{{ rating }}</span>
                    <div class="stars-rating text-base">
                      <div class="stars-inner" :style="{ width: (rating / 5) * 100 + '%' }"></div>
                    </div>
                  </div>
                  <div class="text-sm text-gray-700 leading-snug" v-if="totalReviews > 0">
                    Based on <span itemprop="ratingCount" class="text-gray-900 font-medium">{{ totalReviews }}</span> reviews
                  </div>
                </div>
              </div>
              <!-- Directions Button -->
              <a :href="directionsUrl" target="_blank" rel="noreferrer" class="flex flex-col items-center gap-0.5 px-3 py-2 text-[#1a73e8] font-medium text-sm leading-tight bg-gray-900 text-black rounded-md border border-transparent hover:border-[#1a73e8]/30 hover:bg-blue-50 transition-colors flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" height="24" viewBox="0 0 24 24" width="24" class="text-[#1a73e8]">
                  <path d="M0 0h24v24H0z" fill="none" />
                  <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" />
                </svg>
                <span>Directions</span>
              </a>
            </div>
            <!-- Write Review Button -->
            <a v-if="placeId" :href="`https://search.google.com/local/writereview?placeid=${placeId}`" target="_blank" rel="noreferrer" class="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-900 text-white hover:bg-gray-800 rounded-lg text-sm font-medium transition-colors shadow-sm mt-3">
              <svg xmlns="http://www.w3.org/2000/svg" height="16" viewBox="0 0 24 24" width="16" fill="currentColor">
                <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z" />
                <path d="M0 0h24v24H0z" fill="none" />
              </svg>
              <span>Write a review</span>
            </a>
          </div>
          <!-- Business Info -->
          <div class="mb-4 space-y-2" itemscope itemtype="http://schema.org/LocalBusiness">
            <div>
              <h3 class="text-[16px] font-semibold text-gray-900 mb-1.5 leading-tight">{{ siteName }}</h3>
              <p itemprop="address" itemscope itemtype="http://schema.org/PostalAddress" class="text-[15px] text-gray-900 leading-snug flex items-start gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="w-4 h-4 flex-shrink-0 mt-0.5 text-gray-800">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{{ formattedAddress }}</span>
              </p>
            </div>
            <a itemprop="telephone" :href="`tel:${phoneFormatted}`" class="flex items-center gap-2 text-[15px] font-semibold text-gray-900 hover:text-gray-700 transition-colors leading-snug">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="w-4 h-4 text-gray-800">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span>{{ phone }}</span>
            </a>
          </div>
          <!-- Trading Hours -->
          <div class="mb-0" itemprop="openingHours">
            <div class="inline-flex h-9 items-center justify-center rounded-md bg-gray-100 p-1 text-gray-800 mb-3">
              <button v-for="(dept, index) in departments" :key="dept.key" @click="activeDepartment = index" class="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-2.5 py-1 text-xs font-medium ring-offset-white transition-all" :class="activeDepartment === index ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-800 hover:text-gray-900 hover:bg-white/50'">
                {{ dept.label }}
              </button>
            </div>
            <div class="relative min-h-[150px]">
              <Transition mode="out-in" enter-active-class="transition-all duration-200 ease-out" enter-from-class="opacity-0 translate-y-1" enter-to-class="opacity-100 translate-y-0" leave-active-class="transition-all duration-150 ease-in" leave-from-class="opacity-100 translate-y-0" leave-to-class="opacity-0 -translate-y-1">
                <div :key="activeDepartment" class="space-y-1">
                  <div v-for="(hours, day) in currentDepartmentHours" :key="`mobile-${departments[activeDepartment]?.key || 'sales'}-${day}`" class="flex justify-between items-center text-xs py-1.5 border-b border-gray-100 last:border-0" :class="{ 'text-gray-900 font-medium': isToday(day), 'text-gray-800': !isToday(day) }">
                    <span>{{ day }}</span>
                    <span>{{ formatHours(hours) }}</span>
                  </div>
                </div>
              </Transition>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Desktop Layout: Map with floating card overlay -->
    <div class="hidden md:block relative w-full min-h-[600px]">
      <!-- Loading State -->
      <div v-if="loading" class="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-10">
        <div class="text-center">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p class="mt-4 text-gray-600">Loading reviews...</p>
        </div>
      </div>
      
      <!-- Error State -->
      <div v-else-if="error" class="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-10">
        <p class="text-red-600">Unable to load reviews: {{ error }}</p>
      </div>
      
      <!-- Map Background (Full Width) -->
      <div class="absolute inset-0 w-full h-full">
        <DeferredMapEmbed
          :src="mapUrl"
          class="w-full h-full border-0"
          title="Dealership location"
        />
      </div>

      <!-- Floating Info Panel -->
      <div v-if="!loading && !error" class="absolute inset-0 flex items-center justify-end z-20 pointer-events-none">
        <div class="w-[380px] xl:w-[420px] bg-white shadow-2xl m-4 rounded-lg overflow-hidden pointer-events-auto">
          <div class="p-4 lg:p-5 flex flex-col">
            <!-- Google Rating Section -->
            <div class="mb-4" itemprop="aggregateRating" itemscope itemtype="http://schema.org/AggregateRating">
              <div class="flex items-center justify-between gap-3">
                <div class="flex items-center gap-3 flex-1">
                  <!-- Google Logo -->
                  <svg viewBox="0 0 512 512" class="w-12 h-12 flex-shrink-0">
                    <g fill="none" fill-rule="evenodd">
                      <path d="M482.56 261.36c0-16.73-1.5-32.83-4.29-48.27H256v91.29h127.01c-5.47 29.5-22.1 54.49-47.09 71.23v59.21h76.27c44.63-41.09 70.37-101.59 70.37-173.46z" fill="#4285f4"></path>
                      <path d="M256 492c63.72 0 117.14-21.13 156.19-57.18l-76.27-59.21c-21.13 14.16-48.17 22.53-79.92 22.53-61.47 0-113.49-41.51-132.05-97.3H45.1v61.15c38.83 77.13 118.64 130.01 210.9 130.01z" fill="#34a853"></path>
                      <path d="M123.95 300.84c-4.72-14.16-7.4-29.29-7.4-44.84s2.68-30.68 7.4-44.84V150.01H45.1C29.12 181.87 20 217.92 20 256c0 38.08 9.12 74.13 25.1 105.99l78.85-61.15z" fill="#fbbc05"></path>
                      <path d="M256 113.86c34.65 0 65.76 11.91 90.22 35.29l67.69-67.69C373.03 43.39 319.61 20 256 20c-92.25 0-172.07 52.89-210.9 130.01l78.85 61.15c18.56-55.78 70.59-97.3 132.05-97.3z" fill="#ea4335"></path>
                      <path d="M20 20h472v472H20V20z"></path>
                    </g>
                  </svg>
                  <!-- Rating Info -->
                  <div class="flex-1">
                    <div class="text-sm font-medium text-gray-700 leading-none mb-1">Google Rating</div>
                    <div class="flex items-center gap-1.5 mb-0.5">
                      <span itemprop="ratingValue" class="text-[26px] font-semibold text-gray-900 leading-none">{{ rating }}</span>
                      <div class="stars-rating text-base">
                        <div class="stars-inner" :style="{ width: (rating / 5) * 100 + '%' }"></div>
                      </div>
                    </div>
                    <div class="text-sm text-gray-700 leading-snug" v-if="totalReviews > 0">
                      Based on <span itemprop="ratingCount" class="text-gray-900 font-medium">{{ totalReviews }}</span> reviews
                    </div>
                  </div>
                </div>
                <!-- Directions Button -->
                <a :href="directionsUrl" target="_blank" rel="noreferrer" class="flex flex-col items-center gap-0.5 px-3 py-2 text-[#1a73e8] font-medium text-sm leading-tight rounded-md border border-transparent hover:border-[#1a73e8]/30 hover:bg-blue-50 transition-colors flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" height="24" viewBox="0 0 24 24" width="24" class="text-[#1a73e8]">
                    <path d="M0 0h24v24H0z" fill="none" />
                    <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" />
                  </svg>
                  <span>Directions</span>
                </a>
              </div>
              <!-- Write Review Button -->
              <a v-if="placeId" :href="`https://search.google.com/local/writereview?placeid=${placeId}`" target="_blank" rel="noreferrer" class="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-900 text-white hover:bg-gray-800 rounded-lg text-sm font-medium transition-colors shadow-sm mt-3">
                <svg xmlns="http://www.w3.org/2000/svg" height="16" viewBox="0 0 24 24" width="16" fill="currentColor">
                  <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z" />
                  <path d="M0 0h24v24H0z" fill="none" />
                </svg>
                <span>Write a review</span>
              </a>
            </div>
            <!-- Business Info -->
            <div class="mb-4 space-y-2" itemscope itemtype="http://schema.org/LocalBusiness">
              <div>
                <h3 class="text-[16px] font-semibold text-gray-900 mb-1.5 leading-tight">{{ siteName }}</h3>
                <p itemprop="address" itemscope itemtype="http://schema.org/PostalAddress" class="text-[15px] text-gray-900 leading-snug flex items-start gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="w-4 h-4 flex-shrink-0 mt-0.5 text-gray-800">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{{ formattedAddress }}</span>
                </p>
              </div>
              <a itemprop="telephone" :href="`tel:${phoneFormatted}`" class="flex items-center gap-2 text-[15px] font-semibold text-gray-900 hover:text-gray-700 transition-colors leading-snug">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="w-4 h-4 text-gray-800">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span>{{ phone }}</span>
              </a>
            </div>
            <!-- Trading Hours -->
            <div class="mb-0" itemprop="openingHours">
              <div class="inline-flex h-9 items-center justify-center rounded-md bg-gray-100 p-1 text-gray-800 mb-3">
                <button v-for="(dept, index) in departments" :key="dept.key" @click="activeDepartment = index" class="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-2.5 py-1 text-xs font-medium ring-offset-white transition-all focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" :class="activeDepartment === index ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-800 hover:text-gray-900 hover:bg-white/50'">
                  {{ dept.label }}
                </button>
              </div>
              <div class="relative min-h-[150px]">
                <Transition mode="out-in" enter-active-class="transition-all duration-200 ease-out" enter-from-class="opacity-0 translate-y-1" enter-to-class="opacity-100 translate-y-0" leave-active-class="transition-all duration-150 ease-in" leave-from-class="opacity-100 translate-y-0" leave-to-class="opacity-0 -translate-y-1">
                  <div :key="activeDepartment" class="space-y-1">
                    <div v-for="(hours, day) in currentDepartmentHours" :key="`desktop-${departments[activeDepartment]?.key || 'sales'}-${day}`" class="flex justify-between items-center text-xs py-1.5 border-b border-gray-100 last:border-0" :class="{ 'text-gray-900 font-medium': isToday(day), 'text-gray-800': !isToday(day) }">
                      <span>{{ day }}</span>
                      <span>{{ formatHours(hours) }}</span>
                    </div>
                  </div>
                </Transition>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import DeferredMapEmbed from './DeferredMapEmbed.vue';

const mainStore = useMainStore();
const reviewsStore = useReviewsStore();
const props = withDefaults(defineProps<{
  shouldFetch?: boolean;
}>(), {
  shouldFetch: true,
});

// Site config data
const { siteName } = useSiteIdentity();
const showroomAddress = computed(() => mainStore.site?.showroom_address || '');
const phone = computed(() => mainStore.site?.phone || '');
const phoneFormatted = computed(() => phone.value.replace(/[^0-9]/g, ''));
const mapDirections = computed(() => mainStore.site?.map_directions || '');
const placeId = computed(() => mainStore.site?.place_id || '');

// Tab state
const activeDepartment = ref(0);
const departments = [
  { key: 'sales', label: 'Sales' },
  { key: 'service', label: 'Service' },
  { key: 'parts', label: 'Parts' },
];

// Default hours
const defaultHours = {
  'Monday': '8:30 AM – 6:00 PM',
  'Tuesday': '8:30 AM – 6:00 PM',
  'Wednesday': '8:30 AM – 6:00 PM',
  'Thursday': '8:30 AM – 6:00 PM',
  'Friday': '8:30 AM – 6:00 PM',
  'Saturday': '8:30 AM – 5:00 PM',
  'Sunday': 'Closed',
};

// Get hours for each department
const salesHours = computed(() => {
  const hours = mainStore.site?.trading_hours;
  if (!hours) return defaultHours;
  
  if (typeof hours === 'object' && !Array.isArray(hours)) {
    if (hours.sales?.hours) {
      return hours.sales.hours;
    }
    if (hours.Monday || hours.monday) {
      return hours;
    }
  }
  
  return defaultHours;
});

const serviceHours = computed(() => {
  const hours = mainStore.site?.trading_hours;
  if (!hours) return defaultHours;
  
  if (typeof hours === 'object' && !Array.isArray(hours)) {
    if (hours.service?.hours) {
      return hours.service.hours;
    }
    if (hours.sales?.hours) {
      return hours.sales.hours;
    }
    if (hours.Monday || hours.monday) {
      return hours;
    }
  }
  
  return defaultHours;
});

const partsHours = computed(() => {
  const hours = mainStore.site?.trading_hours;
  if (!hours) return defaultHours;
  
  if (typeof hours === 'object' && !Array.isArray(hours)) {
    if (hours.parts?.hours) {
      return hours.parts.hours;
    }
    if (hours.service?.hours) {
      return hours.service.hours;
    }
    if (hours.sales?.hours) {
      return hours.sales.hours;
    }
    if (hours.Monday || hours.monday) {
      return hours;
    }
  }
  
  return defaultHours;
});

// Current department hours based on active tab
const currentDepartmentHours = computed(() => {
  const deptIndex = activeDepartment.value;
  if (deptIndex < 0 || deptIndex >= departments.length) return salesHours.value;
  
  const dept = departments[deptIndex];
  switch (dept?.key) {
    case 'sales':
      return salesHours.value;
    case 'service':
      return serviceHours.value;
    case 'parts':
      return partsHours.value;
    default:
      return salesHours.value;
  }
});

// Reviews data
const rating = computed(() => reviewsStore.rating || 0);
const totalReviews = computed(() => reviewsStore.totalReviews || 0);
const reviews = computed(() => reviewsStore.reviews || []);
const loading = computed(() => reviewsStore.loading);
const error = computed(() => reviewsStore.error);

// Computed URLs
const formattedAddress = computed(() => {
  return showroomAddress.value || mainStore.site?.address || '';
});

const directionsUrl = computed(() => {
  if (mapDirections.value) {
    return mapDirections.value;
  }
  if (formattedAddress.value) {
    return `https://www.google.com/maps/dir//${encodeURIComponent(siteName.value + ' ' + formattedAddress.value)}?hl=en`;
  }
  return '#';
});

const mapUrl = computed(() => {
  // Use official Google Maps embed URL from site config (preferred - no API restrictions)
  if (mainStore.site?.map_embed) {
    return mainStore.site.map_embed;
  }
  // Fallback to constructing URL from address
  if (formattedAddress.value) {
    return `https://www.google.com/maps/embed/v1/place?key=&q=${encodeURIComponent(siteName.value + ' ' + formattedAddress.value)}`;
  }
  return '';
});

const hasData = computed(() => {
  if (error.value) return false;
  if (loading.value) return true;
  return siteName.value && (formattedAddress.value || rating.value > 0);
});

// Helper functions
const getInitials = (name: string) => {
  if (!name || typeof name !== 'string') return '?';
  const parts = name.trim().split(/\s+/).filter(n => n.length > 0);
  if (parts.length === 0) return '?';
  return parts
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const truncateText = (text: string, maxLength: number) => {
  if (!text || typeof text !== 'string') return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim();
};

const formatHours = (hours: string | any) => {
  if (typeof hours === 'string') {
    return hours;
  }
  if (hours?.open && hours?.close) {
    return `${hours.open} – ${hours.close}`;
  }
  if (hours?.status) {
    return hours.status;
  }
  return 'Closed';
};

const isToday = (day: string | number) => {
  const today = new Date().getDay();
  const dayStr = String(day);
  const dayMap: Record<string, number> = {
    'Sunday': 0,
    'Monday': 1,
    'Tuesday': 2,
    'Wednesday': 3,
    'Thursday': 4,
    'Friday': 5,
    'Saturday': 6,
  };
  return dayMap[dayStr] === today;
};

const fetchReviewsIfNeeded = async () => {
  if (!reviewsStore.reviews?.length && !reviewsStore.loading) {
    await reviewsStore.fetchGoogleReviews();
  }
};

watch(
  () => props.shouldFetch,
  (shouldFetch) => {
    if (!shouldFetch) return;
    void fetchReviewsIfNeeded();
  },
  { immediate: true }
);
</script>

<style scoped>
/* Star Rating Styles */
.stars-rating {
  display: inline-block;
  position: relative;
  font-size: 1.125rem;
  line-height: 1;
}

.stars-inner {
  position: absolute;
  top: 0;
  left: 0;
  white-space: nowrap;
  overflow: hidden;
}

.stars-inner::before {
  content: "★★★★★";
  color: #fbbf24;
}

.stars-rating::before {
  content: "★★★★★";
  color: #e5e7eb;
}
</style>
