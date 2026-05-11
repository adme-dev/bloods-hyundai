<template>
  <Teleport to="body">
    <Transition name="popup-fade">
      <div v-if="showPopup" class="auto-popup-overlay" @click.self="closePopup">
        <div class="auto-popup-modal">
          <!-- Header -->
          <div class="popup-header">
            <h2 class="popup-title">{{ popupSettings?.title || 'Apply for Finance' }}</h2>
            <button class="close-btn" @click="closePopup" aria-label="Close">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <!-- Content -->
          <div class="popup-content">
            <iframe
              v-if="popupSettings?.iframeUrl"
              :src="popupSettings.iframeUrl"
              class="popup-iframe"
              title="Finance Application"
              allow="geolocation; payment"
              sandbox="allow-scripts allow-forms allow-same-origin allow-popups allow-popups-to-escape-sandbox"
            />
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
  iframeUrl: string | null;
  title: string;
  displayMode: 'all' | 'specific';
  specificPages: string[];
  showOncePerSession: boolean;
  delaySeconds: number;
}

// Fetch popup settings
const { data: popupData } = await useFetch<{ success: boolean; settings: PopupSettings }>('/api/popup-settings', {
  lazy: true,
});

const popupSettings = computed(() => popupData.value?.settings);

// State
const showPopup = ref(false);
const hasShownThisSession = ref(false);

// Get current route
const route = useRoute();

// Check if popup should show on current page
const shouldShowOnCurrentPage = computed(() => {
  if (!popupSettings.value?.enabled) return false;
  if (!popupSettings.value?.iframeUrl) return false;

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

// Initialize popup display
const initPopup = () => {
  if (!import.meta.client) return;
  if (!popupSettings.value?.enabled) return;
  if (!shouldShowOnCurrentPage.value) return;

  // Check if already shown this session
  if (popupSettings.value.showOncePerSession) {
    const alreadyShown = sessionStorage.getItem('autoPopupShown');
    if (alreadyShown) {
      hasShownThisSession.value = true;
      return;
    }
  }

  // Show after delay
  const delay = (popupSettings.value.delaySeconds || 0) * 1000;
  setTimeout(() => {
    if (!hasShownThisSession.value && shouldShowOnCurrentPage.value) {
      showPopup.value = true;
    }
  }, delay);
};

// Watch for settings load
watch(popupSettings, (newSettings) => {
  if (newSettings?.enabled) {
    initPopup();
  }
}, { immediate: true });

// Watch for route changes (for specific pages mode)
watch(() => route.path, () => {
  if (popupSettings.value?.enabled && !popupSettings.value?.showOncePerSession) {
    // Reset and re-check on route change if not using session-once mode
    initPopup();
  }
});

// Initialize on mount
onMounted(() => {
  initPopup();
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
}

.auto-popup-modal {
  background: #fff;
  border-radius: 12px;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.4);
  overflow: hidden;
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
  min-height: 500px;
  overflow: hidden;
}

.popup-iframe {
  width: 100%;
  height: 100%;
  min-height: 500px;
  border: none;
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
  }

  .popup-content {
    min-height: 400px;
  }

  .popup-iframe {
    min-height: 400px;
  }
}
</style>
