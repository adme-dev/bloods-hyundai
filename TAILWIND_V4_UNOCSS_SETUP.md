# Tailwind CSS v4 + UnoCSS Processor Setup

## Overview

This project now uses **Tailwind CSS v4** with **UnoCSS as the processor**, matching your other application setup. This gives you:

- ✅ **Tailwind CSS v4** utilities and features
- ✅ **UnoCSS** fast processing (faster than Tailwind's processor)
- ✅ **Smaller bundles** (UnoCSS only generates what you use)
- ✅ **Best of both worlds** - Tailwind ecosystem + UnoCSS performance

## What Changed

### 1. Package Updates

Added to `devDependencies`:
- `tailwindcss@^4.1.17` - Tailwind CSS v4
- `@unocss/preset-wind4` - Tailwind v4 compatibility preset
- `postcss@^8.5.6` - Required for Tailwind CSS

### 2. UnoCSS Configuration

Updated `uno.config.ts`:
- Changed from `presetWind()` to `presetWind4()` for Tailwind v4 compatibility
- Updated theme keys to match Tailwind v4:
  - `fontFamily` → `font`
  - `borderRadius` → `radius`
  - `boxShadow` → `shadow`
  - And more...

## Installation

Run:
```bash
npm install
```

This will install:
- Tailwind CSS v4.1.17
- UnoCSS with preset-wind4
- PostCSS

## How It Works

1. **Tailwind CSS v4** provides the utility classes and features
2. **UnoCSS** processes them (much faster than Tailwind's processor)
3. **preset-wind4** ensures full Tailwind v4 compatibility
4. Only classes you actually use are generated (smaller bundles)

## Usage

Use Tailwind CSS classes exactly as documented:

```vue
<template>
  <div class="flex items-center gap-4 p-6 bg-white rounded-lg shadow-md">
    <h1 class="text-2xl font-bold text-primary">Hello</h1>
  </div>
</template>
```

All Tailwind v4 utilities work:
- Layout: `flex`, `grid`, `container`, etc.
- Spacing: `p-4`, `m-2`, `gap-6`, etc.
- Colors: `bg-primary`, `text-white`, etc.
- Typography: `text-xl`, `font-bold`, etc.
- And all Tailwind v4 features!

## Theme Configuration

Your Hyundai brand colors are configured in `uno.config.ts`:

```typescript
theme: {
  colors: {
    primary: '#001E50',
    'primary-light': '#00aad2',
    secondary: '#e63312',
    // ... more colors
  },
  font: {
    sans: ['Hyundai Sans', ...],
  },
}
```

## Benefits Over Previous Setup

### Before (UnoCSS only with presetWind)
- UnoCSS mimicking Tailwind v3
- Not official Tailwind utilities
- Limited Tailwind ecosystem compatibility

### Now (Tailwind v4 + UnoCSS processor)
- ✅ Official Tailwind CSS v4 utilities
- ✅ Full Tailwind v4 feature set
- ✅ Better compatibility with Tailwind plugins
- ✅ UnoCSS's faster processing
- ✅ Smaller bundles (on-demand generation)

## Migration Notes

No code changes needed! Your existing Tailwind classes will work exactly the same. The only difference is:
- Faster builds
- Smaller bundles
- Access to Tailwind v4 features

## Optional: Additional Presets

You can add more presets like in your other app:

```bash
npm install -D unocss-preset-animations unocss-preset-shadcn
```

Then add to `uno.config.ts`:
```typescript
import presetAnimations from 'unocss-preset-animations'
import presetShadcn from 'unocss-preset-shadcn'

presets: [
  presetWind4(),
  presetIcons(),
  presetAnimations(),
  presetShadcn(),
],
```

## Troubleshooting

**Classes not working?**
- Restart dev server after installing packages
- Check browser console for errors
- Verify `@unocss/nuxt` is in `nuxt.config.ts` modules

**Build errors?**
- Make sure all packages are installed: `npm install`
- Check `uno.config.ts` syntax
- Verify Tailwind v4 compatibility

## References

- [Tailwind CSS v4 Docs](https://tailwindcss.com/docs)
- [UnoCSS preset-wind4](https://unocss.dev/presets/wind4)
- [UnoCSS Documentation](https://unocss.dev/)











