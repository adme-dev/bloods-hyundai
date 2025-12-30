<template>
  <Transition name="fade-slide">
    <div v-if="isMounted && recentVehicles.length > 0" class="recently-viewed-card rounded-2xl border border-slate-200 bg-white p-4 shadow-sm" role="region" aria-label="Recently Viewed Vehicles">
    <div class="flex items-center justify-between mb-3">
      <div>
        <h3 class="text-base font-semibold text-slate-900 m-0">Recently Viewed Vehicles</h3>
        <p class="text-xs text-primary m-0 mt-0.5 cursor-pointer hover:underline" @click="showAll = true">
          Discover again
        </p>
      </div>
    </div>

    <div class="space-y-3">
      <NuxtLink
        v-for="vehicle in displayedVehicles"
        :key="vehicle.stockid || vehicle.id"
        :to="getVehicleLink(vehicle)"
        class="recently-viewed-item flex gap-3 no-underline group"
      >
        <!-- Vehicle Image -->
        <div class="recently-viewed-image flex-shrink-0">
          <NuxtImg
            v-if="vehicle.thumb || vehicle.photos?.[0]"
            :src="vehicle.thumb || vehicle.photos[0]"
            :alt="vehicle.title"
            width="72"
            height="54"
            loading="lazy"
            format="webp"
            quality="80"
            class="w-full h-full object-cover rounded"
          />
          <div v-else class="w-full h-full flex items-center justify-center bg-slate-100 rounded">
            <svg class="h-5 w-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        </div>

        <!-- Vehicle Info -->
        <div class="flex-1 min-w-0">
          <h4 class="text-sm font-semibold text-slate-900 m-0 line-clamp-2 group-hover:text-primary transition-colors">
            {{ vehicle.title }}
          </h4>
          <p class="text-xs text-slate-500 m-0 mt-1">
            <span v-if="vehicle.price" class="font-medium text-slate-700">
              ${{ formatNumber(vehicle.price) }}
            </span>
            <span v-else class="font-medium text-slate-700">POA</span>
            <span class="text-slate-400"> DRIVEAWAY</span>
          </p>
        </div>
      </NuxtLink>
    </div>

    <!-- Show more / Clear buttons -->
    <div v-if="recentVehicles.length > maxVisible" class="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
      <button
        type="button"
        class="text-xs font-medium text-primary hover:underline"
        @click="showAll = !showAll"
      >
        {{ showAll ? 'Show less' : `View all (${recentVehicles.length})` }}
      </button>
      <button
        type="button"
        class="text-xs text-slate-400 hover:text-slate-600"
        @click.stop="clearHistory"
      >
        Clear
      </button>
    </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
interface Props {
  currentVehicleId?: string | number
  maxVisible?: number
  allVehicles?: any[]
}

const props = withDefaults(defineProps<Props>(), {
  maxVisible: 3,
  allVehicles: () => [],
})

const vehiclesStore = useVehiclesStore()
const showAll = ref(false)
const isMounted = ref(false)

// Wait until client-side hydration is complete to prevent flash
onMounted(() => {
  nextTick(() => {
    isMounted.value = true
  })
})

// Get recently viewed vehicles, excluding current vehicle
// Uses allVehicles prop if available, falls back to store
const recentVehicles = computed(() => {
  // Access the reactive array - spread to convert Proxy/Ref to plain array
  const storeIds = vehiclesStore.recentlyViewed
  // Handle both Ref arrays and Proxy arrays from useLocalStorage
  let recentIds: (string | number)[] = []
  try {
    if (storeIds && typeof storeIds === 'object') {
      // If it's a proxy or array-like, spread it
      recentIds = Array.from(storeIds as Iterable<string | number>)
    }
  } catch {
    recentIds = []
  }
  
  // Use allVehicles prop if available, otherwise fall back to store
  const vehiclesList = props.allVehicles?.length > 0 ? props.allVehicles : vehiclesStore.vehicles
  
  if (!recentIds.length) return []
  if (!vehiclesList?.length) return []
  
  // Helper to normalize ID for comparison
  const normalizeId = (id: any) => String(id).trim().toLowerCase()
  const currentId = normalizeId(props.currentVehicleId)
  
  return recentIds
    .filter(id => normalizeId(id) !== currentId)
    .map(id => {
      const normalizedId = normalizeId(id)
      return vehiclesList.find((v: any) => 
        normalizeId(v.stockid) === normalizedId || 
        normalizeId(v.id) === normalizedId ||
        normalizeId(v.identifier) === normalizedId
      )
    })
    .filter(Boolean)
    .slice(0, 10)
})

const displayedVehicles = computed(() => {
  return showAll.value ? recentVehicles.value : recentVehicles.value.slice(0, props.maxVisible)
})

// Helpers
const getVehicleLink = (vehicle: any) => {
  const slug = (vehicle.title || '')
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
  return `/vehicle-for-sale/${vehicle.stockid || vehicle.id}/${slug}`
}

const formatNumber = (num: number) => {
  return num?.toLocaleString('en-AU') ?? ''
}

const clearHistory = () => {
  if (import.meta.client) {
    localStorage.removeItem('recentlyViewed')
    vehiclesStore.recentlyViewed = []
  }
}
</script>

<style scoped>
.recently-viewed-image {
  width: 72px;
  height: 54px;
  overflow: hidden;
  border-radius: 4px;
  background-color: #f1f5f9;
}

.recently-viewed-item {
  padding: 0.5rem;
  margin: -0.5rem;
  border-radius: 8px;
  transition: background-color 0.15s ease;
}

.recently-viewed-item:hover {
  background-color: #f8fafc;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Transition for smooth mount/unmount */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>



