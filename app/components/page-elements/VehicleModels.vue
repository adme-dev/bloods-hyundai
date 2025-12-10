<template>
  <!-- Off-canvas models menu -->
  <div id="offcanvas-models" uk-offcanvas="flip: true; overlay: true; mode: slide">
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

@media (min-width: 960px) {
  #offcanvas-models .uk-offcanvas-bar {
    width: 80% !important;
    max-width: 1400px !important;
  }
}
</style>





