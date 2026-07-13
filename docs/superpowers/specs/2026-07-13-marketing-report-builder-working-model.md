# Marketing Report Builder — Working Model

**Date:** 2026-07-13
**Route:** `/admin/marketing-report`
**Primary user:** Dealer administrators reviewing real marketing performance for the active report period.

## 1. Goals and non-goals

### Goals

- Replace the Phase 3 placeholder with a usable, read-only report builder.
- Aggregate only data already returned by the Marketing Hub report endpoint.
- Let an administrator select a supported row breakdown and one or more compatible metrics.
- Recalculate results immediately, support sortable columns, and preserve honest empty/unavailable states.
- Keep the approved Marketing Hub visual language, responsive table containment, dark theme, keyboard operation, and table semantics.

### Non-goals

- Saved report templates, export, sharing, drag-and-drop, pagination, or new database tables.
- Inventing unsupported time-of-day, campaign-level audience, or row-level ROAS data.
- Joining GA4 rows to advertising campaigns without a real shared key.
- Mutating provider or CRM data.

## 2. User flow and interaction states

1. The builder opens with `Platform + Campaign` rows and `Spend + CRM leads + CPL` values.
2. Dimension and metric chips are real buttons with selected and disabled states.
3. `Platform` can accompany any row breakdown. One detail grain can be active at a time:
   - campaign;
   - paid-audience age, area, or ad device;
   - website landing page, source/medium, or website device.
4. Selecting a different detail grain replaces the previous grain and retains `Platform` when selected.
5. Metrics incompatible with the active grain are disabled. A grain change retains compatible selected metrics and supplies a valid default only when none remain.
6. Selected row and value chips can be removed, while the builder always restores a valid minimum selection.
7. Selecting a table heading sorts that column; selecting it again reverses direction. The active sort exposes `aria-sort`.
8. Changing the page date range reloads the report and the builder recomputes from the new payload.

States:

- **Loading/error:** owned by the existing route-level report states.
- **Results:** display the computed row count and real report-period values.
- **No rows:** explain that no real data exists for the selected breakdown and period; never render samples.
- **Unavailable metric:** the control is disabled with an explanatory title and cannot enter the selected values.

## 3. Data model and API contracts

No API change is required. The builder consumes these existing `ReportResponse` fields:

| Grain | Source | Available metrics |
|---|---|---|
| Campaign | `campaigns` | Spend, CRM leads, CPL, clicks, CTR, impressions |
| Age / area / ad device | `audienceBreakdowns` | Spend, clicks, CTR, impressions |
| Landing page / source-medium / website device | `websiteAnalytics` breakdown rows | Sessions, users, key events |
| Platform only | Advertising campaigns plus GA4 period totals | The relevant advertising or website metrics, rendered on provider-specific rows |

Derived metrics use aggregate numerators and denominators:

- `CPL = spend / CRM leads`, otherwise null.
- `CTR = clicks / impressions × 100`, otherwise null.
- Missing values remain null and render as `—`; measured zero remains zero.

The pure builder utility accepts a structurally typed subset of the report response and returns rows containing selected dimension labels and nullable metric values. It performs no network calls and owns no Vue state.

## 4. Security, permissions, and tenant isolation

- Existing `auth` middleware and the existing admin endpoint remain the permission boundary.
- The client aggregates only the already-authorized response for the current dealer; it does not request arbitrary tenant identifiers.
- Row labels are rendered through Vue interpolation, not raw HTML.
- The feature adds no writes, secrets, uploads, or external requests.

## 5. Failure modes and observability

- Empty provider arrays yield an explicit compact empty state.
- Zero denominators yield `null`, preventing `NaN` or infinity.
- Unknown/missing dimension labels normalize to `Unknown`, avoiding blank row keys.
- Incompatible selections are normalized before aggregation.
- Existing report request and sync error surfaces remain unchanged. No new server operation is introduced, so no new production logging is required.

## 6. Testing and rollout

Automated coverage:

- Unit tests for campaign, audience, and website aggregation; zero-denominator behavior; compatibility normalization; and sorting.
- UI source contract tests for real buttons, disabled states, live row status, sortable headers, and removal of placeholder/sample copy.
- Project typecheck and build.

Browser verification:

- Desktop and mobile widths.
- Keyboard selection and sorting.
- Light/dark readability.
- No console errors, hydration warnings, failed builder requests, or page-level horizontal overflow.

Rollout is an in-place replacement of the Phase 3 preview. It is low-risk and reversible because it introduces no persistence or API mutation.

## Success criteria

- Every displayed builder value traces to the current authorized report response or a documented ratio derived from it.
- Unsupported controls are absent or disabled; no placeholder connection and no dummy figure remains.
- The default campaign report produces real rows whenever campaign data exists.
- Empty periods show an honest, actionable state.
- The builder is usable with pointer and keyboard at desktop and mobile widths.

## Verification commands

```sh
node --import tsx --test test/marketing-report-builder.test.ts test/marketing-hub-ui.test.ts
npm run typecheck
npm run build
```
