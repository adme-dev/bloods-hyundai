# Stock Card Promotions

Admin-managed promotional overlays for vehicle stock cards, ported from the ADME
landing page builder. Everything is controlled from **Admin → Settings → Stock
Card Promotions** (`/admin/settings/stock-card-promo`) and defaults to **off**.

## What a dealer can do

| Feature | What it shows | Where |
|---|---|---|
| **Was / Now pricing** | Strikethrough was-price, red "Save $X", "Now" price | Every vehicle card, site-wide |
| **Vehicle badges** | Coloured badge chip (e.g. "HOT DEAL") on the card image | Every vehicle card, site-wide |
| **Vehicle comments** | Per-vehicle scrolling strip on the card image | Every vehicle card, site-wide |
| **Scrolling banner** | Site-wide scrolling ticker along the bottom of card images, filterable by make / model / variant and **any combination of conditions** (e.g. New + Demo) | Matching vehicle cards |
| **Group offers** | Campaign rules (badge, comment, $-off or %-off) applied to every matching vehicle | Matching vehicle cards |
| **Graphics between cards** | Emotional promo tiles inserted after every Nth stock card | Homepage Stock Specials slider **and** the /car-sales grid |
| **Stock page header** | Full-width promotional banner (desktop + mobile artwork) | Top of /car-sales |

"Vehicle cards" means `ModernVehicleCard`, used on the homepage Stock Specials
slider, /car-sales grid, favourites, and related-vehicle strips.

Every section in the admin carries a **"Shown on:"** line telling the dealer
exactly where that content appears on the website, and the page header's
**Preview stock page** button opens /car-sales (cache-refreshed) — the page
where everything comes together.

## Key concepts

### Pricing: "Now" is always the live feed price
Per-vehicle offers store only a **was-price**. The car's live feed price is the
"Now" price automatically, so the card can never advertise a price different
from the feed. The card hides Was/Now entirely if the was-price isn't above the
live price, or the car is POA. Group offers express pricing as **$ off** or
**% off** instead — the was-price is derived per car from its live price.

### Matching
- **Per-vehicle offers** match by stock number (case-insensitive). Duplicates
  keep the last entry. Per-vehicle offers always beat group offers.
- **Group offers / banner filters** match make, model, variant and condition.
  The scrolling banner's condition filter is **multi-select** — tick any
  combination of New / Demo / Used; none ticked means all. Matching is
  slug-insensitive (`"i30 Sedan"` matches the feed's internal `"i30-sedan"`).
  Empty fields match everything. The first matching group rule wins.
- The admin shows a live "matches N cars right now" count per group rule and a
  green ✓ with the car's title/price per offer.

### Scheduling
Offers, group rules, **each individual graphic between cards**, and the stock
page header all take optional start/end dates — inclusive, evaluated in
**Australia/Melbourne** time on both server and client. Expired or future-dated content is stripped by the public
API, so it can never linger on cached pages. Status chips in the admin show
Live now / Scheduled / Expired / Off per item.

### Publishing & caching
Saving in the admin **publishes instantly**: the PUT invalidates the public
settings cache for the tenant (`stock-card-promo` Nitro cache, same pattern as
site-config). Visitors get a 5-minute cached response otherwise.
`GET /api/stock-card-promo-settings?refresh=true` forces a rebuild manually.

## Architecture

| Piece | Path |
|---|---|
| Schema, validation, resolvers (pure, unit-tested) | `shared/stockCardPromo.ts` |
| Admin page | `app/pages/admin/settings/stock-card-promo.vue` |
| Admin API (auth + editor-role gated) | `server/api/admin/settings/stock-card-promo.{get,put}.ts` |
| Public API (tenant-cached, window-filtered) | `server/api/stock-card-promo-settings.get.ts` |
| Client composable (shared fetch + per-vehicle resolution) | `app/composables/useStockCardPromo.ts` |
| Card rendering (badge, was/now, marquee) | `app/components/search/ModernVehicleCard.vue` |
| Promo graphic tile | `app/components/page-elements/StockPromoGraphicCard.vue` |
| Stock page header banner | `app/components/page-elements/StockPageHeaderBanner.vue` |
| Visual stock picker dialog | `app/components/admin/settings/StockVehiclePickerDialog.vue` |
| Colour field | `app/components/admin/settings/AdminColorField.vue` |
| Tests | `test/stock-card-promo-settings.test.ts`, `test/stock-card-promo-ui.test.ts` |

Settings persist in the `dealers.settings` JSONB column under the
`stockCardPromo` key (version 1). No dedicated tables; stock itself comes from
the live Carsales-style feed, never the database.

Key shared functions:
- `parseStockCardPromoInput` — validates admin input (plain text only, hex
  colours, HTTPS images on approved hosts, date sanity, discount ranges).
- `readStockCardPromoSettings` — normalises stored JSON; tolerant of legacy
  payloads missing newer fields.
- `resolveCardPromo(settings, vehicleAttrs)` — offer/group precedence and
  was-price derivation.
- `resolveCardScroller(settings, vehicleAttrs)` — banner targeting.
- `isPromoWindowActive` / `promoNow` — inclusive DD-MM-YYYY windows in
  Melbourne time.

## Validation & safety

- All copy is plain text (`<`/`>` rejected); rendering uses Vue interpolation
  only — no `v-html`.
- Image URLs must be HTTPS on an approved host (site domain, DriveAgent CDNs,
  the R2 public URL). Links must be internal paths or clean HTTPS.
- Badge/banner colours must be `#rrggbb`.
- A hidden graphic may be saved without an image (draft); a visible one cannot.
- Limits: 200 offers, 20 group rules, 6 graphics, interval 2–10, %-off ≤ 75.
- Every feature defaults to off; absent/legacy settings degrade to defaults.

## Media storage (R2)

Card graphics and header artwork upload through the shared media library to
Cloudflare R2, bucket **`dealer-assets`**, public URL
`https://pub-2b8337ab6f87485088d38cc01ca2ae80.r2.dev`. Config accepts both env
naming schemes (`R2_ACCESS_KEY_ID`/… and `CLOUDFLARE_R2_ACCESS_KEY`/…). The R2
access key is 32 chars and the secret 64 — a 40-char value is a Cloudflare API
token pasted in the wrong slot, and the media API will answer 503
"Media storage credentials are invalid" for any credential-shaped failure.
Pasting a direct image URL is always available as a fallback in the admin.

## Testing

```bash
npx tsx --test test/stock-card-promo-settings.test.ts test/stock-card-promo-ui.test.ts
npm run typecheck
```

Do **not** run `npm run build` locally — it runs production DB migrations.

## Troubleshooting

- **"Graphics between cards not working"** — check the interval: "Every 6th
  card" places the first tile after six cars (deep inside the homepage
  carousel). Use every 2nd/3rd for visibility, ensure the section Status is On,
  the graphic is Visible with an image, and hard-refresh after saving.
- **Save rejected (422)** — the red "Review the promotion settings" alert lists
  the exact reasons (missing image, unapproved host, HTML in text, bad dates).
- **Promo not on a card** — per-vehicle: stock number must match the feed
  (green ✓ confirms); group: check the "matches N cars" count and date window;
  feature toggles at the top of the page must be on.
