<template>
  <div class="uk-flex uk-grid-collapse groupedMakes uk-grid">
    <div class="uk-width-1-1">
      <!-- Loading State -->
      <div v-if="pending" class="showroom-menu uk-background-default uk-padding uk-text-center">
        <div uk-spinner></div>
        <p class="uk-margin-small-top">Loading vehicles...</p>
      </div>

      <div v-else-if="vehicleCategories && vehicleCategories.length > 0" class="showroom-menu uk-background-default">
        <!-- Mobile filter - hidden on lg screens (1024px+) -->
        <div class="block lg:hidden">
          <div @click="showMobileFilter = !showMobileFilter" class="uk-padding uk-padding-remove-bottom uk-link uk-text-bold">
            <UkIcon icon="settings" :ratio="1.2" class="uk-padding-small uk-margin-small-right" />
            Filter
          </div>

          <ul class="uk-list uk-margin-medium-left" v-show="showMobileFilter">
            <li :class="{ 'uk-active': itemToShow === -1 }">
              <a href="#" @click.prevent="selectCategory('All', -1)" class="uk-text-bold">
                All
              </a>
            </li>
            <li 
              v-for="(category, index) in vehicleCategories" 
              :key="index"
              :class="{ 'uk-active': itemToShow === index }"
            >
              <a 
                :href="'#' + category"
                @click.prevent="selectCategory(category, index)"
                class="uk-text-bold"
              >
                {{ capitalizeFirstLetter(category) }}
              </a>
            </li>
            <li>
              <NuxtLink 
                to="/car-sales?search_keywords=hyundai"
                class="uk-dropdown-close uk-text-bold uk-text-capitalize"
                @click="closeModel"
              >
                In stock
              </NuxtLink>
            </li>
          </ul>
        </div>

        <!-- Desktop tabs - visible only on lg screens (1024px+) -->
        <ul class="uk-subnav model--Category showroomnav uk-tab uk-flex uk-flex-center@s uk-flex-nowrap uk-margin-remove-top uk-light hidden lg:flex">
          <li :class="{ 'uk-active': itemToShow === -1 }">
            <a 
              href="#"
              @mouseover="selectCategory('All', -1)"
              class="uk-text-bold model-Cat-Btn"
            >
              All
            </a>
          </li>
          <li 
            v-for="(category, index) in vehicleCategories" 
            :key="index"
            :class="{ 'uk-active': itemToShow === index }"
            @mouseover="itemToShow = index"
          >
            <a 
              :href="'#' + category"
              @click.prevent="selectCategory(category, index)"
              class="uk-text-bold model-Cat-Btn uk-text-capitalize"
            >
              {{ capitalizeFirstLetter(category) }}
            </a>
          </li>
          <li>
            <NuxtLink 
              to="/car-sales?search_keywords=hyundai"
              class="uk-dropdown-close uk-text-bold uk-text-capitalize model-Cat-Btn"
              @click="closeModel"
            >
              In stock
            </NuxtLink>
          </li>
          <li class="close-btn hidden lg:block">
            <button type="button" @click="closeModel" class="close-link" title="Close menu">
              <svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fill="none" stroke="#ffffff" stroke-width="1.5" d="M16,16 L4,4"></path>
                <path fill="none" stroke="#ffffff" stroke-width="1.5" d="M16,4 L4,16"></path>
              </svg>
            </button>
          </li>
        </ul>

        <!-- Vehicle grid by category -->
        <div 
          v-for="(vehicles, categoryName) in groupedVehicles" 
          :key="categoryName"
          class="model-range-mnu"
        >
          <div class="uk-margin-medium-left uk-margin-medium-top">
            <div :id="categoryName" class="uk-h3 uk-width-1-1 uk-text-bold uk-margin-remove">
              {{ categoryName }}
            </div>
            <div 
              v-if="vehicles[0]?.categoryDescription"
              v-html="vehicles[0].categoryDescription"
              class="uk-visible@s"
            ></div>
          </div>
          <hr class="uk-margin-remove" />
          
          <div class="uk-margin-medium-left model-wrap uk-grid-collapse uk-flex uk-flex-left uk-grid">
            <div 
              v-for="(vehicle, vehicleIndex) in vehicles" 
              :key="vehicleIndex"
              class="uk-width-1-2@s uk-width-1-4@l uk-width-1-5@xl vehicle-item"
            >
              <div>
                <div class="vehicle-image-container">
                  <NuxtLink
                    :to="'/vehicle/' + vehicle.slug"
                    class="uk-text-muted"
                    @click="closeModel"
                  >
                    <NuxtImg
                      :src="vehicle.image"
                      :alt="vehicle.name"
                      class="vehicle-thumbnail"
                      width="550"
                      height="300"
                      loading="lazy"
                      format="webp"
                      quality="80"
                    />
                  </NuxtLink>
                </div>

                <div class="uk-grid-collapse uk-margin-medium-left uk-margin-small-bottom">
                  <div class="uk-width-1-1 uk-text-bold uk-text-secondary uk-text-left">
                    {{ vehicle.name }}
                  </div>

                  <div class="uk-width-expand uk-text-left uk-margin-small-top">
                    <div class="uk-flex uk-flex-left" style="gap: 8px;">
                      <NuxtLink 
                        :to="'/vehicle/' + vehicle.slug"
                        class="nav-model-btn nav-model-btn--details"
                        @click="closeModel"
                      >
                        Details
                      </NuxtLink>
                      <NuxtLink
                        v-if="!vehicle.isComingSoon"
                        :to="'/calculator/' + vehicle.slug"
                        class="nav-model-btn nav-model-btn--enquire"
                        @click="closeModel"
                      >
                        Enquire
                      </NuxtLink>
                      <span
                        v-else
                        class="nav-model-btn nav-model-btn--coming-soon"
                      >
                        Coming Soon
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer links -->
    <div class="uk-width-1-1 menu-side-nav uk-margin-auto-top uk-background-default">
      <hr class="uk-margin-remove-bottom" />
      <div class="uk-padding uk-text-left">
        <div class="uk-text-muted uk-text-small space33">
          <div class="uk-width-1-1 uk-margin-small-bottom uk-h3 uk-text-bold">Explore more</div>
        </div>
        <ul class="uk-child-width-1-3@s uk-child-width-expand@m uk-grid-collapse uk-grid">
          <li class="uk-margin-small-top">
            <NuxtLink to="/special-offers" class="uk-button uk-button-text uk-text-light uk-text-primary uk-text-bold uk-text-capitalize uk-width-auto" @click="closeModel">
              Latest Offers
            </NuxtLink>
          </li>
          <li class="uk-margin-small-top">
            <NuxtLink to="/car-sales?condition=used" class="uk-button uk-button-text uk-text-light uk-text-primary uk-text-bold uk-text-capitalize uk-width-auto" @click="closeModel">
              Used Cars
            </NuxtLink>
          </li>
          <li class="uk-margin-small-top">
            <NuxtLink to="/build-and-price" class="uk-button uk-button-text uk-text-light uk-text-primary uk-text-bold uk-text-capitalize uk-width-auto" @click="closeModel">
              Build & price
            </NuxtLink>
          </li>
          <li class="uk-margin-small-top">
            <NuxtLink to="/accessories" class="uk-button uk-button-text uk-text-light uk-text-primary uk-text-bold uk-text-capitalize uk-width-auto" @click="closeModel">
              Accessories
            </NuxtLink>
          </li>
          <li class="uk-margin-small-top">
            <NuxtLink to="/finance" class="uk-button uk-button-text uk-text-light uk-text-primary uk-text-bold uk-text-capitalize uk-width-auto" @click="closeModel">
              Finance options
            </NuxtLink>
          </li>
          <li class="uk-margin-small-top">
            <NuxtLink to="/sell-my-car" class="uk-button uk-button-text uk-text-light uk-text-primary uk-text-bold uk-text-capitalize uk-width-auto" @click="closeModel">
              Sell your car
            </NuxtLink>
          </li>
          <li class="uk-margin-small-top last-column">
            <NuxtLink to="/test-drive" class="uk-button uk-button-text uk-text-light uk-text-primary uk-text-bold uk-text-capitalize uk-width-auto" @click="closeModel">
              Book a test drive
            </NuxtLink>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { $uikit } = useNuxtApp();

// State
const selectedCategory = ref('All');
const itemToShow = ref<number | null>(null);
const showMobileFilter = ref(false);

// Use shared composable to avoid duplicate fetches
const { groupedByCategory, vehicleCategories, pending } = useAllVariants();

// Computed
const groupedVehicles = computed(() => {
  const grouped = groupedByCategory.value || {};
  
  // When "All" is selected, show all grouped by category
  if (selectedCategory.value === 'All') {
    const result: Record<string, any[]> = {};
    Object.entries(grouped).forEach(([categoryName, categoryData]: [string, any]) => {
      const models = categoryData.models || categoryData;
      if (Array.isArray(models) && models.length > 0) {
        result[categoryName] = models;
      }
    });
    return result;
  }
  
  // When a specific category is selected
  if (grouped[selectedCategory.value]) {
    const categoryData = grouped[selectedCategory.value];
    const models = categoryData.models || categoryData;
    if (Array.isArray(models) && models.length > 0) {
      return { [selectedCategory.value]: models };
    }
  }
  
  return {};
});

// Methods
const selectCategory = (category: string, index: number) => {
  selectedCategory.value = category;
  itemToShow.value = index;
  showMobileFilter.value = false;
};

const closeModel = () => {
  if (import.meta.client) {
    const dropdown = document.getElementById('vehicle-nav-dropdown');
    
    if (dropdown) {
      // Match the exact classes and styles used by PrimaryNav.vue's hideModelsMenu
      dropdown.classList.add('hidden', 'opacity-0', '-translate-y-2.5');
      dropdown.classList.remove('opacity-100', 'translate-y-0');
      dropdown.style.display = 'none';
    }
    
    // Also handle offcanvas if open (for mobile)
    const modelsModal = document.getElementById('offcanvas-models');
    if ($uikit && modelsModal) {
      try {
        $uikit.offcanvas(modelsModal)?.hide();
      } catch (e) {
        // Ignore errors
      }
    }
  }
};

const capitalizeFirstLetter = (str: string) => {
  if (typeof str !== 'string') return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};
</script>

<style scoped>
/* Sticky category filters */
.showroomnav {
  position: sticky;
  top: 0;
  z-index: 10;
  background: #001E50;
  margin: 0;
  padding: 0;
}

.model-Cat-Btn {
  padding: 15px 20px;
  white-space: nowrap;
  color: #fff;
}

.model-Cat-Btn:hover {
  color: #00aad2;
}

.uk-subnav > .uk-active > .model-Cat-Btn {
  color: #00aad2;
  border-bottom: 2px solid #00aad2;
}

/* Close button in sticky header */
.close-btn {
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
}

.close-link {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px;
  opacity: 0.8;
  transition: opacity 0.2s;
  background: none;
  border: none;
  cursor: pointer;
}

.close-link:hover {
  opacity: 1;
}

.close-link svg {
  display: block;
}

.vehicle-item {
  transition: transform 0.2s;
  padding: 12px 8px;
}

.vehicle-item:hover {
  transform: translateY(-3px);
}

/* Nav model buttons */
.nav-model-btn {
  display: inline-block;
  padding: 6px 14px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-radius: 4px;
  text-decoration: none !important;
  transition: all 0.2s ease;
}

.nav-model-btn--details {
  background: transparent;
  border: 2px solid #002c5f;
  color: #002c5f !important;
}

.nav-model-btn--details:hover {
  background: #002c5f;
  color: #fff !important;
}

.nav-model-btn--enquire {
  background: #002c5f;
  border: 2px solid #002c5f;
  color: #fff !important;
}

.nav-model-btn--enquire:hover {
  background: #004080;
  border-color: #004080;
  color: #fff !important;
}

.nav-model-btn--coming-soon {
  background: #6b7280;
  border: 2px solid #6b7280;
  color: #fff !important;
  cursor: default;
}

/* Vehicle image container - consistent aspect ratio */
.vehicle-image-container {
  position: relative;
  aspect-ratio: 550 / 300;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
}

/* Vehicle thumbnail - fit within container */
.vehicle-thumbnail {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
}

/* Scrollable content area */
.showroom-menu {
  display: flex;
  flex-direction: column;
}

/* Footer links sticky at bottom */
.menu-side-nav {
  position: sticky;
  bottom: 0;
  z-index: 10;
  background: #fff;
  border-top: 1px solid #e5e5e5;
}
</style>








