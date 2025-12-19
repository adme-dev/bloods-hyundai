<template>
  <footer class="footer-wrap bg-slate-900 text-slate-100" role="contentinfo">
    <ClientOnly>
      <template #fallback>
        <div class="bg-white py-6"></div>
      </template>

      <!-- Footer Promotional Blocks -->
      <LazyFooterBlocks />

      <!-- Google Reviews -->
      <div class="bg-white py-6">
        <LazyGoogleReviews />
      </div>

      <div class="py-10">
        <div class="mx-auto w-full max-w-6xl px-4">
          <!-- Vehicle categories (desktop) -->
          <div class="hidden md:block">
            <div class="text-lg font-semibold">Choose your Hyundai</div>
            <div class="mt-6 grid grid-cols-3 gap-6 lg:grid-cols-4">
              <div
                v-for="(category, index) in vehicleCategories"
                :key="index"
                class="space-y-2"
              >
                <div class="text-sm font-semibold uppercase tracking-wide text-slate-200">
                  {{ category }}
                </div>
                <div
                  v-for="item in getVehiclesByCategory(category)"
                  :key="item.slug"
                  class="text-sm text-white hover:text-white"
                >
                  <NuxtLink :to="'/vehicle/' + item.slug" :title="item.name">
                    {{ item.name }}
                  </NuxtLink>
                </div>
              </div>
            </div>
          </div>

          <!-- Dealer info -->
          <div class="mt-10 flex flex-col items-start gap-6 border-t border-white/10 pt-6 md:flex-row md:items-center md:justify-between">
            <div class="space-y-1">
              <div class="text-lg font-semibold">{{ siteName }}</div>
              <div class="text-sm text-slate-300">{{ showroomAddress }}</div>
              <a :href="`tel:${phoneFormatted}`" class="text-sm text-primary-200 hover:text-white">
                Sales / Service / Parts: <b>{{ phone }}</b>
              </a>
            </div>
            <NuxtImg
              src="/assets/logos/logo-white-sm.svg"
              width="80"
              height="42"
              class="h-10 w-auto drop-shadow"
              loading="lazy"
              :alt="siteName"
            />
          </div>

          <!-- Mobile: Footer accordions -->
          <div class="mt-10 md:hidden space-y-0">
            <!-- Mobile vehicle accordion -->
            <details class="footer-accordion border-b border-white/10 py-3">
              <summary class="flex cursor-pointer items-center justify-between text-base font-semibold">
                Choose your Hyundai
                <span class="accordion-icon">
                  <svg class="icon-plus" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  <svg class="icon-minus" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                </span>
              </summary>
              <div class="mt-4 space-y-6">
                <div
                  v-for="(category, index) in vehicleCategories"
                  :key="index"
                  class="space-y-2"
                >
                  <div class="text-sm font-semibold uppercase tracking-wide text-slate-200">
                    {{ category }}
                  </div>
                  <div
                    v-for="item in getVehiclesByCategory(category)"
                    :key="item.slug"
                    class="text-sm text-white hover:text-white"
                  >
                    <NuxtLink :to="'/vehicle/' + item.slug" :title="item.name">
                      {{ item.name }}
                    </NuxtLink>
                  </div>
                </div>
              </div>
            </details>

            <!-- Dynamic Footer Link Sections - Mobile Accordions -->
            <template v-for="(section, sectionIndex) in footerLinks" :key="'mobile-' + sectionIndex">
              <details class="footer-accordion border-b border-white/10 py-3">
                <summary class="flex cursor-pointer items-center justify-between text-base font-semibold">
                  {{ section.heading }}
                  <span class="accordion-icon">
                    <svg class="icon-plus" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <line x1="12" y1="5" x2="12" y2="19"/>
                      <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    <svg class="icon-minus" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                  </span>
                </summary>
                <div class="mt-4 space-y-2">
                  <div
                    v-for="link in section.links"
                    :key="link.url"
                    class="text-sm text-slate-300 hover:text-white"
                  >
                    <a
                      v-if="isLinkExternal(link.url)"
                      :href="link.url"
                      rel="nofollow"
                      target="_blank"
                    >
                      {{ link.title }}
                    </a>
                    <NuxtLink
                      v-else
                      :to="link.url"
                      :title="link.title"
                    >
                      {{ link.title }}
                    </NuxtLink>
                  </div>
                </div>
              </details>
            </template>

            <!-- Mobile: Google Rating Section -->
            <div class="py-6 space-y-3">
              <div class="flex items-center gap-3">
                <svg viewBox="0 0 512 512" class="w-10 h-10 flex-shrink-0">
                  <g fill="none" fill-rule="evenodd">
                    <path d="M482.56 261.36c0-16.73-1.5-32.83-4.29-48.27H256v91.29h127.01c-5.47 29.5-22.1 54.49-47.09 71.23v59.21h76.27c44.63-41.09 70.37-101.59 70.37-173.46z" fill="#4285f4"/>
                    <path d="M256 492c63.72 0 117.14-21.13 156.19-57.18l-76.27-59.21c-21.13 14.16-48.17 22.53-79.92 22.53-61.47 0-113.49-41.51-132.05-97.3H45.1v61.15c38.83 77.13 118.64 130.01 210.9 130.01z" fill="#34a853"/>
                    <path d="M123.95 300.84c-4.72-14.16-7.4-29.29-7.4-44.84s2.68-30.68 7.4-44.84V150.01H45.1C29.12 181.87 20 217.92 20 256c0 38.08 9.12 74.13 25.1 105.99l78.85-61.15z" fill="#fbbc05"/>
                    <path d="M256 113.86c34.65 0 65.76 11.91 90.22 35.29l67.69-67.69C373.03 43.39 319.61 20 256 20c-92.25 0-172.07 52.89-210.9 130.01l78.85 61.15c18.56-55.78 70.59-97.3 132.05-97.3z" fill="#ea4335"/>
                  </g>
                </svg>
                <div>
                  <div class="text-sm text-slate-300">Google Rating</div>
                  <div class="flex items-center gap-1.5">
                    <span class="text-xl font-semibold text-white">{{ rating }}</span>
                    <div class="footer-stars-rating">
                      <div class="footer-stars-inner" :style="{ width: (rating / 5) * 100 + '%' }"></div>
                    </div>
                  </div>
                  <div class="text-xs text-slate-400" v-if="totalReviews > 0">
                    Based on {{ totalReviews }} reviews
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Desktop: Multi-column flex layout - justified across full width -->
          <div class="mt-10 hidden md:flex md:justify-between md:gap-6 lg:gap-8">
            <!-- Footer Link Sections from Site Config - Each in its own column -->
            <div v-for="(section, sectionIndex) in footerLinks" :key="'desktop-' + sectionIndex" class="space-y-3 flex-1 min-w-0">
              <div class="text-base font-semibold">{{ section.heading }}</div>
              <div class="space-y-2">
                <div
                  v-for="link in section.links"
                  :key="link.url"
                  class="text-sm text-slate-300 hover:text-white"
                >
                  <a
                    v-if="isLinkExternal(link.url)"
                    :href="link.url"
                    rel="nofollow"
                    target="_blank"
                  >
                    {{ link.title }}
                  </a>
                  <NuxtLink
                    v-else
                    :to="link.url"
                    :title="link.title"
                  >
                    {{ link.title }}
                  </NuxtLink>
                </div>
              </div>
              
              <!-- Add Connect with us and Google Rating after About us section (last section) -->
              <template v-if="sectionIndex === footerLinks.length - 1">
                <!-- Connect with us -->
                <div v-if="social" class="pt-4 space-y-3">
                  <div class="text-base font-semibold">Connect with us.</div>
                  <div class="flex flex-wrap gap-2">
                    <a
                      v-for="(url, platform) in social"
                      :key="platform"
                      class="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-primary transition-colors"
                      target="_blank"
                      rel="noreferrer"
                      :href="url"
                      :aria-label="`Visit our ${platform} page`"
                    >
                      <svg v-if="platform === 'facebook'" class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                      <svg v-else-if="platform === 'instagram'" class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                      </svg>
                      <span v-else class="text-xs capitalize">{{ String(platform).charAt(0) }}</span>
                    </a>
                  </div>
                </div>

                <!-- Google Rating Section -->
                <div class="pt-4 space-y-3">
                  <div class="flex items-center gap-3">
                    <svg viewBox="0 0 512 512" class="w-10 h-10 flex-shrink-0">
                      <g fill="none" fill-rule="evenodd">
                        <path d="M482.56 261.36c0-16.73-1.5-32.83-4.29-48.27H256v91.29h127.01c-5.47 29.5-22.1 54.49-47.09 71.23v59.21h76.27c44.63-41.09 70.37-101.59 70.37-173.46z" fill="#4285f4"/>
                        <path d="M256 492c63.72 0 117.14-21.13 156.19-57.18l-76.27-59.21c-21.13 14.16-48.17 22.53-79.92 22.53-61.47 0-113.49-41.51-132.05-97.3H45.1v61.15c38.83 77.13 118.64 130.01 210.9 130.01z" fill="#34a853"/>
                        <path d="M123.95 300.84c-4.72-14.16-7.4-29.29-7.4-44.84s2.68-30.68 7.4-44.84V150.01H45.1C29.12 181.87 20 217.92 20 256c0 38.08 9.12 74.13 25.1 105.99l78.85-61.15z" fill="#fbbc05"/>
                        <path d="M256 113.86c34.65 0 65.76 11.91 90.22 35.29l67.69-67.69C373.03 43.39 319.61 20 256 20c-92.25 0-172.07 52.89-210.9 130.01l78.85 61.15c18.56-55.78 70.59-97.3 132.05-97.3z" fill="#ea4335"/>
                      </g>
                    </svg>
                    <div>
                      <div class="text-sm text-slate-300">Google Rating</div>
                      <div class="flex items-center gap-1.5">
                        <span class="text-xl font-semibold text-white">{{ rating }}</span>
                        <div class="footer-stars-rating">
                          <div class="footer-stars-inner" :style="{ width: (rating / 5) * 100 + '%' }"></div>
                        </div>
                      </div>
                      <div class="text-xs text-slate-400" v-if="totalReviews > 0">
                        Based on {{ totalReviews }} reviews
                      </div>
                    </div>
                  </div>
                  <a 
                    v-if="placeId" 
                    :href="`https://search.google.com/local/writereview?placeid=${placeId}`"
                    target="_blank"
                    rel="noreferrer"
                    class="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white transition-colors"
                  >
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z"/>
                    </svg>
                    <span class="font-semibold">We'd Love To Hear Your Feedback!</span>
                  </a>
                </div>
              </template>
            </div>

            <!-- Trading Hours Column -->
            <div class="space-y-6 flex-shrink-0">
              <!-- SALES Section -->
              <div class="space-y-3">
                <div class="text-base font-bold uppercase tracking-wide">Sales</div>
                <div class="space-y-1">
                  <a :href="directionsUrl" target="_blank" rel="noreferrer" class="text-sm text-slate-300 hover:text-white block">
                    Get Directions
                  </a>
                  <a :href="`tel:${salesPhoneFormatted}`" class="text-sm text-slate-300 hover:text-white block">
                    {{ salesPhone }}
                  </a>
                </div>
                <!-- Sales Trading Hours -->
                <div class="pt-2">
                  <div class="text-sm font-semibold text-slate-200 mb-2">Sales Trading Hours</div>
                  <div class="space-y-0.5 text-xs text-slate-400">
                    <div>Monday – Friday: {{ formatHoursRange(salesHours, 'weekday') }}</div>
                    <div>Saturday: {{ formatHoursRange(salesHours, 'Saturday') }}</div>
                    <div>Sunday: {{ formatHoursRange(salesHours, 'Sunday') }}</div>
                  </div>
                </div>
              </div>

              <!-- SERVICE & PARTS Section -->
              <div class="space-y-3">
                <div class="text-base font-bold uppercase tracking-wide">Service & Parts</div>
                <div class="space-y-1">
                  <a :href="directionsUrl" target="_blank" rel="noreferrer" class="text-sm text-slate-300 hover:text-white block">
                    Get Directions
                  </a>
                  <a :href="`tel:${servicePhoneFormatted}`" class="text-sm text-slate-300 hover:text-white block">
                    {{ servicePhone }}
                  </a>
                </div>
                <!-- Service Trading Hours -->
                <div class="pt-2">
                  <div class="text-sm font-semibold text-slate-200 mb-2">Service Trading Hours</div>
                  <div class="space-y-0.5 text-xs text-slate-400">
                    <div>Monday – Friday: {{ formatHoursRange(serviceHours, 'weekday') }}</div>
                    <div>Saturday: {{ formatHoursRange(serviceHours, 'Saturday') }}</div>
                    <div>Sunday: {{ formatHoursRange(serviceHours, 'Sunday') }}</div>
                  </div>
                </div>
                <!-- Parts Trading Hours -->
                <div class="pt-2">
                  <div class="text-sm font-semibold text-slate-200 mb-2">Parts Trading Hours</div>
                  <div class="space-y-0.5 text-xs text-slate-400">
                    <div>Monday – Friday: {{ formatHoursRange(partsHours, 'weekday') }}</div>
                    <div>Saturday: {{ formatHoursRange(partsHours, 'Saturday') }}</div>
                    <div>Sunday: {{ formatHoursRange(partsHours, 'Sunday') }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Copyright -->
          <div class="mt-10 border-t border-white/10 pt-6 text-center text-sm text-slate-400 space-y-2">
            <p>
              © {{ currentYear }} {{ siteName }}. All rights reserved.
              <NuxtLink to="/privacy-policy" class="text-white hover:text-white">Privacy Policy</NuxtLink>
              |
              <NuxtLink to="/terms-conditions" class="text-white hover:text-white">Terms & Conditions</NuxtLink>
            </p>
            <p class="text-xs text-slate-500">
              Recommended driveaway prices shown are based on postcode 3850 and are subject to change.
              Please contact dealer for final pricing.
            </p>
          </div>
        </div>
      </div>
    </ClientOnly>
  </footer>
</template>

<script setup lang="ts">
const mainStore = useMainStore();
const reviewsStore = useReviewsStore();

// Computed values from store
const siteName = computed(() => mainStore.site?.name || 'Sale Hyundai');
const showroomAddress = computed(() => mainStore.site?.showroom_address || '');
const phone = computed(() => mainStore.site?.phone || '');
const phoneFormatted = computed(() => phone.value.replace(/[^0-9]/g, ''));
const placeId = computed(() => mainStore.site?.place_id || '');
const mapDirections = computed(() => mainStore.site?.map_directions || '');

// Department phone numbers (with fallbacks)
const salesPhone = computed(() => mainStore.site?.sales_phone || mainStore.site?.phone || '(03) 5221 7233');
const salesPhoneFormatted = computed(() => salesPhone.value.replace(/[^0-9]/g, ''));
const servicePhone = computed(() => mainStore.site?.service_phone || mainStore.site?.phone || '(03) 5221 0751');
const servicePhoneFormatted = computed(() => servicePhone.value.replace(/[^0-9]/g, ''));

// Directions URL
const directionsUrl = computed(() => {
  if (mapDirections.value) {
    return mapDirections.value;
  }
  const address = showroomAddress.value || mainStore.site?.address || '';
  if (address) {
    return `https://www.google.com/maps/dir//${encodeURIComponent(siteName.value + ' ' + address)}?hl=en`;
  }
  return '#';
});

// Reviews data
const rating = computed(() => reviewsStore.rating || 3.9);
const totalReviews = computed(() => reviewsStore.totalReviews || 320);

// Social links - handle both object and array formats
const social = computed(() => {
  const socialData = mainStore.site?.social;
  // If it's an empty array or falsy, return null so it won't render
  if (!socialData || (Array.isArray(socialData) && socialData.length === 0)) {
    return null;
  }
  return socialData;
});

const currentYear = new Date().getFullYear();

// Footer links from site config (sitelinks.footer) or defaults
const footerLinks = computed(() => {
  return mainStore.site?.sitelinks?.footer || [
    {
      heading: 'Shop',
      links: [
        { title: 'New Cars', url: '/build-and-price' },
        { title: 'Used Cars', url: '/car-sales' },
        { title: 'Special Offers', url: '/special-offers' },
        { title: 'Sell Your Car', url: '/sell-my-car' },
      ],
    },
    {
      heading: 'Services',
      links: [
        { title: 'Book a Service', url: '/service' },
        { title: 'Parts', url: '/parts' },
        { title: 'Finance', url: '/finance' },
        { title: 'Insurance', url: '/insurance' },
      ],
    },
    {
      heading: 'About',
      links: [
        { title: 'Contact Us', url: '/contact' },
        { title: 'About Us', url: '/about' },
        { title: 'Careers', url: '/careers' },
        { title: 'Site Map', url: '/site-map' },
      ],
    },
  ];
});

// Default hours structure
const defaultHours = {
  'Monday': '8:30 am – 5:30 pm',
  'Tuesday': '8:30 am – 5:30 pm',
  'Wednesday': '8:30 am – 5:30 pm',
  'Thursday': '8:30 am – 5:30 pm',
  'Friday': '8:30 am – 5:30 pm',
  'Saturday': '8:30 am – 5:00 pm',
  'Sunday': 'Closed',
};

// Trading hours per department
const salesHours = computed(() => {
  const hours = mainStore.site?.trading_hours;
  if (!hours) return defaultHours;
  
  if (typeof hours === 'object' && !Array.isArray(hours)) {
    if (hours.sales?.hours) return hours.sales.hours;
    if (hours.Monday || hours.monday) return hours;
  }
  
  return defaultHours;
});

const serviceHours = computed(() => {
  const hours = mainStore.site?.trading_hours;
  if (!hours) return { ...defaultHours, 'Monday': '7:45 am – 5:15 pm', 'Tuesday': '7:45 am – 5:15 pm', 'Wednesday': '7:45 am – 5:15 pm', 'Thursday': '7:45 am – 5:15 pm', 'Friday': '7:45 am – 5:15 pm', 'Saturday': 'Closed' };
  
  if (typeof hours === 'object' && !Array.isArray(hours)) {
    if (hours.service?.hours) return hours.service.hours;
    if (hours.sales?.hours) return hours.sales.hours;
    if (hours.Monday || hours.monday) return hours;
  }
  
  return { ...defaultHours, 'Monday': '7:45 am – 5:15 pm', 'Tuesday': '7:45 am – 5:15 pm', 'Wednesday': '7:45 am – 5:15 pm', 'Thursday': '7:45 am – 5:15 pm', 'Friday': '7:45 am – 5:15 pm', 'Saturday': 'Closed' };
});

const partsHours = computed(() => {
  const hours = mainStore.site?.trading_hours;
  if (!hours) return { ...defaultHours, 'Monday': '7:45 am – 5:15 pm', 'Tuesday': '7:45 am – 5:15 pm', 'Wednesday': '7:45 am – 5:15 pm', 'Thursday': '7:45 am – 5:15 pm', 'Friday': '7:45 am – 5:15 pm', 'Saturday': 'Closed' };
  
  if (typeof hours === 'object' && !Array.isArray(hours)) {
    if (hours.parts?.hours) return hours.parts.hours;
    if (hours.service?.hours) return hours.service.hours;
    if (hours.sales?.hours) return hours.sales.hours;
    if (hours.Monday || hours.monday) return hours;
  }
  
  return { ...defaultHours, 'Monday': '7:45 am – 5:15 pm', 'Tuesday': '7:45 am – 5:15 pm', 'Wednesday': '7:45 am – 5:15 pm', 'Thursday': '7:45 am – 5:15 pm', 'Friday': '7:45 am – 5:15 pm', 'Saturday': 'Closed' };
});

// Format hours for display
const formatHoursRange = (hoursObj: Record<string, any>, dayType: string) => {
  if (dayType === 'weekday') {
    // Return Monday's hours as representative of weekdays
    const mondayHours = hoursObj['Monday'] || hoursObj['monday'];
    return formatHoursValue(mondayHours);
  }
  const hours = hoursObj[dayType] || hoursObj[dayType.toLowerCase()];
  return formatHoursValue(hours);
};

const formatHoursValue = (hours: string | any) => {
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

// Vehicle categories
const vehicles = computed(() => mainStore.models || []);

// Sort categories with "Coming Soon" always at the end
const vehicleCategories = computed(() => {
  const categories = new Set<string>();
  vehicles.value.forEach((v: any) => {
    if (v.category) categories.add(v.category);
  });
  
  const categoryOrder = ['Electric', 'Hybrid', 'SUVs and People Movers', 'Performance', 'Hatch & Sedans', 'Runout', 'Coming Soon'];
  return Array.from(categories).sort((a, b) => {
    const aIndex = categoryOrder.indexOf(a);
    const bIndex = categoryOrder.indexOf(b);
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
    if (aIndex !== -1) return a === 'Coming Soon' ? 1 : -1;
    if (bIndex !== -1) return b === 'Coming Soon' ? -1 : 1;
    return a.localeCompare(b);
  });
});

const getVehiclesByCategory = (category: string) => {
  return vehicles.value.filter((v: any) => v.category === category);
};

// Helper
const isLinkExternal = (url: string) => {
  return /^(http|https):\/\//.test(url);
};

// Fetch reviews if not already loaded
onMounted(async () => {
  if (!reviewsStore.reviews?.length && !reviewsStore.loading) {
    await reviewsStore.fetchGoogleReviews();
  }
});
</script>

<style scoped>
.drop-shadow {
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.25));
}

/* Accordion plus/minus icon toggle */
.footer-accordion .accordion-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  color: rgba(255, 255, 255, 0.6);
}

.footer-accordion .accordion-icon .icon-plus {
  display: block;
}

.footer-accordion .accordion-icon .icon-minus {
  display: none;
}

.footer-accordion[open] .accordion-icon .icon-plus {
  display: none;
}

.footer-accordion[open] .accordion-icon .icon-minus {
  display: block;
}

/* Remove default marker */
.footer-accordion summary {
  list-style: none;
}

.footer-accordion summary::-webkit-details-marker {
  display: none;
}

/* Footer Star Rating Styles */
.footer-stars-rating {
  display: inline-block;
  position: relative;
  font-size: 1rem;
  line-height: 1;
}

.footer-stars-inner {
  position: absolute;
  top: 0;
  left: 0;
  white-space: nowrap;
  overflow: hidden;
}

.footer-stars-inner::before {
  content: "★★★★★";
  color: #fbbf24;
}

.footer-stars-rating::before {
  content: "★★★★★";
  color: rgba(255, 255, 255, 0.3);
}
</style>







