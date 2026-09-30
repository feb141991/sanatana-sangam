# Supabase Auth JWKS rotation and emergency revocation

`src/lib/api-auth-jwks-config.ts` pins the current production **public** ES256
key to avoid fetching `/.well-known/jwks.json` on every new serverless isolate.
Tokens carrying an unknown `kid` continue through Supabase's normal dynamic
JWKS lookup.

## Planned key rotation

1. Confirm the new key is published by the production project's
   `https://mnbwodcswxoojndytngu.supabase.co/auth/v1/.well-known/jwks.json`.
2. Keep the old key in the Supabase JWKS until its existing access tokens have
   expired, following Supabase's signing-key rotation guidance.
3. Add the new public JWK to `KNOWN_PROJECT_JWKS` and deploy. Unknown-key
   dynamic lookup remains available during the transition.
4. Once the old key is removed from Supabase JWKS and no longer needed for
   valid tokens, remove it from the pinned list and deploy again.

## Emergency revocation

If a signing key must stop being trusted immediately:

1. Revoke/remove that key in Supabase's signing-key management first.
2. Set `SUPABASE_AUTH_JWKS_MODE=remote` for the affected Vercel environment
   and deploy that configuration. The deployed verifier then omits the pinned
   JWKS and uses the project's live JWKS endpoint.
3. Verify the revoked `kid` is absent from the live JWKS after Supabase's
   published cache has expired, and verify a token signed with it is rejected.
   Monitor auth failures and restore `pinned` only after the key set and token
   transition are understood.

The setting is read at runtime by each deployed function, but Vercel environment
changes affect new deployments; changing the variable alone does not mutate
already-running deployment instances. Do not claim revocation is complete until
the new deployment is Ready and the JWKS endpoint no longer publishes the
revoked key.
