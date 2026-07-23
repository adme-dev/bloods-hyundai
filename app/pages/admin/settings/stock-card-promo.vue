<template>
  <div class="mx-auto max-w-[1200px] space-y-6 text-foreground">
    <AdminPageHeader
      eyebrow="Website content"
      title="Stock card promotions"
      description="The stock page header, scrolling banners, promo graphics, and Was/Now pricing, badges and comments from per-vehicle and group offers."
    >
      <template #actions>
        <Button variant="outline" :disabled="loading || saving" @click="reloadFromServer">
          <RefreshCw class="mr-2 h-4 w-4" /> Refresh data
        </Button>
        <Button variant="outline" @click="previewStockPage">
          <ExternalLink class="mr-2 h-4 w-4" /> Preview stock page
        </Button>
      </template>
    </AdminPageHeader>

    <div v-if="loading" class="flex min-h-64 items-center justify-center rounded-xl border bg-card">
      <div class="text-center" role="status">
        <Loader2 class="mx-auto h-7 w-7 animate-spin text-muted-foreground" />
        <p class="mt-3 text-sm text-muted-foreground">Loading stock card promotions…</p>
      </div>
    </div>

    <Alert v-else-if="loadError" variant="destructive">
      <AlertTriangle class="h-4 w-4" />
      <AlertTitle>Could not load stock card promotions</AlertTitle>
      <AlertDescription class="space-y-3">
        <p>{{ loadError }}</p>
        <Button variant="outline" size="sm" @click="reloadFromServer">Try again</Button>
      </AlertDescription>
    </Alert>

    <template v-else>
      <!-- Scrolling banners -->
      <Card>
        <CardHeader class="gap-4 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
          <div class="space-y-1.5">
            <CardTitle>Scrolling banners</CardTitle>
            <CardDescription>Scrolling tickers along the bottom of vehicle card images. Run different banners for different stock at the same time — e.g. one for Used, one for New. The first matching banner shows on a card; a per-vehicle comment overrides it.</CardDescription>
            <p class="mt-1 flex items-center gap-1.5 text-xs font-medium text-primary"><Info class="h-3.5 w-3.5 shrink-0" /> Shown on: vehicle cards matching each banner's filters, everywhere cards appear.</p>
          </div>
          <Button :disabled="saving || form.scrollers.length >= maxScrollers" @click="addBanner">
            <Plus class="mr-2 h-4 w-4" /> Add banner
          </Button>
        </CardHeader>
        <CardContent>
          <div v-if="!form.scrollers.length" class="rounded-xl border border-dashed px-6 py-10 text-center">
            <Megaphone class="mx-auto h-8 w-8 text-muted-foreground" />
            <p class="mt-3 text-sm text-muted-foreground">No banners yet. Add one to run a scrolling message across your vehicle cards.</p>
          </div>
          <div v-else class="space-y-4">
            <div v-for="(banner, index) in form.scrollers" :key="banner.id" class="space-y-4 rounded-lg border p-4">
              <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div class="flex min-w-0 flex-1 items-start gap-3">
                  <Switch v-model="banner.enabled" :disabled="saving" class="shrink-0" :aria-label="`Enable banner ${index + 1}`" />
                  <div class="min-w-0">
                    <div class="flex flex-wrap items-center gap-2">
                      <p class="m-0 text-sm font-semibold">Banner {{ index + 1 }}</p>
                      <span :class="[CHIP_BASE, banner.enabled ? windowStatus(banner.start, banner.end).class : CHIP_OFF]">
                        {{ banner.enabled ? windowStatus(banner.start, banner.end).label : 'Off' }}
                      </span>
                    </div>
                    <p class="m-0 text-xs text-muted-foreground">{{ bannerSummary(banner) }} · {{ bannerMatchCount(banner) }}</p>
                  </div>
                </div>
                <div class="flex items-center gap-1">
                  <Button variant="ghost" size="icon" :disabled="saving || index === 0" :aria-label="`Move banner ${index + 1} up`" title="Move up" @click="moveBanner(index, -1)">
                    <ArrowUp class="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" :disabled="saving || index === form.scrollers.length - 1" :aria-label="`Move banner ${index + 1} down`" title="Move down" @click="moveBanner(index, 1)">
                    <ArrowDown class="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" :disabled="saving" :aria-label="`Remove banner ${index + 1}`" title="Delete" @click="removeBanner(index)">
                    <Trash2 class="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
              <div class="grid items-start gap-4 md:grid-cols-2">
                <div class="space-y-2">
                  <Label :for="`banner-start-${index}`">Start date (optional)</Label>
                  <AdminDatePicker
                    :id="`banner-start-${index}`"
                    v-model="banner.start"
                    label="Banner start date"
                    placeholder="Starts immediately"
                    clearable
                    :disabled="saving"
                  />
                </div>
                <div class="space-y-2">
                  <Label :for="`banner-end-${index}`">End date (optional)</Label>
                  <AdminDatePicker
                    :id="`banner-end-${index}`"
                    v-model="banner.end"
                    label="Banner end date"
                    placeholder="No end date"
                    :min="banner.start || undefined"
                    clearable
                    :disabled="saving"
                  />
                </div>
              </div>
              <div class="grid items-start gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
                <div class="space-y-2">
                  <Label :for="`banner-text-${index}`">Banner text</Label>
                  <Input
                    :id="`banner-text-${index}`"
                    v-model="banner.text"
                    maxlength="160"
                    placeholder="e.g. MASSIVE EOFY SALE — THIS WEEKEND ONLY*"
                    :disabled="saving"
                  />
                </div>
                <AdminColorField :id="`banner-color-${index}`" v-model="banner.color" label="Banner colour" :disabled="saving" />
              </div>
              <div v-if="banner.enabled && banner.text" class="space-y-2">
                <Label>Live preview</Label>
                <BannerMarqueePreview :text="banner.text" :color="banner.color" />
              </div>
              <div>
                <p class="mb-2 text-xs font-medium text-muted-foreground">Show on (leave as "Any" for every vehicle card)</p>
                <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                  <div class="space-y-2">
                    <Label :for="`banner-make-${index}`">Make</Label>
                    <Select :model-value="banner.make || ANY" :disabled="saving" @update:model-value="banner.make = fromAny($event)">
                      <SelectTrigger :id="`banner-make-${index}`" class="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem :value="ANY">Any make</SelectItem>
                        <SelectItem v-for="make in makeOptions" :key="make" :value="make">{{ make }}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div class="space-y-2">
                    <Label :for="`banner-model-${index}`">Model</Label>
                    <Select :model-value="banner.model || ANY" :disabled="saving" @update:model-value="banner.model = fromAny($event)">
                      <SelectTrigger :id="`banner-model-${index}`" class="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem :value="ANY">Any model</SelectItem>
                        <SelectItem v-for="model in modelOptions(banner.make)" :key="model" :value="model">{{ model }}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div class="space-y-2">
                    <Label :for="`banner-variant-${index}`">Variant</Label>
                    <Select :model-value="banner.variant || ANY" :disabled="saving" @update:model-value="banner.variant = fromAny($event)">
                      <SelectTrigger :id="`banner-variant-${index}`" class="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem :value="ANY">Any variant</SelectItem>
                        <SelectItem v-for="variant in variantOptions(banner.make, banner.model)" :key="variant" :value="variant">{{ variant }}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div class="space-y-2">
                    <Label :for="`banner-condition-${index}`">Condition</Label>
                    <Select :model-value="bannerConditionValue(banner)" :disabled="saving" @update:model-value="setBannerCondition(banner, $event)">
                      <SelectTrigger :id="`banner-condition-${index}`" class="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem v-if="banner.conditions.length > 1" :value="MULTI">{{ banner.conditions.map(conditionLabel).join(' + ') }}</SelectItem>
                        <SelectItem :value="ANY">Any condition</SelectItem>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="demo">Demo</SelectItem>
                        <SelectItem value="used">Used</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div class="space-y-2">
                    <Label :for="`banner-fuel-${index}`">Fuel type</Label>
                    <Select :model-value="bannerFuelValue(banner)" :disabled="saving" @update:model-value="setBannerFuelType(banner, $event)">
                      <SelectTrigger :id="`banner-fuel-${index}`" class="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem v-if="banner.fuelTypes.length > 1" :value="MULTI">{{ banner.fuelTypes.map(fuelTypeLabel).join(' + ') }}</SelectItem>
                        <SelectItem :value="ANY">Any fuel type</SelectItem>
                        <SelectItem v-for="fuelOption in FUEL_TYPE_ORDER" :key="fuelOption" :value="fuelOption">{{ fuelTypeLabel(fuelOption) }}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Stock page header -->
      <Card>
        <CardHeader>
          <div class="flex flex-wrap items-center gap-2">
            <CardTitle>Stock page header</CardTitle>
            <span :class="[CHIP_BASE, form.stockHeader.enabled ? windowStatus(form.stockHeader.start, form.stockHeader.end).class : CHIP_OFF]">
              {{ form.stockHeader.enabled ? windowStatus(form.stockHeader.start, form.stockHeader.end).label : 'Off' }}
            </span>
          </div>
          <CardDescription>A promotional banner across the top of the Cars for Sale page, with separate desktop and mobile artwork and an optional campaign window. Recommended sizes: 1600×400 desktop, 800×400 mobile.</CardDescription>
          <p class="mt-1 flex items-center gap-1.5 text-xs font-medium text-primary"><Info class="h-3.5 w-3.5 shrink-0" /> Shown on: the top of the Cars for Sale page only.</p>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="grid items-start gap-4 md:grid-cols-[180px_minmax(0,1fr)_minmax(0,1fr)]">
            <div class="space-y-2">
              <Label for="header-enabled">Status</Label>
              <div class="flex h-10 items-center justify-between gap-3 rounded-md border border-input px-3">
                <span class="text-sm font-medium">{{ form.stockHeader.enabled ? 'On' : 'Off' }}</span>
                <Switch id="header-enabled" v-model="form.stockHeader.enabled" :disabled="saving" aria-label="Enable stock page header" />
              </div>
            </div>
            <div class="space-y-2">
              <Label for="header-start">Start date (optional)</Label>
              <AdminDatePicker
                id="header-start"
                v-model="form.stockHeader.start"
                label="Header start date"
                placeholder="Starts immediately"
                clearable
                :disabled="saving"
              />
            </div>
            <div class="space-y-2">
              <Label for="header-end">End date (optional)</Label>
              <AdminDatePicker
                id="header-end"
                v-model="form.stockHeader.end"
                label="Header end date"
                placeholder="No end date"
                :min="form.stockHeader.start || undefined"
                clearable
                :disabled="saving"
              />
            </div>
          </div>
          <div class="grid gap-4 lg:grid-cols-2">
            <div class="space-y-2">
              <Label>Desktop image</Label>
              <div class="grid aspect-[4/1] w-full place-items-center overflow-hidden rounded-xl border bg-muted">
                <button
                  v-if="form.stockHeader.desktop"
                  type="button"
                  class="h-full w-full cursor-zoom-in"
                  aria-label="Zoom stock page header desktop image"
                  @click="imagePreview = { url: form.stockHeader.desktop, alt: 'Stock page header — desktop' }"
                >
                  <img :src="form.stockHeader.desktop" alt="Stock page header desktop preview" class="h-full w-full object-contain" />
                </button>
                <div v-else class="grid place-items-center gap-2 text-xs text-muted-foreground">
                  <Images class="h-6 w-6" />
                  <span>No image</span>
                </div>
              </div>
              <Button type="button" variant="outline" size="sm" class="w-full" :disabled="saving" @click="chooseImage({ kind: 'header', field: 'desktop' })">
                <Upload class="mr-2 h-4 w-4" /> Choose from media library
              </Button>
            </div>
            <div class="space-y-2">
              <Label>Mobile image (optional)</Label>
              <div class="grid aspect-[2/1] w-full place-items-center overflow-hidden rounded-xl border bg-muted">
                <button
                  v-if="form.stockHeader.mobile"
                  type="button"
                  class="h-full w-full cursor-zoom-in"
                  aria-label="Zoom stock page header mobile image"
                  @click="imagePreview = { url: form.stockHeader.mobile, alt: 'Stock page header — mobile' }"
                >
                  <img :src="form.stockHeader.mobile" alt="Stock page header mobile preview" class="h-full w-full object-contain" />
                </button>
                <div v-else class="grid place-items-center gap-1 text-center text-xs text-muted-foreground">
                  <Images class="mx-auto h-6 w-6" />
                  <span>Uses desktop image</span>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <Button type="button" variant="outline" size="sm" class="w-full" :disabled="saving" @click="chooseImage({ kind: 'header', field: 'mobile' })">
                  <Upload class="mr-2 h-4 w-4" /> Choose from media library
                </Button>
                <Button
                  v-if="form.stockHeader.mobile"
                  type="button"
                  variant="ghost"
                  size="icon"
                  class="shrink-0"
                  :disabled="saving"
                  aria-label="Remove header mobile image"
                  @click="form.stockHeader.mobile = ''"
                >
                  <X class="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          <div class="grid gap-4 md:grid-cols-2">
            <div class="space-y-2">
              <Label for="header-link">Link (optional)</Label>
              <Input id="header-link" v-model="form.stockHeader.link" placeholder="/special-offers or https://…" :disabled="saving" />
            </div>
            <div class="space-y-2">
              <Label for="header-alt">Image description (for accessibility)</Label>
              <Input id="header-alt" v-model="form.stockHeader.alt" maxlength="120" placeholder="e.g. EOFY sale — up to $5,000 off" :disabled="saving" />
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Graphics between cards -->
      <Card>
        <CardHeader class="gap-4 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
          <div class="space-y-1.5">
            <div class="flex flex-wrap items-center gap-2">
              <CardTitle>Graphics between cards</CardTitle>
              <span :class="[CHIP_BASE, form.graphics.enabled ? windowStatus(form.graphics.start, form.graphics.end).class : CHIP_OFF]">
                {{ form.graphics.enabled ? windowStatus(form.graphics.start, form.graphics.end).label : 'Off' }}
              </span>
            </div>
            <CardDescription>Emotional promo graphics inserted between stock cards — in the homepage Stock Specials slider and the Cars for Sale grid. Graphics rotate if you add more than one, and share the campaign window below.</CardDescription>
            <p class="mt-1 flex items-center gap-1.5 text-xs font-medium text-primary"><Info class="h-3.5 w-3.5 shrink-0" /> Shown on: the Cars for Sale grid and the homepage Stock Specials slider.</p>
          </div>
          <Button :disabled="saving || form.graphics.items.length >= maxGraphics" @click="addGraphic">
            <Plus class="mr-2 h-4 w-4" /> Add graphic
          </Button>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div class="space-y-2">
              <Label for="graphics-enabled">Status</Label>
              <div class="flex h-10 items-center justify-between gap-3 rounded-md border border-input px-3">
                <span class="text-sm font-medium">{{ form.graphics.enabled ? 'On' : 'Off' }}</span>
                <Switch id="graphics-enabled" v-model="form.graphics.enabled" :disabled="saving" aria-label="Enable graphics between cards" />
              </div>
            </div>
            <div class="space-y-2">
              <Label for="graphics-interval">Insert after every</Label>
              <Select v-model="intervalModel" :disabled="saving">
                <SelectTrigger id="graphics-interval" class="w-full">
                  <SelectValue placeholder="Choose interval" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="option in intervalOptions" :key="option" :value="String(option)">
                    {{ intervalLabel(option) }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div class="space-y-2">
              <Label for="graphics-start">Start date (optional)</Label>
              <AdminDatePicker
                id="graphics-start"
                v-model="form.graphics.start"
                label="Graphics start date"
                placeholder="Starts immediately"
                clearable
                :disabled="saving"
              />
            </div>
            <div class="space-y-2">
              <Label for="graphics-end">End date (optional)</Label>
              <AdminDatePicker
                id="graphics-end"
                v-model="form.graphics.end"
                label="Graphics end date"
                placeholder="No end date"
                :min="form.graphics.start || undefined"
                clearable
                :disabled="saving"
              />
            </div>
          </div>

          <div v-if="!form.graphics.items.length" class="rounded-xl border border-dashed px-6 py-10 text-center">
            <Images class="mx-auto h-8 w-8 text-muted-foreground" />
            <p class="mt-3 text-sm text-muted-foreground">No graphics yet. Add one and choose an image from the media library.</p>
          </div>

          <div
            v-for="(graphic, index) in form.graphics.items"
            :key="graphic.id"
            class="space-y-4 rounded-lg border p-4"
          >
            <div class="flex items-start justify-between gap-3">
              <p class="m-0 text-sm font-semibold">Graphic {{ index + 1 }}</p>
              <Button variant="ghost" size="icon" :disabled="saving" :aria-label="`Remove graphic ${index + 1}`" title="Delete" @click="removeGraphic(index)">
                <Trash2 class="h-4 w-4 text-destructive" />
              </Button>
            </div>
            <div class="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
              <div class="space-y-2">
                <Label>Graphic image</Label>
                <div class="grid aspect-square w-full place-items-center overflow-hidden rounded-xl border bg-muted">
                  <button
                    v-if="graphic.image"
                    type="button"
                    class="h-full w-full cursor-zoom-in"
                    :aria-label="`Zoom promo graphic ${index + 1}`"
                    @click="imagePreview = { url: graphic.image, alt: `Promo graphic ${index + 1}` }"
                  >
                    <img :src="graphic.image" :alt="`Promo graphic ${index + 1} preview`" class="h-full w-full object-cover" />
                  </button>
                  <div v-else class="grid place-items-center gap-2 text-xs text-muted-foreground">
                    <Images class="h-6 w-6" />
                    <span>No image</span>
                  </div>
                </div>
                <Button type="button" variant="outline" size="sm" class="w-full" :disabled="saving" @click="chooseImage({ kind: 'graphic', index, field: 'image' })">
                  <Upload class="mr-2 h-4 w-4" /> Choose from media library
                </Button>
              </div>
              <div class="grid content-start gap-4 md:grid-cols-2">
                <div class="space-y-2">
                  <Label :for="`graphic-heading-${index}`">Heading (optional)</Label>
                  <Input :id="`graphic-heading-${index}`" v-model="graphic.heading" maxlength="120" :disabled="saving" />
                </div>
                <div class="space-y-2">
                  <Label :for="`graphic-subheading-${index}`">Subheading (optional)</Label>
                  <Input :id="`graphic-subheading-${index}`" v-model="graphic.subheading" maxlength="200" :disabled="saving" />
                </div>
                <div class="space-y-2 md:col-span-2">
                  <Label :for="`graphic-link-${index}`">Link (optional)</Label>
                  <Input :id="`graphic-link-${index}`" v-model="graphic.link" placeholder="/special-offers or https://…" :disabled="saving" />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Offer display master switches -->
      <Card>
        <CardHeader>
          <CardTitle>Offer display</CardTitle>
          <CardDescription>Master switches for the per-vehicle and group offers below — they turn on automatically when you add an offer. Switch one off to hide that kind of content site-wide. Scrolling banners are not affected — they have their own switches above.</CardDescription>
          <p class="mt-1 flex items-center gap-1.5 text-xs font-medium text-primary"><Info class="h-3.5 w-3.5 shrink-0" /> Applies to: offer content on every vehicle card — stock page, homepage slider, favourites and vehicle pages.</p>
        </CardHeader>
        <CardContent class="grid gap-4 md:grid-cols-3">
          <div class="space-y-2">
            <Label for="feature-wasnow">Was / Now pricing</Label>
            <div class="flex h-10 items-center justify-between gap-3 rounded-md border border-input px-3">
              <span class="text-sm font-medium">{{ form.wasNowEnabled ? 'On' : 'Off' }}</span>
              <Switch id="feature-wasnow" v-model="form.wasNowEnabled" :disabled="saving" aria-label="Enable was/now pricing" />
            </div>
            <p class="text-xs text-muted-foreground">Strikethrough was-price with savings, from your offers</p>
          </div>
          <div class="space-y-2">
            <Label for="feature-comments">Vehicle comments</Label>
            <div class="flex h-10 items-center justify-between gap-3 rounded-md border border-input px-3">
              <span class="text-sm font-medium">{{ form.commentsEnabled ? 'On' : 'Off' }}</span>
              <Switch id="feature-comments" v-model="form.commentsEnabled" :disabled="saving" aria-label="Enable vehicle comments" />
            </div>
            <p class="text-xs text-muted-foreground">Scrolling comment strip on the card</p>
          </div>
          <div class="space-y-2">
            <Label for="feature-badges">Vehicle badges</Label>
            <div class="flex h-10 items-center justify-between gap-3 rounded-md border border-input px-3">
              <span class="text-sm font-medium">{{ form.badgesEnabled ? 'On' : 'Off' }}</span>
              <Switch id="feature-badges" v-model="form.badgesEnabled" :disabled="saving" aria-label="Enable vehicle badges" />
            </div>
            <p class="text-xs text-muted-foreground">Coloured badge on the card image</p>
          </div>
        </CardContent>
      </Card>

      <!-- Per-vehicle offers -->
      <Card>
        <CardHeader class="gap-4 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
          <div class="space-y-1.5">
            <CardTitle>Per-vehicle offers</CardTitle>
            <CardDescription>Promote specific cars. The live feed price becomes the "Now" price. Dates are optional and inclusive. Per-vehicle offers always beat group offers.</CardDescription>
          <p class="mt-1 flex items-center gap-1.5 text-xs font-medium text-primary"><Info class="h-3.5 w-3.5 shrink-0" /> Shown on: that car’s card everywhere it appears — stock page, homepage slider, favourites and vehicle pages.</p>
          </div>
          <Button :disabled="saving || form.offers.length >= maxOffers" @click="openPicker({ type: 'add' })">
            <Plus class="mr-2 h-4 w-4" /> Add vehicle
          </Button>
        </CardHeader>
        <CardContent>
          <div v-if="!form.offers.length" class="rounded-xl border border-dashed px-6 py-10 text-center">
            <Tags class="mx-auto h-8 w-8 text-muted-foreground" />
            <p class="mt-3 text-sm text-muted-foreground">No vehicle offers yet. Hit "Add vehicle" to pick a car from your stock.</p>
          </div>
          <div v-else class="space-y-4">
            <div v-for="(offer, index) in form.offers" :key="index" class="space-y-4 rounded-lg border p-4">
              <div class="flex items-start justify-between gap-3">
                <div class="flex min-w-0 items-center gap-3">
                  <img
                    v-if="vehicleImage(offer.stockNumber)"
                    :src="vehicleImage(offer.stockNumber)"
                    :alt="vehicleLabel(matchedVehicle(offer.stockNumber))"
                    class="h-12 w-16 shrink-0 rounded-md border object-cover"
                  />
                  <div class="min-w-0">
                    <div class="flex flex-wrap items-center gap-2">
                      <p class="m-0 text-sm font-semibold">Offer {{ index + 1 }}</p>
                      <span :class="[CHIP_BASE, windowStatus(offer.start, offer.end).class]">
                        {{ windowStatus(offer.start, offer.end).label }}
                      </span>
                      <span
                        v-if="offer.badgeText"
                        class="inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white"
                        :style="{ backgroundColor: offer.badgeColor }"
                      >
                        {{ offer.badgeText }}
                      </span>
                    </div>
                    <p v-if="matchedVehicle(offer.stockNumber)" class="m-0 truncate text-xs text-emerald-600">
                      ✓ {{ vehicleLabel(matchedVehicle(offer.stockNumber)) }}
                    </p>
                    <p v-if="offerPreview(offer)" class="m-0 text-xs font-medium text-slate-600">
                      Card will show: {{ offerPreview(offer) }}
                    </p>
                    <p v-else-if="offer.stockNumber && stockLoaded && !matchedVehicle(offer.stockNumber)" class="m-0 text-xs text-amber-600">
                      Not found in the current stock feed — check the stock number.
                    </p>
                    <p v-else-if="isPoaVehicle(offer)" class="m-0 text-xs text-amber-600">
                      This car is POA in the stock feed, so Was/Now pricing won't display on its card. A badge or comment still will.
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" :disabled="saving" :aria-label="`Remove offer ${index + 1}`" @click="removeOffer(index)">
                  <Trash2 class="h-4 w-4 text-destructive" />
                </Button>
              </div>
              <div class="grid items-start gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
              <div class="space-y-2">
                <Label>Card preview</Label>
                <div v-if="offerPreviews[index]" class="pointer-events-none">
                  <ModernVehicleCard :vehicle="offerPreviews[index]!.vehicle" disable-link :promo-preview="offerPreviews[index]!.preview" />
                </div>
                <div v-else class="grid min-h-40 place-items-center rounded-xl border border-dashed px-4 text-center text-xs text-muted-foreground">
                  Pick a car from your stock to see a live preview.
                </div>
                <ul v-if="offerPreviews[index] && offerHiddenNotes(offer).length" class="m-0 list-disc space-y-1 pl-4 text-xs font-medium text-amber-600">
                  <li v-for="note in offerHiddenNotes(offer)" :key="note">{{ note }}</li>
                </ul>
              </div>
              <div class="space-y-4">
              <div class="grid items-start gap-4 md:grid-cols-2">
                <div class="space-y-2">
                  <Label :for="`offer-start-${index}`">Start date (optional)</Label>
                  <AdminDatePicker
                    :id="`offer-start-${index}`"
                    v-model="offer.start"
                    label="Offer start date"
                    placeholder="Starts immediately"
                    clearable
                    :disabled="saving"
                  />
                </div>
                <div class="space-y-2">
                  <Label :for="`offer-end-${index}`">End date (optional)</Label>
                  <AdminDatePicker
                    :id="`offer-end-${index}`"
                    v-model="offer.end"
                    label="Offer end date"
                    placeholder="No end date"
                    :min="offer.start || undefined"
                    clearable
                    :disabled="saving"
                  />
                </div>
              </div>
              <div class="grid gap-4 md:grid-cols-2">
                <div class="space-y-2">
                  <Label :for="`offer-stock-${index}`">Stock number</Label>
                  <div class="flex gap-2">
                    <Input
                      :id="`offer-stock-${index}`"
                      v-model="offer.stockNumber"
                      maxlength="40"
                      list="stock-card-promo-stock-options"
                      placeholder="Type to search stock…"
                      :disabled="saving"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      class="shrink-0"
                      :disabled="saving"
                      :aria-label="`Browse stock for offer ${index + 1}`"
                      @click="openPicker({ type: 'offer', index })"
                    >
                      <Car class="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div class="space-y-2">
                  <Label :for="`offer-was-${index}`">Was price ($)</Label>
                  <Input :id="`offer-was-${index}`" v-model="offer.wasPriceInput" type="number" min="1" inputmode="numeric" placeholder="e.g. 39990" :disabled="saving" />
                  <p class="text-xs text-muted-foreground">The car's live feed price is the "Now" price automatically.</p>
                </div>
                <div class="space-y-2">
                  <Label :for="`offer-badge-${index}`">Badge text</Label>
                  <Input :id="`offer-badge-${index}`" v-model="offer.badgeText" maxlength="32" placeholder="e.g. HOT DEAL" :disabled="saving" />
                </div>
                <AdminColorField :id="`offer-colour-${index}`" v-model="offer.badgeColor" label="Badge colour" :disabled="saving" />
                <div class="space-y-2">
                  <Label :for="`offer-comment-${index}`">Scrolling comment (optional)</Label>
                  <Input :id="`offer-comment-${index}`" v-model="offer.comment" maxlength="200" placeholder="e.g. One owner, full service history" :disabled="saving" />
                  <p class="text-xs text-muted-foreground">Scrolls across the card image, replacing any banner on this car.</p>
                </div>
                <AdminColorField :id="`offer-comment-colour-${index}`" v-model="offer.commentColor" label="Comment colour" :disabled="saving" />
              </div>
              </div>
              </div>
            </div>
          </div>
          <datalist id="stock-card-promo-stock-options">
            <option v-for="option in stockOptions" :key="option.stockNumber" :value="option.stockNumber">
              {{ option.title }} — {{ option.priceDisplay }}
            </option>
          </datalist>
        </CardContent>
      </Card>

      <!-- Group offers -->
      <Card>
        <CardHeader class="gap-4 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
          <div class="space-y-1.5">
            <CardTitle>Group offers</CardTitle>
            <CardDescription>Campaign rules that apply to every matching vehicle — e.g. all Hyundai Tucson, or all Used stock. New arrivals matching the rule are covered automatically. The first matching rule applies.</CardDescription>
            <p class="mt-1 flex items-center gap-1.5 text-xs font-medium text-primary"><Info class="h-3.5 w-3.5 shrink-0" /> Shown on: every matching car’s card, everywhere cards appear.</p>
          </div>
          <Button :disabled="saving || form.groups.length >= maxGroups" @click="addGroup">
            <Plus class="mr-2 h-4 w-4" /> Add group offer
          </Button>
        </CardHeader>
        <CardContent>
          <div v-if="!form.groups.length" class="rounded-xl border border-dashed px-6 py-10 text-center">
            <Layers class="mx-auto h-8 w-8 text-muted-foreground" />
            <p class="mt-3 text-sm text-muted-foreground">No group offers yet. Add one to run a campaign across a whole model range.</p>
          </div>
          <div v-else class="space-y-4">
            <div v-for="(group, index) in form.groups" :key="group.id" class="space-y-4 rounded-lg border p-4">
              <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div class="flex min-w-0 flex-1 items-start gap-3">
                  <Switch v-model="group.enabled" :disabled="saving" class="shrink-0" :aria-label="`Activate group offer ${index + 1}`" />
                  <div class="min-w-0">
                    <div class="flex flex-wrap items-center gap-2">
                      <p class="m-0 text-sm font-semibold">Group offer {{ index + 1 }}</p>
                      <span :class="[CHIP_BASE, group.enabled ? windowStatus(group.start, group.end).class : CHIP_OFF]">
                        {{ group.enabled ? windowStatus(group.start, group.end).label : 'Off' }}
                      </span>
                      <span
                        v-if="group.badgeText"
                        class="inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white"
                        :style="{ backgroundColor: group.badgeColor }"
                      >
                        {{ group.badgeText }}
                      </span>
                    </div>
                    <p class="m-0 text-xs text-muted-foreground">{{ groupSummary(group) }} · {{ groupMatchCount(group) }}</p>
                  </div>
                </div>
                <div class="flex items-center gap-1">
                  <Button variant="ghost" size="icon" :disabled="saving || index === 0" :aria-label="`Move group offer ${index + 1} up`" title="Move up" @click="moveGroup(index, -1)">
                    <ArrowUp class="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" :disabled="saving || index === form.groups.length - 1" :aria-label="`Move group offer ${index + 1} down`" title="Move down" @click="moveGroup(index, 1)">
                    <ArrowDown class="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" :disabled="saving" :aria-label="`Remove group offer ${index + 1}`" title="Delete" @click="removeGroup(index)">
                    <Trash2 class="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
              <div class="grid items-start gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
              <div class="space-y-2">
                <Label>Card preview</Label>
                <div v-if="groupPreviews[index]" class="pointer-events-none">
                  <ModernVehicleCard :vehicle="groupPreviews[index]!.vehicle" disable-link :promo-preview="groupPreviews[index]!.preview" />
                </div>
                <div v-else class="grid min-h-40 place-items-center rounded-xl border border-dashed px-4 text-center text-xs text-muted-foreground">
                  {{ stockLoaded ? 'No cars in stock match this offer yet — the preview appears when one does.' : 'Checking stock…' }}
                </div>
                <ul v-if="groupPreviews[index] && groupHiddenNotes(group).length" class="m-0 list-disc space-y-1 pl-4 text-xs font-medium text-amber-600">
                  <li v-for="note in groupHiddenNotes(group)" :key="note">{{ note }}</li>
                </ul>
              </div>
              <div class="space-y-4">
              <div class="grid items-start gap-4 md:grid-cols-2">
                <div class="space-y-2">
                  <Label :for="`group-start-${index}`">Start date (optional)</Label>
                  <AdminDatePicker
                    :id="`group-start-${index}`"
                    v-model="group.start"
                    label="Group offer start date"
                    placeholder="Starts immediately"
                    clearable
                    :disabled="saving"
                  />
                </div>
                <div class="space-y-2">
                  <Label :for="`group-end-${index}`">End date (optional)</Label>
                  <AdminDatePicker
                    :id="`group-end-${index}`"
                    v-model="group.end"
                    label="Group offer end date"
                    placeholder="No end date"
                    :min="group.start || undefined"
                    clearable
                    :disabled="saving"
                  />
                </div>
              </div>
              <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <div class="space-y-2">
                  <Label :for="`group-make-${index}`">Make</Label>
                  <Select :model-value="group.make || ANY" :disabled="saving" @update:model-value="group.make = fromAny($event)">
                    <SelectTrigger :id="`group-make-${index}`" class="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem :value="ANY">Any make</SelectItem>
                      <SelectItem v-for="make in makeOptions" :key="make" :value="make">{{ make }}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div class="space-y-2">
                  <Label :for="`group-model-${index}`">Model</Label>
                  <Select :model-value="group.model || ANY" :disabled="saving" @update:model-value="group.model = fromAny($event)">
                    <SelectTrigger :id="`group-model-${index}`" class="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem :value="ANY">Any model</SelectItem>
                      <SelectItem v-for="model in modelOptions(group.make)" :key="model" :value="model">{{ model }}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div class="space-y-2">
                  <Label :for="`group-variant-${index}`">Variant</Label>
                  <Select :model-value="group.variant || ANY" :disabled="saving" @update:model-value="group.variant = fromAny($event)">
                    <SelectTrigger :id="`group-variant-${index}`" class="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem :value="ANY">Any variant</SelectItem>
                      <SelectItem v-for="variant in variantOptions(group.make, group.model)" :key="variant" :value="variant">{{ variant }}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div class="space-y-2">
                  <Label :for="`group-condition-${index}`">Condition</Label>
                  <Select :model-value="group.condition || ANY" :disabled="saving" @update:model-value="group.condition = fromAny($event)">
                    <SelectTrigger :id="`group-condition-${index}`" class="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem :value="ANY">Any condition</SelectItem>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="demo">Demo</SelectItem>
                      <SelectItem value="used">Used</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div class="space-y-2">
                  <Label :for="`group-fuel-${index}`">Fuel type</Label>
                  <Select :model-value="group.fuelType || ANY" :disabled="saving" @update:model-value="group.fuelType = fromAny($event)">
                    <SelectTrigger :id="`group-fuel-${index}`" class="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem :value="ANY">Any fuel type</SelectItem>
                      <SelectItem v-for="fuelOption in FUEL_TYPE_ORDER" :key="fuelOption" :value="fuelOption">{{ fuelTypeLabel(fuelOption) }}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div class="space-y-2">
                  <Label :for="`group-discount-type-${index}`">Discount</Label>
                  <Select :model-value="group.discountType || 'none'" :disabled="saving" @update:model-value="group.discountType = $event === 'none' ? '' : String($event ?? '')">
                    <SelectTrigger :id="`group-discount-type-${index}`" class="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No price change</SelectItem>
                      <SelectItem value="amount">$ off (shows Was/Now)</SelectItem>
                      <SelectItem value="percent">% off (shows Was/Now)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div class="space-y-2">
                  <Label :for="`group-discount-value-${index}`">{{ group.discountType === 'percent' ? 'Percent off' : 'Amount off ($)' }}</Label>
                  <Input
                    :id="`group-discount-value-${index}`"
                    v-model="group.discountValueInput"
                    type="number"
                    min="1"
                    inputmode="numeric"
                    :placeholder="group.discountType === 'percent' ? 'e.g. 10' : 'e.g. 3000'"
                    :disabled="saving || !group.discountType"
                  />
                </div>
                <div class="space-y-2">
                  <Label :for="`group-badge-${index}`">Badge text</Label>
                  <Input :id="`group-badge-${index}`" v-model="group.badgeText" maxlength="32" placeholder="e.g. EOFY SALE" :disabled="saving" />
                </div>
                <AdminColorField :id="`group-colour-${index}`" v-model="group.badgeColor" label="Badge colour" :disabled="saving" />
                <div class="space-y-2 xl:col-span-2">
                  <Label :for="`group-comment-${index}`">Scrolling comment (optional)</Label>
                  <Input :id="`group-comment-${index}`" v-model="group.comment" maxlength="200" placeholder="e.g. $3,000 off all MY24 Tucson" :disabled="saving" />
                  <p class="text-xs text-muted-foreground">Scrolls across the card image, replacing any banner on matching cars.</p>
                </div>
                <AdminColorField :id="`group-comment-colour-${index}`" v-model="group.commentColor" label="Comment colour" :disabled="saving" />
              </div>
              </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Alert v-if="saveErrors.length" variant="destructive">
        <AlertTriangle class="h-4 w-4" />
        <AlertTitle>Review the promotion settings</AlertTitle>
        <AlertDescription>
          <ul class="list-disc space-y-1 pl-5">
            <li v-for="message in saveErrors" :key="message">{{ message }}</li>
          </ul>
        </AlertDescription>
      </Alert>

      <div class="sticky bottom-2 z-20 flex flex-col items-stretch gap-5 rounded-xl border bg-card/95 px-4 py-3.5 shadow-xl backdrop-blur-xl min-[701px]:bottom-4 min-[701px]:flex-row min-[701px]:items-center min-[701px]:justify-between">
        <div>
          <p class="text-sm font-semibold">Ready to publish?</p>
          <p class="text-xs text-muted-foreground">Changes go live on the website within about a minute of saving.</p>
        </div>
        <Button :disabled="saving" @click="saveSettings">
          <Loader2 v-if="saving" class="mr-2 h-4 w-4 animate-spin" />
          <Save v-else class="mr-2 h-4 w-4" />
          {{ saving ? 'Publishing…' : 'Save promotions' }}
        </Button>
      </div>
    </template>

    <StockVehiclePickerDialog
      v-model:open="pickerOpen"
      :vehicles="stockOptions"
      @select="onVehiclePicked"
    />

    <MediaLibraryDialog
      v-model:open="mediaLibraryOpen"
      select-mode
      :allowed-types="acceptedImageTypes"
      @select="selectMedia"
    />

    <Dialog :open="!!imagePreview" @update:open="imagePreview = null">
      <DialogContent class="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{{ imagePreview?.alt }}</DialogTitle>
        </DialogHeader>
        <img
          v-if="imagePreview"
          :src="imagePreview.url"
          :alt="imagePreview.alt"
          class="max-h-[75vh] w-full rounded-md object-contain"
        />
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Car,
  ExternalLink,
  Images,
  Info,
  Layers,
  Loader2,
  Megaphone,
  Plus,
  RefreshCw,
  Save,
  Tags,
  Trash2,
  Upload,
  X,
} from 'lucide-vue-next';
import {
  STOCK_CARD_PROMO_DEFAULT_INTERVAL,
  STOCK_CARD_PROMO_MAX_GROUPS,
  STOCK_CARD_PROMO_MAX_INTERVAL,
  STOCK_CARD_PROMO_MAX_SCROLLERS,
  STOCK_CARD_PROMO_MIN_INTERVAL,
  isPromoWindowActive,
  normalizeFuelType,
  promoNow,
  resolveCardPromo,
  resolveCardScroller,
  type CardPromoPreview,
  type PromoCondition,
  type PromoFuelType,
  type StockCardPromoSettings,
} from '~~/shared/stockCardPromo';
import ModernVehicleCard from '~/components/search/ModernVehicleCard.vue';
import BannerMarqueePreview from '~/components/admin/settings/BannerMarqueePreview.vue';
import AdminColorField from '~/components/admin/settings/AdminColorField.vue';
import StockVehiclePickerDialog, { type StockPickerOption } from '~/components/admin/settings/StockVehiclePickerDialog.vue';
import AdminDatePicker from '~/components/admin/AdminDatePicker.vue';
import MediaLibraryDialog from '~/components/media/MediaLibraryDialog.vue';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '~/components/ui/dialog';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
import { Switch } from '~/components/ui/switch';

definePageMeta({ layout: 'admin', middleware: 'auth' });

const ANY = '__any__';
// Sentinel shown when a legacy banner still targets several conditions/fuels at
// once (saved back when these were checkboxes); picking any real option replaces it.
const MULTI = '__multi__';

const FUEL_TYPE_ORDER = ['petrol', 'diesel', 'hybrid', 'electric'] as const;

const CHIP_BASE = 'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider';
const CHIP_LIVE = 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400';
const CHIP_SCHEDULED = 'bg-blue-500/10 text-blue-700 dark:text-blue-400';
const CHIP_OFF = 'bg-slate-500/15 text-slate-600 dark:text-slate-400';

type SettingsResponse = {
  source: 'custom' | 'default';
  settings: StockCardPromoSettings;
  limits: {
    maxOffers: number;
    maxGroups: number;
    maxGraphics: number;
    minInterval: number;
    maxInterval: number;
    acceptedImageTypes: string[];
  };
};
type MediaFile = { url: string; contentType?: string };
type ImageTarget =
  | { kind: 'graphic'; index: number; field: 'image' | 'mobileImage' }
  | { kind: 'header'; field: 'desktop' | 'mobile' };
type PickerTarget = { type: 'add' } | { type: 'offer'; index: number };

interface OfferForm {
  stockNumber: string;
  wasPriceInput: string;
  comment: string;
  commentColor: string;
  badgeText: string;
  badgeColor: string;
  start: string;
  end: string;
}

interface GroupForm {
  id: string;
  enabled: boolean;
  make: string;
  model: string;
  variant: string;
  condition: string;
  fuelType: string;
  discountType: string;
  discountValueInput: string;
  comment: string;
  commentColor: string;
  badgeText: string;
  badgeColor: string;
  start: string;
  end: string;
}

interface GraphicForm {
  id: string;
  enabled: boolean;
  image: string;
  mobileImage: string;
  link: string;
  heading: string;
  subheading: string;
  start: string;
  end: string;
}

interface HeaderForm {
  enabled: boolean;
  desktop: string;
  mobile: string;
  link: string;
  alt: string;
  start: string;
  end: string;
}

interface BannerForm {
  id: string;
  enabled: boolean;
  text: string;
  color: string;
  make: string;
  model: string;
  variant: string;
  conditions: string[];
  fuelTypes: string[];
  start: string;
  end: string;
}

interface PromoForm {
  wasNowEnabled: boolean;
  commentsEnabled: boolean;
  badgesEnabled: boolean;
  scrollers: BannerForm[];
  offers: OfferForm[];
  groups: GroupForm[];
  graphics: { enabled: boolean; interval: number; start: string; end: string; items: GraphicForm[] };
  stockHeader: HeaderForm;
}

const { toast } = useToast();
const settingsRequest = await useFetch<SettingsResponse>('/api/admin/settings/stock-card-promo');

// Live stock for the vehicle picker (client-only; the feed response is large)
const stockRequest = useFetch<{ vehiclesData: any[] }>('/api/carsales-feed', {
  key: 'stock-card-promo-stock-feed',
  server: false,
  lazy: true,
  default: () => ({ vehiclesData: [] }),
});

const loading = computed(() => settingsRequest.pending.value);
const loadError = computed(() => settingsRequest.error.value?.message || '');
const maxOffers = computed(() => settingsRequest.data.value?.limits.maxOffers || 200);
const maxGroups = computed(() => settingsRequest.data.value?.limits.maxGroups || STOCK_CARD_PROMO_MAX_GROUPS);
const maxGraphics = computed(() => settingsRequest.data.value?.limits.maxGraphics || 6);
const acceptedImageTypes = computed(() => settingsRequest.data.value?.limits.acceptedImageTypes || [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
]);
const intervalOptions = Array.from(
  { length: STOCK_CARD_PROMO_MAX_INTERVAL - STOCK_CARD_PROMO_MIN_INTERVAL + 1 },
  (_, index) => STOCK_CARD_PROMO_MIN_INTERVAL + index,
);

const form = ref<PromoForm>(toForm(settingsRequest.data.value?.settings));
const saving = ref(false);
const saveErrors = ref<string[]>([]);
const mediaLibraryOpen = ref(false);
const imageTarget = ref<ImageTarget | null>(null);
const imagePreview = ref<{ url: string; alt: string } | null>(null);
const pickerOpen = ref(false);
const pickerTarget = ref<PickerTarget | null>(null);

// --- Live stock helpers ---

const stockLoaded = computed(() => stockRequest.status.value === 'success');

const stockOptions = computed<StockPickerOption[]>(() => {
  const vehicles = stockRequest.data.value?.vehiclesData || [];
  return vehicles
    .map((vehicle: any) => {
      const stockNumber = String(vehicle.stockid || vehicle.identifier || vehicle.id || '').trim();
      if (!stockNumber) return null;
      return {
        stockNumber,
        title: vehicleTitle(vehicle),
        priceDisplay: vehiclePrice(vehicle),
        image: vehicle.images?.[0] || vehicle.thumb || vehicle.main_photo_url || '',
        vehicle,
      };
    })
    .filter(Boolean) as StockPickerOption[];
});

const stockIndex = computed(() => {
  const index = new Map<string, any>();
  for (const option of stockOptions.value) {
    index.set(option.stockNumber.toLowerCase(), option.vehicle);
  }
  return index;
});

function matchedVehicle(stockNumber: string) {
  return stockIndex.value.get(stockNumber.trim().toLowerCase()) || null;
}

function vehicleImage(stockNumber: string): string {
  const vehicle = matchedVehicle(stockNumber);
  return vehicle ? (vehicle.images?.[0] || vehicle.thumb || vehicle.main_photo_url || '') : '';
}

function windowStatus(start: string, end: string): { label: string; class: string } {
  // Evaluate in dealer time with the same inclusive DD-MM-YYYY logic the site
  // uses, so the chip agrees with what visitors actually see.
  const now = promoNow();
  if (isPromoWindowActive(toAuDate(start), toAuDate(end), now)) {
    return { label: 'Live now', class: CHIP_LIVE };
  }
  const startDate = start ? new Date(`${start}T00:00:00`) : null;
  if (startDate && startDate > now) return { label: 'Scheduled', class: CHIP_SCHEDULED };
  return { label: 'Expired', class: CHIP_OFF };
}

function toAuDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : value;
}

interface StockTarget {
  make: string;
  model: string;
  variant: string;
  conditions: string[];
  fuelTypes: string[];
}

function matchingStock(target: StockTarget) {
  return stockOptions.value.filter((option) => {
    const vehicle = option.vehicle;
    const matches = (wanted: string, actual: string) =>
      !wanted || wanted.trim().toLowerCase() === (actual || '').trim().toLowerCase();
    const condition = fieldValue(vehicle?.condition).toLowerCase();
    const normalized = condition.includes('demo') ? 'demo' : condition.includes('new') ? 'new' : condition.includes('used') ? 'used' : '';
    return matches(target.make, fieldValue(vehicle?.make))
      && matches(target.model, fieldValue(vehicle?.model))
      && matches(target.variant, fieldValue(vehicle?.badge) || fieldValue(vehicle?.variant))
      && (!target.conditions.length || target.conditions.includes(normalized))
      && (!target.fuelTypes.length || target.fuelTypes.includes(normalizeFuelType(fieldValue(vehicle?.fuel))));
  });
}

function targetMatchCount(target: StockTarget): string {
  if (!stockLoaded.value) return 'checking stock…';
  const count = matchingStock(target).length;
  return count === 1 ? 'matches 1 car right now' : `matches ${count} cars right now`;
}

function groupMatchCount(group: GroupForm): string {
  return targetMatchCount(groupTarget(group));
}

function groupTarget(group: GroupForm): StockTarget {
  return {
    make: group.make,
    model: group.model,
    variant: group.variant,
    conditions: group.condition ? [group.condition] : [],
    fuelTypes: group.fuelType ? [group.fuelType] : [],
  };
}

// --- Live card previews (unsaved form state rendered on the real card) ---

function previewAttrs(vehicle: any) {
  return {
    stockNumber: String(vehicle?.stockid || vehicle?.identifier || vehicle?.id || ''),
    make: fieldValue(vehicle?.make),
    model: fieldValue(vehicle?.model),
    variant: fieldValue(vehicle?.badge) || fieldValue(vehicle?.variant),
    condition: fieldValue(vehicle?.condition),
    fuel: fieldValue(vehicle?.fuel),
    price: numericVehiclePrice(vehicle),
  };
}

/** The feed sends price as a string for some cars; treat both forms as one number. */
function numericVehiclePrice(vehicle: any): number {
  const price = typeof vehicle?.price === 'string' ? parseFloat(vehicle.price) : vehicle?.price;
  return Number.isFinite(price) && price > 0 ? price : 0;
}

function previewScrollerFor(vehicle: any) {
  return resolveCardScroller(
    {
      scrollers: form.value.scrollers.map((banner) => ({
        ...banner,
        conditions: banner.conditions as PromoCondition[],
        fuelTypes: banner.fuelTypes as PromoFuelType[],
        start: toAuDate(banner.start),
        end: toAuDate(banner.end),
      })),
    },
    previewAttrs(vehicle),
    promoNow(),
  );
}

function previewFlags() {
  return {
    wasNowEnabled: form.value.wasNowEnabled,
    commentsEnabled: form.value.commentsEnabled,
    badgesEnabled: form.value.badgesEnabled,
  };
}

/** Content the dealer typed that the preview (and the site) hides because a master switch is off. */
function hiddenPreviewNotes(content: { wasPrice: boolean; badge: boolean; comment: boolean }): string[] {
  const notes: string[] = [];
  if (content.wasPrice && !form.value.wasNowEnabled) notes.push('Was/Now price hidden — switch on "Was / Now pricing" in Offer display below.');
  if (content.badge && !form.value.badgesEnabled) notes.push('Badge hidden — switch on "Vehicle badges" in Offer display below.');
  if (content.comment && !form.value.commentsEnabled) notes.push('Comment hidden — switch on "Vehicle comments" in Offer display below.');
  return notes;
}

function offerHiddenNotes(offer: OfferForm): string[] {
  return hiddenPreviewNotes({
    wasPrice: !!offer.wasPriceInput.trim(),
    badge: !!offer.badgeText.trim(),
    comment: !!offer.comment.trim(),
  });
}

function groupHiddenNotes(group: GroupForm): string[] {
  return hiddenPreviewNotes({
    wasPrice: !!group.discountType && !!group.discountValueInput.trim(),
    badge: !!group.badgeText.trim(),
    comment: !!group.comment.trim(),
  });
}

/** Dates are ignored so a scheduled offer still previews its final look. */
const offerPreviews = computed<Array<{ vehicle: any; preview: CardPromoPreview } | null>>(() =>
  form.value.offers.map((offer) => {
    const vehicle = matchedVehicle(offer.stockNumber);
    if (!vehicle) return null;
    const wasPrice = Number(offer.wasPriceInput);
    return {
      vehicle,
      preview: {
        offer: {
          wasPrice: Number.isFinite(wasPrice) && wasPrice > 0 ? Math.round(wasPrice) : null,
          comment: offer.comment,
          commentColor: offer.commentColor,
          badgeText: offer.badgeText,
          badgeColor: offer.badgeColor,
          source: 'stock' as const,
        },
        scroller: previewScrollerFor(vehicle),
        ...previewFlags(),
      },
    };
  }),
);

const groupPreviews = computed<Array<{ vehicle: any; preview: CardPromoPreview } | null>>(() =>
  form.value.groups.map((group) => {
    const vehicle = matchingStock(groupTarget(group))[0]?.vehicle;
    if (!vehicle) return null;
    const resolved = resolveCardPromo(
      {
        offers: [],
        groups: [{
          id: group.id,
          enabled: true,
          make: group.make,
          model: group.model,
          variant: group.variant,
          condition: group.condition as '' | PromoCondition,
          fuelType: group.fuelType as '' | PromoFuelType,
          discountType: group.discountType as '' | 'amount' | 'percent',
          discountValue: group.discountValueInput.trim() ? Number(group.discountValueInput) : null,
          comment: group.comment,
          commentColor: group.commentColor,
          badgeText: group.badgeText,
          badgeColor: group.badgeColor,
          start: '',
          end: '',
        }],
      },
      previewAttrs(vehicle),
      promoNow(),
    );
    return {
      vehicle,
      preview: { offer: resolved, scroller: previewScrollerFor(vehicle), ...previewFlags() },
    };
  }),
);

function fieldValue(field: any): string {
  return field?.displayValue?.[0] || field?.value?.[0] || '';
}

function vehicleTitle(vehicle: any): string {
  return [fieldValue(vehicle?.year), fieldValue(vehicle?.make), fieldValue(vehicle?.model)]
    .filter(Boolean)
    .join(' ') || 'Vehicle';
}

function vehiclePrice(vehicle: any): string {
  const price = numericVehiclePrice(vehicle);
  return price ? `$${price.toLocaleString()}` : 'POA';
}

function vehicleLabel(vehicle: any): string {
  if (!vehicle) return '';
  return `${vehicleTitle(vehicle)} — Now ${vehiclePrice(vehicle)}`;
}

function isPoaVehicle(offer: OfferForm): boolean {
  const vehicle = matchedVehicle(offer.stockNumber);
  return !!vehicle && !numericVehiclePrice(vehicle);
}

function offerPreview(offer: OfferForm): string {
  const vehicle = matchedVehicle(offer.stockNumber);
  const wasPrice = Number(offer.wasPriceInput);
  const nowPrice = numericVehiclePrice(vehicle);
  if (!vehicle || !Number.isFinite(wasPrice) || wasPrice <= 0 || !nowPrice) return '';
  if (wasPrice <= nowPrice) return `Was price must be above the live price ($${nowPrice.toLocaleString()}) to display.`;
  return `Was $${wasPrice.toLocaleString()} · Save $${(wasPrice - nowPrice).toLocaleString()} · Now $${nowPrice.toLocaleString()}`;
}

// Cascading target options for group offers
const makeOptions = computed(() => uniqueSorted(stockOptions.value.map((option) => fieldValue(option.vehicle?.make))));

function modelOptions(make: string) {
  return uniqueSorted(
    stockOptions.value
      .filter((option) => !make || fieldValue(option.vehicle?.make).toLowerCase() === make.toLowerCase())
      .map((option) => fieldValue(option.vehicle?.model)),
  );
}

function variantOptions(make: string, model: string) {
  return uniqueSorted(
    stockOptions.value
      .filter((option) =>
        (!make || fieldValue(option.vehicle?.make).toLowerCase() === make.toLowerCase())
        && (!model || fieldValue(option.vehicle?.model).toLowerCase() === model.toLowerCase()))
      .map((option) => fieldValue(option.vehicle?.badge) || fieldValue(option.vehicle?.variant))
      .filter((variant) => variant && !variant.toLowerCase().includes('no badge')),
  );
}

function uniqueSorted(values: string[]) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

// The dropdowns are single-select, but the stored shape stays an array so
// older saves with multiple ticked values still load and match.
function setBannerCondition(banner: BannerForm, value: unknown) {
  if (value === MULTI) return;
  const condition = fromAny(value);
  banner.conditions = condition ? [condition] : [];
}

function setBannerFuelType(banner: BannerForm, value: unknown) {
  if (value === MULTI) return;
  const fuelType = fromAny(value);
  banner.fuelTypes = fuelType ? [fuelType] : [];
}

function bannerConditionValue(banner: BannerForm) {
  return banner.conditions.length > 1 ? MULTI : (banner.conditions[0] || ANY);
}

function bannerFuelValue(banner: BannerForm) {
  return banner.fuelTypes.length > 1 ? MULTI : (banner.fuelTypes[0] || ANY);
}

function conditionLabel(condition: string) {
  return condition.charAt(0).toUpperCase() + condition.slice(1);
}

const maxScrollers = STOCK_CARD_PROMO_MAX_SCROLLERS;

function addBanner() {
  if (form.value.scrollers.length >= maxScrollers) return;
  form.value.scrollers.push({
    id: `banner-${Date.now()}-${form.value.scrollers.length + 1}`,
    enabled: true,
    text: '',
    color: '#e11d48',
    make: '',
    model: '',
    variant: '',
    conditions: [],
    fuelTypes: [],
    start: '',
    end: '',
  });
}

function removeBanner(index: number) {
  form.value.scrollers.splice(index, 1);
}

// Banners and group offers are first-match-wins, so order matters.
function moveListItem<T>(items: T[], index: number, delta: number) {
  const target = index + delta;
  if (target < 0 || target >= items.length) return;
  const [item] = items.splice(index, 1);
  items.splice(target, 0, item!);
}

function moveBanner(index: number, delta: number) {
  moveListItem(form.value.scrollers, index, delta);
}

function moveGroup(index: number, delta: number) {
  moveListItem(form.value.groups, index, delta);
}

function bannerSummary(banner: BannerForm) {
  return [
    banner.make || 'Any make',
    banner.model,
    banner.variant,
    banner.conditions.map((condition) => condition.toUpperCase()).join(' + '),
    banner.fuelTypes.map(fuelTypeLabel).join(' + '),
  ].filter(Boolean).join(' · ');
}

function bannerMatchCount(banner: BannerForm): string {
  return targetMatchCount(banner);
}

function fuelTypeLabel(fuel: string) {
  return fuel.charAt(0).toUpperCase() + fuel.slice(1);
}

function fromAny(value: unknown) {
  const selected = String(value ?? '');
  return selected === ANY ? '' : selected;
}

function groupSummary(group: GroupForm) {
  const target = [group.make || 'Any make', group.model, group.variant, group.condition && group.condition.toUpperCase(), group.fuelType && fuelTypeLabel(group.fuelType)]
    .filter(Boolean)
    .join(' · ');
  const discount = group.discountType === 'amount' && group.discountValueInput
    ? ` — $${Number(group.discountValueInput).toLocaleString()} off`
    : group.discountType === 'percent' && group.discountValueInput
      ? ` — ${group.discountValueInput}% off`
      : '';
  return `${target}${discount}`;
}

function intervalLabel(interval: number) {
  const ordinal = interval === 2 ? '2nd' : interval === 3 ? '3rd' : `${interval}th`;
  return `Every ${ordinal} card`;
}

const intervalModel = computed({
  get: () => String(form.value.graphics.interval || STOCK_CARD_PROMO_DEFAULT_INTERVAL),
  set: (value: string) => {
    form.value.graphics.interval = Number(value) || STOCK_CARD_PROMO_DEFAULT_INTERVAL;
  },
});

// --- Form state ---

function toForm(settings?: StockCardPromoSettings | null): PromoForm {
  return {
    wasNowEnabled: settings?.wasNowEnabled === true,
    commentsEnabled: settings?.commentsEnabled === true,
    badgesEnabled: settings?.badgesEnabled === true,
    scrollers: (settings?.scrollers || []).map((banner) => ({
      id: banner.id,
      enabled: banner.enabled !== false,
      text: banner.text,
      color: banner.color || '#e11d48',
      make: banner.make,
      model: banner.model,
      variant: banner.variant,
      conditions: [...banner.conditions],
      fuelTypes: [...banner.fuelTypes],
      start: toIsoDate(banner.start || ''),
      end: toIsoDate(banner.end || ''),
    })),
    offers: (settings?.offers || []).map((offer) => ({
      stockNumber: offer.stockNumber,
      wasPriceInput: offer.wasPrice ? String(offer.wasPrice) : '',
      comment: offer.comment,
      commentColor: offer.commentColor || '#e11d48',
      badgeText: offer.badgeText,
      badgeColor: offer.badgeColor || '#e11d48',
      start: toIsoDate(offer.start || ''),
      end: toIsoDate(offer.end || ''),
    })),
    groups: (settings?.groups || []).map((rule) => ({
      id: rule.id,
      enabled: rule.enabled !== false,
      make: rule.make,
      model: rule.model,
      variant: rule.variant,
      condition: rule.condition,
      fuelType: rule.fuelType,
      discountType: rule.discountType,
      discountValueInput: rule.discountValue ? String(rule.discountValue) : '',
      comment: rule.comment,
      commentColor: rule.commentColor || '#e11d48',
      badgeText: rule.badgeText,
      badgeColor: rule.badgeColor || '#e11d48',
      start: toIsoDate(rule.start || ''),
      end: toIsoDate(rule.end || ''),
    })),
    graphics: {
      enabled: settings?.graphics.enabled === true,
      interval: settings?.graphics.interval || STOCK_CARD_PROMO_DEFAULT_INTERVAL,
      start: toIsoDate(settings?.graphics.start || ''),
      end: toIsoDate(settings?.graphics.end || ''),
      items: (settings?.graphics.items || []).map((item) => ({
        ...item,
        start: toIsoDate(item.start || ''),
        end: toIsoDate(item.end || ''),
      })),
    },
    stockHeader: {
      enabled: settings?.stockHeader.enabled === true,
      desktop: settings?.stockHeader.desktop || '',
      mobile: settings?.stockHeader.mobile || '',
      link: settings?.stockHeader.link || '',
      alt: settings?.stockHeader.alt || '',
      start: toIsoDate(settings?.stockHeader.start || ''),
      end: toIsoDate(settings?.stockHeader.end || ''),
    },
  };
}

function addOffer(stockNumber = '') {
  if (form.value.offers.length >= maxOffers.value) return;
  form.value.offers.push({
    stockNumber,
    wasPriceInput: '',
    comment: '',
    commentColor: '#e11d48',
    badgeText: '',
    badgeColor: '#e11d48',
    start: '',
    end: '',
  });
  enableOfferDisplay();
}

/** Adding an offer means the dealer wants it seen — flip the master switches on for them. */
function enableOfferDisplay() {
  form.value.wasNowEnabled = true;
  form.value.commentsEnabled = true;
  form.value.badgesEnabled = true;
}

function removeOffer(index: number) {
  form.value.offers.splice(index, 1);
}

function addGroup() {
  if (form.value.groups.length >= maxGroups.value) return;
  form.value.groups.push({
    id: `group-${Date.now()}-${form.value.groups.length + 1}`,
    enabled: true,
    make: '',
    model: '',
    variant: '',
    condition: '',
    fuelType: '',
    discountType: '',
    discountValueInput: '',
    comment: '',
    commentColor: '#e11d48',
    badgeText: '',
    badgeColor: '#e11d48',
    start: '',
    end: '',
  });
  enableOfferDisplay();
}

function removeGroup(index: number) {
  form.value.groups.splice(index, 1);
}

function addGraphic() {
  if (form.value.graphics.items.length >= maxGraphics.value) return;
  form.value.graphics.items.push({
    id: `graphic-${Date.now()}-${form.value.graphics.items.length + 1}`,
    enabled: true,
    image: '',
    mobileImage: '',
    link: '',
    heading: '',
    subheading: '',
    start: '',
    end: '',
  });
}

function removeGraphic(index: number) {
  if (!window.confirm(`Remove graphic ${index + 1}? The image remains available in the media library.`)) return;
  form.value.graphics.items.splice(index, 1);
}

// --- Vehicle picker ---

function openPicker(target: PickerTarget) {
  pickerTarget.value = target;
  pickerOpen.value = true;
}

function onVehiclePicked(option: StockPickerOption) {
  const target = pickerTarget.value;
  if (!target) return;
  if (target.type === 'add') {
    addOffer(option.stockNumber);
  } else {
    const offer = form.value.offers[target.index];
    if (offer) offer.stockNumber = option.stockNumber;
  }
  pickerTarget.value = null;
}

// --- Media library ---

function chooseImage(target: ImageTarget) {
  imageTarget.value = target;
  mediaLibraryOpen.value = true;
}

function selectMedia(file: MediaFile) {
  const target = imageTarget.value;
  if (!target || !file.url) return;
  if (target.kind === 'graphic') {
    const graphic = form.value.graphics.items[target.index];
    if (graphic) graphic[target.field] = file.url;
  } else {
    form.value.stockHeader[target.field] = file.url;
  }
  imageTarget.value = null;
}

// --- Save ---

function toPayload() {
  return {
    wasNowEnabled: form.value.wasNowEnabled,
    commentsEnabled: form.value.commentsEnabled,
    badgesEnabled: form.value.badgesEnabled,
    scrollers: form.value.scrollers.map((banner) => ({ ...banner })),
    offers: form.value.offers
      .filter((offer) => offer.stockNumber.trim())
      .map((offer) => ({
        stockNumber: offer.stockNumber,
        wasPrice: offer.wasPriceInput.trim() ? Number(offer.wasPriceInput) : null,
        comment: offer.comment,
        commentColor: offer.commentColor,
        badgeText: offer.badgeText,
        badgeColor: offer.badgeColor,
        start: offer.start,
        end: offer.end,
      })),
    groups: form.value.groups.map((group) => ({
      id: group.id,
      enabled: group.enabled,
      make: group.make,
      model: group.model,
      variant: group.variant,
      condition: group.condition,
      fuelType: group.fuelType,
      discountType: group.discountType,
      discountValue: group.discountValueInput.trim() ? Number(group.discountValueInput) : null,
      comment: group.comment,
      commentColor: group.commentColor,
      badgeText: group.badgeText,
      badgeColor: group.badgeColor,
      start: group.start,
      end: group.end,
    })),
    graphics: {
      enabled: form.value.graphics.enabled,
      interval: form.value.graphics.interval,
      start: form.value.graphics.start,
      end: form.value.graphics.end,
      // The section's single switch and window govern the whole set now, so
      // legacy per-item toggles, dates and mobile artwork are cleared on save.
      items: form.value.graphics.items.map((item) => ({
        ...item,
        enabled: true,
        mobileImage: '',
        start: '',
        end: '',
      })),
    },
    stockHeader: { ...form.value.stockHeader },
  };
}

async function saveSettings() {
  saving.value = true;
  saveErrors.value = [];
  try {
    const response = await $fetch<{ settings: StockCardPromoSettings; message: string }>(
      '/api/admin/settings/stock-card-promo',
      { method: 'PUT', body: toPayload() },
    );
    form.value = toForm(response.settings);
    toast.success(response.message);
  } catch (error: any) {
    saveErrors.value = Array.isArray(error?.data?.data?.errors)
      ? error.data.data.errors
      : [error?.data?.message || error?.message || 'Unable to save stock card promotion settings'];
  } finally {
    saving.value = false;
  }
}

async function reloadFromServer() {
  await settingsRequest.refresh();
  form.value = toForm(settingsRequest.data.value?.settings);
  saveErrors.value = [];
}

function previewStockPage() {
  window.open('/car-sales?refresh=true', '_blank', 'noopener,noreferrer');
}

function toIsoDate(value: string) {
  if (!value) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const match = /^(\d{2})-(\d{2})-(\d{4})$/.exec(value);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : '';
}
</script>
