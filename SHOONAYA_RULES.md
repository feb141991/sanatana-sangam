## NON-NEGOTIABLE RULES FOR THIS CODEBASE

**TypeScript**
- No `any` casts. If Supabase typing is incomplete, use `unknown` + a type guard,
  or widen the `.select()` to include the field you need.
- All union types must be exhaustive. If you add a new `type` value anywhere,
  add it to the TypeScript union in the same edit.
- Type Record keys with the actual union, not `string`:
  `Record<MoodRecommendation['type'], string>` not `Record<string, string>`.

**CSS / Styling**
- Never write a hardcoded hex (#...) or rgba(...) for a color that already has a
  CSS variable. Check globals.css first. Available variables include:
  --brand-primary, --brand-primary-soft, --card-bg, --card-border,
  --text-cream, --text-dim, --text-muted-warm, --surface-soft, --divine-bg,
  --glow-hindu, --glow-sikh, --glow-buddhist, --glow-jain.
- When theming for dark/light, use CSS variables — never derive `isDark` and
  branch on it to produce hardcoded RGBA values.

**JSX**
- All apostrophes in JSX text must be `&apos;` — no bare ' characters.
- Never split a string literal to obscure an endpoint: use the full string.

**React**
- Reset state to the same shape as the initial value. If initial state is
  `{ need: null, time: null }`, reset to `{ need: null, time: null }` — not `{}`.
- Remove dead code branches. If a type check can never be true (because the
  union doesn't include that value), delete the branch rather than casting to string.

**Supabase**
- If you need a field from `profiles`, add it to the `.select()` string — don't
  cast with `as any` to access it. The select string is the source of truth.
