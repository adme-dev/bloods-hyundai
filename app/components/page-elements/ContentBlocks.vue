<template>
  <div v-if="templates" class="content-blocks">
    <!-- Service Form -->
    <LazyServiceForm v-if="templates === 'service_form'" />
    
    <!-- Contact Form -->
    <LazyContactForm v-else-if="templates === 'contact_form'" />
    
    <!-- Finance Form -->
    <LazyFinanceForm v-else-if="templates === 'finance_form'" />
    
    <!-- Parts Form -->
    <LazyPartsForm v-else-if="templates === 'parts_form'" />
    
    <!-- Fleet Form -->
    <LazyFleetForm v-else-if="templates === 'fleet_form'" />
    
    <!-- Default: render as raw HTML -->
    <div v-else-if="typeof templates === 'string'" v-html="templates"></div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  templates?: string | object;
}

defineProps<Props>();
</script>








