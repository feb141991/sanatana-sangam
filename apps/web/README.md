# apps/web migration target

The current test app still runs from the repository root with `src/app`.

This folder exists as the future landing zone for the Next.js web shell when the repo is split into:

- `apps/web`
- `packages/shared-core`

Current carve-out work has started in `src/shared-core` so product logic and mobile-ready UI primitives can move first without breaking the live test app.

When the move happens:

1. copy the current Next.js app shell into `apps/web`
2. keep `shared-core` imports stable
3. move feature adapters, contracts, and reusable mobile-first UI out of app-local folders
4. only then add the real Expo/mobile app beside it
