-- Kul Pro: admin pays → all Kul members get Zenith-equivalent features
-- A single Kul can be upgraded by its admin; the function is_kul_member_pro()
-- is used server-side to determine whether any member inherits Kul Pro access.

ALTER TABLE kuls
  ADD COLUMN IF NOT EXISTS is_pro          boolean     DEFAULT false,
  ADD COLUMN IF NOT EXISTS pro_activated_at timestamptz,
  ADD COLUMN IF NOT EXISTS pro_expires_at  timestamptz,
  ADD COLUMN IF NOT EXISTS pro_admin_id    uuid        REFERENCES profiles(id) ON DELETE SET NULL;

-- Composite index so the function below stays fast even with large membership tables
CREATE INDEX IF NOT EXISTS idx_kul_members_user_id ON kul_members (user_id);
CREATE INDEX IF NOT EXISTS idx_kul_is_pro          ON kuls         (is_pro) WHERE is_pro = true;

-- Returns true if the user is in any Kul that is currently pro-active.
-- Called from src/lib/kul-entitlements.ts via supabase.rpc()
CREATE OR REPLACE FUNCTION is_kul_member_pro(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM   kul_members km
    JOIN   kuls         k  ON k.id = km.kul_id
    WHERE  km.user_id      = p_user_id
      AND  k.is_pro         = true
      AND  (k.pro_expires_at IS NULL OR k.pro_expires_at > now())
  );
$$;
