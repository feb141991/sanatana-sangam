# Greeting System Conventions

**Date:** 2026-06-07
**Session context:** Fixing greeting comma artifact and sampradaya-null fallback gap
**Category:** product

## What we decided

### userName fallback
`userName` falls back to `''` (empty string), never to `'Seeker'` or any placeholder noun.
Greeting renders without a comma when name is empty: `"Shubh Ratri"` not `"Shubh Ratri, "`.

### Greeting pool fallback chain
`getGreetingPool` resolves in this order:
1. `${tradition}:${sampradaya}` — e.g. `hindu:shaiva`
2. `${tradition}:other` — tradition-level pool when sampradaya is null
3. `'default'` — generic cross-tradition fallback

The old behavior skipped step 2, jumping directly from a missing sampradaya to `'default'`, producing generic greetings for users who had a tradition set but no sampradaya.

## Constraints this creates

- All greeting rendering code must guard against an empty userName before inserting a comma separator
- Any new tradition added must have a `${tradition}:other` pool defined before launch, or users without a sampradaya will fall through to generic English greetings
- The `'default'` pool is a last resort only — it should never be the expected path for a known tradition

## What we explicitly rejected

- `'Seeker'` as the userName fallback: adds a comma artifact and feels presumptuous for users who have not named themselves
- Skipping the `${tradition}:other` tier: loses the tradition signal for ~40% of users who complete tradition selection but not sampradaya selection during onboarding

## Files

- `src/lib/traditions.ts` — `getGreetingPool` fallback logic
- `src/app/(main)/home/page.tsx` — `userName` derivation
- `src/app/(main)/home/sections/HeroSection.tsx` — comma-guard rendering

---

# Tradition × Time-of-Day Greeting Matrix

**Date:** 2026-06-08
**Session context:** Replacing fixed Sanskrit time greetings with tradition-specific greetings per time slot
**Category:** product + rituals

## What we decided

The home hero greeting is upgraded from three fixed Sanskrit slots (Suprabhat / Shubh Sandhya / Shubh Ratri) to a full tradition × time-of-day matrix. Each tradition and sampradaya has its own greeting per slot (Morning / Afternoon / Evening / Night).

### Approved matrix

**Hindu — by sampradaya:**

| Sampradaya | Morning | Afternoon | Evening | Night |
|---|---|---|---|---|
| Vaishnava | Jai Shri Krishna | Hare Krishna | Radhe Radhe | Shubh Ratri |
| Shaiva | Om Namah Shivaya | Har Har Mahadev | Shubh Pradosh | Om Namah Shivaya |
| Shakta | Jai Mata Di | Jai Ambe | Jai Jagdambe | Jai Durga Maa |
| ISKCON | Hare Krishna | Hare Krishna | Radhe Shyam | Hare Krishna |
| Swaminarayan | Jai Swaminarayan | Jai Hari | Jai Swaminarayan | Jai Swaminarayan |
| Arya Samaj | Om Suprabhat | Om | Om Aryabhivadan | Om Shubh Ratri |
| Smarta | Suprabhat | Hari Om | Shubh Sandhya | Shubh Ratri |
| Veerashaiva | Om Namah Shivaya | Jai Basavanna | Shubh Sandhya | Om Namah Shivaya |
| Sai (Shirdi) | Jai Sai Ram | Om Sai Ram | Jai Sai Ram | Om Sai Ram |
| Hindu general | Suprabhat | Hari Om | Shubh Sandhya | Shubh Ratri |

**Sikh:** All slots = Waheguru Ji Ka Khalsa Waheguru Ji Ki Fateh / Sat Sri Akal (alternated or both shown)

**Buddhist — by school:**
- Theravada: Namo Buddhaya per slot
- Mahayana: tradition-appropriate slot greetings
- Vajrayana: Om Mani Padme Hum
- Zen: Gassho

**Jain — by sect:**
- Digambara / Shvetambara: Jai Jinendra / Namo Arihantanam / Micchami Dukkadam (occasion-aware)

**Other / Exploring:** Suprabhat / Hari Om / Pranam / Namaste

### Implementation contract

- New function `getTraditionTimeGreeting(tradition, sampradaya, hour)` added to `src/lib/traditions.ts`
- Old `getTimeGreeting(hour)` kept exported — not deleted — to avoid breaking any callers that have not migrated
- `HeroSection.tsx` calls the new function; `sampradaya` prop is already present so no prop-chain change needed
- The custom greeting flow (`localGreeting` / `isGreetingCompatibleWithTradition`) is untouched

### New sampradaya added to the data model

`sai` (Sai Bhakta — Shirdi) is added to `SAMPRADAYAS_BY_TRADITION.hindu`. This is a new enum value; any server-side tradition validation must accept it.

## Constraints this creates

- `getTimeGreeting(hour)` must remain exported until all call sites are audited and migrated to the new function
- Every new sampradaya added must also have a full 4-slot greeting row in the matrix before shipping
- Night slot cutoff hour (typically ≥21 or ≥22) must be consistent between old and new functions to avoid greeting drift at the boundary
- `sai` must be accepted by any tradition/sampradaya validation logic (DB constraints, onboarding selector, Supabase check constraints)

## What we explicitly rejected

- Replacing old `getTimeGreeting` immediately: too risky without auditing all callers; kept as a stable export
- Using a single "tradition greeting" with no time variation: loses the ritual cadence signal — morning and evening greetings carry different spiritual weight
- DB column for greeting state: all new greeting personalization state is localStorage only; no schema change

---

# Greeting Edit Discoverability Hint

**Date:** 2026-06-08
**Session context:** Making the tap-to-edit greeting gesture discoverable without being intrusive
**Category:** product

## What we decided

A one-time floating hint chip appears below the hero greeting: "Tap greeting to personalise ✏️". It auto-dismisses after 4 seconds or on any tap. Once dismissed it never reappears, gated by `localStorage('shoonaya_greeting_hint_seen')`.

## Why

The greeting edit gesture (tap to open custom greeting flow) is invisible — there is no affordance. Without a hint, the feature is effectively hidden. A time-limited chip is the lightest possible disclosure without a permanent UI element.

## Constraints this creates

- No DB column needed or wanted — localStorage only
- The hint must never reappear once seen, even across sessions; localStorage is the source of truth
- Hint must not render if the user already has a custom greeting set (they clearly already know the gesture)

## What we explicitly rejected

- A permanent pencil icon next to the greeting: adds visual noise to the hero; the greeting should feel clean
- A tooltip/popover on first render: feels like a tutorial, not a hint

---

# New User Welcome Card

**Date:** 2026-06-08
**Session context:** Orienting first-time users who land on a blank home dashboard
**Category:** product

## What we decided

When `showFirstTimeGuidance === true` (already computed in `page.tsx` — user has not yet completed first japa or shloka), a welcome card is shown in the hero below the Panchang pill.

**Approved copy:**
> Jai Shri Ram / Welcome to Shoonaya
> Your spiritual home is ready. Start with today's shloka, set your tradition, and build your sadhana — one day at a time.
> [Begin your journey →] [✕]

The card is dismissed via `localStorage('shoonaya_welcome_seen')`. It also auto-hides as soon as `showFirstTimeGuidance` becomes false (first practice completed), without needing an explicit dismiss.

## Why

A first-time user who has just completed onboarding sees an empty home — no streak, no japa, no shloka history. Without orientation, the next action is unclear. The card bridges the gap between "account created" and "first practice started" without adding a separate onboarding screen.

## Constraints this creates

- `showFirstTimeGuidance` is the canonical signal — the card must not appear once it is false, regardless of localStorage state
- No new DB column; localStorage is the only persistence layer
- The card must be additive and dismissible — it cannot shift layout for users who have already dismissed it
- Copy tone must match tradition-agnostic welcome (the greeting above uses tradition-specific language; this card uses neutral Sanskrit/English)

## What we explicitly rejected

- A separate `/welcome` route: adds a redirect step and breaks the home-first navigation model
- Showing the card after `showFirstTimeGuidance` is false: users who return after first practice should never see it again even if they clear localStorage, because `showFirstTimeGuidance` would already be false

## Files

- `src/app/(main)/home/page.tsx` — `showFirstTimeGuidance` computation (already exists)
- `src/app/(main)/home/sections/HeroSection.tsx` — card render location (below Panchang pill)

---
