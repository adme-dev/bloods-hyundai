# Accessories Store SEO Implementation

## URL Structure

The accessories store uses a clean, SEO-friendly URL structure:

```
/accessories                    # Main accessories landing page
/accessories/kona              # Kona-specific accessories
/accessories/tucson            # Tucson-specific accessories
/accessories/santa-fe          # Santa Fe-specific accessories
# ... etc for all models
```

## Available Models & URLs

| Model | URL | Category |
|-------|-----|----------|
| Tucson | `/accessories/tucson` | SUV |
| Kona | `/accessories/kona` | SUV |
| Venue | `/accessories/venue` | SUV |
| Santa Fe | `/accessories/santa-fe` | SUV |
| Palisade | `/accessories/palisade` | SUV |
| IONIQ 5 | `/accessories/ioniq5` | Electric |
| IONIQ 6 | `/accessories/ioniq6` | Electric |
| IONIQ 5 N | `/accessories/ioniq5n` | Electric |
| INSTER | `/accessories/inster` | Electric |
| i30 | `/accessories/i30` | Hatch |
| i30 Sedan | `/accessories/i30-sedan` | Sedan |
| i30 N | `/accessories/i30n` | Performance |
| i30 Sedan N | `/accessories/i30-sedan-n` | Performance |
| i20 N | `/accessories/i20n` | Performance |
| Staria | `/accessories/staria` | Van |
| Staria Load | `/accessories/staria-load` | Van |

## SEO Features Implemented

### 1. Enhanced Meta Tags

**Index Page** (`/accessories`):
- **Title**: "Hyundai Genuine Accessories | Sale Hyundai Victoria"
- **Description**: Comprehensive 160-character description highlighting key accessories and 5-year warranty
- **Open Graph**: Complete OG tags for social sharing
- **Twitter Card**: Large image card for Twitter sharing
- **Canonical URL**: Self-referential canonical

**Model Pages** (`/accessories/[model]`):
- **Dynamic Title**: "{Model} Accessories | Genuine Parts | Sale Hyundai"
- **Dynamic Description**: Model-specific description with keywords
- **Model Image**: Uses model image when available
- **Canonical URL**: Model-specific canonical

### 2. Structured Data (Schema.org)

**Index Page**:
```json
{
  "@type": "ItemList",
  "name": "Hyundai Genuine Accessories",
  "description": "Complete range of Hyundai Genuine Accessories for all models",
  "numberOfItems": 16,
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Tucson Accessories",
      "url": "https://salehyundai.com.au/accessories/tucson"
    },
    // ... all models
  ]
}
```

**Model Pages**:
```json
{
  "@type": "Product",
  "name": "{Model} Accessories",
  "description": "Genuine Hyundai accessories for {Model}",
  "brand": {
    "@type": "Brand",
    "name": "Hyundai"
  },
  "offers": {
    "@type": "AggregateOffer",
    "priceCurrency": "AUD",
    "availability": "https://schema.org/InStock",
    "seller": {
      "@type": "AutoDealer",
      "name": "Sale Hyundai",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Sale",
        "addressRegion": "VIC",
        "addressCountry": "AU"
      }
    }
  }
}
```

### 3. Breadcrumbs with Schema.org

A reusable breadcrumb component with structured data:

```vue
<AccessoriesBreadcrumb />          // For index page
<AccessoriesBreadcrumb model="Kona" />  // For model pages
```

Breadcrumb Schema:
```json
{
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://salehyundai.com.au/"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Accessories",
      "item": "https://salehyundai.com.au/accessories"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "{Model}",
      "item": "https://salehyundai.com.au/accessories/{model}"
    }
  ]
}
```

### 4. Route Rules for Performance

```typescript
'/accessories': {
  ssr: true,                    // Server-side rendering for SEO
  isr: 3600,                    // Incremental Static Regeneration (1 hour)
  headers: {
    'Cache-Control': 'public, max-age=3600, s-maxage=3600',
  },
},
'/accessories/**': {
  ssr: true,
  isr: 3600,
  headers: {
    'Cache-Control': 'public, max-age=3600, s-maxage=3600',
  },
},
```

## Key SEO Benefits

### 1. **Crawlability**
- ✅ Clean URLs without query parameters
- ✅ Server-side rendering (SSR) for search engines
- ✅ Proper breadcrumb navigation

### 2. **Indexability**
- ✅ Unique titles and descriptions for each page
- ✅ Canonical URLs to prevent duplicate content
- ✅ Structured data for rich snippets

### 3. **User Experience**
- ✅ Breadcrumbs for easy navigation
- ✅ Fast page loads with ISR caching
- ✅ Mobile-friendly responsive design

### 4. **Rich Snippets**
- ✅ Product schema for Google Shopping
- ✅ Breadcrumb schema for enhanced search results
- ✅ Organization schema for business information

## Testing Your SEO

### 1. Google Rich Results Test
Test structured data:
```
https://search.google.com/test/rich-results
```

Enter your URLs:
- `https://salehyundai.com.au/accessories`
- `https://salehyundai.com.au/accessories/kona`

### 2. Meta Tags Validation
Use tools like:
- [Meta Tags](https://metatags.io/)
- [Open Graph Debugger](https://www.opengraph.xyz/)

### 3. Lighthouse SEO Audit
Run in Chrome DevTools:
```bash
# Target scores:
- Performance: 90+
- SEO: 95+
- Accessibility: 95+
- Best Practices: 90+
```

### 4. Schema Markup Validator
```
https://validator.schema.org/
```

## Local Development Testing

View the implemented SEO features:

1. **Start dev server**:
   ```bash
   npm run dev
   ```

2. **View pages**:
   - Main page: http://localhost:3000/accessories
   - Kona: http://localhost:3000/accessories/kona
   - Tucson: http://localhost:3000/accessories/tucson

3. **View source** (Cmd/Ctrl + U) to see:
   - Meta tags in `<head>`
   - Structured data in `<script type="application/ld+json">`
   - Breadcrumb markup

## Sitemap Integration

The URLs are automatically included in the sitemap:

```xml
<url>
  <loc>https://salehyundai.com.au/accessories</loc>
  <changefreq>weekly</changefreq>
  <priority>0.8</priority>
</url>
<url>
  <loc>https://salehyundai.com.au/accessories/kona</loc>
  <changefreq>weekly</changefreq>
  <priority>0.7</priority>
</url>
```

## Future Enhancements

Consider adding:

1. **FAQ Schema** - For common accessory questions
2. **Video Schema** - If you add product videos
3. **Review Schema** - Customer reviews for accessories
4. **Price Range** - Add price information to structured data
5. **Product Images** - Enhanced image schema for gallery

## Keywords Strategy

**Primary Keywords**:
- Hyundai genuine accessories
- {Model} accessories
- Hyundai roof racks
- Hyundai tow bars
- Hyundai alloy wheels

**Long-tail Keywords**:
- Genuine {Model} roof rack
- {Model} interior accessories
- Hyundai {Model} cargo accessories
- {Model} protection accessories

**Local Keywords**:
- Hyundai accessories Sale Victoria
- Hyundai dealer Sale
- Genuine Hyundai parts Victoria

## Social Sharing

When users share your accessories pages:

**Facebook/LinkedIn**:
- Shows model image or default accessory image
- Displays: "{Model} Accessories | Sale Hyundai"
- Description: Highlights 5-year warranty and expert fitting

**Twitter**:
- Large image card format
- Concise description optimized for Twitter

## Performance Metrics

Expected performance with ISR caching:

- **TTFB** (Time to First Byte): <200ms
- **FCP** (First Contentful Paint): <1.2s
- **LCP** (Largest Contentful Paint): <2.5s
- **CLS** (Cumulative Layout Shift): <0.1

## Monitoring

Monitor SEO performance:

1. **Google Search Console**
   - Track impressions and clicks
   - Monitor mobile usability
   - Check structured data errors

2. **Google Analytics**
   - Track accessories page views
   - Monitor conversion rates
   - Analyze user flow

3. **Core Web Vitals**
   - Monitor LCP, FID, CLS
   - Track performance over time
