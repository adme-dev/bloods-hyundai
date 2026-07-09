-- First-pass attribution repair for existing paid CRM enquiries.
-- The app-level backfill endpoint can later refine campaign IDs from platform rows.

WITH updated AS (
  UPDATE enquiries
  SET
    attributed_platform = CASE
      WHEN gclid IS NOT NULL
        OR gbraid IS NOT NULL
        OR wbraid IS NOT NULL
        OR (
          lower(coalesce(utm_source, '')) IN ('google', 'googleads', 'google_ads')
          AND lower(coalesce(utm_medium, '')) IN ('cpc', 'ppc', 'paid', 'paid_search')
        )
        THEN 'google_ads'
      WHEN fbclid IS NOT NULL
        OR lower(coalesce(utm_source, '')) IN ('facebook', 'fb', 'meta', 'instagram', 'ig')
        THEN 'meta_ads'
    END,
    attributed_campaign_name = nullif(utm_campaign, ''),
    attribution_confidence = CASE
      WHEN gclid IS NOT NULL OR gbraid IS NOT NULL OR wbraid IS NOT NULL THEN 95
      WHEN fbclid IS NOT NULL THEN 75
      ELSE 60
    END,
    attribution_method = CASE
      WHEN gclid IS NOT NULL OR gbraid IS NOT NULL OR wbraid IS NOT NULL OR fbclid IS NOT NULL THEN 'click_id'
      ELSE 'utm_platform'
    END,
    attribution_matched_at = now(),
    attribution_meta = jsonb_build_object(
      'backfill', true,
      'source', utm_source,
      'medium', utm_medium,
      'campaign', utm_campaign
    )
  WHERE attributed_platform IS NULL
    AND (
      gclid IS NOT NULL
      OR gbraid IS NOT NULL
      OR wbraid IS NOT NULL
      OR fbclid IS NOT NULL
      OR lower(coalesce(utm_source, '')) IN ('google', 'googleads', 'google_ads', 'facebook', 'fb', 'meta', 'instagram', 'ig')
    )
  RETURNING 1
)
SELECT count(*) AS updated_rows FROM updated;
