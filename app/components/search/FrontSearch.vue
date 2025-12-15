<template>
  <div class="front-search">
    <!-- Quick Links Bar -->
    <div class="uk-container uk-container-large s-wp uk-background-secondary uk-light">
      <ClientOnly>
        <div class="uk-grid-collapse uk-child-width-1-3 uk-child-width-1-5@l uk-text-center uk-margin-small-top uk-margin-small-bottom iconnav" uk-grid>
          <div>
            <NuxtLink to="/service" class="uk-link-reset uk-width-1-1">
              <div class="uk-padding-small">
                <span uk-icon="icon: cog; ratio: 2"></span>
                <div class="icontxt uk-text-bold uk-h5 uk-margin-small">Servicing available</div>
                <button class="uk-button uk-button-text uk-width-auto uk-visible@s">
                  Book a Service
                </button>
              </div>
            </NuxtLink>
          </div>

          <div>
            <NuxtLink to="/test-drive" class="uk-link-reset uk-width-1-1">
              <div class="uk-padding-small">
                <span uk-icon="icon: car; ratio: 2"></span>
                <div class="icontxt uk-text-bold uk-h5 uk-margin-small">Test Drive a Hyundai</div>
                <button class="uk-button uk-button-text uk-width-auto uk-visible@s">
                  Book a Test Drive
                </button>
              </div>
            </NuxtLink>
          </div>

          <div>
            <NuxtLink to="/special-offers" class="uk-link-reset uk-width-1-1">
              <div class="uk-padding-small">
                <span uk-icon="icon: tag; ratio: 2"></span>
                <div class="icontxt uk-text-bold uk-h5 uk-margin-small">Current Offers</div>
                <button class="uk-button uk-button-text uk-width-auto uk-visible@s">
                  View Offers
                </button>
              </div>
            </NuxtLink>
          </div>

          <div>
            <NuxtLink to="/contact" class="uk-link-reset uk-width-1-1">
              <div class="uk-padding-small">
                <span uk-icon="icon: mail; ratio: 2"></span>
                <div class="icontxt uk-text-bold uk-h5 uk-margin-small">Make an Enquiry</div>
                <button class="uk-button uk-button-text uk-width-auto uk-visible@s">
                  More Info
                </button>
              </div>
            </NuxtLink>
          </div>

          <div>
            <a href="#location" class="uk-link-reset uk-width-1-1">
              <div class="uk-padding-small">
                <span uk-icon="icon: location; ratio: 2"></span>
                <div class="icontxt uk-text-bold uk-h5 uk-margin-small">Location</div>
                <div class="uk-text-small icontxtsm uk-visible@s">
                  {{ address }}
                </div>
              </div>
            </a>
          </div>

          <div class="uk-hidden@l">
            <a 
              class="uk-link-reset uk-width-1-1" 
              :href="`tel:${phone?.replace(/[^0-9+]/g, '')}`"
            >
              <div class="uk-padding-small">
                <span uk-icon="icon: receiver; ratio: 2"></span>
                <div class="icontxt uk-text-bold uk-h5 uk-margin-small">Call Us</div>
                <div class="uk-text-small icontxtsm uk-visible@s">
                  {{ siteName }}
                </div>
              </div>
            </a>
          </div>
        </div>
        <template #fallback>
          <div class="uk-flex uk-flex-center uk-padding">
            <div uk-spinner></div>
          </div>
        </template>
      </ClientOnly>
    </div>

    <!-- New Search Section with Tailwind -->
    <ClientOnly>
      <div class="max-w-5xl mx-auto px-4 py-8">
        <!-- Loading State -->
        <div v-if="isInitializing" class="bg-white dark:bg-[#1A1A1A] rounded-lg shadow-sm p-8 text-center">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-300 dark:border-gray-600 mx-auto mb-4" />
          <p class="text-gray-600 dark:text-[#CCCCCC]">Loading vehicle filters...</p>
        </div>

        <!-- Main Content -->
        <div v-else>
          <!-- Header -->
          <div class="text-center mb-12">
            <h2 class="text-3xl sm:text-4xl font-semibold mb-3 text-gray-900 dark:text-white tracking-tight">
              Get matched to your perfect car
            </h2>
            <p class="text-gray-600 dark:text-[#CCCCCC] text-base mb-10">
              Select your preferences to find available vehicles
            </p>
          </div>

          <!-- Filter Buttons Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
            <!-- Weekly Budget Filter -->
            <button
              class="w-full px-6 pr-4 bg-white dark:bg-[#1A1A1A] border border-gray-300 dark:border-gray-400 rounded-xl flex items-center justify-between gap-4 font-medium text-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#2A2A2A] transition-all duration-200 h-[96px] group shadow-sm hover:shadow-md"
              @click="openDialog('budget')"
            >
              <div class="flex items-center gap-5 min-w-0 flex-1">
                <div class="w-12 h-12 rounded-full bg-gray-100 dark:bg-[#2A2A2A] flex items-center justify-center flex-shrink-0">
                  <svg class="w-6 h-6 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <div class="flex flex-col items-start min-w-0 flex-1 overflow-hidden">
                  <span class="text-left font-semibold text-gray-900 dark:text-white text-lg truncate w-full">
                    {{ getActiveFilterText('perweek', 'Weekly Budget') }}
                  </span>
                  <span class="text-left text-base text-gray-500 dark:text-gray-400 truncate w-full">
                    Filter by weekly payment amount
                  </span>
                </div>
              </div>
              <svg class="w-6 h-6 text-gray-600 dark:text-gray-300 flex-shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <!-- Condition Filter -->
            <button
              class="w-full px-6 pr-4 bg-white dark:bg-[#1A1A1A] border border-gray-300 dark:border-gray-400 rounded-xl flex items-center justify-between gap-4 font-medium text-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#2A2A2A] transition-all duration-200 h-[96px] group shadow-sm hover:shadow-md"
              @click="openDialog('condition')"
            >
              <div class="flex items-center gap-5 min-w-0 flex-1">
                <div class="w-12 h-12 rounded-full bg-gray-100 dark:bg-[#2A2A2A] flex items-center justify-center flex-shrink-0">
                  <svg class="w-6 h-6 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
                <div class="flex flex-col items-start min-w-0 flex-1 overflow-hidden">
                  <span class="text-left font-semibold text-gray-900 dark:text-white text-lg truncate w-full">
                    {{ getActiveFilterText('condition', `All ${allConditionsWithTrueCounts.reduce((sum, c) => sum + c.trueCount, 0)} Vehicles`) }}
                  </span>
                  <span class="text-left text-base text-gray-500 dark:text-gray-400 truncate w-full">
                    Select vehicle condition type
                  </span>
                </div>
              </div>
              <svg class="w-6 h-6 text-gray-600 dark:text-gray-300 flex-shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <!-- Makes and Models Filter -->
            <button
              class="w-full px-6 pr-4 bg-white dark:bg-[#1A1A1A] border border-gray-300 dark:border-gray-400 rounded-xl flex items-center justify-between gap-4 font-medium text-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#2A2A2A] transition-all duration-200 min-h-[96px] group shadow-sm hover:shadow-md"
              @click="openDialog('model')"
            >
              <div class="flex items-center gap-5 min-w-0 flex-1">
                <div class="w-12 h-12 rounded-full bg-gray-100 dark:bg-[#2A2A2A] flex items-center justify-center flex-shrink-0">
                  <svg class="w-6 h-6 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div class="flex flex-col items-start min-w-0 flex-1 overflow-hidden">
                  <span class="text-left font-semibold text-gray-900 dark:text-white text-lg leading-tight truncate w-full">
                    {{ getActiveFilterText('model', `All ${filteredMakes.reduce((sum, m) => sum + (m.count ?? 0), 0)} Vehicles`) }}
                  </span>
                  <span class="text-left text-base text-gray-500 dark:text-gray-400 truncate w-full">
                    Browse by manufacturer and model
                  </span>
                </div>
              </div>
              <svg class="w-6 h-6 text-gray-600 dark:text-gray-300 flex-shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <!-- Discover Button -->
            <NuxtLink
              :to="{ path: '/car-sales', query: currentFilterQuery }"
              class="w-full bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-black rounded-xl overflow-hidden flex items-center px-6 pr-4 gap-5 h-[96px] transition-colors shadow-sm hover:shadow-md"
            >
              <div class="w-12 h-12 rounded-full bg-white/10 dark:bg-black/10 flex items-center justify-center flex-shrink-0">
                <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <div class="flex flex-col items-start min-w-0 flex-1 overflow-hidden">
                <span class="text-left font-extrabold text-white dark:text-black text-2xl truncate w-full">
                  Show {{ filteredVehicleCount }} Cars
                </span>
                <span class="text-left text-base text-white/80 dark:text-black/80 truncate w-full">
                  View filtered results
                </span>
              </div>
            </NuxtLink>
          </div>

          <!-- Active Filters -->
          <div v-if="hasActiveFilters" class="pt-8">
            <h3 class="text-center text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Active Filters
            </h3>
            <div class="flex flex-wrap gap-3 justify-center">
              <div
                v-for="(item, index) in activeFiltersDisplay"
                :key="`${item.filterName}-${index}`"
                class="px-4 py-2 bg-gray-100 dark:bg-[#1A1A1A] border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-full flex items-center text-base"
              >
                <span>{{ item.displayLabel }}: {{ item.displayValue }}</span>
                <button
                  class="ml-2 p-0 h-auto w-auto hover:bg-transparent text-gray-600 dark:text-[#CCCCCC] hover:text-gray-900 dark:hover:text-white"
                  @click="item.isArrayItem ? removeFilterItem(item.filterName, item.value) : clearFilter(item.filterName)"
                >
                  <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <button
                v-if="activeFiltersDisplay.length > 0"
                class="px-5 py-2.5 rounded-full border border-red-500 dark:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-base font-medium"
                @click="clearAllFilters"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Budget Dialog -->
      <ResponsiveFilterDialog
        :open="isOpen('budget')"
        title="Weekly Budget"
        description="Set your preferred weekly payment range"
        :current-tab="isOpen('budget') ? 'budget' : ''"
        :tabs="desktopTabs.map(tab => ({ id: tab.id, label: tab.label, count: getSelectedCountForTab(tab.id) }))"
        @update:open="(val: boolean) => (val ? openDialog('budget') : closeDialog('budget'))"
        @tab-click="(tabId: string) => navigateToTab(tabId as DialogTabId, 'budget')"
      >
        <template #content>
          <div class="px-6 pb-4 md:pb-0">
            <div class="grid grid-cols-2 gap-4 mb-6">
              <div class="space-y-2">
                <label class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 block">Min</label>
                <div class="w-full px-4 py-3.5 bg-gray-50 dark:bg-[#2A2A2A] border border-gray-200 dark:border-gray-700 rounded-lg text-lg font-semibold text-gray-900 dark:text-white">
                  ${{ formatPrice(weeklyBudget[0] || 0) }}
                </div>
              </div>
              <div class="space-y-2">
                <label class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 block">Max</label>
                <div class="w-full px-4 py-3.5 bg-gray-50 dark:bg-[#2A2A2A] border border-gray-200 dark:border-gray-700 rounded-lg text-lg font-semibold text-gray-900 dark:text-white">
                  ${{ formatPrice(weeklyBudget[1] || 0) }}
                </div>
              </div>
            </div>
            <div class="mb-5 relative" style="height: 20px;">
              <!-- Background track -->
              <div class="absolute top-1/2 left-0 right-0 h-2 bg-gray-200 dark:bg-gray-700 rounded-full transform -translate-y-1/2"></div>
              
              <!-- Active range track -->
              <div 
                class="absolute top-1/2 h-2 bg-blue-600 dark:bg-blue-500 rounded-full transform -translate-y-1/2"
                :style="{
                  left: `${((weeklyBudget[0] - minWeeklyBudget) / (maxWeeklyBudget - minWeeklyBudget)) * 100}%`,
                  width: `${((weeklyBudget[1] - weeklyBudget[0]) / (maxWeeklyBudget - minWeeklyBudget)) * 100}%`
                }"
              ></div>
              
              <!-- Min slider -->
              <input
                v-model.number="weeklyBudget[0]"
                type="range"
                :min="minWeeklyBudget"
                :max="weeklyBudget[1]"
                :step="1"
                class="absolute top-1/2 left-0 w-full h-2 bg-transparent appearance-none cursor-pointer slider-thumb transform -translate-y-1/2 z-10"
                @input="updateBudgetFilter"
              />
              
              <!-- Max slider -->
              <input
                v-model.number="weeklyBudget[1]"
                type="range"
                :min="weeklyBudget[0]"
                :max="maxWeeklyBudget"
                :step="1"
                class="absolute top-1/2 left-0 w-full h-2 bg-transparent appearance-none cursor-pointer slider-thumb transform -translate-y-1/2 z-20"
                @input="updateBudgetFilter"
              />
            </div>
          </div>
        </template>
        <template #footer>
          <div class="flex gap-3">
            <button
              class="flex-1 h-14 text-lg font-medium px-6 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              @click="() => { openDialog('condition'); closeDialog('budget'); }"
            >
              Next: Condition
            </button>
            <NuxtLink
              :to="{ path: '/car-sales', query: currentFilterQuery }"
              class="bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white dark:text-white rounded-lg flex items-center justify-center px-8 py-4 h-14 text-lg font-semibold transition-colors shadow-sm hover:shadow-md"
              @click="closeDialog('budget')"
            >
              Show {{ filteredVehicleCount }} cars
            </NuxtLink>
          </div>
        </template>
      </ResponsiveFilterDialog>

      <!-- Condition Dialog -->
      <ResponsiveFilterDialog
        :open="isOpen('condition')"
        :title="isDesktop ? 'Select Vehicle Types' : 'Available Vehicle Types'"
        :description="isDesktop ? 'Choose new, used, or demo vehicles.' : 'Explore our great range of new, demonstrator, and pre-owned vehicles across our network of dealerships.'"
        :current-tab="isOpen('condition') ? 'condition' : ''"
        :tabs="desktopTabs.map(tab => ({ id: tab.id, label: tab.label, count: getSelectedCountForTab(tab.id) }))"
        @update:open="(val: boolean) => (val ? openDialog('condition') : closeDialog('condition'))"
        @tab-click="(tabId: string) => navigateToTab(tabId as DialogTabId, 'condition')"
      >
        <template #content>
          <div class="px-6 pb-4 md:pb-0">
            <div class="space-y-1.5 mb-4">
              <div
                v-for="option in allConditionsWithTrueCounts"
                v-show="option.trueCount > 0 || isFilterOptionSelected('condition', option.value)"
                :key="option.value"
                :class="[
                  'flex items-center py-3 px-4 cursor-pointer rounded-lg -mx-3 sm:mx-0',
                  isFilterOptionSelected('condition', option.value)
                    ? 'bg-black text-white dark:bg-gray-200 dark:text-gray-900'
                    : 'text-gray-900 dark:text-gray-900 hover:bg-gray-100 dark:hover:bg-gray-100',
                ]"
                @click="toggleFilterOption('condition', option.value)"
              >
                <input
                  :id="`condition-${option.value}`"
                  type="checkbox"
                  :checked="isFilterOptionSelected('condition', option.value)"
                  class="mr-3 w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  @change="toggleFilterOption('condition', option.value)"
                  @click.stop
                />
                <label
                  :for="`condition-${option.value}`"
                  :class="[
                    'flex-1 cursor-pointer font-semibold text-lg select-none',
                    isFilterOptionSelected('condition', option.value)
                      ? 'text-white dark:text-gray-900'
                      : 'text-gray-900 dark:text-gray-900',
                  ]"
                  @click.stop
                >
                  {{ option.displayValue }}
                </label>
                <span
                  :class="[
                    'ml-auto text-lg',
                    isFilterOptionSelected('condition', option.value)
                      ? 'text-white/90 dark:text-gray-900'
                      : 'text-gray-600 dark:text-gray-600',
                  ]"
                >
                  {{ option.trueCount }}
                </span>
              </div>
            </div>
          </div>
        </template>
        <template #footer>
          <div class="flex gap-3">
            <button
              class="h-14 text-lg font-medium px-6 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              @click="() => { openDialog('budget'); closeDialog('condition'); }"
            >
              Back
            </button>
            <button
              class="flex-1 h-14 text-lg font-medium px-4 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              @click="() => { openDialog('model'); closeDialog('condition'); }"
            >
              Next: Models
            </button>
            <NuxtLink
              :to="{ path: '/car-sales', query: currentFilterQuery }"
              class="bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white dark:text-white rounded-lg flex items-center justify-center px-8 py-4 h-14 text-lg font-semibold transition-colors shadow-sm hover:shadow-md"
              @click="closeDialog('condition')"
            >
              Show {{ filteredVehicleCount }} cars
            </NuxtLink>
          </div>
        </template>
      </ResponsiveFilterDialog>

      <!-- Model Dialog -->
      <ResponsiveFilterDialog
        :open="isOpen('model')"
        :title="isDesktop ? 'Select Makes and Models' : 'Available Makes and Models'"
        description="Choose makes and/or specific models. Makes can be selected independently for broader filtering."
        :current-tab="isOpen('model') ? 'model' : ''"
        :tabs="desktopTabs.map(tab => ({ id: tab.id, label: tab.label, count: getSelectedCountForTab(tab.id) }))"
        @update:open="(val: boolean) => (val ? openDialog('model') : closeDialog('model'))"
        @tab-click="(tabId: string) => navigateToTab(tabId as DialogTabId, 'model')"
      >
        <template #content>
          <div class="px-6 pb-4 md:pb-0">
            <!-- Search -->
            <div class="relative mb-4">
              <input
                v-model="modelSearchQuery"
                type="text"
                placeholder="Search makes and models..."
                class="w-full pr-10 h-11 text-base bg-gray-100 dark:bg-gray-100 text-gray-900 dark:text-gray-900 placeholder:text-gray-500 dark:placeholder:text-gray-500 border border-gray-300 dark:border-gray-300 rounded-lg px-4"
              />
              <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg v-if="modelSearchQuery" class="h-5 w-5 text-gray-600 dark:text-[#CCCCCC]" fill="none" stroke="currentColor" viewBox="0 0 24 24" @click="clearModelSearch">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
                <svg v-else class="h-5 w-5 text-gray-600 dark:text-[#CCCCCC]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            <!-- Makes and Models List -->
            <div class="space-y-2">
              <div
                v-for="(models, make) in groupedModelsForDialog"
                :key="make"
                class="mb-3"
              >
                <div
                  :class="[
                    'flex items-center py-4 px-4 mb-2 cursor-pointer rounded-lg transition-colors border',
                    isMakeSelected(make)
                      ? 'bg-gray-100 dark:bg-gray-100 text-gray-900 dark:text-gray-900 border-gray-300 dark:border-gray-300'
                      : 'bg-white dark:bg-white text-gray-900 dark:text-gray-900 border-gray-200 dark:border-gray-200 hover:bg-gray-50 dark:hover:bg-gray-50',
                  ]"
                  @click="toggleMakeSelection(make)"
                >
                  <input
                    :id="`make-${make}`"
                    type="checkbox"
                    :checked="isMakeSelected(make)"
                    class="mr-3 w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    @change="toggleMakeSelection(make)"
                    @click.stop
                  />
                  <label
                    :for="`make-${make}`"
                    class="flex-1 cursor-pointer font-bold text-lg text-gray-900 dark:text-gray-900"
                    @click.stop="toggleMakeSelection(make)"
                  >
                    {{ make }}
                  </label>
                  <span class="ml-auto text-lg font-normal text-gray-900 dark:text-gray-900">
                    ({{ getMakeCount(make) }})
                  </span>
                </div>

                <!-- Models for this make -->
                <div v-show="isMakeExpanded(make)" class="ml-8 space-y-2">
                  <div
                    v-for="model in models"
                    :key="model.value"
                    :class="[
                      'flex items-center py-3 px-4 cursor-pointer rounded-lg transition-colors border',
                      isFilterOptionSelected('model', model.value)
                        ? 'bg-gray-100 dark:bg-gray-100 text-gray-900 dark:text-gray-900 border-gray-300 dark:border-gray-300'
                        : 'bg-white dark:bg-white text-gray-900 dark:text-gray-900 border-gray-200 dark:border-gray-200 hover:bg-gray-50 dark:hover:bg-gray-50',
                    ]"
                    @click="toggleFilterOption('model', model.value)"
                  >
                    <input
                      :id="`model-${model.value}`"
                      type="checkbox"
                      :checked="isFilterOptionSelected('model', model.value)"
                      class="mr-3 w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      @change="toggleFilterOption('model', model.value)"
                      @click.stop
                    />
                    <label
                      :for="`model-${model.value}`"
                      class="flex-1 cursor-pointer font-semibold text-base text-gray-900 dark:text-gray-900"
                      @click.stop="toggleFilterOption('model', model.value)"
                    >
                      {{ model.displayValue }}
                    </label>
                    <span class="ml-auto text-base text-gray-900 dark:text-gray-900">
                      ({{ model.count ?? 0 }})
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
        <template #footer>
          <div class="flex gap-3">
            <button
              class="flex-1 h-14 text-lg font-medium px-6 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              @click="() => { openDialog('condition'); closeDialog('model'); }"
            >
              Back
            </button>
            <NuxtLink
              :to="{ path: '/car-sales', query: currentFilterQuery }"
              class="bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white dark:text-white rounded-lg flex items-center justify-center px-8 py-4 h-14 text-lg font-semibold transition-colors shadow-sm hover:shadow-md"
              @click="closeDialog('model')"
            >
              Show {{ filteredVehicleCount }} cars
            </NuxtLink>
          </div>
        </template>
      </ResponsiveFilterDialog>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useMediaQuery, useDebounceFn } from '@vueuse/core';
import { useCustomizedSearchStore, type CustomizedSearchFilters } from '~/stores/customizedSearch';
import { useRouter, useRoute } from 'vue-router';
import { useVehiclesStore } from '~/stores/vehicles';
import { calculateWeeklyPayment } from '~/utils/finance';
import ResponsiveFilterDialog from '~/components/filters/ResponsiveFilterDialog.vue';

const mainStore = useMainStore();
const vehiclesStore = useVehiclesStore();
const customizedSearchStore = useCustomizedSearchStore();
const router = useRouter();
const route = useRoute();

const siteName = computed(() => mainStore.site?.name || 'Sale Hyundai');
const address = computed(() => mainStore.site?.showroom_address || '');
const phone = computed(() => mainStore.site?.departments?.sales?.phone || mainStore.site?.phone || '');

const isInitializing = ref(true);
const isDesktop = useMediaQuery('(min-width: 768px)');

const { open: openDialog, close: closeDialog, isOpen } = useDialogState();

const desktopTabs = [
  { id: 'budget', label: 'Budget' },
  { id: 'condition', label: 'Condition' },
  { id: 'model', label: 'Makes & Models' },
] as const;

type DialogTabId = (typeof desktopTabs)[number]['id'];

const navigateToTab = (targetTabId: DialogTabId, currentTabId: DialogTabId) => {
  if (targetTabId === currentTabId) return;
  openDialog(targetTabId);
  closeDialog(currentTabId);
};

const getSelectedCountForTab = (tabId: DialogTabId): number => {
  const filters = customizedSearchStore.filters;
  switch (tabId) {
    case 'condition':
      return filters.condition?.length || 0;
    case 'model':
      return (filters.make?.length || 0) + (filters.model?.length || 0);
    default:
      return 0;
  }
};

onMounted(async () => {
  try {
    if (vehiclesStore.vehicles.length === 0) {
      await vehiclesStore.fetchVehicles();
    }
  } catch (error) {
    console.error('Failed to fetch vehicles:', error);
  } finally {
    isInitializing.value = false;
  }
});

const minWeeklyBudget = computed(() => customizedSearchStore.perweekRange.min);
const maxWeeklyBudget = computed(() => customizedSearchStore.perweekRange.max);

const modelSearchQuery = computed({
  get: () => customizedSearchStore.modelSearchQuery,
  set: (val) => customizedSearchStore.setModelSearchQuery(val),
});

const filteredMakes = computed(() => customizedSearchStore.filteredMakesAndModels.makes);
const filteredModels = computed(() => customizedSearchStore.filteredMakesAndModels.models);
const filteredVehicleCount = computed(() => customizedSearchStore.filteredVehicleCount);

const groupedModelsForDialog = computed(() => {
  const grouped = customizedSearchStore.filteredGroupedModels;
  const q = (modelSearchQuery.value || '').trim().toLowerCase();
  if (!q) return grouped;

  const filtered: Record<string, any[]> = {};
  Object.entries(grouped).forEach(([make, models]) => {
    const makeLower = make.toLowerCase();
    if (makeLower.includes(q)) {
      filtered[make] = models;
    } else {
      const matchingModels = models.filter((m) =>
        (m.displayValue || '').toLowerCase().includes(q)
      );
      if (matchingModels.length > 0) {
        filtered[make] = matchingModels;
      }
    }
  });
  return filtered;
});

const clearModelSearch = () => customizedSearchStore.clearModelSearch();

const isFilterOptionSelected = (filterName: keyof CustomizedSearchFilters, optionValue: string) => {
  const selected = customizedSearchStore.filters[filterName];
  return Array.isArray(selected) && selected.includes(optionValue);
};

const toggleFilterOption = (filterName: 'condition' | 'make' | 'model', optionValue: string) => {
  const currentValues = [...(customizedSearchStore.filters[filterName] || [])];
  const index = currentValues.indexOf(optionValue);
  if (index > -1) {
    currentValues.splice(index, 1);
  } else {
    currentValues.push(optionValue);
  }
  customizedSearchStore.updateFilter(filterName, currentValues);
};

const isMakeSelected = (make: string): boolean => {
  return customizedSearchStore.isMakeSelected(make);
};

const expandedMakes = ref<Set<string>>(new Set());

const toggleMakeSelection = (make: string) => {
  customizedSearchStore.toggleMake(make);
  const isNowSelected = customizedSearchStore.isMakeSelected(make);
  if (isNowSelected) {
    expandedMakes.value.add(make);
  }
};

const isMakeExpanded = (make: string): boolean => {
  return expandedMakes.value.has(make) || isMakeSelected(make);
};

const getMakeCount = (make: string): number => {
  const makeOption = filteredMakes.value.find(
    (m) => m.displayValue.toLowerCase() === make.toLowerCase()
  );
  return makeOption?.count || 0;
};

const getActiveFilterText = (
  filterName: keyof CustomizedSearchFilters,
  defaultText: string
): string => {
  const currentFilters = customizedSearchStore.filters;
  const value = currentFilters[filterName];

  if (filterName === 'perweek') {
    const budget = value as { min: number; max: number } | undefined;
    if (budget && (budget.min !== minWeeklyBudget.value || budget.max !== maxWeeklyBudget.value)) {
      return `$${budget.min} - $${budget.max}`;
    }
    return defaultText;
  } else if (filterName === 'condition' && Array.isArray(value) && value.length > 0) {
    if (value.length === 1) {
      const condition = allConditionsWithTrueCounts.value.find((c) => c.value === value[0]);
      return condition?.displayValue || value[0] || '';
    }
    return `${value.length} Selected`;
  } else if (filterName === 'model') {
    const selectedMakes = currentFilters.make || [];
    const selectedModels = currentFilters.model || [];
    const totalSelections = selectedMakes.length + selectedModels.length;
    if (totalSelections === 0) return defaultText;
    if (totalSelections === 1) {
      if (selectedModels.length === 1) {
        const model = customizedSearchStore.selectedModels.find((m) => m.value === selectedModels[0]);
        return model ? `${model.displayMake} ${model.displayValue}` : selectedModels[0];
      }
      const make = customizedSearchStore.selectedMakes.find(
        (m) => m.value.toLowerCase() === selectedMakes[0].toLowerCase()
      );
      return make ? `${make.displayValue} (Make)` : defaultText;
    }
    const makeSummary = selectedMakes.length > 0 ? `${selectedMakes.length} ${selectedMakes.length === 1 ? 'Make' : 'Makes'}` : '';
    const modelSummary = selectedModels.length > 0 ? `${selectedModels.length} ${selectedModels.length === 1 ? 'Model' : 'Models'}` : '';
    return [makeSummary, modelSummary].filter(Boolean).join(' • ');
  }
  return defaultText;
};

const formatPrice = (value: number) => {
  if (isNaN(value)) return '0';
  return value.toLocaleString();
};

const weeklyBudget = ref<[number, number]>([minWeeklyBudget.value, maxWeeklyBudget.value]);

watch(
  () => customizedSearchStore.filters.perweek,
  (perweek) => {
    if (perweek) {
      weeklyBudget.value = [perweek.min, perweek.max];
    } else {
      weeklyBudget.value = [minWeeklyBudget.value, maxWeeklyBudget.value];
    }
  },
  { immediate: true }
);

const updateBudgetFilterDebounced = useDebounceFn((value: [number, number]) => {
  const tolerance = 1;
  const isFullRange =
    value[0] <= minWeeklyBudget.value + tolerance && value[1] >= maxWeeklyBudget.value - tolerance;
  if (isFullRange) {
    customizedSearchStore.updateFilter('perweek', undefined);
  } else {
    customizedSearchStore.updateFilter('perweek', { min: value[0], max: value[1] });
  }
}, 150);

const updateBudgetFilter = () => {
  updateBudgetFilterDebounced([weeklyBudget.value[0], weeklyBudget.value[1]]);
};

// Condition counts should be independent of other filters for display purposes
// But when showing in dialog, they should respect current filter context
const allConditionsWithTrueCounts = computed(() => {
  // Get condition filter from vehicles store availableFilters object
  const allConditionValues = vehiclesStore.availableFilters?.condition || [];
  const filters = customizedSearchStore.filters;
  const allVehicles = vehiclesStore.vehicles;

  // For button display: show counts independent of other filters
  // For dialog display: show counts based on current filter context
  // We'll calculate both and use contextual counts in dialog
  
  // Base vehicles (no filters applied) - for independent counts
  const baseVehicles = allVehicles;

  // Contextual vehicles (with current filters except condition) - for dialog counts
  const contextualVehicles = allVehicles.filter((vehicle: any) => {
    // Apply perweek filter
    if (filters.perweek) {
      const price = vehicle.egc_price || vehicle.dap_price || vehicle.price || 0;
      if (price > 0) {
        const weeklyPayment = calculateWeeklyPayment(price);
        if (weeklyPayment < filters.perweek.min || weeklyPayment > filters.perweek.max) {
          return false;
        }
      } else {
        return false;
      }
    }

    // Apply make/model filters (but not condition)
    const hasSelectedMakes = filters.make.length > 0;
    const hasSelectedModels = filters.model.length > 0;
    if (hasSelectedMakes || hasSelectedModels) {
      const vehicleMake = typeof vehicle.make === 'string' 
        ? vehicle.make.toLowerCase()
        : vehicle.make?.displayValue?.[0]?.toLowerCase() || vehicle.model?.displayMake?.[0]?.displayValue?.[0]?.toLowerCase() || '';
      const vehicleModel = typeof vehicle.model === 'string'
        ? vehicle.model.toLowerCase()
        : vehicle.model?.value?.[0]?.toLowerCase() || vehicle.model?.displayValue?.[0]?.toLowerCase() || '';
      let makeModelMatch = false;

      if (hasSelectedModels) {
        makeModelMatch = filters.model.some((selectedModel) => {
          const [makePart, ...modelParts] = selectedModel.toLowerCase().split('_');
          return vehicleMake === makePart && vehicleModel === modelParts.join('_');
        });
      }

      if (!makeModelMatch && hasSelectedMakes) {
        makeModelMatch = filters.make.some((selectedMake) => selectedMake.toLowerCase() === vehicleMake);
      }

      if (!makeModelMatch) return false;
    }

    return true;
  });

  // Calculate counts for each condition
  return allConditionValues.map((conditionValue: string) => {
    const displayValue = conditionValue.charAt(0).toUpperCase() + conditionValue.slice(1);
    const value = conditionValue;

    // Use contextual counts (respects current filters) for dialog display
    const trueCount = contextualVehicles.filter((vehicle: any) => {
      if (!vehicle) return false;
      const vehicleConditions = typeof vehicle.condition === 'string'
        ? [vehicle.condition]
        : Array.isArray(vehicle.condition?.value) 
          ? vehicle.condition.value 
          : vehicle.condition?.value 
            ? [vehicle.condition.value]
            : [];
      return vehicleConditions.some((vc: string) => {
        if (!vc) return false;
        return vc.toLowerCase() === value.toLowerCase();
      });
    }).length;

    return {
      value,
      displayValue,
      trueCount,
    };
  });
});

interface ActiveFilterItem {
  filterName: keyof CustomizedSearchFilters;
  value: any;
  displayLabel: string;
  displayValue: string;
  isArrayItem: boolean;
}

const activeFiltersDisplay = computed((): ActiveFilterItem[] => {
  const result: ActiveFilterItem[] = [];
  const filters = customizedSearchStore.filters;

  const filterLabels: Record<keyof CustomizedSearchFilters, string> = {
    make: 'Make',
    model: 'Model',
    condition: 'Condition',
    badge: 'Badge',
    modelBadges: 'Model Badges',
    perweek: 'Weekly Budget',
  };

  for (const key in filters) {
    const filterName = key as keyof CustomizedSearchFilters;
    const value = filters[filterName];
    const displayLabel = filterLabels[filterName] || filterName;

    if (filterName === 'perweek') {
      const budgetStoreValue = value as { min: number; max: number } | undefined;
      if (budgetStoreValue) {
        const isEffectivelyFullRange =
          budgetStoreValue.min === minWeeklyBudget.value && budgetStoreValue.max === maxWeeklyBudget.value;
        if (!isEffectivelyFullRange) {
          result.push({
            filterName,
            value: budgetStoreValue,
            displayLabel,
            displayValue: `$${budgetStoreValue.min} - $${budgetStoreValue.max}`,
            isArrayItem: false,
          });
        }
      }
    } else if (Array.isArray(value) && value.length > 0) {
      value.forEach((itemValue) => {
        let displayValue = String(itemValue);
        if (filterName === 'make') {
          const make = customizedSearchStore.selectedMakes.find(
            (m) => m.value.toLowerCase() === itemValue.toLowerCase()
          );
          displayValue = make?.displayValue || itemValue.charAt(0).toUpperCase() + itemValue.slice(1);
        } else if (filterName === 'model') {
          const model = customizedSearchStore.selectedModels.find((m) => m.value === itemValue);
          displayValue = model ? `${model.displayMake} ${model.displayValue}` : itemValue;
        } else if (filterName === 'condition') {
          const condition = allConditionsWithTrueCounts.value.find((c) => c.value === itemValue);
          displayValue = condition?.displayValue || itemValue.charAt(0).toUpperCase() + itemValue.slice(1);
        }

        result.push({
          filterName,
          value: itemValue,
          displayLabel,
          displayValue,
          isArrayItem: true,
        });
      });
    }
  }

  return result;
});

const hasActiveFilters = computed(() => activeFiltersDisplay.value.length > 0);

const clearFilter = (filterName: keyof CustomizedSearchFilters) => {
  customizedSearchStore.clearFilter(filterName);
};

const clearAllFilters = () => {
  customizedSearchStore.clearAllFilters();
};

const removeFilterItem = (filterName: keyof CustomizedSearchFilters, itemValue: string) => {
  customizedSearchStore.removeFilterItem(filterName, itemValue);
};

const currentFilterQuery = computed(() => {
  const query: Record<string, string> = {};
  const filters = customizedSearchStore.filters;

  if (filters.condition?.length) {
    query.condition = filters.condition.join(',');
  }

  if (filters.make?.length) {
    query.make = filters.make.join(',');
  }

  if (filters.model?.length) {
    // Transform model values from FrontSearch format (make_model name) 
    // to car-sales format (model-slug)
    // e.g., "ford_transit custom" -> "transit-custom"
    const transformedModels = filters.model.map((modelValue: string) => {
      // If the model value contains underscore, extract the model part
      if (modelValue.includes('_')) {
        const underscoreIndex = modelValue.indexOf('_');
        const modelPart = modelValue.substring(underscoreIndex + 1);
        // Replace spaces with hyphens to match car-sales API format
        return modelPart.replace(/\s+/g, '-');
      }
      return modelValue;
    });
    query.model = transformedModels.join(',');
  }

  if (filters.perweek) {
    const { min, max } = filters.perweek;
    if (!(min === 0 && max === 1000)) {
      query.perweek = `${min}-${max}`;
    }
  }

  return query;
});
</script>

<style lang="scss" scoped>
.s-wp {
  padding: 10px 0 0;
}

@media (min-width: 960px) {
  .s-wp {
    margin-top: 20px;
    border-radius: 20px;
    position: relative;
    z-index: 2;
  }
}

.iconnav {
  > div {
    transition: opacity 0.2s;

    &:hover {
      opacity: 0.8;
    }
  }
}

@media (max-width: 960px) {
  .icontxt {
    font-size: 0.7rem;
    line-height: 1.4;
  }
  
  .uk-text-meta.icontxtsm {
    font-size: 0.575rem;
  }
}

.slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  background: transparent;
  height: 8px;
  outline: none;
  pointer-events: none;
}

.slider-thumb::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  background: white;
  border: 2px solid #2563eb;
  border-radius: 50%;
  cursor: grab;
  pointer-events: all;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2), 0 0 0 4px rgba(37, 99, 235, 0.1);
  transition: all 0.2s ease;
}

.slider-thumb::-webkit-slider-thumb:hover {
  transform: scale(1.1);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3), 0 0 0 4px rgba(37, 99, 235, 0.15);
}

.slider-thumb::-webkit-slider-thumb:active {
  cursor: grabbing;
  transform: scale(1.15);
}

.slider-thumb::-moz-range-thumb {
  width: 20px;
  height: 20px;
  background: white;
  border: 2px solid #2563eb;
  border-radius: 50%;
  cursor: grab;
  pointer-events: all;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2), 0 0 0 4px rgba(37, 99, 235, 0.1);
  transition: all 0.2s ease;
}

.slider-thumb::-moz-range-thumb:hover {
  transform: scale(1.1);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3), 0 0 0 4px rgba(37, 99, 235, 0.15);
}

.slider-thumb::-moz-range-thumb:active {
  cursor: grabbing;
  transform: scale(1.15);
}

.dark .slider-thumb::-webkit-slider-thumb {
  background: #1f2937;
  border-color: #60a5fa;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.4), 0 0 0 4px rgba(96, 165, 250, 0.15);
}

.dark .slider-thumb::-webkit-slider-thumb:hover {
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.5), 0 0 0 4px rgba(96, 165, 250, 0.2);
}

.dark .slider-thumb::-moz-range-thumb {
  background: #1f2937;
  border-color: #60a5fa;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.4), 0 0 0 4px rgba(96, 165, 250, 0.15);
}

.dark .slider-thumb::-moz-range-thumb:hover {
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.5), 0 0 0 4px rgba(96, 165, 250, 0.2);
}
</style>




