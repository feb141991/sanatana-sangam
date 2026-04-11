# shared-core

This directory is the first carve-out toward a future shared core used by:

- the current Next.js web test app
- a later Expo / React Native mobile app

What belongs here:

- runtime adapter helpers
- transport abstractions
- feature contracts
- mobile-first shell primitives
- eventually feature adapters and shared hooks that do not depend on Next.js routing

What does not belong here:

- page-level Next.js route code
- browser-only storage and navigation logic unless wrapped behind an adapter
- Supabase server helpers that rely on Next.js cookies
