# UIkit Conditional Loading Setup

## Goal
Load UIkit CSS and JS **only on vehicle-related pages**, use Tailwind/UnoCSS for the rest of the website.

## Current Problem
`@fedorae/nuxt-uikit` loads UIkit globally, causing conflicts and unnecessary CSS on non-vehicle pages.

## Solution Options

### Option 1: Remove Module, Load Manually (Recommended)
**Pros:**
- Full control over when UIkit loads
- Smaller bundle on non-vehicle pages
- No conflicts with Tailwind

**Cons:**
- Need to manually manage UIkit loading
- Slightly more setup

### Option 2: Keep Module, Disable Auto-Load
**Pros:**
- Keeps module benefits
- Less manual work

**Cons:**
- Module may still load CSS globally
- Less control

## Implementation: Option 1 (Recommended)

### Step 1: Update nuxt.config.ts

```typescript
modules: [
  '@pinia/nuxt',
  '@vueuse/nuxt',
  'nuxt-gtag',
  '@nuxtjs/robots',
  // '@fedorae/nuxt-uikit', // REMOVED - loading conditionally instead
  '@unocss/nuxt',
],
```

### Step 2: Plugin Already Created
The plugin `app/plugins/uikit-conditional.client.ts` will:
- Check if current route is a vehicle page
- Load UIkit CSS/JS only on vehicle pages
- Watch route changes and load/unload as needed

### Step 3: Update useUIkit Composable

The composable needs to work with manually loaded UIkit instead of module-provided instance.

### Step 4: Convert Navigation to Tailwind

Navigation components (`PrimaryNav.vue`, `MobileNav.vue`) use UIkit classes but are on every page. Convert them to Tailwind/UnoCSS.

## Vehicle Pages That Need UIkit

- `/vehicle/[slug]` - Vehicle detail pages
- `/vehicle-for-sale/[id]/[slug]` - Vehicle for sale pages  
- `/variant/[slug]` - Variant pages
- `/car-sales` - Car sales listing
- `/cars-for-sale/[...slug]` - Cars for sale pages
- `/calculator/[model]` - Calculator pages
- `/vehicle-enquire/[...params]` - Vehicle enquiry
- `/build-and-price` - Build and price
- `/build/[slug]` - Build pages
- `/compare-vehicles-for-sale` - Compare vehicles
- `/test-drive` - Test drive

## Non-Vehicle Pages (Tailwind Only)

- `/` - Homepage
- `/contact` - Contact page
- `/special-offers` - Special offers listing
- `/special-offer/[id]/[name]` - Individual offers
- `/site-map` - Site map
- `/sell-my-car` - Sell my car
- `/payment-success` - Payment success

## Next Steps

1. Remove `@fedorae/nuxt-uikit` from modules
2. Convert navigation components to Tailwind
3. Test vehicle pages still work with UIkit
4. Test non-vehicle pages work without UIkit







