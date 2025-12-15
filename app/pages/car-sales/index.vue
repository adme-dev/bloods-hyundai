<template>
  <div class="car-sales-page min-h-screen bg-slate-50 text-slate-900">
    <LazyPageSchema />

    <!-- Hero / Breadcrumb -->
    <section class="car-sales-header relative overflow-hidden">
      <!-- Background image with blur -->
      <div 
        class="absolute inset-0 scale-110 blur-sm"
        :style="headerBackgroundStyle"
      ></div>
      <!-- Overlay gradient -->
      <div class="absolute inset-0 bg-gradient-to-r from-[#001E50]/95 via-[#001E50]/65 to-[#001E50]/40"></div>
      <div class="relative z-10 max-w-7xl mx-auto px-4 py-6 lg:px-6 lg:py-8">
        <nav class="flex items-center gap-2 text-sm text-white/70 mb-4" aria-label="Breadcrumb">
          <NuxtLink to="/" class="hover:text-white transition-colors">Home</NuxtLink>
          <span>›</span>
          <span class="text-white">Cars for Sale</span>
        </nav>
        
        <h1 class="text-3xl md:text-4xl font-bold text-white mb-2">
          {{ pageTitle }}
        </h1>
        <p class="text-lg text-white/80">
          {{ pageSubtitle }}
        </p>
      </div>
    </section>

    <section class="relative mx-auto w-full max-w-full px-4 py-6 lg:px-8 lg:py-10">
      <!-- Mobile overlay backdrop -->
      <div
        v-if="showFiltersMobile"
        class="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-sm xl:hidden"
        @click="showFiltersMobile = false"
      />

      <div class="flex flex-col gap-6 xl:flex-row">
        <!-- Filters -->
        <aside
          :class="[
            'w-full xl:w-72 xl:sticky xl:top-4 xl:self-start xl:max-h-[calc(100vh-2rem)] xl:overflow-y-auto xl:scrollbar-thin xl:scrollbar-thumb-slate-300 xl:scrollbar-track-transparent',
            showFiltersMobile
              ? 'fixed inset-0 z-40 overflow-y-auto bg-white p-4 xl:static xl:p-0'
              : 'hidden xl:block'
          ]"
        >
          <div class="flex items-center justify-between xl:hidden mb-2">
            <h3 class="text-lg font-semibold text-slate-800">Filters</h3>
            <button
              class="rounded-full border border-slate-200 px-3 py-1 text-sm font-semibold text-slate-700"
              @click="showFiltersMobile = false"
            >
              Close
            </button>
          </div>

          <div class="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div class="flex items-center justify-between px-4 py-3">
              <div>
                <p class="text-xs font-semibold uppercase tracking-wide text-primary">Filters</p>
                <p class="text-base font-semibold text-slate-800">Refine your search</p>
              </div>
              <button
                v-if="hasActiveFilters"
                class="text-sm font-semibold text-primary hover:underline"
                @click="clearFilters"
              >
                Clear
              </button>
            </div>
            <div class="space-y-3 border-t border-slate-100 px-4 py-4">
              <div class="relative">
                <span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" uk-icon="search"></span>
                <input
                  v-model="searchKeywords"
                  type="search"
                  class="w-full rounded-xl border border-slate-200 bg-slate-50 px-10 py-2 text-sm outline-none ring-primary/20 focus:border-primary focus:ring-2"
                  placeholder="Search by make, model, keyword"
                  @input="debouncedSearch"
                />
              </div>
            </div>

            <div class="divide-y divide-slate-100">
              <details class="group" :open="false">
                <summary class="flex cursor-pointer items-center justify-between px-4 py-3 text-sm font-semibold text-slate-800">
                  <span>Condition</span>
                  <span class="text-xs text-slate-500">{{ filters.condition.length ? filters.condition.length + ' selected' : 'Any' }}</span>
                </summary>
                <div class="border-t border-slate-100 px-4 py-3">
                  <div class="flex flex-wrap gap-2">
                    <label
                      v-for="option in conditionOptions"
                      :key="option.value"
                      class="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700"
                      :class="{ 
                        'opacity-50 pointer-events-none cursor-not-allowed': getFacetedConditionCount(option.value) === 0 && !filters.condition.includes(option.value),
                        'cursor-pointer hover:border-primary hover:text-primary': getFacetedConditionCount(option.value) > 0 || filters.condition.includes(option.value)
                      }"
                    >
                      <input
                        v-model="filters.condition"
                        type="checkbox"
                        class="accent-primary"
                        :value="option.value"
                        :disabled="getFacetedConditionCount(option.value) === 0 && !filters.condition.includes(option.value)"
                        @change="applyFilters"
                      />
                      <span>{{ option.displayValue }}</span>
                      <span class="text-xs text-slate-400">({{ getFacetedConditionCount(option.value) }})</span>
                    </label>
                  </div>
                </div>
              </details>

              <details class="group" :open="true">
                <summary class="flex cursor-pointer items-start justify-between px-4 py-3 text-sm font-semibold text-slate-800">
                  <span>Make, Model & Badge</span>
                  <span class="text-xs text-slate-500 text-right flex flex-col">
                    <span v-if="filters.make.length">{{ filters.make.length }} make{{ filters.make.length > 1 ? 's' : '' }}</span>
                    <span v-if="filters.model.length || filters.badge.length">
                      <template v-if="filters.model.length">{{ filters.model.length }} model{{ filters.model.length > 1 ? 's' : '' }}</template>
                      <template v-if="filters.model.length && filters.badge.length">, </template>
                      <template v-if="filters.badge.length">{{ filters.badge.length }} badge{{ filters.badge.length > 1 ? 's' : '' }}</template>
                    </span>
                    <span v-if="!filters.make.length && !filters.model.length && !filters.badge.length">Any</span>
                  </span>
                </summary>
                <div class="border-t border-slate-100 px-4 py-3 space-y-3">
                  <!-- Search input -->
                  <div class="relative">
                    <input
                      v-model="makeModelSearch"
                      type="text"
                      placeholder="Search makes & models..."
                      class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none ring-primary/20 focus:border-primary focus:ring-2"
                    />
                    <button
                      v-if="makeModelSearch"
                      class="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      @click="makeModelSearch = ''"
                    >
                      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <!-- Makes with nested Models and Badges -->
                  <div class="space-y-2 max-h-80 overflow-y-auto">
                    <div
                      v-for="make in filteredMakeOptions"
                      :key="make"
                      class="rounded-lg border border-slate-200 overflow-hidden"
                      :class="{ 'opacity-50': getFacetedMakeCount(make) === 0 && !filters.make.includes(make) }"
                    >
                      <!-- Make header -->
                      <div
                        class="flex items-center gap-2 px-3 py-2.5 cursor-pointer hover:bg-slate-50 transition-colors"
                        :class="{ 'bg-primary/5 border-primary': filters.make.includes(make) }"
                        @click="toggleMakeExpansion(make)"
                      >
                        <input
                          type="checkbox"
                          class="accent-primary"
                          :checked="filters.make.includes(make)"
                          @click.stop
                          @change="toggleMake(make)"
                        />
                        <span class="flex-1 text-sm font-semibold capitalize text-slate-800">{{ make }}</span>
                        <span class="text-xs text-slate-500">({{ getFacetedMakeCount(make) }})</span>
                        <svg
                          class="h-4 w-4 text-slate-400 transition-transform"
                          :class="{ 'rotate-180': expandedMakes.includes(make) }"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>

                      <!-- Models for this make -->
                      <div
                        v-show="expandedMakes.includes(make)"
                        class="border-t border-slate-100 bg-slate-50/50 px-3 py-2 space-y-1.5"
                      >
                        <div
                          v-for="model in getModelsForMake(make)"
                          :key="`${make}-${model.value}`"
                          class="rounded-md overflow-hidden"
                          :class="{ 
                            'opacity-50 pointer-events-none': getFacetedModelCount(make, model.value) === 0 && !filters.model.includes(model.value)
                          }"
                        >
                          <!-- Model row -->
                          <div
                            class="flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-white rounded transition-colors"
                            :class="{ 
                              'bg-white': filters.model.includes(model.value),
                              'cursor-not-allowed': getFacetedModelCount(make, model.value) === 0 && !filters.model.includes(model.value)
                            }"
                            @click="getFacetedModelCount(make, model.value) > 0 || filters.model.includes(model.value) ? toggleModelExpansion(model.value) : null"
                          >
                            <input
                              type="checkbox"
                              class="accent-primary"
                              :checked="filters.model.includes(model.value)"
                              :disabled="getFacetedModelCount(make, model.value) === 0 && !filters.model.includes(model.value)"
                              @click.stop
                              @change="toggleModel(model.value, make)"
                            />
                            <span class="flex-1 text-sm font-medium text-slate-700">{{ model.displayValue }}</span>
                            <span class="text-xs text-slate-500">({{ getFacetedModelCount(make, model.value) }})</span>
                            <svg
                              v-if="getBadgesForModel(make, model.value).length > 0"
                              class="h-3.5 w-3.5 text-slate-400 transition-transform"
                              :class="{ 'rotate-180': expandedModels.includes(model.value) }"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>

                          <!-- Badges for this model -->
                          <div
                            v-show="expandedModels.includes(model.value) && getBadgesForModel(make, model.value).length > 0"
                            class="pl-6 pr-2 py-1.5 space-y-1"
                          >
                            <label
                              v-for="badge in getBadgesForModel(make, model.value)"
                              :key="`${model.value}-${badge.value}`"
                              class="flex items-center gap-2 px-2 py-1 rounded text-sm text-slate-600"
                              :class="{ 
                                'opacity-50 pointer-events-none cursor-not-allowed': getFacetedBadgeCount(make, model.value, badge.value) === 0 && !filters.badge.includes(badge.value),
                                'cursor-pointer hover:bg-white': getFacetedBadgeCount(make, model.value, badge.value) > 0 || filters.badge.includes(badge.value)
                              }"
                            >
                              <input
                                type="checkbox"
                                class="accent-primary"
                                :checked="filters.badge.includes(badge.value)"
                                :disabled="getFacetedBadgeCount(make, model.value, badge.value) === 0 && !filters.badge.includes(badge.value)"
                                @change="toggleBadge(badge.value, model.value, make)"
                              />
                              <span class="flex-1">{{ badge.displayValue }}</span>
                              <span class="text-xs text-slate-400">({{ getFacetedBadgeCount(make, model.value, badge.value) }})</span>
                            </label>
                          </div>
                        </div>

                        <p
                          v-if="getModelsForMake(make).length === 0"
                          class="text-xs text-slate-500 italic py-1"
                        >
                          No models available
                        </p>
                      </div>
                    </div>

                    <p
                      v-if="filteredMakeOptions.length === 0"
                      class="text-sm text-slate-500 text-center py-2"
                    >
                      No makes found
                    </p>
                  </div>
                </div>
              </details>

              <details class="group">
                <summary class="flex cursor-pointer items-center justify-between px-4 py-3 text-sm font-semibold text-slate-800">
                  <span>Body type</span>
                  <span class="text-xs text-slate-500">{{ filters.body.length ? filters.body.length + ' selected' : 'Any' }}</span>
                </summary>
                <div class="border-t border-slate-100 px-4 py-3">
                  <div class="flex flex-wrap gap-2">
                    <label
                      v-for="body in bodyOptions"
                      :key="body.value"
                      class="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700"
                      :class="{ 
                        'opacity-50 pointer-events-none cursor-not-allowed': getFacetedBodyCount(body.value) === 0 && !filters.body.includes(body.value),
                        'cursor-pointer hover:border-primary hover:text-primary': getFacetedBodyCount(body.value) > 0 || filters.body.includes(body.value)
                      }"
                    >
                      <input
                        v-model="filters.body"
                        type="checkbox"
                        class="accent-primary"
                        :value="body.value"
                        :disabled="getFacetedBodyCount(body.value) === 0 && !filters.body.includes(body.value)"
                        @change="applyFilters"
                      />
                      <span>{{ body.displayValue }}</span>
                      <span class="text-xs text-slate-400">({{ getFacetedBodyCount(body.value) }})</span>
                    </label>
                  </div>
                </div>
              </details>

              <details class="group">
                <summary class="flex cursor-pointer items-center justify-between px-4 py-3 text-sm font-semibold text-slate-800">
                  <span>Fuel & Transmission</span>
                  <span class="text-xs text-slate-500">
                    {{ filters.fuel.length + filters.transmission.length ? (filters.fuel.length + filters.transmission.length) + ' selected' : 'Any' }}
                  </span>
                </summary>
                <div class="space-y-3 border-t border-slate-100 px-4 py-3">
                  <div>
                    <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Fuel</p>
                    <div class="flex flex-wrap gap-2">
                      <label
                        v-for="fuel in fuelOptions"
                        :key="fuel.value"
                        class="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700"
                        :class="{ 
                          'opacity-50 pointer-events-none cursor-not-allowed': getFacetedFuelCount(fuel.value) === 0 && !filters.fuel.includes(fuel.value),
                          'cursor-pointer hover:border-primary hover:text-primary': getFacetedFuelCount(fuel.value) > 0 || filters.fuel.includes(fuel.value)
                        }"
                      >
                        <input
                          v-model="filters.fuel"
                          type="checkbox"
                          class="accent-primary"
                          :value="fuel.value"
                          :disabled="getFacetedFuelCount(fuel.value) === 0 && !filters.fuel.includes(fuel.value)"
                          @change="applyFilters"
                        />
                        <span>{{ fuel.displayValue }}</span>
                        <span class="text-xs text-slate-400">({{ getFacetedFuelCount(fuel.value) }})</span>
                      </label>
                    </div>
                  </div>
                  <div>
                    <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Transmission</p>
                    <div class="flex flex-wrap gap-2">
                      <label
                        v-for="trans in transmissionOptions"
                        :key="trans.value"
                        class="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700"
                        :class="{ 
                          'opacity-50 pointer-events-none cursor-not-allowed': getFacetedTransmissionCount(trans.value) === 0 && !filters.transmission.includes(trans.value),
                          'cursor-pointer hover:border-primary hover:text-primary': getFacetedTransmissionCount(trans.value) > 0 || filters.transmission.includes(trans.value)
                        }"
                      >
                        <input
                          v-model="filters.transmission"
                          type="checkbox"
                          class="accent-primary"
                          :value="trans.value"
                          :disabled="getFacetedTransmissionCount(trans.value) === 0 && !filters.transmission.includes(trans.value)"
                          @change="applyFilters"
                        />
                        <span>{{ trans.displayValue }}</span>
                        <span class="text-xs text-slate-400">({{ getFacetedTransmissionCount(trans.value) }})</span>
                      </label>
                    </div>
                  </div>
                </div>
              </details>

              <details class="group">
                <summary class="flex cursor-pointer items-center justify-between px-4 py-3 text-sm font-semibold text-slate-800">
                  <span>Price</span>
                  <span class="text-xs text-slate-500">
                    {{ filters.priceMin || filters.priceMax ? priceLabel : 'Any' }}
                  </span>
                </summary>
                <div class="space-y-3 border-t border-slate-100 px-4 py-3">
                  <div class="grid grid-cols-2 gap-2">
                    <select
                      v-model.number="filters.priceMin"
                      class="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-primary/20 focus:border-primary focus:ring-2"
                      @change="applyFilters"
                    >
                      <option :value="null">Min</option>
                      <option v-for="step in priceSteps" :key="`min-${step}`" :value="step">
                        ${{ formatNumber(step) }}
                      </option>
                    </select>
                    <select
                      v-model.number="filters.priceMax"
                      class="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-primary/20 focus:border-primary focus:ring-2"
                      @change="applyFilters"
                    >
                      <option :value="null">Max</option>
                      <option v-for="step in priceSteps" :key="`max-${step}`" :value="step">
                        ${{ formatNumber(step) }}
                      </option>
                    </select>
                  </div>
                </div>
              </details>

              <details class="group">
                <summary class="flex cursor-pointer items-center justify-between px-4 py-3 text-sm font-semibold text-slate-800">
                  <span>Year</span>
                  <span class="text-xs text-slate-500">
                    {{ filters.yearMin || filters.yearMax ? yearLabel : 'Any' }}
                  </span>
                </summary>
                <div class="space-y-3 border-t border-slate-100 px-4 py-3">
                  <div class="grid grid-cols-2 gap-2">
                    <select
                      v-model.number="filters.yearMin"
                      class="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-primary/20 focus:border-primary focus:ring-2"
                      @change="applyFilters"
                    >
                      <option :value="null">From</option>
                      <option v-for="year in yearSteps" :key="`min-year-${year}`" :value="year">{{ year }}</option>
                    </select>
                    <select
                      v-model.number="filters.yearMax"
                      class="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-primary/20 focus:border-primary focus:ring-2"
                      @change="applyFilters"
                    >
                      <option :value="null">To</option>
                      <option v-for="year in yearSteps" :key="`max-year-${year}`" :value="year">{{ year }}</option>
                    </select>
                  </div>
                </div>
              </details>

              <details class="group">
                <summary class="flex cursor-pointer items-center justify-between px-4 py-3 text-sm font-semibold text-slate-800">
                  <span>Kilometres</span>
                  <span class="text-xs text-slate-500">
                    {{ filters.kmsMin || filters.kmsMax ? kmsLabel : 'Any' }}
                  </span>
                </summary>
                <div class="space-y-3 border-t border-slate-100 px-4 py-3">
                  <div class="grid grid-cols-2 gap-2">
                    <select
                      v-model.number="filters.kmsMin"
                      class="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-primary/20 focus:border-primary focus:ring-2"
                      @change="applyFilters"
                    >
                      <option :value="null">Min</option>
                      <option v-for="step in kmsSteps" :key="`min-kms-${step}`" :value="step">
                        {{ formatNumber(step) }} km
                      </option>
                    </select>
                    <select
                      v-model.number="filters.kmsMax"
                      class="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-primary/20 focus:border-primary focus:ring-2"
                      @change="applyFilters"
                    >
                      <option :value="null">Max</option>
                      <option v-for="step in kmsSteps" :key="`max-kms-${step}`" :value="step">
                        {{ formatNumber(step) }} km
                      </option>
                    </select>
                  </div>
                </div>
              </details>

              <details class="group">
                <summary class="flex cursor-pointer items-center justify-between px-4 py-3 text-sm font-semibold text-slate-800">
                  <span>Location</span>
                  <span class="text-xs text-slate-500">{{ filters.suburb || 'Any' }}</span>
                </summary>
                <div class="border-t border-slate-100 px-4 py-3">
                  <select
                    v-model="filters.suburb"
                    class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-primary/20 focus:border-primary focus:ring-2"
                    @change="applyFilters"
                  >
                    <option value="">Any location</option>
                    <option v-for="suburb in suburbOptions" :key="suburb" :value="suburb">
                      {{ suburb }}
                    </option>
                  </select>
                </div>
              </details>

              <details class="group">
                <summary class="flex cursor-pointer items-center justify-between px-4 py-3 text-sm font-semibold text-slate-800">
                  <span>Colour</span>
                  <span class="text-xs text-slate-500">{{ filters.colour.length ? filters.colour.length + ' selected' : 'Any' }}</span>
                </summary>
                <div class="border-t border-slate-100 px-4 py-4">
                  <div class="grid grid-cols-5 gap-3">
                    <label
                      v-for="colour in colourOptions"
                      :key="colour.value"
                      class="group/swatch flex flex-col items-center gap-1.5"
                      :class="{ 
                        'opacity-40 pointer-events-none cursor-not-allowed': getFacetedColourCount(colour.value) === 0 && !filters.colour.includes(colour.value),
                        'cursor-pointer': getFacetedColourCount(colour.value) > 0 || filters.colour.includes(colour.value)
                      }"
                    >
                      <input
                        v-model="filters.colour"
                        type="checkbox"
                        class="sr-only"
                        :value="colour.value"
                        :disabled="getFacetedColourCount(colour.value) === 0 && !filters.colour.includes(colour.value)"
                        @change="applyFilters"
                      />
                      <span
                        class="relative flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all"
                        :class="filters.colour.includes(colour.value) ? 'border-primary ring-2 ring-primary/30 scale-110' : 'border-slate-200 hover:border-slate-300 hover:scale-105'"
                        :style="{ backgroundColor: getColourSwatch(colour.displayValue) }"
                      >
                        <svg
                          v-if="filters.colour.includes(colour.value)"
                          class="h-5 w-5"
                          :class="['white', 'silver', 'cream', 'ivory', 'beige', 'pearl', 'champagne', 'yellow', 'gold'].some(c => colour.displayValue.toLowerCase().includes(c)) ? 'text-slate-800' : 'text-white'"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          stroke-width="3"
                        >
                          <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                      <span class="text-center text-[10px] font-medium leading-tight text-slate-600 group-hover/swatch:text-slate-900">
                        {{ colour.displayValue }}
                        <span class="block text-slate-400">({{ getFacetedColourCount(colour.value) }})</span>
                      </span>
                    </label>
                  </div>
                </div>
              </details>
            </div>
          </div>
        </aside>

        <!-- Results -->
        <div class="flex-1 space-y-4">
          <!-- Mobile filter bar - sticky at top, slim design -->
          <div class="sticky top-0 z-20 xl:hidden flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white/95 px-3 py-2 shadow-sm backdrop-blur">
            <button
              class="flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm font-medium text-slate-700"
              @click="showFiltersMobile = !showFiltersMobile"
            >
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span>Filters</span>
              <span v-if="activeFilterCount > 0" class="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-white">{{ activeFilterCount }}</span>
            </button>
            <div class="flex items-center gap-2">
              <span class="text-sm font-medium text-slate-700">{{ totalCount }}</span>
              <select
                v-model="sortBy"
                class="h-8 rounded-md border border-slate-200 bg-slate-50 px-2 text-xs outline-none ring-primary/20 focus:border-primary focus:ring-2"
                @change="applyFilters"
              >
                <option value="featured">Featured</option>
                <option value="price-asc">Price ↑</option>
                <option value="price-desc">Price ↓</option>
                <option value="year-desc">Newest</option>
                <option value="year-asc">Oldest</option>
                <option value="km-asc">Km ↑</option>
              </select>
              <NuxtLink
                to="/favorites"
                class="relative flex items-center justify-center h-8 w-8 rounded-md border border-slate-200 bg-slate-50 text-slate-600 hover:text-primary hover:border-primary transition-colors"
                title="View Saved Vehicles"
              >
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span 
                  v-if="favoritesCount > 0" 
                  class="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-white"
                >
                  {{ favoritesCount }}
                </span>
              </NuxtLink>
            </div>
          </div>
          
          <!-- Desktop results bar -->
          <div class="hidden xl:flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
            <div class="flex items-center gap-3 text-sm text-slate-600">
              <span class="text-base font-semibold text-slate-800">{{ totalCount }} results</span>
              <span class="h-4 w-px bg-slate-200"></span>
              <span class="flex items-center gap-2 text-xs">
                <span class="inline-flex h-2 w-2 rounded-full bg-green-500"></span>
                Updated just now
              </span>
            </div>
            <div class="flex flex-wrap items-center gap-2">
              <select
                v-model="sortBy"
                class="h-[42px] rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none ring-primary/20 focus:border-primary focus:ring-2"
                @change="applyFilters"
              >
                <option value="featured">Featured</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="year-desc">Year: Newest</option>
                <option value="year-asc">Year: Oldest</option>
                <option value="km-asc">Odometer: Low to High</option>
              </select>
              <div class="flex rounded-lg border border-slate-200 bg-slate-50 p-1">
                <button
                  class="rounded-md px-3 py-2 text-sm font-semibold"
                  :class="viewMode === 'grid' ? 'bg-white text-primary shadow-sm' : 'text-slate-600'"
                  @click="viewMode = 'grid'"
                >
                  Grid
                </button>
                <button
                  class="rounded-md px-3 py-2 text-sm font-semibold"
                  :class="viewMode === 'list' ? 'bg-white text-primary shadow-sm' : 'text-slate-600'"
                  @click="viewMode = 'list'"
                >
                  List
                </button>
              </div>
            </div>
          </div>

          <div v-if="activeFilterChips.length" class="flex flex-wrap items-center gap-2">
            <button
              v-for="chip in activeFilterChips"
              :key="chip.label + chip.value"
              class="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm shadow-sm hover:border-primary hover:text-primary"
              @click="removeChip(chip)"
            >
              <span>{{ chip.label }}</span>
              <span class="text-xs text-slate-400">✕</span>
            </button>
            <button
              class="text-sm font-semibold text-primary hover:underline"
              @click="clearFilters"
            >
              Clear all
            </button>
          </div>

          <!-- Loading -->
          <div
            v-if="loading"
            class="grid gap-4"
            :class="viewMode === 'grid' ? 'grid-cols-[repeat(auto-fill,minmax(320px,1fr))]' : 'grid-cols-1'"
          >
            <div v-for="n in 6" :key="`skeleton-${n}`" class="animate-pulse rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div class="mb-3 h-40 rounded-xl bg-slate-200"></div>
              <div class="mb-2 h-4 rounded bg-slate-200"></div>
              <div class="mb-2 h-4 w-2/3 rounded bg-slate-200"></div>
              <div class="flex gap-2">
                <div class="h-6 w-16 rounded bg-slate-200"></div>
                <div class="h-6 w-20 rounded bg-slate-200"></div>
              </div>
            </div>
          </div>

          <!-- No Results -->
          <div v-else-if="!vehicles.length" class="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white px-8 py-12 text-center shadow-sm">
            <span class="text-4xl">🔍</span>
            <h3 class="text-lg font-semibold">No vehicles match your filters</h3>
            <p class="text-sm text-slate-600">Adjust or clear filters to see more vehicles.</p>
            <button
              class="mt-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold shadow-sm hover:border-primary hover:text-primary"
              @click="clearFilters"
            >
              Clear filters
            </button>
          </div>

          <!-- Vehicles -->
          <div
            v-else-if="viewMode === 'grid'"
            class="grid gap-4 grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(320px,1fr))]"
          >
            <div
              v-for="vehicle in vehicles"
              :key="vehicle.identifier || vehicle.id || vehicle.stockid"
              class="h-full"
            >
              <ModernVehicleCard class="h-full" :vehicle="vehicle" :view-mode="viewMode" />
            </div>
          </div>

          <!-- List View -->
          <div
            v-else
            class="flex flex-col gap-4"
          >
            <VehicleListCard
              v-for="vehicle in vehicles"
              :key="vehicle.identifier || vehicle.id || vehicle.stockid"
              :vehicle="vehicle"
            />
          </div>

          <!-- Pagination -->
          <div v-if="totalPages > 1" class="flex items-center justify-center gap-2 pt-2">
            <button
              class="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
              :disabled="currentPage === 1"
              @click="goToPage(currentPage - 1)"
            >
              Prev
            </button>
            <button
              v-for="page in visiblePages"
              :key="page"
              class="rounded-full px-3 py-2 text-sm font-semibold"
              :class="page === currentPage ? 'bg-primary text-white shadow' : 'text-slate-700 hover:bg-slate-100'"
              @click="goToPage(page)"
            >
              {{ page }}
            </button>
            <button
              class="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
              :disabled="currentPage === totalPages"
              @click="goToPage(currentPage + 1)"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Vehicle Enquiry Modal -->
    <VehicleEnquiryModal
      :is-open="vehiclesStore.vehicleEnquiryPopUp.show"
      :vehicle="vehiclesStore.vehicleEnquiryPopUp.item"
      @close="closeEnquiryModal"
    />
  </div>
</template>

<script setup lang="ts">
import { useDebounceFn, useLocalStorage } from '@vueuse/core';

const route = useRoute();
const router = useRouter();
const vehiclesStore = useVehiclesStore();

const loading = ref(false);
const vehicles = ref<any[]>([]);
const totalCount = ref(0);
const currentPage = ref(1);
const pageSize = ref(12);
const sortBy = ref('featured');
const viewMode = ref<'grid' | 'list'>('grid');
const searchKeywords = ref('');

// Favorites count from localStorage
const comparisonIds = useLocalStorage<any>('comparisonVehicles', []);

const normalizeComparisonIds = (raw: any): (string | number)[] => {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === 'object') {
    if (raw instanceof Set) return Array.from(raw);
    const maybeValues = raw._set || Object.values(raw);
    if (Array.isArray(maybeValues)) return maybeValues as (string | number)[];
  }
  return [];
};

const favoritesCount = computed(() => normalizeComparisonIds(comparisonIds.value).length);

// Persist viewMode to localStorage
const LAYOUT_STORAGE_KEY = 'car-sales-view-mode';

watch(viewMode, (newMode) => {
  if (import.meta.client) {
    localStorage.setItem(LAYOUT_STORAGE_KEY, newMode);
  }
});

const filters = reactive({
  condition: [] as string[],
  make: [] as string[],
  model: [] as string[],
  body: [] as string[],
  fuel: [] as string[],
  transmission: [] as string[],
  badge: [] as string[],
  colour: [] as string[],
  priceMin: null as number | null,
  priceMax: null as number | null,
  yearMin: null as number | null,
  yearMax: null as number | null,
  kmsMin: null as number | null,
  kmsMax: null as number | null,
  suburb: '',
});

const showFiltersMobile = ref(false);

// Cascading filter state
const makeModelSearch = ref('');
const expandedMakes = ref<string[]>([]);
const expandedModels = ref<string[]>([]);
// Track hierarchical associations for faceted filtering
// model -> make (which make does this model belong to)
const modelMakeMap = ref<Record<string, string>>({});
// badge -> model (which model does this badge belong to)
const badgeModelMap = ref<Record<string, string>>({});

const filterOptions = ref({
  conditions: [] as { value: string; displayValue: string }[],
  models: [] as any[],
  bodies: [] as { value: string; displayValue: string }[],
  fuels: [] as { value: string; displayValue: string }[],
  transmissions: [] as { value: string; displayValue: string }[],
  badges: [] as { value: string; displayValue: string }[],
  colours: [] as { value: string; displayValue: string }[],
  priceRange: { min: 0, max: 200000 },
  kmsRange: { min: 0, max: 200000 },
  yearRange: { min: 2005, max: new Date().getFullYear() },
  makes: [] as string[],
  suburbs: [] as string[],
});

const calculatePriceFromWeekly = (weeklyPayment: number, annualInterestRate = 9.8, loanTermYears = 5): number => {
  const monthlyPayment = (weeklyPayment * 52) / 12;
  const monthlyInterestRate = annualInterestRate / 100 / 12;
  const loanTermMonths = loanTermYears * 12;
  const i = Math.pow(1 + monthlyInterestRate, loanTermMonths);
  if (i === 1 || monthlyInterestRate === 0) return monthlyPayment * loanTermMonths;
  return (monthlyPayment * (i - 1)) / (monthlyInterestRate * i);
};

const fetchFilterOptions = async () => {
  try {
    const response = await $fetch<any>('/api/carsales-feed');
    const vehiclesData = response?.vehiclesData || [];
    const filtersData = response?.filters || [];

    // Store all vehicles data for badge computation
    allVehiclesData.value = vehiclesData;

    const findFilter = (name: string) => filtersData.find((f: any) => f.name === name);

    const models = findFilter('model')?.data || [];
    const conditions = findFilter('condition')?.data || [];
    const bodies = findFilter('body')?.data || [];
    const fuels = findFilter('fuel')?.data || [];
    const transmissions = findFilter('transmission')?.data || [];
    const badges = findFilter('badge')?.data || [];
    const colours = findFilter('colour')?.data || [];
    const price = findFilter('price')?.data || { min: 0, max: 200000 };
    const kms = findFilter('kms')?.data || { min: 0, max: 200000 };

    // Derive makes and year/suburb ranges from vehicles
    const makesSet = new Set<string>();
    const suburbsSet = new Set<string>();
    let minYear = new Date().getFullYear();
    let maxYear = 1990;

    vehiclesData.forEach((vehicle: any) => {
      const make = vehicle.make?.displayValue?.[0] || vehicle.make?.value?.[0];
      if (make) makesSet.add(make.toLowerCase());

      const suburb = vehicle.suburb?.displayValue?.[0];
      if (suburb) suburbsSet.add(suburb);

      const year = vehicle.year?.displayValue?.[0] || vehicle.year?.value?.[0] || vehicle.releaseyear;
      const yearNum = parseInt(year);
      if (!Number.isNaN(yearNum)) {
        minYear = Math.min(minYear, yearNum);
        maxYear = Math.max(maxYear, yearNum);
      }
    });

    filterOptions.value = {
      conditions,
      models,
      bodies,
      fuels,
      transmissions,
      badges,
      colours,
      priceRange: { min: price.min || 0, max: price.max || 200000 },
      kmsRange: { min: kms.min || 0, max: kms.max || 200000 },
      yearRange: { min: minYear || 2005, max: maxYear || new Date().getFullYear() },
      makes: Array.from(makesSet),
      suburbs: Array.from(suburbsSet).sort(),
    };
  } catch (error) {
    console.error('Failed to load filter options', error);
  }
};

// Helper to capitalize first letter
const capitalizeFirst = (str: string) => str ? str.charAt(0).toUpperCase() + str.slice(1) : '';

// Dynamic page title based on active filters
const pageTitle = computed(() => {
  const parts: string[] = [];
  
  // Year filter
  if (filters.yearMin && filters.yearMax && filters.yearMin === filters.yearMax) {
    parts.push(String(filters.yearMin));
  }
  
  // Make filter
  if (filters.make.length === 1 && filters.make[0]) {
    parts.push(capitalizeFirst(filters.make[0]));
  }
  
  // Model filter
  if (filters.model.length === 1 && filters.model[0]) {
    parts.push(capitalizeFirst(filters.model[0]));
  }
  
  // Body type
  if (filters.body.length === 1 && filters.body[0]) {
    parts.push(capitalizeFirst(filters.body[0]));
  }
  
  if (parts.length > 0) {
    return `${parts.join(' ')} Cars for Sale`;
  }
  
  return 'Cars for sale in Victoria';
});

// Dynamic SEO description based on active filters
const seoDescription = computed(() => {
  const parts: string[] = ['Browse'];
  
  if (filters.yearMin && filters.yearMax && filters.yearMin === filters.yearMax) {
    parts.push(String(filters.yearMin));
  }
  
  if (filters.make.length === 1 && filters.make[0]) {
    parts.push(capitalizeFirst(filters.make[0]));
  }
  
  if (filters.model.length === 1 && filters.model[0]) {
    parts.push(capitalizeFirst(filters.model[0]));
  }
  
  if (filters.body.length === 1 && filters.body[0]) {
    parts.push(capitalizeFirst(filters.body[0]).toLowerCase());
  }
  
  parts.push('cars for sale at Sale Hyundai, Victoria.');
  
  // Add price range if set
  if (filters.priceMax) {
    parts.push(`Vehicles under $${filters.priceMax.toLocaleString()} available.`);
  }
  
  parts.push('Quality new, demo and used vehicles with finance options.');
  
  return parts.join(' ');
});

// Dynamic canonical URL - use clean URL format for filtered pages
const canonicalUrl = computed(() => {
  const baseUrl = 'https://www.salehyundai.com.au';
  
  // If we have exactly one make selected, use clean URL format
  if (filters.make.length === 1 && filters.make[0]) {
    const make = filters.make[0];
    let path = `/car-sales/${make.toLowerCase()}`;
    
    if (filters.model.length === 1 && filters.model[0]) {
      const model = filters.model[0];
      path += `/${model.toLowerCase()}`;
      
      if (filters.yearMin && filters.yearMax && filters.yearMin === filters.yearMax) {
        path += `/${filters.yearMin}`;
      }
    }
    
    return `${baseUrl}${path}/`;
  }
  
  return `${baseUrl}/car-sales`;
});

// Apply dynamic SEO meta tags
useSeoMeta({
  title: () => `${pageTitle.value} | Sale Hyundai`,
  description: seoDescription,
  ogTitle: () => `${pageTitle.value} | Sale Hyundai`,
  ogDescription: seoDescription,
  ogUrl: canonicalUrl,
});

// Set canonical URL to clean URL format
useHead({
  link: [
    {
      rel: 'canonical',
      href: canonicalUrl,
    },
  ],
});

const resultsText = computed(() => {
  if (loading.value) return 'Loading results...';
  return `${totalCount.value} vehicle${totalCount.value !== 1 ? 's' : ''} found`;
});

const pageSubtitle = computed(() => {
  if (loading.value) return 'Searching for vehicles...';
  if (totalCount.value === 0) return 'No vehicles found matching your criteria. Try adjusting your filters.';
  
  // Simple, clear subtitle similar to finance page style
  const make = filters.make[0];
  const model = filters.model[0];
  
  if (make && model && filters.make.length === 1 && filters.model.length === 1) {
    return `Browse ${totalCount.value} ${capitalizeFirst(make)} ${capitalizeFirst(model)} vehicles for sale`;
  } else if (make && filters.make.length === 1) {
    return `Browse ${totalCount.value} ${capitalizeFirst(make)} vehicles for sale`;
  }
  
  return `Browse our full range of ${totalCount.value} new, demo and used vehicles for sale`;
});

// Header background image from first vehicle result
const headerBackgroundStyle = computed(() => {
  const firstVehicle = vehicles.value?.[0];
  const imageUrl = firstVehicle?.images?.[0] || firstVehicle?.thumb || '';
  
  if (imageUrl) {
    return {
      backgroundImage: `url(${imageUrl})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    };
  }
  return {};
});

const conditionOptions = computed(() => filterOptions.value.conditions);
const makeOptions = computed(() => filterOptions.value.makes);
const bodyOptions = computed(() => filterOptions.value.bodies);
const fuelOptions = computed(() => filterOptions.value.fuels);
const transmissionOptions = computed(() => filterOptions.value.transmissions);
const suburbOptions = computed(() => filterOptions.value.suburbs);
const colourOptions = computed(() => filterOptions.value.colours);

// =================================================================
// FACETED FILTERING HELPERS
// =================================================================

const getVehicleMake = (vehicle: any): string => {
  return (vehicle.make?.displayValue?.[0] || vehicle.make?.value?.[0] || '').toLowerCase();
};

const getVehicleModel = (vehicle: any): string => {
  // Use model.value (slug format with hyphens) for matching against filter values
  // Fall back to displayValue if value is not available
  return (vehicle.model?.value?.[0] || vehicle.model?.displayValue?.[0] || '').toLowerCase();
};

const getVehicleBadge = (vehicle: any): string => {
  return (vehicle.badge?.value?.[0] || vehicle.badge?.displayValue?.[0] || '').toLowerCase();
};

// =================================================================
// NON-HIERARCHICAL FILTER FUNCTION (for stable model/badge counts)
// =================================================================
// This function checks if a vehicle matches all NON-hierarchical filters
// (condition, body, fuel, transmission, colour, price, year, kms).
// Used for calculating model counts that remain stable regardless of
// which other models are selected within the same make.
// =================================================================
const vehicleMatchesNonHierarchicalFilters = (v: any): boolean => {
  // Check CONDITION filter
  if (filters.condition.length > 0) {
    const conditions = v.condition?.value || v.condition?.displayValue || [];
    if (!conditions.some((c: string) => 
      filters.condition.some(fc => c.toLowerCase().includes(fc.toLowerCase()))
    )) return false;
  }
  
  // Check BODY filter
  if (filters.body.length > 0) {
    const bodies = v.body?.value || v.body?.displayValue || [];
    if (!bodies.some((b: string) => 
      filters.body.some(fb => b.toLowerCase().includes(fb.toLowerCase()))
    )) return false;
  }
  
  // Check FUEL filter
  if (filters.fuel.length > 0) {
    const fuels = v.fuel?.value || v.fuel?.displayValue || [];
    if (!fuels.some((f: string) => 
      filters.fuel.some(ff => f.toLowerCase().includes(ff.toLowerCase()))
    )) return false;
  }
  
  // Check TRANSMISSION filter
  if (filters.transmission.length > 0) {
    const transmissions = v.transmission?.value || v.transmission?.displayValue || [];
    if (!transmissions.some((t: string) => 
      filters.transmission.some(ft => t.toLowerCase().includes(ft.toLowerCase()))
    )) return false;
  }
  
  // Check COLOUR filter
  if (filters.colour.length > 0) {
    const colours = v.colour?.value || v.colour?.displayValue || [];
    if (!colours.some((c: string) => 
      filters.colour.some(fc => c.toLowerCase().includes(fc.toLowerCase()))
    )) return false;
  }
  
  // Check PRICE filter
  if (filters.priceMin !== null && (v.price || 0) < filters.priceMin) return false;
  if (filters.priceMax !== null && (v.price || 0) > filters.priceMax) return false;
  
  // Check YEAR filter
  if (filters.yearMin !== null || filters.yearMax !== null) {
    const year = parseInt(v.year?.value?.[0] || v.year?.displayValue?.[0] || v.releaseyear || '0');
    if (filters.yearMin !== null && year < filters.yearMin) return false;
    if (filters.yearMax !== null && year > filters.yearMax) return false;
  }
  
  // Check KMS filter
  if (filters.kmsMin !== null && (v.kms || 0) < filters.kmsMin) return false;
  if (filters.kmsMax !== null && (v.kms || 0) > filters.kmsMax) return false;
  
  return true;
};

// =================================================================
// CORE FACETED FILTERING FUNCTION
// =================================================================
// This function checks if a vehicle matches all current filters,
// with the ability to exclude specific filters for "what if" counts.
// excludeFilters: array of filter names to skip (e.g., ['make', 'body'])
// =================================================================
const vehicleMatchesAllFilters = (v: any, excludeFilters: string[] = []): boolean => {
  const vMake = getVehicleMake(v);
  const vModel = getVehicleModel(v);
  const vBadge = getVehicleBadge(v);
  
  // =================================================================
  // HIERARCHICAL MAKE/MODEL/BADGE FILTERING
  // =================================================================
  // This implements proper faceted search where:
  // - If a model is selected, badges only apply to that specific model
  // - If a make is selected without models, all vehicles of that make match
  // - Badges are scoped to their parent model via badgeModelMap
  // =================================================================
  
  if (!excludeFilters.includes('make') || !excludeFilters.includes('model') || !excludeFilters.includes('badge')) {
    // Build maps from the tracking refs
    const modelsForMake = new Map<string, Set<string>>();
    Object.entries(modelMakeMap.value).forEach(([model, make]) => {
      const makeLower = (make as string).toLowerCase();
      if (!modelsForMake.has(makeLower)) modelsForMake.set(makeLower, new Set());
      modelsForMake.get(makeLower)!.add(model.toLowerCase());
    });
    
    const badgesForModel = new Map<string, Set<string>>();
    Object.entries(badgeModelMap.value).forEach(([badge, model]) => {
      const modelLower = (model as string).toLowerCase();
      if (!badgesForModel.has(modelLower)) badgesForModel.set(modelLower, new Set());
      badgesForModel.get(modelLower)!.add(badge.toLowerCase());
    });
    
    // Check MAKE filter
    if (!excludeFilters.includes('make') && filters.make.length > 0) {
      const matchesMake = filters.make.some(m => vMake === m.toLowerCase());
      if (!matchesMake) return false;
      
      // If this make has specific models selected, check model filter
      const selectedModelsForThisMake = modelsForMake.get(vMake);
      if (selectedModelsForThisMake && selectedModelsForThisMake.size > 0) {
        // Vehicle's make has specific models selected - must match one
        const matchesSelectedModel = [...selectedModelsForThisMake].some(m => vModel.includes(m));
        if (!matchesSelectedModel) return false;
        
        // If this model has specific badges selected, check badge filter
        const selectedBadgesForThisModel = badgesForModel.get(vModel);
        if (selectedBadgesForThisModel && selectedBadgesForThisModel.size > 0) {
          // Vehicle's model has specific badges selected - must match one
          const matchesSelectedBadge = [...selectedBadgesForThisModel].some(b => vBadge.includes(b));
          if (!matchesSelectedBadge) return false;
        }
        // If no badges selected for this model, vehicle passes badge filter
      }
      // If no models selected for this make, vehicle passes model/badge filters
    } else if (!excludeFilters.includes('model') && filters.model.length > 0) {
      // No make filter, but model filter exists
      const matchesModel = filters.model.some(m => vModel.includes(m.toLowerCase()));
      if (!matchesModel) return false;
      
      // Check if this model has badges selected
      if (!excludeFilters.includes('badge') && filters.badge.length > 0) {
        const selectedBadgesForThisModel = badgesForModel.get(vModel);
        if (selectedBadgesForThisModel && selectedBadgesForThisModel.size > 0) {
          const matchesSelectedBadge = [...selectedBadgesForThisModel].some(b => vBadge.includes(b));
          if (!matchesSelectedBadge) return false;
        }
      }
    } else if (!excludeFilters.includes('badge') && filters.badge.length > 0) {
      // Only badge filter, no make/model - apply globally
      const matchesBadge = filters.badge.some(b => vBadge.includes(b.toLowerCase()));
      if (!matchesBadge) return false;
    }
  }
  
  // Check CONDITION filter
  if (!excludeFilters.includes('condition') && filters.condition.length > 0) {
    const conditions = v.condition?.value || v.condition?.displayValue || [];
    if (!conditions.some((c: string) => 
      filters.condition.some(fc => c.toLowerCase().includes(fc.toLowerCase()))
    )) return false;
  }
  
  // Check BODY filter
  if (!excludeFilters.includes('body') && filters.body.length > 0) {
    const bodies = v.body?.value || v.body?.displayValue || [];
    if (!bodies.some((b: string) => 
      filters.body.some(fb => b.toLowerCase().includes(fb.toLowerCase()))
    )) return false;
  }
  
  // Check FUEL filter
  if (!excludeFilters.includes('fuel') && filters.fuel.length > 0) {
    const fuels = v.fuel?.value || v.fuel?.displayValue || [];
    if (!fuels.some((f: string) => 
      filters.fuel.some(ff => f.toLowerCase().includes(ff.toLowerCase()))
    )) return false;
  }
  
  // Check TRANSMISSION filter
  if (!excludeFilters.includes('transmission') && filters.transmission.length > 0) {
    const transmissions = v.transmission?.value || v.transmission?.displayValue || [];
    if (!transmissions.some((t: string) => 
      filters.transmission.some(ft => t.toLowerCase().includes(ft.toLowerCase()))
    )) return false;
  }
  
  // Check COLOUR filter
  if (!excludeFilters.includes('colour') && filters.colour.length > 0) {
    const colours = v.colour?.value || v.colour?.displayValue || [];
    if (!colours.some((c: string) => 
      filters.colour.some(fc => c.toLowerCase().includes(fc.toLowerCase()))
    )) return false;
  }
  
  // Check PRICE filter
  if (filters.priceMin !== null && (v.price || 0) < filters.priceMin) return false;
  if (filters.priceMax !== null && (v.price || 0) > filters.priceMax) return false;
  
  // Check YEAR filter
  if (filters.yearMin !== null || filters.yearMax !== null) {
    const year = parseInt(v.year?.value?.[0] || v.year?.displayValue?.[0] || v.releaseyear || '0');
    if (filters.yearMin !== null && year < filters.yearMin) return false;
    if (filters.yearMax !== null && year > filters.yearMax) return false;
  }
  
  // Check KMS filter
  if (filters.kmsMin !== null && (v.kms || 0) < filters.kmsMin) return false;
  if (filters.kmsMax !== null && (v.kms || 0) > filters.kmsMax) return false;
  
  return true;
};

// =================================================================
// FACETED COUNT FUNCTIONS
// =================================================================
// Each function counts vehicles that would match if this option is selected,
// while respecting ALL other currently active filters.
// =================================================================

// Get faceted count for a MAKE
// Counts vehicles of this make that match all non-hierarchical filters
// This provides STABLE counts that don't change when other makes are selected
const getFacetedMakeCount = (make: string): number => {
  const makeLower = make.toLowerCase();
  return allVehiclesData.value.filter((v: any) => {
    // Must be this specific make
    if (getVehicleMake(v) !== makeLower) return false;
    // Must match all NON-hierarchical filters only
    // This ensures make counts are stable and don't change based on other make/model selections
    return vehicleMatchesNonHierarchicalFilters(v);
  }).length;
};

// Get faceted count for a MODEL within a make
// Counts vehicles of this make+model that match all non-hierarchical filters
// This provides STABLE counts that don't change when other models are selected
const getFacetedModelCount = (make: string, model: string): number => {
  const makeLower = make.toLowerCase();
  // model is the slug format (e.g., "transit-custom")
  const modelSlug = model.toLowerCase();
  
  return allVehiclesData.value.filter((v: any) => {
    // Must be this specific make and model
    if (getVehicleMake(v) !== makeLower) return false;
    // Compare using slug format (getVehicleModel now returns slug)
    if (getVehicleModel(v) !== modelSlug) return false;
    // Must match all NON-hierarchical filters only (condition, body, fuel, etc.)
    // This ensures model counts are stable and don't change based on other model selections
    return vehicleMatchesNonHierarchicalFilters(v);
  }).length;
};

// Get faceted count for a BADGE within a model
// Counts vehicles of this make+model+badge that match all non-hierarchical filters
// This provides STABLE counts that don't change when other badges are selected
const getFacetedBadgeCount = (make: string, model: string, badge: string): number => {
  const makeLower = make.toLowerCase();
  // model is the slug format (e.g., "transit-custom")
  const modelSlug = model.toLowerCase();
  // badge is also in slug format
  const badgeSlug = badge.toLowerCase();
  
  return allVehiclesData.value.filter((v: any) => {
    // Must be this specific make, model, and badge
    if (getVehicleMake(v) !== makeLower) return false;
    // Compare using slug format (getVehicleModel returns slug)
    if (getVehicleModel(v) !== modelSlug) return false;
    // Compare badge using slug format (getVehicleBadge returns slug)
    if (getVehicleBadge(v) !== badgeSlug) return false;
    // Must match all NON-hierarchical filters only
    // This ensures badge counts are stable and don't change based on other badge selections
    return vehicleMatchesNonHierarchicalFilters(v);
  }).length;
};

// Get faceted count for CONDITION
// Counts vehicles with this condition that match all OTHER filters (including make/model/badge!)
const getFacetedConditionCount = (condition: string): number => {
  const condLower = condition.toLowerCase();
  return allVehiclesData.value.filter((v: any) => {
    // Must have this condition - check both value and displayValue
    const conditions = v.condition?.value || v.condition?.displayValue || [];
    if (!conditions.some((c: string) => c.toLowerCase().includes(condLower))) return false;
    // Must match all other filters (excluding condition)
    return vehicleMatchesAllFilters(v, ['condition']);
  }).length;
};

// Get faceted count for BODY TYPE
// Counts vehicles with this body that match all OTHER filters (including make/model/badge!)
const getFacetedBodyCount = (body: string): number => {
  const bodyLower = body.toLowerCase();
  return allVehiclesData.value.filter((v: any) => {
    // Must have this body type - check both value and displayValue
    const bodies = v.body?.value || v.body?.displayValue || [];
    if (!bodies.some((b: string) => b.toLowerCase().includes(bodyLower))) return false;
    // Must match all other filters (excluding body)
    return vehicleMatchesAllFilters(v, ['body']);
  }).length;
};

// Get faceted count for FUEL TYPE
const getFacetedFuelCount = (fuel: string): number => {
  const fuelLower = fuel.toLowerCase();
  return allVehiclesData.value.filter((v: any) => {
    // Must have this fuel type - check both value and displayValue
    const fuels = v.fuel?.value || v.fuel?.displayValue || [];
    if (!fuels.some((f: string) => f.toLowerCase().includes(fuelLower))) return false;
    // Must match all other filters (excluding fuel)
    return vehicleMatchesAllFilters(v, ['fuel']);
  }).length;
};

// Get faceted count for TRANSMISSION
const getFacetedTransmissionCount = (transmission: string): number => {
  const transLower = transmission.toLowerCase();
  return allVehiclesData.value.filter((v: any) => {
    // Must have this transmission - check both value and displayValue
    const transmissions = v.transmission?.value || v.transmission?.displayValue || [];
    if (!transmissions.some((t: string) => t.toLowerCase().includes(transLower))) return false;
    // Must match all other filters (excluding transmission)
    return vehicleMatchesAllFilters(v, ['transmission']);
  }).length;
};

// Get faceted count for COLOUR
const getFacetedColourCount = (colour: string): number => {
  const colourLower = colour.toLowerCase();
  return allVehiclesData.value.filter((v: any) => {
    // Must have this colour - check both value and displayValue
    const colours = v.colour?.value || v.colour?.displayValue || [];
    if (!colours.some((c: string) => c.toLowerCase().includes(colourLower))) return false;
    // Must match all other filters (excluding colour)
    return vehicleMatchesAllFilters(v, ['colour']);
  }).length;
};

// Color name to CSS color mapping for visual swatches
const colourSwatchMap: Record<string, string> = {
  white: '#ffffff',
  grey: '#9ca3af',
  gray: '#9ca3af',
  black: '#1f2937',
  blue: '#3b82f6',
  silver: '#d1d5db',
  red: '#ef4444',
  green: '#22c55e',
  maroon: '#7f1d1d',
  orange: '#f97316',
  yellow: '#eab308',
  brown: '#92400e',
  beige: '#d4c4a8',
  gold: '#ca8a04',
  purple: '#a855f7',
  bronze: '#cd7f32',
  burgundy: '#800020',
  charcoal: '#374151',
  cream: '#fffdd0',
  ivory: '#fffff0',
  navy: '#1e3a5a',
  pearl: '#f0ead6',
  champagne: '#f7e7ce',
  graphite: '#4b5563',
};

const getColourSwatch = (colourName: string): string => {
  const normalizedName = colourName.toLowerCase().trim();
  // Check exact match
  if (colourSwatchMap[normalizedName]) {
    return colourSwatchMap[normalizedName];
  }
  // Check if colour name contains any known colour
  for (const [key, value] of Object.entries(colourSwatchMap)) {
    if (normalizedName.includes(key)) {
      return value;
    }
  }
  // Default to a neutral grey
  return '#9ca3af';
};

const modelOptions = computed(() => {
  let models = filterOptions.value.models;
  
  // Filter by selected makes if any
  if (filters.make.length) {
    models = models.filter((model: any) =>
      filters.make.some(make =>
        model.displayMake?.toLowerCase?.().includes(make.toLowerCase())
      )
    );
  }
  
  // Deduplicate models by value to prevent Vue key warnings
  const seen = new Set<string>();
  return models.filter((model: any) => {
    const key = model.value?.toLowerCase?.() || model.value;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
});

// Cascading filter computed properties
const filteredMakeOptions = computed(() => {
  const search = makeModelSearch.value.toLowerCase().trim();
  if (!search) return makeOptions.value;
  
  return makeOptions.value.filter((make: string) => {
    // Check if make matches
    if (make.toLowerCase().includes(search)) return true;
    // Check if any model for this make matches
    const models = getModelsForMake(make);
    return models.some(m => m.displayValue.toLowerCase().includes(search));
  });
});

const getMakeModelBadgeSummary = computed(() => {
  const parts: string[] = [];
  if (filters.make.length) parts.push(`${filters.make.length} make${filters.make.length > 1 ? 's' : ''}`);
  if (filters.model.length) parts.push(`${filters.model.length} model${filters.model.length > 1 ? 's' : ''}`);
  if (filters.badge.length) parts.push(`${filters.badge.length} badge${filters.badge.length > 1 ? 's' : ''}`);
  if (parts.length === 0) return 'Any';
  if (parts.length === 1) return parts[0];
  // Show on two lines: first item on line 1, rest on line 2
  return `${parts[0]}<br>${parts.slice(1).join(', ')}`;
});

// Store all vehicles data for badge computation
const allVehiclesData = ref<any[]>([]);

const getModelsForMake = (make: string) => {
  // Get models from filterOptions and calculate counts from allVehiclesData
  let models = filterOptions.value.models.filter((model: any) =>
    model.displayMake?.toLowerCase() === make.toLowerCase()
  );
  
  // Apply search filter if there's a search term
  const search = makeModelSearch.value.toLowerCase().trim();
  if (search) {
    // If make doesn't match search, only show models that match
    if (!make.toLowerCase().includes(search)) {
      models = models.filter((model: any) => 
        model.displayValue?.toLowerCase().includes(search) ||
        model.value?.toLowerCase().includes(search)
      );
    }
  }
  
  // Deduplicate models by value and calculate actual counts from vehicle data
  const seenModels = new Set<string>();
  const uniqueModels: any[] = [];
  
  models.forEach((model: any) => {
    const modelKey = model.value?.toLowerCase() || model.displayValue?.toLowerCase() || '';
    if (modelKey && !seenModels.has(modelKey)) {
      seenModels.add(modelKey);
      
      // Use model.value (slug format) for matching against vehicle data
      const modelSlug = model.value?.toLowerCase() || '';
      const count = allVehiclesData.value.filter((vehicle: any) => {
        const vehicleMake = vehicle.make?.value?.[0]?.toLowerCase() || vehicle.make?.displayValue?.[0]?.toLowerCase() || '';
        const vehicleModel = vehicle.model?.value?.[0]?.toLowerCase() || vehicle.model?.displayValue?.[0]?.toLowerCase() || '';
        return vehicleMake === make.toLowerCase() && vehicleModel === modelSlug;
      }).length;
      
      uniqueModels.push({
        ...model,
        count,
      });
    }
  });
  
  return uniqueModels;
};

const getBadgesForModel = (make: string, modelValue: string) => {
  // modelValue is the slug format (e.g., "transit-custom")
  const modelSlug = modelValue.toLowerCase();
  
  // Count badges from vehicles data
  const badgeCounts = new Map<string, { count: number; displayValue: string }>();
  
  allVehiclesData.value.forEach((vehicle: any) => {
    // Use value (slug format) for matching
    const vehicleMake = vehicle.make?.value?.[0]?.toLowerCase() || vehicle.make?.displayValue?.[0]?.toLowerCase() || '';
    const vehicleModel = vehicle.model?.value?.[0]?.toLowerCase() || vehicle.model?.displayValue?.[0]?.toLowerCase() || '';
    const vehicleBadge = vehicle.badge?.displayValue?.[0] || vehicle.badge?.value?.[0] || '';
    
    if (vehicleMake === make.toLowerCase() && vehicleModel === modelSlug && vehicleBadge) {
      const badgeKey = vehicleBadge.toLowerCase();
      const existing = badgeCounts.get(badgeKey);
      if (existing) {
        existing.count++;
      } else {
        badgeCounts.set(badgeKey, { count: 1, displayValue: vehicleBadge });
      }
    }
  });
  
  return Array.from(badgeCounts.entries()).map(([value, data]) => ({
    value,
    displayValue: data.displayValue,
    count: data.count,
  }));
};

const getMakeVehicleCount = (make: string) => {
  return allVehiclesData.value.filter((vehicle: any) => {
    const vehicleMake = vehicle.make?.displayValue?.[0]?.toLowerCase() || vehicle.make?.value?.[0]?.toLowerCase() || '';
    return vehicleMake === make.toLowerCase();
  }).length;
};

const toggleMakeExpansion = (make: string) => {
  const index = expandedMakes.value.indexOf(make);
  if (index > -1) {
    expandedMakes.value.splice(index, 1);
  } else {
    expandedMakes.value.push(make);
  }
};

const toggleModelExpansion = (modelValue: string) => {
  const index = expandedModels.value.indexOf(modelValue);
  if (index > -1) {
    expandedModels.value.splice(index, 1);
  } else {
    expandedModels.value.push(modelValue);
  }
};

const toggleMake = (make: string) => {
  const index = filters.make.indexOf(make);
  if (index > -1) {
    filters.make.splice(index, 1);
    // Remove models belonging to this make
    const modelsToRemove = filterOptions.value.models
      .filter((mo: any) => mo.displayMake?.toLowerCase() === make.toLowerCase())
      .map((mo: any) => mo.value);
    filters.model = filters.model.filter(m => !modelsToRemove.includes(m));
    // Remove badges belonging to removed models
    filters.badge = filters.badge.filter(b => {
      const badgeVehicle = allVehiclesData.value.find((v: any) => {
        const vMake = v.make?.displayValue?.[0]?.toLowerCase() || v.make?.value?.[0]?.toLowerCase() || '';
        const vBadge = v.badge?.value?.[0]?.toLowerCase() || v.badge?.displayValue?.[0]?.toLowerCase() || '';
        return vMake === make.toLowerCase() && vBadge === b.toLowerCase();
      });
      return !badgeVehicle;
    });
  } else {
    filters.make.push(make);
    // Auto-expand the make
    if (!expandedMakes.value.includes(make)) {
      expandedMakes.value.push(make);
    }
  }
  applyFilters();
};

const toggleModel = (modelValue: string, parentMake?: string) => {
  const index = filters.model.indexOf(modelValue);
  
  // Find the make for this model if not provided
  const modelInfo = filterOptions.value.models.find((m: any) => m.value === modelValue);
  const make = parentMake || modelInfo?.displayMake?.toLowerCase() || '';
  
  if (index > -1) {
    filters.model.splice(index, 1);
    // Remove from model-make map
    delete modelMakeMap.value[modelValue];
    // Remove badges belonging to this model
    const modelName = modelValue.toLowerCase();
    const badgesToRemove: string[] = [];
    Object.entries(badgeModelMap.value).forEach(([badge, model]) => {
      if (model.toLowerCase() === modelName) {
        badgesToRemove.push(badge);
      }
    });
    badgesToRemove.forEach(badge => {
      const badgeIndex = filters.badge.indexOf(badge);
      if (badgeIndex > -1) filters.badge.splice(badgeIndex, 1);
      delete badgeModelMap.value[badge];
    });
  } else {
    filters.model.push(modelValue);
    
    // Track which make this model belongs to
    if (make) {
      modelMakeMap.value[modelValue] = make;
    }
    
    // Auto-select the parent make if not already selected
    if (make && !filters.make.includes(make)) {
      filters.make.push(make);
      if (!expandedMakes.value.includes(make)) {
        expandedMakes.value.push(make);
      }
    }
    
    // Auto-expand the model
    if (!expandedModels.value.includes(modelValue)) {
      expandedModels.value.push(modelValue);
    }
  }
  applyFilters();
};

const toggleBadge = (badgeValue: string, parentModel?: string, parentMake?: string) => {
  const index = filters.badge.indexOf(badgeValue);
  if (index > -1) {
    filters.badge.splice(index, 1);
    // Remove from badge-model map
    delete badgeModelMap.value[badgeValue];
  } else {
    filters.badge.push(badgeValue);
    
    // Track which model this badge belongs to
    if (parentModel) {
      badgeModelMap.value[badgeValue] = parentModel;
    }
    
    // Auto-select the parent model if provided and not already selected
    if (parentModel && !filters.model.includes(parentModel)) {
      filters.model.push(parentModel);
      if (!expandedModels.value.includes(parentModel)) {
        expandedModels.value.push(parentModel);
      }
      
      // Also auto-select the parent make
      if (parentMake && !filters.make.includes(parentMake)) {
        filters.make.push(parentMake);
        if (!expandedMakes.value.includes(parentMake)) {
          expandedMakes.value.push(parentMake);
        }
      }
    }
  }
  applyFilters();
};

const priceSteps = computed(() => {
  const steps: number[] = [];
  const max = filterOptions.value.priceRange.max || 150000;
  for (let value = 20000; value <= max + 10000; value += 10000) {
    steps.push(value);
  }
  return steps;
});

const yearSteps = computed(() => {
  const steps: number[] = [];
  const { min, max } = filterOptions.value.yearRange;
  for (let year = max; year >= min; year -= 1) {
    steps.push(year);
  }
  return steps;
});

const kmsSteps = computed(() => {
  const steps: number[] = [];
  const max = Math.max(filterOptions.value.kmsRange.max || 200000, 200000);
  for (let value = 0; value <= max + 25000; value += 25000) {
    steps.push(value);
  }
  return steps;
});

const hasActiveFilters = computed(() => {
  return (
    filters.condition.length > 0 ||
    filters.make.length > 0 ||
    filters.model.length > 0 ||
    filters.badge.length > 0 ||
    filters.body.length > 0 ||
    filters.fuel.length > 0 ||
    filters.transmission.length > 0 ||
    filters.colour.length > 0 ||
    filters.priceMin !== null ||
    filters.priceMax !== null ||
    filters.yearMin !== null ||
    filters.yearMax !== null ||
    filters.kmsMin !== null ||
    filters.kmsMax !== null ||
    filters.suburb ||
    searchKeywords.value
  );
});

const activeFilterCount = computed(() => {
  let count = 0;
  count += filters.condition.length;
  count += filters.make.length;
  count += filters.model.length;
  count += filters.badge.length;
  count += filters.body.length;
  count += filters.fuel.length;
  count += filters.transmission.length;
  count += filters.colour.length;
  if (filters.priceMin !== null || filters.priceMax !== null) count++;
  if (filters.yearMin !== null || filters.yearMax !== null) count++;
  if (filters.kmsMin !== null || filters.kmsMax !== null) count++;
  if (filters.suburb) count++;
  if (searchKeywords.value) count++;
  return count;
});

const totalPages = computed(() => Math.ceil(totalCount.value / pageSize.value));

const visiblePages = computed(() => {
  const pages = [];
  const start = Math.max(1, currentPage.value - 2);
  const end = Math.min(totalPages.value, start + 4);
  for (let i = start; i <= end; i++) pages.push(i);
  return pages;
});

const priceLabel = computed(() => {
  const min = filters.priceMin ? `$${formatNumber(filters.priceMin)}` : '';
  const max = filters.priceMax ? `$${formatNumber(filters.priceMax)}` : '';
  if (min && max) return `${min} - ${max}`;
  if (min) return `${min}+`;
  if (max) return `Up to ${max}`;
  return 'Any';
});

const yearLabel = computed(() => {
  const { yearMin, yearMax } = filters;
  if (yearMin && yearMax) return `${yearMin}-${yearMax}`;
  if (yearMin) return `${yearMin}+`;
  if (yearMax) return `Up to ${yearMax}`;
  return 'Any';
});

const kmsLabel = computed(() => {
  const { kmsMin, kmsMax } = filters;
  if (kmsMin && kmsMax) return `${formatNumber(kmsMin)} - ${formatNumber(kmsMax)} km`;
  if (kmsMin) return `${formatNumber(kmsMin)}+ km`;
  if (kmsMax) return `Up to ${formatNumber(kmsMax)} km`;
  return 'Any';
});

const activeFilterChips = computed(() => {
  const chips: { key: string; value?: string | number; label: string }[] = [];
  filters.condition.forEach(cond => chips.push({ key: 'condition', value: cond, label: cond }));
  filters.make.forEach(make => chips.push({ key: 'make', value: make, label: `Make: ${make}` }));
  filters.model.forEach(model => chips.push({ key: 'model', value: model, label: `Model: ${model}` }));
  filters.badge.forEach(badge => chips.push({ key: 'badge', value: badge, label: `Badge: ${badge}` }));
  filters.body.forEach(body => chips.push({ key: 'body', value: body, label: `Body: ${body}` }));
  filters.fuel.forEach(fuel => chips.push({ key: 'fuel', value: fuel, label: `Fuel: ${fuel}` }));
  filters.transmission.forEach(trans => chips.push({ key: 'transmission', value: trans, label: `Trans: ${trans}` }));
  filters.colour.forEach(colour => chips.push({ key: 'colour', value: colour, label: `Colour: ${colour}` }));
  if (filters.priceMin || filters.priceMax) chips.push({ key: 'price', label: `Price ${priceLabel.value}` });
  if (filters.yearMin || filters.yearMax) chips.push({ key: 'year', label: `Year ${yearLabel.value}` });
  if (filters.kmsMin || filters.kmsMax) chips.push({ key: 'kms', label: `Kms ${kmsLabel.value}` });
  if (filters.suburb) chips.push({ key: 'suburb', label: `Location: ${filters.suburb}` });
  if (searchKeywords.value) chips.push({ key: 'search', label: `Search: ${searchKeywords.value}` });
  return chips;
});

const formatNumber = (num: number) => num.toLocaleString();

const applyFilters = () => {
  currentPage.value = 1;
  if (process.client && window.innerWidth < 1024) {
    showFiltersMobile.value = false;
  }
  updateUrl();
  fetchVehicles();
};

const clearFilters = () => {
  filters.condition = [];
  filters.make = [];
  filters.model = [];
  filters.badge = [];
  filters.body = [];
  filters.fuel = [];
  filters.transmission = [];
  filters.colour = [];
  filters.priceMin = null;
  filters.priceMax = null;
  filters.yearMin = null;
  filters.yearMax = null;
  filters.kmsMin = null;
  filters.kmsMax = null;
  filters.suburb = '';
  searchKeywords.value = '';
  expandedMakes.value = [];
  expandedModels.value = [];
  makeModelSearch.value = '';
  // Clear faceted filter maps
  modelMakeMap.value = {};
  badgeModelMap.value = {};
  applyFilters();
};

const removeChip = (chip: { key: string; value?: string | number }) => {
  switch (chip.key) {
    case 'condition':
      filters.condition = filters.condition.filter(c => c !== chip.value);
      break;
    case 'make':
      filters.make = filters.make.filter(m => m !== chip.value);
      break;
    case 'model':
      filters.model = filters.model.filter(m => m !== chip.value);
      break;
    case 'badge':
      filters.badge = filters.badge.filter(b => b !== chip.value);
      break;
    case 'body':
      filters.body = filters.body.filter(b => b !== chip.value);
      break;
    case 'fuel':
      filters.fuel = filters.fuel.filter(f => f !== chip.value);
      break;
    case 'transmission':
      filters.transmission = filters.transmission.filter(t => t !== chip.value);
      break;
    case 'colour':
      filters.colour = filters.colour.filter(c => c !== chip.value);
      break;
    case 'price':
      filters.priceMin = null;
      filters.priceMax = null;
      break;
    case 'year':
      filters.yearMin = null;
      filters.yearMax = null;
      break;
    case 'kms':
      filters.kmsMin = null;
      filters.kmsMax = null;
      break;
    case 'suburb':
      filters.suburb = '';
      break;
    case 'search':
      searchKeywords.value = '';
      break;
  }
  applyFilters();
};

const goToPage = (page: number) => {
  if (page < 1 || page > totalPages.value) return;
  currentPage.value = page;
  updateUrl();
  fetchVehicles();
  if (process.client) window.scrollTo({ top: 0, behavior: 'smooth' });
};

const buildSearchParams = () => {
  const params: Record<string, any> = {
    page: currentPage.value,
    limit: pageSize.value,
  };

  const sortMap: Record<string, { sort: string; order?: string }> = {
    featured: { sort: 'price-asc' },
    'price-asc': { sort: 'price-asc' },
    'price-desc': { sort: 'price-desc' },
    'year-desc': { sort: 'year-desc' },
    'year-asc': { sort: 'year-asc' },
    'km-asc': { sort: 'kms-asc' },
  };

  const sortValue = sortMap[sortBy.value] ?? sortMap['price-asc'];
  if (!sortValue) {
    params.sort = 'price-asc';
    return params;
  }
  params.sort = sortValue.sort;
  if (sortValue.order) params.order = sortValue.order;

  if (filters.condition.length) params.condition = filters.condition.join(',');
  if (filters.make.length) params.make = filters.make.join(',');
  if (filters.model.length) {
    params.model = filters.model.join(',');
    // Send make-model associations for faceted filtering
    const makeModelAssoc = Object.entries(modelMakeMap.value)
      .map(([model, make]) => `${make}:${model}`)
      .join(',');
    if (makeModelAssoc) params.makeModels = makeModelAssoc;
  }
  if (filters.badge.length) {
    params.badge = filters.badge.join(',');
    // Send model-badge associations for faceted filtering
    const modelBadgeAssoc = Object.entries(badgeModelMap.value)
      .map(([badge, model]) => `${model}:${badge}`)
      .join(',');
    if (modelBadgeAssoc) params.modelBadges = modelBadgeAssoc;
  }
  if (filters.body.length) params.body = filters.body.join(',');
  if (filters.fuel.length) params.fuel = filters.fuel.join(',');
  if (filters.transmission.length) params.transmission = filters.transmission.join(',');
  if (filters.colour.length) params.colour = filters.colour.join(',');
  if (filters.priceMin !== null) params.minPrice = filters.priceMin;
  if (filters.priceMax !== null) params.maxPrice = filters.priceMax;
  if (filters.yearMin !== null) params.minYear = filters.yearMin;
  if (filters.yearMax !== null) params.maxYear = filters.yearMax;
  if (filters.kmsMin !== null) params.minKms = filters.kmsMin;
  if (filters.kmsMax !== null) params.maxKms = filters.kmsMax;
  if (filters.suburb) params.keyword = filters.suburb;
  if (searchKeywords.value) params.keyword = searchKeywords.value;

  return params;
};

const fetchVehicles = async () => {
  loading.value = true;
  try {
    const params = buildSearchParams();
    const response = await $fetch<any>('/api/search', { params });
    vehicles.value = response?.vehicles || [];
    totalCount.value = response?.total || 0;
  } catch (error) {
    console.error('Failed to fetch vehicles:', error);
    vehicles.value = [];
    totalCount.value = 0;
  } finally {
    loading.value = false;
  }
};

const updateUrl = () => {
  const query: Record<string, string> = {};
  if (filters.condition.length) query.condition = filters.condition.join(',');
  if (filters.make.length) query.make = filters.make.join(',');
  if (filters.model.length) query.model = filters.model.join(',');
  if (filters.badge.length) query.badge = filters.badge.join(',');
  if (filters.body.length) query.body = filters.body.join(',');
  if (filters.fuel.length) query.fuel = filters.fuel.join(',');
  if (filters.transmission.length) query.transmission = filters.transmission.join(',');
  if (filters.colour.length) query.colour = filters.colour.join(',');
  if (filters.priceMin !== null) query.price_min = String(filters.priceMin);
  if (filters.priceMax !== null) query.price_max = String(filters.priceMax);
  if (filters.yearMin !== null) query.year_min = String(filters.yearMin);
  if (filters.yearMax !== null) query.year_max = String(filters.yearMax);
  if (filters.kmsMin !== null) query.kms_min = String(filters.kmsMin);
  if (filters.kmsMax !== null) query.kms_max = String(filters.kmsMax);
  if (filters.suburb) query.suburb = filters.suburb;
  if (searchKeywords.value) query.q = searchKeywords.value;
  if (sortBy.value !== 'featured') query.sort = sortBy.value;
  if (currentPage.value > 1) query.page = String(currentPage.value);
  router.replace({ query });
};

const syncFromQuery = () => {
  const q = route.query;
  if (q.condition) filters.condition = (q.condition as string).split(',');
  
  // Parse makes from query
  const queryMakes = q.make ? (q.make as string).split(',') : [];
  
  // Parse models and validate they belong to selected makes
  // Also build modelMakeMap for faceted filtering
  const queryModels = q.model ? (q.model as string).split(',') : [];
  const validatedModels: string[] = [];
  const makesFromModels: string[] = [];
  const newModelMakeMap: Record<string, string> = {};
  
  queryModels.forEach(modelValue => {
    // Try to find the model in filterOptions
    // Model values should be in slug format (e.g., "transit-custom")
    let modelInfo = filterOptions.value.models.find((m: any) => m.value === modelValue);
    
    // If not found by exact match, try case-insensitive match
    if (!modelInfo) {
      const modelValueLower = modelValue.toLowerCase();
      modelInfo = filterOptions.value.models.find((m: any) => 
        (m.value || '').toLowerCase() === modelValueLower
      );
    }
    
    if (modelInfo) {
      const modelMake = modelInfo.displayMake?.toLowerCase() || '';
      validatedModels.push(modelInfo.value); // Use the canonical value from API
      // Track model -> make association
      if (modelMake) {
        newModelMakeMap[modelInfo.value] = modelMake;
        if (!makesFromModels.includes(modelMake)) {
          makesFromModels.push(modelMake);
        }
      }
    }
  });
  
  // Combine query makes with makes derived from models (ensure consistency)
  const allMakes = [...new Set([...queryMakes, ...makesFromModels])];
  filters.make = allMakes;
  filters.model = validatedModels;
  modelMakeMap.value = newModelMakeMap;
  
  // Auto-expand selected makes and models
  expandedMakes.value = [...allMakes];
  expandedModels.value = [...validatedModels];
  
  // Parse badges and validate they exist for selected models
  // Also build the badgeModelMap for faceted filtering
  if (q.badge) {
    const queryBadges = (q.badge as string).split(',');
    const validBadges: string[] = [];
    const newBadgeModelMap: Record<string, string> = {};
    
    queryBadges.forEach(badge => {
      // Find which model this badge belongs to from vehicle data
      const matchingVehicle = allVehiclesData.value.find((v: any) => {
        const vModel = v.model?.displayValue?.[0]?.toLowerCase() || v.model?.value?.[0]?.toLowerCase() || '';
        const vBadge = v.badge?.value?.[0]?.toLowerCase() || v.badge?.displayValue?.[0]?.toLowerCase() || '';
        return vBadge === badge.toLowerCase() && (validatedModels.length === 0 || validatedModels.some(m => vModel.includes(m.toLowerCase())));
      });
      
      if (matchingVehicle || validatedModels.length === 0) {
        validBadges.push(badge);
        // Map badge to its model
        if (matchingVehicle) {
          const vModel = matchingVehicle.model?.displayValue?.[0]?.toLowerCase() || matchingVehicle.model?.value?.[0]?.toLowerCase() || '';
          newBadgeModelMap[badge] = vModel;
        }
      }
    });
    
    filters.badge = validBadges;
    badgeModelMap.value = newBadgeModelMap;
  }
  
  if (q.body) filters.body = (q.body as string).split(',');
  if (q.fuel) filters.fuel = (q.fuel as string).split(',');
  if (q.transmission) filters.transmission = (q.transmission as string).split(',');
  if (q.colour) filters.colour = (q.colour as string).split(',');
  if (q.price_min) filters.priceMin = parseInt(q.price_min as string);
  if (q.price_max) filters.priceMax = parseInt(q.price_max as string);
  if (q.year_min) filters.yearMin = parseInt(q.year_min as string);
  if (q.year_max) filters.yearMax = parseInt(q.year_max as string);
  if (q.kms_min) filters.kmsMin = parseInt(q.kms_min as string);
  if (q.kms_max) filters.kmsMax = parseInt(q.kms_max as string);
  if (q.suburb) filters.suburb = q.suburb as string;
  if (q.perweek) {
    const [minWeek = NaN, maxWeek = NaN] = (q.perweek as string).split('-').map(v => parseInt(v));
    if (!isNaN(minWeek)) filters.priceMin = Math.round(calculatePriceFromWeekly(minWeek));
    if (!isNaN(maxWeek)) filters.priceMax = Math.round(calculatePriceFromWeekly(maxWeek));
  }
  if (q.q) searchKeywords.value = q.q as string;
  if (q.sort) sortBy.value = q.sort as string;
  if (q.page) currentPage.value = parseInt(q.page as string);
};

const debouncedSearch = useDebounceFn(() => {
  applyFilters();
}, 300);

// Analytics tracking
const { trackEnquiryModalOpen } = useAnalytics();

// Close enquiry modal
const closeEnquiryModal = () => {
  vehiclesStore.setVehicleEnquiryPopUp(false, null);
};

// Check for stock param in URL to open enquiry modal
const checkStockParam = async () => {
  const stockId = route.query.stock as string;
  if (stockId) {
    // Try to find the vehicle in current results first
    let vehicle = vehicles.value.find(
      (v: any) => String(v.stockid) === stockId || String(v.identifier) === stockId
    );
    
    // If not found, fetch directly
    if (!vehicle) {
      try {
        const response = await $fetch<any>('/api/carsales-feed');
        const allVehicles = response?.vehiclesData || [];
        vehicle = allVehicles.find(
          (v: any) => String(v.stockid) === stockId || String(v.identifier) === stockId
        );
      } catch (e) {
        console.error('Failed to fetch vehicle for modal:', e);
      }
    }
    
    if (vehicle) {
      // Track enquiry modal open from stock param (e.g., from Google Ads)
      trackEnquiryModalOpen({
        vehicle,
        source: 'stock_param',
        page_url: window.location.href,
      });
      vehiclesStore.setVehicleEnquiryPopUp(true, vehicle);
    }
  }
};

onMounted(async () => {
  // Restore viewMode from localStorage
  const savedViewMode = localStorage.getItem(LAYOUT_STORAGE_KEY);
  if (savedViewMode === 'grid' || savedViewMode === 'list') {
    viewMode.value = savedViewMode;
  }
  
  await fetchFilterOptions();
  syncFromQuery();
  fetchVehicles();
  
  // Check for stock param after vehicles are loaded
  await nextTick();
  checkStockParam();
});

// Watch for stock param changes
watch(() => route.query.stock, (stockId) => {
  if (stockId) {
    checkStockParam();
  }
});
</script>

<style scoped>
.car-sales-header {
  background: linear-gradient(135deg, #001E50 0%, #1a4a8a 100%);
}

/* Custom scrollbar for filter sidebar */
@media (min-width: 1280px) {
  aside::-webkit-scrollbar {
    width: 6px;
  }
  
  aside::-webkit-scrollbar-track {
    background: transparent;
  }
  
  aside::-webkit-scrollbar-thumb {
    background-color: #cbd5e1;
    border-radius: 3px;
  }
  
  aside::-webkit-scrollbar-thumb:hover {
    background-color: #94a3b8;
  }
}
</style>



