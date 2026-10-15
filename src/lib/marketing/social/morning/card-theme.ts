/**
 * Design tokens for the morning cards. Nothing here is invented: every value is copied from the native app so a
 * card looks like it came from the app, and each one names where it came from. Re-copy them when the app's
 * tokens change (shoonaya-mobile, commit 98eace7, 2026-10-15).
 *
 * The cards use the app's light reading paper ("Bhojpatra", the warm ivory the readers open on) because a morning
 * post should feel like a page from the app, not a generic gradient.
 */
import type { MorningTradition } from "./types";

export const CARD_SIZE = { width: 1080, height: 1350 } as const; // 4:5, the Instagram portrait size

/** shoonaya-mobile lib/constants.ts READER_PAPER.bhojpatra (the app enforces text >= 7:1, dim >= 4.5:1, accent >= 4.5:1 on page). */
export const PAPER = {
  page: "#F7F3E8",
  card: "#FDFBF5",
  cardSoft: "#F1EBDD",
  /** rgba(95,58,22,0.14) as a colour plus opacity, which is how SVG strokes take it. */
  borderColor: "#5F3A16",
  borderOpacity: 0.14,
  text: "#2A2118",
  dim: "#6B5A44",
  /** The accent the app uses for text on this paper. */
  accent: "#A8581A"
} as const;

/** shoonaya-mobile lib/constants.ts COLORS.brandGoldLight, the theme-aware brand gold for light surfaces. */
export const BRAND_GOLD = "#D88A1C";

/**
 * shoonaya-mobile lib/traditions.ts TRADITION_ACCENT. Used for ornaments only, never for small text: on this
 * paper these are below the 4.5:1 the app requires of text colours, which is why labels use PAPER.accent.
 */
export const TRADITION_ACCENT: Record<MorningTradition, string> = {
  hindu: "#D4740F",
  sikh: "#2E6FA8",
  buddhist: "#B07D3A",
  jain: "#A07830"
};

/** Names as the product uses them (src/app/api/name-story-og/route.tsx labels). */
export const TRADITION_LABEL: Record<MorningTradition, string> = {
  hindu: "Sanatan Dharma",
  sikh: "Sikhi",
  buddhist: "Buddha Dharma",
  jain: "Jain Dharma"
};

/**
 * shoonaya-mobile lib/constants.ts FONTS: Cormorant Garamond (serif), Inter (sans), Mukta (Devanagari). The
 * Gurmukhi face has no app equivalent (the app uses the device's), so it is the one font the app does not ship.
 * `family` is the name inside the font file, which is what Pango is asked for.
 */
export const FONT_FILES = {
  serif: { file: "CormorantGaramond_600SemiBold.ttf", family: "Cormorant Garamond SemiBold" },
  serifItalic: { file: "CormorantGaramond_600SemiBold_Italic.ttf", family: "Cormorant Garamond SemiBold" },
  sans: { file: "Inter_500Medium.ttf", family: "Inter Medium" },
  sansStrong: { file: "Inter_600SemiBold.ttf", family: "Inter SemiBold" },
  devanagari: { file: "Mukta_500Medium.ttf", family: "Mukta Medium" },
  devanagariBold: { file: "Mukta_700Bold.ttf", family: "Mukta" },
  /** Not shipped yet: see the README beside the fonts. Sikh cards are withheld until it is present. */
  gurmukhi: { file: "NotoSansGurmukhi-Medium.ttf", family: "Noto Sans Gurmukhi Medium" }
} as const;

export type FontKey = keyof typeof FONT_FILES;
