<template>
  <div>
    <!-- Desktop Dialog -->
    <div
      v-if="isDesktop"
      v-show="open"
      class="fixed inset-0 flex items-center justify-center bg-black/50"
      style="z-index: 1000;"
      @click.self="$emit('update:open', false)"
    >
      <div
        class="bg-white dark:bg-[#1A1A1A] rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col m-4"
        @click.stop
      >
        <!-- Header -->
        <div class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white">{{ title }}</h3>
            <p v-if="description" class="text-sm text-gray-600 dark:text-[#CCCCCC] mt-1">
              {{ description }}
            </p>
          </div>
          <button
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            @click="$emit('update:open', false)"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Tabs (Desktop) -->
        <div v-if="tabs && tabs.length > 0" class="flex border-b border-gray-200 dark:border-gray-700 px-6">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            :class="[
              'px-4 py-3 text-sm font-medium border-b-2 transition-colors',
              currentTab === tab.id
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200',
            ]"
            @click="$emit('tab-click', tab.id)"
          >
            {{ tab.label }}
            <span v-if="tab.count > 0" class="ml-1 text-xs">({{ tab.count }})</span>
          </button>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto p-6">
          <slot name="content" />
        </div>

        <!-- Footer -->
        <div class="border-t border-gray-200 dark:border-gray-700 p-6">
          <slot name="footer" />
        </div>
      </div>
    </div>

    <!-- Mobile Drawer -->
    <div
      v-else
      v-show="open"
      class="fixed inset-0"
      style="z-index: 1000;"
    >
      <!-- Backdrop -->
      <div
        class="absolute inset-0 bg-black/50"
        @click="$emit('update:open', false)"
      />
      
      <!-- Drawer -->
      <div
        class="absolute bottom-0 left-0 right-0 bg-white dark:bg-[#1A1A1A] rounded-t-lg shadow-xl max-h-[90vh] flex flex-col"
      >
        <!-- Handle -->
        <div class="flex justify-center pt-3 pb-2">
          <div class="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
        </div>

        <!-- Header -->
        <div class="flex items-center justify-between px-6 pb-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">{{ title }}</h3>
            <p v-if="description" class="text-sm text-gray-600 dark:text-[#CCCCCC] mt-1">
              {{ description }}
            </p>
          </div>
          <button
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            @click="$emit('update:open', false)"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto px-6 py-4">
          <slot name="content" />
        </div>

        <!-- Footer -->
        <div class="border-t border-gray-200 dark:border-gray-700 p-6">
          <slot name="footer" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useMediaQuery } from '@vueuse/core';

interface Tab {
  id: string;
  label: string;
  count?: number;
}

defineProps<{
  open: boolean;
  title: string;
  description?: string;
  currentTab?: string;
  tabs?: Tab[];
}>();

defineEmits<{
  'update:open': [value: boolean];
  'tab-click': [tabId: string];
}>();

const isDesktop = useMediaQuery('(min-width: 768px)');
</script>







