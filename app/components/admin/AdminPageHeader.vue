<script setup lang="ts">
withDefaults(defineProps<{
  eyebrow?: string
  title: string
  description?: string
}>(), {
  eyebrow: 'Bloods Hyundai · Admin',
  description: '',
})
</script>

<template>
  <header data-slot="admin-page-header" class="admin-page-header">
    <div class="min-w-0">
      <p data-slot="admin-page-eyebrow" class="admin-page-header__eyebrow">{{ eyebrow }}</p>
      <h1 data-slot="admin-page-title" class="admin-page-header__title">{{ title }}</h1>
      <p v-if="description" data-slot="admin-page-description" class="admin-page-header__description">{{ description }}</p>
      <slot />
    </div>
    <div v-if="$slots.actions" data-slot="admin-page-actions" class="admin-page-header__actions">
      <slot name="actions" />
    </div>
  </header>
</template>

<style scoped>
.admin-page-header { display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; }
.admin-page-header__eyebrow { margin: 0 0 7px; color: var(--admin-muted); font-size: 11px; font-weight: 700; letter-spacing: .09em; line-height: 1.2; text-transform: uppercase; }
.admin-page-header__title { margin: 0; color: var(--admin-ink); font-size: 29px; font-weight: 750; letter-spacing: -.01em; line-height: 1.15; text-wrap: balance; }
.admin-page-header__description { margin: 5px 0 0; color: var(--admin-ink-2); font-size: 13px; }
.admin-page-header__actions { display: flex; align-items: center; justify-content: flex-end; gap: 8px; flex-wrap: wrap; }
@media (max-width: 700px) {
  .admin-page-header { align-items: flex-start; flex-direction: column; gap: 16px; }
  .admin-page-header__title { font-size: 26px; }
  .admin-page-header__actions { justify-content: flex-start; width: 100%; }
}
</style>
