# Incident Response Workflow: Client Errors & Crash Fingerprints

This runbook guides on-call engineers and administrators when responding to client-side crash alerts, WebKit runtime errors, or PWA exceptions captured by Shoonaya's client error observability system.

---

## 1. Where to Look First

When an alert fires or a user reports an issue:
1. Open the Admin Command Center: **`https://www.shoonaya.com/admin/monitoring`**
2. Scroll to the **Client Error Stream & Crash Fingerprints** section.
3. Review the summary metrics:
   - **Last 1 Hour / 24 Hours**: Volume of events and whether `/home` is spiking.
   - **Stale Deployments**: Indicator if `client_release_sha !== server_release_sha` (users running an outdated cached bundle).
   - **Impacted Sessions**: Distinct anonymous session hashes affected.

---

## 2. Pulling the Full Incident Record

Each crash event emits an `incident_id` in the format `ce_<uuid>`.

### Option A: Via Admin Monitoring UI
Click the expand icon (**⌄**) next to the fingerprint group to inspect:
- Raw sanitized stack trace and top frame.
- React `component_stack`.
- Browser family and OS version.
- Recent Incident IDs.

### Option B: Query Supabase Directly (Service Role)
To inspect the raw database row:

```sql
-- Query by specific Incident ID
SELECT * 
FROM client_error_events 
WHERE incident_id = 'ce_533fe504-17f9-48d5-aea0-e7206da7309b';

-- Query latest errors for a route
SELECT incident_id, fingerprint, error_name, error_message, route, browser_family, os_family, client_release_sha, created_at
FROM client_error_events 
WHERE route = '/home' 
ORDER BY created_at DESC 
LIMIT 20;

-- Query count of a specific fingerprint since a deployment
SELECT count(*), count(DISTINCT anonymous_session_hash) as affected_sessions
FROM client_error_events 
WHERE fingerprint = '<fingerprint_hash>' 
  AND created_at > '<deployment_timestamp>';
```

---

## 3. Classifying the Failure Bucket

Before writing code or guessing, classify the failure using the resolved stack trace into one of the canonical buckets:

| Failure Bucket | Description & Typical Signature | Action Required |
|---|---|---|
| **Render Exception** | A React component threw an uncaught error during render. | Check `component_stack` for the failing component. |
| **Invalid Home DTO** | Null/missing field from backend response caused `TypeError`. | Validate API response schema before UI consumption. |
| **Browser API Exception** | Call to `localStorage`, `Notification`, or `window` failed under restricted/private browsing mode. | Wrap with `safe-browser-storage.ts` or runtime feature detection. |
| **Chunk / Deploy Mismatch** | `ChunkLoadError` or `client_sha !== server_sha`. | Client has a cached HTML pointing to an old chunk hash; verify cache headers and service worker skipWaiting. |
| **Third-Party Script Failure** | External script (OneSignal, Google Auth) threw an exception. | Isolate third-party script loaders with graceful degradation. |

---

## 4. Evidence-Driven Reproduction & Fix Flow

Never guess at the console or introduce broad speculative hardening. Follow this exact sequence:

1. **Verify Release Identity**:
   Run `node scripts/verify-production-release.mjs` to ensure the live environment matches the git commit.
2. **Write a Failing Regression Test**:
   Create a test reproducing the exact input/state that triggered the stack trace (e.g. inside `src/components/home/__tests__/`). Confirm it fails.
3. **Apply the Minimal Surgical Fix**:
   Apply the smallest defensible change addressing only the identified root cause.
4. **Run Verification Gates**:
   ```bash
   npx tsc --noEmit
   npm run build
   git diff --check
   git push origin main && git push shoonaya-repo main
   ```
5. **Observe for 24 Hours**:
   Execute the 24-hour verification query to ensure 0 recurring events.

---

## 5. Automated Data Retention & Maintenance

- **Retention Window**: 30 Days.
- **Postgres pg_cron Schedule**:
  `purge-client-error-events-daily` runs at **03:17 UTC daily** (`delete from public.client_error_events where created_at < now() - interval '30 days'`).
- **Manual Purge Action**: Available via `POST /api/admin/client-errors` with `{ "retentionDays": 30 }`.
