# API Auth — Pin Known JWKS for Cold Starts, Preserve a Remote Revocation Path

**Date:** 2026-09-30  
**Session context:** Investigating intermittent authenticated API 503s caused by cold serverless instances fetching Supabase signing keys  
**Category:** architecture

## What we decided

For the exact production Supabase project, API bearer-token verification may use the project's current public ES256 JWK directly, avoiding a network fetch on a cold serverless instance. Tokens with an unknown `kid` continue through Supabase's dynamic JWKS lookup. Operators can select remote-only verification with `SUPABASE_AUTH_JWKS_MODE=remote` when a signing key must be revoked; because Vercel environment changes affect new deployments, this emergency switch requires a new deployment before it changes running verification behavior.

## Why

The cold-start path was vulnerable to a slow public JWKS request consuming the API auth timeout and turning otherwise valid requests into retryable 503s. A known public key permits local signature verification without waiting on that network dependency, while retaining dynamic lookup for key IDs not in the pinned set supports normal key rotation.

Pinning does create a trust-lifecycle tradeoff: an already-pinned key remains trusted by deployed code even if it is removed from the live JWKS. The remote-only mode provides a clear operational escape hatch for emergency revocation, and a rotation runbook defines how to add and remove pins in step with token lifetimes. This does not change the separate local-verification limitation that revocation or user deletion may not be observed until a bearer token expires.

## Constraints this creates

- Pin only public verification keys and scope them to the exact intended Supabase project; never embed signing secrets.
- Unknown key IDs must retain dynamic JWKS lookup so rotation can proceed without silently accepting an unrecognized key.
- Keep the four-second auth timeout as a dependency-failure boundary; timeouts remain 503s rather than being mislabeled as invalid credentials.
- For emergency key revocation, set `SUPABASE_AUTH_JWKS_MODE=remote`, deploy the affected Vercel environment, and verify the deployment is Ready before treating the old key as distrusted.
- Follow [the JWKS rotation runbook](../../../docs/AUTH_JWKS_ROTATION.md) when adding or removing pinned keys; update tests and deployed configuration as part of the same change.

## What we explicitly rejected

- Fetching the live JWKS on every cold serverless instance as the only verification path, because Supabase network latency can consume the auth timeout and create avoidable 503s.
- Treating a runtime environment-variable edit as immediate revocation, because already-running Vercel deployments retain their deployed environment configuration.
- Accepting an unknown `kid` using the pinned key or falling back to unverified claims; unknown keys must be verified through the normal remote JWKS path.

---
