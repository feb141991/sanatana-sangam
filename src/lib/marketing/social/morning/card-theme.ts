/**
 * Design tokens for the morning cards. Sourced directly from the native app's dark & gold design system
 * (shoonaya-mobile lib/constants.ts COLORS) so cards embody the signature Shoonaya sacred aesthetic:
 * deep obsidian background, sacred brand gold accents, luminous ivory typography, and tradition-specific tints.
 */
import type { MorningTradition } from "./types";

export const CARD_SIZE = { width: 1080, height: 1350 } as const; // 4:5, the Instagram portrait size

/** shoonaya-mobile lib/constants.ts COLORS (darkBg, cardBgDark, surfaceSoftDark, creamBg, textDimDark, brandGold) */
export const PAPER = {
  page: "#0C0A07",        // COLORS.darkBg (deep obsidian sacred void)
  card: "#141210",        // COLORS.cardBgDark (dark card surface)
  cardSoft: "#1C1A16",    // COLORS.surfaceSoftDark (warm charcoal/sandalwood layer)
  borderColor: "#C5A059", // COLORS.brandGold
  borderOpacity: 0.22,
  text: "#FAF6EF",        // COLORS.creamBg (luminous warm ivory text >= 18:1 contrast)
  dim: "#B0AA9E",         // COLORS.textDimDark (muted warm sand >= 8.5:1 contrast)
  accent: "#C5A059"       // COLORS.brandGold (theme-aware brand gold)
} as const;

/** shoonaya-mobile lib/constants.ts COLORS.brandGold */
export const BRAND_GOLD = "#C5A059";

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
  /** Noto Sans Gurmukhi Medium (SIL OFL 1.1) for Sikh / Gurbani verses */
  gurmukhi: { file: "NotoSansGurmukhi-Medium.ttf", family: "Noto Sans Gurmukhi Medium" }
} as const;

export type FontKey = keyof typeof FONT_FILES;
