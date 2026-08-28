-- OneSignal (the PWA browser push channel) has been removed entirely --
-- the team is focusing on native and retiring the PWA. profiles.onesignal_player_id
-- was the only DB column tied to that integration; every app-code
-- read/write site (ProfileClient.tsx, admin PII-scrub route) was removed
-- in the same change. Safe to drop outright -- it was never read by
-- anything else (confirmed via repo-wide grep before this migration).

ALTER TABLE public.profiles DROP COLUMN IF EXISTS onesignal_player_id;
