<template>
  <div v-if="pending" class="flex items-center justify-center py-16 text-muted-foreground">
    <RefreshCcw class="mr-2 h-5 w-5 animate-spin" />
    Loading enquiry details…
  </div>
  
  <div v-else-if="error" class="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
    <p class="flex items-center gap-2 text-destructive">
      <AlertTriangle class="h-4 w-4" />
      We couldn't load this enquiry. Please try again.
    </p>
    <Button variant="outline" size="sm" class="mt-4" @click="refresh">
      Retry
    </Button>
  </div>
  
  <div v-else-if="enquiry" class="enquiry-detail space-y-6">
    <!-- Header -->
    <Card class="shadow-sm">
      <CardContent class="space-y-4 p-6">
        <AdminPageHeader
          :title="`${enquiry.firstName} ${enquiry.lastName}`"
          :description="`Submitted ${formatDate(enquiry.createdAt)}${submittedRelative ? ` · ${submittedRelative} ago` : ''}`"
          :eyebrow="`Enquiry · ${shortId}`"
        >
          <div class="mt-3 flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{{ formatType(enquiry.type) }}</Badge>
            <Badge v-if="enquiry.department" variant="outline">{{ enquiry.department }}</Badge>
            <NuxtLink to="/admin/enquiries" class="ml-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              <ChevronLeft class="h-3.5 w-3.5" /> Back to enquiries
            </NuxtLink>
          </div>
          <template #actions>
          <div class="enquiry-detail__header-actions flex flex-wrap items-center gap-3">
            <Select :model-value="statusDraft" @update:model-value="onStatusSelect">
              <SelectTrigger class="w-[200px]">
                <SelectValue placeholder="Set status" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup v-for="stage in PIPELINE_STAGES" :key="stage.key">
                  <SelectLabel class="text-xs text-muted-foreground">{{ stage.label }}</SelectLabel>
                  <SelectItem
                    v-for="cfg in getStatusesByStage(stage.key)"
                    :key="cfg.key"
                    :value="cfg.key"
                  >
                    {{ cfg.label }}
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" @click="refresh">
              <RefreshCcw class="mr-2 h-4 w-4" /> Refresh
            </Button>
          </div>
          </template>
        </AdminPageHeader>

        <!-- Lost-reason capture -->
        <div v-if="showLostPanel" class="mt-3 rounded-md border border-red-200 bg-red-50 p-4 dark:border-red-900/40 dark:bg-red-900/10">
          <p class="mb-2 text-sm font-medium text-red-800 dark:text-red-300">Why was this lead lost?</p>
          <div class="flex flex-wrap items-end gap-3">
            <div class="min-w-[220px]">
              <Label class="text-xs">Reason</Label>
              <Select v-model="lostReasonDraft">
                <SelectTrigger class="w-[220px]">
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="(label, key) in LOST_REASON_LABELS" :key="key" :value="key">
                    {{ label }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div class="min-w-[240px] flex-1">
              <Label class="text-xs">Notes (optional)</Label>
              <Input v-model="lostNotesDraft" placeholder="Any context…" />
            </div>
            <div class="flex gap-2">
              <Button size="sm" :disabled="!lostReasonDraft || statusUpdating" @click="applyLostStatus">Mark as lost</Button>
              <Button size="sm" variant="ghost" :disabled="statusUpdating" @click="cancelLost">Cancel</Button>
            </div>
          </div>
        </div>

        <div class="flex flex-wrap gap-2">
          <Button v-if="enquiry.email" variant="secondary" size="sm" as-child>
            <a :href="`mailto:${enquiry.email}`"><Mail class="mr-2 h-4 w-4" /> Email customer</a>
          </Button>
          <Button v-if="enquiry.phone" variant="outline" size="sm" as-child>
            <a :href="`tel:${enquiry.phone}`"><Phone class="mr-2 h-4 w-4" /> Call {{ enquiry.firstName }}</a>
          </Button>
          <Button variant="ghost" size="sm" @click="copyValue(enquiry.id, 'Enquiry ID')">
            <Copy class="mr-2 h-4 w-4" /> Copy ID
          </Button>
          <Badge v-if="enquiry.snoozedUntil && isFuture(enquiry.snoozedUntil)" class="gap-1 bg-amber-100 text-amber-900">
            <Clock class="h-3 w-3" /> Snoozed until {{ formatDate(enquiry.snoozedUntil) }}
          </Badge>
        </div>
      </CardContent>
    </Card>

    <!-- Main grid -->
    <div class="grid gap-6 lg:grid-cols-3">
      <!-- Left column -->
      <div class="space-y-6 lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Customer overview</CardTitle>
            <CardDescription>Key details to personalize your follow up.</CardDescription>
          </CardHeader>
          <CardContent>
            <dl class="grid gap-4 sm:grid-cols-2">
              <div>
                <dt class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Email</dt>
                <dd class="mt-1 flex items-center gap-2 text-sm">
                  <a v-if="enquiry.email" :href="`mailto:${enquiry.email}`" class="text-primary hover:underline">
                    {{ enquiry.email }}
                  </a>
                  <span v-else class="text-muted-foreground">Not provided</span>
                  <Button
                    v-if="enquiry.email"
                    variant="ghost"
                    size="icon"
                    class="h-6 w-6"
                    @click="copyValue(enquiry.email, 'Email')"
                  >
                    <Copy class="h-3 w-3" />
                  </Button>
                </dd>
              </div>
              <div>
                <dt class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Phone</dt>
                <dd class="mt-1 flex items-center gap-2 text-sm">
                  <a v-if="enquiry.phone" :href="`tel:${enquiry.phone}`" class="text-primary hover:underline">
                    {{ enquiry.phone }}
                  </a>
                  <span v-else class="text-muted-foreground">Not provided</span>
                </dd>
              </div>
              <div>
                <dt class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Location</dt>
                <dd class="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin class="h-4 w-4" />
                  <span>
                    <span v-if="enquiry.suburb">{{ enquiry.suburb }}</span>
                    <span v-if="enquiry.state">{{ enquiry.suburb ? ', ' : '' }}{{ enquiry.state }}</span>
                    <span v-if="enquiry.postcode"> {{ enquiry.postcode }}</span>
                    <span v-if="!enquiry.suburb && !enquiry.state && !enquiry.postcode">Not provided</span>
                  </span>
                </dd>
              </div>
              <div>
                <dt class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Source URL</dt>
                <dd class="mt-1 flex items-center gap-2 text-sm">
                  <a
                    v-if="enquiry.source"
                    :href="enquiry.source"
                    target="_blank"
                    rel="noopener"
                    class="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    <Globe class="h-4 w-4" />
                    {{ sourceDomain || 'View page' }}
                    <ExternalLink class="h-3.5 w-3.5" />
                  </a>
                  <span v-else class="text-muted-foreground">Not captured</span>
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Enquiry details</CardTitle>
            <CardDescription>Context around the customer's request.</CardDescription>
          </CardHeader>
          <CardContent class="space-y-6">
            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <dt class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Status</dt>
                <dd class="mt-1">
                  <Badge :variant="statusBadgeVariant(enquiry.status)">
                    {{ formatStatus(enquiry.status) }}
                  </Badge>
                </dd>
              </div>
              <div>
                <dt class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Priority</dt>
                <dd class="mt-1 text-sm capitalize">{{ enquiry.priority }}</dd>
              </div>
              <div>
                <dt class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Assigned to</dt>
                <dd class="mt-1 text-sm text-muted-foreground">
                  <span v-if="enquiry.assignedUser">
                    {{ enquiry.assignedUser.firstName }} {{ enquiry.assignedUser.lastName }}
                  </span>
                  <span v-else class="italic">Unassigned</span>
                </dd>
              </div>
              <div>
                <dt class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Preferred contact</dt>
                <dd class="mt-1 text-sm text-muted-foreground">
                  {{ enquiry.preferredContactMethod || 'Not specified' }}
                </dd>
              </div>
            </div>
            <div>
              <dt class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Customer message</dt>
              <dd class="mt-2 whitespace-pre-line rounded-lg bg-muted/50 p-4 text-sm">
                {{ enquiry.message || 'This customer did not leave a message.' }}
              </dd>
            </div>
          </CardContent>
        </Card>

        <Card v-if="hasVehicleInterest">
          <CardHeader>
            <CardTitle>Vehicle & interest</CardTitle>
            <CardDescription>Everything the customer shared about their vehicle journey.</CardDescription>
          </CardHeader>
          <CardContent class="space-y-6">
            <div v-if="vehicleFields.length" class="space-y-3">
              <h4 class="text-sm font-semibold">Vehicle of interest</h4>
              <!-- Vehicle thumbnail and name prominently displayed -->
              <div v-if="vehicleThumbnail || vehicleName" class="flex gap-4 rounded-lg border bg-muted/30 p-4">
                <div v-if="vehicleThumbnail" class="flex-shrink-0">
                  <NuxtImg
                    :src="vehicleThumbnail"
                    :alt="vehicleName || 'Vehicle'"
                    class="h-24 w-32 rounded-lg object-cover shadow-sm sm:h-32 sm:w-44"
                    width="176"
                    height="128"
                    format="webp"
                    quality="80"
                  />
                </div>
                <div class="flex flex-1 flex-col justify-center">
                  <p v-if="vehicleName" class="text-lg font-semibold text-foreground">{{ vehicleName }}</p>
                  <p v-if="vehiclePrice" class="mt-1 text-xl font-bold text-primary">{{ vehiclePrice }}</p>
                  <div v-if="vehicleCondition || vehicleStockId" class="mt-2 flex flex-wrap gap-2">
                    <Badge v-if="vehicleCondition" variant="secondary">{{ vehicleCondition }}</Badge>
                    <Badge v-if="vehicleStockId" variant="outline">Stock #{{ vehicleStockId }}</Badge>
                  </div>
                  <!-- View vehicle link -->
                  <div v-if="vehicleUrl" class="mt-3">
                    <a
                      :href="vehicleUrl"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                    >
                      <ExternalLink class="h-4 w-4" />
                      View vehicle listing
                    </a>
                  </div>
                </div>
              </div>
              <!-- Other vehicle details in grid -->
              <div class="grid gap-4 sm:grid-cols-2">
                <div v-for="item in vehicleFieldsFiltered" :key="item.label">
                  <dt class="text-xs font-medium uppercase tracking-wide text-muted-foreground">{{ item.label }}</dt>
                  <dd class="mt-1 text-sm">{{ item.value }}</dd>
                </div>
              </div>
            </div>
            <!-- Vehicle Configuration (from calculator/builder) -->
            <div v-if="vehicleConfiguration" class="space-y-3">
              <Separator />
              <h4 class="text-sm font-semibold">Selected Configuration</h4>
              <div class="grid gap-4 sm:grid-cols-2">
                <div v-if="vehicleConfiguration.optionPack">
                  <dt class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Option Pack</dt>
                  <dd class="mt-1 text-sm">
                    {{ vehicleConfiguration.optionPack }}
                    <span v-if="vehicleConfiguration.optionPackPrice" class="text-muted-foreground">
                      (+{{ formatCurrency(vehicleConfiguration.optionPackPrice) }})
                    </span>
                    <ul
                      v-if="optionPackFeatures.length"
                      class="mt-2 grid gap-1 text-xs text-muted-foreground sm:grid-cols-2"
                    >
                      <li v-for="feature in optionPackFeatures" :key="feature" class="flex gap-1.5">
                        <span class="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary/60"></span>
                        <span>{{ feature }}</span>
                      </li>
                    </ul>
                  </dd>
                </div>
                <div v-if="vehicleConfiguration.trim">
                  <dt class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Interior Trim</dt>
                  <dd class="mt-1 text-sm">
                    {{ vehicleConfiguration.trim }}
                    <span v-if="vehicleConfiguration.trimPrice" class="text-muted-foreground">
                      (+{{ formatCurrency(vehicleConfiguration.trimPrice) }})
                    </span>
                  </dd>
                </div>
                <div v-if="vehicleConfiguration.prepaidService">
                  <dt class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Prepaid Service</dt>
                  <dd class="mt-1 text-sm">
                    {{ vehicleConfiguration.prepaidService }}
                    <span v-if="vehicleConfiguration.prepaidServicePrice" class="text-muted-foreground">
                      (+{{ formatCurrency(vehicleConfiguration.prepaidServicePrice) }})
                    </span>
                  </dd>
                </div>
                <div v-if="vehicleConfiguration.totalPrice && vehicleConfiguration.totalPrice !== vehicleConfiguration.basePrice">
                  <dt class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Total Configured Price</dt>
                  <dd class="mt-1 text-sm font-semibold text-primary">
                    {{ formatCurrency(vehicleConfiguration.totalPrice) }}
                  </dd>
                </div>
              </div>
            </div>

            <!-- Applied Offers -->
            <div v-if="appliedOffers.length" class="space-y-3">
              <Separator />
              <h4 class="text-sm font-semibold">Active Offers</h4>
              <div class="space-y-2">
                <div
                  v-for="offer in appliedOffers"
                  :key="offer.offerId"
                  class="flex items-center justify-between rounded-lg border bg-gradient-to-r from-sky-50 to-sky-100/50 p-3"
                >
                  <div>
                    <p class="font-medium text-foreground">{{ offer.title }}</p>
                    <p v-if="offer.type" class="text-xs text-muted-foreground capitalize">{{ offer.type.replace(/_/g, ' ') }}</p>
                  </div>
                  <Badge v-if="offer.formattedValue" variant="secondary" class="bg-sky-600 text-white">
                    {{ offer.formattedValue }}
                  </Badge>
                </div>
              </div>
            </div>

            <div v-if="tradeInFields.length" class="space-y-3">
              <Separator />
              <h4 class="text-sm font-semibold">Trade-in vehicle</h4>
              <div class="grid gap-4 sm:grid-cols-2">
                <div v-for="item in tradeInFields" :key="item.label">
                  <dt class="text-xs font-medium uppercase tracking-wide text-muted-foreground">{{ item.label }}</dt>
                  <dd class="mt-1 text-sm">{{ item.value }}</dd>
                </div>
              </div>
            </div>
            <div v-if="financeFields.length" class="space-y-3">
              <Separator />
              <h4 class="text-sm font-semibold">Finance preferences</h4>
              <div class="grid gap-4 sm:grid-cols-2">
                <div v-for="item in financeFields" :key="item.label">
                  <dt class="text-xs font-medium uppercase tracking-wide text-muted-foreground">{{ item.label }}</dt>
                  <dd class="mt-1 text-sm">{{ item.value }}</dd>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Sell My Car Section -->
        <Card v-if="sellCarDetails">
          <CardHeader class="pb-4">
            <CardTitle class="flex items-center gap-2">
              <Car class="h-5 w-5" />
              Vehicle for sale
            </CardTitle>
            <CardDescription>Details of the vehicle the customer wants to sell.</CardDescription>
          </CardHeader>
          <CardContent class="space-y-6">
            <!-- Vehicle Summary Header -->
            <div class="rounded-lg border bg-gradient-to-r from-muted/50 to-muted/30 p-4">
              <h3 class="text-xl font-bold text-foreground">
                {{ sellCarDetails.year }} {{ sellCarDetails.make }} {{ sellCarDetails.model }}
                <span v-if="sellCarDetails.grade" class="font-normal text-muted-foreground">{{ sellCarDetails.grade }}</span>
              </h3>
              <div class="mt-3 flex flex-wrap items-center gap-2">
                <Badge variant="secondary" class="text-sm">{{ sellCarDetails.rego }}</Badge>
                <Badge variant="outline" class="text-sm">{{ formatNumber(sellCarDetails.odometer) }} km</Badge>
                <Badge :variant="conditionBadgeVariant(sellCarDetails.condition)" class="text-sm">
                  {{ formatCondition(sellCarDetails.condition) }} condition
                </Badge>
              </div>
            </div>

            <!-- Vehicle Photos Gallery -->
            <div v-if="sellCarPhotos.length" class="space-y-3">
              <Separator />
              <h4 class="text-sm font-semibold flex items-center gap-2">
                <ImageIcon class="h-4 w-4" />
                Vehicle Photos ({{ sellCarPhotos.length }})
              </h4>
              <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                <button
                  v-for="(photo, index) in sellCarPhotos"
                  :key="index"
                  type="button"
                  class="group relative aspect-[4/3] overflow-hidden rounded-lg border bg-muted/30 transition-all hover:ring-2 hover:ring-primary focus:outline-none focus:ring-2 focus:ring-primary"
                  @click="openPhotoLightbox(index)"
                >
                  <NuxtImg
                    :src="photo"
                    :alt="`Vehicle photo ${index + 1}`"
                    class="absolute inset-0 h-full w-full object-cover transition-transform group-hover:scale-105"
                    loading="lazy"
                    width="200"
                    height="150"
                    format="webp"
                    quality="80"
                  />
                  <div class="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/30">
                    <ZoomIn class="h-6 w-6 text-white opacity-0 drop-shadow-lg transition-opacity group-hover:opacity-100" />
                  </div>
                </button>
              </div>
            </div>

            <!-- Vehicle Specifications -->
            <div class="space-y-3">
              <Separator />
              <h4 class="text-sm font-semibold">Vehicle Specifications</h4>
              <div class="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt class="text-xs font-medium uppercase tracking-wide text-muted-foreground">VIN</dt>
                  <dd class="mt-1 text-sm font-mono">{{ sellCarDetails.vin || 'Not provided' }}</dd>
                </div>
                <div>
                  <dt class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Tyre Condition</dt>
                  <dd class="mt-1 text-sm capitalize">{{ sellCarDetails.tyreCondition || 'Not specified' }}</dd>
                </div>
                <div>
                  <dt class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Service History</dt>
                  <dd class="mt-1">
                    <Badge v-if="sellCarDetails.serviceHistory" variant="default" class="bg-green-600">Full history</Badge>
                    <Badge v-else variant="outline">Incomplete/Unknown</Badge>
                  </dd>
                </div>
                <div>
                  <dt class="text-xs font-medium uppercase tracking-wide text-muted-foreground">One Owner</dt>
                  <dd class="mt-1">
                    <Badge v-if="sellCarDetails.oneOwner" variant="default" class="bg-green-600">Yes</Badge>
                    <Badge v-else variant="outline">Multiple owners</Badge>
                  </dd>
                </div>
              </div>
            </div>

            <!-- Alerts / Issues -->
            <div v-if="sellCarDetails.hasHailDamage || sellCarDetails.hasFinance || sellCarDetails.hasKnownFaults" class="space-y-3">
              <Separator />
              <h4 class="text-sm font-semibold text-amber-600 flex items-center gap-2">
                <AlertTriangle class="h-4 w-4" />
                Important Notes
              </h4>
              <div class="space-y-2">
                <div v-if="sellCarDetails.hasHailDamage" class="rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <p class="text-sm font-medium text-amber-900">⚠️ Previous Hail Damage</p>
                  <p v-if="sellCarDetails.hailDamageDetails" class="mt-1 text-sm text-amber-800">
                    {{ sellCarDetails.hailDamageDetails }}
                  </p>
                </div>
                <div v-if="sellCarDetails.hasFinance" class="rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <p class="text-sm font-medium text-amber-900">💰 Finance Owing</p>
                  <p v-if="sellCarDetails.financeDetails" class="mt-1 text-sm text-amber-800">
                    {{ sellCarDetails.financeDetails }}
                  </p>
                </div>
                <div v-if="sellCarDetails.hasKnownFaults" class="rounded-lg border border-red-200 bg-red-50 p-3">
                  <p class="text-sm font-medium text-red-900">🔧 Known Faults</p>
                  <p v-if="sellCarDetails.knownFaultsDetails" class="mt-1 text-sm text-red-800">
                    {{ sellCarDetails.knownFaultsDetails }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Accessories -->
            <div v-if="sellCarDetails.accessories" class="space-y-2">
              <Separator />
              <h4 class="text-sm font-semibold">Additional Accessories</h4>
              <p class="text-sm text-muted-foreground">{{ sellCarDetails.accessories }}</p>
            </div>
          </CardContent>
        </Card>

        <!-- Accessories Cart Section -->
        <Card v-if="accessoriesCart">
          <CardHeader class="pb-4">
            <CardTitle class="flex items-center gap-2">
              <ShoppingCart class="h-5 w-5" />
              {{ accessoriesCardTitle }}
            </CardTitle>
            <CardDescription>{{ accessoriesCardDescription }}</CardDescription>
          </CardHeader>
          <CardContent class="space-y-6">
            <!-- Model Info -->
            <div v-if="accessoriesCart.model" class="rounded-lg border bg-gradient-to-r from-muted/50 to-muted/30 p-4">
              <div class="flex items-center gap-2">
                <Badge variant="secondary" class="text-sm">
                  <Car class="mr-1 h-3 w-3" />
                  Hyundai {{ accessoriesCart.model }}
                </Badge>
                <span class="text-sm text-muted-foreground">
                  {{ accessoriesCart.itemCount }} item{{ accessoriesCart.itemCount !== 1 ? 's' : '' }} requested
                </span>
              </div>
            </div>

            <!-- Items List -->
            <div class="space-y-3">
              <h4 class="text-sm font-semibold">Selected Accessories</h4>
              <div class="divide-y rounded-lg border">
                <div
                  v-for="item in accessoriesItems"
                  :key="item.id"
                  class="flex items-center gap-4 p-4"
                >
                  <!-- Accessory Image -->
                  <div class="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border bg-muted/30">
                    <NuxtImg
                      v-if="item.image || item.thumbnail"
                      :src="item.image || item.thumbnail || ''"
                      :alt="item.name"
                      class="h-full w-full object-contain p-1"
                      loading="lazy"
                      width="64"
                      height="64"
                      format="webp"
                      quality="80"
                    />
                    <div v-else class="flex h-full w-full items-center justify-center">
                      <ShoppingCart class="h-6 w-6 text-muted-foreground/50" />
                    </div>
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2">
                      <p class="font-medium truncate">{{ item.name }}</p>
                      <Badge v-if="item.type === 'pack'" variant="outline" class="text-xs bg-amber-50 text-amber-700 border-amber-200 flex-shrink-0">
                        Value Pack
                      </Badge>
                    </div>
                    <p v-if="item.partNumber" class="text-xs text-muted-foreground mt-0.5">
                      Part #{{ item.partNumber }}
                    </p>
                  </div>
                  <div class="text-right flex-shrink-0">
                    <p class="font-semibold">{{ formatCurrency(item.subtotal || item.price * item.quantity) }}</p>
                    <p v-if="item.quantity > 1" class="text-xs text-muted-foreground">
                      {{ item.quantity }} × {{ formatCurrency(item.price) }}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Total -->
            <div class="rounded-lg bg-primary/5 p-4">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-muted-foreground">Estimated Total</p>
                  <p class="text-xs text-muted-foreground mt-0.5">Inc. GST & estimated fitment</p>
                </div>
                <p class="text-2xl font-bold text-primary">{{ formatCurrency(accessoriesCart.total || 0) }}</p>
              </div>
            </div>

            <p class="text-xs text-muted-foreground text-center">
              *Final pricing to be confirmed at dealership based on availability and current pricing.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
            <CardDescription>Capture every follow-up so teammates stay in sync.</CardDescription>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="space-y-2">
              <Label class="text-xs uppercase tracking-wide text-muted-foreground">Add note</Label>
              <Textarea
                v-model="newNote"
                rows="3"
                placeholder="Summarise your conversation, next steps, or commitments."
              />
              <div class="flex justify-end">
                <Button
                  size="sm"
                  :disabled="!newNote.trim() || addingNote"
                  @click="addNote"
                >
                  {{ addingNote ? 'Saving…' : 'Add note' }}
                </Button>
              </div>
            </div>
            <Separator />
            <div class="space-y-3">
              <div
                v-for="note in notes"
                :key="note.id"
                class="rounded-lg border bg-muted/40 p-4"
              >
                <p class="text-sm text-foreground">{{ note.content }}</p>
                <p class="mt-2 text-xs text-muted-foreground">
                  <span v-if="note.user">{{ note.user.firstName }} {{ note.user.lastName }}</span>
                  <span v-else>System</span>
                  · {{ formatDate(note.createdAt) }}
                </p>
              </div>
              <p v-if="!notes.length" class="text-center text-sm text-muted-foreground">No notes yet.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Right column -->
      <div class="space-y-6">
        <Card>
          <CardHeader class="space-y-1">
            <div class="crm-card__header flex items-start justify-between gap-3">
              <div class="min-w-0">
                <CardTitle>Dealer Studio LMS</CardTitle>
                <CardDescription>Automatic lead delivery and provider acknowledgement.</CardDescription>
              </div>
              <Badge :class="crmBadgeClass" class="crm-card__status shrink-0 gap-1 text-xs">
                <component :is="crmStatusIcon" class="h-3.5 w-3.5" />
                {{ crmStatusLabel }}
              </Badge>
            </div>
          </CardHeader>
          <CardContent class="space-y-4">
            <dl class="space-y-3 text-sm">
              <div class="flex items-start justify-between gap-2">
                <div>
                  <dt class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Dealer Studio lead ID</dt>
                  <dd class="mt-1 font-medium">
                    {{ dealerStudioDelivery?.providerLeadId || enquiry.crmRef || 'Not acknowledged' }}
                  </dd>
                </div>
                <Button
                  v-if="dealerStudioDelivery?.providerLeadId || enquiry.crmRef"
                  variant="ghost"
                  size="icon"
                  class="h-8 w-8"
                  @click="copyValue(dealerStudioDelivery?.providerLeadId || enquiry.crmRef, 'Dealer Studio lead ID')"
                >
                  <Copy class="h-3.5 w-3.5" />
                </Button>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <dt class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Attempts</dt>
                  <dd class="mt-1 tabular-nums">{{ dealerStudioDelivery?.attempts ?? 0 }}</dd>
                </div>
                <div>
                  <dt class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Last updated</dt>
                  <dd class="mt-1">{{ dealerStudioDelivery?.updatedAt ? formatDate(dealerStudioDelivery.updatedAt) : 'Not queued' }}</dd>
                </div>
              </div>
            </dl>
            <Alert v-if="dealerStudioDelivery?.lastError" variant="destructive">
              <AlertTriangle class="h-4 w-4" />
              <AlertDescription>{{ dealerStudioDelivery.lastError }}</AlertDescription>
            </Alert>
            <Button
              v-if="canRetryDealerStudio"
              class="w-full"
              variant="default"
              :disabled="retryingCrm"
              @click="retryDealerStudioDelivery"
            >
              <RefreshCcw class="mr-2 h-4 w-4" :class="{ 'animate-spin': retryingCrm }" />
              {{ retryingCrm ? 'Retrying…' : 'Retry delivery' }}
            </Button>
            <Button v-else class="w-full" variant="outline" as-child>
              <NuxtLink to="/admin/settings/dealer-studio">View integration health</NuxtLink>
            </Button>
            <p v-if="!dealerStudioDelivery" class="text-xs text-muted-foreground">
              This enquiry predates the delivery queue or the integration is disabled.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Source & tracking</CardTitle>
            <CardDescription>How this lead reached your team.</CardDescription>
          </CardHeader>
          <CardContent class="space-y-4 text-sm">
            <div class="space-y-2">
              <p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">UTM tags</p>
              <div class="space-y-1">
                <div class="flex items-center justify-between">
                  <span>Source</span>
                  <span class="text-muted-foreground">{{ enquiry.utmSource || '—' }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span>Medium</span>
                  <span class="text-muted-foreground">{{ enquiry.utmMedium || '—' }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span>Campaign</span>
                  <span class="text-muted-foreground">{{ enquiry.utmCampaign || '—' }}</span>
                </div>
              </div>
            </div>
            <Separator />
            <div class="space-y-1">
              <p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Technical</p>
              <div class="flex items-center justify-between">
                <span>IP address</span>
                <span class="text-muted-foreground">{{ enquiry.ipAddress || '—' }}</span>
              </div>
              <div>
                <span class="text-muted-foreground text-xs">{{ enquiry.userAgent }}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Activity log</CardTitle>
            <CardDescription>Automatic audit trail for this enquiry.</CardDescription>
          </CardHeader>
          <CardContent>
            <div class="space-y-4">
              <div v-for="activity in activityLog" :key="activity.id" class="relative pl-5 text-sm">
                <span class="absolute left-0 top-1 h-2 w-2 rounded-full bg-primary"></span>
                <p class="font-medium text-foreground">{{ activity.action }}</p>
                <p class="text-xs text-muted-foreground">
                  <span v-if="activity.user">{{ activity.user.firstName }} {{ activity.user.lastName }}</span>
                  <span v-else>System</span>
                  · {{ formatDate(activity.createdAt) }}
                </p>
              </div>
              <p v-if="!activityLog.length" class="text-center text-sm text-muted-foreground">
                No activity recorded yet.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>

    <!-- Photo Lightbox Modal -->
    <Dialog :open="lightboxOpen" @update:open="(val) => (lightboxOpen = val)">
      <DialogContent class="max-w-4xl border-0 bg-black/95 p-0">
        <div class="relative">
          <!-- Close button -->
          <button
            type="button"
            class="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
            @click="closeLightbox"
          >
            <X class="h-5 w-5" />
          </button>

          <!-- Image -->
          <div class="flex min-h-[60vh] items-center justify-center p-4">
            <NuxtImg
              v-if="sellCarPhotos[lightboxIndex]"
              :src="sellCarPhotos[lightboxIndex]"
              :alt="`Vehicle photo ${lightboxIndex + 1}`"
              class="max-h-[80vh] max-w-full rounded-lg object-contain"
              width="1200"
              height="900"
              format="webp"
              quality="85"
            />
          </div>

          <!-- Navigation -->
          <div v-if="sellCarPhotos.length > 1" class="absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-between px-4">
            <button
              type="button"
              :disabled="lightboxIndex === 0"
              class="rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed"
              @click="prevPhoto"
            >
              <ChevronLeft class="h-6 w-6" />
            </button>
            <button
              type="button"
              :disabled="lightboxIndex === sellCarPhotos.length - 1"
              class="rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed"
              @click="nextPhoto"
            >
              <ChevronRight class="h-6 w-6" />
            </button>
          </div>

          <!-- Counter -->
          <div class="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-4 py-2 text-sm text-white">
            {{ lightboxIndex + 1 }} / {{ sellCarPhotos.length }}
          </div>
        </div>
      </DialogContent>
    </Dialog>

  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue';
import { AlertCircle, AlertTriangle, Car, CheckCircle2, ChevronLeft, ChevronRight, Clock, Copy, ExternalLink, Globe, ImageIcon, Mail, MapPin, Phone, RefreshCcw, ShoppingCart, X, ZoomIn } from 'lucide-vue-next';

import { Button } from '~/components/ui/button';
import { Badge } from '~/components/ui/badge';
import { Alert, AlertDescription } from '~/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { Separator } from '~/components/ui/separator';
import { Textarea } from '~/components/ui/textarea';
import { Label } from '~/components/ui/label';
import { Input } from '~/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import {
  Dialog,
  DialogContent,
} from '~/components/ui/dialog';
import { useToast } from '~/composables/useToast';
import {
  ENQUIRY_STATUS_CONFIG,
  PIPELINE_STAGES,
  getStatusesByStage,
  LOST_REASON_LABELS,
  type EnquiryStatus,
} from '~~/shared/constants/salesFunnel';

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
});

const { toast } = useToast();
const route = useRoute();
const enquiryId = route.params.id as string;

const { data, pending, error, refresh } = await useFetch<any>(`/api/admin/enquiries/${enquiryId}`);

const enquiry = computed(() => data.value?.enquiry);
const notes = computed(() => data.value?.notes ?? []);
const activityLog = computed(() => data.value?.activityLog ?? []);
const dealerStudioDelivery = computed(() => data.value?.dealerStudioDelivery || null);

const isClient = ref(false);
onMounted(() => {
  isClient.value = true;
});

const submittedRelative = computed(() => {
  if (!isClient.value || !enquiry.value?.createdAt) {
    return '';
  }
  return formatRelativeTime(enquiry.value.createdAt);
});

const statusDraft = ref<string>('new_lead');
watch(enquiry, (value) => {
  if (value?.status) {
    statusDraft.value = value.status;
  }
}, { immediate: true });

// Lost-reason capture
const showLostPanel = ref(false);
const lostReasonDraft = ref('');
const lostNotesDraft = ref('');

const statusUpdating = ref(false);

const applyStatus = async (nextStatus: string, extra: Record<string, unknown> = {}) => {
  if (!enquiry.value) return;
  const previousStatus = enquiry.value.status;
  statusDraft.value = nextStatus;
  statusUpdating.value = true;
  try {
    await $fetch(`/api/admin/enquiries/${enquiryId}/status`, {
      method: 'PATCH',
      body: { status: nextStatus, oldStatus: previousStatus, ...extra },
    });
    toast.success('Status updated');
    showLostPanel.value = false;
    await refresh();
  } catch (err) {
    console.error('Failed to update status:', err);
    toast.error('Unable to update status');
    statusDraft.value = previousStatus;
  } finally {
    statusUpdating.value = false;
  }
};

const onStatusSelect = async (value: unknown) => {
  const nextStatus = typeof value === 'string' ? value : '';
  if (!enquiry.value || !nextStatus || statusUpdating.value) return;
  if (nextStatus === enquiry.value.status) return;
  // 'lost' requires a reason; reveal the capture panel instead of submitting.
  if (nextStatus === 'lost') {
    statusDraft.value = 'lost';
    lostReasonDraft.value = '';
    lostNotesDraft.value = '';
    showLostPanel.value = true;
    return;
  }
  await applyStatus(nextStatus);
};

const applyLostStatus = async () => {
  if (!lostReasonDraft.value) return;
  await applyStatus('lost', { lostReason: lostReasonDraft.value, lostNotes: lostNotesDraft.value || undefined });
};

const cancelLost = () => {
  showLostPanel.value = false;
  statusDraft.value = enquiry.value?.status ?? 'new_lead';
};

const newNote = ref('');
const addingNote = ref(false);

const addNote = async () => {
  if (!newNote.value.trim() || addingNote.value) return;
  addingNote.value = true;
  try {
    await $fetch(`/api/admin/enquiries/${enquiryId}/notes`, {
      method: 'POST',
      body: { content: newNote.value },
    });
    newNote.value = '';
    toast.success('Note added');
    await refresh();
  } catch (err) {
    console.error('Failed to add note:', err);
    toast.error('Unable to add note');
  } finally {
    addingNote.value = false;
  }
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleString('en-AU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatRelativeTime = (date: string) => {
  const diffMs = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
};

const formatType = (type: string) => {
  const types: Record<string, string> = {
    contact: 'Contact',
    vehicle: 'Vehicle',
    finance: 'Finance',
    test_drive: 'Test Drive',
    service: 'Service',
    parts: 'Parts',
    accessories: 'Accessories',
    sell_car: 'Sell My Car',
  };
  return types[type] || type;
};

const formatStatus = (status: string) => {
  return ENQUIRY_STATUS_CONFIG[status as EnquiryStatus]?.label || status;
};

const statusBadgeVariant = (status: string) => {
  const stage = ENQUIRY_STATUS_CONFIG[status as EnquiryStatus]?.stage;
  const map: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
    cold: 'secondary',
    warm: 'default',
    hot: 'default',
    closed: status === 'lost' ? 'destructive' : 'outline',
  };
  return (stage && map[stage]) || 'outline';
};

const isFuture = (date: string) => new Date(date) > new Date();

const shortId = computed(() => enquiry.value?.id?.slice(0, 8)?.toUpperCase() ?? '—');

const parseFields = (input?: Record<string, unknown> | null) => {
  if (!input || typeof input !== 'object') return [] as { label: string; value: string }[];
  return Object.entries(input)
    .filter(([, value]) => value !== null && value !== '' && typeof value !== 'object')
    .map(([key, value]) => ({
      label: formatLabel(key),
      value: String(value),
    }));
};

const formatLabel = (key: string) => {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]/g, ' ')
    .replace(/^./, (char) => char.toUpperCase())
    .trim();
};

const vehicleFields = computed(() => parseFields(enquiry.value?.vehicleInfo));
const tradeInFields = computed(() => parseFields(enquiry.value?.tradeInInfo));
const financeFields = computed(() => parseFields(enquiry.value?.financeDetails));

// Vehicle thumbnail and prominent display fields
const vehicleInfo = computed(() => enquiry.value?.vehicleInfo as Record<string, unknown> | undefined);

const vehicleThumbnail = computed(() => {
  const info = vehicleInfo.value;
  if (!info) return '';
  // Check common field names for thumbnail/image
  return (info.thumbnail || info.image || info.imageUrl || info.photo || '') as string;
});

const vehicleName = computed(() => {
  const info = vehicleInfo.value;
  if (!info) return '';
  const parts = [
    info.year,
    info.make,
    info.model,
    info.variant || info.badge,
  ].filter(Boolean);
  return parts.join(' ');
});

const vehiclePrice = computed(() => {
  const info = vehicleInfo.value;
  if (!info?.price) return '';
  const price = Number(info.price);
  if (isNaN(price)) return '';
  return formatCurrency(price);
});

const vehicleCondition = computed(() => {
  const info = vehicleInfo.value;
  if (!info?.condition) return '';
  const condition = String(info.condition);
  return condition.charAt(0).toUpperCase() + condition.slice(1);
});

const vehicleStockId = computed(() => {
  const info = vehicleInfo.value;
  if (!info) return '';
  return (info.stockId || info.stock_id || info.stockNumber || '') as string;
});

const vehicleUrl = computed(() => {
  const info = vehicleInfo.value;
  if (!info) return '';
  return (info.vehicleUrl || info.vehicle_url || info.url || '') as string;
});

// Vehicle configuration from calculator/builder
interface VehicleConfiguration {
  model?: string;
  variant?: string;
  variantId?: string;
  colour?: string;
  colourPrice?: number;
  trim?: string;
  trimPrice?: number;
  optionPack?: string;
  optionPackPrice?: number;
  optionPackFeatures?: string[];
  prepaidService?: string;
  prepaidServicePrice?: number;
  basePrice?: number;
  totalPrice?: number;
  thumbnail?: string;
}

const vehicleConfiguration = computed<VehicleConfiguration | undefined>(() => {
  const info = vehicleInfo.value;
  if (!info) return undefined;
  return info.configuration as VehicleConfiguration | undefined;
});

const optionPackFeatures = computed(() => {
  const features = vehicleConfiguration.value?.optionPackFeatures;
  if (!Array.isArray(features)) return [];
  return features.filter((feature): feature is string => typeof feature === 'string' && feature.trim().length > 0);
});

// Applied offers from vehicle builder
interface AppliedOffer {
  offerId: string;
  title: string;
  type?: string;
  formattedValue?: string;
}

const appliedOffers = computed<AppliedOffer[]>(() => {
  const info = vehicleInfo.value;
  if (!info) return [];
  const offers = info.appliedOffers;
  if (!Array.isArray(offers)) return [];
  return offers as AppliedOffer[];
});

// Filter out fields already displayed in the prominent card or dedicated sections
const vehicleFieldsFiltered = computed(() => {
  const prominentFields = ['thumbnail', 'image', 'imageUrl', 'photo', 'year', 'make', 'model', 'variant', 'badge', 'price', 'priceDisplay', 'condition', 'stockId', 'stock_id', 'stockNumber', 'vehicleUrl', 'vehicle_url', 'url', 'configuration', 'appliedOffers', 'appliedoffers'];
  return vehicleFields.value.filter(field => {
    const key = field.label.toLowerCase().replace(/\s+/g, '');
    return !prominentFields.some(pf => key.includes(pf.toLowerCase()));
  });
});

const hasVehicleInterest = computed(() =>
  Boolean(vehicleFields.value.length || tradeInFields.value.length || financeFields.value.length || vehicleConfiguration.value || appliedOffers.value.length)
);

// Accessories cart
interface AccessoriesCartData {
  model?: string | null;
  items: {
    id: string;
    name: string;
    partNumber?: string;
    price: number;
    quantity: number;
    type: 'accessory' | 'pack';
    subtotal: number;
    image?: string | null;
    thumbnail?: string | null;
  }[];
  itemCount: number;
  total: number;
}

const accessoriesCart = computed<AccessoriesCartData | null>(() => {
  const cart = enquiry.value?.accessoriesCart as AccessoriesCartData | undefined;
  if (!cart || !Array.isArray(cart.items) || cart.items.length === 0) return null;
  return cart;
});

const accessoriesItems = computed(() => {
  return accessoriesCart.value?.items || [];
});

const isStandaloneAccessoriesLead = computed(() => enquiry.value?.type === 'accessories');

const accessoriesCardTitle = computed(() =>
  isStandaloneAccessoriesLead.value ? 'Accessories Quote Request' : 'Selected accessories'
);

const accessoriesCardDescription = computed(() =>
  isStandaloneAccessoriesLead.value
    ? 'Items the customer is interested in purchasing.'
    : 'Accessories selected with the calculator or showroom enquiry.'
);

// Sell My Car details
interface SellCarDetails {
  year?: string;
  make?: string;
  model?: string;
  grade?: string;
  vin?: string;
  rego?: string;
  odometer?: number;
  condition?: string;
  tyreCondition?: string;
  serviceHistory?: boolean;
  oneOwner?: boolean;
  photos?: string[];
  hasHailDamage?: boolean;
  hailDamageDetails?: string;
  hasFinance?: boolean;
  financeDetails?: string;
  hasKnownFaults?: boolean;
  knownFaultsDetails?: string;
  accessories?: string;
}

const sellCarDetails = computed<SellCarDetails | null>(() => {
  if (enquiry.value?.type !== 'sell_car') return null;
  return enquiry.value?.sellCarDetails as SellCarDetails | null;
});

const sellCarPhotos = computed(() => {
  const photos = sellCarDetails.value?.photos;
  if (!Array.isArray(photos)) return [];
  return photos.filter(Boolean);
});

// Photo lightbox
const lightboxOpen = ref(false);
const lightboxIndex = ref(0);

const openPhotoLightbox = (index: number) => {
  lightboxIndex.value = index;
  lightboxOpen.value = true;
};

const closeLightbox = () => {
  lightboxOpen.value = false;
};

const nextPhoto = () => {
  if (lightboxIndex.value < sellCarPhotos.value.length - 1) {
    lightboxIndex.value++;
  }
};

const prevPhoto = () => {
  if (lightboxIndex.value > 0) {
    lightboxIndex.value--;
  }
};

const formatNumber = (value?: number) => {
  if (value === undefined || value === null) return '—';
  return new Intl.NumberFormat('en-AU').format(value);
};

const formatCondition = (condition?: string) => {
  if (!condition) return 'Unknown';
  return condition.charAt(0).toUpperCase() + condition.slice(1);
};

const conditionBadgeVariant = (condition?: string): 'default' | 'secondary' | 'outline' | 'destructive' => {
  switch (condition) {
    case 'excellent': return 'default';
    case 'average': return 'secondary';
    case 'poor': return 'destructive';
    default: return 'outline';
  }
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(value || 0);
};

const copyValue = async (value?: string, label?: string) => {
  if (!value || !process.client) return;
  try {
    await navigator.clipboard.writeText(value);
    toast.success(`${label ?? 'Value'} copied to clipboard`);
  } catch (err) {
    console.error('Clipboard error', err);
    toast.error('Unable to copy to clipboard');
  }
};

const sourceDomain = computed(() => {
  if (!enquiry.value?.source) return '';
  try {
    return new URL(enquiry.value.source).hostname.replace('www.', '');
  } catch {
    return '';
  }
});

const crmStatus = computed(() => dealerStudioDelivery.value?.status || (enquiry.value?.syncedToCrm ? 'synced' : 'not_queued'));
const crmStatusLabel = computed(() => ({
  pending: 'Pending',
  sending: 'Sending',
  synced: 'Synced',
  failed_validation: 'Invalid lead',
  failed_retryable: 'Retry scheduled',
  failed_permanent: 'Manual review',
  not_queued: 'Not queued',
}[crmStatus.value as string] || String(crmStatus.value).replaceAll('_', ' ')));
const crmStatusIcon = computed(() => {
  if (crmStatus.value === 'synced') return CheckCircle2;
  if (String(crmStatus.value).startsWith('failed_')) return AlertTriangle;
  return AlertCircle;
});
const crmBadgeClass = computed(() => {
  if (crmStatus.value === 'synced') return 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200';
  if (String(crmStatus.value).startsWith('failed_')) return 'bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200';
  return 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200';
});
const canRetryDealerStudio = computed(() => [
  'failed_validation',
  'failed_retryable',
  'failed_permanent',
].includes(dealerStudioDelivery.value?.status));
const retryingCrm = ref(false);

const retryDealerStudioDelivery = async () => {
  retryingCrm.value = true;
  try {
    await $fetch(`/api/admin/integrations/dealer-studio/${enquiryId}/retry`, {
      method: 'POST',
    });
    toast.success('Dealer Studio delivery retried');
    await refresh();
  } catch (err: any) {
    console.error('Dealer Studio retry failed', err);
    toast.error(err?.data?.message || err?.message || 'Unable to retry Dealer Studio delivery');
  } finally {
    retryingCrm.value = false;
  }
};
</script>

<style scoped>
.enquiry-detail {
  min-width: 0;
}

.enquiry-detail :deep(.rounded-xl.border) {
  min-width: 0;
  max-width: 100%;
}

.enquiry-detail :deep(dd),
.enquiry-detail :deep(p),
.enquiry-detail :deep(a) {
  overflow-wrap: anywhere;
}

@media (max-width: 639px) {
  .enquiry-detail {
    gap: 1rem;
  }

  .enquiry-detail__header-actions,
  .enquiry-detail__header-actions :deep(button[role="combobox"]) {
    width: 100%;
  }

  .crm-card__header {
    align-items: flex-start;
    flex-direction: column;
  }

  .crm-card__status {
    align-self: flex-start;
  }
}
</style>
