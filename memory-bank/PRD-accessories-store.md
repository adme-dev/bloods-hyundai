# Product Requirements Document (PRD)
# Hyundai Accessories Store R&D

## Document Information
- **Version:** 1.0
- **Created:** December 8, 2025
- **Project:** Sale Hyundai Website - Accessories Shop Feature
- **Status:** R&D / MVP Complete
- **URL:** `/accessories`

---

## 1. Executive Summary

### 1.1 Overview
A fully-featured accessories e-commerce experience allowing customers to browse Hyundai Genuine Accessories for their specific vehicle model, build a shopping cart, and submit an enquiry for purchase/fitment.

### 1.2 Goals
- **Showcase Hyundai Genuine Accessories** with an intuitive shopping experience
- **Model-specific browsing** - only show compatible accessories
- **Cart functionality** - build a wish list before enquiring
- **Drive accessory sales** through the dealership

### 1.3 Current Status
✅ **MVP Complete** - The following is implemented:
- Model selector with all Hyundai models
- Real-time API integration with Hyundai Australia
- Accessories grid with filtering, search, sorting
- Shopping cart with localStorage persistence
- Value packs with savings display
- Accessory detail modal

---

## 2. Feature Overview

### 2.1 Live URL
```
http://localhost:3000/accessories
http://localhost:3000/accessories/[model]  (e.g., /accessories/tucson)
```

### 2.2 User Flow
```
┌──────────────────────────────────────────────────────────────────────────────┐
│                           ACCESSORIES SHOP FLOW                               │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐       │
│   │   SELECT MODEL  │────▶│ BROWSE & FILTER │────▶│   ADD TO CART   │       │
│   │   /accessories  │     │   Accessories   │     │                 │       │
│   └─────────────────┘     └─────────────────┘     └────────┬────────┘       │
│                                                            │                 │
│   ┌─────────────────────────────────────────────────────────┘                │
│   │                                                                          │
│   ▼                                                                          │
│   ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐       │
│   │  VIEW CART      │────▶│  SUBMIT ENQUIRY │────▶│   DEALER        │       │
│   │  Review items   │     │  Contact form   │     │   FOLLOW UP     │       │
│   └─────────────────┘     └─────────────────┘     └─────────────────┘       │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Technical Implementation

### 3.1 Architecture
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND                                        │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                    PAGES                                             │   │
│   │   /accessories          - Model selector + shop                      │   │
│   │   /accessories/[model]  - Direct link to model accessories           │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                    COMPONENTS                                        │   │
│   │   AccessoryCard         - Individual accessory display               │   │
│   │   AccessoryPackCard     - Value pack with savings                    │   │
│   │   AccessoriesCart       - Slide-out cart sidebar                     │   │
│   │   ModelSelector         - Grid of Hyundai models                     │   │
│   │   AccessoryDetailModal  - Full accessory details                     │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                    STORE (Pinia)                                     │   │
│   │   app/stores/accessories.ts                                          │   │
│   │   - selectedModel, accessories, accessoryPacks                       │   │
│   │   - cartItems (localStorage persisted)                               │   │
│   │   - Filters: category, search, sort, popular                         │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              BACKEND                                         │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │   /api/accessories                                                   │   │
│   │   - Accepts ?groupId=xxx or ?model=model-name                        │   │
│   │   - Maps model names to Hyundai CMS groupIds                         │   │
│   │   - Fetches from Hyundai Australia API                               │   │
│   │   - Transforms/normalizes accessory data                             │   │
│   │   - Returns categorized accessories + packs                          │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      HYUNDAI AUSTRALIA API                                   │
│   https://www.hyundai.com/content/api/au/hyundai/v3/accessories             │
│   ?groupId={CMS_GROUP_ID}                                                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Files Structure
```
app/
├── pages/
│   └── accessories/
│       ├── index.vue           # Main accessories shop page
│       └── [model].vue         # Model-specific route
├── components/
│   └── accessories/
│       ├── AccessoryCard.vue       # Individual accessory card
│       ├── AccessoryPackCard.vue   # Value pack card
│       ├── AccessoriesCart.vue     # Cart sidebar
│       ├── AccessoryDetailModal.vue # Detail modal
│       └── ModelSelector.vue       # Model selection grid
├── stores/
│   └── accessories.ts          # Pinia store
server/
└── api/
    └── accessories.ts          # API endpoint
```

### 3.3 Data Types
```typescript
interface Accessory {
  id: string;
  name: string;
  description: string;
  price: number;           // Inc. GST & fitment
  rrp: number;             // Excluding fitment
  category: string;        // 'Interior', 'Exterior', 'Protection', etc.
  categoryName: string;
  image: string | null;
  thumbnail: string | null;
  partNumber: string;
  isPopular: boolean;      // Featured item
  isFitted: boolean;       // Requires fitment
  fittingPrice: number | null;
  features: string[];
  disclaimer: string;
  variants: any[];
}

interface AccessoryPack {
  id: string;
  name: string;
  title: string;
  description: string;
  price: number;
  savingsAmount: number;   // How much customer saves
  image: string | null;
  disclaimer: string;
  includedAccessories: {
    id: string;
    quantity: number;
    citation: string;
  }[];
}

interface CartItem {
  accessory: Accessory | AccessoryPack;
  quantity: number;
  type: 'accessory' | 'pack';
}

interface HyundaiModel {
  name: string;            // 'Tucson'
  slug: string;            // 'tucson'
  groupId: string;         // CMS-specific ID for API
  image?: string;
  category: 'SUV' | 'Electric' | 'Hatch' | 'Sedan' | 'Performance' | 'Van' | 'Hybrid';
}
```

---

## 4. Supported Models

### 4.1 Models with Known Group IDs
These models have verified CMS group IDs and work with the accessories API:

| Model | Slug | Group ID | Category |
|-------|------|----------|----------|
| Tucson | `tucson` | `990EEC2C-4AFE-4AD2-B016-73BCD2EB5B44` | SUV |
| Kona | `kona` | `9F6AA9F2-17C6-4148-B47B-1054467C933B` | SUV |
| Venue | `venue` | `4AEAFF7A-088F-4686-AE85-CEF84E83D8EE` | SUV |
| Santa Fe | `santa-fe` | `B58EB7A1-CD96-435C-A728-8E7748FE7520` | SUV |
| Palisade | `palisade` | `A15B22F2-30DE-4B8C-8A95-9E814662ECDD` | SUV |
| i30 | `i30` | `C4994B0D-A89D-4113-B6CD-B5D9352512C3` | Hatch |
| Staria | `staria` | `E14E5076-A170-4F6C-86EF-AEF77027B46A` | Van |
| Staria Load | `staria-load` | `E14E5076-A170-4F6C-86EF-AEF77027B46A` | Van |

### 4.2 Models Needing Group IDs
These models are listed but need their group IDs scraped from Hyundai website:

| Model | Slug | Category | Status |
|-------|------|----------|--------|
| IONIQ 5 | `ioniq5` | Electric | ⏳ Need groupId |
| IONIQ 6 | `ioniq6` | Electric | ⏳ Need groupId |
| IONIQ 5 N | `ioniq5n` | Electric | ⏳ Need groupId |
| INSTER | `inster` | Electric | ⏳ Need groupId |
| i30 N | `i30n` | Performance | ⏳ Need groupId |
| i30 Sedan N | `i30-sedan-n` | Performance | ⏳ Need groupId |
| i20 N | `i20n` | Performance | ⏳ Need groupId |

### 4.3 Group ID Scraping
The API can auto-scrape group IDs from Hyundai's website:
```typescript
// Scrapes model-series-id from:
// https://www.hyundai.com/au/en/owning/accessories/{model-name}
const groupId = await scrapeGroupId('ioniq-5');
```

---

## 5. Accessory Categories

Categories are sorted by display order:

| Category | Display Name | Icon | Order |
|----------|--------------|------|-------|
| Interior | Interior | 🪑 | 1 |
| Exterior | Exterior | 🚗 | 2 |
| Protection | Protection | 🛡️ | 3 |
| Cargo | Cargo & Storage | 📦 | 4 |
| Towing | Towing | 🔗 | 5 |
| Lifestyle | Lifestyle | 🏕️ | 6 |
| Audio & Electronics | Audio & Electronics | 🔊 | 7 |
| Wheels | Wheels & Tyres | 🛞 | 8 |
| Safety | Safety | 🦺 | 9 |
| Packs | Value Packs | 💰 | 10 |

---

## 6. Features

### 6.1 Implemented Features ✅

#### Model Selection
- Grid of available Hyundai models grouped by category
- Model images (placeholder icons currently)
- Click to load model-specific accessories

#### Accessories Browsing
- Grid layout with responsive columns (1-3 based on screen)
- Category filtering sidebar
- Text search across name, description, part number
- Sort by: Name (A-Z), Price (Low/High), Popular
- Popular items filter checkbox
- Clear filters button

#### Accessory Cards
- Product image with lazy loading
- Popular badge (star icon)
- Category label
- Product name (clickable for details)
- Part number
- Truncated description
- "Includes Fitment" badge where applicable
- Price display with RRP comparison
- Add to cart button (turns to checkmark when in cart)

#### Value Packs
- Dedicated section above individual accessories
- Shows savings amount prominently
- Lists included accessories
- Add entire pack to cart

#### Shopping Cart
- Slide-out sidebar from right
- Item list with images, names, prices
- Quantity adjustment (+/-)
- Remove item button
- Running total
- Clear cart button
- "Submit Enquiry" CTA

#### Detail Modal
- Full-size product image
- Complete description
- All features listed
- Disclaimer text
- Add to cart from modal

### 6.2 Planned Features ⏳

#### Phase 2: Enhanced UX
- [ ] Model images in selector (currently using emoji placeholders)
- [ ] Image gallery in detail modal
- [ ] Related accessories suggestions
- [ ] Recently viewed accessories
- [ ] Compare accessories feature

#### Phase 3: Enquiry Integration
- [ ] Dedicated accessories enquiry form
- [ ] Cart summary in enquiry
- [ ] Email notification to dealer
- [ ] Save cart for later (account-based)

#### Phase 4: Analytics & Optimization
- [ ] Track popular accessories
- [ ] A/B test layouts
- [ ] Personalized recommendations
- [ ] Price comparison with RRP

---

## 7. API Reference

### 7.1 GET `/api/accessories`

Fetch accessories for a specific model.

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `groupId` | string | One of these | Hyundai CMS group ID |
| `model` | string | One of these | Model name (e.g., "tucson", "santa-fe") |

**Response:**
```typescript
interface AccessoriesResponse {
  success: boolean;
  groupId?: string;
  modelName?: string;
  totalAccessories: number;
  totalPacks: number;
  
  accessories: Accessory[];
  accessoryPacks: AccessoryPack[];
  categorizedAccessories: Record<string, Accessory[]>;
  categories: string[];            // Sorted by display order
  categoryInfo: {
    key: string;
    displayName: string;
    icon: string;
    count: number;
  }[];
  
  // Raw data from Hyundai API
  modelSpecifications?: any[];
  variants?: any[];
  
  // Error handling
  error?: string;
  hint?: string;
  knownModels?: string[];         // When no model specified
}
```

**Examples:**
```bash
# By group ID
GET /api/accessories?groupId=990EEC2C-4AFE-4AD2-B016-73BCD2EB5B44

# By model name
GET /api/accessories?model=tucson

# With year prefix (normalized)
GET /api/accessories?model=2025-tucson
```

---

## 8. Store Reference

### 8.1 State
```typescript
// Core data
selectedModel: HyundaiModel | null
accessories: Accessory[]
accessoryPacks: AccessoryPack[]
categories: string[]
categorizedAccessories: Record<string, Accessory[]>

// Loading/Error
isLoading: boolean
error: string | null

// Cart (localStorage persisted)
cartItems: CartItem[]
showCart: boolean

// Filters
selectedCategory: string | null
searchQuery: string
showOnlyPopular: boolean
sortBy: 'name' | 'price-asc' | 'price-desc' | 'popular'
```

### 8.2 Getters
```typescript
availableModels: HyundaiModel[]           // All known models
modelsByCategory: Record<string, HyundaiModel[]>
filteredAccessories: Accessory[]          // After filters applied
cartTotal: number
cartItemCount: number
isInCart(accessoryId: string): boolean
```

### 8.3 Actions
```typescript
selectModel(model: HyundaiModel): Promise<void>
fetchAccessories(groupId?: string, modelName?: string): Promise<void>

// Cart
addToCart(accessory, type): void
removeFromCart(accessoryId): void
updateCartQuantity(accessoryId, quantity): void
clearCart(): void
toggleCart(show?: boolean): void

// Filters
setCategory(category: string | null): void
setSearchQuery(query: string): void
setSortBy(sort): void
togglePopularFilter(): void
resetFilters(): void
```

---

## 9. Route Configuration

### 9.1 `nuxt.config.ts` Route Rules
```typescript
routeRules: {
  // Accessories pages with ISR (1 hour cache)
  '/accessories': { isr: 3600 },
  '/accessories/**': { isr: 3600 },
}
```

---

## 10. Integration Points

### 10.1 With Vehicle Detail Pages
Could link from vehicle pages to pre-selected model accessories:
```vue
<NuxtLink :to="`/accessories/${model.slug}`">
  View Accessories for this Model
</NuxtLink>
```

### 10.2 With Enquiry Management System
When customer submits accessories enquiry, it flows into the same enquiry management system with type `accessories`:

```typescript
// Enquiry payload
{
  type: 'accessories',
  department: 'parts',
  vehicleInfo: {
    model: 'Tucson',
  },
  accessoriesCart: [
    { id: 'xxx', name: 'Roof Racks', quantity: 1, price: 599 },
    { id: 'yyy', name: 'Cargo Mat', quantity: 2, price: 149 },
  ],
  cartTotal: 897,
}
```

### 10.3 With SendGrid Emails
Customer confirmation email could include cart summary:
```html
<h3>Your Accessories Enquiry</h3>
<table>
  {{#each accessories_cart}}
  <tr>
    <td>{{this.name}}</td>
    <td>x{{this.quantity}}</td>
    <td>${{this.price}}</td>
  </tr>
  {{/each}}
</table>
<p><strong>Estimated Total:</strong> ${{cart_total}}</p>
```

---

## 11. Future Enhancements

### 11.1 Online Ordering
- Stripe checkout for accessories
- Deposit or full payment options
- Fitment appointment booking

### 11.2 Inventory Integration
- Real-time stock levels
- Lead times for out-of-stock items
- Backorder functionality

### 11.3 Fitment Scheduling
- Calendar integration for booking fitment
- SMS reminders
- Pre-fitment checklist

### 11.4 Multi-Dealer Support
- Dealer-specific pricing
- Dealer inventory visibility
- White-label per dealer

---

## 12. Appendix

### A. Hyundai Australia Accessories URL Pattern
```
Main page: https://www.hyundai.com/au/en/owning/accessories
Model page: https://www.hyundai.com/au/en/owning/accessories/{model-slug}
API: https://www.hyundai.com/content/api/au/hyundai/v3/accessories?groupId={groupId}
```

### B. Example API Response (Truncated)
```json
{
  "accessories": [
    {
      "accessoryId": "D3F15-AP000",
      "partName": "Roof Racks",
      "partNumber": "D3F15AP000",
      "category": "Exterior",
      "description": "Genuine Hyundai roof racks allow...",
      "rrpExFitment": 549.00,
      "rrpIncFitment": 599.00,
      "fitmentRequired": true,
      "isFeature": true,
      "image": "/content/dam/hyundai/au/accessories/tucson/roof-racks.png"
    }
  ],
  "accessoryPacks": [
    {
      "accessoryId": "VALUE-PACK-01",
      "partName": "Essential Pack",
      "price": 1299.00,
      "savings": 200.00,
      "accessories": [
        { "accessoryId": "D3F15-AP000", "quantity": 1 },
        { "accessoryId": "D3F15-AP001", "quantity": 1 }
      ]
    }
  ]
}
```

### C. Related Documentation
- Main PRD: `memory-bank/PRD-enquiry-management-system.md`
- Active Context: `memory-bank/activeContext.md`
- Progress: `memory-bank/progress.md`






