# Nav and Footer Branding — Logo Image, Not Text

**Date:** 2026-06-06
**Session context:** Replacing "Shoonaya." text in nav and footer with the logo image
**Category:** decision

## What we decided

`river-light-horizontal.png` is the canonical logo for nav and footer placements. Text
renderings of "Shoonaya" (with or without a trailing dot) are replaced by this image.

`/icons/logo.png` is retained exclusively for favicon and PWA icon contexts.

No trailing dot appears in any logo treatment.

## Why

The horizontal river-light logo is the designed brand mark. Text fallbacks were placeholders
during early development. Using the image asset ensures consistent brand expression and avoids
font-rendering variation across devices.

Two logo files exist for a reason: the horizontal lockup works in nav/footer (wide, low-height
space); the square icon works in favicon/PWA (small, square context).

## Constraints this creates

- Do not use text "Shoonaya" or "Shoonaya." in nav or footer — always use the image
- The horizontal logo asset path is `river-light-horizontal.png` — do not rename it without
  updating all nav and footer references
- Dark mode: confirm `river-light-horizontal.png` has sufficient contrast on dark backgrounds,
  or provide a `river-dark-horizontal.png` variant if needed

---
