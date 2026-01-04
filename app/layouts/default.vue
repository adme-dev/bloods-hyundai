<template>
  <div>
    <!-- Header ticker with reserved space to prevent CLS -->
    <ClientOnly>
      <LazyHeaderTicker />
      <template #fallback>
        <div class="header-ticker-placeholder" aria-hidden="true"></div>
      </template>
    </ClientOnly>

    <div class="relative">
      <header>
        <LazyPrimaryNav />
      </header>
    </div>

    <main class="main-body">
      <slot />
    </main>

    <footer>
      <LazyFooterLinks />
      <ClientOnly>
        <LazyVehicleModels />
      </ClientOnly>
      <LazyGlobalSearch />
      <LazyMobileSiteMenu />
    </footer>

    <LazyCallQuickLinks />
  </div>
</template>

<script setup lang="ts">
// Layout is mostly structural - components handle their own logic
// Components are auto-imported and lazy-loaded with Lazy prefix
</script>

<style lang="scss" scoped>
.mobile-nav .uk-navbar-dropdown-dropbar.uk-open {
  width: 100%;
  height: 100vh;
  left: 0 !important;
}

// CLS prevention: Reserve space for header ticker during SSR
.header-ticker-placeholder {
  height: 42px; // Match HeaderTicker height (padding: 10px + font-size + line-height)
  background-color: #001E50; // Default Hyundai navy

  @media (max-width: 640px) {
    height: 36px; // Smaller on mobile (padding: 8px)
  }
}
</style>








