# UIkit Conditional Loading - Setup Complete ✅

## What Was Changed

### 1. Removed Global UIkit Module
- **Removed** `@fedorae/nuxt-uikit` from `nuxt.config.ts` modules
- UIkit is no longer loaded globally

### 2. Created Conditional Loading Plugin
- **Created** `app/plugins/uikit-conditional.client.ts`
- Loads UIkit CSS and JS **only on vehicle-related pages**
- Automatically detects route and loads/unloads as needed

### 3. Updated Composable
- **Updated** `app/composables/useUIkit.ts` to work with manually loaded UIkit
- No longer depends on `@fedorae/nuxt-uikit` module

### 4. Updated Layout
- **Converted** `app/layouts/default.vue` to use Tailwind classes:
  - `uk-position-relative` → `relative`
  - `uk-flex` → `flex`
  - `uk-width-1-1` → `w-full`

### 5. Updated App.vue
- **Removed** dependency on `$uikit` from module
- Uses `window.UIkit` directly (only available on vehicle pages)

## How It Works

### Vehicle Pages (UIkit Loaded)
UIkit CSS and JS are automatically loaded on:
- `/vehicle/[slug]`
- `/vehicle-for-sale/[id]/[slug]`
- `/variant/[slug]`
- `/car-sales`
- `/cars-for-sale/[...slug]`
- `/calculator/[model]`
- `/vehicle-enquire/[...params]`
- `/build-and-price`
- `/build/[slug]`
- `/compare-vehicles-for-sale`
- `/test-drive`

### Non-Vehicle Pages (Tailwind Only)
These pages use **only UnoCSS/Tailwind utilities**:
- `/` (Homepage)
- `/contact`
- `/special-offers`
- `/special-offer/[id]/[name]`
- `/site-map`
- `/sell-my-car`
- `/payment-success`

## Benefits

1. **Smaller Bundle Size**: UIkit CSS (~150KB) only loads on vehicle pages
2. **No Conflicts**: Tailwind utilities work cleanly on non-vehicle pages
3. **Better Performance**: Faster page loads on non-vehicle pages
4. **Cleaner Codebase**: Clear separation between UIkit and Tailwind usage

## Next Steps

### 1. Convert Navigation Components
Navigation components (`PrimaryNav.vue`, `MobileNav.vue`) still use some UIkit classes. Convert them to Tailwind:

**Current:**
```vue
<div class="uk-container uk-container-large">
  <div class="uk-visible@m">
```

**Convert to:**
```vue
<div class="container mx-auto max-w-7xl">
  <div class="hidden md:block">
```

### 2. Test Vehicle Pages
After restarting dev server, test:
- Vehicle detail pages load UIkit correctly
- Modals, dropdowns, sliders work
- No console errors

### 3. Test Non-Vehicle Pages
Verify:
- Homepage loads without UIkit CSS
- No UIkit-related errors in console
- Tailwind utilities work correctly

## Troubleshooting

**UIkit not loading on vehicle pages?**
- Check browser console for errors
- Verify route matches vehicle routes in plugin
- Check network tab for CSS/JS loading

**Navigation broken?**
- Navigation components may need UIkit classes converted to Tailwind
- Check if any `uk-*` classes are still in navigation

**Styles look wrong?**
- Make sure UnoCSS is generating classes correctly
- Check if any UIkit CSS is still being loaded globally

## Files Modified

1. `nuxt.config.ts` - Removed `@fedorae/nuxt-uikit` module
2. `app/plugins/uikit-conditional.client.ts` - Created conditional loading plugin
3. `app/composables/useUIkit.ts` - Updated to work with manual loading
4. `app/app.vue` - Updated to use `window.UIkit` directly
5. `app/layouts/default.vue` - Converted to Tailwind classes

## Testing Checklist

- [ ] Restart dev server
- [ ] Visit homepage (`/`) - should NOT load UIkit CSS
- [ ] Visit vehicle page (`/vehicle/tucson`) - should load UIkit CSS
- [ ] Check browser network tab - UIkit CSS only loads on vehicle pages
- [ ] Test UIkit components (modals, dropdowns) on vehicle pages
- [ ] Test Tailwind utilities on homepage
- [ ] Verify no console errors











