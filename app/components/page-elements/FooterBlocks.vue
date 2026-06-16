<template>
  <section v-if="footerBlocks.length" class="footer-blocks">
    <!-- Full-width grid - edge to edge -->
    <div class="grid grid-cols-1 md:grid-cols-2">
      <component
        v-for="(block, index) in footerBlocks"
        :key="index"
        :is="linkComponent(block.link)"
        :href="isLinkExternal(block.link) ? block.link : undefined"
        :to="!isLinkExternal(block.link) ? block.link : undefined"
        :target="isLinkExternal(block.link) ? '_blank' : undefined"
        :rel="isLinkExternal(block.link) ? 'noopener noreferrer' : undefined"
        class="footer-block group relative overflow-hidden block"
      >
        <!-- Image - true size, responsive -->
        <NuxtImg
          :src="block.slides"
          :alt="block.heading_content || 'Promotional block'"
          class="w-full h-auto block transition-transform duration-500 group-hover:scale-[1.02]"
          loading="lazy"
          format="webp"
          quality="80"
        />
        
        <!-- Content Overlay - positioned at top -->
        <div class="absolute inset-x-0 top-0 p-6 md:p-8 lg:p-10">
          <!-- Heading - two lines style like OEM -->
          <div 
            class="text-center"
            :class="block.text_contrast === 'uk-light' ? 'text-white' : 'text-gray-900'"
          >
            <h3 
              v-if="block.heading_content"
              class="text-xl md:text-2xl lg:text-3xl font-bold leading-tight"
            >
              {{ block.heading_content }}
            </h3>
            <p 
              v-if="block.sub_heading"
              class="text-xl md:text-2xl lg:text-3xl font-bold leading-tight"
            >
              {{ block.sub_heading }}
            </p>
            
            <!-- Learn more link -->
            <span class="inline-flex items-center gap-1 text-sm md:text-base font-medium mt-3 group-hover:underline">
              {{ block.button || `Learn more about ${block.heading_content || 'this offer'}` }}
              <svg class="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </div>
        </div>
      </component>
    </div>
  </section>
</template>

<script setup lang="ts">
import { isDateInRange } from '~/utils/date';

const mainStore = useMainStore();

// Date filtering depends on `new Date()`, which differs between the SSR render
// and client hydration (server clock/timezone vs the user's), causing hydration
// mismatches near date boundaries. Render the full set during SSR + initial
// hydration, then apply the date-range filter once mounted (client-only).
const isMounted = ref(false);
onMounted(() => {
  isMounted.value = true;
});

// Filter footer blocks by date range
const footerBlocks = computed(() => {
  const blocks = mainStore.site?.promotional?.[0]?.footerblocks || [];
  if (!isMounted.value) return blocks;
  return blocks.filter((block: any) => {
    // Check date range using start_date and end_date fields
    return isDateInRange(block.start_date, block.end_date);
  });
});

// Link helpers
const isLinkExternal = (link: string) => {
  if (!link) return false;
  return /^(http|https):\/\//.test(link);
};

const linkComponent = (link: string) => {
  if (!link) return 'div';
  return isLinkExternal(link) ? 'a' : resolveComponent('NuxtLink');
};
</script>

<style scoped>
.footer-block {
  cursor: pointer;
  text-decoration: none;
  color: inherit;
}

.footer-block:hover {
  text-decoration: none;
}
</style>




