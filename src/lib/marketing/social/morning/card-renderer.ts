/**
 * Renders a morning card as a PNG.
 *
 * Two text engines, each used for what it does correctly:
 *
 *   - Devanagari and Gurmukhi are set with sharp's text API (Pango and HarfBuzz underneath), because those scripts
 *     need real shaping: reph, conjuncts and the placement of vowel signs. The image library the name-story share
 *     image uses (satori) does not shape them: it printed visible halant marks instead of conjuncts and put the
 *     short i vowel on the wrong letter, which on scripture is not acceptable.
 *   - Latin text (labels, translation, citation, wordmark) is set with satori, which loads the app's brand fonts
 *     straight from the font files. (sharp's text engine silently fell back to a system sans for Inter and
 *     Cormorant Garamond in testing, so it is not trusted for them.)
 *
 * No AI image model is involved, so every character on a card is exactly the corpus text.
 *
 * Layout: a ceremonial frame in the app's own paper colours, the tradition's name, the verse in its own script,
 * an ornament, the translation when the corpus has a sourced one, the citation, and the Shoonaya wordmark. Type
 * sizes step down until the content fits; if even the smallest does not, rendering fails rather than overflow.
 */
import fs from "node:fs";
import path from "node:path";
import React from "react";
import { ImageResponse } from "next/og";
import sharp from "sharp";
import {
  BRAND_GOLD,
  CARD_SIZE,
  FONT_FILES,
  PAPER,
  TRADITION_ACCENT,
  TRADITION_LABEL,
  type FontKey
} from "./card-theme";
import { formatVerseLines } from "./verse-format";
import type { MorningVerse } from "./types";

export const FONT_DIR = path.join(process.cwd(), "src", "assets", "social-fonts");

export interface FontSource {
  path: string;
  family: string;
}
export type FontOverrides = Partial<Record<FontKey, FontSource>>;

function resolveFont(key: FontKey, overrides?: FontOverrides): FontSource {
  return overrides?.[key] ?? { path: path.join(FONT_DIR, FONT_FILES[key].file), family: FONT_FILES[key].family };
}

/** Fonts a card needs for this verse that are not on disk. */
export function missingFontsFor(verse: Pick<MorningVerse, "script" | "translation">, overrides?: FontOverrides): FontKey[] {
  const needed: FontKey[] = ["serif", "sans", "sansStrong", verse.script === "gurmukhi" ? "gurmukhi" : "devanagari"];
  if (verse.translation) needed.push("serifItalic");
  return needed.filter((key) => !fs.existsSync(resolveFont(key, overrides).path));
}

export class CardRenderError extends Error {
  constructor(
    readonly code: "font_missing" | "font_not_loaded" | "text_not_drawn" | "content_too_long",
    message: string
  ) {
    super(message);
  }
}

interface TextLayer {
  input: Buffer;
  width: number;
  height: number;
}

interface TextStyle {
  font: FontKey;
  size: number;
  color: string;
  width: number;
  /** Extra space between lines, in px (Indic text only; Latin uses lineHeight). */
  lineSpacing?: number;
  /** Extra space between letters, in px. */
  letterSpacing?: number;
  /** Latin only: the tallest this block may be before it counts as overflowing. */
  maxHeight?: number;
}

function escapeMarkup(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Counts drawn pixels. A blank layer must never reach an approval screen. */
async function assertInked(layer: TextLayer, what: string): Promise<void> {
  const alpha = await sharp(layer.input).ensureAlpha().extractChannel(3).raw().toBuffer();
  let inked = 0;
  for (let i = 0; i < alpha.length; i++) if (alpha[i] > 40) inked++;
  if (layer.width < 8 || layer.height < 8 || inked < 40) {
    throw new CardRenderError("text_not_drawn", `Text drew nothing (${what}); refusing to produce a blank card`);
  }
}

// ── Devanagari and Gurmukhi: Pango / HarfBuzz ─────────────────────────────────

const INDIC_PROBE: Record<"devanagari" | "gurmukhi", string> = {
  devanagari: "कर्मण्येवाधिकारस्ते",
  gurmukhi: "ਸਤਿ ਨਾਮੁ ਕਰਤਾ ਪੁਰਖੁ"
};
const verifiedFonts = new Set<string>();

async function probeWidth(text: string, family: string, fontfile?: string): Promise<number> {
  const { info } = await sharp({
    text: { text: `<span>${escapeMarkup(text)}</span>`, font: `${family} 60`, fontfile, width: 4000, rgba: true }
  })
    .png()
    .toBuffer({ resolveWithObject: true });
  return info.width;
}

/**
 * The text engine falls back to a system font without any error when a font file does not register (it did so
 * for Inter, Cormorant and Kalam in testing). On a server with no Indic system font that would print boxes, and
 * on one that has one it would print the wrong face. So measure the same word in the requested font and in a
 * family that does not exist: if the widths match, the file was not used.
 */
async function assertIndicFontLoaded(script: "devanagari" | "gurmukhi", font: FontSource): Promise<void> {
  if (verifiedFonts.has(font.path)) return;
  const sample = INDIC_PROBE[script];
  const requested = await probeWidth(sample, font.family, font.path);
  const fallback = await probeWidth(sample, "ZzNoSuchFontFamily");
  if (Math.abs(requested - fallback) / fallback < 0.01) {
    throw new CardRenderError(
      "font_not_loaded",
      `${path.basename(font.path)} did not load in the text engine (it measured the same as the system fallback)`
    );
  }
  verifiedFonts.add(font.path);
}

async function renderIndic(text: string, style: TextStyle, overrides?: FontOverrides): Promise<TextLayer> {
  const font = resolveFont(style.font, overrides);
  if (!fs.existsSync(font.path)) {
    throw new CardRenderError("font_missing", `Font file not found: ${path.basename(font.path)}`);
  }
  await assertIndicFontLoaded(style.font === "gurmukhi" ? "gurmukhi" : "devanagari", font);

  const { data, info } = await sharp({
    text: {
      text: `<span foreground="${style.color}">${escapeMarkup(text)}</span>`,
      font: `${font.family} ${style.size}`,
      fontfile: font.path,
      width: style.width,
      align: "centre",
      rgba: true,
      spacing: style.lineSpacing ?? 0
    }
  })
    .png()
    .toBuffer({ resolveWithObject: true });
  const layer = { input: data, width: info.width, height: info.height };
  await assertInked(layer, `font ${font.family}`);
  return layer;
}

// ── Latin: satori, with the brand font files ──────────────────────────────────

interface LatinFont {
  name: string;
  data: Buffer;
  weight: 400 | 500 | 600 | 700;
  style: "normal" | "italic";
}
const latinFontCache = new Map<string, LatinFont>();

function latinFont(key: FontKey, overrides?: FontOverrides): LatinFont {
  const source = resolveFont(key, overrides);
  let font = latinFontCache.get(source.path);
  if (!font) {
    if (!fs.existsSync(source.path)) {
      throw new CardRenderError("font_missing", `Font file not found: ${path.basename(source.path)}`);
    }
    font = {
      name: source.family,
      data: fs.readFileSync(source.path),
      weight: key === "sans" ? 500 : 600,
      style: key === "serifItalic" ? "italic" : "normal"
    };
    latinFontCache.set(source.path, font);
  }
  return font;
}

async function renderLatin(text: string, style: TextStyle, overrides?: FontOverrides): Promise<TextLayer & { overflow: boolean }> {
  const font = latinFont(style.font, overrides);
  const canvasHeight = style.maxHeight ?? 700;
  const element = React.createElement(
    "div",
    {
      style: {
        display: "flex",
        width: style.width,
        justifyContent: "center",
        textAlign: "center",
        color: style.color,
        fontFamily: font.name,
        fontSize: style.size,
        lineHeight: 1.28,
        letterSpacing: style.letterSpacing ?? 0
      }
    },
    text
  );
  const image = new ImageResponse(element as React.ReactElement, {
    width: style.width,
    height: canvasHeight,
    fonts: [{ name: font.name, data: font.data, weight: font.weight, style: font.style }]
  });
  const { data, info } = await sharp(Buffer.from(await image.arrayBuffer()))
    .trim({ threshold: 8 })
    .png()
    .toBuffer({ resolveWithObject: true });
  const layer = { input: data, width: info.width, height: info.height };
  await assertInked(layer, `font ${font.name}`);
  // The picture is a fixed height: text that reaches the bottom edge was cut off.
  return { ...layer, overflow: info.height >= canvasHeight - 4 };
}

async function fitLatin(
  text: string,
  base: Omit<TextStyle, "size">,
  sizes: readonly number[],
  maxHeight: number,
  overrides?: FontOverrides
): Promise<TextLayer & { size: number; fits: boolean }> {
  let last: (TextLayer & { size: number }) | null = null;
  for (const size of sizes) {
    const layer = await renderLatin(text, { ...base, size, maxHeight: maxHeight + 120 }, overrides);
    last = { input: layer.input, width: layer.width, height: layer.height, size };
    if (!layer.overflow && layer.height <= maxHeight) return { ...last, fits: true };
  }
  return { ...last!, fits: false };
}

// ── Layout ────────────────────────────────────────────────────────────────────

const { width: W, height: H } = CARD_SIZE;
const MARGIN_X = 130;
const CONTENT_W = W - MARGIN_X * 2;
const TOP = 170;
const BOTTOM = 1112;
const FOOTER_Y = 1166;

const VERSE_SIZES = [64, 58, 53, 49, 45, 41, 38] as const;
const TRANSLATION_SIZES = [42, 38, 35, 32, 29] as const;

function baseSvg(accent: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="glow" cx="50%" cy="40%" r="78%">
      <stop offset="0%" stop-color="${PAPER.card}"/>
      <stop offset="100%" stop-color="${PAPER.cardSoft}"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="${PAPER.page}"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  <g fill="none" stroke="${accent}" stroke-opacity="0.07" stroke-width="2">
    <circle cx="${W / 2}" cy="560" r="210"/>
    <circle cx="${W / 2}" cy="560" r="310" stroke-dasharray="2 14" stroke-linecap="round"/>
    <circle cx="${W / 2}" cy="560" r="420"/>
  </g>
  <rect x="44" y="44" width="${W - 88}" height="${H - 88}" rx="30" fill="none" stroke="${PAPER.borderColor}" stroke-opacity="${PAPER.borderOpacity}" stroke-width="2"/>
  <rect x="64" y="64" width="${W - 128}" height="${H - 128}" rx="20" fill="none" stroke="${accent}" stroke-opacity="0.5" stroke-width="1.5"/>
  ${[
    [64, 64],
    [W - 64, 64],
    [64, H - 64],
    [W - 64, H - 64]
  ]
    .map(([x, y]) => `<rect x="${x - 7}" y="${y - 7}" width="14" height="14" transform="rotate(45 ${x} ${y})" fill="${BRAND_GOLD}"/>`)
    .join("\n  ")}
</svg>`;
}

function ornamentSvg(accent: string): { svg: string; width: number; height: number } {
  const width = 360;
  const height = 24;
  const mid = width / 2;
  return {
    width,
    height,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <g stroke="${accent}" stroke-width="2" stroke-linecap="round" stroke-opacity="0.85">
    <line x1="10" y1="12" x2="${mid - 26}" y2="12"/>
    <line x1="${mid + 26}" y1="12" x2="${width - 10}" y2="12"/>
  </g>
  <rect x="${mid - 8}" y="4" width="16" height="16" transform="rotate(45 ${mid} 12)" fill="${BRAND_GOLD}"/>
  <circle cx="${mid - 36}" cy="12" r="3.5" fill="${accent}"/>
  <circle cx="${mid + 36}" cy="12" r="3.5" fill="${accent}"/>
</svg>`
  };
}

export interface RenderedCard {
  png: Buffer;
  width: number;
  height: number;
}

/**
 * The verse laid out at each size, best first. A verse line that stays on one line reads as scripture is meant to,
 * so every size at which no line wraps comes first (largest first); sizes that need wrapping come after, as a
 * fallback for a long verse.
 */
async function verseCandidates(verse: MorningVerse, scriptFont: FontKey, overrides?: FontOverrides): Promise<TextLayer[]> {
  const make = (size: number, width: number) =>
    renderIndic(formatVerseLines(verse.original), { font: scriptFont, size, color: PAPER.text, width, lineSpacing: Math.round(size * 0.2) }, overrides);
  const unwrapped: TextLayer[] = [];
  const wrapped: TextLayer[] = [];
  for (const size of VERSE_SIZES) {
    const natural = await make(size, 4000); // wide enough that nothing wraps, so its width is the longest line
    if (natural.width <= CONTENT_W) unwrapped.push(natural);
    else wrapped.push(await make(size, CONTENT_W));
  }
  return [...unwrapped, ...wrapped];
}

export async function renderMorningCard(verse: MorningVerse, overrides?: FontOverrides): Promise<RenderedCard> {
  const missing = missingFontsFor(verse, overrides);
  if (missing.length > 0) {
    throw new CardRenderError("font_missing", `Missing font file(s) for ${verse.tradition}: ${missing.map((k) => FONT_FILES[k].file).join(", ")}`);
  }

  const accent = TRADITION_ACCENT[verse.tradition];
  const scriptFont: FontKey = verse.script === "gurmukhi" ? "gurmukhi" : "devanagari";
  const latin = async (text: string, style: Omit<TextStyle, "width"> & { width?: number }) =>
    renderLatin(text, { ...style, width: style.width ?? CONTENT_W }, overrides);

  const label = await latin(TRADITION_LABEL[verse.tradition].toUpperCase(), {
    font: "sansStrong", size: 24, color: PAPER.accent, letterSpacing: 5, maxHeight: 80
  });
  const citationText = verse.attribution && verse.script === "gurmukhi"
    ? `${verse.citation.toUpperCase()}  ·  ${verse.attribution.toUpperCase()}`
    : verse.citation.toUpperCase();
  const citation = await latin(citationText, {
    font: "sansStrong", size: 22, color: PAPER.accent, letterSpacing: 3, maxHeight: 120
  });
  const credit = verse.translation && verse.translationCredit
    ? await latin(verse.translationCredit, { font: "sans", size: 20, color: PAPER.dim, maxHeight: 80 })
    : null;

  const ornament = ornamentSvg(accent);
  const GAP_LABEL = 64, GAP_VERSE = 56, GAP_ORN = 50, GAP_TRANSLATION = 58, GAP_CREDIT = 14;
  const available = BOTTOM - TOP;
  const fixed = label.height + GAP_LABEL + GAP_VERSE + ornament.height + GAP_ORN + GAP_TRANSLATION + citation.height + (credit ? GAP_CREDIT + credit.height : 0);

  // Largest verse type that, with the translation fitted beside it, fits the page.
  let chosen: { verse: TextLayer; translation: TextLayer | null } | null = null;
  for (const verseLayer of await verseCandidates(verse, scriptFont, overrides)) {
    const translationLayer = verse.translation
      ? await fitLatin(verse.translation, { font: "serifItalic", color: PAPER.text, width: CONTENT_W - 40 }, TRANSLATION_SIZES, 330, overrides)
      : null;
    if (translationLayer && !translationLayer.fits) continue;
    const total = fixed - (verse.translation ? 0 : GAP_TRANSLATION) + verseLayer.height + (translationLayer?.height ?? 0);
    if (total <= available) {
      chosen = { verse: verseLayer, translation: translationLayer };
      break;
    }
  }
  if (!chosen) {
    throw new CardRenderError("content_too_long", `The verse and translation do not fit the card at the smallest type size (${verse.sourceRef})`);
  }

  const contentHeight =
    label.height + GAP_LABEL + chosen.verse.height + GAP_VERSE + ornament.height + GAP_ORN + (chosen.translation ? chosen.translation.height + GAP_TRANSLATION : GAP_ORN) +
    citation.height + (credit ? GAP_CREDIT + credit.height : 0);
  let y = TOP + Math.max(0, Math.round((available - contentHeight) / 2));

  const layers: sharp.OverlayOptions[] = [];
  const place = (layer: TextLayer) => {
    layers.push({ input: layer.input, left: Math.round((W - layer.width) / 2), top: y });
    y += layer.height;
  };

  place(label);
  y += GAP_LABEL;
  place(chosen.verse);
  y += GAP_VERSE;
  layers.push({ input: Buffer.from(ornament.svg), left: Math.round((W - ornament.width) / 2), top: y });
  y += ornament.height + GAP_ORN;
  if (chosen.translation) {
    place(chosen.translation);
    y += GAP_TRANSLATION;
  } else {
    y += GAP_ORN;
  }
  place(citation);
  if (credit) {
    y += GAP_CREDIT;
    place(credit);
  }

  const wordmark = await latin("Shoonaya", { font: "serif", size: 56, color: PAPER.text, maxHeight: 120 });
  const tagline = await latin("Find your infinite.", { font: "sans", size: 21, color: PAPER.dim, letterSpacing: 1.5, maxHeight: 60 });
  layers.push({ input: wordmark.input, left: Math.round((W - wordmark.width) / 2), top: FOOTER_Y });
  layers.push({ input: tagline.input, left: Math.round((W - tagline.width) / 2), top: FOOTER_Y + wordmark.height + 6 });

  const png = await sharp(Buffer.from(baseSvg(accent)))
    .composite(layers)
    .png({ compressionLevel: 9 })
    .toBuffer();
  return { png, width: W, height: H };
}
