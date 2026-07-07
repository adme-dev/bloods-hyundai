<template>
  <!-- Fixed mobile quick actions - hidden on pages with their own mobile CTA -->
  <div
    v-if="showQuickActions"
    class="mobile-quick-links uk-hidden@m"
    :class="{ 'is-hidden': !isActionBarVisible }"
  >
    <NuxtLink to="/car-sales" class="quick-link-button quick-link-button--secondary" aria-label="Search inventory">
      <svg class="quick-link-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-4.35-4.35m1.1-5.15a6.25 6.25 0 11-12.5 0 6.25 6.25 0 0112.5 0z" />
      </svg>
      <span>Stock</span>
    </NuxtLink>
    <NuxtLink to="/service-booking" class="quick-link-button quick-link-button--secondary" aria-label="Book a service">
      <svg class="quick-link-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
      <span>Service</span>
    </NuxtLink>
    <a :href="`tel:${phone}`" class="quick-link-button quick-link-button--call" :aria-label="`Call ${siteName}`">
      <span uk-icon="icon: receiver; ratio: 1.2" aria-hidden="true"></span>
      <span>Call</span>
    </a>
  </div>
</template>

<script setup lang="ts">
const route = useRoute();
const mainStore = useMainStore();
const isActionBarVisible = useMobileActionBarVisibility();
const { siteName } = useSiteIdentity();

const phone = computed(() => {
  const sitePhone = mainStore.site?.phone;
  return sitePhone ? sitePhone.replace(/\s/g, '') : '';
});

// Hide on pages that have their own mobile CTA bar
const showQuickActions = computed(() => {
  const routeName = route.name as string;
  // Hide on vehicle-for-sale pages (they have their own enquire button)
  if (routeName?.startsWith('vehicle-for-sale')) return false;
  // Hide on calculator pages (they have their own price footer with CTA buttons)
  if (routeName?.startsWith('calculator')) return false;
  return true;
});
</script>

<style scoped>
.mobile-quick-links {
  position: fixed;
  right: 25vw;
  bottom: 0;
  left: 0;
  z-index: 940;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  width: 75vw;
  height: calc(64px + env(safe-area-inset-bottom));
  max-width: none;
  background: #002c5f;
  box-shadow: 0 -8px 24px rgba(0, 30, 80, 0.22);
  transform: translateY(0);
  transition: transform 220ms ease;
  will-change: transform;
}

.mobile-quick-links.is-hidden {
  pointer-events: none;
  transform: translateY(100%);
}

.quick-link-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  height: 100%;
  min-width: 0;
  padding: 8px 4px calc(8px + env(safe-area-inset-bottom));
  background: #002c5f;
  color: #fff !important;
  text-decoration: none;
  border-right: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 0;
  box-shadow: none;
  font-weight: 600;
  font-size: 0.72rem;
  line-height: 1;
  white-space: nowrap;
  transition: all 0.2s;

  &:hover {
    background: var(--color-primary);
    color: white;
  }
}

.quick-link-button span,
.quick-link-button svg {
  color: inherit !important;
}

.quick-link-button--secondary {
  background: #002c5f;
}

.quick-link-button--call {
  border-right: 0;
}

.quick-link-icon {
  width: 21px;
  height: 21px;
  flex: 0 0 auto;
}

@media (max-width: 359px) {
  .quick-link-button {
    font-size: 0.66rem;
  }

  .quick-link-icon {
    width: 19px;
    height: 19px;
  }
}
</style>


