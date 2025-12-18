<template>
  <div class="car-calculator-page">
    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Loading {{ modelSlug }}...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="errorMessage" class="error-container">
      <h2>Unable to load vehicle</h2>
      <p>{{ errorMessage }}</p>
      <NuxtLink to="/test-drive" class="btn-back">Back to Vehicles</NuxtLink>
    </div>

    <!-- Calculator Content -->
    <div v-else-if="calculatorData" class="calculator-layout">
      <!-- Left Panel - Sticky Vehicle Image -->
      <div class="left-panel">
        <div class="sticky-content">
          <!-- Vehicle Image -->
          <div class="vehicle-image-container">
            <NuxtImg
              v-if="selectedColourImage"
              :src="selectedColourImage"
              :alt="`${calculatorData.model} in ${selectedColour?.name || 'selected colour'}`"
              width="800"
              height="450"
              class="vehicle-image"
              format="webp"
              quality="80"
            />
            <div v-else class="vehicle-placeholder">
              <span>{{ calculatorData.model }}</span>
            </div>
          </div>
          
          <!-- Quick Summary (visible on desktop) -->
          <div class="quick-summary">
            <div class="summary-item" v-if="selectedColour">
              <span class="summary-label">Colour</span>
              <span class="summary-value">{{ selectedColour.name }}</span>
            </div>
            <div class="summary-item" v-if="selectedTrim">
              <span class="summary-label">Interior</span>
              <span class="summary-value">{{ selectedTrim.name }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Panel - Scrollable Configuration -->
      <div class="right-panel">
        <!-- Header -->
        <div class="config-header">
          <NuxtLink to="/test-drive" class="back-link">
            <span class="back-arrow">←</span>
            Back to all vehicles
          </NuxtLink>
          <h1 class="model-name">{{ calculatorData.model }}</h1>
          
          <!-- Powertrain Tabs -->
          <div v-if="calculatorData.powertrains && calculatorData.powertrains.length > 1" class="powertrain-tabs">
            <button 
              v-for="powertrain in calculatorData.powertrains" 
              :key="powertrain"
              :class="['powertrain-tab', { active: selectedPowertrain === powertrain }]"
              @click="selectedPowertrain = powertrain">
              {{ powertrain }}
            </button>
          </div>
        </div>

        <!-- Configuration Sections -->
        <div class="config-sections">
          <!-- Variant Selection -->
          <section class="config-section">
            <h2 class="section-title">Select your {{ calculatorData.model }}.</h2>
            <div class="variant-grid">
              <div 
                v-for="group in filteredVariantGroups" 
                :key="group.id"
                :class="['variant-card', { selected: selectedVariantGroup?.id === group.id }]"
                @click="selectVariantGroup(group)">
                <div class="variant-image">
                  <NuxtImg v-if="group.image" :src="group.image" :alt="group.name" width="200" height="150" format="webp" quality="80" loading="lazy" />
                  <div v-else class="variant-image-placeholder">
                    <span>{{ group.name.charAt(0) }}</span>
                  </div>
                </div>
                <div class="variant-details">
                  <h3 class="variant-name">{{ group.name }}</h3>
                  <div v-if="group.lowestPrice" class="variant-price">
                    From ${{ formatPrice(group.lowestPrice) }}<sup>[D]</sup>
                  </div>
                  <div v-if="group.smartSenseIncluded" class="smartsense-badge">
                    <span class="badge-icon">✓</span> SmartSense™ Included
                  </div>
                </div>
                <div class="variant-select-indicator">
                  <span v-if="selectedVariantGroup?.id === group.id" class="check-icon">✓</span>
                </div>
              </div>
            </div>
          </section>

          <!-- Key Features -->
          <section v-if="selectedVariantGroup?.features?.length" class="config-section features-section">
            <h2 class="section-title">Key Features</h2>
            <ul class="features-grid">
              <li v-for="(feature, index) in selectedVariantGroup.features.slice(0, 8)" :key="index" class="feature-item">
                <span class="feature-check">✓</span>
                <span v-html="feature.text"></span>
              </li>
            </ul>
          </section>

          <!-- Colour Selection -->
          <section v-if="selectedVariant?.colours?.length" class="config-section colour-section">
            <h2 class="section-title">Colour.</h2>
            
            <!-- Exterior Colours -->
            <div class="colour-group">
              <h3 class="colour-group-title">Exterior</h3>
              <p class="colour-note">Recommended Retail Price (RRP) shown, at participating dealers.</p>
              <div class="colour-grid">
                <div 
                  v-for="colour in selectedVariant.colours" 
                  :key="colour.id"
                  :class="['colour-option', { selected: selectedColour?.id === colour.id, 'sold-out': colour.soldOut }]"
                  @click="!colour.soldOut && selectColour(colour)">
                  <div class="colour-swatch">
                    <NuxtImg v-if="colour.swatch" :src="colour.swatch" :alt="colour.name" width="48" height="48" format="webp" quality="80" loading="lazy" />
                  </div>
                  <span class="colour-name">{{ colour.name }}</span>
                  <span v-if="colour.price > 0" class="colour-price">+${{ formatPrice(colour.price) }}</span>
                  <span v-else class="colour-price">Included</span>
                  <span v-if="colour.soldOut" class="sold-out-badge">Sold Out</span>
                </div>
              </div>
            </div>

            <!-- Interior Trims -->
            <div v-if="selectedColour?.trims?.length" class="colour-group">
              <h3 class="colour-group-title">Interior</h3>
              <p class="colour-note">Recommended Retail Price (RRP) shown, at participating dealers.</p>
              <div class="colour-grid">
                <div 
                  v-for="trim in selectedColour.trims" 
                  :key="trim.id"
                  :class="['colour-option', { selected: selectedTrim?.id === trim.id }]"
                  @click="selectedTrim = trim">
                  <div class="colour-swatch">
                    <NuxtImg v-if="trim.swatch" :src="trim.swatch" :alt="trim.name" width="48" height="48" format="webp" quality="80" loading="lazy" />
                  </div>
                  <span class="colour-name">{{ trim.name }}</span>
                  <span v-if="trim.price > 0" class="colour-price">+${{ formatPrice(trim.price) }}</span>
                  <span v-else class="colour-price">Included</span>
                </div>
              </div>
            </div>
          </section>

          <!-- Option Packs -->
          <section v-if="selectedVariantGroup?.optionPacks?.length" class="config-section option-packs-section">
            <h2 class="section-title">Option Pack</h2>
            <div class="option-packs-grid">
              <div 
                v-for="pack in selectedVariantGroup.optionPacks" 
                :key="pack.id"
                :class="['option-pack-card', { selected: selectedOptionPack?.id === pack.id }]"
                @click="toggleOptionPack(pack)">
                <div class="pack-image" v-if="pack.modalImage">
                  <NuxtImg :src="pack.modalImage" :alt="pack.title || pack.name" width="320" height="200" format="webp" quality="80" loading="lazy" />
                </div>
                <div class="pack-content">
                  <div class="pack-header">
                    <div class="pack-checkbox">
                      <span v-if="selectedOptionPack?.id === pack.id" class="check-icon">✓</span>
                    </div>
                    <div class="pack-title-area">
                      <h4 class="pack-title">{{ pack.title || pack.name }}</h4>
                      <p v-if="pack.variantEnginesAndTransmissions?.length" class="pack-engines">
                        Available on: {{ pack.variantEnginesAndTransmissions.join(', ') }}
                      </p>
                    </div>
                    <div v-if="pack.price > 0" class="pack-price-tag">
                      +${{ formatPrice(pack.price) }}
                    </div>
                  </div>
                  <ul v-if="pack.features" class="pack-features">
                    <li v-for="(feature, index) in pack.features.slice(0, 8)" :key="index">
                      <span class="feature-check">✓</span>
                      <span v-html="feature.text"></span>
                    </li>
                  </ul>
                  <button v-if="pack.features?.length > 8" class="pack-view-more" @click.stop="showPackDetails(pack)">
                    View all {{ pack.features.length }} features
                  </button>
                </div>
              </div>
            </div>
          </section>

          <!-- Engine & Transmission -->
          <section v-if="variantsForGroup?.length > 1" class="config-section">
            <h2 class="section-title">Engine & Transmission</h2>
            <div class="engine-grid">
              <div 
                v-for="variant in variantsForGroup" 
                :key="variant.id"
                :class="['engine-option', { selected: selectedVariant?.id === variant.id }]"
                @click="selectVariant(variant)">
                <div class="engine-radio">
                  <span v-if="selectedVariant?.id === variant.id" class="radio-dot"></span>
                </div>
                <div class="engine-details">
                  <span class="engine-type">{{ variant.engineType }}</span>
                  <span class="transmission-type">{{ variant.transmissionType }}</span>
                </div>
                <div class="engine-price">
                  ${{ formatPrice(variant.priceEstimate || variant.price) }}
                </div>
              </div>
            </div>
          </section>

          <!-- Pre-Paid Servicing -->
          <section v-if="selectedVariant?.prePaid?.plans?.length" class="config-section">
            <h2 class="section-title">Pre-Paid Servicing <span class="optional-tag">(optional)</span></h2>
            <div class="prepaid-grid">
              <div 
                :class="['prepaid-option', { selected: !selectedPrepaidPlan }]"
                @click="selectPrepaidPlan(null)">
                <div class="prepaid-radio">
                  <span v-if="!selectedPrepaidPlan" class="radio-dot"></span>
                </div>
                <div class="prepaid-details">
                  <span class="prepaid-name">No Pre-Paid Servicing</span>
                </div>
                <div class="prepaid-price">$0</div>
              </div>
              <div 
                v-for="plan in selectedVariant.prePaid.plans" 
                :key="plan.year"
                :class="['prepaid-option', { selected: selectedPrepaidPlan?.year === plan.year }]"
                @click="selectPrepaidPlan(plan)">
                <div class="prepaid-radio">
                  <span v-if="selectedPrepaidPlan?.year === plan.year" class="radio-dot"></span>
                </div>
                <div class="prepaid-details">
                  <span class="prepaid-name">{{ plan.year }} Year Plan</span>
                  <span class="prepaid-interval">Service every {{ formatServiceInterval(selectedVariant.prePaid.serviceInterval) }}</span>
                </div>
                <div class="prepaid-price">${{ formatPrice(plan.price) }}</div>
              </div>
            </div>
          </section>

          <!-- Special Offers -->
          <section v-if="currentOffers.length" class="config-section offers-section">
            <h2 class="section-title">Special Offers</h2>
            <div class="offers-grid">
              <div v-for="offer in currentOffers" :key="offer.offerId" class="offer-card">
                <div class="offer-type-badge">{{ offer.type }}</div>
                <div class="offer-content">
                  <h4 class="offer-title">{{ offer.title }}</h4>
                  <div class="offer-value">{{ offer.formattedValue }}</div>
                  <p v-if="offer.subtitle" class="offer-subtitle">{{ offer.subtitle }}</p>
                </div>
                <sup class="offer-citation">[{{ offer.disclaimerCitation }}]</sup>
              </div>
            </div>
          </section>

          <!-- Genuine Accessories -->
          <section v-if="!accessoriesLoading && accessoriesData && (accessoriesData.accessories?.length || accessoriesData.accessoryPacks?.length)" class="config-section accessories-section">
            <h2 class="section-title">Genuine Accessories.</h2>
            <button class="benefits-link" @click="showGenuineBenefitsModal = true">
              The benefits of genuine <span class="arrow">></span>
            </button>
            
            <div class="accessories-summary">
                <h3 class="accessories-subtitle">Featured</h3>
                <p class="selected-count">{{ selectedAccessories.length }} selected (${{ formatPrice(accessoriesTotalPrice) }})</p>
              </div>
              
              <!-- Featured Accessories Grid -->
              <div v-if="featuredAccessories.length" class="accessories-grid">
              <div 
                v-for="accessory in featuredAccessories.slice(0, 4)" 
                :key="accessory.id"
                :class="['accessory-card', { selected: isAccessorySelected(accessory.id) }]"
                @click="toggleAccessory(accessory)">
                <!-- Selection tick indicator -->
                <div v-if="isAccessorySelected(accessory.id)" class="selection-tick">
                  <span class="tick-icon">✓</span>
                </div>
                <div class="accessory-image">
                  <NuxtImg v-if="accessory.image || accessory.thumbnail" :src="accessory.thumbnail || accessory.image" :alt="accessory.name" width="200" height="150" format="webp" quality="80" loading="lazy" />
                  <div v-else class="accessory-placeholder">{{ accessory.name.charAt(0) }}</div>
                </div>
                <div class="accessory-info">
                  <h4 class="accessory-name">{{ accessory.name }}</h4>
                  <span class="accessory-category">{{ accessory.categoryName || accessory.category }}</span>
                  <div class="accessory-footer">
                    <button class="learn-more-link" :aria-label="`View details about ${accessory.name}`" @click.stop="openAccessoryDetail(accessory)">View {{ accessory.name }} details</button>
                    <span class="accessory-price">${{ formatPrice(accessory.price) }}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Accessory Packs -->
            <div v-if="accessoriesData.accessoryPacks?.length" class="accessory-packs-grid">
              <div 
                v-for="pack in accessoriesData.accessoryPacks.slice(0, 2)" 
                :key="pack.id"
                :class="['accessory-pack-card', { selected: isPackSelected(pack.id) }]"
                @click="toggleAccessoryPack(pack)">
                <!-- Selection tick indicator -->
                <div v-if="isPackSelected(pack.id)" class="selection-tick">
                  <span class="tick-icon">✓</span>
                </div>
                <div class="pack-image">
                  <NuxtImg v-if="pack.image" :src="pack.image" :alt="pack.name" width="200" height="150" format="webp" quality="80" loading="lazy" />
                </div>
                <div class="pack-info">
                  <h4 class="pack-name">{{ pack.name }}</h4>
                  <span class="pack-category">Packs</span>
                  <div class="pack-footer">
                    <button class="learn-more-link" :aria-label="`View details about ${pack.name} pack`" @click.stop="openAccessoryDetail(pack, true)">View {{ pack.name }} details</button>
                    <span class="pack-price">${{ formatPrice(pack.price) }}</span>
                  </div>
                  <div v-if="pack.savingsAmount" class="pack-savings">Save ${{ formatPrice(pack.savingsAmount) }}</div>
                </div>
              </div>
            </div>
            
            <button class="view-all-accessories-btn" @click="showAccessoriesModal = true">
              View all accessories <span class="arrow">></span>
            </button>
          </section>

          <!-- Accessories Modal -->
          <div v-if="showAccessoriesModal" class="modal-overlay" @click.self="showAccessoriesModal = false">
            <div class="accessories-modal">
              <button class="modal-close" @click="showAccessoriesModal = false">×</button>
              
              <h2 class="modal-title">{{ calculatorData.model?.toUpperCase() }} Accessories</h2>
              <p class="modal-subtitle">{{ selectedVariantGroup?.name }} {{ selectedVariant?.engineType || '' }}</p>
              
              <!-- Category Tabs -->
              <div class="accessory-tabs">
                <button 
                  :class="['tab-btn', { active: selectedAccessoryCategory === 'All' }]"
                  @click="selectedAccessoryCategory = 'All'">
                  All
                </button>
                <button 
                  v-if="accessoriesData.accessoryPacks?.length"
                  :class="['tab-btn', { active: selectedAccessoryCategory === 'Packs' }]"
                  @click="selectedAccessoryCategory = 'Packs'">
                  Packs
                </button>
                <button 
                  v-for="category in accessoriesData.categories" 
                  :key="category"
                  :class="['tab-btn', { active: selectedAccessoryCategory === category }]"
                  @click="selectedAccessoryCategory = category">
                  {{ category }}
                </button>
              </div>
              
              <!-- Filter Bar -->
              <div class="accessory-filter-bar">
                <span class="selected-text">{{ selectedAccessories.length }} selected</span>
                <div class="filter-options">
                  <span>Show:</span>
                  <button :class="['filter-btn', { active: accessoryShowFilter === 'all' }]" @click="accessoryShowFilter = 'all'">All</button>
                  <span class="divider">|</span>
                  <button :class="['filter-btn', { active: accessoryShowFilter === 'selected' }]" @click="accessoryShowFilter = 'selected'">Selected</button>
                </div>
                <div class="sort-options">
                  <span>Sort by:</span>
                  <select v-model="accessorySortBy" class="sort-select">
                    <option value="name">Name A-Z</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                  </select>
                </div>
              </div>
              
              <!-- Accessories Grid in Modal -->
              <div class="modal-accessories-grid">
                <!-- Packs -->
                <template v-if="selectedAccessoryCategory === 'All' || selectedAccessoryCategory === 'Packs'">
                  <div 
                    v-for="pack in filteredPacks" 
                    :key="'pack-' + pack.id"
                    :class="['modal-accessory-card', { selected: isPackSelected(pack.id) }]"
                    @click="toggleAccessoryPack(pack)">
                    <div class="card-checkbox">
                      <span v-if="isPackSelected(pack.id)" class="check">✓</span>
                    </div>
                    <div class="card-image">
                      <NuxtImg v-if="pack.image" :src="pack.image" :alt="pack.name" width="200" height="150" format="webp" quality="80" loading="lazy" />
                    </div>
                    <div class="card-content">
                      <h4 class="card-name">{{ pack.name }}</h4>
                      <span class="card-category">Packs</span>
                      <div class="card-footer">
                        <button class="learn-more-link" :aria-label="`View details about ${pack.name} pack`" @click.stop="openAccessoryDetail(pack, true)">View {{ pack.name }} details</button>
                        <span class="card-price">${{ formatPrice(pack.price) }}</span>
                      </div>
                    </div>
                  </div>
                </template>
                
                <!-- Individual Accessories -->
                <div 
                  v-for="accessory in filteredAccessories" 
                  :key="accessory.id"
                  :class="['modal-accessory-card', { selected: isAccessorySelected(accessory.id) }]"
                  @click="toggleAccessory(accessory)">
                  <div class="card-checkbox">
                    <span v-if="isAccessorySelected(accessory.id)" class="check">✓</span>
                  </div>
                  <div class="card-image">
                    <NuxtImg v-if="accessory.image || accessory.thumbnail" :src="accessory.thumbnail || accessory.image" :alt="accessory.name" width="200" height="150" format="webp" quality="80" loading="lazy" />
                  </div>
                  <div class="card-content">
                    <h4 class="card-name">{{ accessory.name }}</h4>
                    <span class="card-category">{{ accessory.categoryName || accessory.category }}</span>
                    <div class="card-footer">
                      <button class="learn-more-link" :aria-label="`View details about ${accessory.name}`" @click.stop="openAccessoryDetail(accessory)">View {{ accessory.name }} details</button>
                      <span class="card-price">${{ formatPrice(accessory.price) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Genuine Benefits Modal -->
          <div v-if="showGenuineBenefitsModal" class="modal-overlay" @click.self="showGenuineBenefitsModal = false">
            <div class="benefits-modal">
              <button class="modal-close" @click="showGenuineBenefitsModal = false">×</button>
              <div class="benefits-content">
                <div class="benefits-image">
                  <NuxtImg src="https://www.hyundai.com/content/dam/hyundai/au/en/images/accessories/hyundai-au-en-accessories-genuine-accessories-1120x840.jpg" alt="Hyundai Genuine Accessories" width="560" height="420" format="webp" quality="80" />
                </div>
                <div class="benefits-text">
                  <h2>Hyundai Genuine Accessories.</h2>
                  <p>Enhance your driving pleasure and ownership pride by adding Hyundai Genuine Accessories. They are backed by a 5-year warranty when purchased with a new vehicle and fitted by an authorised Hyundai technician or Hyundai Service Centre.</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Option Pack Details Modal -->
          <div v-if="showOptionPackModal && selectedOptionPackDetails" class="modal-overlay" @click.self="closeOptionPackModal">
            <div class="option-pack-modal">
              <button class="modal-close" @click="closeOptionPackModal">×</button>
              
              <div class="option-pack-modal-content">
                <!-- Pack Image -->
                <div v-if="selectedOptionPackDetails.modalImage" class="pack-modal-image">
                  <NuxtImg :src="selectedOptionPackDetails.modalImage" :alt="selectedOptionPackDetails.title || selectedOptionPackDetails.name" width="480" height="300" format="webp" quality="80" />
                </div>
                
                <!-- Pack Info -->
                <div class="pack-modal-info">
                  <h2 class="pack-modal-title">{{ selectedOptionPackDetails.title || selectedOptionPackDetails.name }}</h2>
                  
                  <p v-if="selectedOptionPackDetails.variantEnginesAndTransmissions?.length" class="pack-modal-engines">
                    Available on: {{ selectedOptionPackDetails.variantEnginesAndTransmissions.join(', ') }}
                  </p>
                  
                  <div v-if="selectedOptionPackDetails.price > 0" class="pack-modal-price">
                    ${{ formatPrice(selectedOptionPackDetails.price) }}
                  </div>
                  
                  <p v-if="selectedOptionPackDetails.description" class="pack-modal-description" v-html="selectedOptionPackDetails.description"></p>
                  
                  <!-- All Features -->
                  <div v-if="selectedOptionPackDetails.features?.length" class="pack-modal-features">
                    <h3>All Features ({{ selectedOptionPackDetails.features.length }})</h3>
                    <ul class="features-list">
                      <li v-for="(feature, index) in selectedOptionPackDetails.features" :key="index">
                        <span class="feature-check">✓</span>
                        <span v-html="feature.text"></span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Accessory Detail Modal -->
          <div v-if="showAccessoryDetailModal && selectedAccessoryDetail" class="modal-overlay" @click.self="closeAccessoryDetailModal">
            <div class="accessory-detail-modal">
              <button class="modal-close" @click="closeAccessoryDetailModal">×</button>
              
              <div class="detail-modal-content">
                <!-- Left: Images -->
                <div class="detail-images">
                  <div class="main-image">
                    <NuxtImg
                      :src="selectedAccessoryDetail.image || selectedAccessoryDetail.thumbnail"
                      :alt="selectedAccessoryDetail.name"
                      width="480"
                      height="360"
                      format="webp"
                      quality="85"
                    />
                  </div>
                  <!-- Thumbnail gallery if we have multiple images -->
                  <div v-if="selectedAccessoryDetail.thumbnail && selectedAccessoryDetail.image" class="image-thumbnails">
                    <NuxtImg :src="selectedAccessoryDetail.image" :alt="selectedAccessoryDetail.name" class="thumb active" width="80" height="60" format="webp" quality="80" />
                    <NuxtImg v-if="selectedAccessoryDetail.thumbnail" :src="selectedAccessoryDetail.thumbnail" :alt="selectedAccessoryDetail.name" class="thumb" width="80" height="60" format="webp" quality="80" />
                  </div>
                </div>
                
                <!-- Right: Details -->
                <div class="detail-info">
                  <span class="detail-category">{{ selectedAccessoryDetail.isPack ? 'Packs' : selectedAccessoryDetail.category }}</span>
                  <h2 class="detail-name">{{ selectedAccessoryDetail.name }}</h2>
                  
                  <div class="detail-price">${{ formatPrice(selectedAccessoryDetail.price) }}*</div>
                  <p class="price-note">Price includes GST and fitment.</p>
                  
                  <div v-if="selectedAccessoryDetail.savingsAmount" class="detail-savings">
                    Pack savings: ${{ formatPrice(selectedAccessoryDetail.savingsAmount) }}^
                  </div>
                  
                  <!-- Quantity selector -->
                  <div class="quantity-selector">
                    <button class="qty-btn" @click="decrementQuantity" :disabled="accessoryDetailQuantity <= 1">−</button>
                    <span class="qty-value">{{ accessoryDetailQuantity }}</span>
                    <button class="qty-btn" @click="incrementQuantity">+</button>
                    <button class="add-to-quote-btn" @click="addAccessoryFromDetail">Add to quote</button>
                  </div>
                  
                  <p class="detail-description">{{ selectedAccessoryDetail.description }}</p>
                  
                  <!-- Pack contents -->
                  <div v-if="selectedAccessoryDetail.isPack && selectedAccessoryDetail.includedAccessories?.length" class="pack-contents">
                    <h3>Accessories include:</h3>
                    <ul>
                      <li v-for="item in getPackAccessoriesNames(selectedAccessoryDetail)" :key="item.citation">
                        {{ item.name }} <sup v-if="item.citation">[{{ item.citation }}]</sup>
                      </li>
                    </ul>
                  </div>
                  
                  <!-- Part number -->
                  <p v-if="selectedAccessoryDetail.partNumber" class="detail-part-number">
                    <span class="label">Part Number:</span> {{ selectedAccessoryDetail.partNumber }}
                  </p>
                  
                  <!-- Disclaimer -->
                  <div v-if="selectedAccessoryDetail.disclaimer" class="detail-disclaimer">
                    <h4>Disclaimer:</h4>
                    <p>{{ selectedAccessoryDetail.disclaimer }}</p>
                  </div>
                  
                  <!-- General disclaimer -->
                  <p class="general-disclaimer">
                    * Prices as of 1 August 2024, after which price may change without notice. Price stated (includes fitment & GST) and is based on the RRP for the accessories shown, standard labour time and recommended hourly labour rate. Only valid at participating Hyundai dealers.
                  </p>
                  
                  <p v-if="selectedAccessoryDetail.savingsAmount" class="savings-disclaimer">
                    ^ Saving stated are based on the purchase price of the accessory bundle vs the total purchase price of the items in the bundle if those items were purchased individually from Hyundai.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Disclaimers -->
          <section v-if="calculatorData.disclaimers?.length || calculatorData.priceDisclaimer" class="config-section disclaimers-section">
            <h3 class="disclaimers-title">Important Information</h3>
            <div class="disclaimers-content">
              <!-- Model-specific price disclaimer -->
              <div v-if="calculatorData.priceDisclaimer" class="disclaimer-text price-disclaimer" v-html="calculatorData.priceDisclaimer"></div>
              
              <!-- Citation-based disclaimers -->
              <p v-for="disclaimer in calculatorData.disclaimers" :key="disclaimer.citation" class="disclaimer-text">
                <sup>[{{ disclaimer.citation }}]</sup> <span v-html="disclaimer.text"></span>
              </p>
            </div>
          </section>
        </div>
      </div>

      <!-- Fixed Price Footer with Breakdown -->
      <div class="price-footer" :class="{ 'expanded': showPriceBreakdown }">
        <!-- Price Breakdown Panel (expands above footer) -->
        <div v-if="showPriceBreakdown" class="price-breakdown-panel">
          <div class="breakdown-header">
            <h3 class="breakdown-title">{{ calculatorData.model }}</h3>
            <p class="breakdown-subtitle">
              {{ selectedVariantGroup?.name }} {{ selectedVariant?.engineType || '' }} {{ selectedVariant?.transmissionType || '' }}
            </p>
            <button class="change-vehicle-link" @click="scrollToVariants">Change vehicle ></button>
          </div>
          
          <div class="breakdown-items">
            <!-- Drive Away Price (main row, clickable to expand) -->
            <div class="breakdown-row main-row" @click="showPriceBreakdown = !showPriceBreakdown">
              <span class="row-label">DRIVE AWAY<sup>[D]</sup></span>
              <span class="row-value">${{ formatPrice(totalPrice) }}</span>
              <span class="expand-icon">^</span>
            </div>
            
            <!-- Loading state for pricing details -->
            <div v-if="pricingLoading" class="breakdown-row">
              <span class="row-label">Loading pricing details...</span>
            </div>
            
            <!-- MLP -->
            <div v-if="variantPricing" class="breakdown-row">
              <span class="row-label">Manufacturer List Price Inc GST</span>
              <span class="row-value">${{ formatPrice(variantPricing.mlpWithOptions || variantPricing.mlp) }}</span>
            </div>
            
            <!-- On Road Costs -->
            <div v-if="variantPricing" class="breakdown-row">
              <span class="row-label">On Road Cost (Statutory Charges, Delivery)</span>
              <span class="row-value">${{ formatPrice(variantPricing.onRoadCosts?.onRoadCost || variantPricing.onRoadCosts?.total || 0) }}</span>
            </div>
            
            <!-- Campaign Discount (if any) -->
            <div v-if="variantPricing?.dealerDiscount?.discount" class="breakdown-row discount-row">
              <span class="row-label">Campaign Discount</span>
              <span class="row-value discount">-${{ formatPrice(variantPricing.dealerDiscount.discount) }}</span>
            </div>
            
            <!-- Exterior Colour (if has price) - Only show if NOT using variantPricing (fallback mode) -->
            <div v-if="!variantPricing && selectedColour?.price > 0" class="breakdown-row">
              <span class="row-label">Exterior Colour ({{ selectedColour.name }})</span>
              <span class="row-value">+${{ formatPrice(selectedColour.price) }}</span>
            </div>
            
            <!-- Interior Trim (if has price) - Only show if NOT using variantPricing (fallback mode) -->
            <div v-if="!variantPricing && selectedTrim?.price > 0" class="breakdown-row">
              <span class="row-label">Interior ({{ selectedTrim.name }})</span>
              <span class="row-value">+${{ formatPrice(selectedTrim.price) }}</span>
            </div>
            
            <!-- Option Pack (if selected) -->
            <div v-if="selectedOptionPack?.price > 0" class="breakdown-row">
              <span class="row-label">Option Pack ({{ selectedOptionPack.title || selectedOptionPack.name }})</span>
              <span class="row-value">+${{ formatPrice(selectedOptionPack.price) }}</span>
            </div>
            
            <!-- Pre-paid Servicing (if selected) -->
            <div v-if="selectedPrepaidPlan?.price" class="breakdown-row">
              <span class="row-label">Pre-Paid Servicing ({{ selectedPrepaidPlan.name }})</span>
              <span class="row-value">+${{ formatPrice(selectedPrepaidPlan.price) }}</span>
            </div>
            
            <!-- Selected Accessories (if any) -->
            <div v-if="selectedAccessories.length > 0" class="breakdown-row accessories-row">
              <span class="row-label">Genuine Accessories ({{ selectedAccessories.length }} item{{ selectedAccessories.length > 1 ? 's' : '' }})</span>
              <span class="row-value">+${{ formatPrice(accessoriesTotalPrice) }}</span>
            </div>
            
            <!-- Drive Away Offer -->
            <div class="breakdown-row offer-row">
              <span class="row-label offer-label">Drive Away Offer</span>
              <span class="row-value offer-value">${{ formatPrice(totalPrice) }}</span>
            </div>
            
            <!-- GST Note -->
            <p v-if="variantPricing" class="gst-note">
              All prices shown include GST if applicable.
              <span v-if="variantPricing.gst !== undefined">
                (GST: ${{ formatPrice(variantPricing.gst) }})
              </span>
              <span v-else>
                (GST: ${{ formatPrice((variantPricing.mlpWithOptions || variantPricing.mlp || 0) / 11) }})
              </span>
            </p>
          </div>
        </div>
        
        <div class="footer-content">
          <div class="footer-vehicle-info">
            <h3 class="footer-model">{{ calculatorData.model }}</h3>
            <p class="footer-config">
              {{ selectedVariantGroup?.name || '' }}
              <span v-if="selectedColour"> · {{ selectedColour.name }}</span>
              <span v-if="selectedAccessories.length > 0" class="accessories-badge"> + {{ selectedAccessories.length }} accessor{{ selectedAccessories.length > 1 ? 'ies' : 'y' }}</span>
            </p>
          </div>
          <div class="footer-price" @click="togglePriceBreakdown">
            <span class="price-label">DRIVE AWAY<sup>[D]</sup></span>
            <div class="price-row">
              <span class="price-amount">${{ formatPrice(totalPrice) }}</span>
              <span class="price-expand-icon" :class="{ 'rotated': showPriceBreakdown }">
                <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
                  <path d="M1 1L6 6L11 1" stroke="currentColor" stroke-width="2"/>
                </svg>
              </span>
              <span v-if="hasActiveOffer" class="offer-badge">SPECIAL OFFER</span>
            </div>
          </div>
          <div class="footer-actions">
            <button class="btn-secondary" type="button" @click="openTestDriveModal">Test Drive</button>
            <button class="btn-primary" type="button" @click="enquireNow">Enquire Now</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Test Drive Modal -->
    <TestDriveModal
      :is-open="showTestDriveModal"
      :preselected-model="modelSlug"
      @close="showTestDriveModal = false"
      @submit="handleTestDriveSubmit"
    />

    <!-- Enquire Modal -->
    <EnquireModal
      :is-open="showEnquireModal"
      :preselected-model="modelSlug"
      :vehicle-configuration="currentVehicleConfiguration"
      :applied-offers="currentOffers"
      :selected-accessories="selectedAccessories"
      @close="showEnquireModal = false"
      @submit="handleEnquireSubmit"
    />
  </div>
</template>

<script setup lang="ts">
// SEO
const route = useRoute();
const nuxtApp = useNuxtApp();
const modelSlug = computed(() => route.params.model as string || '');

// Update SEO when model changes
watch(modelSlug, (model) => {
  useSiteMeta({
    title: model ? `Build & Price ${model}` : 'Build & Price',
    description: model ? `Configure and price your ${model} with Hyundai. Select variants, colours, options and accessories.` : 'Configure and price your Hyundai vehicle.',
  });
}, { immediate: true });

// State
const postcode = ref('3000');
const selectedPowertrain = ref<string | null>(null);
const selectedVariantGroup = ref<any>(null);
const selectedVariant = ref<any>(null);
const selectedColour = ref<any>(null);
const selectedTrim = ref<any>(null);
const selectedOptionPack = ref<any>(null);
const selectedPrepaidPlan = ref<any>(null);
// Detailed pricing from variant price API - Server-side fetching
const variantPricingParams = computed(() => {
  if (!selectedVariant.value?.id) {
    return null;
  }
  const optionCost = (selectedColour.value?.price || 0) + (selectedTrim.value?.price || 0);
  return {
    variantId: selectedVariant.value.id,
    postcode: postcode.value,
    optionCost: optionCost.toString(),
  };
});

// Server-side variant pricing fetch - ONLY fetches when user clicks to view price breakdown
// This improves performance by not fetching pricing for every variant selection
const variantPricingKey = computed(() => {
  if (!selectedVariant.value?.id) return 'variant-price-none';
  const optionCost = (selectedColour.value?.price || 0) + (selectedTrim.value?.price || 0);
  return `variant-price-${selectedVariant.value.id}-${postcode.value}-${optionCost}`;
});

const { data: variantPricingResponse, pending: pricingLoading, execute: fetchVariantPricing } = await useAsyncData<any>(
  variantPricingKey,
  () => {
    // Only fetch if we have a valid variant selected
    if (!selectedVariant.value?.id || !variantPricingParams.value) {
      return Promise.resolve(null);
    }
    return $fetch('/api/variant-price', {
      query: variantPricingParams.value,
    });
  },
  {
    server: true, // CRITICAL: Only fetch on server
    lazy: true, // Lazy fetch - don't fetch automatically
    immediate: false, // Don't fetch immediately - only when explicitly called
    transform: (data: any) => {
      if (!data || data.success === false) {
        console.warn('[Variant Price] No pricing data or failed response');
        return null;
      }
      // API returns { success: true, pricing: {...} }, extract pricing
      const pricing = data.pricing || data;
      console.log('[Variant Price] Pricing data received:', {
        finalDriveAwayPrice: pricing?.finalDriveAwayPrice,
        mlp: pricing?.mlp,
        mlpWithOptions: pricing?.mlpWithOptions,
        onRoadCosts: pricing?.onRoadCosts,
        onRoadCostsTotal: pricing?.onRoadCosts?.onRoadCost || pricing?.onRoadCosts?.total,
        dealerDiscount: pricing?.dealerDiscount,
        dealerDiscountAmount: pricing?.dealerDiscount?.discount,
        gst: pricing?.gst,
        allKeys: Object.keys(pricing || {}),
      });
      return pricing;
    },
  }
);

// Transform variant pricing response
const variantPricing = computed<any>(() => {
  if (!variantPricingResponse.value || !selectedVariant.value?.id) {
    return null;
  }
  return variantPricingResponse.value;
});

// Watch for variant/colour/trim/postcode changes - refetch if breakdown is open
// This ensures pricing stays up-to-date when user changes selections while viewing breakdown
watch(
  [
    () => selectedVariant.value?.id,
    () => selectedColour.value?.price,
    () => selectedTrim.value?.price,
    postcode,
  ],
  () => {
    // Only refetch if breakdown is open and we have a valid variant
    if (showPriceBreakdown.value && selectedVariant.value?.id && variantPricingParams.value) {
      console.log('[Variant Price] Selection changed while breakdown open, refetching pricing');
      fetchVariantPricing();
    }
  }
);

// Price breakdown toggle
const showPriceBreakdown = ref(false);
// Accessories - Server-side fetching only
// Route is SSR'd via routeRules, so data is always in payload
const accessoriesKey = computed(() => `accessories-${modelSlug.value}`);
const { data: accessoriesResponse, pending: accessoriesLoading } = await useFetch<any>(
  () => '/api/accessories',
  {
    key: accessoriesKey.value,
    params: computed(() => ({
      model: modelSlug.value,
    })),
    server: true, // CRITICAL: Only fetch on server
    lazy: true, // Can be lazy since it's not critical for initial render
    transform: (data: any) => {
      if (!data || data.success === false) {
        return null;
      }
      return {
        accessories: data.accessories || [],
        accessoryPacks: data.accessoryPacks || [],
        categories: data.categories || [],
        categorizedAccessories: data.categorizedAccessories || {},
      };
    },
    // No watch - route changes trigger SSR which fetches new data
    // This prevents any client-side API calls
    onResponseError({ response }) {
      console.error('[Accessories] API Error:', response.status, response.statusText);
    },
  }
);

// Transform accessories response to match expected structure
const accessoriesData = computed(() => {
  if (!accessoriesResponse.value) return null;
  return accessoriesResponse.value;
});

const selectedAccessoryCategory = ref('All');
const selectedAccessories = ref<any[]>([]);
const showAccessoriesModal = ref(false);
const showGenuineBenefitsModal = ref(false);
// Accessory detail modal
const showAccessoryDetailModal = ref(false);
const selectedAccessoryDetail = ref<any>(null);
const accessoryDetailQuantity = ref(1);
// Accessory sorting and filtering
const accessorySortBy = ref('price-low');
const accessoryShowFilter = ref('all');
// Test Drive Modal
const showTestDriveModal = ref(false);
// Enquire Modal
const showEnquireModal = ref(false);
// Option Pack Details Modal
const showOptionPackModal = ref(false);
const selectedOptionPackDetails = ref<any>(null);

// Server-side data fetching - CRITICAL: Never fetches client-side
// Route is SSR'd via routeRules, so data is always in payload
const calculatorKey = computed(() => `calculator-${modelSlug.value}-${postcode.value}`);
const { data: calculatorData, pending: loading, error } = await useFetch<any>(
  () => '/api/car-calculator',
  {
    key: calculatorKey.value,
    params: computed(() => ({
      modelname: modelSlug.value,
      postcode: postcode.value,
      displaypowertrain: 'true',
    })),
    server: true, // CRITICAL: Only fetch on server
    lazy: false, // Fetch eagerly during SSR to include in payload
    // No watch - route changes trigger SSR which fetches new data
    // This prevents any client-side API calls
    onResponseError({ response }) {
      console.error('[CarCalculator] API Error:', response.status, response.statusText);
    },
  }
);
// Computed
const filteredVariantGroups = computed(() => {
  if (!calculatorData.value?.variantGroups) return [];
  
  // If powertrain is selected, filter variant groups by powertrain
  if (selectedPowertrain.value && selectedPowertrain.value !== 'All') {
    return calculatorData.value.variantGroups.filter((group: any) => 
      group.powertrain === selectedPowertrain.value
    );
  }
  
  return calculatorData.value.variantGroups;
});

const variantsForGroup = computed(() => {
  if (!selectedVariantGroup.value || !calculatorData.value?.variants) return [];

  const groupName = selectedVariantGroup.value.name;

  // Filter variants by exact match on variantGroup property
  // This ensures we only show engine/transmission options for the selected variant group
  return calculatorData.value.variants.filter((v: any) => {
    return v.variantGroup === groupName;
  });
});

const selectedColourImage = computed(() => {
  if (selectedColour.value?.image) {
    return selectedColour.value.image;
  }
  if (selectedVariantGroup.value?.image) {
    return selectedVariantGroup.value.image;
  }
  return null;
});
const totalPrice = computed(() => {
  // If we have detailed pricing from the API, use the final driveaway price
  // Note: finalDriveAwayPrice already includes colour and trim (via optionCost parameter)
  if (variantPricing.value?.finalDriveAwayPrice) {
    let price = variantPricing.value.finalDriveAwayPrice;
    
    // Only add items NOT included in the API's optionCost:
    // - Option packs (if not included in API calculation)
    // - Pre-paid servicing (not included in API)
    // - Accessories (not included in API)
    
    // Add option pack price (if not already included)
    if (selectedOptionPack.value?.price) {
      price += selectedOptionPack.value.price;
    }
    
    // Add pre-paid servicing price (not included in API)
    if (selectedPrepaidPlan.value?.price) {
      price += selectedPrepaidPlan.value.price;
    }
    
    // Add selected accessories price (not included in API)
    price += accessoriesTotalPrice.value;
    
    return price;
  }
  
  // Fallback to basic calculation when pricing API data is not available
  let price = 0;
  
  if (selectedVariant.value) {
    price = selectedVariant.value.priceEstimate || selectedVariant.value.price || 0;
  } else if (selectedVariantGroup.value?.lowestPrice) {
    price = parseFloat(selectedVariantGroup.value.lowestPrice) || 0;
  }
  
  // Add colour price (exterior)
  if (selectedColour.value?.price) {
    price += selectedColour.value.price;
  }
  
  // Add trim price (interior)
  if (selectedTrim.value?.price) {
    price += selectedTrim.value.price;
  }
  
  // Add option pack price
  if (selectedOptionPack.value?.price) {
    price += selectedOptionPack.value.price;
  }
  
  // Add pre-paid servicing price
  if (selectedPrepaidPlan.value?.price) {
    price += selectedPrepaidPlan.value.price;
  }
  
  // Add selected accessories price
  price += accessoriesTotalPrice.value;
  
  return price;
});

const hasDiscount = computed(() => {
  return (variantPricing.value?.dealerDiscount?.discount || 0) > 0;
});

const discountAmount = computed(() => {
  return variantPricing.value?.dealerDiscount?.discount || 0;
});

const currentOffers = computed(() => {
  if (!selectedVariant.value?.offerPackages) return [];
  
  const offers: any[] = [];
  selectedVariant.value.offerPackages.forEach((pkg: any) => {
    (pkg.offers || []).forEach((offer: any) => {
      offers.push(offer);
    });
  });
  
  // Sort by priority
  return offers.sort((a, b) => (a.priority || 0) - (b.priority || 0));
});

const hasActiveOffer = computed(() => {
  return selectedVariant.value?.featuredOffer || currentOffers.value.length > 0;
});

// Vehicle configuration computed for enquiry submission
const currentVehicleConfiguration = computed(() => {
  if (!selectedVariant.value) return undefined;

  return {
    model: calculatorData.value?.modelName || modelSlug.value,
    variant: selectedVariant.value?.name,
    variantId: selectedVariant.value?.id,
    colour: selectedColour.value?.name,
    colourPrice: selectedColour.value?.price || 0,
    trim: selectedTrim.value?.name,
    trimPrice: selectedTrim.value?.price || 0,
    optionPack: selectedOptionPack.value?.name,
    optionPackPrice: selectedOptionPack.value?.price || 0,
    prepaidService: selectedPrepaidPlan.value ? `${selectedPrepaidPlan.value.year} Year Plan` : undefined,
    prepaidServicePrice: selectedPrepaidPlan.value?.price || 0,
    basePrice: variantPricing.value?.finalDriveAwayPrice || selectedVariant.value?.price || 0,
    totalPrice: totalPrice.value,
    thumbnail: selectedVariant.value?.image || calculatorData.value?.modelImage,
  };
});

// Accessories computed properties
const featuredAccessories = computed(() => {
  if (!accessoriesData.value?.accessories) return [];
  // Return popular accessories or first 4
  const popular = accessoriesData.value.accessories.filter((a: any) => a.isPopular);
  return popular.length > 0 ? popular : accessoriesData.value.accessories.slice(0, 4);
});

const filteredPacks = computed(() => {
  if (!accessoriesData.value?.accessoryPacks) return [];
  
  let packs = [...accessoriesData.value.accessoryPacks];
  
  // Filter by selected status
  if (accessoryShowFilter.value === 'selected') {
    packs = packs.filter((p: any) => isPackSelected(p.id));
  }
  
  // Apply sorting
  if (accessorySortBy.value === 'name') {
    packs.sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''));
  } else if (accessorySortBy.value === 'price-low') {
    packs.sort((a: any, b: any) => (a.price || 0) - (b.price || 0));
  } else if (accessorySortBy.value === 'price-high') {
    packs.sort((a: any, b: any) => (b.price || 0) - (a.price || 0));
  }
  
  return packs;
});

const filteredAccessories = computed(() => {
  if (!accessoriesData.value?.accessories) return [];
  
  let accessories: any[];
  if (selectedAccessoryCategory.value === 'All' || selectedAccessoryCategory.value === 'Packs') {
    accessories = [...accessoriesData.value.accessories];
  } else {
    accessories = accessoriesData.value.accessories.filter((a: any) => 
      (a.categoryName || a.category) === selectedAccessoryCategory.value
    );
  }
  
  // Filter by selected status
  if (accessoryShowFilter.value === 'selected') {
    accessories = accessories.filter((a: any) => isAccessorySelected(a.id));
  }
  
  // Apply sorting
  if (accessorySortBy.value === 'name') {
    accessories.sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''));
  } else if (accessorySortBy.value === 'price-low') {
    accessories.sort((a: any, b: any) => (a.price || 0) - (b.price || 0));
  } else if (accessorySortBy.value === 'price-high') {
    accessories.sort((a: any, b: any) => (b.price || 0) - (a.price || 0));
  }
  
  return accessories;
});

const accessoriesTotalPrice = computed(() => {
  let total = 0;
  selectedAccessories.value.forEach((item: any) => {
    total += item.price || 0;
  });
  return total;
});
// Initialize calculator data when it's loaded
watch(calculatorData, async (data) => {
  if (!data) return;
  
  console.log('[CarCalculator] Calculator data loaded');
  console.log('[CarCalculator] Model:', data.model);
  console.log('[CarCalculator] Variant groups count:', data.variantGroups?.length);
  console.log('[CarCalculator] Variants count:', data.variants?.length);
  
  // Check if we have valid data
  const hasValidData = data && (
    data.success === true || 
    (data.variantGroups && data.variants)
  );
  
  if (!hasValidData) {
    console.error('[CarCalculator] Invalid data structure:', data);
    return;
  }
  
  // Set default powertrain
  if (data.powertrains?.length > 0) {
    selectedPowertrain.value = data.powertrains[0];
    console.log('[CarCalculator] Powertrain selected:', selectedPowertrain.value);
  } else {
    console.warn('[CarCalculator] No powertrains found');
  }
  
  // Select first variant group after a small delay to ensure computed is updated
  await nextTick();
  if (filteredVariantGroups.value.length > 0) {
    selectVariantGroup(filteredVariantGroups.value[0]);
    console.log('[CarCalculator] Variant group selected:', filteredVariantGroups.value[0].name);
    
    // If no variants found for the group, try selecting the first variant directly
    await nextTick();
    if (variantsForGroup.value.length === 0 && data.variants?.length > 0) {
      console.warn('[CarCalculator] No variants found for group, selecting first variant directly');
      selectVariant(data.variants[0]);
    }
  } else {
    console.warn('[CarCalculator] No variant groups found after filtering. Total groups:', data.variantGroups?.length);
    // If no variant groups but we have variants, select the first variant directly
    if (data.variants?.length > 0) {
      console.log('[CarCalculator] Selecting first variant directly (no groups)');
      selectVariant(data.variants[0]);
    }
  }
  
  // Accessories are now fetched server-side automatically via useFetch
  // They will load when modelSlug changes
  console.log('[CarCalculator] Accessories will load automatically');
}, { immediate: true });
const selectVariantGroup = (group: any) => {
  selectedVariantGroup.value = group;
  selectedOptionPack.value = null;
  
  // Find variants for this group
  const variants = variantsForGroup.value;
  if (variants.length > 0) {
    selectVariant(variants[0]);
  }
};

const selectVariant = (variant: any) => {
  selectedVariant.value = variant;
  selectedPrepaidPlan.value = null; // Reset pre-paid plan when variant changes
  
  // Set default colour
  if (variant.colours?.length > 0) {
    const defaultColour = variant.colours.find((c: any) => c.isDefault) || variant.colours[0];
    selectColour(defaultColour);
  }
  
  // Pricing will be fetched automatically via useFetch when variant/colour/trim changes
};

// Variant pricing is now fetched server-side via useFetch above
// It automatically refetches when variant, colour, trim, or postcode changes
const selectColour = (colour: any) => {
  selectedColour.value = colour;
  
  // Set default trim
  if (colour.trims?.length > 0) {
    selectedTrim.value = colour.trims.find((t: any) => t.isDefault) || colour.trims[0];
  }
};

const toggleOptionPack = (pack: any) => {
  if (selectedOptionPack.value?.id === pack.id) {
    selectedOptionPack.value = null;
  } else {
    selectedOptionPack.value = pack;
  }
};

const selectPrepaidPlan = (plan: any) => {
  selectedPrepaidPlan.value = plan;
};

const showPackDetails = (pack: any) => {
  selectedOptionPackDetails.value = pack;
  showOptionPackModal.value = true;
};

const closeOptionPackModal = () => {
  showOptionPackModal.value = false;
  selectedOptionPackDetails.value = null;
};

const togglePriceBreakdown = () => {
  const wasExpanded = showPriceBreakdown.value;
  showPriceBreakdown.value = !showPriceBreakdown.value;
  
  // If expanding and we don't have pricing data yet, fetch it
  // This lazy-loads pricing only when user wants to see the breakdown
  if (showPriceBreakdown.value && !wasExpanded && selectedVariant.value?.id && !variantPricingResponse.value) {
    console.log('[Variant Price] Fetching pricing for breakdown view');
    fetchVariantPricing();
  }
};

const openTestDriveModal = () => {
  showTestDriveModal.value = true;
};

const handleTestDriveSubmit = (formData: any) => {
  console.log('Test drive form submitted:', formData);
  // TODO: Send form data to backend/CRM
  // For now, just log it - you can integrate with your form submission endpoint
};

const scrollToVariants = () => {
  showPriceBreakdown.value = false;
  // Scroll to variant selection section
  if (process.client) {
    const variantSection = document.querySelector('.config-section');
    if (variantSection) {
      variantSection.scrollIntoView({ behavior: 'smooth' });
    }
  }
};

const formatPrice = (price: number) => {
  if (!price && price !== 0) return '0.00';
  return new Intl.NumberFormat('en-AU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(price);
};

const formatServiceInterval = (interval: string | number) => {
  if (!interval) return '';
  const km = parseInt(String(interval), 10);
  if (km >= 1000) {
    return `${(km / 1000).toLocaleString()}km`;
  }
  return `${km}km`;
};

const enquireNow = () => {
  // Open Enquire Modal
  showEnquireModal.value = true;
};

const handleEnquireSubmit = async (formData: any) => {
  try {
    // Build vehicleInfo from the configuration
    const vehicleInfo: any = {
      make: 'Hyundai',
      model: formData.vehicleConfiguration?.model || modelSlug.value,
      variant: formData.vehicleConfiguration?.variant,
      colour: formData.vehicleConfiguration?.colour,
      price: formData.vehicleConfiguration?.totalPrice,
      thumbnail: formData.vehicleConfiguration?.thumbnail,
      condition: 'new',
    };

    // Build accessories cart if there are selected accessories
    let accessoriesCart = undefined;
    if (formData.selectedAccessories && formData.selectedAccessories.length > 0) {
      const items = formData.selectedAccessories.map((acc: any) => ({
        id: acc.id,
        name: acc.name,
        price: acc.price || 0,
        quantity: acc.quantity || 1,
        type: acc.isPack ? 'pack' : 'accessory',
        subtotal: (acc.price || 0) * (acc.quantity || 1),
        image: acc.image,
        thumbnail: acc.thumbnail,
      }));

      accessoriesCart = {
        model: formData.vehicleConfiguration?.model || modelSlug.value,
        items,
        itemCount: items.length,
        total: items.reduce((sum: number, item: any) => sum + item.subtotal, 0),
      };
    }

    // Build the enquiry submission payload
    const enquiryPayload = {
      type: 'vehicle' as const,
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      postcode: formData.postcode,
      source: 'calculator',
      vehicleInfo,
      accessoriesCart,
      // Include applied offers in the vehicle info or as separate field
      appliedOffers: formData.appliedOffers?.map((offer: any) => ({
        offerId: offer.offerId,
        title: offer.title,
        type: offer.type,
        formattedValue: offer.formattedValue,
      })),
      // Include detailed configuration for CRM reference
      vehicleConfiguration: formData.vehicleConfiguration,
    };

    // Submit to API
    const response = await $fetch('/api/submit-enquiry', {
      method: 'POST',
      body: enquiryPayload,
    });

    console.log('✅ [Calculator] Enquiry submitted successfully:', response);
  } catch (error) {
    console.error('❌ [Calculator] Error submitting enquiry:', error);
    // The modal already shows success - in production you might want error handling
  }
};
// Accessories are now fetched server-side via useFetch above
// No need for manual fetchAccessories function

const isAccessorySelected = (accessoryId: string) => {
  return selectedAccessories.value.some((a: any) => a.id === accessoryId && !a.isPack);
};

const isPackSelected = (packId: string) => {
  return selectedAccessories.value.some((a: any) => a.id === packId && a.isPack);
};

const toggleAccessory = (accessory: any) => {
  const index = selectedAccessories.value.findIndex((a: any) => a.id === accessory.id && !a.isPack);
  if (index >= 0) {
    selectedAccessories.value.splice(index, 1);
  } else {
    selectedAccessories.value.push({ ...accessory, isPack: false });
  }
};

const toggleAccessoryPack = (pack: any) => {
  const index = selectedAccessories.value.findIndex((a: any) => a.id === pack.id && a.isPack);
  if (index >= 0) {
    selectedAccessories.value.splice(index, 1);
  } else {
    selectedAccessories.value.push({ ...pack, isPack: true });
  }
};

// Accessory detail modal methods
const openAccessoryDetail = (item: any, isPack = false) => {
  if (!item) {
    console.error('[AccessoryDetail] No item provided');
    return;
  }
  selectedAccessoryDetail.value = { ...item, isPack };
  accessoryDetailQuantity.value = 1;
  showAccessoryDetailModal.value = true;
  // Ensure modal is visible
  if (process.client) {
    document.body.style.overflow = 'hidden';
  }
};

const closeAccessoryDetailModal = () => {
  showAccessoryDetailModal.value = false;
  selectedAccessoryDetail.value = null;
  accessoryDetailQuantity.value = 1;
  // Restore body scroll
  if (process.client) {
    document.body.style.overflow = '';
  }
};

const incrementQuantity = () => {
  accessoryDetailQuantity.value++;
};

const decrementQuantity = () => {
  if (accessoryDetailQuantity.value > 1) {
    accessoryDetailQuantity.value--;
  }
};

const addAccessoryFromDetail = () => {
  if (!selectedAccessoryDetail.value) return;
  
  const item = selectedAccessoryDetail.value;
  // Add to selected accessories (or update quantity if already selected)
  const existingIndex = selectedAccessories.value.findIndex(
    (a: any) => a.id === item.id && a.isPack === item.isPack
  );
  
  if (existingIndex >= 0) {
    // Update quantity
    selectedAccessories.value[existingIndex].quantity = 
      (selectedAccessories.value[existingIndex].quantity || 1) + accessoryDetailQuantity.value;
  } else {
    // Add new
    selectedAccessories.value.push({ 
      ...item, 
      quantity: accessoryDetailQuantity.value 
    });
  }
  
  closeAccessoryDetailModal();
};

// Get included accessories names for a pack
const getPackAccessoriesNames = (pack: any) => {
  if (!pack.includedAccessories || !accessoriesData.value?.accessories) return [];
  return pack.includedAccessories.map((included: any) => {
    const accessory = accessoriesData.value.accessories.find((a: any) => a.id === included.id);
    return {
      name: accessory?.name || 'Accessory',
      citation: included.citation
    };
  }).filter((a: any) => a.name);
};

// Error message computed for display
const errorMessage = computed(() => {
  if (!error.value) return null;
  if (typeof error.value === 'string') return error.value;
  const err = error.value as any;
  if (err?.data?.message) return err.data.message;
  if (err?.message) return err.message;
  return 'Failed to load vehicle data';
});

// Watch powertrain changes
watch(selectedPowertrain, () => {
  // When powertrain changes, select the first variant group for that powertrain
  if (filteredVariantGroups.value.length > 0) {
    selectVariantGroup(filteredVariantGroups.value[0]);
  } else {
    selectedVariantGroup.value = null;
    selectedVariant.value = null;
    selectedColour.value = null;
    selectedTrim.value = null;
  }
});
</script>

<style lang="scss" scoped>

// Variables
$primary-blue: #002c5f;
$accent-blue: #00aad2;
$text-dark: #000;
$text-gray: #666;
$text-light: #999;
$border-color: #e0e0e0;
$bg-light: #f5f5f5;
$bg-white: #fff;

.car-calculator-page {
  min-height: 100vh;
  background: $bg-white;
  // Note: overflow-x: hidden breaks sticky positioning, so we avoid it here
  // Instead, we control overflow at the body level or use max-width constraints
}

// Loading & Error States
.loading-container,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: 2rem;
  text-align: center;
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 3px solid $border-color;
  border-top-color: $primary-blue;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.btn-back {
  display: inline-block;
  margin-top: 1rem;
  padding: 0.75rem 2rem;
  background: $primary-blue;
  color: $bg-white;
  text-decoration: none;
  border-radius: 0;
  font-weight: 500;
  
  &:hover {
    background: color.adjust($primary-blue, $lightness: -10%);
  }
}

// Main Layout - Tesla/Hyundai Style
.calculator-layout {
  display: grid;
  grid-template-columns: 55% 45%;
  min-height: 100vh;
  // Removed overflow-x: hidden as it breaks sticky positioning
  // Using max-width to prevent horizontal scroll instead
  max-width: 100%;
  
  @media (max-width: 1200px) {
    grid-template-columns: 50% 50%;
  }
  
  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
}

// Left Panel - Sticky Image
.left-panel {
  background: $bg-light;
  position: relative;
  
  @media (max-width: 900px) {
    position: relative;
    height: auto;
  }
  
  .sticky-content {
    position: sticky;
    top: 0;
    height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 2rem;
    
    @media (max-width: 900px) {
      position: relative;
      height: auto;
      min-height: 300px;
    }
  }
}

.vehicle-image-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  
  .vehicle-image {
    max-width: 100%;
    max-height: 60vh;
    object-fit: contain;
  }
  
  .vehicle-placeholder {
    width: 100%;
    height: 300px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: $border-color;
    color: $text-gray;
    font-size: 1.5rem;
  }
}

.quick-summary {
  display: flex;
  gap: 2rem;
  padding-top: 1rem;
  border-top: 1px solid $border-color;
  margin-top: 1rem;
  
  @media (max-width: 900px) {
    display: none;
  }
  
  .summary-item {
    .summary-label {
      display: block;
      font-size: 0.75rem;
      color: $text-light;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 0.25rem;
    }
    
    .summary-value {
      font-size: 0.9rem;
      color: $text-dark;
      font-weight: 500;
    }
  }
}

// Right Panel - Scrollable Config
.right-panel {
  background: $bg-white;
  padding-bottom: 120px; // Space for footer
  // Removed overflow properties - let the page scroll naturally
  // This allows the left panel sticky to work properly
}

.config-header {
  padding: 2rem 2.5rem;
  border-bottom: 1px solid $border-color;
  
  .back-link {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    color: $primary-blue;
    text-decoration: none;
    font-size: 0.9rem;
    margin-bottom: 1rem;
    
    .back-arrow {
      font-size: 1.2rem;
    }
    
    &:hover {
      text-decoration: underline;
    }
  }
  
  .model-name {
    font-size: 2.5rem;
    font-weight: 700;
    color: $text-dark;
    margin: 0 0 1.5rem 0;
    letter-spacing: -0.5px;
  }
  
  .powertrain-tabs {
    display: inline-flex;
    border: 2px solid $primary-blue;
    border-radius: 0;
    overflow: hidden;
    
    .powertrain-tab {
      padding: 0.75rem 2rem;
      background: $bg-white;
      border: none;
      color: $primary-blue;
      font-weight: 600;
      font-size: 0.9rem;
      cursor: pointer;
      transition: all 0.2s;
      
      &:not(:last-child) {
        border-right: 2px solid $primary-blue;
      }
      
      &.active {
        background: $primary-blue;
        color: $bg-white;
      }
      
      &:hover:not(.active) {
        background: rgba($primary-blue, 0.05);
      }
    }
  }
}

.config-sections {
  padding: 0 2.5rem;
  // Removed overflow-x: hidden - it breaks sticky positioning of left panel
}

.config-section {
  padding: 2rem 0;
  border-bottom: 1px solid $border-color;
  
  &:last-child {
    border-bottom: none;
  }
  
  .section-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: $text-dark;
    margin: 0 0 1.5rem 0;
    
    .optional-tag {
      font-size: 0.9rem;
      font-weight: 400;
      color: $text-gray;
    }
  }
}

// Variant Grid
.variant-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.variant-card {
  display: grid;
  grid-template-columns: 120px 1fr auto;
  gap: 1rem;
  align-items: center;
  padding: 1rem;
  border: 2px solid $border-color;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    border-color: $primary-blue;
  }
  
  &.selected {
    border-color: $primary-blue;
    background: rgba($primary-blue, 0.02);
  }
  
  .variant-image {
    width: 120px;
    height: 70px;
    
    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
    
    .variant-image-placeholder {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f5f5f5;
      border-radius: 4px;
      color: #999;
      font-size: 24px;
      font-weight: bold;
    }
  }
  
  .variant-details {
    .variant-name {
      font-size: 1rem;
      font-weight: 600;
      color: $text-dark;
      margin: 0 0 0.25rem 0;
    }
    
    .variant-price {
      font-size: 0.9rem;
      color: $text-gray;
      
      sup {
        font-size: 0.6rem;
      }
    }
    
    .smartsense-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      margin-top: 0.5rem;
      font-size: 0.75rem;
      color: $accent-blue;
      font-weight: 500;
      
      .badge-icon {
        font-size: 0.7rem;
      }
    }
  }
  
  .variant-select-indicator {
    width: 24px;
    height: 24px;
    border: 2px solid $border-color;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    
    .check-icon {
      color: $bg-white;
      font-size: 0.8rem;
    }
  }
  
  &.selected .variant-select-indicator {
    background: $primary-blue;
    border-color: $primary-blue;
  }
}

// Features Grid
.features-section {
  background: $bg-light;
  margin: 0 -2.5rem;
  padding: 2rem 2.5rem !important;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem 2rem;
  list-style: none;
  padding: 0;
  margin: 0;
  
  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
  
  .feature-item {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    font-size: 0.9rem;
    color: $text-dark;
    
    .feature-check {
      color: $primary-blue;
      font-weight: bold;
      flex-shrink: 0;
    }
  }
}

// Colour Section
.colour-section {
  .colour-group {
    margin-bottom: 2rem;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    .colour-group-title {
      font-size: 1rem;
      font-weight: 600;
      color: $text-dark;
      margin: 0 0 0.5rem 0;
    }
    
    .colour-note {
      font-size: 0.8rem;
      color: $text-light;
      margin: 0 0 1rem 0;
    }
  }
}

.colour-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 1rem;
}

.colour-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 1rem 0.5rem;
  border: 2px solid transparent;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: $bg-light;
  }
  
  &.selected {
    border-color: $primary-blue;
    background: rgba($primary-blue, 0.02);
  }
  
  &.sold-out {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .colour-swatch {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    overflow: hidden;
    border: 1px solid $border-color;
    margin-bottom: 0.5rem;
    
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }
  
  .colour-name {
    font-size: 0.8rem;
    color: $text-dark;
    font-weight: 500;
    margin-bottom: 0.25rem;
  }
  
  .colour-price {
    font-size: 0.75rem;
    color: $text-gray;
  }
  
  .sold-out-badge {
    font-size: 0.7rem;
    color: #c00;
    margin-top: 0.25rem;
  }
}

// Option Packs Section
.option-packs-section {
  background: $bg-light;
  margin: 0 -2.5rem;
  padding: 2rem 2.5rem !important;
}

.option-packs-grid {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.option-pack-card {
  background: $bg-white;
  border: 2px solid $border-color;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  overflow: hidden;
  
  &:hover {
    border-color: $primary-blue;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }
  
  &.selected {
    border-color: $primary-blue;
    box-shadow: 0 4px 12px rgba($primary-blue, 0.15);
  }
  
  .pack-image {
    width: 100%;
    height: 200px;
    background: linear-gradient(135deg, #f8f8f8 0%, #e8e8e8 100%);
    overflow: hidden;
    
    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  }
  
  .pack-content {
    padding: 1.5rem;
  }
  
  .pack-header {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    margin-bottom: 1rem;
    
    .pack-checkbox {
      width: 24px;
      height: 24px;
      border: 2px solid $border-color;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      margin-top: 2px;
      
      .check-icon {
        color: $bg-white;
        font-size: 0.8rem;
        font-weight: bold;
      }
    }
    
    .pack-title-area {
      flex: 1;
      
      .pack-title {
        font-size: 1.25rem;
        font-weight: 700;
        color: $text-dark;
        margin: 0 0 0.25rem 0;
      }
      
      .pack-engines {
        font-size: 0.8rem;
        color: $text-gray;
        margin: 0;
      }
    }
    
    .pack-price-tag {
      font-size: 1rem;
      font-weight: 700;
      color: $primary-blue;
      flex-shrink: 0;
      white-space: nowrap;
    }
  }
  
  &.selected .pack-checkbox {
    background: $primary-blue;
    border-color: $primary-blue;
  }
  
  .pack-features {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem 1.5rem;
    
    @media (max-width: 600px) {
      grid-template-columns: 1fr;
    }
    
    li {
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
      font-size: 0.85rem;
      color: $text-dark;
      
      .feature-check {
        color: $primary-blue;
        font-weight: bold;
        flex-shrink: 0;
        font-size: 0.8rem;
      }
    }
  }
  
  .pack-view-more {
    display: inline-block;
    margin-top: 1rem;
    padding: 0.5rem 1rem;
    background: transparent;
    border: 1px solid $primary-blue;
    color: $primary-blue;
    font-size: 0.85rem;
    font-weight: 500;
    cursor: pointer;
    border-radius: 4px;
    transition: all 0.2s;
    
    &:hover {
      background: $primary-blue;
      color: $bg-white;
    }
  }
}

// Legacy pack-features for backwards compatibility
.option-pack-card .pack-features-legacy {
  list-style: none;
  padding: 0;
  margin: 0 0 0 2rem;
  
  li {
    font-size: 0.85rem;
    color: $text-gray;
    padding: 0.25rem 0;
    
    &::before {
      content: '•';
      margin-right: 0.5rem;
      color: $text-light;
    }
  }
}

// Engine Options
.engine-grid {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.engine-option {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  border: 2px solid $border-color;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    border-color: $primary-blue;
  }
  
  &.selected {
    border-color: $primary-blue;
    background: rgba($primary-blue, 0.02);
  }
  
  .engine-radio {
    width: 20px;
    height: 20px;
    border: 2px solid $border-color;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    
    .radio-dot {
      width: 10px;
      height: 10px;
      background: $primary-blue;
      border-radius: 50%;
    }
  }
  
  &.selected .engine-radio {
    border-color: $primary-blue;
  }
  
  .engine-details {
    flex: 1;
    
    .engine-type {
      display: block;
      font-weight: 600;
      color: $text-dark;
      font-size: 0.95rem;
    }
    
    .transmission-type {
      display: block;
      font-size: 0.85rem;
      color: $text-gray;
    }
  }
  
  .engine-price {
    font-weight: 600;
    color: $primary-blue;
    font-size: 1rem;
  }
}

// Pre-paid Options
.prepaid-grid {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.prepaid-option {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  border: 2px solid $border-color;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    border-color: $primary-blue;
  }
  
  &.selected {
    border-color: $primary-blue;
    background: rgba($primary-blue, 0.02);
  }
  
  .prepaid-radio {
    width: 20px;
    height: 20px;
    border: 2px solid $border-color;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    
    .radio-dot {
      width: 10px;
      height: 10px;
      background: $primary-blue;
      border-radius: 50%;
    }
  }
  
  &.selected .prepaid-radio {
    border-color: $primary-blue;
  }
  
  .prepaid-details {
    flex: 1;
    
    .prepaid-name {
      display: block;
      font-weight: 600;
      color: $text-dark;
      font-size: 0.95rem;
    }
    
    .prepaid-interval {
      display: block;
      font-size: 0.8rem;
      color: $text-gray;
    }
  }
  
  .prepaid-price {
    font-weight: 600;
    color: $primary-blue;
    font-size: 1rem;
  }
}

// Offers Section
.offers-section {
  background: linear-gradient(135deg, rgba($accent-blue, 0.05) 0%, rgba($accent-blue, 0.02) 100%);
  margin: 0 -2.5rem;
  padding: 2rem 2.5rem !important;
}

.offers-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.offer-card {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.25rem;
  background: $bg-white;
  border: 2px solid $accent-blue;
  border-radius: 4px;
  position: relative;
  
  .offer-type-badge {
    position: absolute;
    top: -10px;
    left: 1rem;
    background: $accent-blue;
    color: $bg-white;
    font-size: 0.7rem;
    font-weight: 600;
    padding: 0.2rem 0.6rem;
    border-radius: 2px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  .offer-content {
    flex: 1;
    padding-top: 0.5rem;
    
    .offer-title {
      font-size: 0.9rem;
      font-weight: 600;
      color: $text-dark;
      margin: 0 0 0.25rem 0;
    }
    
    .offer-value {
      font-size: 1.75rem;
      font-weight: 700;
      color: $primary-blue;
    }
    
    .offer-subtitle {
      font-size: 0.85rem;
      color: $text-gray;
      margin: 0.5rem 0 0 0;
    }
  }
  
  .offer-citation {
    color: $text-gray;
    font-size: 0.8rem;
  }
}

// Disclaimers
.disclaimers-section {
  background: $bg-light;
  margin: 0 -2.5rem;
  padding: 2rem 2.5rem !important;
  
  .disclaimers-title {
    font-size: 0.9rem;
    font-weight: 600;
    color: $text-dark;
    margin: 0 0 1rem 0;
  }
  
  .disclaimer-text {
    font-size: 0.75rem;
    color: $text-gray;
    line-height: 1.6;
    margin: 0 0 0.75rem 0;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    sup {
      color: $primary-blue;
      font-weight: 600;
    }
  }
  
  .price-disclaimer {
    padding-bottom: 1rem;
    margin-bottom: 1rem;
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
    
    :deep(b), :deep(strong) {
      color: $text-dark;
      font-weight: 600;
    }
    
    :deep(p) {
      margin: 0;
    }
  }
}

// Fixed Price Footer
.price-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: $bg-white;
  border-top: 1px solid $border-color;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);
  z-index: 50;
  transition: all 0.3s ease;
  
  &.expanded {
    box-shadow: 0 -8px 40px rgba(0, 0, 0, 0.2);
  }
  
  // Price Breakdown Panel
  .price-breakdown-panel {
    background: $bg-white;
    border-bottom: 1px solid $border-color;
    max-width: 600px;
    margin: 0 auto;
    padding: 1.5rem 2rem;
    animation: slideUp 0.3s ease;
    
    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .breakdown-header {
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid $border-color;
      
      .breakdown-title {
        font-size: 1.5rem;
        font-weight: 700;
        color: $text-dark;
        margin: 0 0 0.25rem 0;
        text-transform: uppercase;
      }
      
      .breakdown-subtitle {
        font-size: 0.9rem;
        color: $text-gray;
        margin: 0 0 0.5rem 0;
      }
      
      .change-vehicle-link {
        background: none;
        border: none;
        color: $primary-blue;
        font-size: 0.85rem;
        font-weight: 500;
        cursor: pointer;
        padding: 0;
        
        &:hover {
          text-decoration: underline;
        }
      }
    }
    
    .breakdown-items {
      .breakdown-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.75rem 0;
        border-bottom: 1px solid color.adjust($border-color, $lightness: 5%);
        
        &:last-of-type {
          border-bottom: none;
        }
        
        .row-label {
          font-size: 0.9rem;
          color: $text-dark;
          
          sup {
            font-size: 0.6rem;
            color: $text-gray;
          }
        }
        
        .row-value {
          font-size: 0.95rem;
          font-weight: 600;
          color: $text-dark;
          
          &.discount {
            color: #e74c3c;
          }
        }
        
        .accessories-row {
          .row-value {
            color: $primary-blue;
          }
        }
        
        .expand-icon {
          display: none;
        }
        
        &.main-row {
          cursor: pointer;
          padding: 1rem 0;
          
          .row-label {
            font-weight: 600;
          }
          
          .row-value {
            font-size: 1.25rem;
            font-weight: 700;
            color: $primary-blue;
          }
          
          .expand-icon {
            display: block;
            font-size: 0.8rem;
            color: $text-gray;
            margin-left: 0.5rem;
          }
        }
        
        &.offer-row {
          background: color.adjust($accent-blue, $lightness: 45%);
          margin: 0.5rem -1rem;
          padding: 0.75rem 1rem;
          border-radius: 4px;
          
          .offer-label {
            color: $accent-blue;
            font-weight: 500;
          }
          
          .offer-value {
            color: $accent-blue;
            font-weight: 700;
          }
        }
      }
      
      .gst-note {
        font-size: 0.75rem;
        color: $text-light;
        margin: 1rem 0 0 0;
        padding-top: 0.75rem;
        border-top: 1px solid $border-color;
      }
    }
  }
  
  .footer-content {
    max-width: 1400px;
    margin: 0 auto;
    padding: 1rem 2rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 2rem;
    
    @media (max-width: 900px) {
      flex-wrap: wrap;
      gap: 1rem;
    }
  }
  
  .footer-vehicle-info {
    flex: 1;
    min-width: 200px;
    
    .footer-model {
      font-size: 1rem;
      font-weight: 700;
      color: $text-dark;
      margin: 0;
    }
    
    .footer-config {
      font-size: 0.85rem;
      color: $text-gray;
      margin: 0.25rem 0 0 0;
      
      .accessories-badge {
        color: $primary-blue;
        font-weight: 500;
      }
    }
  }
  
  .footer-price {
    text-align: center;
    cursor: pointer;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    transition: background 0.2s;
    
    &:hover {
      background: color.adjust($border-color, $lightness: 5%);
    }
    
    .price-label {
      display: block;
      font-size: 0.7rem;
      color: $text-gray;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      
      sup {
        font-size: 0.5rem;
      }
    }
    
    .price-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }
    
    .price-amount {
      font-size: 1.75rem;
      font-weight: 700;
      color: $primary-blue;
    }
    
    .price-expand-icon {
      color: $text-gray;
      transition: transform 0.3s ease;
      
      &.rotated {
        transform: rotate(180deg);
      }
    }
    
    .offer-badge {
      background: $accent-blue;
      color: $bg-white;
      font-size: 0.65rem;
      font-weight: 600;
      padding: 0.25rem 0.5rem;
      border-radius: 2px;
      text-transform: uppercase;
      white-space: nowrap;
    }
  }
  
  .footer-actions {
    display: flex;
    gap: 0.75rem;
    
    @media (max-width: 600px) {
      width: 100%;
      
      button {
        flex: 1;
      }
    }
    
    .btn-secondary {
      padding: 0.875rem 1.5rem;
      background: $bg-white;
      border: 2px solid $primary-blue;
      color: $primary-blue;
      font-weight: 600;
      font-size: 0.9rem;
      cursor: pointer;
      transition: all 0.2s;
      
      &:hover {
        background: rgba($primary-blue, 0.05);
      }
    }
    
    .btn-primary {
      padding: 0.875rem 2rem;
      background: $primary-blue;
      border: 2px solid $primary-blue;
      color: $bg-white;
      font-weight: 600;
      font-size: 0.9rem;
      cursor: pointer;
      transition: all 0.2s;
      
      &:hover {
        background: color.adjust($primary-blue, $lightness: -10%);
        border-color: color.adjust($primary-blue, $lightness: -10%);
      }
    }
  }
}

// Accessories Section
.accessories-section {
  .accessories-loading {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 2rem;
    background: $bg-light;
    border-radius: 4px;
    
    .loading-spinner-small {
      width: 24px;
      height: 24px;
      border: 2px solid $border-color;
      border-top-color: $primary-blue;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    
    p {
      margin: 0;
      color: $text-gray;
    }
  }
  
  .accessories-empty {
    padding: 2rem;
    background: $bg-light;
    border-radius: 4px;
    text-align: center;
    
    p {
      margin: 0 0 1rem 0;
      color: $text-gray;
    }
    
    .accessories-link {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      color: $primary-blue;
      font-weight: 500;
      text-decoration: none;
      
      &:hover {
        text-decoration: underline;
      }
    }
  }
  
  .benefits-link {
    background: none;
    border: none;
    color: $primary-blue;
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    padding: 0;
    margin-bottom: 1.5rem;
    display: flex;
    align-items: center;
    gap: 0.25rem;
    
    &:hover {
      text-decoration: underline;
    }
    
    .arrow {
      font-size: 0.8rem;
    }
  }
  
  .accessories-summary {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    
    .accessories-subtitle {
      font-size: 1.1rem;
      font-weight: 700;
      color: $text-dark;
      margin: 0;
    }
    
    .selected-count {
      font-size: 0.9rem;
      color: $text-gray;
      margin: 0;
    }
  }
  
  .accessories-grid,
  .accessory-packs-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
    margin-bottom: 1.5rem;
    
    @media (max-width: 600px) {
      grid-template-columns: 1fr;
    }
  }
  
  .accessory-card,
  .accessory-pack-card {
    border: 1px solid $border-color;
    border-radius: 4px;
    overflow: hidden;
    cursor: pointer;
    transition: all 0.2s;
    background: $bg-white;
    position: relative;
    
    &:hover {
      border-color: $primary-blue;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    
    &.selected {
      border-color: $primary-blue;
      background: rgba($primary-blue, 0.02);
    }
    
    // Selection tick indicator
    .selection-tick {
      position: absolute;
      top: 10px;
      right: 10px;
      width: 28px;
      height: 28px;
      background: $primary-blue;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
      animation: tickPop 0.2s ease-out;
      
      .tick-icon {
        color: white;
        font-size: 16px;
        font-weight: bold;
        line-height: 1;
      }
    }
    
    @keyframes tickPop {
      0% {
        transform: scale(0);
        opacity: 0;
      }
      50% {
        transform: scale(1.2);
      }
      100% {
        transform: scale(1);
        opacity: 1;
      }
    }
    
    .accessory-image,
    .pack-image {
      height: 140px;
      background: $bg-light;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      
      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      
      .accessory-placeholder {
        width: 60px;
        height: 60px;
        background: $border-color;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.5rem;
        color: $text-gray;
      }
    }
    
    .accessory-info,
    .pack-info {
      padding: 1rem;
      
      .accessory-name,
      .pack-name {
        font-size: 0.95rem;
        font-weight: 600;
        color: $text-dark;
        margin: 0 0 0.25rem 0;
        line-height: 1.3;
      }
      
      .accessory-category,
      .pack-category {
        font-size: 0.8rem;
        color: $text-gray;
        display: block;
        margin-bottom: 0.75rem;
      }
      
      .accessory-footer,
      .pack-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .learn-more-link {
        background: none;
        border: none;
        color: $primary-blue;
        font-size: 0.85rem;
        font-weight: 500;
        cursor: pointer;
        padding: 0;
        
        &:hover {
          text-decoration: underline;
        }
      }
      
      .accessory-price,
      .pack-price {
        font-size: 0.95rem;
        font-weight: 600;
        color: $text-dark;
      }
      
      .pack-savings {
        margin-top: 0.5rem;
        font-size: 0.8rem;
        color: #27ae60;
        font-weight: 500;
      }
    }
  }
  
  .view-all-accessories-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    width: 100%;
    padding: 1rem;
    background: $bg-white;
    border: 2px solid $primary-blue;
    color: $primary-blue;
    font-size: 0.95rem;
    font-weight: 600;
    cursor: pointer;
    border-radius: 4px;
    transition: all 0.2s;
    
    &:hover {
      background: $primary-blue;
      color: $bg-white;
    }
    
    .arrow {
      font-size: 0.9rem;
    }
  }
}

// Modal Styles
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  overflow-y: auto;
}

.accessories-modal {
  background: $bg-white;
  width: 100%;
  max-width: 1200px;
  max-height: 90vh;
  overflow-y: auto;
  border-radius: 4px;
  position: relative;
  
  .modal-close {
    position: absolute;
    top: 1rem;
    right: 1rem;
    width: 40px;
    height: 40px;
    background: none;
    border: none;
    font-size: 2rem;
    color: $text-dark;
    cursor: pointer;
    z-index: 10;
    
    &:hover {
      color: $primary-blue;
    }
  }
  
  .modal-title {
    font-size: 2rem;
    font-weight: 700;
    color: $primary-blue;
    text-align: center;
    margin: 2rem 0 0.5rem 0;
  }
  
  .modal-subtitle {
    font-size: 1rem;
    color: $text-gray;
    text-align: center;
    margin: 0 0 2rem 0;
  }
  
  .accessory-tabs {
    display: flex;
    justify-content: center;
    gap: 0;
    border-bottom: 1px solid $border-color;
    padding: 0 2rem;
    overflow-x: auto;
    
    .tab-btn {
      background: none;
      border: none;
      padding: 1rem 1.5rem;
      font-size: 0.95rem;
      color: $text-gray;
      cursor: pointer;
      border-bottom: 3px solid transparent;
      transition: all 0.2s;
      white-space: nowrap;
      
      &:hover {
        color: $primary-blue;
      }
      
      &.active {
        color: $primary-blue;
        border-bottom-color: $primary-blue;
        font-weight: 600;
      }
    }
  }
  
  .accessory-filter-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 2rem;
    border-bottom: 1px solid $border-color;
    flex-wrap: wrap;
    gap: 1rem;
    
    .selected-text {
      font-size: 0.9rem;
      color: $text-dark;
      font-weight: 500;
    }
    
    .filter-options {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.9rem;
      color: $text-gray;
      
      .filter-btn {
        background: #f5f5f5;
        border: 1px solid $border-color;
        color: $text-gray;
        cursor: pointer;
        padding: 0.4rem 1rem;
        border-radius: 4px;
        font-size: 0.85rem;
        transition: all 0.2s ease;
        
        &:hover {
          background: #e8e8e8;
        }
        
        &.active {
          background: $primary-blue;
          border-color: $primary-blue;
          color: white;
          font-weight: 500;
        }
      }
      
      .divider {
        display: none;
      }
    }
    
    .sort-options {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.9rem;
      color: $text-gray;
      
      .sort-select {
        border: 1px solid $border-color;
        padding: 0.5rem 1rem;
        font-size: 0.85rem;
        border-radius: 4px;
        cursor: pointer;
      }
    }
  }
  
  .modal-accessories-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 1.5rem;
    padding: 2rem;
    
    .modal-accessory-card {
      border: 1px solid $border-color;
      border-radius: 4px;
      overflow: hidden;
      cursor: pointer;
      transition: all 0.2s;
      background: $bg-white;
      position: relative;
      
      &:hover {
        border-color: $primary-blue;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }
      
      &.selected {
        border-color: $primary-blue;
        
        .card-checkbox {
          background: $primary-blue;
          border-color: $primary-blue;
          
          .check {
            color: $bg-white;
          }
        }
      }
      
      .card-checkbox {
        position: absolute;
        top: 0.75rem;
        left: 0.75rem;
        width: 24px;
        height: 24px;
        border: 2px solid $border-color;
        border-radius: 4px;
        background: $bg-white;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 5;
        
        .check {
          font-size: 0.8rem;
          font-weight: bold;
        }
      }
      
      .card-image {
        height: 160px;
        background: $bg-light;
        display: flex;
        align-items: center;
        justify-content: center;
        
        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
      }
      
      .card-content {
        padding: 1rem;
        
        .card-name {
          font-size: 0.9rem;
          font-weight: 600;
          color: $text-dark;
          margin: 0 0 0.25rem 0;
          line-height: 1.3;
        }
        
        .card-category {
          font-size: 0.75rem;
          color: $text-gray;
          display: block;
          margin-bottom: 0.75rem;
        }
        
        .card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          
          .learn-more-link {
            background: none;
            border: none;
            color: $primary-blue;
            font-size: 0.8rem;
            font-weight: 500;
            cursor: pointer;
            padding: 0;
          }
          
          .card-price {
            font-size: 0.9rem;
            font-weight: 600;
            color: $text-dark;
          }
        }
      }
    }
  }
}

.benefits-modal {
  background: $bg-white;
  width: 100%;
  max-width: 800px;
  border-radius: 4px;
  position: relative;
  overflow: hidden;
  
  .modal-close {
    position: absolute;
    top: 1rem;
    right: 1rem;
    width: 40px;
    height: 40px;
    background: none;
    border: none;
    font-size: 2rem;
    color: $text-dark;
    cursor: pointer;
    z-index: 10;
    
    &:hover {
      color: $primary-blue;
    }
  }
  
  .benefits-content {
    display: grid;
    grid-template-columns: 1fr 1fr;
    
    @media (max-width: 600px) {
      grid-template-columns: 1fr;
    }
    
    .benefits-image {
      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }
    
    .benefits-text {
      padding: 3rem;
      display: flex;
      flex-direction: column;
      justify-content: center;
      
      h2 {
        font-size: 1.75rem;
        font-weight: 700;
        color: $primary-blue;
        margin: 0 0 1rem 0;
      }
      
      p {
        font-size: 1rem;
        color: $text-dark;
        line-height: 1.6;
        margin: 0;
      }
    }
  }
}

// Option Pack Details Modal
.option-pack-modal {
  background: $bg-white;
  width: 100%;
  max-width: 700px;
  max-height: 90vh;
  border-radius: 8px;
  position: relative;
  overflow-y: auto;
  
  .modal-close {
    position: absolute;
    top: 1rem;
    right: 1rem;
    width: 40px;
    height: 40px;
    background: none;
    border: none;
    font-size: 2rem;
    color: $text-dark;
    cursor: pointer;
    z-index: 10;
    
    &:hover {
      color: $primary-blue;
    }
  }
  
  .option-pack-modal-content {
    .pack-modal-image {
      width: 100%;
      background: #f5f5f5;
      
      img {
        width: 100%;
        height: auto;
        max-height: 300px;
        object-fit: contain;
        display: block;
      }
    }
    
    .pack-modal-info {
      padding: 2rem;
      
      .pack-modal-title {
        font-size: 1.5rem;
        font-weight: 700;
        color: $primary-blue;
        margin: 0 0 0.5rem 0;
      }
      
      .pack-modal-engines {
        font-size: 0.9rem;
        color: $text-light;
        margin: 0 0 1rem 0;
      }
      
      .pack-modal-price {
        font-size: 1.25rem;
        font-weight: 700;
        color: $primary-blue;
        margin-bottom: 1rem;
      }
      
      .pack-modal-description {
        font-size: 0.95rem;
        color: $text-dark;
        line-height: 1.6;
        margin-bottom: 1.5rem;
      }
      
      .pack-modal-features {
        h3 {
          font-size: 1rem;
          font-weight: 600;
          color: $text-dark;
          margin: 0 0 1rem 0;
        }
        
        .features-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
          
          @media (max-width: 500px) {
            grid-template-columns: 1fr;
          }
          
          li {
            display: flex;
            align-items: flex-start;
            gap: 0.5rem;
            font-size: 0.9rem;
            color: $text-dark;
            
            .feature-check {
              color: $primary-blue;
              font-weight: 700;
              flex-shrink: 0;
            }
          }
        }
      }
    }
  }
}

// Accessory Detail Modal
.accessory-detail-modal {
  background: $bg-white;
  width: 100%;
  max-width: 1000px;
  max-height: 90vh;
  border-radius: 4px;
  position: relative;
  overflow-y: auto;
  
  .modal-close {
    position: absolute;
    top: 1rem;
    right: 1rem;
    width: 40px;
    height: 40px;
    background: none;
    border: none;
    font-size: 2rem;
    color: $text-dark;
    cursor: pointer;
    z-index: 10;
    
    &:hover {
      color: $primary-blue;
    }
  }
  
  .detail-modal-content {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0;
    
    @media (max-width: 768px) {
      grid-template-columns: 1fr;
    }
  }
  
  .detail-images {
    padding: 2rem;
    background: #f8f8f8;
    
    .main-image {
      width: 100%;
      aspect-ratio: 4/3;
      display: flex;
      align-items: center;
      justify-content: center;
      
      img {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
      }
    }
    
    .image-thumbnails {
      display: flex;
      gap: 0.5rem;
      margin-top: 1rem;
      
      .thumb {
        width: 80px;
        height: 60px;
        object-fit: cover;
        border: 2px solid transparent;
        cursor: pointer;
        
        &.active, &:hover {
          border-color: $primary-blue;
        }
      }
    }
  }
  
  .detail-info {
    padding: 2rem;
    
    .detail-category {
      font-size: 0.875rem;
      color: $text-light;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .detail-name {
      font-size: 2rem;
      font-weight: 700;
      color: $text-dark;
      margin: 0.5rem 0 1rem 0;
    }
    
    .detail-price {
      font-size: 2rem;
      font-weight: 700;
      color: $text-dark;
    }
    
    .price-note {
      font-size: 0.875rem;
      color: $text-light;
      margin: 0.25rem 0 0.5rem 0;
    }
    
    .detail-savings {
      color: #e67300;
      font-weight: 600;
      margin-bottom: 1.5rem;
    }
    
    .quantity-selector {
      display: flex;
      align-items: center;
      gap: 0;
      margin: 1.5rem 0;
      
      .qty-btn {
        width: 44px;
        height: 44px;
        border: 1px solid #ddd;
        background: $bg-white;
        font-size: 1.25rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        
        &:hover:not(:disabled) {
          background: #f5f5f5;
        }
        
        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        &:first-child {
          border-radius: 4px 0 0 4px;
        }
      }
      
      .qty-value {
        width: 50px;
        height: 44px;
        border-top: 1px solid #ddd;
        border-bottom: 1px solid #ddd;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1rem;
        font-weight: 500;
      }
      
      .add-to-quote-btn {
        flex: 1;
        height: 44px;
        background: $primary-blue;
        color: white;
        border: none;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        margin-left: 1rem;
        border-radius: 4px;
        
        &:hover {
          background: color.adjust($primary-blue, $lightness: -10%);
        }
      }
    }
    
    .detail-description {
      font-size: 1rem;
      color: $text-dark;
      line-height: 1.6;
      margin: 1.5rem 0;
    }
    
    .pack-contents {
      margin: 1.5rem 0;
      
      h3 {
        font-size: 1.125rem;
        font-weight: 700;
        color: $text-dark;
        margin: 0 0 0.75rem 0;
      }
      
      ul {
        margin: 0;
        padding-left: 1.25rem;
        
        li {
          font-size: 0.9375rem;
          color: $text-dark;
          margin-bottom: 0.5rem;
          
          sup {
            color: $text-light;
            font-size: 0.75rem;
          }
        }
      }
    }
    
    .detail-part-number {
      font-size: 0.9375rem;
      color: $text-dark;
      margin: 1.5rem 0;
      
      .label {
        color: $text-light;
      }
    }
    
    .detail-disclaimer {
      margin: 1.5rem 0;
      padding: 1rem;
      background: #f8f8f8;
      border-radius: 4px;
      
      h4 {
        font-size: 0.875rem;
        font-weight: 700;
        color: $text-dark;
        margin: 0 0 0.5rem 0;
      }
      
      p {
        font-size: 0.8125rem;
        color: $text-light;
        line-height: 1.5;
        margin: 0;
        white-space: pre-line;
      }
    }
    
    .general-disclaimer,
    .savings-disclaimer {
      font-size: 0.75rem;
      color: $text-light;
      line-height: 1.5;
      margin: 1rem 0 0 0;
    }
  }
}

// Mobile Responsive
@media (max-width: 900px) {
  .calculator-layout {
    display: block;
  }
  
  .left-panel {
    .sticky-content {
      padding: 1rem;
    }
  }
  
  .config-header {
    padding: 1.5rem;
    
    .model-name {
      font-size: 2rem;
    }
  }
  
  .config-sections {
    padding: 0 1.5rem;
  }
  
  .features-section,
  .offers-section,
  .disclaimers-section,
  .accessories-section {
    margin: 0 -1.5rem;
    padding: 1.5rem !important;
  }
  
  .variant-card {
    grid-template-columns: 80px 1fr auto;
    
    .variant-image {
      width: 80px;
      height: 50px;
    }
  }
  
  .colour-grid {
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  }
  
  .modal-overlay {
    padding: 0;
  }
  
  .accessories-modal {
    max-height: 100vh;
    border-radius: 0;
    
    .modal-accessories-grid {
      grid-template-columns: repeat(2, 1fr);
      padding: 1rem;
      gap: 1rem;
    }
  }
}
</style>




