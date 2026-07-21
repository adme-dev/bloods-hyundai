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
  <header
    data-slot="admin-page-header"
    class="flex flex-col items-start justify-between gap-4 min-[701px]:flex-row min-[701px]:items-end min-[701px]:gap-6"
  >
    <div class="min-w-0">
      <p data-slot="admin-page-eyebrow" class="mb-[7px] text-[11px] font-bold uppercase leading-[1.2] tracking-[.09em] text-muted-foreground">{{ eyebrow }}</p>
      <h1 data-slot="admin-page-title" class="m-0 text-balance text-[26px] font-bold leading-[1.15] tracking-[-.01em] text-foreground min-[701px]:text-[29px]">{{ title }}</h1>
      <p v-if="description" data-slot="admin-page-description" class="mt-[5px] text-[13px] text-muted-foreground">{{ description }}</p>
      <slot />
    </div>
    <div
      v-if="$slots.actions"
      data-slot="admin-page-actions"
      class="flex w-full flex-wrap items-center justify-start gap-2 min-[701px]:w-auto min-[701px]:justify-end"
    >
      <slot name="actions" />
    </div>
  </header>
</template>
