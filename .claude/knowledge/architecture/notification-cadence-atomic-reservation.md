# Notification cadence and atomic reservation

The `engagement-cadence-v2` policy is implemented in the candidate resolver: at most
five non-exempt pushes per user per local civil day, aliases share canonical accounting,
and flexible candidate pushes preserve their preferred time unless quiet hours or
three-hour spacing requires a later same-day slot.

The resolver's history read is useful for planning but is not a reservation. The prepared
`20261002181447_notification_cadence_atomicity.sql` migration makes candidate promotion
the reservation boundary: it takes a transaction-scoped advisory lock per user/local
date, recounts schedule and bell history under that lock, and rejects a batch that would
exceed the shared limit. The existing three-argument persistence RPC delegates to the
guard, so older callers receive the same quota check. A run lease reduces duplicate work;
the per-user/date transaction lock is the actual quota correctness mechanism.

This migration is source-only until shadow validation and explicit rollout. The local
Supabase database could not be started because Docker was unavailable, so pgTAP and
two-session contention have not been run. Apply the migration before deploying a resolver
build that calls the new lock RPC.

The guard only arbitrates candidate promotions. Legacy direct pushes and direct
`notification_schedule` writers can still bypass the cap or race after the count. Their
source inventory and rollout requirements are in
`docs/notifications/CADENCE_ROLLOUT_AUDIT.md`; do not describe the policy as app-wide
until those producers use a shared admission path and the pending queue has been audited.
