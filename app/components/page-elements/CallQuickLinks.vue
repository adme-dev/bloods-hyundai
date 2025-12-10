<template>
  <!-- Fixed call button (mobile only) -->
  <div class="call-quick-link uk-hidden@m">
    <a :href="`tel:${phone}`" class="call-button">
      <span uk-icon="icon: receiver; ratio: 1.2"></span>
      <span class="call-text">Call Now</span>
    </a>
  </div>
</template>

<script setup lang="ts">
const mainStore = useMainStore();

const phone = computed(() => {
  const sitePhone = mainStore.site?.phone;
  return sitePhone ? sitePhone.replace(/\s/g, '') : '';
});
</script>

<style scoped>
.call-quick-link {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 900;
}

.call-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: var(--color-primary);
  color: white;
  text-decoration: none;
  border-radius: 50px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
  font-weight: 600;
  font-size: 0.875rem;
  transition: all 0.2s;
  
  &:hover {
    background: var(--color-primary-dark);
    transform: scale(1.05);
  }
}

.call-text {
  display: none;
}

@media (min-width: 400px) {
  .call-text {
    display: inline;
  }
}
</style>





