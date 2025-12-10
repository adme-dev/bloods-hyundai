<template>
  <div v-if="vehicles.length > 0" class="single-related" uk-slider>
    <div class="uk-grid-small uk-margin-medium-top" uk-grid>
      <h6 class="uk-width-1-1 uk-padding uk-text-center uk-h3">
        <span class="uk-text-bold">Related </span>
        <span>{{ model }}</span>
      </h6>
    </div>

    <!-- Category Filter -->
    <ul v-if="vehicleCategories.length > 1" class="model-category uk-tab uk-margin-small uk-flex uk-flex-center">
      <li v-for="category in vehicleCategories" :key="category" class="uk-padding-remove">
        <label class="uk-button uk-text-bold" :class="{ 'uk-button-primary': isChecked(category) }">
          <input 
            class="uk-checkbox uk-hidden" 
            type="checkbox" 
            :value="category" 
            v-model="checkedCategories"
          />
          {{ category }}
        </label>
      </li>
    </ul>

    <div class="uk-container uk-container-expand uk-visible-toggle">
      <ul
        class="uk-slider-items uk-flex uk-flex-center@s uk-child-width-1-2 uk-child-width-1-3@s uk-child-width-1-4@l uk-grid-match related-slider"
        uk-height-match="target: > li > .uk-card"
      >
        <li v-for="vehicle in filteredVehicles" :key="vehicle.stockid">
          <div class="uk-card uk-card-default scroll-card uk-box-shadow-hover-medium">
            <NuxtLink :to="getVehicleLink(vehicle)" class="uk-link-reset">
              <!-- Price Section -->
              <div class="uk-text-left uk-padding-small">
                <div v-if="vehicle.price" class="uk-width-1-1">
                  <div class="uk-margin-small-top uk-text-secondary uk-text-light">DRIVEAWAY</div>
                  <div>
                    <span class="uk-h3 uk-text-bold uk-margin-remove">
                      ${{ formatNumber(vehicle.price) }}<sup>*</sup>
                    </span>
                  </div>
                  <div class="uk-h5 uk-margin-remove uk-text-secondary uk-text-capitalize">
                    {{ vehicle.condition?.displayValue?.[0] }}
                    {{ vehicle.year?.displayValue?.[0] }}
                    {{ vehicle.make?.value?.[0] }}
                    {{ vehicle.model?.value?.[0] }}
                  </div>
                  <div class="uk-text-secondary uk-text-uppercase uk-text-light">
                    {{ vehicle.badge?.displayValue?.[0] }} {{ vehicle.series?.value?.[0] }}
                  </div>
                </div>
                <div v-else class="uk-width-1-1">
                  <div class="uk-margin-small-top uk-text-light">Price On Application</div>
                  <div><span class="uk-h3 uk-text-bold uk-margin-remove">P.O.A</span></div>
                  <div class="uk-h5 uk-margin-remove uk-text-secondary uk-text-capitalize">
                    {{ vehicle.condition?.displayValue?.[0] }}
                    {{ vehicle.year?.displayValue?.[0] }}
                    {{ vehicle.make?.value?.[0] }}
                    {{ vehicle.model?.value?.[0] }}
                  </div>
                </div>
              </div>

              <!-- Image -->
              <div class="uk-card-media-top uk-position-relative">
                <div 
                  v-if="vehicle.thumb || vehicle.photos?.length"
                  class="uk-inline uk-width-1-1 img-height-medium uk-background-cover"
                  :style="{ backgroundImage: `url(${vehicle.thumb || vehicle.photos?.[0]})` }"
                ></div>
                <div 
                  v-else
                  class="uk-inline uk-width-1-1 img-height-medium uk-background-cover uk-background-muted uk-flex uk-flex-center uk-flex-middle"
                >
                  <span uk-icon="icon: image; ratio: 2" class="uk-text-muted"></span>
                </div>
              </div>

              <!-- Specs -->
              <div class="uk-card-body uk-padding-small">
                <div class="uk-grid-divider uk-grid-small uk-child-width-1-4 body-specs uk-text-center" uk-grid>
                  <div>
                    <div class="rel-text-bold">{{ vehicle.drivetrain?.displayValue?.[0] || '-' }}</div>
                    <div class="v-text-meta">Drive</div>
                  </div>
                  <div>
                    <div class="rel-text-bold">{{ vehicle.seats?.displayValue?.[0] || '-' }}</div>
                    <div class="v-text-meta">Seats</div>
                  </div>
                  <div>
                    <div class="rel-text-bold">
                      {{ getTransmissionShort(vehicle.transmission?.displayValue?.[0]) }}
                    </div>
                    <div class="v-text-meta">Trans</div>
                  </div>
                  <div>
                    <div class="rel-text-bold">{{ formatKms(vehicle.kms) }}</div>
                    <div class="v-text-meta">Kms</div>
                  </div>
                </div>
              </div>
            </NuxtLink>
          </div>
        </li>
      </ul>
    </div>

    <!-- Slider Nav -->
    <ul class="uk-slider-nav uk-dotnav uk-flex-center uk-margin uk-visible@s"></ul>
    <div class="uk-flex uk-flex-center">
      <a class="tm-slidenav" href="#" uk-slider-item="previous" uk-slidenav-previous></a>
      <a class="tm-slidenav" href="#" uk-slider-item="next" uk-slidenav-next></a>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  model: string;
  vehicleId: string | number;
}>();

const vehiclesStore = useVehiclesStore();

// State
const checkedCategories = ref<string[]>([]);

// Get related vehicles
const vehicles = computed(() => {
  if (!vehiclesStore.vehicles.length) return [];
  
  return vehiclesStore.vehicles.filter(v => 
    v.model?.displayValue?.[0]?.toLowerCase() === props.model.toLowerCase() &&
    v.stockid !== props.vehicleId &&
    v.id !== props.vehicleId
  ).slice(0, 12);
});

// Get unique categories (badges)
const vehicleCategories = computed(() => {
  if (!vehicles.value.length) return [];
  return [...new Set(vehicles.value.map(v => v.badge?.displayValue?.[0]).filter(Boolean))];
});

// Filter vehicles by selected categories
const filteredVehicles = computed(() => {
  if (!checkedCategories.value.length) return vehicles.value;
  return vehicles.value.filter(v => 
    checkedCategories.value.includes(v.badge?.displayValue?.[0])
  );
});

// Helpers
const isChecked = (category: string) => checkedCategories.value.includes(category);

const getVehicleLink = (vehicle: any) => {
  const slug = (vehicle.title || '')
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-');
  return `/vehicle-for-sale/${vehicle.stockid || vehicle.id}/${slug}`;
};

const formatNumber = (num: number) => {
  return num?.toLocaleString('en-AU') || '0';
};

const formatKms = (kms: number) => {
  if (!kms) return '0';
  if (kms >= 1000) {
    return Math.round(kms / 1000) + 'k';
  }
  return kms.toString();
};

const getTransmissionShort = (transmission: string) => {
  if (!transmission) return '-';
  if (transmission === 'Constantly Variable Transmission') return 'CVT';
  if (transmission.toLowerCase().includes('auto')) return 'Auto';
  if (transmission.toLowerCase().includes('manual')) return 'Manual';
  return transmission.substring(0, 4);
};
</script>

<style lang="scss" scoped>
.single-related {
  background: #f8f8f8;
  padding: 20px 0 40px;
}

.model-category {
  li {
    margin: 0 4px;
  }

  .uk-button {
    padding: 8px 16px;
    font-size: 12px;
    border-radius: 20px;
    background: white;
    border: 1px solid #ddd;
    
    &.uk-button-primary {
      background: var(--color-primary);
      color: white;
      border-color: var(--color-primary);
    }
  }
}

.related-slider {
  li {
    min-width: 280px;
    max-width: 300px;
  }
}

.scroll-card {
  margin: 10px;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 0 1px 1px rgba(0, 0, 0, 0.05);
  transition: all 0.3s;

  &:hover {
    opacity: 0.9;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
}

.img-height-medium {
  height: 160px;
}

.rel-text-bold {
  color: #333;
  font-size: 11px;
  font-weight: 700;
}

.v-text-meta {
  font-size: 9px;
  color: #999;
}

.body-specs {
  > div {
    padding: 4px;
  }
}

.tm-slidenav {
  margin: 0 10px;
  color: #666;

  &:hover {
    color: var(--color-primary);
  }
}
</style>





