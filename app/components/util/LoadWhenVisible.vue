<template>
  <div ref="target" :style="placeholderStyle">
    <slot v-if="shouldRender" />
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  minHeight?: string;
  rootMargin?: string;
  idleDelay?: number;
}>(), {
  minHeight: '0px',
  rootMargin: '600px 0px',
  idleDelay: 0,
});

const target = ref<HTMLElement | null>(null);
const shouldRender = ref(false);
let observer: IntersectionObserver | null = null;
let idleTimer: ReturnType<typeof setTimeout> | null = null;

const placeholderStyle = computed(() => {
  if (shouldRender.value || props.minHeight === '0px') return undefined;
  return { minHeight: props.minHeight };
});

const render = () => {
  if (shouldRender.value) return;
  shouldRender.value = true;
  observer?.disconnect();
  observer = null;
  if (idleTimer) {
    clearTimeout(idleTimer);
    idleTimer = null;
  }
};

onMounted(() => {
  if (!target.value || !('IntersectionObserver' in window)) {
    render();
    return;
  }

  observer = new IntersectionObserver((entries) => {
    if (entries.some((entry) => entry.isIntersecting)) {
      render();
    }
  }, {
    rootMargin: props.rootMargin,
  });

  observer.observe(target.value);

  if (props.idleDelay > 0) {
    idleTimer = setTimeout(render, props.idleDelay);
  }
});

onBeforeUnmount(() => {
  observer?.disconnect();
  if (idleTimer) {
    clearTimeout(idleTimer);
  }
});
</script>
