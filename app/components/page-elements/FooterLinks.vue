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
            <img
              src="/assets/logos/logo-white-sm.svg"
              width="80"
              height="42"
              class="h-10 w-auto drop-shadow"
              loading="lazy"
              :alt="siteName"
            />
          </div>

          <!-- Footer links -->
          <div class="mt-10 grid gap-8 md:grid-cols-3">
            <!-- Mobile vehicle accordion -->
            <details class="footer-accordion border-b border-white/10 py-3 md:hidden">
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

            <!-- Sections - Accordion on mobile, grid on desktop -->
            <template v-for="(section, index) in footerLinks" :key="index">
              <!-- Mobile: Accordion -->
              <details class="footer-accordion border-b border-white/10 py-3 md:hidden">
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
                    class="text-sm text-white hover:text-white"
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

                <div v-if="index === 2 && social" class="pt-4">
                  <div class="text-base font-semibold">Connect with us.</div>
                  <div class="mt-2 flex flex-wrap gap-2">
                    <a
                      v-for="(url, platform) in social"
                      :key="platform"
                      class="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-primary"
                      target="_blank"
                      rel="noreferrer"
                      :href="url"
                    >
                      <span class="text-xs capitalize">{{ platform }}</span>
                    </a>
                  </div>
                </div>
              </details>

              <!-- Desktop: Static display -->
              <div class="hidden md:block space-y-3">
                <div class="text-base font-semibold">{{ section.heading }}</div>
                <div class="space-y-2">
                  <div
                    v-for="link in section.links"
                    :key="link.url"
                    class="text-sm text-white hover:text-white"
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

                <div v-if="index === 2 && social" class="pt-2">
                  <div class="text-base font-semibold">Connect with us.</div>
                  <div class="mt-2 flex flex-wrap gap-2">
                    <a
                      v-for="(url, platform) in social"
                      :key="platform"
                      class="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-primary"
                      target="_blank"
                      rel="noreferrer"
                      :href="url"
                    >
                      <span class="text-xs capitalize">{{ platform }}</span>
                    </a>
                  </div>
                </div>
              </div>
            </template>
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

// Computed values from store
const siteName = computed(() => mainStore.site?.name || 'Sale Hyundai');
const showroomAddress = computed(() => mainStore.site?.showroom_address || '');
const phone = computed(() => mainStore.site?.phone || '');
const phoneFormatted = computed(() => phone.value.replace(/[^0-9]/g, ''));
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

// Vehicle categories
const vehicles = computed(() => mainStore.models || []);

const vehicleCategories = computed(() => {
  const categories = new Set<string>();
  vehicles.value.forEach((v: any) => {
    if (v.category) categories.add(v.category);
  });
  return Array.from(categories);
});

const getVehiclesByCategory = (category: string) => {
  return vehicles.value.filter((v: any) => v.category === category);
};

// Helper
const isLinkExternal = (url: string) => {
  return /^(http|https):\/\//.test(url);
};
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
</style>






