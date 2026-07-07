<template>
  <div class="vehicle-for-sale-page bg-slate-50 text-slate-900">
    <!-- Loading -->
    <div v-if="pending" class="flex min-h-[60vh] items-center justify-center">
      <div uk-spinner="ratio: 2"></div>
    </div>

    <!-- Vehicle Content -->
    <div v-else-if="vehicle">
      <!-- Sticky Top Bar (Desktop only) - Only show when we have a real price -->
      <ClientOnly>
        <VehicleStickyBar
          v-if="showStickyBar"
          :title="headline"
          :price="priceDisplay"
          :per-week="perWeekDisplay"
          :image="heroImage"
          :scroll-threshold="400"
          @enquire="openEnquire"
        />
      </ClientOnly>
      <!-- Listing Header -->
      <section class="bg-white">
        <div class="mx-auto max-w-7xl px-4 py-6 lg:px-6">
          <div class="flex flex-col gap-6">
            <nav class="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500" aria-label="Breadcrumb">
              <NuxtLink to="/" class="text-slate-500 transition hover:text-primary">Home</NuxtLink>
              <span class="text-slate-300">›</span>
              <NuxtLink to="/car-sales" class="text-slate-500 transition hover:text-primary">Cars for Sale</NuxtLink>
              <template v-for="(crumb, index) in breadcrumbItems" :key="`${crumb.label}-${index}`">
                <span class="text-slate-300">›</span>
                <NuxtLink :to="crumb.url" class="text-slate-500 transition hover:text-primary">{{ crumb.label }}</NuxtLink>
              </template>
            </nav>

            <div class="flex flex-wrap items-start gap-6">
              <div class="flex-1 min-w-0 space-y-4">
                <div class="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <span v-if="conditionLabel">{{ conditionLabel }}</span>
                  <span v-if="isStockSpecial" class="rounded-full bg-orange-500 px-3 py-1 text-[11px] font-semibold uppercase text-white">
                    Stock Special
                  </span>
                  <span v-if="suburbDisplay" class="text-slate-400">• {{ suburbDisplay }}</span>
                  <span v-if="stockId" class="text-slate-400">Stock #{{ stockId }}</span>
                </div>

                <div class="space-y-3">
                  <h1 class="text-3xl font-bold text-slate-900 md:text-4xl m-0">{{ headline }}</h1>
                  <p v-if="heroSummary" class="text-lg text-slate-600 md:text-xl m-0">
                    {{ heroSummary }}
                  </p>
                </div>

                <div v-if="headerChips.length" class="flex flex-wrap gap-2">
                  <span
                    v-for="chip in headerChips"
                    :key="chip"
                    class="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-800"
                  >
                    {{ chip }}
                  </span>
                </div>
              </div>

              <div class="flex w-full flex-col gap-3 sm:w-auto sm:items-end">
                <div class="flex w-full flex-wrap justify-start gap-2 sm:justify-end">
                  <button
                    class="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                    :class="isVehicleSaved ? 'text-red-500 border-red-200' : 'text-slate-700'"
                    @click="toggleSaveVehicle"
                  >
                    <svg
                      class="h-4 w-4"
                      :fill="isVehicleSaved ? 'currentColor' : 'none'"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      stroke-width="1.5"
                    >
                      <path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    {{ isVehicleSaved ? 'Saved' : 'Save' }}
                  </button>
                  <button
                    class="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                    @click="shareVehicle"
                  >
                    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    Share
                  </button>
                </div>

                <div class="space-y-1 text-left sm:text-right">
                  <div class="text-3xl font-extrabold text-slate-900 md:text-4xl">{{ priceDisplay }}</div>
                  <div class="text-[11px] uppercase tracking-wide text-slate-500">Drive Away</div>
                  <div v-if="perWeekDisplay" class="text-sm text-slate-500">Est. {{ perWeekDisplay }}/week</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Full-Width Gallery Header -->
      <VehicleGallery
        v-if="allImages.length > 0"
        :images="allImages"
        :title="headline"
        :badge="galleryBadge"
        @open-lightbox="openLightbox"
      />
      
      <!-- Lightbox -->
      <ClientOnly>
        <VehicleLightbox
          :is-open="lightboxOpen"
          :images="allImages"
          :title="headline"
          :initial-index="lightboxInitialIndex"
          @close="closeLightbox"
        />
      </ClientOnly>
      
      <!-- Enquiry Modal (for main vehicle) -->
      <ClientOnly>
        <VehicleEnquiryModal
          :is-open="enquiryModalOpen"
          :vehicle="vehicle"
          @close="closeEnquire"
        />
      </ClientOnly>

      <!-- Enquiry Modal (for related vehicle cards) -->
      <ClientOnly>
        <VehicleEnquiryModal
          :is-open="vehiclesStore.vehicleEnquiryPopUp.show"
          :vehicle="vehiclesStore.vehicleEnquiryPopUp.item"
          @close="closeRelatedEnquire"
        />
      </ClientOnly>

      <!-- Test Drive Modal -->
      <ClientOnly>
        <VehicleTestDriveModal
          :is-open="testDriveModalOpen"
          :vehicle="vehicle"
          @close="closeTestDrive"
        />
      </ClientOnly>

      <!-- Main Content -->
      <section class="mx-auto w-full max-w-7xl px-4 py-6 lg:px-6 lg:py-8">
        <div class="grid gap-6 lg:grid-cols-[1fr_380px]">
          <!-- Details Column -->
          <div class="space-y-4 min-w-0 order-2 lg:order-1">

            <!-- Highlights -->
            <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <!-- Odometer -->
              <div class="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                  <svg class="h-5 w-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <div class="text-xs text-slate-500">Odometer</div>
                  <div class="text-sm font-semibold text-slate-900">{{ kmsDisplay || '—' }}</div>
                </div>
              </div>
              
              <!-- Body Type -->
              <div class="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                  <svg class="h-5 w-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7h8m-8 4h4m4 0h.01M3 21h18a1 1 0 001-1V9a1 1 0 00-1-1h-3.28a1 1 0 01-.948-.684l-1.11-3.33A1 1 0 0014.72 3H9.28a1 1 0 00-.948.684l-1.11 3.33A1 1 0 016.28 8H3a1 1 0 00-1 1v11a1 1 0 001 1z" />
                  </svg>
                </div>
                <div>
                  <div class="text-xs text-slate-500">Body type</div>
                  <div class="text-sm font-semibold text-slate-900">{{ bodyDisplay || '—' }}</div>
                </div>
              </div>
              
              <!-- Fuel -->
              <div class="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                  <svg class="h-5 w-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
                  </svg>
                </div>
                <div>
                  <div class="text-xs text-slate-500">Fuel</div>
                  <div class="text-sm font-semibold text-slate-900">{{ fuelDisplay || '—' }}</div>
                </div>
              </div>
              
              <!-- Transmission -->
              <div class="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                  <svg class="h-5 w-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <div class="text-xs text-slate-500">Transmission</div>
                  <div class="text-sm font-semibold text-slate-900">{{ transmissionDisplay || '—' }}</div>
                </div>
              </div>
            </div>

            <!-- Specifications with Tabs -->
            <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <Tabs :default-value="hasDetailedSpecs ? 'detailed' : 'basic'">
                <TabsList class="mb-4 gap-1 bg-transparent">
                  <TabsTrigger
                    value="basic"
                    class="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full data-[state=active]:shadow-none"
                  >
                    <Icon name="lucide:list" class="-ms-0.5 me-1.5 size-4 opacity-60" aria-hidden="true" />
                    Vehicle Info
                  </TabsTrigger>
                  <TabsTrigger
                    value="detailed"
                    :disabled="!hasDetailedSpecs && !enrichmentLoading"
                    class="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full data-[state=active]:shadow-none"
                  >
                    <Icon name="lucide:settings-2" class="-ms-0.5 me-1.5 size-4 opacity-60" aria-hidden="true" />
                    Full Specifications
                    <span v-if="enrichmentLoading && !hasDetailedSpecs" class="ml-1.5">
                      <Icon name="lucide:loader-2" class="size-3 animate-spin" />
                    </span>
                  </TabsTrigger>
                </TabsList>

                <!-- Basic Specs Tab -->
                <TabsContent value="basic" class="mt-0">
                  <div class="grid grid-cols-2 gap-3">
                    <div v-for="spec in specList" :key="spec.label" class="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                      <div class="text-xs uppercase tracking-wide text-slate-500">{{ spec.label }}</div>
                      <div class="text-sm font-semibold text-slate-900">{{ spec.value }}</div>
                    </div>
                  </div>
                </TabsContent>

                <!-- Detailed Specs Tab -->
                <TabsContent value="detailed" class="mt-0">
                  <ClientOnly>
                    <VehicleEnrichedSpecsContent
                      v-if="enrichment?.specifications && hasDetailedSpecs"
                      :specs="enrichment.specifications"
                      :series="enrichment.series"
                      :generation="enrichment.generation"
                      :confidence="enrichment.confidence"
                    />
                    <div v-else-if="enrichmentLoading" class="animate-pulse">
                      <div class="grid grid-cols-2 gap-3">
                        <div v-for="i in 8" :key="i" class="h-14 bg-slate-100 rounded-lg"></div>
                      </div>
                    </div>
                    <div v-else class="text-center py-8 text-slate-500">
                      <Icon name="lucide:info" class="size-8 mx-auto mb-2 opacity-50" />
                      <p class="text-sm">Detailed specifications not available for this vehicle.</p>
                    </div>
                  </ClientOnly>
                </TabsContent>
              </Tabs>
            </div>

            <!-- ANCAP Safety Rating -->
            <ClientOnly>
              <VehicleANCAPRating
                v-if="enrichment?.australianData?.ancapRating"
                :rating="enrichment.australianData.ancapRating"
                :year="enrichment.australianData.ancapYear"
                :details="enrichment.australianData.ancapDetails"
              />
            </ClientOnly>

            <!-- Features & Equipment -->
            <ClientOnly>
              <VehicleFeaturesList
                v-if="enrichment?.features && hasEnrichedFeatures"
                :features="enrichment.features"
                :specs="enrichment?.specifications"
              />
            </ClientOnly>

            <!-- Description -->
            <div v-if="vehicleDescription" class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 class="text-lg font-semibold text-slate-900">Description</h2>
              <div class="prose prose-sm prose-slate mt-2 whitespace-pre-line text-slate-700">
                {{ vehicleDescription }}
              </div>
            </div>
            
            <!-- Dealer Information -->
            <div v-if="vehicle.address" class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 class="text-lg font-semibold text-slate-900">Dealer Location</h2>
              <div class="mt-3 space-y-2 text-sm text-slate-700">
                <div class="font-semibold text-slate-900">{{ vehicle.sellername || 'Sale Motor Group' }}</div>
                <div v-if="vehicle.address.line1">{{ vehicle.address.line1 }}</div>
                <div>
                  {{ vehicle.address.suburb }}, {{ vehicle.address.state }} {{ vehicle.address.postcode }}
                </div>
              </div>
            </div>

            <!-- YouTube Videos -->
            <ClientOnly>
              <VehicleYouTubeSwiper :model-name="youtubeModelName" />
            </ClientOnly>
          </div>

          <!-- Sidebar (hidden on mobile - uses mobile CTA bar instead) -->
          <aside class="hidden lg:block order-1 lg:order-2">
            <div class="sticky top-28 space-y-4">
              <!-- Enquiry Card -->
              <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div class="flex items-start justify-between">
                  <div class="space-y-1">
                    <div class="text-2xl font-semibold text-slate-900">{{ priceDisplay }}</div>
                    <div class="text-[11px] uppercase tracking-wide text-slate-500">Drive Away</div>
                  </div>
                  <div v-if="perWeekDisplay" class="text-right space-y-1">
                    <div class="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
                      {{ perWeekDisplay }}/week
                    </div>
                    <div class="text-[11px] uppercase tracking-wide text-slate-500">Estimate</div>
                  </div>
                </div>

                <div class="mt-4 grid grid-cols-2 gap-2 text-sm text-slate-700">
                  <div class="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                    <div class="text-[11px] uppercase tracking-wide text-slate-500">Odometer</div>
                    <div class="font-semibold">{{ kmsDisplay || '—' }}</div>
                  </div>
                  <div class="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                    <div class="text-[11px] uppercase tracking-wide text-slate-500">Transmission</div>
                    <div class="font-semibold">{{ transmissionDisplay || '—' }}</div>
                  </div>
                  <div class="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                    <div class="text-[11px] uppercase tracking-wide text-slate-500">Fuel</div>
                    <div class="font-semibold">{{ fuelDisplay || '—' }}</div>
                  </div>
                  <div class="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                    <div class="text-[11px] uppercase tracking-wide text-slate-500">Body</div>
                    <div class="font-semibold">{{ bodyDisplay || '—' }}</div>
                  </div>
                </div>

                <div class="mt-4 flex flex-col gap-2">
                  <button
                    class="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
                    @click="openEnquire"
                  >
                    Enquire Now
                  </button>
                  <button
                    class="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm hover:border-primary hover:text-primary"
                    @click="openTestDrive"
                  >
                    Book Test Drive
                  </button>
                  <NuxtLink
                    :to="financeUrl"
                    class="w-full rounded-xl border border-emerald-500 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 shadow-sm hover:bg-emerald-100 text-center"
                  >
                    Get Finance
                  </NuxtLink>
                </div>

                <div class="mt-4 space-y-1 text-sm text-slate-700">
                  <div class="flex items-center justify-between">
                    <span>Location</span>
                    <span class="font-semibold">{{ suburbDisplay || '—' }}</span>
                  </div>
                  <div class="flex items-center justify-between">
                    <span>Stock</span>
                    <span class="font-semibold">#{{ stockId || '—' }}</span>
                  </div>
                </div>

                <div class="mt-4 pt-4 border-t border-slate-100">
                  <p class="text-xs text-slate-500 text-center mb-2">Have questions?</p>
                  <a 
                    :href="`tel:${phone}`" 
                    class="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-primary bg-white px-4 py-2.5 text-sm font-semibold text-primary shadow-sm hover:bg-primary hover:text-white transition-colors"
                  >
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                    </svg>
                    Call Us Now
                  </a>
                </div>
              </div>

              <!-- Recently Viewed Vehicles -->
              <ClientOnly>
                <RecentlyViewedCard 
                  :current-vehicle-id="vehicleId" 
                  :all-vehicles="allVehiclesResponse?.vehiclesData || []"
                />
              </ClientOnly>
            </div>
          </aside>
        </div>
      </section>

      <!-- Related Vehicles Section -->
      <section v-if="relatedVehicles.length > 0" class="bg-white py-12 overflow-hidden">
        <div class="mx-auto max-w-7xl px-4 lg:px-6">
          <div class="mb-8">
            <h2 class="text-2xl font-bold text-slate-900 md:text-3xl">Similar Vehicles</h2>
            <p class="mt-2 text-slate-600">You might also be interested in these vehicles</p>
          </div>

          <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <ModernVehicleCard
              v-for="relatedVehicle in relatedVehicles"
              :key="relatedVehicle.stockid || relatedVehicle.identifier"
              :vehicle="relatedVehicle"
              class="h-full"
            />
          </div>

          <div class="mt-8 text-center">
            <NuxtLink
              to="/car-sales"
              class="inline-flex items-center gap-2 rounded-full bg-slate-100 px-6 py-3 font-semibold text-slate-700 transition-colors hover:bg-slate-200"
            >
              View All Vehicles
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </NuxtLink>
          </div>
        </div>
      </section>
    </div>

    <!-- Not Found -->
    <div v-else class="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
      <h2 class="text-2xl font-semibold">Vehicle Not Found</h2>
      <NuxtLink to="/car-sales" class="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
        Browse All Vehicles
      </NuxtLink>
    </div>

    <!-- Mobile Sticky CTA Bar -->
    <div v-if="vehicle" class="mobile-cta-bar">
      <a :href="`tel:${phone}`" class="mobile-cta-btn mobile-cta-btn--call">
        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
        </svg>
        Call Now
      </a>
      <button type="button" class="mobile-cta-btn mobile-cta-btn--enquire" @click="openEnquire">
        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
        </svg>
        Enquire
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getRuntimeTenantCacheKey } from '~/utils/tenantCacheKey';

const route = useRoute();
const mainStore = useMainStore();
const vehiclesStore = useVehiclesStore();
const { siteName, siteUrl } = useSiteIdentity();
const { toast } = useToast();
const carsalesFeedCacheKey = getRuntimeTenantCacheKey('carsales-feed-data');

// Saved vehicles (comparison/favorites) using localStorage
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

const comparisonSet = computed(() => new Set(normalizeComparisonIds(comparisonIds.value)));

const vehicleId = computed(() => route.params.id as string);
const slugParam = computed(() => route.params.slug as string);
const vehicleDetailUrl = computed(() => `/api/vehicle-detail/${vehicleId.value}`);

// Fetch vehicle data from the carsales feed
const { data: apiResponse, status } = await useFetch<any>(vehicleDetailUrl, {
  watch: [vehicleId],
});

// Fetch all vehicles for related vehicles section (uses shared SSR cache)
const { data: allVehiclesResponse } = await useFetch<{ vehiclesData: any[] }>('/api/carsales-feed', {
  key: carsalesFeedCacheKey,
  dedupe: 'defer',
  // Return cached data on client - prevents network request
  getCachedData: (key, nuxtApp) => {
    return nuxtApp.payload.data[key] || nuxtApp.static.data[key];
  },
});

const responseVehicleMatchesRoute = computed(() => {
  const responseVehicle = apiResponse.value?.vehicle;
  if (!responseVehicle || !vehicleId.value) return false;

  const possibleIds = [
    responseVehicle.identifier,
    responseVehicle.stockid,
    responseVehicle.stockNumber,
    responseVehicle.id,
  ];

  return possibleIds.some((id) => id && String(id) === String(vehicleId.value));
});

const hasStaleVehicleResponse = computed(() => {
  return !!apiResponse.value?.vehicle && !responseVehicleMatchesRoute.value;
});

// Derive pending state from status, including the brief client-navigation window
// where the previous vehicle response no longer matches the current route.
const pending = computed(() => status.value === 'pending' || hasStaleVehicleResponse.value);

// Extract vehicle from response. Guard against stale data when Nuxt reuses this
// page instance for client-side navigation between vehicle detail URLs.
const vehicle = computed(() => {
  if (!responseVehicleMatchesRoute.value) return null;
  return apiResponse.value?.vehicle || null;
});

// Build enrichment ID from vehicle data
const enrichmentId = computed(() => {
  if (!vehicle.value) return '';
  return buildEnrichmentId(vehicle.value);
});

// Fetch vehicle enrichment data (AI-generated specs, ANCAP, features)
const {
  enrichment,
  loading: enrichmentLoading,
  hasDetailedSpecs,
  hasANCAP,
} = useVehicleEnrichment(enrichmentId, {
  optimized: true,
  immediate: false, // Will fetch when enrichmentId changes
});

// Check if enrichment has useful features
const hasEnrichedFeatures = computed(() => {
  const features = enrichment.value?.features;
  if (!features) return false;
  return (
    (features.safety?.items?.length || 0) > 0 ||
    (features.comfort?.items?.length || 0) > 0 ||
    (features.technology?.items?.length || 0) > 0 ||
    (features.performance?.items?.length || 0) > 0
  );
});

// Vehicle description - prefer AI-generated if available, fallback to feed
const vehicleDescription = computed(() => {
  return enrichment.value?.description || vehicle.value?.Comments || vehicle.value?.description || '';
});

// Helper function for extracting display values - defined early for use in computed properties
const getDisplay = (field: any) => {
  if (!field) return '';
  if (typeof field === 'string' || typeof field === 'number') return String(field);
  if (Array.isArray(field?.displayValue)) return field.displayValue[0] || '';
  if (Array.isArray(field?.value)) return field.value[0] || '';
  return '';
};

const formatPrice = (price: any) => {
  if (!price || price === 0 || price === '0') return 'POA';
  const num = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(num)) return 'POA';
  return `$${num.toLocaleString()}`;
};

const formatKms = (v: any) => {
  const kms = v?.kms || v?.odometer?.value?.[0] || v?.odometer?.displayValue?.[0] || v?.odometer;
  if (!kms || kms === 0) return '';
  const num = typeof kms === 'number' ? kms : parseFloat(String(kms));
  return isNaN(num) ? '' : `${num.toLocaleString()} km`;
};

const vehicleTitle = (v: any) => {
  if (!v) return 'Vehicle';
  const year = getDisplay(v.year);
  const make = getDisplay(v.make);
  const model = getDisplay(v.model);
  let badge = getDisplay(v.variant) || getDisplay(v.badge);
  // Filter out "No Badge" as it's not meaningful to display
  if (badge.toLowerCase().includes('no badge')) badge = '';
  return [year, make, model, badge].filter(Boolean).join(' ').trim() || v.title || 'Vehicle';
};

const pushSpec = (arr: { label: string; value: string }[], label: string, value?: string) => {
  if (value) arr.push({ label, value });
};

// Related vehicles - find similar vehicles based on make, body type, or price range
const relatedVehicles = computed(() => {
  if (!vehicle.value || !allVehiclesResponse.value?.vehiclesData) return [];

  const currentId = vehicleId.value;
  const currentMake = getDisplay(vehicle.value?.make)?.toLowerCase();
  const currentBody = getDisplay(vehicle.value?.body)?.toLowerCase();
  const currentPrice = vehicle.value?.price || 0;

  // Filter out current vehicle and find related ones
  const candidates = allVehiclesResponse.value.vehiclesData.filter((v: any) => {
    // Exclude current vehicle
    const vId = String(v.stockid || v.identifier || v.id);
    if (vId === currentId) return false;
    return true;
  });

  // Score each vehicle based on similarity
  const scored = candidates.map((v: any) => {
    let score = 0;

    // Same make = highest priority
    const vMake = getDisplay(v?.make)?.toLowerCase();
    if (vMake && vMake === currentMake) score += 10;

    // Same body type = second priority
    const vBody = getDisplay(v?.body)?.toLowerCase();
    if (vBody && vBody === currentBody) score += 5;

    // Similar price range (within 30%) = third priority
    const vPrice = v?.price || 0;
    if (currentPrice > 0 && vPrice > 0) {
      const priceDiff = Math.abs(vPrice - currentPrice) / currentPrice;
      if (priceDiff <= 0.3) score += 3;
      else if (priceDiff <= 0.5) score += 1;
    }

    return { vehicle: v, score };
  });

  // Sort by score descending, take top 4
  return scored
    .filter(item => item.score > 0) // Only include vehicles with some similarity
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map(item => item.vehicle);
});

const phone = computed(() => mainStore.site?.phone?.replace(/\s/g, '') || '');

const financeUrl = computed(() => `/finance/${vehicleId.value}/${slugParam.value}`);

const headline = computed(() => vehicleTitle(vehicle.value));
const stockId = computed(() => vehicle.value?.stockid || vehicle.value?.stockNumber || vehicle.value?.identifier);
const conditionLabel = computed(() => {
  const cond = getDisplay(vehicle.value?.condition);
  return cond ? cond.charAt(0).toUpperCase() + cond.slice(1) : '';
});
const isStockSpecial = computed(() => vehicle.value?.stock_special?.value?.includes('stock-special'));

const priceDisplay = computed(() => {
  const price = vehicle.value?.price || vehicle.value?.egc_price;
  return formatPrice(price);
});

const perWeekDisplay = computed(() => {
  const pw = vehicle.value?.perweek;
  if (!pw || pw === 0 || pw === '0') return '';
  const num = typeof pw === 'string' ? parseFloat(pw) : pw;
  return isNaN(num) ? '' : `$${num.toLocaleString()}`;
});

// Only show sticky bar when we have a real price (not POA)
const showStickyBar = computed(() => {
  return priceDisplay.value && priceDisplay.value !== 'POA';
});

// Gallery management
const allImages = computed(() => {
  if (!vehicle.value) return [];
  
  // Try different image sources - photos is the primary field from carsales feed
  const photos = vehicle.value.photos || vehicle.value.images || [];
  if (photos.length > 0) {
    return photos;
  }
  
  // Fallback to thumb or main_photo_url if no photos array
  const fallback = vehicle.value.thumb || vehicle.value.main_photo_url;
  return fallback ? [fallback] : [];
});

// Lightbox state
const lightboxOpen = ref(false);
const lightboxInitialIndex = ref(0);

const openLightbox = (index: number = 0) => {
  lightboxInitialIndex.value = index;
  lightboxOpen.value = true;
};

const closeLightbox = () => {
  lightboxOpen.value = false;
};

// Legacy computed for backward compatibility
const heroImage = computed(() => allImages.value[0] || '');
const galleryImages = computed(() => allImages.value.slice(1));

const kmsDisplay = computed(() => formatKms(vehicle.value));
const bodyDisplay = computed(() => getDisplay(vehicle.value?.body));
const fuelDisplay = computed(() => getDisplay(vehicle.value?.fuel));
const transmissionDisplay = computed(() => getDisplay(vehicle.value?.transmission));
const drivetrainDisplay = computed(() => getDisplay(vehicle.value?.drivetrain));
const seatsDisplay = computed(() => getDisplay(vehicle.value?.seats));
const doorsDisplay = computed(() => getDisplay(vehicle.value?.doors));
const suburbDisplay = computed(() => getDisplay(vehicle.value?.suburb));

// YouTube model name - combine model with variant/badge for better video matching
const youtubeModelName = computed(() => {
  const model = getDisplay(vehicle.value?.model);
  const variant = getDisplay(vehicle.value?.variant) || getDisplay(vehicle.value?.badge);
  // Filter out "No Badge" and combine
  const parts = [model];
  if (variant && !variant.toLowerCase().includes('no badge')) {
    parts.push(variant);
  }
  return parts.filter(Boolean).join(' ') || '';
});

const highlightChips = computed(() => {
  return [kmsDisplay.value, transmissionDisplay.value, fuelDisplay.value, bodyDisplay.value, seatsDisplay.value && `${seatsDisplay.value} Seats`, doorsDisplay.value && `${doorsDisplay.value} Doors`]
    .filter(Boolean) as string[];
});

const headerChips = computed(() => highlightChips.value.slice(0, 4));

const specList = computed(() => {
  const specs: { label: string; value: string }[] = [];
  pushSpec(specs, 'Year', getDisplay(vehicle.value?.year) || '');
  pushSpec(specs, 'Make', getDisplay(vehicle.value?.make) || '');
  pushSpec(specs, 'Model', getDisplay(vehicle.value?.model) || '');
  pushSpec(specs, 'Series', getDisplay(vehicle.value?.series) || '');
  const badgeValue = getDisplay(vehicle.value?.badge) || '';
  // Only show badge in specs if it's not "No Badge"
  if (!badgeValue.toLowerCase().includes('no badge')) {
    pushSpec(specs, 'Badge', badgeValue);
  }
  pushSpec(specs, 'Body', bodyDisplay.value);
  pushSpec(specs, 'Fuel', fuelDisplay.value);
  pushSpec(specs, 'Transmission', transmissionDisplay.value);
  pushSpec(specs, 'Drivetrain', drivetrainDisplay.value);
  pushSpec(specs, 'Engine', getDisplay(vehicle.value?.engine) || '');
  pushSpec(specs, 'Engine Size', vehicle.value?.attributes?.find((a: any) => a.Name === 'EngineSize')?.Value || '');
  pushSpec(specs, 'Cylinders', vehicle.value?.attributes?.find((a: any) => a.Name === 'Cylinders')?.Value || '');
  pushSpec(specs, 'Seats', seatsDisplay.value);
  pushSpec(specs, 'Doors', doorsDisplay.value);
  pushSpec(specs, 'Exterior Colour', vehicle.value?.genericolour || getDisplay(vehicle.value?.colour) || '');
  pushSpec(specs, 'Interior Colour', vehicle.value?.interiorcolour || '');
  pushSpec(specs, 'Odometer', kmsDisplay.value);
  pushSpec(specs, 'VIN', vehicle.value?.vin || '');
  pushSpec(specs, 'Registration', vehicle.value?.rego || '');
  return specs.filter((s) => s.value);
});

const engineDisplay = computed(() => getDisplay(vehicle.value?.engine));
const interiorDisplay = computed(() => vehicle.value?.interiorcolour || '');

const heroSummary = computed(() => {
  const parts: string[] = [];
  if (kmsDisplay.value) parts.push(`~${kmsDisplay.value}`);
  if (engineDisplay.value) parts.push(engineDisplay.value);
  if (drivetrainDisplay.value) parts.push(drivetrainDisplay.value);
  if (interiorDisplay.value) parts.push(`${interiorDisplay.value} Interior`);
  return parts.join(', ');
});

// Structured breadcrumbs with filter URLs for SEO
interface BreadcrumbItem {
  label: string;
  url: string;
}

const toFilterSlug = (value: string) => {
  return value
    .trim()
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const breadcrumbItems = computed<BreadcrumbItem[]>(() => {
  const items: BreadcrumbItem[] = [];
  const make = getDisplay(vehicle.value?.make);
  const model = getDisplay(vehicle.value?.model);
  const year = getDisplay(vehicle.value?.year);
  const makeSlug = make ? toFilterSlug(make) : '';
  const modelSlug = model ? toFilterSlug(model) : '';
  
  // Make filter (e.g., "Ford") - clean SEO URL
  if (make && makeSlug) {
    items.push({
      label: make,
      url: `/car-sales/${makeSlug}/`,
    });
  }
  
  // Model filter (e.g., "Ranger") - builds on make
  if (model && makeSlug && modelSlug) {
    items.push({
      label: model,
      url: `/car-sales/${makeSlug}/${modelSlug}/`,
    });
  }
  
  // Year filter (e.g., "2025") - most specific, builds on make+model
  if (year && makeSlug) {
    const yearUrl = modelSlug
      ? `/car-sales/${makeSlug}/${modelSlug}/${year}/`
      : `/car-sales/${makeSlug}/${year}/`;
    items.push({
      label: year,
      url: yearUrl,
    });
  }
  
  return items;
});

// Legacy computed for backward compatibility (if needed elsewhere)
const headerTrail = computed(() => {
  return breadcrumbItems.value.map(item => item.label);
});

const galleryBadge = computed(() => {
  if (isStockSpecial.value) return 'Featured';
  return conditionLabel.value || '';
});

const subHeadline = computed(() => {
  const parts = [conditionLabel.value, getDisplay(vehicle.value?.make), getDisplay(vehicle.value?.model)];
  if (getDisplay(vehicle.value?.variant)) parts.push(getDisplay(vehicle.value?.variant));
  if (suburbDisplay.value) parts.push(`in ${suburbDisplay.value}`);
  return parts.filter(Boolean).join(' • ');
});

// Enhanced SEO with Nuxt SEO
const seoTitle = computed(() => {
  const parts = [headline.value];
  if (priceDisplay.value && priceDisplay.value !== 'POA') {
    parts.push(priceDisplay.value);
  }
  if (conditionLabel.value) {
    parts.push(conditionLabel.value);
  }
  parts.push(`| ${siteName.value}`);
  return parts.join(' ');
});

const seoDescription = computed(() => {
  const parts = [];
  if (conditionLabel.value) parts.push(conditionLabel.value);
  parts.push(headline.value);
  if (priceDisplay.value && priceDisplay.value !== 'POA') {
    parts.push(`for ${priceDisplay.value}`);
  }
  if (kmsDisplay.value) parts.push(`with ${kmsDisplay.value}`);
  if (transmissionDisplay.value) parts.push(transmissionDisplay.value);
  if (fuelDisplay.value) parts.push(fuelDisplay.value);
  parts.push(`at ${siteName.value}. View photos, specs & book a test drive today.`);
  return parts.filter(Boolean).join(' ');
});

// Use Nuxt SEO's useSeoMeta for better SEO
const canonicalUrl = computed(() => `${siteUrl.value}${route.fullPath}`);

useSeoMeta({
  title: seoTitle,
  description: seoDescription,
  ogTitle: seoTitle,
  ogDescription: seoDescription,
  ogImage: () => allImages.value[0] || '',
  ogUrl: canonicalUrl,
  ogSiteName: siteName,
  ogLocale: 'en_AU',
  twitterCard: 'summary_large_image',
  twitterTitle: seoTitle,
  twitterDescription: seoDescription,
  twitterImage: () => allImages.value[0] || '',
  robots: {
    index: true,
    follow: true,
  },
});

// Add product-specific OG tags via useHead
useHead({
  meta: [
    {
      property: 'og:type',
      content: 'product',
    },
    {
      name: 'product:price:amount',
      content: () => vehicle.value?.price?.toString() || '',
    },
    {
      name: 'product:price:currency',
      content: 'AUD',
    },
    {
      name: 'product:availability',
      content: 'in stock',
    },
    {
      name: 'product:condition',
      content: () => conditionLabel.value.toLowerCase() || 'new',
    },
  ],
});

// Add canonical URL
useHead({
  link: [
    {
      rel: 'canonical',
      href: canonicalUrl,
    },
  ],
});

// Enhanced Schema.org structured data using Nuxt SEO
useSchemaOrg([
  // Vehicle Schema (using Product with Vehicle properties)
  defineProduct({
    name: headline,
    description: seoDescription,
    image: () => allImages.value,
    brand: () => ({
      '@type': 'Brand',
      name: getDisplay(vehicle.value?.make) || 'Hyundai',
    }),
    sku: () => stockId.value || vehicle.value?.identifier || '',
    offers: () => ({
      '@type': 'Offer',
      priceCurrency: 'AUD',
      price: vehicle.value?.price || undefined,
      availability: 'https://schema.org/InStock',
      seller: {
        '@type': 'AutoDealer',
        name: siteName.value,
        address: {
          '@type': 'PostalAddress',
          streetAddress: vehicle.value?.address?.line1 || mainStore.site?.showroom_address?.split(',')[0] || '',
          addressLocality: vehicle.value?.address?.suburb || mainStore.site?.suburb || '',
          addressRegion: vehicle.value?.address?.state || 'Victoria',
          postalCode: vehicle.value?.address?.postcode || '3850',
          addressCountry: 'AU',
        },
      },
    }),
    // Add Vehicle-specific properties
    additionalProperty: () => {
      const props: any[] = [];
      if (getDisplay(vehicle.value?.model)) props.push({ '@type': 'PropertyValue', name: 'Model', value: getDisplay(vehicle.value.model) });
      if (getDisplay(vehicle.value?.year)) props.push({ '@type': 'PropertyValue', name: 'Year', value: getDisplay(vehicle.value.year) });
      if (vehicle.value?.vin) props.push({ '@type': 'PropertyValue', name: 'VIN', value: vehicle.value.vin });
      if (vehicle.value?.kms) props.push({ '@type': 'PropertyValue', name: 'Mileage', value: `${vehicle.value.kms} km` });
      if (fuelDisplay.value) props.push({ '@type': 'PropertyValue', name: 'Fuel Type', value: fuelDisplay.value });
      if (transmissionDisplay.value) props.push({ '@type': 'PropertyValue', name: 'Transmission', value: transmissionDisplay.value });
      if (drivetrainDisplay.value) props.push({ '@type': 'PropertyValue', name: 'Drivetrain', value: drivetrainDisplay.value });
      if (bodyDisplay.value) props.push({ '@type': 'PropertyValue', name: 'Body Type', value: bodyDisplay.value });
      if (doorsDisplay.value) props.push({ '@type': 'PropertyValue', name: 'Doors', value: doorsDisplay.value });
      if (seatsDisplay.value) props.push({ '@type': 'PropertyValue', name: 'Seats', value: seatsDisplay.value });
      if (vehicle.value?.genericolour || getDisplay(vehicle.value?.colour)) {
        props.push({ '@type': 'PropertyValue', name: 'Colour', value: vehicle.value?.genericolour || getDisplay(vehicle.value?.colour) });
      }
      return props.length > 0 ? props : undefined;
    },
  }),
  
  // Breadcrumb Schema - includes filter breadcrumbs for better SEO
  defineBreadcrumb({
    itemListElement: () => {
      const items = [
        { name: 'Home', item: siteUrl.value },
        { name: 'Cars for Sale', item: `${siteUrl.value}/car-sales` },
      ];
      
      // Add filter breadcrumbs
      breadcrumbItems.value.forEach(crumb => {
        items.push({ name: crumb.label, item: `${siteUrl.value}${crumb.url}` });
      });
      
      // Add current vehicle page
      items.push({ name: headline.value, item: `${siteUrl.value}${route.fullPath}` });
      
      return items;
    },
  }),
]);

// Add custom Vehicle schema for better Google Vehicle rich results
useHead(() => {
  if (!vehicle.value) return {};
  
  const vehicleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Vehicle',
    name: headline.value,
    description: seoDescription.value,
    image: allImages.value,
    brand: {
      '@type': 'Brand',
      name: getDisplay(vehicle.value?.make) || 'Hyundai',
    },
    model: getDisplay(vehicle.value?.model) || '',
    vehicleModelDate: getDisplay(vehicle.value?.year) || '',
    vehicleIdentificationNumber: vehicle.value?.vin || undefined,
    mileageFromOdometer: vehicle.value?.kms ? {
      '@type': 'QuantitativeValue',
      value: vehicle.value.kms,
      unitCode: 'KMT',
    } : undefined,
    fuelType: fuelDisplay.value || undefined,
    vehicleTransmission: transmissionDisplay.value || undefined,
    driveWheelConfiguration: drivetrainDisplay.value || undefined,
    bodyType: bodyDisplay.value || undefined,
    numberOfDoors: doorsDisplay.value || undefined,
    vehicleSeatingCapacity: seatsDisplay.value || undefined,
    color: vehicle.value?.genericolour || getDisplay(vehicle.value?.colour) || undefined,
    vehicleConfiguration: getDisplay(vehicle.value?.series) || undefined,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'AUD',
      price: vehicle.value?.price || undefined,
      availability: 'https://schema.org/InStock',
      seller: {
        '@type': 'AutoDealer',
        name: siteName.value,
        address: {
          '@type': 'PostalAddress',
          streetAddress: vehicle.value?.address?.line1 || mainStore.site?.showroom_address?.split(',')[0] || '',
          addressLocality: vehicle.value?.address?.suburb || mainStore.site?.suburb || '',
          addressRegion: vehicle.value?.address?.state || 'Victoria',
          postalCode: vehicle.value?.address?.postcode || '3850',
          addressCountry: 'AU',
        },
      },
    },
  };
  
  return {
    script: [
      {
        type: 'application/ld+json',
        innerHTML: JSON.stringify(vehicleSchema),
      },
    ],
    __dangerouslyDisableSanitizers: ['script'],
  };
});

// Analytics tracking
const { trackEnquiryModalOpen, trackVehicleView } = useAnalytics();

// Track vehicle views and recently viewed entries when route-reactive data changes.
if (import.meta.client) {
  watch(
    vehicle,
    (currentVehicle) => {
      if (!currentVehicle) return;

      trackVehicleView(currentVehicle);

      const id = currentVehicle.stockid || currentVehicle.id || currentVehicle.identifier;
      if (id) {
        vehiclesStore.addToRecentlyViewed(id);
      }
    },
    { immediate: true }
  );
}

// Enquiry modal state
const enquiryModalOpen = ref(false);

const openEnquire = () => {
  trackEnquiryModalOpen({
    vehicle: vehicle.value,
    source: 'detail_page',
  });
  enquiryModalOpen.value = true;
};

const closeEnquire = () => {
  enquiryModalOpen.value = false;
};

// Related vehicle enquiry modal (triggered by ModernVehicleCard)
const closeRelatedEnquire = () => {
  vehiclesStore.setVehicleEnquiryPopUp(false, null);
};

// Share vehicle functionality
const shareVehicle = async () => {
  const shareData = {
    title: `${vehicleTitle(vehicle.value)} | Phil Gilbert Hyundai`,
    text: `Check out this ${vehicleTitle(vehicle.value)} - ${priceDisplay.value}`,
    url: window.location.href,
  };

  try {
    if (navigator.share && navigator.canShare(shareData)) {
      await navigator.share(shareData);
    } else {
      // Fallback: copy URL to clipboard
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  } catch (err) {
    // User cancelled share or error occurred
    if ((err as Error).name !== 'AbortError') {
      // Try clipboard as fallback
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to clipboard!');
      } catch {
        toast.error('Failed to copy link');
      }
    }
  }
};

// Save vehicle functionality
const isVehicleSaved = computed(() => {
  return comparisonSet.value.has(vehicleId.value);
});

const toggleSaveVehicle = () => {
  const id = vehicleId.value;
  if (!id) return;

  const ids = comparisonSet.value;
  if (ids.has(id)) {
    // Remove from saved
    comparisonIds.value = normalizeComparisonIds(comparisonIds.value).filter(i => i !== id);
    toast.info('Vehicle removed from saved');
  } else {
    // Add to saved (max 3)
    if (ids.size >= 3) {
      toast.warning('You can save up to 3 vehicles at once');
      return;
    }
    comparisonIds.value = [...normalizeComparisonIds(comparisonIds.value), id];
    toast.success('Vehicle saved!', 'Added to favorites');
  }
};

// Test drive modal state
const testDriveModalOpen = ref(false);

const openTestDrive = () => {
  testDriveModalOpen.value = true;
};

const closeTestDrive = () => {
  testDriveModalOpen.value = false;
};
</script>

<style scoped>
/* Mobile Sticky CTA Bar */
.mobile-cta-bar {
  display: none;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  padding: 0.75rem 1rem;
  padding-bottom: calc(0.75rem + env(safe-area-inset-bottom, 0px));
  background-color: #fff;
  border-top: 1px solid #e2e8f0;
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.08);
  gap: 0.75rem;
}

@media (max-width: 1023px) {
  .mobile-cta-bar {
    display: flex;
  }

  /* Add padding to bottom of page to prevent content from being hidden behind sticky bar */
  .bg-slate-50 {
    padding-bottom: 5rem;
  }
}

.mobile-cta-btn {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.875rem 1rem;
  font-size: 0.9375rem;
  font-weight: 600;
  text-decoration: none;
  border-radius: 0.625rem;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.mobile-cta-btn--call {
  background-color: #fff;
  color: #002c5f;
  border: 2px solid #002c5f;
}

.mobile-cta-btn--call:hover {
  background-color: #f8fafc;
}

.mobile-cta-btn--enquire {
  background-color: #002c5f;
  color: #fff;
}

.mobile-cta-btn--enquire:hover {
  background-color: #001d40;
}
</style>

<style lang="scss">
/* Global (unscoped) styles to override UIkit conflicts on this page */
.vehicle-for-sale-page {
  /* Reset UIkit min-height on all containers */
  .rounded-2xl,
  .rounded-xl,
  .rounded-lg,
  .rounded-full,
  .rounded-md {
    min-height: unset !important;
  }
  
  /* Fix header chips (Automatic, Petrol, SUV, etc.) - the span pills */
  .flex.flex-wrap.gap-2 > span.rounded-full {
    padding: 0.25rem 0.75rem !important;
    height: auto !important;
    min-height: unset !important;
    line-height: 1.4 !important;
  }
  
  /* Fix highlight cards (Odometer, Body type, Fuel, Transmission) */
  .grid.grid-cols-2 > .flex.items-center.rounded-xl {
    padding: 0.75rem 1rem !important;
    min-height: unset !important;
  }
  
  /* Icon circles in highlight cards */
  .flex.h-10.w-10.rounded-full {
    height: 2.5rem !important;
    width: 2.5rem !important;
    min-height: unset !important;
    flex-shrink: 0 !important;
  }
  
  /* Compact spec items */
  .rounded-lg.border-slate-100.bg-slate-50,
  .rounded-lg.border.border-slate-100 {
    padding: 0.5rem 0.75rem !important;
    height: auto !important;
    min-height: unset !important;
    word-break: break-word; /* Prevent long VIN numbers from overflowing */
    overflow-wrap: break-word;
  }
  
  /* Reset space-y children */
  .space-y-4 > * {
    min-height: unset !important;
  }
  
  /* Ensure grid displays correctly */
  .grid {
    display: grid !important;
  }
  
  /* Fix highlights grid on mobile */
  .grid.grid-cols-2 {
    display: grid !important;
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
  }
  
  @media (min-width: 640px) {
    .grid.sm\:grid-cols-4 {
      grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
    }
  }
  
  /* Reset any UIkit padding on nested divs */
  .px-3.py-2,
  .px-4.py-3 {
    padding: 0.75rem 1rem !important;
  }
  
  .px-3.py-2 {
    padding: 0.5rem 0.75rem !important;
  }
}
</style>
