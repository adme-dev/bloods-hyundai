<template>
  <div class="model-selector">
    <!-- Search Input -->
    <div class="search-wrapper">
      <div class="search-input-container">
        <span class="search-icon">
          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </span>
        <input
          v-model="searchQuery"
          type="search"
          class="search-input"
          placeholder="Search models (e.g., Tucson, i30, IONIQ)"
        >
      </div>
    </div>

    <!-- Models Grid - OEM Style -->
    <div class="models-grid">
      <button
        v-for="model in filteredModels"
        :key="model.slug"
        class="model-card"
        :class="{ 'selected': selectedModel?.slug === model.slug }"
        @click="$emit('select', model)"
      >
        <!-- Model Image -->
        <div class="model-image-wrapper">
          <img
            :src="model.image || '/images/placeholder-car.png'"
            :alt="model.name"
            class="model-image"
            loading="lazy"
          >
        </div>

        <!-- Model Name -->
        <h3 class="model-name">{{ model.name }}</h3>
      </button>
    </div>

    <!-- No Results -->
    <div v-if="filteredModels.length === 0" class="flex flex-col items-center justify-center py-12 text-center">
      <div class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
        <svg class="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <h3 class="text-lg font-semibold text-slate-900">No models found</h3>
      <p class="text-sm text-slate-500">Try a different search term or category</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { HyundaiModel } from '~/stores/accessories';

interface Props {
  models: HyundaiModel[];
  selectedModel?: HyundaiModel | null;
}

const props = defineProps<Props>();

defineEmits<{
  (e: 'select', model: HyundaiModel): void;
}>();

const searchQuery = ref('');
const selectedCategory = ref<string | null>(null);

const categories = computed(() => {
  const cats = new Set(props.models.map(m => m.category));
  return Array.from(cats);
});

const filteredModels = computed(() => {
  let result = [...props.models];

  // Filter by category
  if (selectedCategory.value) {
    result = result.filter(m => m.category === selectedCategory.value);
  }

  // Filter by search
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(m => 
      m.name.toLowerCase().includes(query) ||
      m.slug.toLowerCase().includes(query) ||
      m.category.toLowerCase().includes(query)
    );
  }

  return result;
});

const getCategoryClass = (category: string): string => {
  const classes: Record<string, string> = {
    'SUV': 'bg-blue-100 text-blue-700',
    'Electric': 'bg-green-100 text-green-700',
    'Hatch': 'bg-purple-100 text-purple-700',
    'Sedan': 'bg-indigo-100 text-indigo-700',
    'Performance': 'bg-red-100 text-red-700',
    'Van': 'bg-orange-100 text-orange-700',
    'Hybrid': 'bg-teal-100 text-teal-700',
  };
  return classes[category] || 'bg-slate-100 text-slate-700';
};
</script>

<style scoped>
/* OEM Style Model Selector */

.model-selector {
  font-family: 'HyundaiSansHead', 'Helvetica Neue', Arial, sans-serif;
}

.search-wrapper {
  margin-bottom: 30px;
}

.search-input-container {
  position: relative;
  max-width: 500px;
  margin: 0 auto;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 12px 16px 12px 40px;
  font-size: 14px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  outline: none;
  transition: all 0.2s;
}

.search-input:focus {
  border-color: #002c5f;
  box-shadow: 0 0 0 3px rgba(0, 44, 95, 0.1);
}

.models-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
}

.model-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
}

.model-card:hover {
  border-color: #002c5f;
  box-shadow: 0 2px 8px rgba(0, 44, 95, 0.1);
}

.model-card.selected {
  border-color: #002c5f;
  border-width: 2px;
  background: #f0f4f8;
}

.model-image-wrapper {
  width: 100%;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  overflow: hidden;
}

.model-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.model-placeholder {
  font-size: 48px;
  opacity: 0.5;
}

.model-name {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
  line-height: 1.3;
}

.model-card.selected .model-name {
  color: #002c5f;
}

@media (max-width: 768px) {
  .models-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 16px;
  }

  .model-image-wrapper {
    height: 100px;
  }
}
</style>

