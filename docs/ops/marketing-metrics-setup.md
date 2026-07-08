# Marketing metrics — operator setup & runbook

**Audience:** site operator (no coding required — just copy/paste). If you get stuck on
a step, ping the dev team with the exact error text.

**What this covers:** wiring up the three ad/analytics platforms (GA4, Meta Ads, Google
Ads) so the dashboard's Marketing tab shows real spend, traffic, and cost-per-lead
numbers. Data syncs automatically once a day; you can also trigger a sync on demand.

**Where credentials live:** all secrets go into Netlify's **Environment variables** for
this site. Never put a secret in a git commit, a Slack message, or the settings SQL in
step 5 — those are IDs, not secrets.

**Netlify environment variables — how to get there every time:**
1. Go to [app.netlify.com](https://app.netlify.com) and open this site.
2. Left sidebar → **Project configuration** → **Environment variables**.
3. Click **Add a variable → Add a single variable**, enter the **Key** and **Value**
   exactly as named below, then **Create variable**.
4. After adding/changing any variable, trigger a new deploy (**Deploys** tab →
   **Trigger deploy** → **Deploy site**) so functions pick up the new value.

---

## 1. GA4 (Google Analytics 4)

Sets: `GA4_SERVICE_ACCOUNT_KEY`

1. **Create a Google Cloud service account.**
   - Go to [console.cloud.google.com](https://console.cloud.google.com) and select (or
     create) the Google Cloud project you want to own this integration.
   - Left menu → **IAM & Admin** → **Service Accounts** → **+ Create Service Account**.
   - Name it something recognizable, e.g. `metrics-sync-ga4`. Click **Create and
     Continue** → skip the optional role/access steps → **Done**.
2. **Enable the Analytics Data API for that project.**
   - Left menu → **APIs & Services** → **Library**.
   - Search for **Google Analytics Data API** → open it → **Enable**.
3. **Create a JSON key for the service account.**
   - Back in **IAM & Admin** → **Service Accounts**, click the account you just made.
   - **Keys** tab → **Add Key** → **Create new key** → type **JSON** → **Create**.
   - A file downloads automatically — this is your `key.json`. Keep it private; treat
     it like a password.
4. **Grant the service account Viewer access on the GA4 property.**
   - Go to [analytics.google.com](https://analytics.google.com), open the dealer's
     GA4 property.
   - **Admin** (gear icon, bottom left) → under **Property**, click **Property Access
     Management**.
   - **+** (top right) → **Add users**.
   - Paste the service account's email address (looks like
     `metrics-sync-ga4@your-project.iam.gserviceaccount.com` — find it on the Service
     Accounts list or inside `key.json` under `"client_email"`).
   - Role: **Viewer**. Click **Add**.
5. **Base64-encode the key and set the Netlify env var.**
   - Open a terminal where the downloaded `key.json` file is (e.g. your Downloads
     folder), then run:
     ```bash
     base64 -i key.json | tr -d '\n' | pbcopy
     ```
     (On Linux, drop `pbcopy` and instead run `base64 -i key.json -w 0` and copy the
     printed output manually.)
   - This copies the base64 string to your clipboard.
   - In Netlify → **Environment variables**, add:
     - Key: `GA4_SERVICE_ACCOUNT_KEY`
     - Value: paste the clipboard contents (one long line, no line breaks).
   - Delete `key.json` from your Downloads folder once it's saved in Netlify — don't
     leave copies lying around.

---

## 2. Meta Ads (Facebook/Instagram)

Sets: `META_SYSTEM_USER_TOKEN`

1. Go to [business.facebook.com/settings](https://business.facebook.com/settings)
   (Meta Business Manager) for the account that owns the ad account.
2. Left menu → **Users** → **System Users** → **+ Add**.
   - Name it e.g. `metrics-sync`, role **Admin** (needed so it can be assigned to the
     ad account with `ads_read` in the next step), **Create System User**.
3. Assign the system user to the ad account:
   - Left menu → **Accounts** → **Ad Accounts** → select the dealer's ad account.
   - **Assign Partner / Add People** → select the `metrics-sync` system user → grant it
     access to the ad account.
4. Generate the access token:
   - Back in **Users** → **System Users**, select `metrics-sync` → **Generate New
     Token**.
   - App: pick (or create) the Business app used for API access.
   - Scopes: check **`ads_read`** (only). Leave everything else unchecked.
   - Click **Generate Token** → copy it immediately (Meta shows it once).
5. In Netlify → **Environment variables**, add:
   - Key: `META_SYSTEM_USER_TOKEN`
   - Value: the token you just copied.

System user tokens don't expire on a fixed schedule like personal user tokens, but they
can be revoked if the system user's app or permissions change — if syncs start failing
with an auth error, regenerate the token and repeat step 5.

---

## 3. Google Ads

Sets: `GOOGLE_ADS_DEVELOPER_TOKEN`, `GOOGLE_ADS_CLIENT_ID`, `GOOGLE_ADS_CLIENT_SECRET`,
`GOOGLE_ADS_REFRESH_TOKEN`

1. **Developer token.**
   - Sign in to [ads.google.com](https://ads.google.com) with an account that has
     access to the Google Ads manager (MCC) account.
   - Tools & Settings (wrench icon) → **Setup** → **API Center**.
   - If no token exists yet, apply for one (basic access is enough for read-only
     reporting). Copy the token once approved/issued.
   - Set in Netlify: Key `GOOGLE_ADS_DEVELOPER_TOKEN`, Value = the token.
2. **OAuth client (Client ID / Secret).**
   - Go to [console.cloud.google.com](https://console.cloud.google.com) → same or
     another project → **APIs & Services** → **Credentials**.
   - **+ Create Credentials** → **OAuth client ID**.
   - Application type: **Web application**. Name it e.g. `metrics-sync-google-ads`.
   - Under **Authorized redirect URIs**, add:
     `https://developers.google.com/oauthplayground`
   - **Create**. Copy the **Client ID** and **Client Secret** shown.
   - Set in Netlify: `GOOGLE_ADS_CLIENT_ID` and `GOOGLE_ADS_CLIENT_SECRET`.
3. **Mint a refresh token (one-time, using OAuth Playground).**
   - Go to [developers.google.com/oauthplayground](https://developers.google.com/oauthplayground/).
   - Click the gear icon (top right) → check **Use your own OAuth credentials** →
     paste in the Client ID and Client Secret from step 2 → close the settings panel.
   - In the left panel **Step 1**, under **Input your own scopes**, paste:
     `https://www.googleapis.com/auth/adwords`
   - Click **Authorize APIs** → sign in with the Google Ads account from step 1 →
     allow access.
   - **Step 2**: click **Exchange authorization code for tokens**.
   - Copy the value shown for **Refresh token**.
   - Set in Netlify: Key `GOOGLE_ADS_REFRESH_TOKEN`, Value = that refresh token.
   - This is a one-time mint — the refresh token doesn't expire from use, only if
     revoked. If Google Ads syncs start failing with an auth error, repeat this step
     to mint a fresh one.

---

## 4. Cron secret

Sets: `METRICS_CRON_SECRET` — this is the shared secret the daily scheduled job uses
to call the sync endpoint. Anyone with this value could trigger a sync, so treat it
like a password.

1. In a terminal, run:
   ```bash
   openssl rand -hex 24
   ```
2. Copy the printed value.
3. In Netlify → **Environment variables**, add:
   - Key: `METRICS_CRON_SECRET`
   - Value: the value you just generated.

You don't need to save this anywhere else — Netlify's function reads it from the
environment at run time, and the sync endpoint compares against the same variable.

---

## 5. Per-dealer settings (which GA4 property / ad accounts to pull)

Each dealer's platform IDs live in the `dealers.settings` JSON column, under
`marketing.integrations`. Run this against the production database (see step 6 for how
to connect), filling in the real IDs and the dealer's UUID:

> ⚠️ **This SQL replaces the entire `integrations` object — it does not merge.**
> If this dealer already has any platform IDs configured, you must include ALL of them
> (existing + new) in the JSON below, every time you run it. To see what is currently
> set, run:
>
> ```sql
> SELECT settings->'marketing'->'integrations' FROM dealers WHERE id = '<dealer-uuid>';
> ```

```sql
UPDATE dealers SET settings = jsonb_set(settings, '{marketing,integrations}', '{
  "ga4PropertyId": "properties/XXXXXXXXX",
  "metaAdAccountId": "act_XXXXXXXXXX",
  "googleAdsCustomerId": "XXX-XXX-XXXX"
}'::jsonb, true) WHERE id = '<dealer-uuid>';
```

Where to find each value:
- `ga4PropertyId` — GA4 Admin → Property Settings → **Property ID**, prefixed with
  `properties/` (e.g. property ID `123456789` → `"properties/123456789"`).
- `metaAdAccountId` — Meta Ads Manager, the account ID in the top bar, prefixed with
  `act_` (e.g. `act_1234567890`).
- `googleAdsCustomerId` — Google Ads UI, top right, the 10-digit ID shown as
  `XXX-XXX-XXXX`. Keep the dashes — the app strips them when calling the API.
- `<dealer-uuid>` — the dealer's `id` in the `dealers` table
  (`SELECT id, name FROM dealers;` if you need to look it up).

**Optional — Google Ads manager (MCC) accounts only:** if the Google Ads account is
managed under an MCC and API calls need a `login-customer-id`, add a fourth key the
same way:

```sql
UPDATE dealers SET settings = jsonb_set(settings, '{marketing,integrations}', '{
  "ga4PropertyId": "properties/XXXXXXXXX",
  "metaAdAccountId": "act_XXXXXXXXXX",
  "googleAdsCustomerId": "XXX-XXX-XXXX",
  "googleAdsLoginCustomerId": "XXX-XXX-XXXX"
}'::jsonb, true) WHERE id = '<dealer-uuid>';
```

A platform only shows as "connected" in the dashboard once **both** its Netlify
secret(s) (steps 1–3) **and** its ID here are set — missing either one, the platform
card just shows "Not connected" (harmless, no errors).

---

## 6. Apply the database migration (first-time setup only)

The metrics tables (`marketing_metrics_daily`, `marketing_sync_runs`) need to exist
before any sync can write data. This is a one-time step per environment.

- Migration file: `scripts/migrations/2026-07-09-marketing-metrics.sql`
- Target: Neon production project **`cold-sound-73227570`**

Apply it using the Neon MCP tooling (`mcp__Neon__run_sql` against project
`cold-sound-73227570`) or, if you have `psql` access to the prod connection string,
run the file directly:

```bash
psql "$NEON_PROD_CONNECTION_STRING" -f scripts/migrations/2026-07-09-marketing-metrics.sql
```

The migration uses `CREATE TABLE IF NOT EXISTS` / `CREATE INDEX IF NOT EXISTS`, so it's
safe to re-run if you're ever unsure whether it already applied.

---

## 7. Run the first sync and verify it worked

Once steps 1–6 are done for a dealer, trigger a sync rather than waiting for the
overnight schedule:

- **From the dashboard (preferred):** open the dealer's admin dashboard → **Marketing**
  tab → click **Refresh** in the header row. It shows a spinner and updates the cards
  when done.
- **From a terminal (equivalent, useful if the dashboard button isn't handy):**
  ```bash
  curl -X POST -H "x-cron-secret: $METRICS_CRON_SECRET" \
    https://bloodhyundai.com.au/api/internal/metrics-sync
  ```
  (Use the actual secret value from step 4 in place of `$METRICS_CRON_SECRET`, or
  export it in your shell first.)

**Verify it worked** by checking the two tables it writes to:

```sql
-- Should show rows for today (or the last few days) per platform/dealer:
SELECT dealer_id, platform, date, campaign_id, spend, clicks, synced_at
FROM marketing_metrics_daily
ORDER BY synced_at DESC
LIMIT 20;

-- Should show one 'success' row per connected platform for the dealer,
-- most recent first:
SELECT dealer_id, platform, status, started_at, finished_at, rows_upserted, error
FROM marketing_sync_runs
ORDER BY started_at DESC
LIMIT 10;
```

- `marketing_sync_runs.status = 'success'` with a non-null `rows_upserted` — good.
- `status = 'error'` — read the `error` column; it will say which platform and
  usually why (e.g. "401" means a credential from steps 1–3 is wrong or expired).
- No row at all for a platform — its dealer ID (step 5) or its Netlify secret (steps
  1–3) is still missing; the sync silently skips unconfigured platforms.

---

## Ongoing: the daily automatic sync

Once set up, no daily action is needed. A Netlify scheduled function
(`netlify/functions/metrics-sync-cron.mts`) runs every day at **18:30 UTC (04:30
AEST)** — after US/EU ad platforms have settled the previous day's figures — and calls
the same internal sync endpoint as the manual Refresh button. Check Netlify's
**Logs → Functions → metrics-sync-cron** if you want to confirm it ran; a healthy run
logs a single line like `[metrics-sync-cron] status 200`.

If you ever need to change the schedule, it's defined once, in code, at the bottom of
`netlify/functions/metrics-sync-cron.mts` (`export const config = { schedule: ... }`) —
not in `netlify.toml`. Ask a developer to change it; it needs a deploy either way.
