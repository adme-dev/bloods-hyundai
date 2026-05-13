# Finance Widget — Condition-Based Display Filter

**Date:** 2026-05-13
**Status:** Approved for planning
**Author:** Paul (with Claude)

## Problem

The dealer admin can enable a global "Use External Finance Widget" toggle at `/admin/settings/finance-widget`. When on, the widget replaces the standard vehicle enquiry form on every vehicle page and the dedicated finance page, regardless of the vehicle's condition (New / Demo / Used).

The admin needs finer control: the widget should only replace the form for selected conditions. For example, "only show the finance widget on Used vehicles; New and Demo keep the standard enquiry form."

## Goal

Add a per-condition allow-list to finance widget settings so the admin can pick which vehicle conditions (New, Demo, Used) trigger widget replacement. Vehicles whose condition is not in the allow-list — including vehicles with missing or non-standard conditions like "Certified" — fall back to the standard enquiry form.

## Non-Goals

- Per-condition widget URLs (one URL is shared across conditions; condition is already appended as a URL parameter today).
- Filtering on attributes other than condition (price, make, model, year, etc.).
- Changing the generic "Contact us" modal (`EnquireModal.vue`), which has no vehicle context.

## Design

### Data shape

Add `enabledConditions` to the existing `financeWidget` object inside `dealers.settings` (a JSON column — no DB migration required):

```ts
financeWidget: {
  useFinanceWidget: boolean
  financeWidgetIframe: string | null
  financeWidgetProvider: string | null
  enabledConditions: Array<'new' | 'used' | 'demo'>  // NEW
}
```

**Default for existing dealers:** when `enabledConditions` is missing from a dealer's stored settings, treat it as `['new', 'used', 'demo']` (all three). This preserves current behavior for any dealer that hasn't opened the settings page since this change ships.

### Admin UI — `app/pages/admin/settings/finance-widget.vue`

Inside the "external widget configuration" section (the block already conditional on `form.useFinanceWidget`), add a "Display on" field group with three checkboxes:

- ☑ New
- ☑ Demo
- ☑ Used

Default state when the page loads: whatever the API returns. For new/unconfigured dealers: all three checked.

**Validation:** at least one condition must remain checked. If the admin unchecks all three, disable the Save button and show inline copy: *"Select at least one condition, or turn off the widget entirely."*

**Helper copy under the checkboxes:** *"The finance widget will replace the standard enquiry form only for vehicles matching these conditions. Other vehicles will continue to show the built-in enquiry form."*

### API contract

**`GET /api/admin/settings/finance-widget`** (server/api/admin/settings/finance-widget.get.ts)
- Returns the existing fields plus `enabledConditions: string[]`.
- When the stored value is missing, return `['new', 'used', 'demo']`.

**`PUT /api/admin/settings/finance-widget`** (server/api/admin/settings/finance-widget.put.ts)
- Accept `enabledConditions` in the body.
- Validate: must be an array, each element ∈ `{'new','used','demo'}`, length ≥ 1, no duplicates.
- Reject with 400 if validation fails.
- Persist into `dealers.settings.financeWidget.enabledConditions`.

**`GET /api/finance-widget-settings`** (server/api/finance-widget-settings.get.ts) — public consumer endpoint
- Return `enabledConditions` alongside existing fields so the frontend can filter without an extra round-trip.
- Same default fallback as the admin GET.

### Frontend filtering

Four consumer components currently compute `useFinanceWidget` from `settings.useFinanceWidget`. Update each to AND that against the vehicle's condition.

Affected files:

1. `app/components/search/VehicleEnquiryForm.vue`
2. `app/components/search/SingleForm.vue`
3. `app/components/vehicle/VehicleEnquiryModal.vue`
4. `app/pages/finance/[id]/[slug].vue`

Replacement pattern for the existing `useFinanceWidget` computed:

```ts
const useFinanceWidget = computed(() => {
  const settings = financeWidgetData.value?.settings
  if (!settings?.useFinanceWidget) return false

  const enabled = settings.enabledConditions ?? ['new', 'used', 'demo']
  const vehicleCondition = getDisplay(vehicle?.condition)?.toLowerCase()

  if (!vehicleCondition || !['new', 'used', 'demo'].includes(vehicleCondition)) {
    return false
  }
  return enabled.includes(vehicleCondition as 'new' | 'used' | 'demo')
})
```

Each file already has its own `getDisplay(vehicle?.condition)` helper and its own `vehicle` reference (props or pageData). The pattern above adapts to whichever the file uses.

**`EnquireModal.vue` — intentionally unchanged.** This is the generic contact-us modal triggered from header/footer buttons. It has no `vehicle` prop; it hardcodes `condition: 'new'` when sending the lead (line 418). Because there is no real vehicle context, condition filtering doesn't meaningfully apply — and applying the hardcoded `'new'` would silently couple this modal to the New checkbox, which is not what the admin would expect. Leave existing behavior: widget shows when `useFinanceWidget` is on.

### Backwards compatibility

- No DB migration. `dealers.settings` is a JSON column.
- Read side: missing `enabledConditions` ⇒ `['new', 'used', 'demo']`.
- Write side: PUT requires the field, but the admin form pre-populates it from GET (which fills in the default), so the first save will always include the array.
- Behavioral impact for existing dealers: none until they open the settings page and change it.

## Edge cases

| Case | Behavior |
|---|---|
| `useFinanceWidget` is `false` | Widget never shows. Condition filter is irrelevant. |
| `enabledConditions` missing in DB | Treat as all three; widget shows for any New/Demo/Used vehicle. |
| Vehicle condition is `null`/empty | Standard enquiry form. |
| Vehicle condition is e.g. `"Certified"` | Standard enquiry form (not in the canonical New/Demo/Used set). |
| Admin unchecks all three conditions | Save button disabled with inline error message. |
| Admin saves with widget toggle on but iframe URL blank | Existing behavior unchanged — frontend `useFinanceWidget` already requires `financeWidgetIframeUrl` to be truthy before rendering. |
| `EnquireModal` (no vehicle context) | Widget shows when toggle is on, regardless of `enabledConditions`. |

## Testing strategy

- **Manual UAT in admin:** toggle widget on, uncheck Used, save. Reload page — checkboxes reflect saved state.
- **Manual UAT on frontend:**
  - Pick a Used vehicle → confirm standard enquiry form shows.
  - Pick a New vehicle → confirm finance widget shows.
  - Open header "Contact us" modal → confirm widget shows (modal exception).
- **Validation:** uncheck all three → confirm Save is disabled.
- **Defaults:** clear `financeWidget.enabledConditions` from a dealer's JSON manually → confirm frontend treats it as all three enabled.

## Files changed

| File | Change |
|---|---|
| `app/pages/admin/settings/finance-widget.vue` | Add checkbox group, form field, validation |
| `server/api/admin/settings/finance-widget.get.ts` | Return `enabledConditions` with fallback |
| `server/api/admin/settings/finance-widget.put.ts` | Validate + persist `enabledConditions` |
| `server/api/finance-widget-settings.get.ts` | Return `enabledConditions` (public) with fallback |
| `app/components/search/VehicleEnquiryForm.vue` | Filter `useFinanceWidget` by condition |
| `app/components/search/SingleForm.vue` | Filter `useFinanceWidget` by condition |
| `app/components/vehicle/VehicleEnquiryModal.vue` | Filter `useFinanceWidget` by condition |
| `app/pages/finance/[id]/[slug].vue` | Filter `useFinanceWidget` by condition |
| `app/components/modals/EnquireModal.vue` | No change (no vehicle context) |
