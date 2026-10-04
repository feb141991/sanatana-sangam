# Shoonaya email delivery runbook

This runbook describes the code and the external setup needed before production mail is considered live. Subscription, invoice, pre-debit, and dunning messages are out of scope while Shoonaya launches free.

## Active message paths

| Message | Owner | Delivery behavior |
| --- | --- | --- |
| Signup confirmation, password reset, magic link, and credential/security changes | Supabase Auth | Supabase-hosted templates and security-notification settings; local templates are versioned under `supabase/templates/`. |
| Post-onboarding welcome | Database trigger + `email_outbox` | Enqueued transactionally when `profiles.onboarding_completed` changes to true; unique key prevents duplicate welcome mail. |
| First sign-in from a new app installation | Native auth listener + authenticated backend route + `email_outbox` | Best-effort after `SIGNED_IN`; one email per account/installation. Server stores only an HMAC digest and broad OS family; no IP, city, or device model is collected. |
| KUL invitation email | Native-owned backend endpoint + `email_outbox` | In-app invite remains authoritative; queued email is idempotent and best-effort. |
| Published festival reminder | Scheduled backend route + `email_outbox` | Enqueues only reviewed/published occurrences for opted-in recipients. Consent is checked again immediately before delivery. |
| Waitlist welcome | Waitlist API + `email_outbox` | `email_sent` becomes true only after the provider accepts the message. |
| Newsletter/announcement campaigns | Existing `marketing_dispatches` queue + Resend | Claimed row ID is now passed as the Resend idempotency key; unsubscribe category follows campaign type. |
| Deletion scheduled/reminder/completion messages | Profile transition trigger + deletion cron + hard-delete path + `email_outbox` | The request confirmation is enqueued transactionally; reminders are queued by the daily job; a final receipt is queued only after auth and profile deletion succeed. Delivery is duplicate-safe and pending requests are rechecked. |

## Queue and consent guarantees

- The email worker claims rows atomically with `FOR UPDATE SKIP LOCKED`; overlapping cron invocations cannot claim the same active row.
- Provider sends include a stable idempotency key. Rows stop retrying before Resend's 24-hour key-retention window expires.
- Marketing consent and category preferences are re-read immediately before delivery. A newly revoked preference suppresses pending mail.
- Resend webhook signatures are checked over the raw request body. Permanent bounces and complaints are stored as keyed address digests; transient bounces are recorded but do not suppress the address.
- Unsubscribe GET requests render a confirmation page only. The explicit POST and RFC 8058 one-click POST perform the opt-out.
- Terminal outbox rows have recipient address, user ID, and payload scrubbed. Provider event and suppression ledgers contain no raw recipient email.
- The admin signup report does not call unconfirmed registrations “bounces.” It cannot verify inbox placement, DNS authentication, or Supabase Auth SMTP configuration.

## Required environment and provider setup

Configure these in the deployment environment before enabling the worker:

- `RESEND_API_KEY`
- `SHOONAYA_EMAIL_FROM` with a sender on a verified Resend domain
- `EMAIL_SUPPRESSION_HMAC_KEY` — generate with `openssl rand -hex 32`; keep stable
- `DEVICE_REGISTRY_HMAC_KEY` — generate independently with `openssl rand -hex 32`; keep stable
- `RESEND_WEBHOOK_SECRET` from the Resend webhook configuration
- Existing `CRON_SECRET`, `NEXT_PUBLIC_SUPABASE_URL`, and `SUPABASE_SERVICE_ROLE_KEY`

In Resend, configure a webhook for `https://www.shoonaya.com/api/webhooks/resend` with `email.bounced` and `email.complained` events. Verify the webhook with the provider's test delivery before relying on automated suppression.

In Resend, verify the sending domain and its SPF/DKIM records, then publish an appropriate DMARC policy. The admin app cannot infer these DNS records from the API key. Disable link rewriting/tracking for Supabase Auth mail so confirmation links are not altered.

Supabase-hosted Auth ignores the repo's local `supabase/config.toml` templates. Copy the templates and subjects from `supabase/templates/` into the Supabase Dashboard's Auth → Email Templates, configure the custom SMTP sender, and enable the security notifications that are supported for the project. The local config is for local Supabase only. Test confirmation, recovery, email change, password change, and one security notification with a non-production account before calling this complete.

## Safe rollout order

1. Apply `20261004113946_email_outbox_delivery.sql` to a disposable/staging database and run `supabase/tests/email_outbox_delivery.test.sql` there. Review the transaction trigger and grants; do not apply the migration by merely deploying code.
2. Deploy the backend with the migration in place and all required secrets set. Verify the worker endpoint is protected by `CRON_SECRET` and the Resend webhook rejects invalid signatures.
3. Confirm the scheduled `/api/cron/email-outbox` run every five minutes is active. The worker returns counts, not message content or recipient addresses.
4. Add the Resend webhook and Supabase Auth templates/settings described above.
5. On a test account, verify welcome, one new-install sign-in, KUL invite, festival opt-out, unsubscribe GET safety, unsubscribe POST, permanent-bounce suppression, retry behavior, and no duplicate on repeated cron/webhook delivery.
6. Inspect `email_outbox` for terminal `dead` rows and safe error codes. Provider acceptance means accepted by Resend, not confirmed in the recipient inbox.

The migration, production secrets, dashboard templates, DNS, webhook registration, and production deployment are external rollout steps; none are asserted to be completed by this source change alone.
