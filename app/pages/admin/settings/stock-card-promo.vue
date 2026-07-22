<template>
  <div class="mx-auto max-w-[1200px] space-y-6 text-foreground">
    <AdminPageHeader
      eyebrow="Website content"
      title="Stock card promotions"
      description="Was/Now pricing, badges, comments, group campaigns, a scrolling banner, promo graphics and the stock page header."
    >
      <template #actions>
        <Button variant="outline" :disabled="loading || saving" @click="reloadFromServer">
          <RefreshCw class="mr-2 h-4 w-4" /> Refresh data
        </Button>
        <Button variant="outline" @click="previewHomepage">
          <ExternalLink class="mr-2 h-4 w-4" /> Preview homepage
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
      <!-- Card feature toggles -->
      <Card>
        <CardHeader>
          <CardTitle>Card features</CardTitle>
          <CardDescription>These switches control what vehicle cards can display across the website. Everything stays hidden until switched on.</CardDescription>
        </CardHeader>
        <CardContent class="grid gap-4 md:grid-cols-3">
          <div class="flex items-center justify-between gap-3 rounded-lg border p-4">
            <div>
              <p class="text-sm font-medium">Was / Now pricing</p>
              <p class="text-xs text-muted-foreground">Strikethrough was-price with savings</p>
            </div>
            <Switch v-model="form.wasNowEnabled" :disabled="saving" aria-label="Enable was/now pricing" />
          </div>
          <div class="flex items-center justify-between gap-3 rounded-lg border p-4">
            <div>
              <p class="text-sm font-medium">Vehicle comments</p>
              <p class="text-xs text-muted-foreground">Scrolling comment strip on the card</p>
            </div>
            <Switch v-model="form.commentsEnabled" :disabled="saving" aria-label="Enable vehicle comments" />
          </div>
          <div class="flex items-center justify-between gap-3 rounded-lg border p-4">
            <div>
              <p class="text-sm font-medium">Vehicle badges</p>
              <p class="text-xs text-muted-foreground">Coloured badge on the card image</p>
            </div>
            <Switch v-model="form.badgesEnabled" :disabled="saving" aria-label="Enable vehicle badges" />
          </div>
        </CardContent>
      </Card>

      <!-- Scrolling banner -->
      <Card>
        <CardHeader>
          <CardTitle>Scrolling banner</CardTitle>
          <CardDescription>A site-wide scrolling ticker shown along the bottom of every vehicle card image. A per-vehicle comment overrides it on that card.</CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="grid items-start gap-4 md:grid-cols-[180px_minmax(0,1fr)_220px]">
            <div class="space-y-2">
              <Label for="scroller-enabled">Status</Label>
              <div class="flex h-10 items-center justify-between gap-3 rounded-md border border-input px-3">
                <span class="text-sm font-medium">{{ form.scroller.enabled ? 'On' : 'Off' }}</span>
                <Switch id="scroller-enabled" v-model="form.scroller.enabled" :disabled="saving" aria-label="Enable scrolling banner" />
              </div>
            </div>
            <div class="space-y-2">
              <Label for="scroller-text">Banner text</Label>
              <Input
                id="scroller-text"
                v-model="form.scroller.text"
                maxlength="160"
                placeholder="e.g. MASSIVE EOFY SALE — THIS WEEKEND ONLY*"
                :disabled="saving"
              />
            </div>
            <AdminColorField id="scroller-color" v-model="form.scroller.color" label="Banner colour" :disabled="saving" />
          </div>
          <div>
            <p class="mb-2 text-xs font-medium text-muted-foreground">Show on (leave as "Any" for every vehicle card)</p>
            <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div class="space-y-2">
                <Label for="scroller-make">Make</Label>
                <Select :model-value="form.scroller.make || ANY" :disabled="saving" @update:model-value="form.scroller.make = fromAny($event)">
                  <SelectTrigger id="scroller-make" class="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem :value="ANY">Any make</SelectItem>
                    <SelectItem v-for="make in makeOptions" :key="make" :value="make">{{ make }}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div class="space-y-2">
                <Label for="scroller-model">Model</Label>
                <Select :model-value="form.scroller.model || ANY" :disabled="saving" @update:model-value="form.scroller.model = fromAny($event)">
                  <SelectTrigger id="scroller-model" class="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem :value="ANY">Any model</SelectItem>
                    <SelectItem v-for="model in modelOptions(form.scroller.make)" :key="model" :value="model">{{ model }}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div class="space-y-2">
                <Label for="scroller-variant">Variant</Label>
                <Select :model-value="form.scroller.variant || ANY" :disabled="saving" @update:model-value="form.scroller.variant = fromAny($event)">
                  <SelectTrigger id="scroller-variant" class="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem :value="ANY">Any variant</SelectItem>
                    <SelectItem v-for="variant in variantOptions(form.scroller.make, form.scroller.model)" :key="variant" :value="variant">{{ variant }}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div class="space-y-2">
                <Label for="scroller-condition">Condition</Label>
                <Select :model-value="form.scroller.condition || ANY" :disabled="saving" @update:model-value="form.scroller.condition = fromAny($event)">
                  <SelectTrigger id="scroller-condition" class="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem :value="ANY">Any condition</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="demo">Demo</SelectItem>
                    <SelectItem value="used">Used</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Per-vehicle offers -->
      <Card>
        <CardHeader class="gap-4 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
          <div class="space-y-1.5">
            <CardTitle>Per-vehicle offers</CardTitle>
            <CardDescription>Promote specific cars. The live feed price becomes the "Now" price. Dates are optional and inclusive. Per-vehicle offers always beat group offers.</CardDescription>
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
                    <p v-else-if="offer.stockNumber && stockLoaded" class="m-0 text-xs text-amber-600">
                      Not found in the current stock feed — check the stock number.
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" :disabled="saving" :aria-label="`Remove offer ${index + 1}`" @click="removeOffer(index)">
                  <Trash2 class="h-4 w-4 text-destructive" />
                </Button>
              </div>
              <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
                <div class="space-y-2 md:col-span-2">
                  <Label :for="`offer-comment-${index}`">Comment</Label>
                  <Input :id="`offer-comment-${index}`" v-model="offer.comment" maxlength="200" placeholder="e.g. One owner, full service history" :disabled="saving" />
                </div>
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
              <div class="flex items-start justify-between gap-3">
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
                <Button variant="ghost" size="icon" :disabled="saving" :aria-label="`Remove group offer ${index + 1}`" @click="removeGroup(index)">
                  <Trash2 class="h-4 w-4 text-destructive" />
                </Button>
              </div>
              <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
                <div class="space-y-2 md:col-span-2">
                  <Label :for="`group-comment-${index}`">Comment</Label>
                  <Input :id="`group-comment-${index}`" v-model="group.comment" maxlength="200" placeholder="e.g. $3,000 off all MY24 Tucson" :disabled="saving" />
                </div>
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
                <div class="flex h-10 items-center justify-between gap-3 rounded-md border border-input px-3 md:col-span-2 xl:col-span-4">
                  <span class="text-sm font-medium">Active</span>
                  <Switch v-model="group.enabled" :disabled="saving" :aria-label="`Activate group offer ${index + 1}`" />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Graphics between cards -->
      <Card>
        <CardHeader class="gap-4 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
          <div class="space-y-1.5">
            <CardTitle>Graphics between cards</CardTitle>
            <CardDescription>Emotional promo graphics inserted between stock cards in the homepage Stock Specials slider. Graphics rotate if you add more than one.</CardDescription>
          </div>
          <Button :disabled="saving || form.graphics.items.length >= maxGraphics" @click="addGraphic">
            <Plus class="mr-2 h-4 w-4" /> Add graphic
          </Button>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="grid items-start gap-4 md:grid-cols-[180px_minmax(0,1fr)]">
            <div class="space-y-2">
              <Label for="graphics-enabled">Status</Label>
              <div class="flex h-10 items-center justify-between gap-3 rounded-md border border-input px-3">
                <span class="text-sm font-medium">{{ form.graphics.enabled ? 'On' : 'Off' }}</span>
                <Switch id="graphics-enabled" v-model="form.graphics.enabled" :disabled="saving" aria-label="Enable graphics between cards" />
              </div>
            </div>
            <div class="space-y-2 md:max-w-72">
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
          </div>

          <div v-if="!form.graphics.items.length" class="rounded-xl border border-dashed px-6 py-10 text-center">
            <Images class="mx-auto h-8 w-8 text-muted-foreground" />
            <p class="mt-3 text-sm text-muted-foreground">No graphics yet. Add one and choose an image from the media library, or paste an image URL.</p>
          </div>

          <div
            v-for="(graphic, index) in form.graphics.items"
            :key="graphic.id"
            class="space-y-4 rounded-lg border p-4"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="flex flex-wrap items-center gap-2">
                <p class="m-0 text-sm font-semibold">Graphic {{ index + 1 }}</p>
                <span :class="[CHIP_BASE, graphic.enabled ? windowStatus(graphic.start, graphic.end).class : CHIP_OFF]">
                  {{ graphic.enabled ? windowStatus(graphic.start, graphic.end).label : 'Hidden' }}
                </span>
              </div>
              <Button variant="ghost" size="icon" :disabled="saving" :aria-label="`Remove graphic ${index + 1}`" @click="removeGraphic(index)">
                <Trash2 class="h-4 w-4 text-destructive" />
              </Button>
            </div>
            <div class="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
              <div class="space-y-2">
                <Label>Graphic image</Label>
                <div class="grid aspect-[4/3] place-items-center overflow-hidden rounded-xl border bg-muted">
                  <img v-if="graphic.image" :src="graphic.image" :alt="`Promo graphic ${index + 1} preview`" class="h-full w-full object-cover" />
                  <div v-else class="grid place-items-center gap-2 text-xs text-muted-foreground">
                    <Images class="h-6 w-6" />
                    <span>No image selected</span>
                  </div>
                </div>
                <Button type="button" variant="outline" size="sm" class="w-full" :disabled="saving" @click="chooseImage({ kind: 'graphic', index, field: 'image' })">
                  <Upload class="mr-2 h-4 w-4" /> Choose from media library
                </Button>
                <Input
                  v-model="graphic.image"
                  placeholder="…or paste an image URL"
                  class="text-xs"
                  :disabled="saving"
                  aria-label="Graphic image URL"
                />
                <div class="flex items-center gap-2 pt-1">
                  <Input
                    v-model="graphic.mobileImage"
                    placeholder="Mobile image URL (optional)"
                    class="text-xs"
                    :disabled="saving"
                    aria-label="Graphic mobile image URL"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    class="shrink-0"
                    :disabled="saving"
                    :aria-label="`Choose mobile image for graphic ${index + 1}`"
                    @click="chooseImage({ kind: 'graphic', index, field: 'mobileImage' })"
                  >
                    <Upload class="h-4 w-4" />
                  </Button>
                </div>
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
                <div class="space-y-2">
                  <Label :for="`graphic-start-${index}`">Start date (optional)</Label>
                  <AdminDatePicker
                    :id="`graphic-start-${index}`"
                    v-model="graphic.start"
                    label="Graphic start date"
                    placeholder="Starts immediately"
                    clearable
                    :disabled="saving"
                  />
                </div>
                <div class="space-y-2">
                  <Label :for="`graphic-end-${index}`">End date (optional)</Label>
                  <AdminDatePicker
                    :id="`graphic-end-${index}`"
                    v-model="graphic.end"
                    label="Graphic end date"
                    placeholder="No end date"
                    :min="graphic.start || undefined"
                    clearable
                    :disabled="saving"
                  />
                </div>
                <div class="flex h-10 items-center justify-between gap-3 rounded-md border border-input px-3 md:col-span-2">
                  <span class="text-sm font-medium">Visible</span>
                  <Switch v-model="graphic.enabled" :disabled="saving" :aria-label="`Show graphic ${index + 1}`" />
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
              <div class="grid aspect-[4/1] place-items-center overflow-hidden rounded-xl border bg-muted">
                <img v-if="form.stockHeader.desktop" :src="form.stockHeader.desktop" alt="Stock page header desktop preview" class="h-full w-full object-cover" />
                <div v-else class="grid place-items-center gap-2 text-xs text-muted-foreground">
                  <Images class="h-6 w-6" />
                  <span>No image selected</span>
                </div>
              </div>
              <Button type="button" variant="outline" size="sm" class="w-full" :disabled="saving" @click="chooseImage({ kind: 'header', field: 'desktop' })">
                <Upload class="mr-2 h-4 w-4" /> Choose from media library
              </Button>
              <Input v-model="form.stockHeader.desktop" placeholder="…or paste an image URL" class="text-xs" :disabled="saving" aria-label="Header desktop image URL" />
            </div>
            <div class="space-y-2">
              <Label>Mobile image (optional)</Label>
              <div class="grid aspect-[2/1] place-items-center overflow-hidden rounded-xl border bg-muted">
                <img v-if="form.stockHeader.mobile" :src="form.stockHeader.mobile" alt="Stock page header mobile preview" class="h-full w-full object-cover" />
                <div v-else class="grid place-items-center gap-2 text-xs text-muted-foreground">
                  <Images class="h-6 w-6" />
                  <span>Falls back to desktop image</span>
                </div>
              </div>
              <Button type="button" variant="outline" size="sm" class="w-full" :disabled="saving" @click="chooseImage({ kind: 'header', field: 'mobile' })">
                <Upload class="mr-2 h-4 w-4" /> Choose from media library
              </Button>
              <Input v-model="form.stockHeader.mobile" placeholder="…or paste an image URL" class="text-xs" :disabled="saving" aria-label="Header mobile image URL" />
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
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import {
  AlertTriangle,
  Car,
  ExternalLink,
  Images,
  Layers,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Tags,
  Trash2,
  Upload,
} from 'lucide-vue-next';
import {
  STOCK_CARD_PROMO_DEFAULT_INTERVAL,
  STOCK_CARD_PROMO_MAX_GROUPS,
  STOCK_CARD_PROMO_MAX_INTERVAL,
  STOCK_CARD_PROMO_MIN_INTERVAL,
  isPromoWindowActive,
  promoNow,
  type StockCardPromoSettings,
} from '~~/shared/stockCardPromo';
import AdminColorField from '~/components/admin/settings/AdminColorField.vue';
import StockVehiclePickerDialog, { type StockPickerOption } from '~/components/admin/settings/StockVehiclePickerDialog.vue';
import AdminDatePicker from '~/components/admin/AdminDatePicker.vue';
import MediaLibraryDialog from '~/components/media/MediaLibraryDialog.vue';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
import { Switch } from '~/components/ui/switch';

definePageMeta({ layout: 'admin', middleware: 'auth' });

const ANY = '__any__';

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
  discountType: string;
  discountValueInput: string;
  comment: string;
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

interface PromoForm {
  wasNowEnabled: boolean;
  commentsEnabled: boolean;
  badgesEnabled: boolean;
  scroller: { enabled: boolean; text: string; color: string; make: string; model: string; variant: string; condition: string };
  offers: OfferForm[];
  groups: GroupForm[];
  graphics: { enabled: boolean; interval: number; items: GraphicForm[] };
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

function groupMatchCount(group: GroupForm): string {
  if (!stockLoaded.value) return 'checking stock…';
  const count = stockOptions.value.filter((option) => {
    const vehicle = option.vehicle;
    const matches = (target: string, actual: string) =>
      !target || target.trim().toLowerCase() === (actual || '').trim().toLowerCase();
    const condition = fieldValue(vehicle?.condition).toLowerCase();
    const normalized = condition.includes('demo') ? 'demo' : condition.includes('new') ? 'new' : condition.includes('used') ? 'used' : '';
    return matches(group.make, fieldValue(vehicle?.make))
      && matches(group.model, fieldValue(vehicle?.model))
      && matches(group.variant, fieldValue(vehicle?.badge) || fieldValue(vehicle?.variant))
      && (!group.condition || group.condition === normalized);
  }).length;
  return count === 1 ? 'matches 1 car right now' : `matches ${count} cars right now`;
}

function fieldValue(field: any): string {
  return field?.displayValue?.[0] || field?.value?.[0] || '';
}

function vehicleTitle(vehicle: any): string {
  return [fieldValue(vehicle?.year), fieldValue(vehicle?.make), fieldValue(vehicle?.model)]
    .filter(Boolean)
    .join(' ') || 'Vehicle';
}

function vehiclePrice(vehicle: any): string {
  return typeof vehicle?.price === 'number' && vehicle.price > 0
    ? `$${vehicle.price.toLocaleString()}`
    : 'POA';
}

function vehicleLabel(vehicle: any): string {
  if (!vehicle) return '';
  return `${vehicleTitle(vehicle)} — Now ${vehiclePrice(vehicle)}`;
}

function offerPreview(offer: OfferForm): string {
  const vehicle = matchedVehicle(offer.stockNumber);
  const wasPrice = Number(offer.wasPriceInput);
  const nowPrice = typeof vehicle?.price === 'number' ? vehicle.price : 0;
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

function fromAny(value: unknown) {
  const selected = String(value ?? '');
  return selected === ANY ? '' : selected;
}

function groupSummary(group: GroupForm) {
  const target = [group.make || 'Any make', group.model, group.variant, group.condition && group.condition.toUpperCase()]
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
    scroller: {
      enabled: settings?.scroller.enabled === true,
      text: settings?.scroller.text || '',
      color: settings?.scroller.color || '#e11d48',
      make: settings?.scroller.make || '',
      model: settings?.scroller.model || '',
      variant: settings?.scroller.variant || '',
      condition: settings?.scroller.condition || '',
    },
    offers: (settings?.offers || []).map((offer) => ({
      stockNumber: offer.stockNumber,
      wasPriceInput: offer.wasPrice ? String(offer.wasPrice) : '',
      comment: offer.comment,
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
      discountType: rule.discountType,
      discountValueInput: rule.discountValue ? String(rule.discountValue) : '',
      comment: rule.comment,
      badgeText: rule.badgeText,
      badgeColor: rule.badgeColor || '#e11d48',
      start: toIsoDate(rule.start || ''),
      end: toIsoDate(rule.end || ''),
    })),
    graphics: {
      enabled: settings?.graphics.enabled === true,
      interval: settings?.graphics.interval || STOCK_CARD_PROMO_DEFAULT_INTERVAL,
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
    badgeText: '',
    badgeColor: '#e11d48',
    start: '',
    end: '',
  });
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
    discountType: '',
    discountValueInput: '',
    comment: '',
    badgeText: '',
    badgeColor: '#e11d48',
    start: '',
    end: '',
  });
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
    scroller: { ...form.value.scroller },
    offers: form.value.offers
      .filter((offer) => offer.stockNumber.trim())
      .map((offer) => ({
        stockNumber: offer.stockNumber,
        wasPrice: offer.wasPriceInput.trim() ? Number(offer.wasPriceInput) : null,
        comment: offer.comment,
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
      discountType: group.discountType,
      discountValue: group.discountValueInput.trim() ? Number(group.discountValueInput) : null,
      comment: group.comment,
      badgeText: group.badgeText,
      badgeColor: group.badgeColor,
      start: group.start,
      end: group.end,
    })),
    graphics: {
      enabled: form.value.graphics.enabled,
      interval: form.value.graphics.interval,
      items: form.value.graphics.items,
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

function previewHomepage() {
  window.open('/?refresh=true', '_blank', 'noopener,noreferrer');
}

function toIsoDate(value: string) {
  if (!value) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const match = /^(\d{2})-(\d{2})-(\d{4})$/.exec(value);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : '';
}
</script>

