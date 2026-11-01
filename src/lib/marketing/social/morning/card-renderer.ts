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
 * Layout: a ceremonial frame in the app's signature dark aesthetic, the tradition's name, the verse in its own script,
 * an ornament, the translation when the corpus has a sourced one, and the citation. Type
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
if (!process.env.FONTCONFIG_PATH && fs.existsSync(FONT_DIR)) {
  process.env.FONTCONFIG_PATH = FONT_DIR;
}

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

/** Verifies that a TrueType/OpenType font file contains glyphs for the given text in its cmap table. */
function fontHasGlyphs(filePath: string, text: string): boolean {
  try {
    const buf = fs.readFileSync(filePath);
    const numTables = buf.readUInt16BE(4);
    let cmapOffset = 0;
    for (let i = 0; i < numTables; i++) {
      const tag = buf.toString("utf8", 12 + i * 16, 16 + i * 16);
      if (tag === "cmap") {
        cmapOffset = buf.readUInt32BE(12 + i * 16 + 8);
        break;
      }
    }
    if (!cmapOffset) return false;
    const numSubtables = buf.readUInt16BE(cmapOffset + 2);
    let format4Offset = 0;
    for (let i = 0; i < numSubtables; i++) {
      const subtableOffset = cmapOffset + buf.readUInt32BE(cmapOffset + 4 + i * 8 + 4);
      const format = buf.readUInt16BE(subtableOffset);
      if (format === 4) {
        format4Offset = subtableOffset;
        break;
      }
    }
    if (!format4Offset) return false;
    const segCountX2 = buf.readUInt16BE(format4Offset + 6);
    const segCount = segCountX2 / 2;
    const endCodeOffset = format4Offset + 14;
    const startCodeOffset = endCodeOffset + segCountX2 + 2;

    const chars = Array.from(text).map((c) => c.codePointAt(0) ?? 0);
    for (const code of chars) {
      if (code < 32) continue;
      let found = false;
      for (let s = 0; s < segCount; s++) {
        const start = buf.readUInt16BE(startCodeOffset + s * 2);
        const end = buf.readUInt16BE(endCodeOffset + s * 2);
        if (code >= start && code <= end) {
          found = true;
          break;
        }
      }
      if (!found) return false;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Ensures the font file actually covers the Indic script and renders with real glyphs in Sharp.
 * Fonts missing the script (like Inter) or rendering as unshaped tofu are caught and rejected.
 */
async function assertIndicFontLoaded(script: "devanagari" | "gurmukhi", font: FontSource): Promise<void> {
  if (verifiedFonts.has(font.path)) return;
  const sample = INDIC_PROBE[script];

  // 1. Verify the font file contains the required glyphs in its TrueType cmap table.
  if (!fontHasGlyphs(font.path, sample)) {
    throw new CardRenderError(
      "font_not_loaded",
      `${path.basename(font.path)} did not load in the text engine (it measured the same as the system fallback)`
    );
  }

  // 2. Probe render with Sharp to ensure libvips/pango shapes and renders with valid dimensions.
  const { data, info } = await sharp({
    text: { text: `<span>${escapeMarkup(sample)}</span>`, font: `${font.family} 60`, fontfile: font.path, width: 4000, rgba: true }
  })
    .png()
    .toBuffer({ resolveWithObject: true });

  if (info.height < 30 || info.width < 100 || data.length < 500) {
    throw new CardRenderError(
      "font_not_loaded",
      `${path.basename(font.path)} did not load in the text engine (rendered invalid dimensions ${info.width}x${info.height})`
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
const TOP = 130;
const BOTTOM = 1220;

const VERSE_SIZES = [64, 58, 53, 49, 45, 41, 38] as const;
const TRANSLATION_SIZES = [42, 38, 35, 32, 29] as const;

function baseSvg(accent: string): string {
  const midX = W / 2;
  const midY = 600;
  const angles = [0, 45, 90, 135, 180, 225, 270, 315];
  const r2 = 240;

  const dots = angles
    .map((deg) => {
      const rad = (deg * Math.PI) / 180;
      const x = midX + r2 * Math.cos(rad);
      const y = midY + r2 * Math.sin(rad);
      return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.5" fill="${accent}" fill-opacity="0.35"/>`;
    })
    .join("\n  ");

  const rays = angles
    .map((deg) => {
      const rad = (deg * Math.PI) / 180;
      const x1 = midX + 310 * Math.cos(rad);
      const y1 = midY + 310 * Math.sin(rad);
      const x2 = midX + 345 * Math.cos(rad);
      const y2 = midY + 345 * Math.sin(rad);
      return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${accent}" stroke-width="1" stroke-opacity="0.18"/>`;
    })
    .join("\n  ");

  const corners = [
    { x: 58, y: 58, dx: 1, dy: 1 },
    { x: W - 58, y: 58, dx: -1, dy: 1 },
    { x: 58, y: H - 58, dx: 1, dy: -1 },
    { x: W - 58, y: H - 58, dx: -1, dy: -1 }
  ]
    .map(
      (c) => `
    <g>
      <rect x="${c.x - 7}" y="${c.y - 7}" width="14" height="14" transform="rotate(45 ${c.x} ${c.y})" fill="${BRAND_GOLD}"/>
      <rect x="${c.x - 3}" y="${c.y - 3}" width="6" height="6" transform="rotate(45 ${c.x} ${c.y})" fill="${PAPER.page}"/>
      <line x1="${c.x + c.dx * 12}" y1="${c.y}" x2="${c.x + c.dx * 32}" y2="${c.y}" stroke="${BRAND_GOLD}" stroke-width="1.5" stroke-opacity="0.6"/>
      <line x1="${c.x}" y1="${c.y + c.dy * 12}" x2="${c.x}" y2="${c.y + c.dy * 32}" stroke="${BRAND_GOLD}" stroke-width="1.5" stroke-opacity="0.6"/>
      <circle cx="${c.x + c.dx * 32}" cy="${c.y}" r="2" fill="${BRAND_GOLD}" fill-opacity="0.7"/>
      <circle cx="${c.x}" cy="${c.y + c.dy * 32}" r="2" fill="${BRAND_GOLD}" fill-opacity="0.7"/>
    </g>`
    )
    .join("\n");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="glow" cx="50%" cy="45%" r="75%">
      <stop offset="0%" stop-color="${PAPER.card}"/>
      <stop offset="60%" stop-color="${PAPER.cardSoft}"/>
      <stop offset="100%" stop-color="${PAPER.page}"/>
    </radialGradient>
    <radialGradient id="centerGlow" cx="50%" cy="46%" r="42%">
      <stop offset="0%" stop-color="${accent}" stop-opacity="0.14"/>
      <stop offset="100%" stop-color="${accent}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="${PAPER.page}"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  <rect width="${W}" height="${H}" fill="url(#centerGlow)"/>

  <!-- Sacred Geometry Mandala Watermark -->
  <g fill="none">
    <circle cx="${midX}" cy="${midY}" r="150" stroke="${accent}" stroke-opacity="0.08" stroke-width="1" stroke-dasharray="2 8"/>
    <circle cx="${midX}" cy="${midY}" r="240" stroke="${accent}" stroke-opacity="0.10" stroke-width="1"/>
    <circle cx="${midX}" cy="${midY}" r="310" stroke="${accent}" stroke-opacity="0.14" stroke-width="1.5" stroke-dasharray="4 14" stroke-linecap="round"/>
    <circle cx="${midX}" cy="${midY}" r="390" stroke="${accent}" stroke-opacity="0.07" stroke-width="1" stroke-dasharray="1 10"/>
    <rect x="${midX - 110}" y="${midY - 110}" width="220" height="220" stroke="${accent}" stroke-opacity="0.06" stroke-width="1"/>
    <rect x="${midX - 110}" y="${midY - 110}" width="220" height="220" transform="rotate(45 ${midX} ${midY})" stroke="${accent}" stroke-opacity="0.06" stroke-width="1"/>
    ${rays}
    ${dots}
  </g>

  <!-- Traditional Manuscript Frames -->
  <rect x="40" y="40" width="${W - 80}" height="${H - 80}" rx="24" fill="none" stroke="${PAPER.borderColor}" stroke-opacity="${PAPER.borderOpacity}" stroke-width="1.5"/>
  <rect x="58" y="58" width="${W - 116}" height="${H - 116}" rx="16" fill="none" stroke="${accent}" stroke-opacity="0.30" stroke-width="1"/>

  <!-- Manuscript Corner Florets -->
  ${corners}
</svg>`;
}

function ornamentSvg(accent: string): { svg: string; width: number; height: number } {
  const width = 420;
  const height = 30;
  const mid = width / 2;
  return {
    width,
    height,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <!-- Tapered Hairline Rules -->
  <g stroke="${accent}" stroke-width="1.5" stroke-linecap="round" stroke-opacity="0.80">
    <line x1="16" y1="15" x2="${mid - 68}" y2="15"/>
    <line x1="${mid + 68}" y1="15" x2="${width - 16}" y2="15"/>
  </g>
  <!-- Flanking Sacred Bindu Dots (graduated outward) -->
  <circle cx="${mid - 54}" cy="15" r="2" fill="${accent}" fill-opacity="0.7"/>
  <circle cx="${mid - 40}" cy="15" r="3" fill="${BRAND_GOLD}" fill-opacity="0.85"/>
  <circle cx="${mid - 24}" cy="15" r="4" fill="${accent}"/>
  <circle cx="${mid + 24}" cy="15" r="4" fill="${accent}"/>
  <circle cx="${mid + 40}" cy="15" r="3" fill="${BRAND_GOLD}" fill-opacity="0.85"/>
  <circle cx="${mid + 54}" cy="15" r="2" fill="${accent}" fill-opacity="0.7"/>
  <!-- Central Sacred Motif: Gold Diamond with Bindu Eye -->
  <rect x="${mid - 9}" y="6" width="18" height="18" transform="rotate(45 ${mid} 15)" fill="${BRAND_GOLD}"/>
  <rect x="${mid - 4}" y="11" width="8" height="8" transform="rotate(45 ${mid} 15)" fill="${PAPER.page}"/>
  <circle cx="${mid}" cy="15" r="2" fill="${BRAND_GOLD}"/>
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

  const png = await sharp(Buffer.from(baseSvg(accent)))
    .composite(layers)
    .png({ compressionLevel: 9 })
    .toBuffer();
  return { png, width: W, height: H };
}
