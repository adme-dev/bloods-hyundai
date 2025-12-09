# Hyundai Models Data

This directory contains the official Hyundai vehicle models data for the accessories store.

## Files

### `hyundai-models.json`

Contains the complete list of Hyundai models available for accessories, sourced from the official Hyundai Australia website.

**Data Source**: https://www.hyundai.com/au/en/owning/accessories
**Last Updated**: 2025-12-09

## Structure

```json
{
  "models": [
    {
      "name": "Model Name",
      "slug": "url-slug",
      "category": "Category",
      "groupId": "GROUP_ID"
    }
  ],
  "categories": [
    {
      "id": "category-id",
      "name": "Display Name",
      "order": 1
    }
  ],
  "meta": {
    "source": "https://...",
    "lastUpdated": "2025-12-09",
    "totalModels": 19
  }
}
```

## Models List

### SUVs & People Movers (5 models)
- Tucson (`/accessories/tucson`)
- Kona (`/accessories/kona`)
- Venue (`/accessories/venue`)
- Santa Fe (`/accessories/santa-fe`)
- Palisade (`/accessories/palisade`)

### Electric (5 models)
- IONIQ 9 (`/accessories/ioniq9`)
- IONIQ 5 (`/accessories/ioniq5`)
- IONIQ 5 N (`/accessories/ioniq5-n`)
- IONIQ 6 (`/accessories/ioniq6`)
- INSTER (`/accessories/inster`)

### Hatch & Sedans (4 models)
- i30 (`/accessories/i30`)
- i30 N Line (`/accessories/i30-n-line`)
- i30 Sedan (`/accessories/i30-sedan`)
- Sonata N Line (`/accessories/sonata-n-line`)

### Performance (3 models)
- i30 N (`/accessories/i30-n`)
- i30 Sedan N (`/accessories/i30-sedan-n`)
- i20 N (`/accessories/i20-n`)

### Vans & Trucks (2 models)
- Staria (`/accessories/staria`)
- Staria Load (`/accessories/staria-load`)

## Usage

The data is imported and used in the accessories store:

```typescript
import hyundaiModelsData from '~/data/hyundai-models.json';

export const HYUNDAI_MODELS = hyundaiModelsData.models as HyundaiModel[];
```

## Updating the Data

To update the model list:

1. Visit https://www.hyundai.com/au/en/owning/accessories
2. Check for new models or changes to existing models
3. Update `hyundai-models.json` with the correct:
   - Model names (as displayed on the website)
   - URL slugs (lowercase, hyphenated)
   - Categories (SUV, Electric, Hatch, Sedan, Performance, Van)
   - Group IDs (if available from the API)
4. Update the `meta.lastUpdated` field
5. Update the `meta.totalModels` count
6. Update this README if categories change

## Category Display Names

The frontend displays categories with friendly names:

- **SUV** → "SUVs & People Movers"
- **Electric** → "Electric"
- **Hatch** + **Sedan** → "Hatch & Sedans" (combined)
- **Performance** → "Performance"
- **Van** → "Vans & Trucks"

## URL Slug Guidelines

- All lowercase
- Spaces replaced with hyphens
- Special characters removed
- Examples:
  - "IONIQ 5 N" → `ioniq5-n`
  - "Santa Fe" → `santa-fe`
  - "i30 N Line" → `i30-n-line`
