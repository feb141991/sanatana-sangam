/**
 * Renders an authentic branded social media card (PNG, 1080x1350, 4:5 portrait)
 * for Instagram, Facebook, and LinkedIn posts.
 *
 * Implements the signature Shoonaya sacred aesthetic:
 *   - Deep obsidian background with subtle radial spiritual glow
 *   - Sacred geometry mandala watermark
 *   - Traditional manuscript double-frame with 45-degree gold corner flourishes
 *   - Cormorant Garamond for Latin wisdom / philosophical insights
 *   - Mukta / Noto Sans Gurmukhi via Sharp's Pango/HarfBuzz text engine for Indic scripts
 *   - Inter for sacred metadata and Shoonaya brand mark
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
  type FontKey
} from "./morning/card-theme";

export const FONT_DIR = path.join(process.cwd(), "src", "assets", "social-fonts");
if (!process.env.FONTCONFIG_PATH && fs.existsSync(FONT_DIR)) {
  process.env.FONTCONFIG_PATH = FONT_DIR;
}

export interface SocialPostCardInput {
  title: string;
  categoryLabel?: string;
  tradition?: string | null;
  quoteOrInsight: string;
  citation?: string | null;
}

const DEVANAGARI_REGEX = /[\u0900-\u097F]/;
const GURMUKHI_REGEX = /[\u0A00-\u0A7F]/;

function detectScript(text: string): "devanagari" | "gurmukhi" | "latin" {
  if (GURMUKHI_REGEX.test(text)) return "gurmukhi";
  if (DEVANAGARI_REGEX.test(text)) return "devanagari";
  return "latin";
}

function resolveFontPath(key: FontKey): string {
  const localPath = path.join(FONT_DIR, FONT_FILES[key].file);
  if (fs.existsSync(localPath)) return localPath;
  const standalonePath = path.resolve(process.cwd(), ".next/standalone/src/assets/social-fonts", FONT_FILES[key].file);
  if (fs.existsSync(standalonePath)) return standalonePath;
  return localPath;
}

function escapeMarkup(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function getBackgroundSvg(accent = BRAND_GOLD): string {
  const { width: W, height: H } = CARD_SIZE;
  const midX = W / 2;
  const midY = 620;
  const angles = [0, 45, 90, 135, 180, 225, 270, 315];

  const rays = angles
    .map((deg) => {
      const rad = (deg * Math.PI) / 180;
      const x1 = midX + 300 * Math.cos(rad);
      const y1 = midY + 300 * Math.sin(rad);
      const x2 = midX + 340 * Math.cos(rad);
      const y2 = midY + 340 * Math.sin(rad);
      return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${accent}" stroke-width="1.5" stroke-opacity="0.25"/>`;
    })
    .join("\n  ");

  const corners = [
    { x: 54, y: 54, dx: 1, dy: 1 },
    { x: W - 54, y: 54, dx: -1, dy: 1 },
    { x: 54, y: H - 54, dx: 1, dy: -1 },
    { x: W - 54, y: H - 54, dx: -1, dy: -1 }
  ]
    .map(
      (c) => `
    <g>
      <rect x="${c.x - 7}" y="${c.y - 7}" width="14" height="14" transform="rotate(45 ${c.x} ${c.y})" fill="${BRAND_GOLD}"/>
      <rect x="${c.x - 3}" y="${c.y - 3}" width="6" height="6" transform="rotate(45 ${c.x} ${c.y})" fill="#0C0A07"/>
      <line x1="${c.x + c.dx * 12}" y1="${c.y}" x2="${c.x + c.dx * 36}" y2="${c.y}" stroke="${BRAND_GOLD}" stroke-width="1.5" stroke-opacity="0.7"/>
      <line x1="${c.x}" y1="${c.y + c.dy * 12}" x2="${c.x}" y2="${c.y + c.dy * 36}" stroke="${BRAND_GOLD}" stroke-width="1.5" stroke-opacity="0.7"/>
    </g>`
    )
    .join("\n");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="glow" cx="50%" cy="45%" r="75%">
      <stop offset="0%" stop-color="#141210"/>
      <stop offset="60%" stop-color="#1C1A16"/>
      <stop offset="100%" stop-color="#0C0A07"/>
    </radialGradient>
    <radialGradient id="centerGlow" cx="50%" cy="46%" r="42%">
      <stop offset="0%" stop-color="${accent}" stop-opacity="0.14"/>
      <stop offset="100%" stop-color="${accent}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="#0C0A07"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  <rect width="${W}" height="${H}" fill="url(#centerGlow)"/>
  <rect x="54" y="54" width="${W - 108}" height="${H - 108}" fill="none" stroke="${BRAND_GOLD}" stroke-width="1.5" stroke-opacity="0.35"/>
  <rect x="64" y="64" width="${W - 128}" height="${H - 128}" fill="none" stroke="${BRAND_GOLD}" stroke-width="0.75" stroke-opacity="0.2"/>
  <g fill="none">
    <circle cx="${midX}" cy="${midY}" r="170" stroke="${accent}" stroke-opacity="0.10" stroke-width="1" stroke-dasharray="2 8"/>
    <circle cx="${midX}" cy="${midY}" r="250" stroke="${accent}" stroke-opacity="0.12" stroke-width="1"/>
    <circle cx="${midX}" cy="${midY}" r="310" stroke="${accent}" stroke-opacity="0.16" stroke-width="1.5" stroke-dasharray="4 14"/>
    ${rays}
  </g>
  ${corners}
</svg>`;
}

/** Cleans and trims raw grounding text or description for elegant typography presentation. */
function cleanInsightText(raw: string): { quote: string; citationExtra?: string } {
  let cleaned = raw.replace(/^Scriptural grounding:\s*/i, "").trim();

  // If text contains a quote in quotes, extract it prominently
  const quoteMatch = cleaned.match(/["“]([^"”]{10,350})["”]/);
  if (quoteMatch) {
    const quote = quoteMatch[1].trim();
    // What precedes or follows may be the citation
    let before = cleaned.slice(0, quoteMatch.index).trim();
    before = before.replace(/[—:\(,\s]+$/, "").trim();
    return { quote: `“${quote}”`, citationExtra: before || undefined };
  }

  // If text is long, truncate cleanly at sentence or word boundary
  if (cleaned.length > 260) {
    const truncated = cleaned.slice(0, 260);
    const lastPunct = Math.max(truncated.lastIndexOf(". "), truncated.lastIndexOf("; "), truncated.lastIndexOf("— "));
    if (lastPunct > 120) {
      cleaned = truncated.slice(0, lastPunct + 1);
    } else {
      const lastSpace = truncated.lastIndexOf(" ");
      cleaned = `${truncated.slice(0, lastSpace)}…`;
    }
  }

  return { quote: cleaned };
}

export async function renderSocialPostCard(input: SocialPostCardInput): Promise<{ png: Buffer }> {
  const traditionKey = (input.tradition?.toLowerCase() ?? "hindu") as keyof typeof TRADITION_ACCENT;
  const accent = TRADITION_ACCENT[traditionKey] || BRAND_GOLD;

  const fontSerifPath = resolveFontPath("serif");
  const fontSansPath = resolveFontPath("sans");
  const fontDevanagariPath = resolveFontPath("devanagari");
  const fontGurmukhiPath = resolveFontPath("gurmukhi");

  const fontSerifData = fs.readFileSync(fontSerifPath);
  const fontSansData = fs.readFileSync(fontSansPath);

  const { quote, citationExtra } = cleanInsightText(input.quoteOrInsight);
  const fullCitation = [citationExtra, input.citation].filter(Boolean).join(" • ");

  const script = detectScript(`${input.title} ${quote}`);

  // If the text is purely Latin/English: render with high-definition satori ImageResponse
  // If Indic: load Mukta/Gurmukhi fonts into ImageResponse and render with proper fallbacks
  const availableFonts: Array<{ name: string; data: Buffer; weight: 400 | 500 | 600 | 700; style: "normal" | "italic" }> = [
    { name: "Cormorant Garamond SemiBold", data: fontSerifData, weight: 600, style: "normal" },
    { name: "Inter Medium", data: fontSansData, weight: 500, style: "normal" }
  ];

  if (fs.existsSync(fontDevanagariPath)) {
    availableFonts.push({
      name: "Mukta Medium",
      data: fs.readFileSync(fontDevanagariPath),
      weight: 500,
      style: "normal"
    });
  }

  if (fs.existsSync(fontGurmukhiPath)) {
    availableFonts.push({
      name: "Noto Sans Gurmukhi Medium",
      data: fs.readFileSync(fontGurmukhiPath),
      weight: 500,
      style: "normal"
    });
  }

  const titleFont = script === "gurmukhi" ? "Noto Sans Gurmukhi Medium" : script === "devanagari" ? "Mukta Medium" : "Cormorant Garamond SemiBold";
  const bodyFont = script === "gurmukhi" ? "Noto Sans Gurmukhi Medium" : script === "devanagari" ? "Mukta Medium" : "Cormorant Garamond SemiBold";

  const titleLength = input.title.length;
  const titleFontSize = titleLength > 36 ? 48 : titleLength > 24 ? 54 : 60;
  const quoteFontSize = quote.length > 200 ? 28 : quote.length > 120 ? 32 : 36;

  const element = React.createElement(
    "div",
    {
      style: {
        display: "flex",
        flexDirection: "column",
        width: 1080,
        height: 1350,
        backgroundColor: "transparent",
        padding: "110px 96px",
        justifyContent: "space-between",
        alignItems: "center",
        boxSizing: "border-box"
      }
    },
    [
      // Top Header
      React.createElement(
        "div",
        {
          key: "header",
          style: { display: "flex", flexDirection: "column", alignItems: "center" }
        },
        [
          React.createElement(
            "span",
            {
              key: "cat",
              style: {
                fontSize: 18,
                fontFamily: "Inter Medium",
                color: BRAND_GOLD,
                letterSpacing: 4,
                textTransform: "uppercase"
              }
            },
            input.categoryLabel || "DAILY DHARMA CONTEMPLATION"
          ),
          React.createElement("div", {
            key: "head-line",
            style: {
              width: 48,
              height: 1,
              backgroundColor: BRAND_GOLD,
              opacity: 0.4,
              marginTop: 12
            }
          })
        ]
      ),

      // Centerpiece: Title, Ornament, Quote & Citation
      React.createElement(
        "div",
        {
          key: "body",
          style: {
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            maxWidth: 880
          }
        },
        [
          React.createElement(
            "h1",
            {
              key: "t",
              style: {
                fontSize: titleFontSize,
                fontFamily: titleFont,
                color: PAPER.text,
                margin: "0 0 20px 0",
                lineHeight: 1.18,
                fontWeight: 600
              }
            },
            input.title
          ),
          React.createElement("div", {
            key: "orn",
            style: {
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 32
            }
          }, [
            React.createElement("div", { key: "l1", style: { width: 50, height: 1, backgroundColor: BRAND_GOLD, opacity: 0.5 } }),
            React.createElement("div", { key: "d", style: { width: 8, height: 8, backgroundColor: BRAND_GOLD, transform: "rotate(45deg)" } }),
            React.createElement("div", { key: "l2", style: { width: 50, height: 1, backgroundColor: BRAND_GOLD, opacity: 0.5 } })
          ]),
          React.createElement(
            "p",
            {
              key: "q",
              style: {
                fontSize: quoteFontSize,
                fontFamily: bodyFont,
                fontStyle: script === "latin" ? "italic" : "normal",
                color: PAPER.text,
                lineHeight: 1.48,
                margin: 0
              }
            },
            quote
          ),
          fullCitation ? React.createElement(
            "span",
            {
              key: "c",
              style: {
                fontSize: 20,
                fontFamily: "Inter Medium",
                color: BRAND_GOLD,
                marginTop: 36,
                letterSpacing: 1.5
              }
            },
            fullCitation
          ) : null
        ].filter(Boolean)
      ),

      // Footer: Shoonaya Wordmark
      React.createElement(
        "div",
        {
          key: "footer",
          style: { display: "flex", flexDirection: "column", alignItems: "center" }
        },
        [
          React.createElement("div", {
            key: "foot-orn",
            style: {
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 16
            }
          }, [
            React.createElement("div", { key: "fl1", style: { width: 30, height: 1, backgroundColor: BRAND_GOLD, opacity: 0.3 } }),
            React.createElement("div", { key: "fd", style: { width: 5, height: 5, backgroundColor: BRAND_GOLD, transform: "rotate(45deg)", opacity: 0.6 } }),
            React.createElement("div", { key: "fl2", style: { width: 30, height: 1, backgroundColor: BRAND_GOLD, opacity: 0.3 } })
          ]),
          React.createElement(
            "span",
            {
              key: "brand",
              style: {
                fontSize: 20,
                fontFamily: "Inter Medium",
                color: PAPER.text,
                letterSpacing: 6
              }
            },
            "SHOONAYA"
          ),
          React.createElement(
            "span",
            {
              key: "sub",
              style: {
                fontSize: 13,
                fontFamily: "Inter Medium",
                color: PAPER.dim,
                letterSpacing: 2,
                marginTop: 6
              }
            },
            "Sanctuary of Sacred Living"
          )
        ]
      )
    ]
  );

  const res = new ImageResponse(element as React.ReactElement, {
    width: CARD_SIZE.width,
    height: CARD_SIZE.height,
    fonts: availableFonts
  });

  const foreground = Buffer.from(await res.arrayBuffer());
  const backgroundSvg = Buffer.from(getBackgroundSvg(accent));

  const png = await sharp(backgroundSvg)
    .composite([{ input: foreground, blend: "over" }])
    .png()
    .toBuffer();

  return { png };
}
