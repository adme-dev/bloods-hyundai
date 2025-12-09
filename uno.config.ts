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
      sans: ['Hyundai Sans', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
    },
  },

  // Shortcuts for common patterns
  shortcuts: {
    // Buttons
    'btn-hyundai': 'bg-[#001E50] text-white px-6 py-3 rounded font-semibold hover:bg-opacity-90 transition-colors',
    'btn-hyundai-secondary': 'bg-[#e63312] text-white px-6 py-3 rounded font-semibold hover:bg-opacity-90 transition-colors',
    'btn-hyundai-accent': 'bg-[#00aad2] text-white px-6 py-3 rounded font-semibold hover:bg-opacity-90 transition-colors',
    
    // Text utilities
    'text-hyundai': 'text-[#001E50]',
    'text-hyundai-accent': 'text-[#00aad2]',
    
    // Background utilities
    'bg-hyundai': 'bg-[#001E50]',
    'bg-hyundai-accent': 'bg-[#00aad2]',
    
    // Card patterns
    'card-hyundai': 'bg-white rounded-lg shadow-md p-6',
  },
})
