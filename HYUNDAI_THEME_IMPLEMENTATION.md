# Hyundai OEM Theme Implementation Summary

## Overview

This document summarizes how Hyundai's official brand colors and typography have been incorporated into the Sale Hyundai Nuxt project, and what has been done to ensure UIkit components match the OEM brand guidelines.

## Hyundai Brand Colors (Official)

Based on Hyundai's official brand guidelines and the OEM website (hyundai.com/au/en):

- **Hyundai Blue (Primary)**: `#002c5f` - Used for primary actions, branding, navigation bars
- **Active Blue**: `#00aad2` - Used for links, active states, accents
- **Active Red (Secondary)**: `#e63312` - Used for secondary actions, alerts, emphasis
- **Neutral Colors**: 
  - Dark: `#1a1a1a` (text)
  - Muted: `#666666` (secondary text)
  - Light: `#f5f5f5` (backgrounds)
  - White: `#ffffff`

## Current Implementation Status

### ✅ Already Implemented

1. **Brand Colors Defined**
   - Colors are defined in `app/assets/styles/_variables.scss` (SCSS variables)
   - Colors are also defined as CSS custom properties in `app/assets/styles/main.scss`
   - Colors match Hyundai's official brand guidelines

2. **Typography Setup**
   - Font family is set to `'Hyundai Sans'` with fallbacks
   - Some components use `'HyundaiSansHead'` variant
   - Font stack includes system fallbacks for graceful degradation

### ✅ Newly Added (This Update)

1. **Comprehensive UIkit Theme Overrides**
   - Created `app/assets/styles/_uikit-theme.scss` with UIkit SCSS variable overrides
   - Updated `app/assets/styles/main.scss` with comprehensive CSS overrides for all UIkit components
   - All UIkit components now use Hyundai brand colors:
     - Buttons (primary, secondary)
     - Links (using Active Blue #00aad2)
     - Cards
     - Badges
     - Navbar and dropdowns
     - Sections
     - Forms (focus states)
     - Alerts
     - Modals
     - Progress bars
     - Tabs
     - And more...

2. **Component-Specific Styling**
   - Primary buttons use Hyundai Blue (#002c5f)
   - Secondary buttons use Active Red (#e63312)
   - Links use Active Blue (#00aad2) with hover states
   - All UIkit components now match Hyundai's visual identity

## ⚠️ Attention Required

### Font Loading

**Status**: Hyundai Sans font files are **not currently in the project**

**What's Needed**:
1. Obtain Hyundai Sans font files (WOFF2, WOFF, TTF formats)
   - Hyundai Sans (regular)
   - Hyundai Sans Head (for headings)
   - Various weights (Regular, Medium, Bold)

2. Add font files to the project:
   ```
   public/fonts/
     ├── hyundai-sans-regular.woff2
     ├── hyundai-sans-regular.woff
     ├── hyundai-sans-head-regular.woff2
     ├── hyundai-sans-head-regular.woff
     └── ... (other weights)
   ```

3. Add `@font-face` declarations to `app/assets/styles/main.scss`:
   ```scss
   @font-face {
     font-family: 'Hyundai Sans';
     src: url('/fonts/hyundai-sans-regular.woff2') format('woff2'),
          url('/fonts/hyundai-sans-regular.woff') format('woff');
     font-weight: 400;
     font-style: normal;
     font-display: swap;
   }
   
   @font-face {
     font-family: 'HyundaiSansHead';
     src: url('/fonts/hyundai-sans-head-regular.woff2') format('woff2'),
          url('/fonts/hyundai-sans-head-regular.woff') format('woff');
     font-weight: 400;
     font-style: normal;
     font-display: swap;
   }
   ```

**Note**: Hyundai Sans is a proprietary font. Ensure you have proper licensing/permissions to use it on the website.

## Files Modified/Created

### Created
- `app/assets/styles/_uikit-theme.scss` - UIkit SCSS variable overrides (for reference/future use)

### Modified
- `app/assets/styles/main.scss` - Added comprehensive UIkit component overrides using CSS

## How It Works

1. **CSS Custom Properties**: Brand colors are defined as CSS variables (`--color-primary`, `--color-primary-light`, etc.) in `:root`
2. **SCSS Variables**: Same colors are available as SCSS variables (`$primary`, `$primary-light`, etc.) for use in SCSS files
3. **UIkit Overrides**: CSS overrides in `main.scss` ensure all UIkit components use Hyundai colors
4. **Cascade**: UIkit loads first (via `@fedorae/nuikit` module), then our overrides apply

## Testing Recommendations

After implementing font loading, test:

1. **Visual Consistency**: Compare UIkit components with Hyundai's OEM website
2. **Color Accuracy**: Verify all colors match Hyundai brand guidelines
3. **Font Rendering**: Ensure Hyundai Sans loads correctly and displays properly
4. **Component States**: Test hover, focus, and active states for all components
5. **Responsive**: Verify colors and fonts work across all breakpoints

## Comparison with OEM Website

The implementation now matches Hyundai's official website (hyundai.com/au/en) in:

- ✅ Primary brand blue (#002c5f) for main actions and branding
- ✅ Active blue (#00aad2) for links and interactive elements
- ✅ Consistent typography (when fonts are loaded)
- ✅ Component styling that aligns with Hyundai's design language

## Next Steps

1. **Obtain and add Hyundai Sans font files** (see Font Loading section above)
2. **Add `@font-face` declarations** to load the fonts
3. **Test font rendering** across different browsers and devices
4. **Verify color consistency** by comparing with OEM website
5. **Consider adding font preloading** in `nuxt.config.ts` for better performance:
   ```typescript
   app: {
     head: {
       link: [
         { rel: 'preload', href: '/fonts/hyundai-sans-regular.woff2', as: 'font', type: 'font/woff2', crossorigin: 'anonymous' },
       ],
     },
   },
   ```

## References

- Hyundai Official Website: https://www.hyundai.com/au/en
- Hyundai Brand Colors: Based on official style guide
- UIkit Documentation: https://getuikit.com/docs/sass



