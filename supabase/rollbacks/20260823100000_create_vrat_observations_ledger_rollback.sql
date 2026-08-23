-- Rollback: Drop vrat_observations ledger and record_vrat_observation RPC
DROP FUNCTION IF EXISTS public.record_vrat_observation(UUID, UUID, TEXT, TEXT, TEXT, TEXT, TEXT);
DROP TABLE IF EXISTS public.vrat_observations CASCADE;
