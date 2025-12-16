<template>
  <section class="gallery" aria-label="Vehicle photo gallery">
    <div class="gallery__container">
      <!-- Hero Image (Left Side) -->
      <button
        class="gallery__hero"
        type="button"
        @click="$emit('openLightbox', 0)"
        :aria-label="`View ${title} gallery`"
      >
        <img
          :src="heroImage"
          :alt="`${title} - Main photo`"
          class="gallery__hero-img"
        />
        <span v-if="badge" class="gallery__badge">{{ badge }}</span>
        <div class="gallery__hero-overlay">
          <div class="gallery__hero-meta">
            <span class="gallery__hero-category">Exterior</span>
            <span class="gallery__hero-count">({{ exteriorCount }})</span>
          </div>
        </div>
      </button>

      <!-- Thumbnails Grid (Right Side) -->
      <div v-if="hasThumbs" class="gallery__sidebar">
        <button
          v-for="(thumb, index) in thumbnails"
          :key="thumb.id"
          type="button"
          class="gallery__thumb"
          :style="{ backgroundImage: `url(${thumb.src})` }"
          @click="$emit('openLightbox', thumb.originalIndex)"
          :aria-label="`View ${thumb.category} photo ${index + 1}`"
        >
          <span class="sr-only">{{ title }} - {{ thumb.category }}</span>
        </button>

        <!-- All Photos CTA -->
        <button
          type="button"
          class="gallery__all-photos"
          :style="allPhotosImage ? { backgroundImage: `url(${allPhotosImage})` } : {}"
          @click="$emit('openLightbox', 0)"
          aria-label="View all photos"
        >
          <div class="gallery__all-photos-overlay"></div>
          <span class="gallery__all-photos-text">
            All Photos ({{ images.length }})
          </span>
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
interface Thumbnail {
  id: string;
  src: string;
  category: string;
  label: string;
  originalIndex: number;
}

const props = defineProps<{
  images: string[];
  title: string;
  badge?: string;
}>();

defineEmits<{
  openLightbox: [index: number];
}>();

// Configuration
const MAX_VISIBLE_THUMBS = 4;

// Computed properties
const heroImage = computed(() => props.images[0] || '');

const hasThumbs = computed(() => props.images.length > 1);

const exteriorCount = computed(() => Math.min(props.images.length, 73));

const thumbnails = computed<Thumbnail[]>(() => {
  const thumbs: Thumbnail[] = [];
  const secondaryImages = props.images.slice(1, 1 + MAX_VISIBLE_THUMBS);

  secondaryImages.forEach((src, index) => {
    thumbs.push({
      id: `thumb-${index}`,
      src,
      category: 'Photo',
      label: '',
      originalIndex: index + 1,
    });
  });

  return thumbs;
});

// Use the last image in the gallery for the "All Photos" background
const allPhotosImage = computed(() => {
  if (props.images.length > MAX_VISIBLE_THUMBS + 1) {
    return props.images[MAX_VISIBLE_THUMBS + 1];
  }
  return props.images[props.images.length - 1] || '';
});
</script>

<style scoped>
.gallery {
  background-color: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.gallery__container {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.5rem;
  max-width: 80rem;
  margin: 0 auto;
  padding: 1rem;
}

@media (min-width: 768px) {
  .gallery__container {
    grid-template-columns: 2fr 1fr;
    gap: 0.75rem;
    padding: 1.5rem;
  }
}

/* Hero Image */
.gallery__hero {
  position: relative;
  display: block;
  width: 100%;
  aspect-ratio: 4 / 3;
  border: none;
  padding: 0;
  border-radius: 0.75rem;
  overflow: hidden;
  cursor: pointer;
  background-color: #1e293b;
}

@media (min-width: 768px) {
  .gallery__hero {
    aspect-ratio: 16 / 10;
    border-radius: 1rem;
  }
}

.gallery__hero-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.gallery__hero:hover .gallery__hero-img {
  transform: scale(1.02);
}

.gallery__badge {
  position: absolute;
  top: 0.75rem;
  left: 0.75rem;
  padding: 0.375rem 0.75rem;
  background-color: rgba(15, 23, 42, 0.9);
  color: #fff;
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-radius: 0.25rem;
}

.gallery__hero-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 2rem 1rem 1rem;
  background: linear-gradient(to top, rgba(15, 23, 42, 0.8) 0%, transparent 100%);
}

.gallery__hero-meta {
  display: flex;
  align-items: baseline;
  gap: 0.375rem;
  color: #fff;
}

.gallery__hero-category {
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  opacity: 0.9;
}

.gallery__hero-count {
  font-size: 0.75rem;
  opacity: 0.7;
}

/* Sidebar Thumbnails */
.gallery__sidebar {
  display: flex;
  flex-direction: row;
  gap: 0.5rem;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.gallery__sidebar::-webkit-scrollbar {
  display: none;
}

@media (min-width: 768px) {
  .gallery__sidebar {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: repeat(3, 1fr);
    gap: 0.75rem;
    overflow-x: visible;
  }
}

.gallery__thumb {
  position: relative;
  display: block;
  flex-shrink: 0;
  width: 72px;
  height: 72px;
  border: none;
  padding: 0;
  border-radius: 0.5rem;
  overflow: hidden;
  cursor: pointer;
  background-color: #1e293b;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  transition: background-size 0.3s ease;
}

@media (min-width: 768px) {
  .gallery__thumb {
    width: 100%;
    height: 100%;
    min-height: 100px;
    border-radius: 0.75rem;
    flex-shrink: 1;
  }
}

.gallery__thumb:hover {
  background-size: 105%;
}


/* All Photos Button */
.gallery__all-photos {
  position: relative;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 72px;
  height: 72px;
  border: none;
  padding: 0.5rem;
  border-radius: 0.5rem;
  background-color: #1e293b;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  cursor: pointer;
  overflow: hidden;
  transition: background-size 0.3s ease;
}

@media (min-width: 768px) {
  .gallery__all-photos {
    grid-column: span 2;
    width: 100%;
    height: auto;
    min-height: 70px;
    padding: 1rem;
    border-radius: 0.75rem;
    flex-shrink: 1;
  }
}

.gallery__all-photos:hover {
  background-size: 105%;
}

.gallery__all-photos-overlay {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.7);
  transition: background 0.3s ease;
}

.gallery__all-photos:hover .gallery__all-photos-overlay {
  background: rgba(15, 23, 42, 0.6);
}

.gallery__all-photos-text {
  position: relative;
  z-index: 1;
  color: #fff;
  font-size: 0.625rem;
  font-weight: 600;
  text-align: center;
  line-height: 1.2;
}

@media (min-width: 768px) {
  .gallery__all-photos-text {
    font-size: 0.875rem;
  }
}

/* Accessibility */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
</style>
