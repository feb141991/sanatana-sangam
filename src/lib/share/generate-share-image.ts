import { SACRED_RELICS } from '@/lib/relics';

export type NityaCardType =
  | 'streak_milestone'
  | 'week_summary'
  | 'morning_complete'
  | 'sadhana_quote'
  | 'monthly_report'
  | 'shloka_verse';

export interface NityaShareCardData {
  tradition: string;
  accentColor: string;
  symbol: string;
  userName: string;
  milestoneLabel: string;
  streak?: number;
  bestStreak?: number;
  thisWeekActive?: number;
  lastWeekActive?: number;
  dowData?: number[];
  stepsCompletedToday?: number;
  totalSteps?: number;
  todayTithi?: string;
  quote?: string;
  quoteSource?: string;
  completionRate?: number;
  activeDays?: number;
  fullMorningDays?: number;
  consistencyScore?: number;
  peakHourLabel?: string;
  month?: string;
  sanskrit?: string;
  translation?: string;
  source?: string;
}

const CARD_DIMENSIONS: Record<NityaCardType, [number, number]> = {
  streak_milestone: [1080, 1080],
  week_summary:     [1080, 1920],
  morning_complete: [1080, 1080],
  sadhana_quote:    [1080, 1080],
  monthly_report:   [1080, 1350],
  shloka_verse:     [1080, 1080],
};

const PREMIUM = {
  navy: '#0B2344',
  navyDeep: '#061629',
  gold: '#C7952E',
  goldLight: '#E7C872',
  goldSoft: '#F3E1B3',
  parchment: '#FBF6EA',
  parchmentDeep: '#EFE1C7',
  ink: '#0B2344',
  muted: '#6F5B3E',
  panel: '#FFF9EE',
  white: '#FFFFFF',
  shadow: '#6B4A1418',
};

export const TRADITION_SHARE_QUOTES: Record<string, string[]> = {
  hindu: [
    'योगः कर्मसु कौशलम् — Excellence in action is Yoga.',
    'श्रेयान् स्वधर्मो विगुणः — One\'s own dharma, even imperfect, is superior.',
    'मन एव मनुष्याणां कारणं बन्धमोक्षयोः — The mind alone is the cause of bondage and liberation.',
    'सर्वे भवन्तु सुखिनः — May all beings be happy.',
    'तत्त्वमसि — Thou art that.',
    'अहं ब्रह्मास्मि — I am Brahman.',
  ],
  sikh: [
    'ਇਕੁ ਫਿਕਾ ਨ ਗਾਲਾਇ — Speak not a single harsh word.',
    'ਸਭੁ ਕੋ ਮੀਤੁ ਹਮ ਆਪਨ ਕੀਨਾ — I have made all beings my friend.',
    'ਮਨ ਤੂੰ ਜੋਤਿ ਸਰੂਪੁ ਹੈ — O mind, thou art the embodiment of light.',
    'ਨਾਨਕ ਨਾਮ ਚੜ੍ਹਦੀ ਕਲਾ — Nanak, in God\'s name, ever-rising spirit.',
  ],
  buddhist: [
    'All that we are is a result of what we have thought.',
    'Better than a thousand hollow words is one word that brings peace.',
    'Work out your own salvation with diligence.',
    'In the sky there is no distinction of east and west.',
  ],
  jain: [
    'Parasparopagraho jīvānām — All life is bound together by mutual support.',
    'Ahimsa paramo dharma — Non-violence is the highest religion.',
    'Ṇamokāra Mantra — Salutation to all souls who have conquered themselves.',
    'Jīvo and jīvayati — Live, and let live.',
  ],
};

function toBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
}

function loadCanvasImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Unable to load image: ${src}`));
    image.src = src;
  });
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function fillRoundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number, color: string) {
  roundRect(ctx, x, y, width, height, radius);
  ctx.fillStyle = color;
  ctx.fill();
}

function strokeRoundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number, color: string, lineWidth = 2) {
  roundRect(ctx, x, y, width, height, radius);
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines = 10
) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';

  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      lines.push(line);
      line = word;
      if (lines.length >= maxLines - 1) break;
    } else {
      line = testLine;
    }
  }
  if (line && lines.length < maxLines) lines.push(line);

  lines.forEach((lineText, index) => ctx.fillText(lineText, x, y + index * lineHeight));
  return y + lines.length * lineHeight;
}

function wrapAndFitText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  options: { fontBase: string, maxSize: number, minSize: number, maxLines: number, lineHeightRatio: number, weight?: string }
) {
  let size = options.maxSize;
  let lines: string[] = [];
  const weight = options.weight ?? '400';
  const normalisedText = text.replace(/\s+/g, ' ').trim();
  
  while (size >= options.minSize) {
    ctx.font = `${weight} ${size}px ${options.fontBase}`;
    const words = normalisedText.split(/\s+/).filter(Boolean);
    lines = [];
    let line = '';
    for (const word of words) {
      if (ctx.measureText(word).width > maxWidth) {
        const chars = [...word];
        for (const char of chars) {
          const testLine = line ? `${line}${char}` : char;
          if (ctx.measureText(testLine).width > maxWidth && line) {
            lines.push(line);
            line = char;
          } else {
            line = testLine;
          }
        }
        continue;
      }
      const testLine = line ? `${line} ${word}` : word;
      if (ctx.measureText(testLine).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = testLine;
      }
    }
    if (line) lines.push(line);
    
    if (lines.length <= options.maxLines) {
      break;
    }
    size -= 2;
  }
  
  const lineHeight = size * options.lineHeightRatio;
  const visibleLines = lines.slice(0, options.maxLines);
  visibleLines.forEach((lineText, index) => {
    ctx.fillText(lineText, x, y + index * lineHeight);
  });
  return y + visibleLines.length * lineHeight;
}

function getDefaultQuote(data: NityaShareCardData) {
  if (data.quote) return data.quote;
  const quotes = TRADITION_SHARE_QUOTES[data.tradition] ?? TRADITION_SHARE_QUOTES.hindu;
  return quotes[(data.streak ?? 0) % quotes.length];
}

// ── SHARED PREMIUM HELPERS ───────────────────────────────────────────────────

async function drawPremiumParchmentBackground(ctx: CanvasRenderingContext2D, width: number, height: number, tradition: string) {
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, PREMIUM.parchment);
  bgGrad.addColorStop(0.55, '#FFFDF7');
  bgGrad.addColorStop(1, PREMIUM.parchmentDeep);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  const glow = ctx.createRadialGradient(width / 2, height * 0.34, 0, width / 2, height * 0.34, Math.max(width, height) * 0.62);
  glow.addColorStop(0, '#FFFFFFD8');
  glow.addColorStop(0.42, '#F8EAC980');
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);

  const edgeGlow = ctx.createRadialGradient(width, 0, 0, width, 0, width * 0.9);
  edgeGlow.addColorStop(0, '#D6AA4A30');
  edgeGlow.addColorStop(1, 'transparent');
  ctx.fillStyle = edgeGlow;
  ctx.fillRect(0, 0, width, height);

  const bgMap: Record<string, string> = {
    hindu: '/darshan/krishna.webp',
    sikh: '/darshan/guru_nanak.webp',
    buddhist: '/darshan/buddha.webp',
    jain: '/darshan/mahavir.webp',
  };
  const bgSrc = bgMap[tradition];
  if (bgSrc) {
    try {
      const img = await loadCanvasImage(bgSrc);
      ctx.save();
      ctx.globalAlpha = 0.06;
      const scale = Math.max(width / img.width, height / img.height);
      const iw = img.width * scale;
      const ih = img.height * scale;
      ctx.drawImage(img, width / 2 - iw / 2, height / 2 - ih / 2, iw, ih);
      ctx.restore();
    } catch (e) {
      // ignore
    }
  }

  drawCornerOrnaments(ctx, width, height);
}

function drawPremiumPanel(ctx: CanvasRenderingContext2D, bounds: { x: number, y: number, w: number, h: number }) {
  ctx.save();
  ctx.shadowColor = PREMIUM.shadow;
  ctx.shadowBlur = 26;
  ctx.shadowOffsetY = 10;
  fillRoundRect(ctx, bounds.x, bounds.y, bounds.w, bounds.h, 30, '#FFF9EEB8');
  ctx.restore();
  strokeRoundRect(ctx, bounds.x, bounds.y, bounds.w, bounds.h, 30, PREMIUM.gold, 3);
  strokeRoundRect(ctx, bounds.x + 14, bounds.y + 14, bounds.w - 28, bounds.h - 28, 22, '#C7952E66', 1.5);
}

async function drawShoonayaBrandHeader(ctx: CanvasRenderingContext2D, width: number) {
  const x = width / 2;
  ctx.save();
  ctx.shadowColor = '#0B234455';
  ctx.shadowBlur = 24;
  fillRoundRect(ctx, x - 162, 50, 324, 94, 47, PREMIUM.navy);
  ctx.shadowBlur = 0;

  drawInfinityMark(ctx, x, 78, 96);

  ctx.font = '700 30px Georgia, serif';
  ctx.fillStyle = PREMIUM.white;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Shoonaya', x, 119);
  ctx.restore();
}

function drawInfinityMark(ctx: CanvasRenderingContext2D, x: number, y: number, width: number) {
  const height = width * 0.34;
  const teal = '#63B7C6';
  const tealDeep = '#2C7F92';
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.shadowColor = '#63B7C688';
  ctx.shadowBlur = 14;
  ctx.lineWidth = 8;
  ctx.strokeStyle = teal;
  ctx.beginPath();
  ctx.moveTo(x - width / 2, y);
  ctx.bezierCurveTo(x - width * 0.38, y - height, x - width * 0.18, y - height, x, y);
  ctx.bezierCurveTo(x + width * 0.18, y + height, x + width * 0.38, y + height, x + width / 2, y);
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.lineWidth = 4;
  ctx.strokeStyle = tealDeep;
  ctx.beginPath();
  ctx.moveTo(x - width / 2, y);
  ctx.bezierCurveTo(x - width * 0.38, y + height, x - width * 0.18, y + height, x, y);
  ctx.bezierCurveTo(x + width * 0.18, y - height, x + width * 0.38, y - height, x + width / 2, y);
  ctx.stroke();

  ctx.fillStyle = teal;
  ctx.beginPath();
  ctx.arc(x - width / 2 - 13, y, 7, 0, Math.PI * 2);
  ctx.fill();

  const shine = ctx.createLinearGradient(x - width / 2, y - height, x + width / 2, y + height);
  shine.addColorStop(0, 'transparent');
  shine.addColorStop(0.5, '#FFFFFFAA');
  shine.addColorStop(1, 'transparent');
  ctx.strokeStyle = shine;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x - width * 0.18, y - height * 0.58);
  ctx.lineTo(x + width * 0.28, y - height * 0.2);
  ctx.stroke();
  ctx.restore();
}

function drawTraditionBadge(ctx: CanvasRenderingContext2D, width: number, y: number, label: string) {
  ctx.font = '700 22px -apple-system, sans-serif';
  const badgeWidth = ctx.measureText(label).width + 40;
  fillRoundRect(ctx, width / 2 - badgeWidth / 2, y, badgeWidth, 46, 23, PREMIUM.navy);
  strokeRoundRect(ctx, width / 2 - badgeWidth / 2, y, badgeWidth, 46, 23, PREMIUM.goldLight, 2);
  ctx.fillStyle = PREMIUM.goldLight;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, width / 2, y + 23);
}

function drawOrnamentalDivider(ctx: CanvasRenderingContext2D, width: number, y: number) {
  ctx.strokeStyle = '#C7952E70';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(width * 0.24, y);
  ctx.lineTo(width * 0.42, y);
  ctx.moveTo(width * 0.58, y);
  ctx.lineTo(width * 0.76, y);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(width / 2, y, 12, 0, Math.PI * 2);
  ctx.strokeStyle = PREMIUM.gold;
  ctx.stroke();
  ctx.save();
  ctx.translate(width / 2, y);
  ctx.rotate(Math.PI / 4);
  ctx.fillStyle = PREMIUM.gold;
  ctx.fillRect(-5, -5, 10, 10);
  ctx.restore();
}

function drawMetricLine(ctx: CanvasRenderingContext2D, width: number, y: number, text: string) {
  ctx.font = '600 22px -apple-system, sans-serif';
  ctx.fillStyle = PREMIUM.muted;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, width / 2, y);
}

function drawShoonayaFooter(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const footerY = height - 90;
  ctx.font = '500 18px -apple-system, sans-serif';
  ctx.fillStyle = PREMIUM.muted;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Shoonaya · Daily Sādhana', width / 2, footerY - 28);

  const pillWidth = 250;
  fillRoundRect(ctx, width / 2 - pillWidth / 2, footerY, pillWidth, 46, 23, PREMIUM.navy);
  strokeRoundRect(ctx, width / 2 - pillWidth / 2, footerY, pillWidth, 46, 23, PREMIUM.gold, 2);
  ctx.font = '700 22px Georgia, serif';
  ctx.fillStyle = PREMIUM.goldLight;
  ctx.fillText('shoonaya.com', width / 2, footerY + 23);
}

function drawCornerOrnaments(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const corners = [
    { x: 74, y: 74, rot: 0 },
    { x: width - 74, y: 74, rot: Math.PI / 2 },
    { x: width - 74, y: height - 74, rot: Math.PI },
    { x: 74, y: height - 74, rot: -Math.PI / 2 },
  ];
  ctx.save();
  ctx.strokeStyle = '#C7952E30';
  ctx.lineWidth = 2;
  for (const corner of corners) {
    ctx.save();
    ctx.translate(corner.x, corner.y);
    ctx.rotate(corner.rot);
    for (let radius = 22; radius <= 118; radius += 24) {
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI / 2);
      ctx.stroke();
    }
    for (let angle = 0; angle <= Math.PI / 2; angle += Math.PI / 10) {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(angle) * 126, Math.sin(angle) * 126);
      ctx.stroke();
    }
    ctx.restore();
  }
  ctx.restore();
}

function drawLuminousGlyph(ctx: CanvasRenderingContext2D, x: number, y: number, glyph: string, size: number) {
  const glow = ctx.createRadialGradient(x, y, 0, x, y, size * 1.2);
  glow.addColorStop(0, '#E7C87288');
  glow.addColorStop(0.38, '#C7952E38');
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y, size * 1.24, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.shadowColor = '#C7952E88';
  ctx.shadowBlur = 26;
  ctx.font = `${size}px serif`;
  ctx.fillStyle = PREMIUM.gold;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(glyph, x, y);
  ctx.restore();

  ctx.strokeStyle = '#C7952E55';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, size * 0.92, -0.4, Math.PI * 1.35);
  ctx.stroke();

  const shine = ctx.createLinearGradient(x - size, y - size, x + size, y + size);
  shine.addColorStop(0, 'transparent');
  shine.addColorStop(0.5, '#FFFFFF80');
  shine.addColorStop(1, 'transparent');
  ctx.strokeStyle = shine;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x - size * 0.72, y - size * 0.48);
  ctx.lineTo(x + size * 0.48, y - size * 0.88);
  ctx.stroke();
}

function getTraditionLabel(tradition: string) {
  return tradition.charAt(0).toUpperCase() + tradition.slice(1);
}

function getStreakLabel(streak?: number) {
  return streak && streak > 0 ? streak : 1;
}

// ── PHASE 1 & 2 RENDERERS ───────────────────────────────────────────────────

async function renderShlokaVerse(ctx: CanvasRenderingContext2D, data: NityaShareCardData) {
  const W = 1080;
  const H = 1080;

  await drawPremiumParchmentBackground(ctx, W, H, data.tradition);
  drawPremiumPanel(ctx, { x: 40, y: 40, w: W - 80, h: H - 80 });
  await drawShoonayaBrandHeader(ctx, W);

  const titleMap: Record<string, string> = {
    hindu: 'Aaj Ka Shloka',
    sikh: 'Aaj Da Shabad',
    buddhist: 'Aaj Ka Dhamma',
    jain: 'Aaj Ka Sutra',
  };
  const title = titleMap[data.tradition] ?? 'Aaj Ka Verse';

  ctx.font = '700 70px Georgia, serif';
  ctx.fillStyle = PREMIUM.ink;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(title, W / 2, 198);

  drawTraditionBadge(ctx, W, 266, `${getTraditionLabel(data.tradition)} · Day ${getStreakLabel(data.streak)}`);

  const sanskrit = data.sanskrit ?? data.quote ?? '';
  let scriptFont = '"Noto Sans Devanagari", "Siddhanta", serif';
  let verseLineHeightRatio = 1.5;
  if (data.tradition === 'sikh') {
    scriptFont = '"Noto Sans Gurmukhi", serif';
  } else if (data.tradition === 'buddhist') {
    scriptFont = 'Georgia, serif';
    verseLineHeightRatio = 1.4;
  } else if (data.tradition === 'jain') {
    scriptFont = '"Noto Sans Devanagari", "Siddhanta", serif';
  }

  ctx.fillStyle = PREMIUM.ink;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  drawPremiumPanel(ctx, { x: 128, y: 354, w: 824, h: 300 });
  const verseEndY = wrapAndFitText(ctx, sanskrit, W / 2, 438, 760, {
    fontBase: scriptFont,
    weight: '500',
    maxSize: 54,
    minSize: 28,
    maxLines: 4,
    lineHeightRatio: verseLineHeightRatio
  });

  const sourceLineY = verseEndY + 40;
  if (data.source) {
    ctx.font = '600 24px -apple-system, sans-serif';
    ctx.fillStyle = PREMIUM.gold;
    ctx.fillText(`— ${data.source}`, W / 2, sourceLineY);
  }

  const meaningY = sourceLineY + 60;
  drawOrnamentalDivider(ctx, W, meaningY - 24);
  ctx.font = '700 46px Georgia, serif';
  ctx.fillStyle = PREMIUM.ink;
  ctx.fillText('Meaning', W / 2, meaningY);

  const translation = data.translation ?? '';
  ctx.fillStyle = PREMIUM.ink;
  wrapAndFitText(ctx, translation, W / 2, meaningY + 46, 860, {
    fontBase: 'Georgia, serif',
    weight: '400',
    maxSize: 34,
    minSize: 22,
    maxLines: 3,
    lineHeightRatio: 1.45
  });

  drawShoonayaFooter(ctx, W, H);
}

async function renderMorningComplete(ctx: CanvasRenderingContext2D, data: NityaShareCardData) {
  const W = 1080;
  const H = 1080;

  await drawPremiumParchmentBackground(ctx, W, H, data.tradition);
  drawPremiumPanel(ctx, { x: 40, y: 40, w: W - 80, h: H - 80 });
  await drawShoonayaBrandHeader(ctx, W);

  drawTraditionBadge(ctx, W, 180, `${getTraditionLabel(data.tradition)} · Morning Complete`);

  if (data.todayTithi) {
    ctx.font = '600 24px -apple-system, sans-serif';
    ctx.fillStyle = PREMIUM.gold;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${data.todayTithi} — Auspicious completion`, W / 2, 270);
  }

  drawLuminousGlyph(ctx, W / 2, 438, data.symbol || '✓', 132);
  ctx.font = '800 104px -apple-system, sans-serif';
  ctx.fillStyle = PREMIUM.navy;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('✓', W / 2, 438);

  ctx.font = '700 72px Georgia, serif';
  ctx.fillStyle = PREMIUM.ink;
  ctx.fillText('Morning complete', W / 2, 650);

  ctx.font = '600 32px -apple-system, sans-serif';
  ctx.fillStyle = PREMIUM.muted;
  ctx.fillText(`${data.stepsCompletedToday ?? 0} of ${data.totalSteps ?? 7} sacred steps`, W / 2, 720);

  const dateLabel = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
  ctx.font = '600 28px -apple-system, sans-serif';
  ctx.fillStyle = PREMIUM.muted;
  ctx.fillText(dateLabel, W / 2, 770);

  drawOrnamentalDivider(ctx, W, 860);

  const streak = getStreakLabel(data.streak);
  drawMetricLine(ctx, W, H - 150, streak > 1 ? `${streak}-day sacred morning streak` : `Completed today`);
  drawShoonayaFooter(ctx, W, H);
}

async function renderStreakMilestone(ctx: CanvasRenderingContext2D, data: NityaShareCardData) {
  const W = 1080;
  const H = 1080;

  await drawPremiumParchmentBackground(ctx, W, H, data.tradition);
  drawPremiumPanel(ctx, { x: 40, y: 40, w: W - 80, h: H - 80 });
  await drawShoonayaBrandHeader(ctx, W);

  drawTraditionBadge(ctx, W, 180, `${getTraditionLabel(data.tradition)} · ${data.milestoneLabel}`);

  drawLuminousGlyph(ctx, W / 2, 338, data.symbol, 128);

  ctx.font = '700 220px Georgia, serif';
  ctx.fillStyle = PREMIUM.ink;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(data.streak ?? 0), W / 2, 540);

  ctx.font = '600 48px -apple-system, sans-serif';
  ctx.fillStyle = PREMIUM.gold;
  ctx.fillText('days', W / 2, 690);

  drawOrnamentalDivider(ctx, W, 800);

  drawMetricLine(ctx, W, H - 150, `${data.userName}'s Sacred Sadhana`);
  drawShoonayaFooter(ctx, W, H);
}

async function renderSadhanaQuote(ctx: CanvasRenderingContext2D, data: NityaShareCardData) {
  const W = 1080;
  const H = 1080;

  await drawPremiumParchmentBackground(ctx, W, H, data.tradition);
  drawPremiumPanel(ctx, { x: 40, y: 40, w: W - 80, h: H - 80 });
  await drawShoonayaBrandHeader(ctx, W);

  drawTraditionBadge(ctx, W, 170, `${getTraditionLabel(data.tradition)} · ${data.milestoneLabel}`);

  ctx.font = '120px Georgia, serif';
  ctx.fillStyle = PREMIUM.gold;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('“', W / 2, 300);

  ctx.fillStyle = PREMIUM.ink;
  const endY = wrapAndFitText(ctx, getDefaultQuote(data), W / 2, 380, 840, {
    fontBase: 'Georgia, serif',
    weight: '600',
    maxSize: 52,
    minSize: 32,
    maxLines: 6,
    lineHeightRatio: 1.45
  });

  if (data.quoteSource) {
    ctx.font = 'italic 600 28px Georgia, serif';
    ctx.fillStyle = PREMIUM.gold;
    ctx.fillText(data.quoteSource, W / 2, endY + 40);
  }

  drawOrnamentalDivider(ctx, W, endY + 120);

  const streak = getStreakLabel(data.streak);
  drawMetricLine(ctx, W, H - 150, streak > 1 ? `${streak}-day sacred reading streak` : `Completed today`);
  drawShoonayaFooter(ctx, W, H);
}

async function renderMonthlyReport(ctx: CanvasRenderingContext2D, data: NityaShareCardData) {
  const W = 1080;
  const H = 1350;

  await drawPremiumParchmentBackground(ctx, W, H, data.tradition);
  drawPremiumPanel(ctx, { x: 40, y: 40, w: W - 80, h: H - 80 });
  await drawShoonayaBrandHeader(ctx, W);

  const month = data.month ?? new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  drawTraditionBadge(ctx, W, 170, `${month} · ${data.milestoneLabel}`);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = PREMIUM.ink;
  wrapAndFitText(ctx, `${data.userName}'s Journey`, W / 2, 280, 860, {
    fontBase: 'Georgia, serif',
    weight: '700',
    maxSize: 76,
    minSize: 46,
    maxLines: 2,
    lineHeightRatio: 1.12
  });

  drawOrnamentalDivider(ctx, W, 380);

  const boxes = [
    { value: `${data.consistencyScore ?? 0}%`, label: 'Consistency' },
    { value: String(data.activeDays ?? 0), label: 'Active days' },
    { value: String(data.fullMorningDays ?? 0), label: 'Complete' },
  ];
  const boxY = 460;
  const boxW = 286;
  const boxH = 190;
  const boxGap = 26;
  const boxStart = (W - boxW * 3 - boxGap * 2) / 2;
  boxes.forEach((box, index) => {
    const x = boxStart + index * (boxW + boxGap);
    fillRoundRect(ctx, x, boxY, boxW, boxH, 30, '#0B234408');
    strokeRoundRect(ctx, x, boxY, boxW, boxH, 30, PREMIUM.gold, 2);
    ctx.font = '700 72px Georgia, serif';
    ctx.fillStyle = PREMIUM.ink;
    ctx.fillText(box.value, x + boxW / 2, boxY + 80);
    ctx.font = '600 22px -apple-system, sans-serif';
    ctx.fillStyle = PREMIUM.gold;
    ctx.fillText(box.label, x + boxW / 2, boxY + 140);
  });

  const dow = data.dowData?.slice(0, 7) ?? Array(7).fill(0);
  const max = Math.max(...dow, 1);
  const miniStart = 252;
  const miniY = 740;
  dow.forEach((value, index) => {
    const x = miniStart + index * 96;
    const h = Math.max(4, (value / max) * 40);
    fillRoundRect(ctx, x, miniY + 44 - h, 52, h, 12, PREMIUM.gold);
    ctx.font = '600 18px -apple-system, sans-serif';
    ctx.fillStyle = PREMIUM.muted;
    ctx.fillText(['M', 'T', 'W', 'T', 'F', 'S', 'S'][index], x + 26, miniY + 82);
  });

  const score = data.consistencyScore ?? 0;
  const insight = score >= 80
    ? 'Extraordinary. The practice is you.'
    : score >= 60
      ? 'Solid month. The gaps teach as much as the days.'
      : score >= 40
        ? 'Growing. Sadhana is not a sprint.'
        : 'The seed is planted. Keep returning.';
  ctx.font = '600 34px Georgia, serif';
  ctx.fillStyle = PREMIUM.ink;
  wrapText(ctx, insight, W / 2, 920, 780, 50, 3);

  drawMetricLine(ctx, W, H - 150, `Practice peaks at ${data.peakHourLabel ?? 'your chosen hour'}`);
  drawShoonayaFooter(ctx, W, H);
}

async function renderWeekSummary(ctx: CanvasRenderingContext2D, data: NityaShareCardData) {
  const W = 1080;
  const H = 1920;

  await drawPremiumParchmentBackground(ctx, W, H, data.tradition);
  drawPremiumPanel(ctx, { x: 40, y: 40, w: W - 80, h: H - 80 });
  await drawShoonayaBrandHeader(ctx, W);

  drawTraditionBadge(ctx, W, 170, `${getTraditionLabel(data.tradition)} · ${data.milestoneLabel}`);

  drawLuminousGlyph(ctx, W / 2, 340, data.symbol, 112);

  ctx.font = '700 72px Georgia, serif';
  ctx.fillStyle = PREMIUM.ink;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('This Week\'s Practice', W / 2, 480);

  const dow = data.dowData?.slice(0, 7) ?? Array(7).fill(0);
  const labels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const chartTop = 680;
  const chartHeight = 640;
  const barWidth = 78;
  const gap = 52;
  const startX = (W - (barWidth * 7 + gap * 6)) / 2;
  const todayIndex = (new Date().getDay() + 6) % 7;

  for (let i = 0; i < 7; i++) {
    const x = startX + i * (barWidth + gap);
    ctx.font = '600 32px -apple-system, sans-serif';
    ctx.fillStyle = PREMIUM.muted;
    ctx.fillText(labels[i], x + barWidth / 2, chartTop - 64);
    const value = Math.max(0, Math.min(7, dow[i] ?? 0));
    const h = (value / 7) * chartHeight;
    fillRoundRect(ctx, x, chartTop + chartHeight - h, barWidth, Math.max(10, h), 38, value > 0 ? PREMIUM.navy : '#0B234410');
    if (i === todayIndex) {
      ctx.beginPath();
      ctx.arc(x + barWidth / 2, chartTop + chartHeight - h - 34, 10, 0, Math.PI * 2);
      ctx.fillStyle = PREMIUM.gold;
      ctx.fill();
    }
  }

  const delta = (data.thisWeekActive ?? 0) - (data.lastWeekActive ?? 0);
  ctx.font = '700 86px Georgia, serif';
  ctx.fillStyle = PREMIUM.ink;
  ctx.fillText(`${data.thisWeekActive ?? 0}/7 days active`, W / 2, 1480);

  ctx.font = '600 38px -apple-system, sans-serif';
  ctx.fillStyle = delta > 0 ? '#15803D' : delta < 0 ? '#B91C1C' : PREMIUM.gold;
  const deltaLabel = delta > 0
    ? `↑ ${delta} more than last week`
    : delta < 0
      ? `↓ ${Math.abs(delta)} fewer than last week`
      : 'Same rhythm as last week';
  ctx.fillText(deltaLabel, W / 2, 1580);

  drawMetricLine(ctx, W, H - 150, `${data.userName}'s Sacred Journey`);
  drawShoonayaFooter(ctx, W, H);
}

export async function generateNityaShareCard(
  type: NityaCardType,
  data: NityaShareCardData
): Promise<Blob | null> {
  if (typeof document === 'undefined') return null;

  try {
    const [width, height] = CARD_DIMENSIONS[type];
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    switch (type) {
      case 'streak_milestone':
        await renderStreakMilestone(ctx, data);
        break;
      case 'week_summary':
        await renderWeekSummary(ctx, data);
        break;
      case 'morning_complete':
        await renderMorningComplete(ctx, data);
        break;
      case 'sadhana_quote':
        await renderSadhanaQuote(ctx, data);
        break;
      case 'monthly_report':
        await renderMonthlyReport(ctx, data);
        break;
      case 'shloka_verse':
        await renderShlokaVerse(ctx, data);
        break;
    }

    return toBlob(canvas);
  } catch (error) {
    console.error('Error generating Nitya share card:', error);
    return null;
  }
}

async function drawShoonayaDailyFooter(
  ctx: CanvasRenderingContext2D,
  y: number,
  accentColor: string,
) {
  const logoWidth = 152;
  const logoHeight = 30;
  const separator = '·';
  const label = 'Daily Sādhana';
  const separatorWidth = 18;

  ctx.font = '300 30px -apple-system, sans-serif';
  const labelWidth = ctx.measureText(label).width;
  const totalWidth = logoWidth + separatorWidth + labelWidth;
  const startX = 540 - totalWidth / 2;

  try {
    const logo = await loadCanvasImage('/icons/icon-192x192.png');
    ctx.save();
    ctx.globalAlpha = 0.92;
    ctx.drawImage(logo, startX, y - 16, 32, 32);
    ctx.restore();
    ctx.font = '600 28px -apple-system, sans-serif';
    ctx.fillStyle = `${accentColor}dd`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('Shoonaya', startX + 40, y);
  } catch {
    ctx.font = '300 30px -apple-system, sans-serif';
    ctx.fillStyle = `${accentColor}aa`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('Shoonaya', startX, y);
  }

  ctx.font = '300 30px -apple-system, sans-serif';
  ctx.fillStyle = `${accentColor}aa`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(separator, startX + logoWidth + 7, y);
  ctx.fillText(label, startX + logoWidth + separatorWidth, y);
}

        
// ════════════════════════════════════════════════════════════════════════════
// SHOONAYA PREMIUM SHARE CARDS — reusable 9:16 streak / score generator
//
// One renderer shared by every surface (Japa, Nitya, Profile, Scoreboard,
// preview). 1080 × 1920, no remote images and no temple photos — only canvas
// gradients + vector ornaments + soft grain. The brand wordmark renders as
// Sh + gold ∞ + naya, with the infinity baseline-aligned in place of the
// double "o". Keep visual logic here; surfaces only supply data.
// ════════════════════════════════════════════════════════════════════════════

export type ShoonayaShareCardVariant =
  | 'sanatan'
  | 'sikh'
  | 'jain'
  | 'buddhist'
  | 'universal';

export interface ShoonayaShareCardData {
  /** Raw tradition slug (e.g. 'hindu', 'sikh'); resolved to a variant internally. */
  tradition: string;
  streakCount?: number;
  score?: number;
  title?: string;
  subtitle?: string;
  caption?: string;
  userName?: string;
  date?: string;
  footer?: string;
}

interface ShoonayaVariantTheme {
  label: string;        // tradition label shown on the card
  defaultTitle: string; // e.g. 'Days of Sadhana'
  bgTop: string;
  bgBottom: string;
  ink: string;          // primary text
  inkSoft: string;      // secondary text
  gold: string;
  goldLight: string;
  numberColor: string;
  onDark: boolean;      // dark (navy night) variant → light text + dark vignette
}

const SHOONAYA_VARIANT_THEME: Record<ShoonayaShareCardVariant, ShoonayaVariantTheme> = {
  sanatan: {
    label: 'Sanatan',
    defaultTitle: 'Days of Sadhana',
    bgTop: '#FFF6E6',
    bgBottom: '#F1DEBB',
    ink: '#3A2A16',
    inkSoft: '#7A6038',
    gold: PREMIUM.gold,
    goldLight: PREMIUM.goldLight,
    numberColor: '#B5832A',
    onDark: false,
  },
  sikh: {
    label: 'Sikh',
    defaultTitle: 'Days of Simran',
    bgTop: '#FBF7EE',
    bgBottom: '#E5DECB',
    ink: PREMIUM.navy,
    inkSoft: '#3D5170',
    gold: PREMIUM.gold,
    goldLight: PREMIUM.goldLight,
    numberColor: PREMIUM.navy,
    onDark: false,
  },
  jain: {
    label: 'Jain',
    defaultTitle: 'Days of Ahimsa',
    bgTop: '#F7F8F0',
    bgBottom: '#DFE6D2',
    ink: '#2E3A24',
    inkSoft: '#5E6B4E',
    gold: PREMIUM.gold,
    goldLight: PREMIUM.goldLight,
    numberColor: '#4A5D38',
    onDark: false,
  },
  buddhist: {
    label: 'Buddhist',
    defaultTitle: 'Days of Practice',
    bgTop: '#0E1F3C',
    bgBottom: '#05101F',
    ink: '#F3E8CC',
    inkSoft: '#AEBBD0',
    gold: PREMIUM.goldLight,
    goldLight: '#F3E1B3',
    numberColor: '#F0DCA0',
    onDark: true,
  },
  universal: {
    label: 'Universal',
    defaultTitle: 'Days of Practice',
    bgTop: '#FBF6EA',
    bgBottom: '#E7DABE',
    ink: '#26262F',
    inkSoft: '#585866',
    gold: PREMIUM.gold,
    goldLight: PREMIUM.goldLight,
    numberColor: '#1E2A44',
    onDark: false,
  },
};

/** Map a raw tradition slug to a Shoonaya card variant. */
export function resolveShoonayaVariant(tradition: string | null | undefined): ShoonayaShareCardVariant {
  switch ((tradition ?? '').toLowerCase()) {
    case 'hindu':
    case 'sanatan':
    case 'sanatana':
      return 'sanatan';
    case 'sikh':
      return 'sikh';
    case 'jain':
      return 'jain';
    case 'buddhist':
    case 'buddha':
      return 'buddhist';
    default:
      return 'universal';
  }
}

/** Default story title for a variant (e.g. used by the preview grid). */
export function shoonayaVariantDefaultTitle(variant: ShoonayaShareCardVariant): string {
  return SHOONAYA_VARIANT_THEME[variant].defaultTitle;
}

export const SHOONAYA_SHARE_VARIANTS: ShoonayaShareCardVariant[] =
  ['sanatan', 'sikh', 'jain', 'buddhist', 'universal'];

// ── Gold infinity glyph (lemniscate) — used inside the wordmark ──────────────
function drawGoldInfinity(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  width: number,
  color: string,
  glow: boolean,
) {
  const h = width * 0.46;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (glow) {
    ctx.shadowColor = `${color}AA`;
    ctx.shadowBlur = width * 0.2;
  }
  ctx.lineWidth = Math.max(4, width * 0.14);
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  // left loop
  ctx.bezierCurveTo(cx - width * 0.5, cy - h, cx - width * 0.5, cy + h, cx, cy);
  // right loop
  ctx.bezierCurveTo(cx + width * 0.5, cy - h, cx + width * 0.5, cy + h, cx, cy);
  ctx.stroke();
  ctx.restore();
}

// ── Shoonaya wordmark: Sh + gold ∞ + naya, infinity baseline-aligned ─────────
function drawShoonayaWordmark(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  baselineY: number,
  fontSize: number,
  theme: ShoonayaVariantTheme,
) {
  ctx.save();
  ctx.font = `700 ${fontSize}px Georgia, "Times New Roman", serif`;
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';

  const left = 'Sh';
  const right = 'naya';
  const infWidth = fontSize * 0.94;
  const gap = fontSize * 0.05;
  const wLeft = ctx.measureText(left).width;
  const wRight = ctx.measureText(right).width;
  const total = wLeft + gap + infWidth + gap + wRight;

  let x = centerX - total / 2;
  ctx.fillStyle = theme.ink;
  ctx.fillText(left, x, baselineY);
  x += wLeft + gap;

  // Infinity sits on the lowercase x-height midline so it reads as the "oo".
  const infCy = baselineY - fontSize * 0.27;
  drawGoldInfinity(ctx, x + infWidth / 2, infCy, infWidth, theme.gold, true);
  x += infWidth + gap;

  ctx.fillStyle = theme.ink;
  ctx.fillText(right, x, baselineY);
  ctx.restore();
}

// ── Variant ornaments (vector only, low alpha) ───────────────────────────────
function drawSanatanMandala(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, gold: string) {
  ctx.save();
  ctx.strokeStyle = `${gold}33`;
  ctx.lineWidth = 2;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.arc(cx, cy, r * (0.5 + i * 0.18), 0, Math.PI * 2);
    ctx.stroke();
  }
  const petals = 16;
  for (let i = 0; i < petals; i++) {
    const a = (i / petals) * Math.PI * 2;
    ctx.save();
    ctx.translate(cx + Math.cos(a) * r * 0.78, cy + Math.sin(a) * r * 0.78);
    ctx.rotate(a);
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.16, r * 0.06, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}

function drawFlowingLines(ctx: CanvasRenderingContext2D, W: number, H: number, color: string) {
  ctx.save();
  ctx.strokeStyle = `${color}26`;
  ctx.lineWidth = 3;
  for (let row = 0; row < 5; row++) {
    const baseY = H * 0.62 + row * 46;
    ctx.beginPath();
    for (let x = -40; x <= W + 40; x += 12) {
      const y = baseY + Math.sin((x / W) * Math.PI * 3 + row) * 22;
      if (x === -40) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.restore();
}

function drawLotusRipple(ctx: CanvasRenderingContext2D, W: number, H: number, gold: string, sage: string) {
  ctx.save();
  const cx = W / 2;
  const cy = H * 0.82;
  ctx.strokeStyle = `${sage}40`;
  ctx.lineWidth = 2.5;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.ellipse(cx, cy, 180 + i * 110, 40 + i * 22, 0, Math.PI, Math.PI * 2);
    ctx.stroke();
  }
  ctx.strokeStyle = `${gold}3A`;
  ctx.lineWidth = 3;
  const petals = 5;
  for (let i = 0; i < petals; i++) {
    const a = Math.PI + (i / (petals - 1)) * Math.PI;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.quadraticCurveTo(cx + Math.cos(a) * 70, cy + Math.sin(a) * 130, cx + Math.cos(a) * 16, cy - 150);
    ctx.stroke();
  }
  ctx.restore();
}

function drawMountainNightSky(ctx: CanvasRenderingContext2D, W: number, H: number, gold: string) {
  ctx.save();
  // stars
  ctx.fillStyle = `${gold}66`;
  for (let i = 0; i < 70; i++) {
    const x = (Math.sin(i * 12.9898) * 43758.5453 % 1 + 1) % 1 * W;
    const y = (Math.sin(i * 78.233) * 12543.123 % 1 + 1) % 1 * H * 0.55;
    const s = ((Math.sin(i * 3.13) + 1) / 2) * 2.4 + 0.6;
    ctx.beginPath();
    ctx.arc(x, y, s, 0, Math.PI * 2);
    ctx.fill();
  }
  // vertical gold light path
  const path = ctx.createLinearGradient(W / 2, H * 0.2, W / 2, H);
  path.addColorStop(0, `${gold}00`);
  path.addColorStop(0.5, `${gold}3A`);
  path.addColorStop(1, `${gold}00`);
  ctx.fillStyle = path;
  ctx.fillRect(W / 2 - 28, H * 0.2, 56, H * 0.8);
  // mountain silhouette
  ctx.fillStyle = '#03080F';
  ctx.beginPath();
  ctx.moveTo(0, H);
  ctx.lineTo(0, H * 0.78);
  ctx.lineTo(W * 0.22, H * 0.66);
  ctx.lineTo(W * 0.4, H * 0.74);
  ctx.lineTo(W * 0.58, H * 0.6);
  ctx.lineTo(W * 0.78, H * 0.72);
  ctx.lineTo(W, H * 0.64);
  ctx.lineTo(W, H);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawInfinityLightPath(ctx: CanvasRenderingContext2D, W: number, H: number, gold: string, navy: string) {
  ctx.save();
  ctx.globalAlpha = 0.5;
  drawGoldInfinity(ctx, W / 2, H * 0.78, W * 0.74, `${gold}33`, false);
  ctx.globalAlpha = 1;
  const path = ctx.createLinearGradient(0, H * 0.5, W, H * 0.5);
  path.addColorStop(0, `${navy}00`);
  path.addColorStop(0.5, `${navy}1E`);
  path.addColorStop(1, `${navy}00`);
  ctx.strokeStyle = path;
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let x = 0; x <= W; x += 12) {
    const y = H * 0.46 + Math.sin((x / W) * Math.PI * 2) * 26;
    if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.restore();
}

function drawSoftGrain(ctx: CanvasRenderingContext2D, W: number, H: number, onDark: boolean) {
  ctx.save();
  ctx.globalAlpha = onDark ? 0.05 : 0.04;
  ctx.fillStyle = onDark ? '#FFFFFF' : '#5A3F18';
  for (let i = 0; i < 900; i++) {
    const x = (Math.sin(i * 91.7) * 6271.27 % 1 + 1) % 1 * W;
    const y = (Math.cos(i * 47.3) * 8923.91 % 1 + 1) % 1 * H;
    ctx.fillRect(x, y, 1.4, 1.4);
  }
  ctx.restore();
}

function drawShoonayaCardBackground(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  variant: ShoonayaShareCardVariant,
  theme: ShoonayaVariantTheme,
) {
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, theme.bgTop);
  bg.addColorStop(1, theme.bgBottom);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const glow = ctx.createRadialGradient(W / 2, H * 0.32, 0, W / 2, H * 0.32, H * 0.6);
  glow.addColorStop(0, theme.onDark ? 'rgba(231,200,114,0.16)' : 'rgba(255,255,255,0.55)');
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // variant motif
  switch (variant) {
    case 'sanatan':
      drawSanatanMandala(ctx, W / 2, H * 0.46, 360, theme.gold);
      break;
    case 'sikh':
      drawFlowingLines(ctx, W, H, theme.gold);
      break;
    case 'jain':
      drawLotusRipple(ctx, W, H, theme.gold, '#9CAE86');
      break;
    case 'buddhist':
      drawMountainNightSky(ctx, W, H, theme.gold);
      break;
    case 'universal':
      drawInfinityLightPath(ctx, W, H, theme.gold, PREMIUM.navy);
      break;
  }

  // vignette for depth
  const vig = ctx.createRadialGradient(W / 2, H / 2, H * 0.32, W / 2, H / 2, H * 0.78);
  vig.addColorStop(0, 'transparent');
  vig.addColorStop(1, theme.onDark ? 'rgba(0,0,0,0.38)' : 'rgba(120,90,40,0.10)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);

  drawSoftGrain(ctx, W, H, theme.onDark);

  // subtle ornamental border
  strokeRoundRect(ctx, 46, 46, W - 92, H - 92, 44, `${theme.gold}55`, 2.5);
  strokeRoundRect(ctx, 62, 62, W - 124, H - 124, 34, `${theme.gold}22`, 1.5);
}

function drawShoonayaTraditionBadge(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  y: number,
  label: string,
  theme: ShoonayaVariantTheme,
) {
  ctx.font = '700 26px -apple-system, sans-serif';
  const text = label.toUpperCase();
  const badgeW = ctx.measureText(text).width + 56;
  const badgeBg = theme.onDark ? 'rgba(231,200,114,0.12)' : 'rgba(11,35,68,0.06)';
  fillRoundRect(ctx, centerX - badgeW / 2, y, badgeW, 54, 27, badgeBg);
  strokeRoundRect(ctx, centerX - badgeW / 2, y, badgeW, 54, 27, `${theme.gold}99`, 2);
  ctx.fillStyle = theme.gold;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, centerX, y + 28);
}

function renderShoonayaCard(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  data: ShoonayaShareCardData,
) {
  const variant = resolveShoonayaVariant(data.tradition);
  const theme = SHOONAYA_VARIANT_THEME[variant];
  const centerX = W / 2;

  drawShoonayaCardBackground(ctx, W, H, variant, theme);

  // Wordmark
  drawShoonayaWordmark(ctx, centerX, 250, 78, theme);

  // Tradition label
  drawShoonayaTraditionBadge(ctx, centerX, 320, theme.label, theme);

  // Optional subtitle under the badge
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (data.subtitle) {
    ctx.font = '500 30px -apple-system, sans-serif';
    ctx.fillStyle = theme.inkSoft;
    wrapAndFitText(ctx, data.subtitle, centerX, 430, W - 260, {
      fontBase: '-apple-system, sans-serif',
      weight: '500',
      maxSize: 30,
      minSize: 22,
      maxLines: 2,
      lineHeightRatio: 1.3,
    });
  }

  // Headline number (streak preferred, else score)
  const headlineNumber = data.streakCount ?? data.score ?? 0;
  ctx.save();
  ctx.shadowColor = `${theme.gold}44`;
  ctx.shadowBlur = 40;
  ctx.font = '700 360px Georgia, serif';
  ctx.fillStyle = theme.numberColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(headlineNumber), centerX, 860);
  ctx.restore();

  // Title (default per variant)
  ctx.font = '600 56px Georgia, serif';
  ctx.fillStyle = theme.ink;
  ctx.fillText(data.title ?? theme.defaultTitle, centerX, 1130);

  // Caption (short, wrapped)
  if (data.caption) {
    ctx.fillStyle = theme.inkSoft;
    wrapAndFitText(ctx, data.caption, centerX, 1250, W - 260, {
      fontBase: 'Georgia, serif',
      weight: '400',
      maxSize: 36,
      minSize: 24,
      maxLines: 3,
      lineHeightRatio: 1.4,
    });
  }

  // User name + date
  const identityBits = [data.userName?.trim(), data.date?.trim()].filter(Boolean);
  if (identityBits.length) {
    ctx.font = '600 30px -apple-system, sans-serif';
    ctx.fillStyle = theme.gold;
    ctx.fillText(identityBits.join('  ·  '), centerX, 1560);
  }

  // Divider
  ctx.strokeStyle = `${theme.gold}66`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(centerX - 90, 1660);
  ctx.lineTo(centerX + 90, 1660);
  ctx.stroke();

  // Footer
  ctx.font = '600 30px -apple-system, sans-serif';
  ctx.fillStyle = theme.inkSoft;
  ctx.fillText(data.footer ?? 'Shared from Shoonaya', centerX, 1740);
  ctx.font = 'italic 600 32px Georgia, serif';
  ctx.fillStyle = theme.gold;
  ctx.fillText('Find your infinity.', centerX, 1800);
}

/**
 * Generate a premium Shoonaya share card (1080 × 1920 PNG blob).
 * Pure canvas — no remote images. Returns null on the server or on failure.
 */
export async function generateShoonayaShareCard(
  data: ShoonayaShareCardData,
): Promise<Blob | null> {
  if (typeof document === 'undefined') return null;
  try {
    const W = 1080;
    const H = 1920;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    renderShoonayaCard(ctx, W, H, data);
    return toBlob(canvas);
  } catch (error) {
    console.error('Error generating Shoonaya share card:', error);
    return null;
  }
}
