<template>
  <div class="compare-page">
    <!-- This page redirects to /favorites -->
    <div class="uk-section uk-text-center">
      <div class="uk-container uk-container-small">
        <p class="uk-text-muted">Redirecting to saved vehicles...</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Redirect to new favorites page
const router = useRouter();

onMounted(() => {
  router.replace('/favorites');
});
</script>








