<template>
  <div>
    <HeaderTicker />

    <div class="relative">
      <header class="relative z-[60]">
        <PrimaryNav />
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

</style>





