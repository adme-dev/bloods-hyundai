-- ============================================================================
-- Tenant Inventory Settings
-- Migration: 005_seed_tenant_inventory_settings.sql
-- Description: Moves tenant inventory source configuration into dealers.settings.
-- Safety: Additive JSON merge only. Existing settings.inventory values are kept.
-- ============================================================================

UPDATE dealers
SET
  settings = jsonb_set(
    COALESCE(settings, '{}'::jsonb),
    '{inventory}',
    '{
      "provider": "carsales",
      "sources": [
        {
          "provider": "carsales",
          "transport": "json-feed",
          "url": "https://tsheefvkecaervnrxvdf.supabase.co/storage/v1/object/public/bucket/blood-hyundai/data.json",
          "role": "primary",
          "sellerIds": ["49b41e33-6e72-b64d-43a2-7897e61c1bf0"],
          "enabled": true
        },
        {
          "provider": "carsales",
          "transport": "json-feed",
          "url": "https://tsheefvkecaervnrxvdf.supabase.co/storage/v1/object/public/bucket/blood-motor-group/data.json",
          "role": "group",
          "sellerIds": ["646680a2-406b-2430-bde8-761a48e4a2ed"],
          "enabled": true
        },
        {
          "provider": "carsales",
          "transport": "json-feed",
          "url": "https://tsheefvkecaervnrxvdf.supabase.co/storage/v1/object/public/bucket/geelong-mazda/data.json",
          "role": "secondary",
          "sellerIds": ["41bba4aa-6460-dbd6-30f7-7f31dfa5ef61"],
          "enabled": true
        }
      ],
      "primarySellerIds": ["49b41e33-6e72-b64d-43a2-7897e61c1bf0"],
      "groupSellerIds": ["646680a2-406b-2430-bde8-761a48e4a2ed"],
      "secondarySellerIds": ["41bba4aa-6460-dbd6-30f7-7f31dfa5ef61"]
    }'::jsonb,
    true
  ),
  updated_at = NOW()
WHERE slug = 'bloods-hyundai'
  AND settings->'inventory' IS NULL;

UPDATE dealers
SET
  settings = jsonb_set(
    COALESCE(settings, '{}'::jsonb),
    '{inventory}',
    '{
      "provider": "carsales",
      "sources": []
    }'::jsonb,
    true
  ),
  updated_at = NOW()
WHERE slug = 'sale-hyundai'
  AND settings->'inventory' IS NULL;
