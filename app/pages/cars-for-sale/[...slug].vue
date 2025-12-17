<template>
  <div class="taxonomy-page">
    <LazyPageSchema />

    <!-- Page Header -->
    <div class="uk-section uk-section-small uk-background-secondary uk-light">
      <div class="uk-container">
        <nav aria-label="Breadcrumb" class="uk-margin-small-bottom">
          <ul class="uk-breadcrumb uk-margin-remove">
            <li><NuxtLink to="/">Home</NuxtLink></li>
            <li><NuxtLink to="/car-sales">Car Sales</NuxtLink></li>
            <li v-if="condition"><NuxtLink :to="`/cars-for-sale/${condition}`">{{ titleCase(condition) }}</NuxtLink></li>
            <li v-if="make"><NuxtLink :to="`/cars-for-sale/${condition}/${make}`">{{ titleCase(make) }}</NuxtLink></li>
            <li v-if="model" class="uk-disabled"><span>{{ titleCase(model) }}</span></li>
          </ul>
        </nav>
        <h1 class="uk-h2 uk-margin-remove">{{ pageTitle }}</h1>
        <p v-if="totalCount > 0" class="uk-text-meta uk-margin-small-top">
          {{ totalCount }} vehicle{{ totalCount !== 1 ? 's' : '' }} found
        </p>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="uk-section uk-text-center">
      <div uk-spinner="ratio: 2"></div>
    </div>

    <!-- Results -->
    <div v-else class="uk-section">
      <div class="uk-container">
        <!-- No Results -->
        <div v-if="vehicles.length === 0" class="uk-text-center">
          <p class="uk-text-large uk-text-muted">No vehicles found matching your criteria.</p>
          <NuxtLink to="/car-sales" class="uk-button uk-button-primary uk-margin-top">
            View All Vehicles
          </NuxtLink>
        </div>

        <!-- Vehicle Grid -->
        <div v-else class="uk-grid uk-grid-medium uk-child-width-1-2@s uk-child-width-1-3@m uk-child-width-1-4@l" uk-grid>
          <div v-for="vehicle in vehicles" :key="vehicle.id">
            <div class="uk-card uk-card-default uk-card-hover">
              <div class="uk-card-media-top uk-position-relative">
                <NuxtLink :to="`/vehicle-for-sale/${vehicle.id}/${vehicle.slug}`">
                  <NuxtImg
                    :src="vehicle.images?.[0] || vehicle.image"
                    :alt="vehicle.title"
                    class="uk-width-1-1"
                    loading="lazy"
                    width="400"
                    height="300"
                    format="webp"
                    quality="80"
                  />
                </NuxtLink>
                <span v-if="vehicle.condition" class="condition-badge" :class="vehicle.condition.toLowerCase()">
                  {{ vehicle.condition }}
                </span>
              </div>
              <div class="uk-card-body uk-padding-small">
                <h3 class="uk-card-title uk-margin-small-bottom">
                  <NuxtLink :to="`/vehicle-for-sale/${vehicle.id}/${vehicle.slug}`" class="uk-link-reset">
                    {{ vehicle.title || `${vehicle.year} ${vehicle.make} ${vehicle.model}` }}
                  </NuxtLink>
                </h3>
                <div class="uk-h4 uk-text-primary uk-margin-remove">
                  {{ vehicle.price ? `$${vehicle.price.toLocaleString()}` : 'POA' }}
                </div>
                <ul class="uk-list uk-text-small uk-text-muted uk-margin-small-top">
                  <li v-if="vehicle.year">{{ vehicle.year }}</li>
                  <li v-if="vehicle.odometer">{{ vehicle.odometer.toLocaleString() }} km</li>
                  <li v-if="vehicle.transmission">{{ vehicle.transmission }}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="uk-margin-large-top uk-text-center">
          <ul class="uk-pagination uk-flex-center">
            <li :class="{ 'uk-disabled': currentPage === 1 }">
              <a href="#" @click.prevent="goToPage(currentPage - 1)">
                <span uk-pagination-previous></span>
              </a>
            </li>
            <li v-for="page in visiblePages" :key="page" :class="{ 'uk-active': page === currentPage }">
              <a href="#" @click.prevent="goToPage(page)">{{ page }}</a>
            </li>
            <li :class="{ 'uk-disabled': currentPage === totalPages }">
              <a href="#" @click.prevent="goToPage(currentPage + 1)">
                <span uk-pagination-next></span>
              </a>
            </li>
          </ul>
        </div>

        <!-- SEO Content -->
        <div class="uk-margin-large-top uk-section uk-section-muted uk-padding">
          <h2>{{ seoHeading }}</h2>
          <div v-html="seoContent"></div>
        </div>

        <!-- Related Links -->
        <div v-if="relatedLinks.length > 0" class="uk-margin-large-top">
          <h3>Browse More</h3>
          <div class="uk-grid uk-grid-small uk-child-width-auto" uk-grid>
            <div v-for="link in relatedLinks" :key="link.path">
              <NuxtLink :to="link.path" class="uk-button uk-button-default uk-button-small">
                {{ link.label }}
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute();

// Parse URL params
const slug = computed(() => {
  const params = route.params.slug;
  return Array.isArray(params) ? params : [params];
});

const condition = computed(() => slug.value[0] || '');
const make = computed(() => slug.value[1] || '');
const model = computed(() => slug.value[2] || '');

// State
const loading = ref(true);
const vehicles = ref<any[]>([]);
const totalCount = ref(0);
const currentPage = ref(1);
const perPage = 24;

// Computed
const totalPages = computed(() => Math.ceil(totalCount.value / perPage));

const visiblePages = computed(() => {
  const pages: number[] = [];
  const start = Math.max(1, currentPage.value - 2);
  const end = Math.min(totalPages.value, start + 4);
  
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  return pages;
});

const pageTitle = computed(() => {
  const parts: string[] = [];
  
  if (condition.value) {
    parts.push(titleCase(condition.value));
  }
  if (make.value) {
    parts.push(titleCase(make.value));
  }
  if (model.value) {
    parts.push(titleCase(model.value));
  }
  
  if (parts.length === 0) {
    return 'Cars for Sale';
  }
  
  return `${parts.join(' ')} Cars for Sale`;
});

const seoHeading = computed(() => {
  if (model.value && make.value) {
    return `${titleCase(make.value)} ${titleCase(model.value)} for Sale`;
  }
  if (make.value) {
    return `${titleCase(make.value)} Cars for Sale`;
  }
  if (condition.value) {
    return `${titleCase(condition.value)} Cars for Sale`;
  }
  return 'Cars for Sale';
});

const seoContent = computed(() => {
  if (make.value === 'hyundai') {
    return `<p>Browse our selection of quality ${condition.value || ''} Hyundai ${model.value || 'vehicles'} at Sale Hyundai. As your local Hyundai dealer, we offer competitive prices and expert service on all our vehicles.</p>`;
  }
  return `<p>Find your perfect ${condition.value || ''} ${make.value || ''} ${model.value || 'car'} at Sale Hyundai. We stock a wide range of quality vehicles with competitive pricing and flexible finance options.</p>`;
});

const relatedLinks = computed(() => {
  const links: { path: string; label: string }[] = [];
  
  // If viewing a specific model, show other models
  if (model.value && make.value) {
    links.push({ path: `/cars-for-sale/${condition.value}/${make.value}`, label: `All ${titleCase(make.value)}` });
  }
  
  // If viewing a make, show condition options
  if (make.value && !model.value) {
    if (condition.value !== 'new') {
      links.push({ path: `/cars-for-sale/new/${make.value}`, label: `New ${titleCase(make.value)}` });
    }
    if (condition.value !== 'used') {
      links.push({ path: `/cars-for-sale/used/${make.value}`, label: `Used ${titleCase(make.value)}` });
    }
    if (condition.value !== 'demo') {
      links.push({ path: `/cars-for-sale/demo/${make.value}`, label: `Demo ${titleCase(make.value)}` });
    }
  }
  
  // Always show all vehicles link
  links.push({ path: '/car-sales', label: 'All Vehicles' });
  
  return links;
});

// Fetch vehicles
onMounted(async () => {
  await fetchVehicles();
});

watch(() => route.params.slug, () => {
  currentPage.value = 1;
  fetchVehicles();
});

const fetchVehicles = async () => {
  loading.value = true;
  
  try {
    const params: Record<string, any> = {
      page: currentPage.value,
      limit: perPage,
    };
    
    if (condition.value) params.condition = condition.value;
    if (make.value) params.make = make.value;
    if (model.value) params.model = model.value;
    
    const response = await $fetch<any>('/api/search', { params });
    
    vehicles.value = response.vehicles || [];
    totalCount.value = response.total || vehicles.value.length;
  } catch (err) {
    console.error('Failed to fetch vehicles:', err);
    vehicles.value = [];
  } finally {
    loading.value = false;
  }
};

const goToPage = (page: number) => {
  if (page < 1 || page > totalPages.value) return;
  currentPage.value = page;
  fetchVehicles();
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// Helper
const titleCase = (str: string) => {
  if (!str) return '';
  return str.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

// SEO
useSiteMeta({
  title: pageTitle,
  description: () => `Browse ${totalCount.value} ${condition.value || ''} ${make.value || ''} ${model.value || ''} cars for sale at Sale Hyundai. Competitive prices and finance available.`,
});
</script>

<style scoped>
.uk-card-media-top {
  position: relative;
}

.uk-card-media-top img {
  aspect-ratio: 4/3;
  object-fit: cover;
}

.condition-badge {
  position: absolute;
  top: 10px;
  left: 10px;
  padding: 4px 10px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  border-radius: 4px;
  color: white;
}

.condition-badge.new {
  background: #32d296;
}

.condition-badge.demo {
  background: #faa05a;
}

.condition-badge.used {
  background: #666;
}

.uk-card-title {
  font-size: 0.95rem;
  line-height: 1.3;
}
</style>







