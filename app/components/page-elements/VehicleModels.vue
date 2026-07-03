<template>
  <!-- Off-canvas models menu - parent wraps in ClientOnly to prevent hydration mismatch from UIkit -->
  <div
    id="offcanvas-models"
    hidden
    aria-hidden="true"
    uk-offcanvas="flip: true; overlay: true; mode: slide"
  >
    <div class="uk-offcanvas-bar uk-padding-remove uk-background-secondary" style="width: 100%; max-width: 100%;">
      <LazyNavModels />
    </div>
  </div>
</template>

<script setup lang="ts">
// This component wraps the NavModels in an off-canvas modal
</script>

<style>
#offcanvas-models .uk-offcanvas-bar {
  width: 100% !important;
  max-width: 100% !important;
}

#offcanvas-models.uk-open {
  display: block;
}
</style>








