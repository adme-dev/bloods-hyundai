import { defineConfig, presetIcons } from 'unocss'
import presetWind4 from '@unocss/preset-wind4'

/**
 * UnoCSS Configuration for Sale Hyundai Nuxt
 * 
 * Using Tailwind CSS v4 with UnoCSS as the processor.
 * Includes shadcn-vue theming support via CSS variables.
 */
export default defineConfig({
  // Use Tailwind v4-compatible preset
  presets: [
    presetWind4(), // Tailwind CSS v4 compatible utilities
    presetIcons({
      // Optional: enable icon support
    }),
  ],

  // Prevent conflicts with UIkit
  exclude: [
    /uk-/,
    /^uk-.*/,
  ],

  // Safelist shadcn classes that use CSS variables
  safelist: [
    'bg-background',
    'text-foreground',
    'bg-card',
    'text-card-foreground',
    'bg-popover',
    'text-popover-foreground',
    'bg-primary',
    'text-primary',
    'text-primary-foreground',
    'bg-secondary',
    'text-secondary-foreground',
    'bg-muted',
    'text-muted-foreground',
    'bg-accent',
    'text-accent-foreground',
    'bg-destructive',
    'text-destructive-foreground',
    'border-border',
    'border-input',
    'ring-ring',
  ],

  // Theme customization with shadcn CSS variable support
  theme: {
    colors: {
      // shadcn CSS variable-based colors (using HSL)
      border: 'hsl(var(--border))',
      input: 'hsl(var(--input))',
      ring: 'hsl(var(--ring))',
      background: 'hsl(var(--background))',
      foreground: 'hsl(var(--foreground))',
      primary: {
        DEFAULT: 'hsl(var(--primary))',
        foreground: 'hsl(var(--primary-foreground))',
      },
      secondary: {
        DEFAULT: 'hsl(var(--secondary))',
        foreground: 'hsl(var(--secondary-foreground))',
      },
      destructive: {
        DEFAULT: 'hsl(var(--destructive))',
        foreground: 'hsl(var(--destructive-foreground))',
      },
      muted: {
        DEFAULT: 'hsl(var(--muted))',
        foreground: 'hsl(var(--muted-foreground))',
      },
      accent: {
        DEFAULT: 'hsl(var(--accent))',
        foreground: 'hsl(var(--accent-foreground))',
      },
      popover: {
        DEFAULT: 'hsl(var(--popover))',
        foreground: 'hsl(var(--popover-foreground))',
      },
      card: {
        DEFAULT: 'hsl(var(--card))',
        foreground: 'hsl(var(--card-foreground))',
      },
      // Additional Hyundai brand colors
      hyundai: {
        navy: '#001E50',
        blue: '#00aad2',
        red: '#e63312',
      },
      // Status colors
      success: '#2fbc05',
      warning: '#f0ad4e',
      danger: '#e63312',
    },
    borderRadius: {
      lg: 'var(--radius)',
      md: 'calc(var(--radius) - 2px)',
      sm: 'calc(var(--radius) - 4px)',
    },
    // Tailwind v4 uses 'font' instead of 'fontFamily'
    font: {
      sans: ['Hyundai Sans Text', 'Hyundai Sans', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      head: ['Hyundai Sans Head', 'Hyundai Sans', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      body: ['Hyundai Sans Text', 'Hyundai Sans', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
    },
  },

  // Shortcuts for common patterns
  shortcuts: {
    // Buttons - Hyundai brand styling
    'btn-hyundai': 'bg-[#001E50] text-white px-6 py-3 rounded font-semibold hover:bg-[#002d6d] transition-colors font-body',
    'btn-hyundai-secondary': 'bg-[#e63312] text-white px-6 py-3 rounded font-semibold hover:bg-[#c42a0f] transition-colors font-body',
    'btn-hyundai-accent': 'bg-[#00aad2] text-white px-6 py-3 rounded font-semibold hover:bg-[#0095b8] transition-colors font-body',

    // Text utilities - Hyundai brand colors
    'text-hyundai': 'text-[#001E50]',
    'text-hyundai-accent': 'text-[#00aad2]',
    'text-hyundai-red': 'text-[#e63312]',

    // Background utilities
    'bg-hyundai': 'bg-[#001E50]',
    'bg-hyundai-accent': 'bg-[#00aad2]',
    'bg-hyundai-sand': 'bg-[#f6f3f2]',

    // Card patterns
    'card-hyundai': 'bg-white rounded-lg shadow-md p-6',

    // Typography - Hyundai OEM style headings
    'heading-hero': 'font-head text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight text-[#001E50]',
    'heading-1': 'font-head text-3xl md:text-4xl font-medium tracking-tight text-[#001E50]',
    'heading-2': 'font-head text-2xl md:text-3xl font-medium tracking-tight text-[#001E50]',
    'heading-3': 'font-head text-xl md:text-2xl font-medium text-[#001E50]',
    'heading-4': 'font-head text-lg md:text-xl font-medium text-[#001E50]',
    'heading-5': 'font-head text-base md:text-lg font-medium text-[#001E50]',
    'body-lg': 'font-body text-lg text-gray-700 leading-relaxed',
    'body-base': 'font-body text-base text-gray-600 leading-relaxed',
    'body-sm': 'font-body text-sm text-gray-500 leading-relaxed',
    'label': 'font-body text-xs font-medium uppercase tracking-wider text-gray-500',
  },
})
