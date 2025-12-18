<template>
  <div class="model-selector">
    <!-- Models Grid - Hyundai OEM Style -->
    <div class="models-grid">
      <button
        v-for="model in filteredModels"
        :key="model.slug"
        class="model-card"
        :class="{ 'selected': selectedModel?.slug === model.slug }"
        @click="$emit('select', model)"
      >
        <!-- Model Name at Top -->
        <h3 class="model-name">{{ model.name.toUpperCase() }}</h3>

        <!-- Model Image -->
        <div class="model-image-wrapper">
          <NuxtImg
            :src="model.image || '/images/placeholder-car.svg'"
            :alt="model.name"
            class="model-image"
            loading="lazy"
            width="300"
            height="200"
            format="webp"
            quality="80"
          />
        </div>
      </button>
    </div>

    <!-- No Results -->
    <div v-if="filteredModels.length === 0" class="no-results">
      <div class="no-results-icon">
        <svg class="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <h3 class="no-results-title">No models found</h3>
      <p class="no-results-text">Try a different category</p>
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

const filteredModels = computed(() => {
  return [...props.models];
});
</script>

<style scoped>
/* Hyundai OEM Style - Matching hyundai.com/au */

.model-selector {
  font-family: 'HyundaiSansHead', 'Helvetica Neue', Arial, sans-serif;
}

.models-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.model-card {
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
  border: none;
  border-radius: 0;
  padding: 0;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
  overflow: hidden;
  aspect-ratio: 1;
}

.model-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.model-card.selected {
  outline: 3px solid #002c5f;
  outline-offset: -3px;
}

.model-name {
  font-size: 24px;
  font-weight: 700;
  color: #000;
  margin: 0;
  padding: 30px 20px 20px;
  line-height: 1.2;
  letter-spacing: 0.5px;
}

.model-image-wrapper {
  width: 100%;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  overflow: visible;
}

.model-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  transform: scale(1.1);
}

.no-results {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  text-align: center;
}

.no-results-icon {
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #f5f5f5;
}

.no-results-title {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 8px;
}

.no-results-text {
  font-size: 14px;
  color: #666;
  margin: 0;
}

@media (max-width: 1024px) {
  .models-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }

  .model-name {
    font-size: 20px;
    padding: 24px 16px 16px;
  }
}

@media (max-width: 640px) {
  .models-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .model-name {
    font-size: 22px;
    padding: 28px 20px 18px;
  }
}
</style>

