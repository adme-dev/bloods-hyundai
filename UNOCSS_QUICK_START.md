# UnoCSS Quick Start Guide

## ✅ Setup Complete!

UnoCSS has been successfully installed and configured to work alongside UIkit.

## What's Been Configured

1. **Dependencies Installed:**
   - `@unocss/nuxt` - Nuxt module for UnoCSS
   - `unocss` - Core UnoCSS framework
   - `@unocss/preset-wind` - Tailwind-compatible utilities
   - `@unocss/preset-icons` - Icon support (optional)

2. **Configuration Files:**
   - `uno.config.ts` - UnoCSS configuration with Hyundai brand colors
   - `nuxt.config.ts` - Updated with `@unocss/nuxt` module

3. **Conflict Prevention:**
   - UnoCSS automatically excludes all `uk-*` classes
   - UIkit components will continue to work as before

## Usage Examples

### Basic Utilities (Tailwind-compatible)

```vue
<template>
  <!-- Layout -->
  <div class="flex items-center gap-4 p-6">
    <div class="w-1/2">Left</div>
    <div class="w-1/2">Right</div>
  </div>

  <!-- Colors -->
  <div class="bg-primary text-white p-4">
    Hyundai Blue Background
  </div>
  
  <div class="bg-primary-light text-white p-4">
    Active Blue Background
  </div>

  <!-- Spacing -->
  <div class="m-4 p-6 space-y-4">
    <p>Spaced content</p>
  </div>
</template>
```

### Using Custom Shortcuts

```vue
<template>
  <!-- Pre-configured Hyundai buttons -->
  <button class="btn-hyundai">Primary Button</button>
  <button class="btn-hyundai-secondary">Secondary Button</button>
  <button class="btn-hyundai-accent">Accent Button</button>

  <!-- Pre-configured card -->
  <div class="card-hyundai">
    <h3>Card Title</h3>
    <p>Card content</p>
  </div>
</template>
```

### Mixing UIkit and UnoCSS

```vue
<template>
  <!-- UnoCSS for layout -->
  <div class="flex flex-col md:flex-row gap-6 p-8">
    
    <!-- UIkit for complex components -->
    <div class="uk-card uk-card-default">
      <div class="uk-card-body">
        <h3 class="uk-card-title">UIkit Card</h3>
        <p>This uses UIkit styling</p>
      </div>
    </div>

    <!-- UnoCSS for custom styling -->
    <div class="bg-white rounded-lg shadow-md p-6">
      <h3 class="text-xl font-bold text-primary mb-4">Custom Card</h3>
      <p class="text-muted">This uses UnoCSS utilities</p>
    </div>
  </div>
</template>
```

## Available Brand Colors

You can use these colors with UnoCSS utilities:

- `bg-primary` / `text-primary` - Hyundai Blue (#001E50)
- `bg-primary-light` / `text-primary-light` - Active Blue (#00aad2)
- `bg-secondary` / `text-secondary` - Active Red (#e63312)
- `bg-dark` / `text-dark` - Dark (#1a1a1a)
- `bg-muted` / `text-muted` - Muted (#666666)
- `bg-light` / `text-light` - Light (#f5f5f5)

## Custom Shortcuts Available

- `btn-hyundai` - Primary Hyundai button
- `btn-hyundai-secondary` - Secondary button
- `btn-hyundai-accent` - Accent button
- `text-hyundai` - Primary text color
- `text-hyundai-accent` - Accent text color
- `bg-hyundai` - Primary background
- `bg-hyundai-accent` - Accent background
- `card-hyundai` - Pre-styled card

## Next Steps

1. **Start using UnoCSS utilities** in your components
2. **Keep UIkit** for complex components (modals, dropdowns, sliders)
3. **Gradually migrate** from custom SCSS to UnoCSS utilities where it makes sense
4. **Add more shortcuts** to `uno.config.ts` as you identify common patterns

## Development

After restarting your dev server, UnoCSS will:
- Automatically detect classes in your Vue files
- Generate CSS on-demand
- Provide instant HMR (Hot Module Replacement)

## Troubleshooting

**Classes not working?**
- Restart your dev server: `npm run dev`
- Check browser console for errors
- Verify classes are in `.vue` files (UnoCSS scans these automatically)

**Conflicts with UIkit?**
- UnoCSS automatically excludes `uk-*` classes
- If you see conflicts, check `uno.config.ts` exclude patterns

**Build errors?**
- Clear `.nuxt` folder: `rm -rf .nuxt`
- Clear `node_modules/.cache`: `rm -rf node_modules/.cache`
- Reinstall: `npm install`

## Resources

- [UnoCSS Documentation](https://unocss.dev/)
- [Tailwind CSS Reference](https://tailwindcss.com/docs) (UnoCSS is compatible)
- [UnoCSS Interactive Playground](https://unocss.dev/interactive)







