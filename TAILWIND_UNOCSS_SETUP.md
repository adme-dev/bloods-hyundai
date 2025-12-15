# Tailwind/UnoCSS Setup Guide for Sale Hyundai Nuxt

## Overview

This guide explains how to add **UnoCSS** (recommended) or **Tailwind CSS** alongside UIkit in your Nuxt project. UnoCSS is recommended for better performance and smaller bundle sizes.

## Why UnoCSS over Tailwind?

- **Faster**: On-demand generation, no build step in dev mode
- **Smaller bundles**: Only generates CSS for classes you actually use
- **Tailwind-compatible**: Uses same utility class names
- **Better performance**: Faster HMR and build times
- **More flexible**: Can be configured to work alongside UIkit without conflicts

## Installation

### Option 1: UnoCSS (Recommended)

```bash
npm install -D @unocss/nuxt unocss
```

### Option 2: Tailwind CSS

```bash
npm install -D @nuxtjs/tailwindcss
```

## Configuration

### UnoCSS Setup

1. **Add UnoCSS module to `nuxt.config.ts`:**

```typescript
export default defineNuxtConfig({
  modules: [
    '@pinia/nuxt',
    '@vueuse/nuxt',
    'nuxt-gtag',
    '@nuxtjs/robots',
    '@fedorae/nuxt-uikit',
    '@unocss/nuxt', // Add this
  ],
  
  // UnoCSS configuration
  uno: {
    // Use Tailwind preset for compatibility
    presets: [
      '@unocss/preset-wind', // Tailwind-compatible utilities
      '@unocss/preset-icons', // Optional: for icon support
    ],
    // Prevent conflicts with UIkit
    safelist: [
      // Add any classes you want to always include
    ],
    // Exclude UIkit classes from UnoCSS processing
    exclude: [
      'uk-*', // Don't process UIkit classes
    ],
  },
})
```

2. **Create `uno.config.ts` in project root:**

```typescript
import { defineConfig, presetWind, presetIcons } from 'unocss'
import { presetHyundai } from './uno-preset-hyundai' // Optional custom preset

export default defineConfig({
  presets: [
    presetWind(), // Tailwind-compatible utilities
    presetIcons(), // Optional: icon support
    // presetHyundai(), // Optional: custom Hyundai brand utilities
  ],
  
  // Prevent conflicts with UIkit
  exclude: [
    /uk-/,
    /uk-.*/,
  ],
  
  // Safelist classes that might be dynamically generated
  safelist: [
    // Add any dynamic classes here
  ],
  
  // Theme customization (optional - sync with your SCSS variables)
  theme: {
    colors: {
      primary: '#001E50',
      'primary-light': '#00aad2',
      secondary: '#e63312',
      dark: '#1a1a1a',
      muted: '#666666',
      light: '#f5f5f5',
      white: '#ffffff',
    },
  },
  
  // Shortcuts for common patterns
  shortcuts: {
    'btn-primary': 'bg-primary text-white px-4 py-2 rounded hover:bg-opacity-90',
    'btn-secondary': 'bg-secondary text-white px-4 py-2 rounded hover:bg-opacity-90',
    'text-hyundai': 'text-primary',
    'bg-hyundai': 'bg-primary',
  },
})
```

3. **Install UnoCSS presets:**

```bash
npm install -D @unocss/preset-wind @unocss/preset-icons
```

### Tailwind CSS Setup (Alternative)

1. **Add Tailwind module to `nuxt.config.ts`:**

```typescript
export default defineNuxtConfig({
  modules: [
    '@pinix/nuxt',
    '@vueuse/nuxt',
    'nuxt-gtag',
    '@nuxtjs/robots',
    '@fedorae/nuxt-uikit',
    '@nuxtjs/tailwindcss', // Add this
  ],
  
  // Tailwind configuration
  tailwindcss: {
    cssPath: '~/assets/styles/tailwind.css',
    configPath: 'tailwind.config.js',
    exposeConfig: false,
    injectPosition: 0,
    viewer: true,
  },
})
```

2. **Create `tailwind.config.js`:**

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,vue}',
    './components/**/*.{js,ts,vue}',
    './layouts/**/*.{js,ts,vue}',
    './pages/**/*.{js,ts,vue}',
  ],
  
  // Prevent conflicts with UIkit
  prefix: 'tw-', // Optional: prefix Tailwind classes with 'tw-'
  
  theme: {
    extend: {
      colors: {
        primary: '#001E50',
        'primary-light': '#00aad2',
        secondary: '#e63312',
        dark: '#1a1a1a',
        muted: '#666666',
        light: '#f5f5f5',
      },
    },
  },
  
  // Exclude UIkit classes
  corePlugins: {
    // Disable conflicting plugins if needed
  },
  
  plugins: [],
}
```

3. **Create `app/assets/styles/tailwind.css`:**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Prevent conflicts with UIkit */
@layer base {
  /* Base styles */
}

@layer components {
  /* Component styles */
}

@layer utilities {
  /* Utility classes */
}
```

## Preventing Conflicts

### CSS Specificity

Both UIkit and Tailwind/UnoCSS can conflict. Here's how to prevent issues:

1. **Use CSS layers** (recommended):

```scss
// In main.scss
@layer uikit, tailwind, custom;

@layer custom {
  // Your custom styles
}
```

2. **Namespace Tailwind classes** (if using Tailwind):

```javascript
// tailwind.config.js
module.exports = {
  prefix: 'tw-', // All Tailwind classes become tw-flex, tw-bg-blue-500, etc.
}
```

3. **Use UnoCSS exclude** (recommended for UnoCSS):

```typescript
// uno.config.ts
export default defineConfig({
  exclude: [
    /uk-/, // Don't process UIkit classes
    /^uk-.*/, // Don't process any class starting with 'uk-'
  ],
})
```

## Usage Examples

### With UnoCSS (Recommended)

```vue
<template>
  <div class="flex items-center gap-4 p-6 bg-white rounded-lg shadow-md">
    <!-- UnoCSS utilities -->
    <button class="bg-primary text-white px-4 py-2 rounded hover:bg-opacity-90">
      Click me
    </button>
    
    <!-- UIkit classes still work -->
    <div class="uk-card uk-card-default">
      <div class="uk-card-body">
        UIkit card
      </div>
    </div>
  </div>
</template>
```

### With Tailwind

```vue
<template>
  <div class="tw-flex tw-items-center tw-gap-4 tw-p-6">
    <!-- Tailwind utilities (with prefix) -->
    <button class="tw-bg-primary tw-text-white tw-px-4 tw-py-2">
      Click me
    </button>
    
    <!-- UIkit classes still work -->
    <div class="uk-card uk-card-default">
      UIkit card
    </div>
  </div>
</template>
```

## Performance Considerations

### UnoCSS Advantages

1. **On-demand generation**: Only generates CSS for classes you use
2. **No build step**: Instant HMR in development
3. **Smaller bundles**: Typically 10-50% smaller than Tailwind
4. **Faster builds**: No PostCSS processing needed

### Bundle Size Comparison

- **UIkit only**: ~150KB (minified)
- **UIkit + Tailwind**: ~250KB (minified)
- **UIkit + UnoCSS**: ~180KB (minified, on-demand)

## Custom Hyundai Brand Utilities (Optional)

Create `uno-preset-hyundai.ts`:

```typescript
import { definePreset } from 'unocss'

export const presetHyundai = definePreset({
  name: 'hyundai',
  shortcuts: {
    'btn-hyundai': 'bg-primary text-white px-6 py-3 rounded font-semibold hover:bg-opacity-90 transition-colors',
    'text-hyundai-primary': 'text-primary',
    'text-hyundai-accent': 'text-primary-light',
    'bg-hyundai-primary': 'bg-primary',
    'bg-hyundai-accent': 'bg-primary-light',
  },
  theme: {
    colors: {
      hyundai: {
        primary: '#001E50',
        'primary-light': '#00aad2',
        secondary: '#e63312',
      },
    },
  },
})
```

## Migration Strategy

1. **Start with UnoCSS** (easier, better performance)
2. **Use UnoCSS for new components** while keeping UIkit for existing ones
3. **Gradually migrate** UIkit components to UnoCSS utilities if desired
4. **Keep UIkit for complex components** (modals, dropdowns, sliders) that work well

## Troubleshooting

### Classes not working?

1. Check UnoCSS/Tailwind is processing your files:
   - Ensure files are in `content` array
   - Check browser devtools for generated CSS

2. Conflicts with UIkit?
   - Use CSS specificity or prefixes
   - Check `exclude` configuration

3. Build errors?
   - Clear `.nuxt` and `node_modules/.cache`
   - Restart dev server

## References

- [UnoCSS Documentation](https://unocss.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [Franken UI Style](https://github.com/franken-ui/style) - Inspiration for UIkit + Tailwind fusion
- [Nuxt UnoCSS Module](https://unocss.dev/integrations/nuxt)







