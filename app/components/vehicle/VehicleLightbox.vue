<template>
  <Teleport to="body">
    <Transition name="lightbox">
      <div
        v-if="isOpen"
        class="lightbox"
        @click="handleBackdropClick"
      >
        <!-- Header -->
        <header class="lightbox__header">
          <div class="lightbox__title">{{ title }}</div>
          <div class="lightbox__counter">
            {{ currentIndex + 1 }} of {{ images.length }}
          </div>
          <button
            class="lightbox__close"
            @click="close"
            aria-label="Close gallery"
          >
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <!-- Main Content -->
        <div class="lightbox__main" @click.stop>
          <!-- Navigation - Previous -->
          <button
            v-if="images.length > 1"
            class="lightbox__nav lightbox__nav--prev"
            @click="goToPrev"
            aria-label="Previous image"
          >
            <svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <!-- Image Viewport - Simple CSS-based slider -->
          <div class="lightbox__viewport">
            <div
              class="lightbox__slides"
              :style="{ transform: `translateX(-${currentIndex * 100}%)` }"
              @touchstart="handleTouchStart"
              @touchmove="handleTouchMove"
              @touchend="handleTouchEnd"
            >
              <div
                v-for="(image, index) in largeImages"
                :key="index"
                class="lightbox__slide"
              >
                <NuxtImg
                  :src="image"
                  :alt="`${title} - Photo ${index + 1}`"
                  class="lightbox__image"
                  draggable="false"
                  width="1920"
                  height="1080"
                  format="webp"
                  quality="85"
                />
              </div>
            </div>
          </div>

          <!-- Navigation - Next -->
          <button
            v-if="images.length > 1"
            class="lightbox__nav lightbox__nav--next"
            @click="goToNext"
            aria-label="Next image"
          >
            <svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <!-- Thumbnail Strip -->
        <div v-if="images.length > 1" class="lightbox__thumbs" @click.stop>
          <button
            class="lightbox__thumbs-nav lightbox__thumbs-nav--prev"
            @click="scrollThumbsLeft"
            aria-label="Scroll thumbnails left"
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div class="lightbox__thumbs-viewport" ref="thumbsViewportRef">
            <div class="lightbox__thumbs-track">
              <button
                v-for="(image, index) in images"
                :key="`thumb-${index}`"
                :ref="el => setThumbRef(el, index)"
                :class="['lightbox__thumb', { 'lightbox__thumb--active': index === currentIndex }]"
                @click="goToIndex(index)"
                :aria-label="`View photo ${index + 1}`"
              >
                <NuxtImg
                  :src="image"
                  :alt="`Thumbnail ${index + 1}`"
                  class="lightbox__thumb-img"
                  draggable="false"
                  width="80"
                  height="56"
                  loading="lazy"
                  format="webp"
                  quality="80"
                />
              </button>
            </div>
          </div>

          <button
            class="lightbox__thumbs-nav lightbox__thumbs-nav--next"
            @click="scrollThumbsRight"
            aria-label="Scroll thumbnails right"
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <!-- Keyboard Hints -->
        <div class="lightbox__hints">
          <span>← → Navigate</span>
          <span>ESC Close</span>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
const props = defineProps<{
  isOpen: boolean;
  images: string[];
  title: string;
  initialIndex?: number;
}>();

const emit = defineEmits<{
  close: [];
}>();

// Helper to add size query param for larger images in lightbox
const getLargeImageUrl = (url: string) => {
  if (!url) return url;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}pxc_size=1920,1080`;
};

// Computed images with large size for main view
const largeImages = computed(() => props.images.map(getLargeImageUrl));

// State
const currentIndex = ref(props.initialIndex || 0);
const thumbsViewportRef = ref<HTMLElement | null>(null);
const thumbRefs = ref<Map<number, HTMLElement>>(new Map());

// Touch swipe handling
const touchStartX = ref(0);
const touchEndX = ref(0);
const isSwiping = ref(false);

const handleTouchStart = (e: TouchEvent) => {
  touchStartX.value = e.touches[0].clientX;
  isSwiping.value = true;
};

const handleTouchMove = (e: TouchEvent) => {
  if (!isSwiping.value) return;
  touchEndX.value = e.touches[0].clientX;
};

const handleTouchEnd = () => {
  if (!isSwiping.value) return;
  isSwiping.value = false;

  const diff = touchStartX.value - touchEndX.value;
  const threshold = 50; // Minimum swipe distance

  if (Math.abs(diff) > threshold) {
    if (diff > 0) {
      // Swipe left - go to next
      goToNext();
    } else {
      // Swipe right - go to prev
      goToPrev();
    }
  }

  touchStartX.value = 0;
  touchEndX.value = 0;
};

// Navigation functions
const goToNext = () => {
  if (props.images.length <= 1) return;
  currentIndex.value = (currentIndex.value + 1) % props.images.length;
  scrollThumbIntoView();
};

const goToPrev = () => {
  if (props.images.length <= 1) return;
  currentIndex.value = (currentIndex.value - 1 + props.images.length) % props.images.length;
  scrollThumbIntoView();
};

const goToIndex = (index: number) => {
  currentIndex.value = index;
  scrollThumbIntoView();
};

// Thumbnail refs management
const setThumbRef = (el: any, index: number) => {
  if (el) {
    thumbRefs.value.set(index, el);
  }
};

// Scroll active thumbnail into view
const scrollThumbIntoView = () => {
  nextTick(() => {
    const thumb = thumbRefs.value.get(currentIndex.value);
    if (thumb && thumbsViewportRef.value) {
      thumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  });
};

// Thumbnails scroll buttons
const scrollThumbsLeft = () => {
  if (thumbsViewportRef.value) {
    thumbsViewportRef.value.scrollBy({ left: -200, behavior: 'smooth' });
  }
};

const scrollThumbsRight = () => {
  if (thumbsViewportRef.value) {
    thumbsViewportRef.value.scrollBy({ left: 200, behavior: 'smooth' });
  }
};

// Close handler
const close = () => {
  emit('close');
  if (import.meta.client) {
    document.body.style.overflow = '';
  }
};

// Click backdrop to close
const handleBackdropClick = (e: MouseEvent) => {
  if (e.target === e.currentTarget) {
    close();
  }
};

// Keyboard navigation
const handleKeydown = (e: KeyboardEvent) => {
  if (!props.isOpen) return;

  switch (e.key) {
    case 'ArrowLeft':
      e.preventDefault();
      goToPrev();
      break;
    case 'ArrowRight':
      e.preventDefault();
      goToNext();
      break;
    case 'Escape':
      e.preventDefault();
      close();
      break;
    case 'Home':
      e.preventDefault();
      goToIndex(0);
      break;
    case 'End':
      e.preventDefault();
      goToIndex(props.images.length - 1);
      break;
  }
};

// Watch for lightbox open/close
watch(() => props.isOpen, (isOpen) => {
  if (!import.meta.client) return;

  if (isOpen) {
    document.body.style.overflow = 'hidden';
    // Set initial index
    currentIndex.value = props.initialIndex || 0;
    // Scroll thumb into view after DOM update
    nextTick(() => {
      scrollThumbIntoView();
    });
  } else {
    document.body.style.overflow = '';
  }
});

// Watch for initialIndex prop changes
watch(() => props.initialIndex, (newIndex) => {
  if (props.isOpen && newIndex !== undefined) {
    currentIndex.value = newIndex;
    scrollThumbIntoView();
  }
});

// Lifecycle - only add event listeners on client
onMounted(() => {
  if (import.meta.client) {
    window.addEventListener('keydown', handleKeydown);
  }
});

onUnmounted(() => {
  if (import.meta.client) {
    window.removeEventListener('keydown', handleKeydown);
    document.body.style.overflow = '';
  }
});
</script>

<style scoped>
.lightbox {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  background-color: rgba(0, 0, 0, 0.97);
}

/* Header */
.lightbox__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.75rem 1rem;
  background-color: rgba(0, 0, 0, 0.5);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

@media (min-width: 768px) {
  .lightbox__header {
    padding: 1rem 1.5rem;
  }
}

.lightbox__title {
  flex: 1;
  min-width: 0;
  color: #fff;
  font-size: 0.875rem;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (min-width: 768px) {
  .lightbox__title {
    font-size: 1rem;
  }
}

.lightbox__counter {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.8125rem;
  font-weight: 500;
  white-space: nowrap;
}

.lightbox__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border: none;
  border-radius: 0.5rem;
  background-color: rgba(255, 255, 255, 0.1);
  color: #fff;
  cursor: pointer;
  transition: background-color 0.2s;
}

.lightbox__close:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

/* Main Content */
.lightbox__main {
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
  min-height: 0;
  padding: 0.5rem;
}

@media (min-width: 768px) {
  .lightbox__main {
    padding: 1rem 4rem;
  }
}

/* Navigation Buttons */
.lightbox__nav {
  position: absolute;
  top: 50%;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  transform: translateY(-50%);
  border: none;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.15);
  color: #fff;
  cursor: pointer;
  transition: all 0.2s;
  backdrop-filter: blur(4px);
}

@media (min-width: 768px) {
  .lightbox__nav {
    width: 3.5rem;
    height: 3.5rem;
  }
}

.lightbox__nav:hover {
  background-color: rgba(255, 255, 255, 0.25);
  transform: translateY(-50%) scale(1.05);
}

.lightbox__nav--prev {
  left: 0.5rem;
}

.lightbox__nav--next {
  right: 0.5rem;
}

@media (min-width: 768px) {
  .lightbox__nav--prev {
    left: 1rem;
  }

  .lightbox__nav--next {
    right: 1rem;
  }
}

/* Viewport & Slides */
.lightbox__viewport {
  flex: 1;
  overflow: hidden;
  height: 100%;
}

.lightbox__slides {
  display: flex;
  height: 100%;
  transition: transform 0.3s ease-out;
  touch-action: pan-y pinch-zoom;
}

.lightbox__slide {
  position: relative;
  flex: 0 0 100%;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
}

@media (min-width: 768px) {
  .lightbox__slide {
    padding: 1rem;
  }
}

.lightbox__image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 0.25rem;
  user-select: none;
}

/* Thumbnail Strip */
.lightbox__thumbs {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 0.5rem;
  background-color: rgba(0, 0, 0, 0.5);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

@media (min-width: 768px) {
  .lightbox__thumbs {
    padding: 1rem;
    gap: 0.75rem;
  }
}

.lightbox__thumbs-nav {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border: none;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.1);
  color: #fff;
  cursor: pointer;
  transition: background-color 0.2s;
}

@media (min-width: 768px) {
  .lightbox__thumbs-nav {
    width: 2.5rem;
    height: 2.5rem;
  }
}

.lightbox__thumbs-nav:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.lightbox__thumbs-viewport {
  flex: 1;
  overflow-x: auto;
  overflow-y: hidden;
  scroll-behavior: smooth;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.lightbox__thumbs-viewport::-webkit-scrollbar {
  display: none;
}

.lightbox__thumbs-track {
  display: flex;
  gap: 0.5rem;
}

@media (min-width: 768px) {
  .lightbox__thumbs-track {
    gap: 0.625rem;
  }
}

.lightbox__thumb {
  flex: 0 0 auto;
  width: 3.5rem;
  height: 2.5rem;
  border: 2px solid transparent;
  border-radius: 0.375rem;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
  background-color: #1e293b;
  padding: 0;
}

@media (min-width: 768px) {
  .lightbox__thumb {
    width: 5rem;
    height: 3.5rem;
  }
}

.lightbox__thumb:hover {
  border-color: rgba(255, 255, 255, 0.5);
}

.lightbox__thumb--active {
  border-color: #fff;
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.3);
}

.lightbox__thumb-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Keyboard Hints */
.lightbox__hints {
  display: none;
  gap: 1.5rem;
  justify-content: center;
  padding: 0.5rem;
  color: rgba(255, 255, 255, 0.4);
  font-size: 0.75rem;
}

@media (min-width: 768px) {
  .lightbox__hints {
    display: flex;
  }
}

.lightbox__hints span {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

/* Transitions */
.lightbox-enter-active,
.lightbox-leave-active {
  transition: opacity 0.25s ease;
}

.lightbox-enter-from,
.lightbox-leave-to {
  opacity: 0;
}
</style>
