<template>
  <div 
    ref="mobileNavRef"
    class="mobile-nav"
    :class="{ 'is-open': isOpen }"
  >
    <div class="mobile-nav-overlay" @click="close"></div>
    
    <div class="mobile-nav-panel">
      <!-- Header -->
      <div class="mobile-nav-header">
        <NuxtLink to="/" class="mobile-nav-logo" @click="close">
          <img :src="logo" :alt="siteName" />
        </NuxtLink>
        <button class="mobile-nav-close" @click="close">
          <span uk-icon="close"></span>
        </button>
      </div>

      <!-- Navigation -->
      <nav class="mobile-nav-content">
        <ul class="mobile-nav-list">
          <li v-for="item in navItems" :key="item.url" class="mobile-nav-item">
            <div class="mobile-nav-item-header">
              <NuxtLink 
                :to="item.url" 
                class="mobile-nav-link"
                :class="{ 'is-active': isActiveRoute(item.url) }"
                @click="handleNavClick(item)"
              >
                {{ item.title }}
              </NuxtLink>
              <button 
                v-if="item.children?.length" 
                class="mobile-nav-expand"
                @click="toggleSubmenu(item)"
              >
                <span :uk-icon="expandedItems.includes(item.url) ? 'chevron-up' : 'chevron-down'"></span>
              </button>
            </div>
            
            <!-- Submenu -->
            <Transition name="submenu">
              <ul 
                v-if="item.children?.length && expandedItems.includes(item.url)" 
                class="mobile-nav-submenu"
              >
                <li v-for="child in item.children" :key="child.url">
                  <NuxtLink 
                    :to="child.url" 
                    class="mobile-nav-submenu-link"
                    @click="close"
                  >
                    {{ child.title }}
                  </NuxtLink>
                </li>
              </ul>
            </Transition>
          </li>
        </ul>
      </nav>

      <!-- Footer -->
      <div class="mobile-nav-footer">
        <NuxtLink to="/contact" class="uk-button uk-button-primary uk-width-1-1" @click="close">
          Contact Us
        </NuxtLink>
        <div class="mobile-nav-contact">
          <a :href="`tel:${phone}`" class="mobile-nav-phone">
            <span uk-icon="phone"></span>
            {{ phone }}
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute();
const mainStore = useMainStore();
const eventBus = useEventBus();

// State
const isOpen = ref(false);
const expandedItems = ref<string[]>([]);
const mobileNavRef = ref<HTMLElement | null>(null);

// Site config
const siteName = computed(() => mainStore.site?.name || 'Sale Hyundai');
const logo = computed(() => mainStore.site?.logo || '/assets/logos/logo-black-sm.svg');
const phone = computed(() => mainStore.site?.phone || '');

// Navigation items
const navItems = computed(() => {
  const site = mainStore.site;
  if (!site?.navigation) {
    return [
      { title: 'New Cars', url: '/build-and-price', children: [] },
      { title: 'Used Cars', url: '/car-sales', children: [] },
      { title: 'Special Offers', url: '/special-offers', children: [] },
      { title: 'Service', url: '/service', children: [] },
      { title: 'Parts', url: '/parts', children: [] },
      { title: 'Finance', url: '/finance', children: [] },
      { title: 'Contact', url: '/contact', children: [] },
    ];
  }
  return site.navigation.main || [];
});

// Check if route is active
const isActiveRoute = (url: string) => {
  return route.path === url || route.path.startsWith(url + '/');
};

// Methods
const open = () => {
  isOpen.value = true;
  if (process.client) {
    document.body.style.overflow = 'hidden';
  }
};

const close = () => {
  isOpen.value = false;
  if (process.client) {
    document.body.style.overflow = '';
  }
};

const toggle = (value?: boolean) => {
  if (value !== undefined) {
    value ? open() : close();
  } else {
    isOpen.value ? close() : open();
  }
};

const toggleSubmenu = (item: any) => {
  const index = expandedItems.value.indexOf(item.url);
  if (index > -1) {
    expandedItems.value.splice(index, 1);
  } else {
    expandedItems.value.push(item.url);
  }
};

const handleNavClick = (item: any) => {
  if (!item.children?.length) {
    close();
  }
};

// Event bus listeners
eventBus.useEvent('mobile-nav:toggle', (value) => {
  toggle(value);
});

eventBus.useEvent('mobile-nav:open', () => {
  open();
});

eventBus.useEvent('mobile-nav:close', () => {
  close();
});

// Close on route change
watch(() => route.fullPath, () => {
  close();
});

// Close on escape key
onMounted(() => {
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && isOpen.value) {
      close();
    }
  };
  window.addEventListener('keydown', handleEscape);
  onUnmounted(() => {
    window.removeEventListener('keydown', handleEscape);
  });
});
</script>

<style lang="scss" scoped>
.mobile-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  pointer-events: none;
  visibility: hidden;

  &.is-open {
    pointer-events: auto;
    visibility: visible;

    .mobile-nav-overlay {
      opacity: 1;
    }

    .mobile-nav-panel {
      transform: translateX(0);
    }
  }
}

.mobile-nav-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.mobile-nav-panel {
  position: absolute;
  top: 0;
  right: 0;
  width: 100%;
  max-width: 320px;
  height: 100%;
  background: white;
  display: flex;
  flex-direction: column;
  transform: translateX(100%);
  transition: transform 0.3s ease;
}

.mobile-nav-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #e0e0e0;
}

.mobile-nav-logo img {
  height: 32px;
  width: auto;
}

.mobile-nav-close {
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  color: #333;
}

.mobile-nav-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px 0;
}

.mobile-nav-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.mobile-nav-item {
  border-bottom: 1px solid #f0f0f0;
}

.mobile-nav-item-header {
  display: flex;
  align-items: center;
}

.mobile-nav-link {
  flex: 1;
  display: block;
  padding: 16px 20px;
  color: #333;
  text-decoration: none;
  font-weight: 500;
  font-size: 1rem;

  &.is-active {
    color: var(--color-primary);
  }
}

.mobile-nav-expand {
  background: none;
  border: none;
  padding: 16px 20px;
  cursor: pointer;
  color: #666;
}

.mobile-nav-submenu {
  list-style: none;
  margin: 0;
  padding: 0 0 12px;
  background: #f9f9f9;
}

.mobile-nav-submenu-link {
  display: block;
  padding: 12px 20px 12px 36px;
  color: #666;
  text-decoration: none;
  font-size: 0.875rem;

  &:hover {
    color: var(--color-primary);
  }
}

.mobile-nav-footer {
  padding: 20px;
  border-top: 1px solid #e0e0e0;
}

.mobile-nav-contact {
  margin-top: 16px;
  text-align: center;
}

.mobile-nav-phone {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #333;
  text-decoration: none;
  font-weight: 500;
}

// Submenu transition
.submenu-enter-active,
.submenu-leave-active {
  transition: all 0.2s ease;
  overflow: hidden;
}

.submenu-enter-from,
.submenu-leave-to {
  opacity: 0;
  max-height: 0;
}

.submenu-enter-to,
.submenu-leave-from {
  opacity: 1;
  max-height: 500px;
}
</style>



