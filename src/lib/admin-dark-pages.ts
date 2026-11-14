import colors from "tailwindcss/colors";

/**
 * The dark-glass look for the older admin pages, as one table of rules.
 *
 * Those pages were written for a light surface with hard-coded Tailwind colours (`bg-white`,
 * `text-gray-500`, `border-black/5`, `bg-amber-50 text-amber-900`...). Instead of editing about
 * 5,000 class names across 58 files, this module says what each colour class should look like
 * on the dark glass scene, per property (a fill and a text colour of the same shade need different
 * dark values). `scripts/generate-admin-dark-pages.ts` turns it into `src/app/admin/admin-pages.generated.css`,
 * scoped to `.admin-pages`; `admin-dark-pages.test.ts` fails when that file is stale or a
 * co-occurring background and text colour would be unreadable.
 *
 * Changing the look = change a number here and run the generator.
 */

export type Rgb = [number, number, number];

/** Warm off-white used for text on the dark scene (same as --text-primary in the admin glass tokens). */
export const INK: Rgb = [248, 244, 238];
/** A mid-dark point of the dusk scene: the worst case the page background can be under a card. */
export const SCENE: Rgb = [58, 59, 65];
/** What a glass card is tinted with. */
const CARD_TINT: Rgb = [24, 21, 26];

const NEUTRALS = ["gray", "slate", "stone", "zinc", "neutral"] as const;
const COLOURED = [
  "amber", "rose", "emerald", "red", "green", "blue", "purple", "orange", "yellow",
  "indigo", "sky", "teal", "violet", "pink", "cyan", "lime", "fuchsia",
] as const;
type Neutral = (typeof NEUTRALS)[number];
type Coloured = (typeof COLOURED)[number];

const isNeutral = (family: string): family is Neutral => (NEUTRALS as readonly string[]).includes(family);
const isColoured = (family: string): family is Coloured => (COLOURED as readonly string[]).includes(family);

export function hexToRgb(hex: string): Rgb {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

const palette = colors as unknown as Record<string, Record<string, string> | string>;

/** The light-mode colour of a palette entry, or null when the family or shade does not exist. */
export function paletteRgb(family: string, shade: number | null): Rgb | null {
  if (family === "white") return [255, 255, 255];
  if (family === "black") return [0, 0, 0];
  const entry = palette[family];
  if (!entry || typeof entry === "string" || shade === null) return null;
  const hex = entry[String(shade)];
  return hex ? hexToRgb(hex) : null;
}

const round = (n: number) => Math.round(n * 1000) / 1000;
const rgba = (c: Rgb, a: number) => `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${round(a)})`;
const hex = (c: Rgb) => `#${c.map((v) => v.toString(16).padStart(2, "0")).join("")}`;

// ─── Text ────────────────────────────────────────────────────────────────────

/** Dark-mode text colour for neutral families, by shade. Light shades (50-200) already read on dark. */
const NEUTRAL_TEXT: Record<number, string> = {
  300: "#9a9288",
  400: "#aaa298",
  500: "#bdb5aa",
  600: "#d3ccc2",
  700: "#e4ded5",
  800: "#efeae2",
  900: "#f8f4ee",
  950: "#f8f4ee",
};

/** Coloured text: the 500-950 shades are for light backgrounds; on dark use the light end of the same family. */
const COLOURED_TEXT_SHADE: Record<number, number> = { 500: 300, 600: 300, 700: 300, 800: 200, 900: 200, 950: 100 };

/** The dark-mode text colour for `text-{family}-{shade}`, or null to leave it as it is. */
export function darkTextColour(family: string, shade: number | null): Rgb | null {
  if (family === "black") return INK;
  if (family === "white") return null;
  if (shade === null) return null;
  if (isNeutral(family)) {
    const value = NEUTRAL_TEXT[shade];
    return value ? hexToRgb(value) : null;
  }
  if (isColoured(family)) {
    const mapped = COLOURED_TEXT_SHADE[shade];
    return mapped ? paletteRgb(family, mapped) : null;
  }
  return null;
}

// ─── Fills ───────────────────────────────────────────────────────────────────

const NEUTRAL_FILL_ALPHA: Record<number, number> = { 50: 0.045, 100: 0.07, 200: 0.1, 300: 0.15, 400: 0.22 };
const COLOURED_FILL_ALPHA: Record<number, number> = { 50: 0.1, 100: 0.15, 200: 0.22, 300: 0.3 };

export interface FillLayer {
  rgb: Rgb;
  alpha: number;
}

export interface FillDecls {
  backgroundColor: string;
  backgroundImage?: string;
  /** What the fill is made of, bottom first: used for gradient stops and for contrast maths. */
  layers: FillLayer[];
}

/** A glass card: a dark tint with a faint light top edge, scaled by the class's own opacity. */
function glassFill(fraction: number): FillDecls {
  return {
    backgroundColor: rgba(CARD_TINT, 0.34 * fraction),
    backgroundImage: `linear-gradient(180deg, rgba(255, 255, 255, ${round(0.075 * fraction)}), rgba(255, 255, 255, ${round(0.02 * fraction)}))`,
    layers: [
      { rgb: CARD_TINT, alpha: 0.34 * fraction },
      { rgb: [255, 255, 255], alpha: 0.0475 * fraction },
    ],
  };
}

function plainFill(rgb: Rgb, alpha: number): FillDecls {
  return { backgroundColor: rgba(rgb, alpha), layers: [{ rgb, alpha }] };
}

/** The dark-mode fill for `bg-{family}-{shade}/{alpha}`, or null to leave it as it is (dark and strong fills). */
export function darkFill(family: string, shade: number | null, alpha: number | null): FillDecls | null {
  const fraction = alpha === null ? 1 : alpha;
  if (family === "white") return glassFill(fraction);
  if (family === "black") {
    // Faint black tints (hover states, striping) become faint light tints; scrims and solid black stay.
    return alpha !== null && alpha <= 0.3 ? plainFill([255, 255, 255], alpha * 0.9) : null;
  }
  if (shade === null) return null;
  if (isNeutral(family)) {
    const base = NEUTRAL_FILL_ALPHA[shade];
    return base ? plainFill([255, 255, 255], base * fraction) : null;
  }
  if (isColoured(family)) {
    const base = COLOURED_FILL_ALPHA[shade];
    const tint = paletteRgb(family, 500);
    return base && tint ? plainFill(tint, base * fraction) : null;
  }
  return null;
}

// ─── Lines ───────────────────────────────────────────────────────────────────

const NEUTRAL_LINE_ALPHA: Record<number, number> = { 50: 0.06, 100: 0.08, 200: 0.12, 300: 0.18, 400: 0.26 };
const COLOURED_LINE_ALPHA: Record<number, number> = { 50: 0.12, 100: 0.18, 200: 0.28, 300: 0.4 };

/** The dark-mode colour of a border, divider or ring, as an rgba string, or null to leave it. */
export function darkLineColour(family: string, shade: number | null, alpha: number | null): string | null {
  const fraction = alpha === null ? 1 : alpha;
  if (family === "white") return null;
  if (family === "black") return alpha === null ? rgba([255, 255, 255], 0.35) : rgba([255, 255, 255], Math.min(0.34, alpha * 1.6));
  if (shade === null) return null;
  if (isNeutral(family)) {
    const base = NEUTRAL_LINE_ALPHA[shade];
    return base ? rgba([255, 255, 255], base * fraction) : null;
  }
  if (isColoured(family)) {
    const base = COLOURED_LINE_ALPHA[shade];
    const tint = paletteRgb(family, 400);
    return base && tint ? rgba(tint, base * fraction) : null;
  }
  return null;
}

// ─── Class tokens ────────────────────────────────────────────────────────────

const FAMILY_PATTERN = [...NEUTRALS, ...COLOURED, "white", "black"].join("|");
const VARIANTS = ["hover", "focus", "focus-visible", "group-hover", "placeholder"] as const;
type Variant = (typeof VARIANTS)[number];

const TOKEN =
  new RegExp(
    `^((?:[a-z-]+:)*)(bg|text|border|border-[trblxy]|ring|divide|from|via|to|placeholder)-(${FAMILY_PATTERN})(?:-(\\d{2,3}))?(?:/(\\d{1,3}))?$`,
  );

export type ColourProperty = "bg" | "text" | "border" | "ring" | "divide" | "from" | "via" | "to" | "placeholder";

export interface ParsedColourClass {
  /** The class exactly as written, variants included. */
  token: string;
  variants: Variant[];
  /** `border-l` and the like keep their side; plain `border` is "". */
  side: string;
  property: ColourProperty;
  family: string;
  shade: number | null;
  /** 0-1, or null when the class has no opacity modifier. */
  alpha: number | null;
}

/** Parses one class token, or returns null when it is not a palette colour class this module handles. */
export function parseColourClass(token: string): ParsedColourClass | null {
  const match = TOKEN.exec(token);
  if (!match) return null;
  const variantWords = match[1].split(":").filter(Boolean);
  if (!variantWords.every((word): word is Variant => (VARIANTS as readonly string[]).includes(word))) return null;
  const raw = match[2];
  const side = raw.startsWith("border-") ? raw.slice("border-".length) : "";
  const property = (raw.startsWith("border-") ? "border" : raw) as ColourProperty;
  const family = match[3];
  const shade = match[4] ? Number(match[4]) : null;
  if ((family === "white" || family === "black") !== (shade === null)) return null;
  if (paletteRgb(family, shade) === null) return null;
  return { token, variants: variantWords, side, property, family, shade, alpha: match[5] ? Number(match[5]) / 100 : null };
}

/** Splits source text into candidate class tokens: anything between whitespace, quotes, braces and the like. */
function tokensOf(text: string): string[] {
  return text.split(/[\s"'`{}()<>,;=]+/).filter(Boolean);
}

/** Every distinct palette colour class written in a source file, in sorted order. */
export function collectColourClasses(source: string): string[] {
  const found = new Set<string>();
  for (const word of tokensOf(source)) if (parseColourClass(word)) found.add(word);
  return [...found].sort();
}

// ─── CSS ─────────────────────────────────────────────────────────────────────

/** Tripled so these rules beat the older light-theme overrides (`.admin-portal .text-gray-400:not(pre *)`). */
export const SCOPE = ".admin-pages.admin-pages.admin-pages";

const escapeClass = (token: string) => token.replace(/([^a-zA-Z0-9_-])/g, "\\$1");

/**
 * A preview that imitates a screen the recipient sees (an email, a social post, a chat bubble) is meant to
 * look light whatever the admin around it looks like. Mark its container `admin-light-island`: none of
 * these rules reach into it, and admin-pages.css gives it the light tokens back.
 */
export const LIGHT_ISLAND = ":not(.admin-light-island, .admin-light-island *)";

function selectorFor(parsed: ParsedColourClass, suffix = ""): string {
  const cls = `.${escapeClass(parsed.token)}`;
  const pseudo =
    parsed.variants
      .filter((v) => v !== "group-hover" && v !== "placeholder")
      .map((v) => `:${v}`)
      .join("") + LIGHT_ISLAND;
  const placeholder = parsed.variants.includes("placeholder") ? "::placeholder" : "";
  const group = parsed.variants.includes("group-hover") ? `${SCOPE} .group:hover ${cls}` : `${SCOPE} ${cls}`;
  return `${group}${pseudo}${placeholder}${suffix}`;
}

const SIDE_PROPERTY: Record<string, string[]> = {
  "": ["border-color"],
  t: ["border-top-color"],
  r: ["border-right-color"],
  b: ["border-bottom-color"],
  l: ["border-left-color"],
  x: ["border-left-color", "border-right-color"],
  y: ["border-top-color", "border-bottom-color"],
};

/** Families whose text colours globals.css overrides inside the admin portal (the light theme's contrast fixes). */
function touchedByLightTheme(family: string): boolean {
  return isNeutral(family) || family === "amber" || family === "orange";
}

/** The CSS rule for one class on the dark scene, or null when it already works on dark. */
export function darkRuleFor(parsed: ParsedColourClass): string | null {
  const { property, family, shade, alpha } = parsed;

  if (property === "text" || property === "placeholder") {
    // The light theme forces its own text colours (some with !important) onto grey, slate, amber and
    // orange text, so a class that "already works on dark" still needs its own colour written out here.
    const base = darkTextColour(family, shade) ?? (touchedByLightTheme(family) ? paletteRgb(family, shade) : null);
    if (!base) return null;
    const value = alpha === null ? hex(base) : rgba(base, alpha);
    return `${selectorFor(parsed)} { color: ${value} !important; }`;
  }

  if (property === "bg") {
    const fill = darkFill(family, shade, alpha);
    if (!fill) return null;
    const image = fill.backgroundImage ? ` background-image: ${fill.backgroundImage};` : "";
    return `${selectorFor(parsed)} { background-color: ${fill.backgroundColor};${image} }`;
  }

  if (property === "border" || property === "divide") {
    const value = darkLineColour(family, shade, alpha);
    if (!value) return null;
    const names = SIDE_PROPERTY[property === "divide" ? "" : parsed.side] ?? SIDE_PROPERTY[""];
    const declarations = names.map((name) => `${name}: ${value};`).join(" ");
    return `${selectorFor(parsed, property === "divide" ? " > :not([hidden]) ~ :not([hidden])" : "")} { ${declarations} }`;
  }

  if (property === "ring") {
    const value = darkLineColour(family, shade, alpha);
    return value ? `${selectorFor(parsed)} { --tw-ring-color: ${value}; }` : null;
  }

  // Gradient stops (from / via / to): light stops become dark tints, mirroring Tailwind's own declarations.
  const fill = darkFill(family, shade, alpha);
  if (!fill) return null;
  const stop = rgba(fill.layers[0].rgb, fill.layers[0].alpha);
  const clear = rgba(fill.layers[0].rgb, 0);
  if (property === "from") {
    return `${selectorFor(parsed)} { --tw-gradient-from: ${stop} var(--tw-gradient-from-position); --tw-gradient-to: ${clear} var(--tw-gradient-to-position); --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to); }`;
  }
  if (property === "via") {
    return `${selectorFor(parsed)} { --tw-gradient-to: ${clear} var(--tw-gradient-to-position); --tw-gradient-stops: var(--tw-gradient-from), ${stop} var(--tw-gradient-via-position), var(--tw-gradient-to); }`;
  }
  return `${selectorFor(parsed)} { --tw-gradient-to: ${stop} var(--tw-gradient-to-position); }`;
}

// ─── Contrast ────────────────────────────────────────────────────────────────

function channel(v: number): number {
  const s = v / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

export function luminance([r, g, b]: Rgb): number {
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(a: Rgb, b: Rgb): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

export function composite(top: Rgb, alpha: number, under: Rgb): Rgb {
  return [0, 1, 2].map((i) => Math.round(top[i] * alpha + under[i] * (1 - alpha))) as Rgb;
}

export interface ResolvedColour {
  rgb: Rgb;
  alpha: number;
}

/** What a text class resolves to on the dark scene (the mapped value, or the original when it is kept). */
export function resolveDarkText(parsed: ParsedColourClass): ResolvedColour {
  const mapped = darkTextColour(parsed.family, parsed.shade);
  return { rgb: mapped ?? (paletteRgb(parsed.family, parsed.shade) as Rgb), alpha: parsed.alpha ?? 1 };
}

export function resolveLight(parsed: ParsedColourClass): ResolvedColour {
  return { rgb: paletteRgb(parsed.family, parsed.shade) as Rgb, alpha: parsed.alpha ?? 1 };
}

/** The colour a background class produces over the dark scene (kept fills are composited as written). */
export function darkSurface(parsed: ParsedColourClass): Rgb {
  const fill = darkFill(parsed.family, parsed.shade, parsed.alpha);
  if (fill) return fill.layers.reduce((under, layer) => composite(layer.rgb, layer.alpha, under), SCENE);
  const original = resolveLight(parsed);
  return composite(original.rgb, original.alpha, SCENE);
}

export interface ClassPair {
  text: ParsedColourClass;
  bg: ParsedColourClass;
  /** Contrast of the text over the background on the dark scene. */
  dark: number;
  /** Contrast of the original classes on a plain white page (what the author saw). */
  light: number;
}

/** Contrast of a text class over a background class, on the dark scene and as originally written. */
export function pairContrast(text: ParsedColourClass, bg: ParsedColourClass): ClassPair {
  const surfaceDark = darkSurface(bg);
  const textDark = resolveDarkText(text);
  const dark = contrastRatio(composite(textDark.rgb, textDark.alpha, surfaceDark), surfaceDark);

  const bgLight = resolveLight(bg);
  const surfaceLight = composite(bgLight.rgb, bgLight.alpha, [255, 255, 255]);
  const textLight = resolveLight(text);
  const light = contrastRatio(composite(textLight.rgb, textLight.alpha, surfaceLight), surfaceLight);
  return { text, bg, dark, light };
}

/**
 * Pairs of plain (variant-free) text and background classes written together in one string literal:
 * the elements whose readability this module can actually judge.
 */
export function collectPairs(source: string): ClassPair[] {
  const pairs: ClassPair[] = [];
  const literals = source.match(/"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'|`(?:\\.|[^`\\])*`/g) ?? [];
  for (const literal of literals) {
    const parsed = tokensOf(literal.slice(1, -1))
      .map(parseColourClass)
      .filter((p): p is ParsedColourClass => p !== null && p.variants.length === 0);
    const texts = parsed.filter((p) => p.property === "text");
    const bgs = parsed.filter((p) => p.property === "bg");
    for (const text of texts) for (const bg of bgs) pairs.push(pairContrast(text, bg));
  }
  return pairs;
}

/** Pairs that were readable as written but are not on the dark scene. */
export function brokenPairs(source: string, minimum = 4.5): ClassPair[] {
  return collectPairs(source).filter((p) => p.light >= minimum && p.dark < minimum);
}

/**
 * The generated stylesheet: one rule per colour class, then a pair rule restoring the original text
 * colour wherever the dark text value would be unreadable on a fill that stays light.
 */
export function buildAdminDarkCss(sources: ReadonlyArray<{ path: string; source: string }>): string {
  const classes = new Set<string>();
  const pairRules = new Map<string, string>();
  for (const { source } of sources) {
    for (const token of collectColourClasses(source)) classes.add(token);
    for (const pair of brokenPairs(source)) {
      const original = resolveLight(pair.text);
      const selector = `${SCOPE} .${escapeClass(pair.bg.token)}.${escapeClass(pair.text.token)}${LIGHT_ISLAND}`;
      pairRules.set(selector, `${selector} { color: ${original.alpha === 1 ? hex(original.rgb) : rgba(original.rgb, original.alpha)} !important; }`);
    }
  }

  const rules: string[] = [];
  for (const token of [...classes].sort()) {
    const parsed = parseColourClass(token);
    const rule = parsed ? darkRuleFor(parsed) : null;
    if (rule) rules.push(rule);
  }
  const pairs = [...pairRules.keys()].sort().map((key) => pairRules.get(key) as string);

  return [
    "/* GENERATED by scripts/generate-admin-dark-pages.ts from src/lib/admin-dark-pages.ts. Do not edit by hand:",
    " * change the policy and run `npx tsx scripts/generate-admin-dark-pages.ts`. */",
    ...rules,
    "/* Pairs whose dark text value would not read on a fill that stays light: keep the original text colour. */",
    ...pairs,
    "",
  ].join("\n");
}
