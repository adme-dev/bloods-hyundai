# Shopping Cart Persistence Test Guide

## What Was Implemented

✅ **Installed**: `pinia-plugin-persistedstate` v4.7.1
✅ **Updated**: `@pinia/nuxt` from v0.5.5 to v0.11.3 (required for compatibility)
✅ **Updated**: `pinia` from v2.2.6 to v3.0.4
✅ **Configured**: Plugin in `nuxt.config.ts` with localStorage storage
✅ **Refactored**: Accessories store to use automatic persistence
✅ **Enhanced**: Price Builder store with configuration persistence

## Changes Made

### 1. Package Updates
- `@pinia/nuxt`: ^0.5.5 → ^0.11.3
- `pinia`: ^2.2.6 → ^3.0.4
- Added: `pinia-plugin-persistedstate`: ^4.7.1

### 2. Configuration (nuxt.config.ts)
```typescript
modules: [
  '@pinia/nuxt',
  'pinia-plugin-persistedstate/nuxt', // ✨ Added
  // ... other modules
],

piniaPluginPersistedstate: {
  storage: 'localStorage',
  debug: process.env.NODE_ENV === 'development',
},
```

### 3. Accessories Store (app/stores/accessories.ts)
**Before**: Manual localStorage with watchers (35+ lines of code)
**After**: Automatic persistence with plugin (2 lines of config)

```typescript
}, {
  persist: {
    paths: ['cartItems', 'selectedModel'],
  },
});
```

**Removed**:
- Manual localStorage.getItem() calls
- Manual localStorage.setItem() calls
- watch() functions for syncing
- process.client checks
- try/catch error handling

**Benefits**:
✅ Cleaner, more maintainable code
✅ Automatic SSR safety
✅ Cross-tab synchronization
✅ Type-safe persistence

### 4. Price Builder Store (app/stores/priceBuilder.ts)
**Added**: Configuration persistence for better UX

```typescript
persist: {
  storage: persistedState.localStorage,
  paths: [
    'selectedModel',
    'selectedVariant',
    'accessories',
    'accessoryPacks',
    'financeOptions',
    'tradeIn',
  ],
},
```

## How to Test

### Test 1: Shopping Cart Persistence
1. Navigate to http://localhost:3001/accessories
2. Select a Hyundai model
3. Add items to cart
4. **Reload the page** (Cmd/Ctrl + R)
5. ✅ Cart items should still be there
6. ✅ Selected model should be remembered

### Test 2: Cross-Tab Synchronization
1. Open http://localhost:3001/accessories in two browser tabs
2. Add items to cart in Tab 1
3. Switch to Tab 2
4. ✅ Cart should automatically sync (may require refresh in some browsers)

### Test 3: Price Builder Persistence
1. Navigate to a calculator/price builder page
2. Configure a vehicle with:
   - Selected variant
   - Accessories
   - Finance options
   - Trade-in details
3. **Reload the page**
4. ✅ All selections should be preserved

### Test 4: Clear Cart
1. Add items to cart
2. Clear the cart using the UI
3. Reload the page
4. ✅ Cart should be empty

### Test 5: Developer Tools Check
1. Open browser DevTools (F12)
2. Go to Application → Local Storage → http://localhost:3001
3. Look for keys:
   - `accessories` (contains cartItems and selectedModel)
   - `priceBuilder` (contains configuration state)
4. ✅ Should see JSON data stored

## Debugging

If persistence isn't working:

1. **Check Console**: Look for debug messages (enabled in development)
2. **Check localStorage**: Open DevTools → Application → Local Storage
3. **Clear Storage**: If needed, clear localStorage and test again
4. **Check Network**: Ensure no SSR hydration errors in console

## Advanced Features Available

The plugin supports additional features you can configure:

### Cookie-Based Storage (for SSR)
```typescript
persist: {
  storage: persistedState.cookies,
  cookieOptions: {
    maxAge: 60 * 60 * 24 * 7, // 7 days
    sameSite: 'lax',
  },
}
```

### Session Storage
```typescript
persist: {
  storage: persistedState.sessionStorage,
}
```

### Custom Serializer
```typescript
persist: {
  serializer: {
    serialize: JSON.stringify,
    deserialize: JSON.parse,
  },
}
```

### Selective Paths with Omit
```typescript
persist: {
  paths: ['cartItems', 'selectedModel'],
  // OR
  omit: ['loadingState', 'error'],
}
```

## Migration Notes

✅ **Breaking Changes**: None for end users
✅ **Data Migration**: Existing localStorage data should work (same keys)
⚠️ **Testing Needed**: Test all cart workflows thoroughly

## Resources

- [Official Documentation](https://prazdevs.github.io/pinia-plugin-persistedstate/)
- [Nuxt Integration Guide](https://prazdevs.github.io/pinia-plugin-persistedstate/frameworks/nuxt.html)
- [GitHub Repository](https://github.com/prazdevs/pinia-plugin-persistedstate)
