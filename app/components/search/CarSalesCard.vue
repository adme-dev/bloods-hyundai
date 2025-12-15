<template>
  <div 
    class="car-sales-card uk-card uk-card-default uk-card-hover"
    :class="{ 'card-list': viewMode === 'list' }"
  >
    <!-- Save Button -->
    <button 
      class="save-button"
      :class="{ 'is-saved': isSaved }"
      @click.stop="toggleSave"
      :title="isSaved ? 'Remove from saved' : 'Save vehicle'"
    >
      <span :uk-icon="isSaved ? 'heart' : 'heart'"></span>
    </button>

    <!-- Image -->
    <div class="uk-card-media-top">
      <NuxtLink :to="vehicleLink">
        <img 
          :src="vehicle.thumb || vehicle.images?.[0] || '/images/placeholder-car.jpg'" 
          :alt="vehicleTitle"
          loading="lazy"
          class="vehicle-image"
        />
      </NuxtLink>
      
      <!-- Badges -->
      <div class="vehicle-badges">
        <span v-if="isNew" class="badge badge-new">New</span>
        <span v-if="isDemoOrRunout" class="badge badge-demo">Demo</span>
      </div>
    </div>

    <!-- Content -->
    <div class="uk-card-body">
      <NuxtLink :to="vehicleLink" class="vehicle-title-link">
        <h3 class="uk-card-title vehicle-title">{{ vehicleTitle }}</h3>
      </NuxtLink>

      <p class="vehicle-subtitle uk-text-muted">
        {{ vehicleSubtitle }}
      </p>

      <!-- Specs -->
      <div class="vehicle-specs uk-grid uk-grid-small uk-child-width-1-2" uk-grid>
        <div v-if="vehicle.odometer?.displayValue">
          <span class="spec-label">Kms</span>
          <span class="spec-value">{{ vehicle.odometer.displayValue[0] }}</span>
        </div>
        <div v-if="vehicle.transmission?.displayValue">
          <span class="spec-label">Trans</span>
          <span class="spec-value">{{ vehicle.transmission.displayValue[0] }}</span>
        </div>
        <div v-if="vehicle.fuel?.displayValue">
          <span class="spec-label">Fuel</span>
          <span class="spec-value">{{ vehicle.fuel.displayValue[0] }}</span>
        </div>
        <div v-if="vehicle.colour?.displayValue">
          <span class="spec-label">Colour</span>
          <span class="spec-value">{{ vehicle.colour.displayValue[0] }}</span>
        </div>
      </div>

      <!-- Price -->
      <div class="vehicle-price">
        <span v-if="priceDisplay" class="price-amount">{{ priceDisplay }}</span>
        <span v-else class="price-poa">Price on Application</span>
        <span v-if="priceType" class="price-type">{{ priceType }}</span>
      </div>
    </div>

    <!-- Actions -->
    <div class="uk-card-footer">
      <div class="uk-grid uk-grid-small" uk-grid>
        <div class="uk-width-1-2">
          <NuxtLink 
            :to="vehicleLink" 
            class="uk-button uk-button-primary uk-button-small uk-width-1-1"
          >
            View Details
          </NuxtLink>
        </div>
        <div class="uk-width-1-2">
          <button 
            class="uk-button uk-button-default uk-button-small uk-width-1-1"
            @click="openEnquiry"
          >
            Enquire
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  vehicle: any;
  viewMode?: 'grid' | 'list';
}

const props = withDefaults(defineProps<Props>(), {
  viewMode: 'grid',
});

const vehiclesStore = useVehiclesStore();

// Computed
const vehicleTitle = computed(() => {
  const year = props.vehicle.year?.displayValue?.[0] || '';
  const make = props.vehicle.make?.displayValue?.[0] || '';
  const model = props.vehicle.model?.displayValue?.[0] || '';
  return `${year} ${make} ${model}`.trim() || props.vehicle.title || 'Vehicle';
});

const vehicleSubtitle = computed(() => {
  return props.vehicle.variant?.displayValue?.[0] || 
         props.vehicle.badge?.displayValue?.[0] || 
         '';
});

const vehicleLink = computed(() => {
  const stockId = props.vehicle.stockid || '';
  const slug = slugify(vehicleTitle.value);
  return `/vehicle-for-sale/${stockId}/${slug}`;
});

const priceDisplay = computed(() => {
  const price = props.vehicle.price?.value;
  if (price && price > 0) {
    return `$${price.toLocaleString()}`;
  }
  return null;
});

const priceType = computed(() => {
  return props.vehicle.priceType?.displayValue?.[0] || 'Drive Away';
});

const isNew = computed(() => {
  const condition = props.vehicle.condition?.displayValue?.[0]?.toLowerCase();
  return condition === 'new';
});

const isDemoOrRunout = computed(() => {
  const condition = props.vehicle.condition?.displayValue?.[0]?.toLowerCase();
  return condition === 'demo' || condition === 'demonstrator' || condition === 'runout';
});

const isSaved = computed(() => {
  return vehiclesStore.savedVehicles.includes(props.vehicle.stockid);
});

// Methods
const toggleSave = () => {
  vehiclesStore.toggleSavedVehicle(props.vehicle);
};

// Analytics tracking
const { trackEnquiryModalOpen } = useAnalytics();

const openEnquiry = () => {
  trackEnquiryModalOpen({
    vehicle: props.vehicle,
    source: 'card_click',
  });
  vehiclesStore.setVehicleEnquiryPopUp(true, props.vehicle);
};

const slugify = (text: string) => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
};
</script>

<style lang="scss" scoped>
.car-sales-card {
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  overflow: hidden;

  &.card-list {
    flex-direction: row;

    .uk-card-media-top {
      width: 300px;
      flex-shrink: 0;
    }

    .uk-card-body {
      flex: 1;
    }

    .uk-card-footer {
      width: 200px;
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
  }
}

.save-button {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 10;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: white;
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &:hover {
    transform: scale(1.1);
  }

  &.is-saved {
    background: var(--color-primary);
    color: white;
  }
}

.uk-card-media-top {
  position: relative;
  overflow: hidden;
}

.vehicle-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.uk-card:hover .vehicle-image {
  transform: scale(1.05);
}

.vehicle-badges {
  position: absolute;
  bottom: 12px;
  left: 12px;
  display: flex;
  gap: 8px;
}

.badge {
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;

  &.badge-new {
    background: var(--color-primary);
    color: white;
  }

  &.badge-demo {
    background: var(--color-secondary);
    color: white;
  }
}

.uk-card-body {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.vehicle-title-link {
  text-decoration: none;
  color: inherit;
}

.vehicle-title {
  font-size: 1.125rem;
  margin-bottom: 4px;
  line-height: 1.3;
}

.vehicle-subtitle {
  font-size: 0.875rem;
  margin-bottom: 16px;
}

.vehicle-specs {
  margin-bottom: 16px;
  font-size: 0.8rem;

  .spec-label {
    display: block;
    color: #999;
    margin-bottom: 2px;
  }

  .spec-value {
    display: block;
    color: #333;
    font-weight: 500;
  }
}

.vehicle-price {
  margin-top: auto;

  .price-amount {
    display: block;
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--color-primary);
  }

  .price-poa {
    display: block;
    font-size: 1.125rem;
    color: #666;
  }

  .price-type {
    font-size: 0.75rem;
    color: #999;
    text-transform: uppercase;
  }
}

.uk-card-footer {
  padding-top: 0;
}
</style>






