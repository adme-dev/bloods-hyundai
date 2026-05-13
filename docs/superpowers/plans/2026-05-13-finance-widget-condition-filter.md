# Finance Widget Condition Filter — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an admin-controlled allow-list of vehicle conditions (New / Demo / Used) that determines when the finance widget replaces the standard enquiry form on the public site.

**Architecture:** New `enabledConditions: Array<'new'|'used'|'demo'>` field stored in `dealers.settings.financeWidget` (JSON column — no migration). Admin settings page surfaces three checkboxes. Two existing endpoints (admin GET/PUT, public GET) round-trip the field. Four consumer Vue components extend their existing `useFinanceWidget` computed with a condition check. `EnquireModal.vue` (generic contact-us, no vehicle context) is intentionally untouched.

**Tech Stack:** Nuxt 3, Vue 3, TypeScript, Drizzle ORM, Neon Postgres, Tailwind/UnoCSS, shadcn-vue UI components, lucide-vue-next icons. No automated test framework — verification is `npm run typecheck` plus manual dev-server checks.

**Spec:** `docs/superpowers/specs/2026-05-13-finance-widget-condition-filter-design.md`

---

## Task 1: Backend — admin GET endpoint returns `enabledConditions`

**Files:**
- Modify: `server/api/admin/settings/finance-widget.get.ts`

- [ ] **Step 1: Add `enabledConditions` to the `FinanceWidgetSettings` interface and to the returned object, defaulting to all three when missing**

Replace the entire file contents with:

```ts
import { eq } from 'drizzle-orm';
import { db } from '../../../utils/db';
import { dealers } from '../../../database/schema';

export type VehicleCondition = 'new' | 'used' | 'demo';

export interface FinanceWidgetSettings {
  useFinanceWidget: boolean;
  financeWidgetIframe: string | null;
  financeWidgetProvider: string | null;
  enabledConditions: VehicleCondition[];
}

const DEFAULT_CONDITIONS: VehicleCondition[] = ['new', 'used', 'demo'];

/**
 * Admin API endpoint to get finance widget settings
 * GET /api/admin/settings/finance-widget
 */
export default defineEventHandler(async (event) => {
  const user = event.context.user;
  const dealerId = event.context.dealerId;

  if (!user || !dealerId) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized',
    });
  }

  try {
    const [dealer] = await db
      .select({
        settings: dealers.settings,
      })
      .from(dealers)
      .where(eq(dealers.id, dealerId))
      .limit(1);

    if (!dealer) {
      throw createError({
        statusCode: 404,
        message: 'Dealer not found',
      });
    }

    const settings = (dealer.settings as Record<string, any>) || {};
    const stored = settings.financeWidget ?? {};
    const storedConditions: unknown = stored.enabledConditions;
    const enabledConditions: VehicleCondition[] = Array.isArray(storedConditions)
      ? storedConditions.filter((c): c is VehicleCondition =>
          c === 'new' || c === 'used' || c === 'demo'
        )
      : DEFAULT_CONDITIONS;

    const financeWidgetSettings: FinanceWidgetSettings = {
      useFinanceWidget: stored.useFinanceWidget ?? false,
      financeWidgetIframe: stored.financeWidgetIframe ?? null,
      financeWidgetProvider: stored.financeWidgetProvider ?? null,
      enabledConditions: enabledConditions.length > 0 ? enabledConditions : DEFAULT_CONDITIONS,
    };

    return {
      success: true,
      settings: financeWidgetSettings,
    };
  } catch (error: any) {
    console.error('Error fetching finance widget settings:', error);
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch finance widget settings',
    });
  }
});
```

- [ ] **Step 2: Type-check**

Run: `npm run typecheck`
Expected: PASS (no new errors in this file)

- [ ] **Step 3: Commit**

```bash
git add server/api/admin/settings/finance-widget.get.ts
git commit -m "feat(finance-widget): admin GET returns enabledConditions with fallback"
```

---

## Task 2: Backend — admin PUT endpoint accepts and validates `enabledConditions`

**Files:**
- Modify: `server/api/admin/settings/finance-widget.put.ts`

- [ ] **Step 1: Add validation and persistence for `enabledConditions`**

Replace the entire file contents with:

```ts
import { eq } from 'drizzle-orm';
import { db } from '../../../utils/db';
import { dealers } from '../../../database/schema';

type VehicleCondition = 'new' | 'used' | 'demo';
const VALID_CONDITIONS: VehicleCondition[] = ['new', 'used', 'demo'];

/**
 * Admin API endpoint to update finance widget settings
 * PUT /api/admin/settings/finance-widget
 */
export default defineEventHandler(async (event) => {
  const user = event.context.user;
  const dealerId = event.context.dealerId;

  if (!user || !dealerId) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized',
    });
  }

  if (!['admin', 'dealer_admin'].includes(user.role)) {
    throw createError({
      statusCode: 403,
      message: 'Insufficient permissions',
    });
  }

  const body = await readBody(event);
  const { useFinanceWidget, financeWidgetIframe, financeWidgetProvider, enabledConditions } = body;

  // Validate iframe (unchanged behavior)
  if (financeWidgetIframe) {
    const trimmedIframe = financeWidgetIframe.trim();
    const isUrl = /^https?:\/\//i.test(trimmedIframe);
    const isIframeHtml = /<iframe/i.test(trimmedIframe);

    if (!isUrl && !isIframeHtml) {
      throw createError({
        statusCode: 400,
        message: 'Invalid iframe: must be a URL starting with http(s):// or iframe HTML code',
      });
    }

    if (/^(javascript|data):/i.test(trimmedIframe)) {
      throw createError({
        statusCode: 400,
        message: 'Invalid iframe URL: javascript: and data: protocols are not allowed',
      });
    }
  }

  // Validate enabledConditions
  if (!Array.isArray(enabledConditions)) {
    throw createError({
      statusCode: 400,
      message: 'enabledConditions must be an array',
    });
  }

  const normalized: VehicleCondition[] = [];
  for (const c of enabledConditions) {
    if (typeof c !== 'string' || !VALID_CONDITIONS.includes(c as VehicleCondition)) {
      throw createError({
        statusCode: 400,
        message: `Invalid condition '${c}'. Must be one of: ${VALID_CONDITIONS.join(', ')}`,
      });
    }
    if (!normalized.includes(c as VehicleCondition)) {
      normalized.push(c as VehicleCondition);
    }
  }

  if (normalized.length === 0) {
    throw createError({
      statusCode: 400,
      message: 'enabledConditions must contain at least one condition',
    });
  }

  try {
    const [currentDealer] = await db
      .select({ settings: dealers.settings })
      .from(dealers)
      .where(eq(dealers.id, dealerId))
      .limit(1);

    if (!currentDealer) {
      throw createError({
        statusCode: 404,
        message: 'Dealer not found',
      });
    }

    const currentSettings = (currentDealer.settings as Record<string, any>) || {};
    const updatedSettings = {
      ...currentSettings,
      financeWidget: {
        useFinanceWidget: Boolean(useFinanceWidget),
        financeWidgetIframe: financeWidgetIframe || null,
        financeWidgetProvider: financeWidgetProvider || null,
        enabledConditions: normalized,
      },
    };

    await db
      .update(dealers)
      .set({
        settings: updatedSettings,
        updatedAt: new Date(),
      })
      .where(eq(dealers.id, dealerId));

    return {
      success: true,
      message: 'Finance widget settings updated successfully',
      settings: updatedSettings.financeWidget,
    };
  } catch (error: any) {
    console.error('Error updating finance widget settings:', error);
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      message: 'Failed to update finance widget settings',
    });
  }
});
```

- [ ] **Step 2: Type-check**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 3: Manual verification via curl (after Task 4 is done you'll do this in the UI; for now confirm route still resolves)**

Run: `grep -c "enabledConditions" server/api/admin/settings/finance-widget.put.ts`
Expected: ≥ 5 (referenced in destructure, validation, normalization, persistence, error message)

- [ ] **Step 4: Commit**

```bash
git add server/api/admin/settings/finance-widget.put.ts
git commit -m "feat(finance-widget): admin PUT validates and persists enabledConditions"
```

---

## Task 3: Backend — public GET endpoint returns `enabledConditions`

**Files:**
- Modify: `server/api/finance-widget-settings.get.ts`

- [ ] **Step 1: Add `enabledConditions` to the public response**

Replace the entire file contents with:

```ts
import { eq } from 'drizzle-orm';
import { db } from '../utils/db';
import { dealers } from '../database/schema';

type VehicleCondition = 'new' | 'used' | 'demo';
const DEFAULT_CONDITIONS: VehicleCondition[] = ['new', 'used', 'demo'];

/**
 * Public API endpoint to get finance widget settings
 * Used by frontend components (VehicleEnquiryForm, Finance page) to determine
 * whether to show internal form or external finance widget iframe
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const dealerSlug = config.public.dealerSlug || 'bloods-hyundai';

  const fallback = {
    success: true as const,
    settings: {
      useFinanceWidget: false,
      financeWidgetIframe: null as string | null,
      financeWidgetProvider: null as string | null,
      enabledConditions: DEFAULT_CONDITIONS,
    },
  };

  try {
    const [dealer] = await db
      .select({
        settings: dealers.settings,
      })
      .from(dealers)
      .where(eq(dealers.slug, dealerSlug))
      .limit(1);

    if (!dealer) return fallback;

    const settings = (dealer.settings as Record<string, any>) || {};
    const stored = settings.financeWidget ?? {};
    const storedConditions: unknown = stored.enabledConditions;
    const enabledConditions: VehicleCondition[] = Array.isArray(storedConditions)
      ? storedConditions.filter((c): c is VehicleCondition =>
          c === 'new' || c === 'used' || c === 'demo'
        )
      : DEFAULT_CONDITIONS;

    return {
      success: true,
      settings: {
        useFinanceWidget: stored.useFinanceWidget ?? false,
        financeWidgetIframe: stored.financeWidgetIframe ?? null,
        financeWidgetProvider: stored.financeWidgetProvider ?? null,
        enabledConditions: enabledConditions.length > 0 ? enabledConditions : DEFAULT_CONDITIONS,
      },
    };
  } catch (error: any) {
    console.error('Error fetching finance widget settings:', error);
    return fallback;
  }
});
```

- [ ] **Step 2: Type-check**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add server/api/finance-widget-settings.get.ts
git commit -m "feat(finance-widget): public GET returns enabledConditions"
```

---

## Task 4: Admin UI — checkbox group with validation

**Files:**
- Modify: `app/pages/admin/settings/finance-widget.vue`

This task adds three checkboxes (New / Demo / Used) inside the external-widget configuration block, wires them to `form.enabledConditions`, validates at least one is checked, and sends the array on save.

- [ ] **Step 1: Locate the existing imports block (around lines 196–213) and add `Checkbox` to the shadcn-vue imports**

Find this block:

```ts
import { Switch } from '~/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
```

Insert immediately after it:

```ts
import { Checkbox } from '~/components/ui/checkbox';
```

Note: if `~/components/ui/checkbox` doesn't exist in this project, fall back to a native `<input type="checkbox" class="...">` markup in Step 3 — the rest of the logic is identical. Run `ls app/components/ui/checkbox` to check before importing.

- [ ] **Step 2: Update the form reactive object and the watch initialiser**

Find this block (around lines 224–237):

```ts
const form = reactive({
  useFinanceWidget: false,
  financeWidgetIframe: '',
  financeWidgetProvider: '',
});

// Initialize form when data loads
watch(data, (newData) => {
  if (newData?.settings) {
    form.useFinanceWidget = newData.settings.useFinanceWidget ?? false;
    form.financeWidgetIframe = newData.settings.financeWidgetIframe ?? '';
    form.financeWidgetProvider = newData.settings.financeWidgetProvider ?? '';
  }
}, { immediate: true });
```

Replace with:

```ts
type VehicleCondition = 'new' | 'used' | 'demo';
const DEFAULT_CONDITIONS: VehicleCondition[] = ['new', 'used', 'demo'];

const form = reactive<{
  useFinanceWidget: boolean;
  financeWidgetIframe: string;
  financeWidgetProvider: string;
  enabledConditions: VehicleCondition[];
}>({
  useFinanceWidget: false,
  financeWidgetIframe: '',
  financeWidgetProvider: '',
  enabledConditions: [...DEFAULT_CONDITIONS],
});

// Initialize form when data loads
watch(data, (newData) => {
  if (newData?.settings) {
    form.useFinanceWidget = newData.settings.useFinanceWidget ?? false;
    form.financeWidgetIframe = newData.settings.financeWidgetIframe ?? '';
    form.financeWidgetProvider = newData.settings.financeWidgetProvider ?? '';
    const incoming = (newData.settings as any).enabledConditions;
    form.enabledConditions = Array.isArray(incoming) && incoming.length > 0
      ? incoming.filter((c: any): c is VehicleCondition =>
          c === 'new' || c === 'used' || c === 'demo'
        )
      : [...DEFAULT_CONDITIONS];
    if (form.enabledConditions.length === 0) {
      form.enabledConditions = [...DEFAULT_CONDITIONS];
    }
  }
}, { immediate: true });

const conditionsValid = computed(() => form.enabledConditions.length > 0);

const toggleCondition = (condition: VehicleCondition, checked: boolean | 'indeterminate') => {
  const isChecked = checked === true;
  const idx = form.enabledConditions.indexOf(condition);
  if (isChecked && idx === -1) {
    form.enabledConditions.push(condition);
  } else if (!isChecked && idx !== -1) {
    form.enabledConditions.splice(idx, 1);
  }
};
```

- [ ] **Step 3: Add the checkbox group to the template**

Find the closing `</div>` of the iframe `<Textarea>` block (the `<div class="space-y-2">` that contains the Textarea, around line 97 — directly before the `<!-- Preview -->` comment). After that closing `</div>` and before `<!-- Preview -->`, insert:

```vue
<div class="space-y-2">
  <Label class="text-base">Display on</Label>
  <p class="text-xs text-muted-foreground">
    The finance widget will replace the standard enquiry form only for vehicles matching these conditions. Other vehicles will continue to show the built-in enquiry form.
  </p>
  <div class="flex flex-col gap-2 pt-1">
    <label class="flex items-center gap-2 cursor-pointer">
      <Checkbox
        :model-value="form.enabledConditions.includes('new')"
        @update:model-value="(v: boolean | 'indeterminate') => toggleCondition('new', v)"
      />
      <span class="text-sm">New</span>
    </label>
    <label class="flex items-center gap-2 cursor-pointer">
      <Checkbox
        :model-value="form.enabledConditions.includes('demo')"
        @update:model-value="(v: boolean | 'indeterminate') => toggleCondition('demo', v)"
      />
      <span class="text-sm">Demo</span>
    </label>
    <label class="flex items-center gap-2 cursor-pointer">
      <Checkbox
        :model-value="form.enabledConditions.includes('used')"
        @update:model-value="(v: boolean | 'indeterminate') => toggleCondition('used', v)"
      />
      <span class="text-sm">Used</span>
    </label>
  </div>
  <p v-if="!conditionsValid" class="text-xs text-red-600 pt-1">
    Select at least one condition, or turn off the widget entirely.
  </p>
</div>
```

If `~/components/ui/checkbox` does not exist, replace each `<Checkbox … />` with:

```vue
<input
  type="checkbox"
  :checked="form.enabledConditions.includes('new')"
  class="h-4 w-4 rounded border-gray-300"
  @change="(e) => toggleCondition('new', (e.target as HTMLInputElement).checked)"
/>
```

(adjusting the literal `'new'` per checkbox).

- [ ] **Step 4: Disable Save when invalid**

Find the Save button (around line 149):

```vue
<Button @click="saveSettings" :disabled="saving">
  <Loader2 v-if="saving" class="mr-2 h-4 w-4 animate-spin" />
  {{ saving ? 'Saving...' : 'Save Changes' }}
</Button>
```

Replace with:

```vue
<Button @click="saveSettings" :disabled="saving || (form.useFinanceWidget && !conditionsValid)">
  <Loader2 v-if="saving" class="mr-2 h-4 w-4 animate-spin" />
  {{ saving ? 'Saving...' : 'Save Changes' }}
</Button>
```

- [ ] **Step 5: Send `enabledConditions` in the PUT body**

Find the `saveSettings` body (around lines 270–277):

```ts
await $fetch('/api/admin/settings/finance-widget', {
  method: 'PUT',
  body: {
    useFinanceWidget: form.useFinanceWidget,
    financeWidgetIframe: form.financeWidgetIframe || null,
    financeWidgetProvider: form.financeWidgetProvider || null,
  },
});
```

Replace with:

```ts
await $fetch('/api/admin/settings/finance-widget', {
  method: 'PUT',
  body: {
    useFinanceWidget: form.useFinanceWidget,
    financeWidgetIframe: form.financeWidgetIframe || null,
    financeWidgetProvider: form.financeWidgetProvider || null,
    enabledConditions: form.enabledConditions,
  },
});
```

- [ ] **Step 6: Type-check**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 7: Manual UI verification**

Run: `npm run dev`
Open: `http://localhost:3000/admin/settings/finance-widget`
Verify:
- Toggle widget ON → "Display on" group appears below the iframe URL with three checkboxes.
- Default state (fresh dealer): all three checked.
- Uncheck all three → red error text appears, Save button is disabled.
- Check at least one → error clears, Save enables.
- Save → page reload → checkboxes reflect saved state.

Stop the dev server.

- [ ] **Step 8: Commit**

```bash
git add app/pages/admin/settings/finance-widget.vue
git commit -m "feat(finance-widget): admin UI for per-condition allow-list"
```

---

## Task 5: Frontend filter — `VehicleEnquiryForm.vue`

**Files:**
- Modify: `app/components/search/VehicleEnquiryForm.vue`

- [ ] **Step 1: Extend the `FinanceWidgetSettings` interface and the `useFetch` default to include `enabledConditions`**

Find this block (around lines 180–200):

```ts
interface FinanceWidgetSettings {
  success: boolean;
  settings: {
    useFinanceWidget: boolean;
    financeWidgetIframe: string | null;
    financeWidgetProvider: string | null;
  };
}

// Fetch finance widget settings to determine if we should show the widget
const { data: financeWidgetData, pending: financeWidgetPending } = useFetch<FinanceWidgetSettings>('/api/finance-widget-settings', {
  lazy: true,
  default: (): FinanceWidgetSettings => ({
    success: true,
    settings: {
      useFinanceWidget: false,
      financeWidgetIframe: null,
      financeWidgetProvider: null,
    },
  }),
});
```

Replace with:

```ts
type VehicleCondition = 'new' | 'used' | 'demo';

interface FinanceWidgetSettings {
  success: boolean;
  settings: {
    useFinanceWidget: boolean;
    financeWidgetIframe: string | null;
    financeWidgetProvider: string | null;
    enabledConditions: VehicleCondition[];
  };
}

const DEFAULT_CONDITIONS: VehicleCondition[] = ['new', 'used', 'demo'];

// Fetch finance widget settings to determine if we should show the widget
const { data: financeWidgetData, pending: financeWidgetPending } = useFetch<FinanceWidgetSettings>('/api/finance-widget-settings', {
  lazy: true,
  default: (): FinanceWidgetSettings => ({
    success: true,
    settings: {
      useFinanceWidget: false,
      financeWidgetIframe: null,
      financeWidgetProvider: null,
      enabledConditions: DEFAULT_CONDITIONS,
    },
  }),
});
```

- [ ] **Step 2: Replace the `useFinanceWidget` computed with a condition-aware version**

Find this single line (around line 203):

```ts
const useFinanceWidget = computed(() => financeWidgetData.value?.settings?.useFinanceWidget ?? false);
```

Replace with:

```ts
const useFinanceWidget = computed(() => {
  const settings = financeWidgetData.value?.settings;
  if (!settings?.useFinanceWidget) return false;

  const enabled = settings.enabledConditions ?? DEFAULT_CONDITIONS;
  const vehicleCondition = getDisplay(props.vehicle?.condition).toLowerCase();
  if (vehicleCondition !== 'new' && vehicleCondition !== 'used' && vehicleCondition !== 'demo') {
    return false;
  }
  return enabled.includes(vehicleCondition);
});
```

Note: `getDisplay` is defined later in this file (line 255). Since `computed` evaluates lazily, the function reference is resolved at first access, by which point the script setup has fully executed — this is safe.

- [ ] **Step 3: Type-check**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add app/components/search/VehicleEnquiryForm.vue
git commit -m "feat(finance-widget): filter VehicleEnquiryForm by enabledConditions"
```

---

## Task 6: Frontend filter — `SingleForm.vue`

**Files:**
- Modify: `app/components/search/SingleForm.vue`

- [ ] **Step 1: Extend the `FinanceWidgetSettings` interface and the `useFetch` default**

Find this block (around lines 149–193):

```ts
interface FinanceWidgetSettings {
  success: boolean;
  settings: {
    useFinanceWidget: boolean;
    financeWidgetIframe: string | null;
    financeWidgetProvider: string | null;
  };
}
```

Replace with:

```ts
type VehicleCondition = 'new' | 'used' | 'demo';

interface FinanceWidgetSettings {
  success: boolean;
  settings: {
    useFinanceWidget: boolean;
    financeWidgetIframe: string | null;
    financeWidgetProvider: string | null;
    enabledConditions: VehicleCondition[];
  };
}

const DEFAULT_CONDITIONS: VehicleCondition[] = ['new', 'used', 'demo'];
```

Then find the `useFetch` default block (around lines 183–193):

```ts
const { data: financeWidgetData, pending: financeWidgetPending } = useFetch<FinanceWidgetSettings>('/api/finance-widget-settings', {
  lazy: true,
  default: (): FinanceWidgetSettings => ({
    success: true,
    settings: {
      useFinanceWidget: false,
      financeWidgetIframe: null,
      financeWidgetProvider: null,
    },
  }),
});
```

Replace with:

```ts
const { data: financeWidgetData, pending: financeWidgetPending } = useFetch<FinanceWidgetSettings>('/api/finance-widget-settings', {
  lazy: true,
  default: (): FinanceWidgetSettings => ({
    success: true,
    settings: {
      useFinanceWidget: false,
      financeWidgetIframe: null,
      financeWidgetProvider: null,
      enabledConditions: DEFAULT_CONDITIONS,
    },
  }),
});
```

- [ ] **Step 2: Replace the `useFinanceWidget` computed**

Find this line (around line 196):

```ts
const useFinanceWidget = computed(() => financeWidgetData.value?.settings?.useFinanceWidget ?? false);
```

Replace with:

```ts
const useFinanceWidget = computed(() => {
  const settings = financeWidgetData.value?.settings;
  if (!settings?.useFinanceWidget) return false;

  const enabled = settings.enabledConditions ?? DEFAULT_CONDITIONS;
  // SingleForm receives the vehicle either via `props.item` or a fallback `props.condition` string
  const conditionRaw = getDisplay(props.item?.condition) || props.condition || '';
  const condition = conditionRaw.toLowerCase();
  if (condition !== 'new' && condition !== 'used' && condition !== 'demo') {
    return false;
  }
  return enabled.includes(condition);
});
```

Note: `getDisplay` is defined later in this file (line 199); same lazy-eval safety as Task 5.

- [ ] **Step 3: Type-check**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add app/components/search/SingleForm.vue
git commit -m "feat(finance-widget): filter SingleForm by enabledConditions"
```

---

## Task 7: Frontend filter — `VehicleEnquiryModal.vue`

**Files:**
- Modify: `app/components/vehicle/VehicleEnquiryModal.vue`

- [ ] **Step 1: Extend the `FinanceWidgetSettings` interface and the `useFetch` default**

Find this block (around lines 433–489):

```ts
interface FinanceWidgetSettings {
  success: boolean;
  settings: {
    useFinanceWidget: boolean;
    financeWidgetIframe: string | null;
    financeWidgetProvider: string | null;
  };
}
```

Replace with:

```ts
type VehicleCondition = 'new' | 'used' | 'demo';

interface FinanceWidgetSettings {
  success: boolean;
  settings: {
    useFinanceWidget: boolean;
    financeWidgetIframe: string | null;
    financeWidgetProvider: string | null;
    enabledConditions: VehicleCondition[];
  };
}

const DEFAULT_CONDITIONS: VehicleCondition[] = ['new', 'used', 'demo'];
```

Find the `useFetch` default (around lines 479–489):

```ts
const { data: financeWidgetData, pending: financeWidgetPending } = useFetch<FinanceWidgetSettings>('/api/finance-widget-settings', {
  lazy: true,
  default: (): FinanceWidgetSettings => ({
    success: true,
    settings: {
      useFinanceWidget: false,
      financeWidgetIframe: null,
      financeWidgetProvider: null,
    },
  }),
});
```

Replace with:

```ts
const { data: financeWidgetData, pending: financeWidgetPending } = useFetch<FinanceWidgetSettings>('/api/finance-widget-settings', {
  lazy: true,
  default: (): FinanceWidgetSettings => ({
    success: true,
    settings: {
      useFinanceWidget: false,
      financeWidgetIframe: null,
      financeWidgetProvider: null,
      enabledConditions: DEFAULT_CONDITIONS,
    },
  }),
});
```

- [ ] **Step 2: Replace the `useFinanceWidget` computed**

This file has a local `getDisplay` helper (also referenced in the existing iframe URL builder, line 522). Find this line (around line 492):

```ts
const useFinanceWidget = computed(() => financeWidgetData.value?.settings?.useFinanceWidget ?? false);
```

Replace with:

```ts
const useFinanceWidget = computed(() => {
  const settings = financeWidgetData.value?.settings;
  if (!settings?.useFinanceWidget) return false;

  const enabled = settings.enabledConditions ?? DEFAULT_CONDITIONS;
  const condition = (getDisplay(props.vehicle?.condition) || '').toLowerCase();
  if (condition !== 'new' && condition !== 'used' && condition !== 'demo') {
    return false;
  }
  return enabled.includes(condition);
});
```

- [ ] **Step 3: Type-check**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add app/components/vehicle/VehicleEnquiryModal.vue
git commit -m "feat(finance-widget): filter VehicleEnquiryModal by enabledConditions"
```

---

## Task 8: Frontend filter — `finance/[id]/[slug].vue`

**Files:**
- Modify: `app/pages/finance/[id]/[slug].vue`

- [ ] **Step 1: Extend the `FinanceWidgetSettings` interface and the `useFetch` default**

Find this block (around lines 440–460):

```ts
interface FinanceWidgetSettings {
  success: boolean;
  settings: {
    useFinanceWidget: boolean;
    financeWidgetIframe: string | null;
    financeWidgetProvider: string | null;
  };
}

// Fetch finance widget settings to determine if we should show the widget
const { data: financeWidgetData, pending: financeWidgetPending } = useFetch<FinanceWidgetSettings>('/api/finance-widget-settings', {
  lazy: true,
  default: (): FinanceWidgetSettings => ({
    success: true,
    settings: {
      useFinanceWidget: false,
      financeWidgetIframe: null,
      financeWidgetProvider: null,
    },
  }),
});
```

Replace with:

```ts
type VehicleCondition = 'new' | 'used' | 'demo';

interface FinanceWidgetSettings {
  success: boolean;
  settings: {
    useFinanceWidget: boolean;
    financeWidgetIframe: string | null;
    financeWidgetProvider: string | null;
    enabledConditions: VehicleCondition[];
  };
}

const DEFAULT_CONDITIONS: VehicleCondition[] = ['new', 'used', 'demo'];

// Fetch finance widget settings to determine if we should show the widget
const { data: financeWidgetData, pending: financeWidgetPending } = useFetch<FinanceWidgetSettings>('/api/finance-widget-settings', {
  lazy: true,
  default: (): FinanceWidgetSettings => ({
    success: true,
    settings: {
      useFinanceWidget: false,
      financeWidgetIframe: null,
      financeWidgetProvider: null,
      enabledConditions: DEFAULT_CONDITIONS,
    },
  }),
});
```

- [ ] **Step 2: Replace the `useFinanceWidget` computed**

In this file `vehicle` is a `computed` derived from `useFetch` (line 490), not a prop. The `getDisplay` helper is at line 493. Find this line (around line 463):

```ts
const useFinanceWidget = computed(() => financeWidgetData.value?.settings?.useFinanceWidget ?? false);
```

Replace with:

```ts
const useFinanceWidget = computed(() => {
  const settings = financeWidgetData.value?.settings;
  if (!settings?.useFinanceWidget) return false;

  const enabled = settings.enabledConditions ?? DEFAULT_CONDITIONS;
  const condition = (getDisplay(vehicle.value?.condition) || '').toLowerCase();
  if (condition !== 'new' && condition !== 'used' && condition !== 'demo') {
    return false;
  }
  return enabled.includes(condition);
});
```

- [ ] **Step 3: Type-check**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add app/pages/finance/[id]/[slug].vue
git commit -m "feat(finance-widget): filter finance page by enabledConditions"
```

---

## Task 9: End-to-end manual UAT

**Files:** none modified — verification only.

- [ ] **Step 1: Run the dev server**

Run: `npm run dev`
Expected: server up, no compile errors.

- [ ] **Step 2: Admin verification**

Open: `http://localhost:3000/admin/settings/finance-widget`

Set up: ensure widget toggle is ON, iframe URL is filled (e.g., `https://example.com/widget`), and provider is selected. Check all three condition checkboxes (New, Demo, Used). Save.

- [ ] **Step 3: Frontend verification — all conditions enabled**

Visit a New vehicle's enquiry page (e.g., `/cars-for-sale/` and pick a New vehicle).
Expected: finance widget iframe shows in place of the enquiry form.

Repeat for a Used vehicle and a Demo vehicle.
Expected: finance widget shows in all three cases.

Visit the finance page for one such vehicle: `/finance/[id]/[slug]`.
Expected: finance widget shows in the calculator section.

- [ ] **Step 4: Frontend verification — narrow filter**

Return to `/admin/settings/finance-widget`. Uncheck Demo and Used so only New remains. Save.

Hard-refresh a New vehicle page.
Expected: finance widget shows.

Hard-refresh a Used vehicle page.
Expected: standard enquiry form shows (not the widget).

Hard-refresh a Demo vehicle page.
Expected: standard enquiry form shows.

Hard-refresh `/finance/[id]/[slug]` for a Used vehicle.
Expected: standard calculator + enquiry form shows (not the widget).

- [ ] **Step 5: Admin validation guard**

On the admin page, uncheck all three condition checkboxes.
Expected: red error text "Select at least one condition…" and Save button is disabled.

Re-check one and Save successfully.

- [ ] **Step 6: Generic Contact-us modal sanity check**

Open the site header → trigger the generic "Contact us" modal (which uses `EnquireModal.vue`).
Expected: still shows the finance widget when the toggle is on, regardless of the condition filter (this modal has no vehicle context — intentional per spec).

- [ ] **Step 7: Stop dev server**

Stop with Ctrl-C.

- [ ] **Step 8: Final commit (only if any docs/screenshots are added during UAT)**

If no further changes were needed, skip this step. Otherwise:

```bash
git add <changed-files>
git commit -m "chore(finance-widget): UAT notes"
```

---

## Done

All eight implementation tasks complete and verified manually. The dealer admin can now restrict the finance widget to selected vehicle conditions, with the standard enquiry form shown elsewhere.
