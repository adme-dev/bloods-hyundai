<template>
  <div class="vehicles-page">
    <!-- Page Schema -->
    <LazyPageSchema />
    
    <!-- Page Content from CMS -->
    <LazyPostContent v-if="page?.content?.rendered" :content="page.content.rendered" />

    <div class="uk-flex uk-grid-collapse uk-overflow-auto uk-background-default">
      <div class="uk-width-1-1" id="model-Cat">
        <div class="showroom-menu">
          <!-- Category Filter Tabs -->
          <ul class="uk-subnav uk-flex uk-flex-center@s uk-flex-nowrap uk-overflow-auto uk-light" uk-sticky>
            <li :class="{ 'uk-active': selectedCategory === 'All' }">
              <a 
                href="#model-Cat" 
                @click.prevent="selectedCategory = 'All'" 
                class="uk-text-bold"
                uk-scroll
              >
                All
              </a>
            </li>
            <li 
              v-for="category in categories" 
              :key="category"
              :class="{ 'uk-active': selectedCategory === category }"
            >
              <a 
                href="#model-Cat" 
                @click.prevent="selectedCategory = category"
                class="uk-text-bold"
                uk-scroll
              >
                <span v-html="category"></span>
              </a>
            </li>
            <li>
              <NuxtLink to="/car-sales?condition=used&make=hyundai" class="uk-text-bold">
                Used Hyundai's
              </NuxtLink>
            </li>
          </ul>

          <!-- Models Grid -->
          <div class="uk-width-1-1">
            <div 
              v-for="(models, categoryName) in groupedModels" 
              :key="categoryName"
              class="uk-margin-medium-bottom"
            >
              <div class="uk-margin-medium-left">
                <h2 class="uk-h3 uk-text-bold uk-margin-remove" v-html="categoryName"></h2>
                <p v-if="models[0]?.segment_desc" class="uk-text-muted" v-html="models[0].segment_desc"></p>
              </div>
              <hr class="uk-margin-remove" />
              
              <div class="uk-margin-medium-left uk-grid-collapse uk-flex uk-flex-left" uk-grid>
                <div 
                  v-for="model in models" 
                  :key="model.id"
                  class="uk-width-1-2@s uk-width-1-4@l uk-width-1-5@xl model-item"
                >
                  <div class="uk-padding-small">
                    <!-- Model Image -->
                    <NuxtLink :to="modelLink(model)" class="uk-text-muted uk-display-block">
                      <NuxtImg
                        :src="model.model_image || model.image"
                        :alt="model.title?.rendered || model.title"
                        class="uk-display-block uk-width-1-1"
                        width="357"
                        height="137"
                        loading="lazy"
                        format="webp"
                        quality="80"
                      />
                    </NuxtLink>

                    <div class="uk-margin-small-top">
                      <!-- Model Title -->
                      <div class="uk-text-bold uk-text-secondary uk-text-uppercase">
                        {{ model.title?.rendered || model.title }}
                      </div>

                      <!-- Pricing -->
                      <div v-if="model.startingPrice" class="uk-margin-small-top">
                        <div class="uk-text-muted uk-text-small">From</div>
                        <div class="uk-text-bold uk-text-primary">{{ model.startingPrice }}</div>
                      </div>

                      <!-- Actions -->
                      <div class="uk-margin-small-top uk-child-width-auto uk-grid-small" uk-grid>
                        <div>
                          <NuxtLink 
                            :to="`/vehicle/${model.slug}`"
                            class="uk-button uk-button-text uk-button-small uk-text-capitalize"
                          >
                            Details
                          </NuxtLink>
                        </div>
                        <div>
                          <NuxtLink 
                            :to="`/variant/${model.variant_link || model.slug}`"
                            class="uk-button uk-button-text uk-button-small uk-text-capitalize"
                          >
                            Enquire
                          </NuxtLink>
                        </div>
                        <div v-if="!model.form">
                          <NuxtLink 
                            :to="`/build/${model.slug}`"
                            class="uk-button uk-button-text uk-button-small uk-text-capitalize"
                          >
                            Range
                          </NuxtLink>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Explore More Section -->
      <div class="uk-width-1-1 uk-border-top">
        <hr class="uk-margin-remove-bottom" />
        <div class="uk-padding uk-text-left">
          <h3 class="uk-h3 uk-text-bold uk-margin-small-bottom">Explore more</h3>
          <ul class="uk-child-width-1-3@s uk-child-width-expand@m uk-grid-collapse uk-grid" uk-margin>
            <li class="uk-margin-small-top">
              <NuxtLink to="/special-offers" class="uk-button uk-button-text uk-text-primary uk-text-bold">
                Latest Offers
              </NuxtLink>
            </li>
            <li class="uk-margin-small-top">
              <NuxtLink to="/car-sales?condition=used" class="uk-button uk-button-text uk-text-primary uk-text-bold">
                Used Cars
              </NuxtLink>
            </li>
            <li class="uk-margin-small-top">
              <NuxtLink to="/build-and-price" class="uk-button uk-button-text uk-text-primary uk-text-bold">
                Build & Price
              </NuxtLink>
            </li>
            <li class="uk-margin-small-top">
              <NuxtLink to="/test-drive" class="uk-button uk-button-text uk-text-primary uk-text-bold">
                Book a Test Drive
              </NuxtLink>
            </li>
            <li class="uk-margin-small-top">
              <NuxtLink to="/sell-my-car" class="uk-button uk-button-text uk-text-primary uk-text-bold">
                Sell Your Car
              </NuxtLink>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const config = useRuntimeConfig();
const mainStore = useMainStore();

// State
const page = ref<any>(null);
const selectedCategory = ref('All');

// Fetch page content
onMounted(async () => {
  try {
    const response = await $fetch<any>('/api/page/vehicles');
    page.value = response?.page || response;
  } catch (err) {
    console.error('Failed to fetch vehicles page:', err);
  }
});

// Computed
const vehicles = computed(() => mainStore.models || []);

const categories = computed(() => {
  if (!vehicles.value.length) return [];
  return [...new Set(vehicles.value.map((v: any) => v.vehiclecat).filter(Boolean))];
});

const filteredVehicles = computed(() => {
  if (selectedCategory.value === 'All') {
    return vehicles.value;
  }
  return vehicles.value.filter((v: any) => v.vehiclecat === selectedCategory.value);
});

const groupedModels = computed(() => {
  const grouped: Record<string, any[]> = {};
  filteredVehicles.value.forEach((model: any) => {
    const category = model.vehiclecat || 'Other';
    if (!grouped[category]) grouped[category] = [];
    grouped[category].push(model);
  });
  return grouped;
});

// Methods
const modelLink = (model: any) => {
  if (model.form) {
    return `/vehicle/${model.slug}`;
  }
  return `/build/${model.slug}`;
};

// SEO
useSiteMeta({
  title: 'New Hyundai Vehicles | Browse All Models',
  description: 'Explore the complete range of new Hyundai vehicles. Find your perfect car, SUV, or EV today.',
});
</script>

<style lang="scss" scoped>
.model-item {
  transition: background-color 0.2s;
  
  &:hover {
    background-color: rgba(0, 0, 0, 0.02);
  }
}

.showroom-menu {
  .uk-subnav {
    background: #1a1a1a;
    padding: 10px 20px;
    margin: 0;
    
    li a {
      color: #fff;
      padding: 10px 15px;
      
      &:hover {
        color: #00aad2;
      }
    }
    
    li.uk-active a {
      color: #00aad2;
      border-bottom: 2px solid #00aad2;
    }
  }
}
</style>
