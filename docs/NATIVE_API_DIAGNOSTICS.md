# Native API diagnostics

The backend repository owns the canonical ingestion, persistence, retention,
and admin-read contract for Native API diagnostics. The Native repository is
the producer and keeps the same event shape in
shoonaya-mobile/lib/apiDiagnosticPolicy.ts.

## What is recorded

The shared Native apiFetch transport and the configured Supabase transport
record only failed HTTP responses, failures that recovered after a retry, and
successful requests taking at least three seconds. Intentional request
cancellations are ignored. Each record contains a normalized endpoint path,
method, outcome, first/final HTTP status, attempt count, elapsed time, app
version/platform, and server request IDs when the response provides them.

Endpoint normalization removes query strings, replaces resource identifiers,
omits Supabase storage object paths, and rejects requests to other origins.
Bodies, response bodies, headers, access tokens, user IDs, exception messages,
and user content are never retained. The client queue is anonymous, capped at
100 events, expires records locally after 30 days, and uploads batches of up
to 25 events on launch/background. Failed uploads remain queued. The endpoint
is rate-limited and idempotent by client event ID.

## Storage and review

public.native_api_diagnostic_events is write-only to service_role; RLS is
enabled and forced, and a daily pg_cron job deletes rows older than 30 days.
The public client cannot read or write the table directly. The admin native
telemetry monitor shows the last 100 events and exact 1h/24h counts. For a
response that reached the backend, use its recorded request ID to locate the
corresponding structured server log. A transport failure without a response
has no server request ID and must be diagnosed from the client outcome and
neighboring events.

## Rollout order

1. Review and apply the file-backed migration in a controlled database
   environment, including RLS/privilege checks.
2. Deploy the backend ingestion route and admin reader.
3. Ship the Native build/update containing the transport recorder and outbox.
4. Confirm test failures, a retry-recovered case, and a slow request appear
   in the admin monitor; verify that query values and user data are absent.

The existing startup summary remains aggregate and is not a substitute for
these event records. The existing auth diagnostic table remains the more
specific source for session readiness, token presence, and refresh behavior.

## Coverage boundary

This layer diagnoses HTTP and Supabase transport failures, retries, and slow
responses. It does not capture native process crashes, React render exceptions,
or a feature showing the wrong state after a successful response. Those need a
separate, privacy-reviewed crash/error boundary and allowlisted feature-state
events; raw exception text, stack traces, and user-entered content should not
be added to this table. Existing route/cache telemetry covers some UI loading
behavior, but a calendar card that receives a successful response and still
renders incorrectly requires a specific state-transition event to diagnose.
