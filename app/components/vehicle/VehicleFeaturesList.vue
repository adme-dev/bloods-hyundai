<template>
  <div v-if="hasFeatures" class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <h2 class="text-lg font-semibold text-slate-900 mb-4">Features & Equipment</h2>

    <!-- Feature Tabs -->
    <div class="flex gap-2 mb-4 overflow-x-auto pb-2 -mx-1 px-1">
      <button
        v-for="category in availableCategories"
        :key="category.key"
        class="flex-shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors"
        :class="activeCategory === category.key
          ? 'bg-primary text-white'
          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
        @click="activeCategory = category.key"
      >
        {{ category.icon }} {{ category.label }}
      </button>
    </div>

    <!-- Active Category Content -->
    <div v-if="activeFeatures" class="space-y-4">
      <!-- Highlights -->
      <div v-if="activeFeatures.highlights?.length" class="space-y-2">
        <h3 class="text-sm font-semibold text-slate-700">Key Highlights</h3>
        <div class="flex flex-wrap gap-2">
          <span
            v-for="highlight in activeFeatures.highlights"
            :key="highlight"
            class="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary"
          >
            <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
            {{ highlight }}
          </span>
        </div>
      </div>

      <!-- All Features -->
      <div v-if="activeFeatures.items?.length">
        <h3 v-if="activeFeatures.highlights?.length" class="text-sm font-semibold text-slate-700 mb-2">All Features</h3>
        <ul class="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
          <li
            v-for="item in activeFeatures.items"
            :key="item"
            class="flex items-start gap-2 text-sm text-slate-700"
          >
            <svg class="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
            {{ item }}
          </li>
        </ul>
      </div>

      <!-- Empty State -->
      <div v-if="!activeFeatures.items?.length && !activeFeatures.highlights?.length" class="text-center py-8 text-slate-500">
        <p>No {{ activeCategory }} features available</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { VehicleFeatures, FeatureCategory } from '~/composables/useVehicleEnrichment';

interface Props {
  features: VehicleFeatures;
}

const props = defineProps<Props>();

const categories = [
  { key: 'safety', label: 'Safety', icon: '🛡️' },
  { key: 'comfort', label: 'Comfort', icon: '🪑' },
  { key: 'technology', label: 'Technology', icon: '📱' },
  { key: 'performance', label: 'Performance', icon: '⚡' },
] as const;

type CategoryKey = typeof categories[number]['key'];

const activeCategory = ref<CategoryKey>('safety');

const hasFeatures = computed(() => {
  if (!props.features) return false;
  return availableCategories.value.length > 0;
});

const availableCategories = computed(() => {
  if (!props.features) return [];

  return categories.filter((cat) => {
    const feature = props.features[cat.key as keyof VehicleFeatures] as FeatureCategory | undefined;
    return feature && (feature.items?.length || feature.highlights?.length);
  });
});

const activeFeatures = computed<FeatureCategory | null>(() => {
  if (!props.features) return null;
  return props.features[activeCategory.value as keyof VehicleFeatures] as FeatureCategory || null;
});

// Set initial active category to first available
watch(availableCategories, (cats) => {
  if (cats.length > 0 && !cats.find(c => c.key === activeCategory.value)) {
    activeCategory.value = cats[0]!.key;
  }
}, { immediate: true });
</script>
