const mobileActionBarVisible = ref(true);

let listenerCount = 0;
let lastScrollY = 0;
let ticking = false;

const TOP_THRESHOLD = 80;
const DELTA_THRESHOLD = 8;

const updateVisibility = () => {
  const currentScrollY = Math.max(window.scrollY || 0, 0);
  const delta = currentScrollY - lastScrollY;

  if (currentScrollY <= TOP_THRESHOLD) {
    mobileActionBarVisible.value = true;
  } else if (Math.abs(delta) >= DELTA_THRESHOLD) {
    mobileActionBarVisible.value = delta < 0;
  }

  lastScrollY = currentScrollY;
  ticking = false;
};

const handleScroll = () => {
  if (ticking) return;
  ticking = true;
  window.requestAnimationFrame(updateVisibility);
};

export function useMobileActionBarVisibility() {
  onMounted(() => {
    if (!import.meta.client) return;

    if (listenerCount === 0) {
      lastScrollY = Math.max(window.scrollY || 0, 0);
      mobileActionBarVisible.value = lastScrollY <= TOP_THRESHOLD;
      window.addEventListener('scroll', handleScroll, { passive: true });
    }

    listenerCount++;
  });

  onUnmounted(() => {
    if (!import.meta.client) return;

    listenerCount = Math.max(listenerCount - 1, 0);
    if (listenerCount === 0) {
      window.removeEventListener('scroll', handleScroll);
      ticking = false;
      mobileActionBarVisible.value = true;
    }
  });

  return readonly(mobileActionBarVisible);
}
