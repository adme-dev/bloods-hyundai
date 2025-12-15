<template>
  <div class="sliding-tabs" ref="tabsContainer">
    <div class="tabs-wrapper">
      <button
        v-for="(tab, index) in tabs"
        :key="index"
        :ref="el => { if (el) tabRefs[index] = el as HTMLElement }"
        class="tab-button"
        :class="{ 'is-active': modelValue === index }"
        @click="selectTab(index)"
      >
        {{ tab }}
      </button>
      <div class="tab-indicator" :style="indicatorStyle"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  tabs: string[];
  modelValue: number;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'update:modelValue': [value: number];
}>();

const tabsContainer = ref<HTMLElement | null>(null);
const tabRefs = ref<HTMLElement[]>([]);

// Indicator position and width
const indicatorStyle = ref({
  left: '0px',
  width: '0px',
});

// Update indicator position
const updateIndicator = () => {
  const activeTab = tabRefs.value[props.modelValue];
  if (activeTab && tabsContainer.value) {
    const containerRect = tabsContainer.value.getBoundingClientRect();
    const tabRect = activeTab.getBoundingClientRect();
    indicatorStyle.value = {
      left: `${tabRect.left - containerRect.left}px`,
      width: `${tabRect.width}px`,
    };
  }
};

// Select tab
const selectTab = (index: number) => {
  emit('update:modelValue', index);
};

// Update indicator on mount and when value changes
onMounted(() => {
  nextTick(updateIndicator);
});

watch(() => props.modelValue, () => {
  nextTick(updateIndicator);
});

// Handle resize
if (process.client) {
  useResizeObserver(tabsContainer, updateIndicator);
}
</script>

<style lang="scss" scoped>
.sliding-tabs {
  position: relative;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.tabs-wrapper {
  display: inline-flex;
  position: relative;
  min-width: 100%;
}

.tab-button {
  position: relative;
  background: none;
  border: none;
  padding: 12px 24px;
  font-size: 1rem;
  font-weight: 500;
  color: #666;
  cursor: pointer;
  white-space: nowrap;
  transition: color 0.2s ease;
  z-index: 1;

  &:hover {
    color: var(--color-primary);
  }

  &.is-active {
    color: var(--color-primary);
    font-weight: 600;
  }
}

.tab-indicator {
  position: absolute;
  bottom: 0;
  height: 3px;
  background: var(--color-primary);
  border-radius: 3px 3px 0 0;
  transition: left 0.3s ease, width 0.3s ease;
}
</style>







