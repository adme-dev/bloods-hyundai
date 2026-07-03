<template>
  <div ref="root" class="deferred-map-embed">
    <iframe
      v-if="shouldLoad && src"
      :src="src"
      class="deferred-map-embed__iframe"
      :title="title"
      loading="lazy"
      allowfullscreen
      referrerpolicy="no-referrer-when-downgrade"
    ></iframe>

    <div v-else-if="src" class="deferred-map-embed__placeholder">
      <div class="deferred-map-embed__content">
        <p class="deferred-map-embed__eyebrow">Google Maps</p>
        <button type="button" class="deferred-map-embed__button" @click="loadMap">
          Load map
        </button>
      </div>
    </div>

    <div v-else class="deferred-map-embed__placeholder deferred-map-embed__placeholder--empty">
      <p>Map unavailable</p>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  src: string;
  title?: string;
}>(), {
  title: 'Dealership location',
});

const root = ref<HTMLElement | null>(null);
const shouldLoad = ref(false);
let observer: IntersectionObserver | null = null;

const loadMap = () => {
  if (!props.src) return;
  shouldLoad.value = true;
  observer?.disconnect();
  observer = null;
};

onMounted(() => {
  if (!props.src || shouldLoad.value) return;

  if (!('IntersectionObserver' in window)) {
    loadMap();
    return;
  }

  observer = new IntersectionObserver(
    ([entry]) => {
      if (entry?.isIntersecting) {
        loadMap();
      }
    },
    { rootMargin: '600px 0px' }
  );

  if (root.value) {
    observer.observe(root.value);
  }
});

onBeforeUnmount(() => {
  observer?.disconnect();
});
</script>

<style scoped>
.deferred-map-embed {
  width: 100%;
  height: 100%;
  min-height: inherit;
}

.deferred-map-embed__iframe {
  display: block;
  width: 100%;
  height: 100%;
  border: 0;
}

.deferred-map-embed__placeholder {
  display: flex;
  width: 100%;
  height: 100%;
  min-height: inherit;
  align-items: center;
  justify-content: center;
  background:
    linear-gradient(135deg, rgba(248, 250, 252, 0.94), rgba(226, 232, 240, 0.88)),
    repeating-linear-gradient(45deg, rgba(148, 163, 184, 0.18) 0 1px, transparent 1px 18px);
  color: #334155;
}

.deferred-map-embed__placeholder--empty {
  background: #f1f5f9;
  color: #64748b;
}

.deferred-map-embed__content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  text-align: center;
}

.deferred-map-embed__eyebrow {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #475569;
}

.deferred-map-embed__button {
  border: 0;
  border-radius: 0.375rem;
  background: #001e50;
  color: #fff;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 600;
  line-height: 1;
  padding: 0.75rem 1rem;
}

.deferred-map-embed__button:hover {
  background: #0f2f6f;
}

.deferred-map-embed__button:focus-visible {
  outline: 2px solid #001e50;
  outline-offset: 3px;
}
</style>
