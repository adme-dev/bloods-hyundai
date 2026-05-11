<template>
  <Teleport to="body">
    <Transition name="popup-fade">
      <div v-if="showPopup" class="auto-popup-overlay" @click.self="closePopup">
        <div class="auto-popup-modal" :class="{ 'iframe-mode': popupSettings?.contentType === 'iframe' }">
          <!-- Header -->
          <div class="popup-header">
            <h2 class="popup-title">{{ popupSettings?.title || 'Special Offer' }}</h2>
            <button class="close-btn" @click="closePopup" aria-label="Close">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <!-- Content -->
          <div class="popup-content">
            <!-- Custom Content Mode -->
            <template v-if="popupSettings?.contentType === 'custom'">
              <div class="custom-content">
                <!-- Image -->
                <img
                  v-if="popupSettings?.imageUrl"
                  :src="popupSettings.imageUrl"
                  alt="Popup image"
                  class="popup-image"
                />

                <!-- HTML Content -->
                <div
                  v-if="popupSettings?.htmlContent"
                  v-html="popupSettings.htmlContent"
                  class="popup-html-content"
                ></div>

                <!-- Button -->
                <div v-if="popupSettings?.buttonText" class="popup-button-container">
                  <NuxtLink
                    v-if="popupSettings?.buttonUrl"
                    :to="popupSettings.buttonUrl"
                    class="popup-button"
                    @click="closePopup"
                  >
                    {{ popupSettings.buttonText }}
                  </NuxtLink>
                  <button v-else class="popup-button" @click="closePopup">
                    {{ popupSettings.buttonText }}
                  </button>
                </div>
              </div>
            </template>

            <!-- Iframe Mode -->
            <template v-else>
              <iframe
                v-if="popupSettings?.iframeUrl"
                :src="popupSettings.iframeUrl"
                class="popup-iframe"
                title="Finance Application"
                allow="geolocation; payment"
                sandbox="allow-scripts allow-forms allow-same-origin allow-popups allow-popups-to-escape-sandbox"
              />
            </template>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';

interface PopupSettings {
  enabled: boolean;
  contentType: 'custom' | 'iframe';
  iframeUrl: string | null;
  title: string;
  htmlContent: string | null;
  imageUrl: string | null;
  buttonText: string | null;
  buttonUrl: string | null;
  displayMode: 'all' | 'specific';
  specificPages: string[];
  showOncePerSession: boolean;
  delaySeconds: number;
}

// Fetch popup settings
const { data: popupData, status } = useFetch<{ success: boolean; settings: PopupSettings }>('/api/popup-settings', {
  lazy: true,
});

const popupSettings = computed(() => popupData.value?.settings);

// State
const showPopup = ref(false);
const hasShownThisSession = ref(false);

// Get current route
const route = useRoute();

// Check if popup has content to display
const hasContent = computed(() => {
  if (!popupSettings.value?.enabled) return false;

  if (popupSettings.value.contentType === 'iframe') {
    return !!popupSettings.value.iframeUrl;
  }

  // Custom content mode - needs at least one of: image, html, or button
  return !!(
    popupSettings.value.imageUrl ||
    popupSettings.value.htmlContent ||
    popupSettings.value.buttonText
  );
});

// Check if popup should show on current page
const shouldShowOnCurrentPage = computed(() => {
  if (!popupSettings.value?.enabled) return false;
  if (!hasContent.value) return false;

  // Check display mode
  if (popupSettings.value.displayMode === 'all') {
    return true;
  }

  // Check specific pages
  const currentPath = route.path;
  const specificPages = popupSettings.value.specificPages || [];

  // Exact match or starts with (for dynamic routes)
  return specificPages.some(page => {
    if (currentPath === page) return true;
    // Handle routes like /vehicle/xyz matching /vehicle
    if (page !== '/' && currentPath.startsWith(page + '/')) return true;
    return false;
  });
});

// Close popup
const closePopup = () => {
  showPopup.value = false;
  hasShownThisSession.value = true;

  // Store in sessionStorage
  if (import.meta.client) {
    sessionStorage.setItem('autoPopupShown', 'true');
  }
};

// Track if we've already started the popup timer
const popupTimerStarted = ref(false);

// Initialize popup display
const initPopup = () => {
  if (!import.meta.client) return;
  if (!popupSettings.value?.enabled) return;
  if (!shouldShowOnCurrentPage.value) return;
  if (popupTimerStarted.value) return; // Don't start multiple timers

  // Check if already shown this session
  if (popupSettings.value.showOncePerSession) {
    const alreadyShown = sessionStorage.getItem('autoPopupShown');
    if (alreadyShown) {
      hasShownThisSession.value = true;
      return;
    }
  }

  // Mark timer as started
  popupTimerStarted.value = true;

  // Show after delay
  const delay = (popupSettings.value.delaySeconds || 0) * 1000;
  setTimeout(() => {
    if (!hasShownThisSession.value && shouldShowOnCurrentPage.value && popupSettings.value?.enabled) {
      showPopup.value = true;
    }
  }, delay);
};

// Watch for settings load - this is the primary trigger
watch(popupSettings, (newSettings) => {
  if (newSettings?.enabled && !popupTimerStarted.value) {
    initPopup();
  }
}, { immediate: true });

// Watch for route changes (for specific pages mode)
watch(() => route.path, () => {
  if (popupSettings.value?.enabled && !popupSettings.value?.showOncePerSession) {
    // Reset timer flag and re-check on route change if not using session-once mode
    popupTimerStarted.value = false;
    hasShownThisSession.value = false;
    initPopup();
  }
});

// Initialize on mount as backup
onMounted(() => {
  if (popupSettings.value?.enabled && !popupTimerStarted.value) {
    initPopup();
  }
});
</script>

<style lang="scss" scoped>
$primary-blue: #002c5f;
$text-dark: #1a1a1a;
$text-gray: #666;

.auto-popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10001;
  padding: 1rem;
  overflow-y: auto;
}

.auto-popup-modal {
  background: #fff;
  border-radius: 12px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.4);
  overflow: hidden;

  &.iframe-mode {
    max-width: 600px;
  }
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  background: $primary-blue;

  .popup-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: #fff;
    margin: 0;
    font-family: 'HyundaiSansHead', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  .close-btn {
    background: rgba(255, 255, 255, 0.1);
    border: none;
    cursor: pointer;
    padding: 0.5rem;
    color: #fff;
    border-radius: 6px;
    transition: background 0.2s;

    &:hover {
      background: rgba(255, 255, 255, 0.2);
    }
  }
}

.popup-content {
  flex: 1;
  overflow-y: auto;
}

// Custom content styles
.custom-content {
  padding: 1.5rem;
  text-align: center;
}

.popup-image {
  max-width: 100%;
  max-height: 300px;
  object-fit: contain;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.popup-html-content {
  text-align: left;
  margin-bottom: 1.5rem;
  font-family: 'HyundaiSansHead', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  line-height: 1.6;
  color: $text-dark;

  :deep(h1), :deep(h2), :deep(h3) {
    color: $primary-blue;
    margin-bottom: 0.75rem;
    font-weight: 600;
  }

  :deep(h2) {
    font-size: 1.5rem;
  }

  :deep(h3) {
    font-size: 1.25rem;
  }

  :deep(p) {
    margin-bottom: 1rem;
    color: $text-gray;
  }

  :deep(ul), :deep(ol) {
    margin-bottom: 1rem;
    padding-left: 1.5rem;
    color: $text-gray;
  }

  :deep(li) {
    margin-bottom: 0.5rem;
  }

  :deep(a) {
    color: $primary-blue;
    text-decoration: underline;

    &:hover {
      text-decoration: none;
    }
  }

  :deep(strong) {
    font-weight: 600;
    color: $text-dark;
  }
}

.popup-button-container {
  margin-top: 1rem;
}

.popup-button {
  display: inline-block;
  padding: 0.875rem 2rem;
  background: $primary-blue;
  color: #fff;
  font-size: 1rem;
  font-weight: 600;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  text-decoration: none;
  font-family: 'HyundaiSansHead', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  transition: background 0.2s, transform 0.2s;

  &:hover {
    background: darken($primary-blue, 10%);
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
}

// Iframe styles
.popup-iframe {
  width: 100%;
  height: 100%;
  min-height: 500px;
  border: none;
}

.iframe-mode .popup-content {
  min-height: 500px;
}

// Transition
.popup-fade-enter-active,
.popup-fade-leave-active {
  transition: opacity 0.3s ease;

  .auto-popup-modal {
    transition: transform 0.3s ease, opacity 0.3s ease;
  }
}

.popup-fade-enter-from,
.popup-fade-leave-to {
  opacity: 0;

  .auto-popup-modal {
    transform: scale(0.95) translateY(-20px);
    opacity: 0;
  }
}

// Mobile responsive
@media (max-width: 640px) {
  .auto-popup-overlay {
    padding: 0;
    align-items: flex-end;
  }

  .auto-popup-modal {
    max-width: 100%;
    max-height: 95vh;
    border-radius: 16px 16px 0 0;

    &.iframe-mode {
      max-width: 100%;
    }
  }

  .popup-content {
    min-height: auto;
  }

  .iframe-mode .popup-content {
    min-height: 400px;
  }

  .popup-iframe {
    min-height: 400px;
  }

  .popup-image {
    max-height: 200px;
  }
}
</style>
