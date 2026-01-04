<template>
  <div v-if="hasVideos || loading" class="youtube-videos-section">
    <!-- Header with title -->
    <div class="youtube-header">
      <h2 class="youtube-title">
        <svg class="youtube-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
        <span>{{ modelName }} Videos</span>
      </h2>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="youtube-loading">
      <div class="youtube-spinner"></div>
    </div>

    <!-- Videos Carousel using shadcn-vue -->
    <Carousel
      v-else-if="hasVideos"
      :opts="{
        align: 'start',
        loop: false,
      }"
      class="youtube-carousel"
    >
      <CarouselContent class="-ml-2 md:-ml-3">
        <CarouselItem
          v-for="video in videos"
          :key="video.id"
          class="pl-2 md:pl-3 basis-4/5 sm:basis-1/2"
        >
          <button
            type="button"
            class="video-card"
            @click="openVideoModal(video)"
          >
            <div class="video-thumbnail">
              <img
                :src="video.thumbnails || video.thumbnailmq"
                :alt="video.title"
                class="thumbnail-img"
                loading="lazy"
              />
              <div class="play-overlay">
                <div class="play-btn">
                  <svg class="play-icon" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
              </div>
              <div class="yt-badge">
                <svg class="yt-badge-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
                YouTube
              </div>
            </div>
            <div class="video-info">
              <h3 class="video-title-text">{{ video.title }}</h3>
            </div>
          </button>
        </CarouselItem>
      </CarouselContent>
      <CarouselPrevious class="carousel-nav-prev" />
      <CarouselNext class="carousel-nav-next" />
    </Carousel>

    <!-- No Videos Message -->
    <div v-else class="youtube-empty">
      No videos found for this model.
    </div>

    <!-- Video Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="isModalOpen && selectedVideo"
          class="modal-backdrop"
          @click.self="closeVideoModal"
        >
          <div class="modal-content">
            <button
              type="button"
              class="modal-close"
              @click="closeVideoModal"
            >
              <svg class="modal-close-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div class="video-embed">
              <iframe
                :src="`https://www.youtube.com/embed/${selectedVideo.id}?autoplay=1&rel=0`"
                class="embed-iframe"
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowfullscreen
              ></iframe>
            </div>

            <div class="modal-footer">
              <h3 class="modal-title">{{ selectedVideo.title }}</h3>
              <a
                :href="`https://www.youtube.com/watch?v=${selectedVideo.id}`"
                target="_blank"
                rel="noopener noreferrer"
                class="modal-link"
              >
                Watch on YouTube
                <svg class="modal-link-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '~/components/ui/carousel'

interface YouTubeVideo {
  id: string
  title: string
  description: string
  thumbnails: string
  thumbnailmq: string
  publishedAt: string
}

interface Props {
  modelName: string
}

const props = defineProps<Props>()

// Use the YouTube videos composable - filter by model name
const { videos, loading, hasVideos } = useYouTubeVideos(
  computed(() => props.modelName),
  { maxResults: 8 }
)

// Video Modal State
const isModalOpen = ref(false)
const selectedVideo = ref<YouTubeVideo | null>(null)

const openVideoModal = (video: YouTubeVideo) => {
  selectedVideo.value = video
  isModalOpen.value = true
  if (import.meta.client) {
    document.body.style.overflow = 'hidden'
  }
}

const closeVideoModal = () => {
  isModalOpen.value = false
  selectedVideo.value = null
  if (import.meta.client) {
    document.body.style.overflow = ''
  }
}

// Close modal on Escape key
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && isModalOpen.value) {
    closeVideoModal()
  }
}

onMounted(() => {
  if (import.meta.client) {
    window.addEventListener('keydown', handleKeydown)
  }
})

onUnmounted(() => {
  if (import.meta.client) {
    window.removeEventListener('keydown', handleKeydown)
    document.body.style.overflow = ''
  }
})
</script>

<style scoped>
.youtube-videos-section {
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  background-color: #fff;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden; /* Contain carousel overflow */
}

/* Header */
.youtube-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.youtube-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
}

.youtube-icon {
  width: 20px;
  height: 20px;
  color: #dc2626;
  flex-shrink: 0;
}

.youtube-title span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Loading */
.youtube-loading {
  display: flex;
  justify-content: center;
  padding: 32px 0;
}

.youtube-spinner {
  width: 32px;
  height: 32px;
  border: 2px solid #e2e8f0;
  border-top-color: #002c5f;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Carousel */
.youtube-carousel {
  position: relative;
  overflow: hidden; /* Contain negative margin overflow from CarouselContent */
}

/* Navigation buttons - positioned inside the carousel */
.youtube-carousel :deep(.carousel-nav-prev) {
  left: 4px;
  top: 35%;
  transform: translateY(-50%);
  background-color: white;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.youtube-carousel :deep(.carousel-nav-next) {
  right: 4px;
  top: 35%;
  transform: translateY(-50%);
  background-color: white;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.youtube-carousel :deep(.carousel-nav-prev:hover:not(:disabled)),
.youtube-carousel :deep(.carousel-nav-next:hover:not(:disabled)) {
  background-color: #f8fafc;
  border-color: #002c5f;
}

.youtube-carousel :deep(.carousel-nav-prev:disabled),
.youtube-carousel :deep(.carousel-nav-next:disabled) {
  opacity: 0.3;
}

/* Video card */
.video-card {
  display: block;
  width: 100%;
  text-align: left;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
}

.video-thumbnail {
  position: relative;
  aspect-ratio: 16 / 9;
  border-radius: 12px;
  overflow: hidden;
  background: #f1f5f9;
}

.thumbnail-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.video-card:hover .thumbnail-img {
  transform: scale(1.05);
}

.play-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.2);
  transition: background 0.2s ease;
}

.video-card:hover .play-overlay {
  background: rgba(0, 0, 0, 0.4);
}

.play-btn {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #dc2626;
  color: #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  transition: transform 0.2s ease;
}

.video-card:hover .play-btn {
  transform: scale(1.1);
}

.play-icon {
  width: 20px;
  height: 20px;
  margin-left: 2px;
}

.yt-badge {
  position: absolute;
  bottom: 8px;
  right: 8px;
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(0, 0, 0, 0.8);
  color: #fff;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
}

.yt-badge-icon {
  width: 10px;
  height: 10px;
}

.video-info {
  margin-top: 8px;
}

.video-title-text {
  font-size: 14px;
  font-weight: 500;
  color: #0f172a;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  transition: color 0.2s ease;
  margin: 0;
}

.video-card:hover .video-title-text {
  color: #002c5f;
}

/* Empty state */
.youtube-empty {
  padding: 24px 0;
  text-align: center;
  color: #64748b;
  font-size: 14px;
}

/* Modal styles */
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(0, 0, 0, 0.85);
}

.modal-content {
  position: relative;
  width: 100%;
  max-width: 900px;
}

.modal-close {
  position: absolute;
  top: -48px;
  right: 0;
  color: #fff;
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  transition: color 0.2s ease;
}

.modal-close:hover {
  color: #cbd5e1;
}

.modal-close-icon {
  width: 32px;
  height: 32px;
}

.video-embed {
  position: relative;
  aspect-ratio: 16 / 9;
  background: #000;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
}

.embed-iframe {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.modal-footer {
  margin-top: 16px;
  text-align: center;
}

.modal-title {
  color: #fff;
  font-size: 18px;
  font-weight: 500;
  margin: 0;
}

.modal-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
  font-size: 14px;
  color: #94a3b8;
  text-decoration: none;
  transition: color 0.2s ease;
}

.modal-link:hover {
  color: #fff;
}

.modal-link-icon {
  width: 16px;
  height: 16px;
}

/* Modal transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-content,
.modal-leave-active .modal-content {
  transition: transform 0.3s ease;
}

.modal-enter-from .modal-content,
.modal-leave-to .modal-content {
  transform: scale(0.95);
}
</style>
