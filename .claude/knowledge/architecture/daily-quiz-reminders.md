# Daily Quiz reminder delivery

Daily Quiz reminders are an explicit, default-off Native preference. The first reminder is sent at the member's chosen local time (08:00 by default; 07:00–15:00 allowed) when the quiz is available. A second candidate is scheduled for 18:00 local time and expires at 20:45, before the 21:00 end-of-day boundary.

Both stages use the shared notification candidate, resolver, and dispatcher pipeline. Candidate identity includes the local quiz date and stage, with a stable audience key across language changes, so ten-minute producer retries are idempotent and a same-day language change cannot duplicate a push. Quiz completion is checked when producing and again immediately before delivery; if the completion store cannot be read, dispatch retries without sending. Quiet hours and the shared notification cadence remain authoritative, so a reminder can be delayed or suppressed when no safe slot remains.

Native Settings owns the user's opt-in and preferred first-reminder time. The preference is written through the authenticated profile API and cached per identity. OS push permission is required for lock-screen delivery. The candidate producer is gated by both the global resolver flag and the quiz candidate-mode flag.

The producer's Supabase cron migration is a separate rollout step: deploy the matching backend first, ensure the Vault `notification_dispatch_secret` exists, then apply the migration and enable the required production flags. Do not describe the feature as live until the schedule, flags, Native setting, and an end-to-end opted-in canary have all been verified.
