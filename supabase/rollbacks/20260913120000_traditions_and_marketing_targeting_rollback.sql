-- ─── Rollback: Traditions Catalogue, Subcategories & Marketing Targeting ───────
ALTER TABLE IF EXISTS public.marketing_campaigns
  DROP COLUMN IF EXISTS target_tradition,
  DROP COLUMN IF EXISTS target_sampradaya;

DROP TABLE IF EXISTS public.tradition_subcategories CASCADE;
DROP TABLE IF EXISTS public.traditions_catalog CASCADE;
