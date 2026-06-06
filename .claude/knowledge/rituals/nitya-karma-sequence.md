---
name: nitya-karma-sequence
description: Correct Hindu morning step order — Japa BEFORE Sandhya Vandana
metadata:
  type: project
---

# Nitya Karma Sequence — Japa Before Sandhya

**Corrected:** 2026-06-06 (previous entry was wrong — had Sandhya before Japa)

## Correct morning sequence

1. Brahma Muhurta — wake
2. Snana — sacred bath
3. Tilak — sacred mark + sankalpa
4. **Japa** — silent mantra practice, done first in the stillness after bath
5. **Vandana / Sandhya** — formal morning salutation: arghya to Surya, Gayatri, pranayama
6. Puja / Aarti — deity worship
7. Shloka Paath — Svadhyaya closes the cycle

## Why Japa before Sandhya
Japa is the inner silent practice done right after bath when the mind is freshest and unscattered. Sandhya Vandana is the formal outer ritual that follows after the inner work is done.

**Why:** User corrected this explicitly on 2026-06-06. Previous knowledge entry had it inverted (Sandhya → Japa), which was wrong.

**How to apply:** `FALLBACK_STEPS` array order in `src/app/(main)/nitya-karma/NityaKarmaClient.tsx` must always preserve Japa → Sandhya. Never invert this again. The comment block above `FALLBACK_STEPS` documents this.

## What we explicitly rejected
- Sandhya before Japa — wrong, do not revert
- Render order from comment blocks — render order comes from `FALLBACK_STEPS` array only
