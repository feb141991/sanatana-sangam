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
  
  while (size >= options.minSize) {
    ctx.font = `${weight} ${size}px ${options.fontBase}`;
    const words = text.split(/\s+/).filter(Boolean);
    lines = [];
    let line = '';
    for (const word of words) {
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
  lines.slice(0, options.maxLines).forEach((lineText, index) => {
    ctx.fillText(lineText, x, y + index * lineHeight);
  });
  return y + Math.min(lines.length, options.maxLines) * lineHeight;
}

function getDefaultQuote(data: NityaShareCardData) {
  if (data.quote) return data.quote;
  const quotes = TRADITION_SHARE_QUOTES[data.tradition] ?? TRADITION_SHARE_QUOTES.hindu;
  return quotes[(data.streak ?? 0) % quotes.length];
}

// ── SHARED PREMIUM HELPERS ───────────────────────────────────────────────────

async function drawPremiumParchmentBackground(ctx: CanvasRenderingContext2D, width: number, height: number, tradition: string) {
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, '#FDFBF7');
  bgGrad.addColorStop(1, '#F4ECE1');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  const glow = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, Math.max(width, height) * 0.6);
  glow.addColorStop(0, '#ffffffb3');
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
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
}

function drawPremiumPanel(ctx: CanvasRenderingContext2D, bounds: { x: number, y: number, w: number, h: number }) {
  strokeRoundRect(ctx, bounds.x, bounds.y, bounds.w, bounds.h, 24, '#D4AF37', 2);
  strokeRoundRect(ctx, bounds.x + 12, bounds.y + 12, bounds.w - 24, bounds.h - 24, 16, '#D4AF3766', 1);
}

async function drawShoonayaBrandHeader(ctx: CanvasRenderingContext2D, width: number) {
  const logoW = 178;
  const logoH = 28;
  try {
    const logo = await loadCanvasImage('/assets/images/logos/river-light/river-light-horizontal.png');
    ctx.save();
    fillRoundRect(ctx, width / 2 - logoW / 2 - 24, 70 - 12, logoW + 48, logoH + 24, (logoH + 24) / 2, '#0F172A');
    ctx.drawImage(logo, 805, 318, 1020, 145, width / 2 - logoW / 2, 70, logoW, logoH);
    ctx.restore();
  } catch {
    ctx.font = '600 24px -apple-system, sans-serif';
    ctx.fillStyle = '#1A1A1A';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Shoonaya', width / 2, 84);
  }
}

function drawTraditionBadge(ctx: CanvasRenderingContext2D, width: number, y: number, label: string) {
  ctx.font = '600 20px -apple-system, sans-serif';
  const badgeWidth = ctx.measureText(label).width + 40;
  fillRoundRect(ctx, width / 2 - badgeWidth / 2, y, badgeWidth, 40, 20, '#0F172A');
  strokeRoundRect(ctx, width / 2 - badgeWidth / 2, y, badgeWidth, 40, 20, '#D4AF37', 2);
  ctx.fillStyle = '#D4AF37';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, width / 2, y + 20);
}

function drawOrnamentalDivider(ctx: CanvasRenderingContext2D, width: number, y: number) {
  ctx.strokeStyle = '#D4AF3740';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 10]);
  ctx.beginPath();
  ctx.moveTo(width * 0.22, y);
  ctx.lineTo(width * 0.78, y);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.save();
  ctx.translate(width / 2, y);
  ctx.rotate(Math.PI / 4);
  ctx.fillStyle = '#D4AF37';
  ctx.fillRect(-6, -6, 12, 12);
  ctx.restore();
}

function drawMetricLine(ctx: CanvasRenderingContext2D, width: number, y: number, text: string) {
  ctx.font = '600 22px -apple-system, sans-serif';
  ctx.fillStyle = '#475569';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, width / 2, y);
}

function drawShoonayaFooter(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const footerY = height - 90;
  ctx.font = '400 16px -apple-system, sans-serif';
  ctx.fillStyle = '#94A3B8';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Read · Reflect · Share', width / 2, footerY - 26);

  const pillWidth = 180;
  fillRoundRect(ctx, width / 2 - pillWidth / 2, footerY, pillWidth, 40, 20, '#0F172A');
  ctx.font = '600 18px -apple-system, sans-serif';
  ctx.fillStyle = '#D4AF37';
  ctx.fillText('shoonaya.com', width / 2, footerY + 20);
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

  ctx.font = '700 42px Georgia, serif';
  ctx.fillStyle = '#0F172A';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(title, W / 2, 170);

  drawTraditionBadge(ctx, W, 210, `${getTraditionLabel(data.tradition)} · Day ${getStreakLabel(data.streak)}`);

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

  ctx.fillStyle = '#0F172A';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const verseEndY = wrapAndFitText(ctx, sanskrit, W / 2, 340, 860, {
    fontBase: scriptFont,
    weight: '500',
    maxSize: 48,
    minSize: 32,
    maxLines: 6,
    lineHeightRatio: verseLineHeightRatio
  });

  const sourceLineY = verseEndY + 40;
  if (data.source) {
    ctx.font = '600 24px -apple-system, sans-serif';
    ctx.fillStyle = '#B45309';
    ctx.fillText(`— ${data.source}`, W / 2, sourceLineY);
  }

  const meaningY = sourceLineY + 60;
  ctx.font = '700 22px -apple-system, sans-serif';
  ctx.fillStyle = '#475569';
  ctx.fillText('MEANING', W / 2, meaningY);

  const translation = data.translation ?? '';
  ctx.fillStyle = '#1E293B';
  wrapAndFitText(ctx, translation, W / 2, meaningY + 46, 860, {
    fontBase: 'Georgia, serif',
    weight: '400',
    maxSize: 36,
    minSize: 24,
    maxLines: 4,
    lineHeightRatio: 1.45
  });

  const streak = getStreakLabel(data.streak);
  drawMetricLine(ctx, W, H - 150, streak > 1 ? `🔥 ${streak}-day sacred reading streak` : `Completed today`);
  drawShoonayaFooter(ctx, W, H);
}

async function renderMorningComplete(ctx: CanvasRenderingContext2D, data: NityaShareCardData) {
  const W = 1080;
  const H = 1080;

  await drawPremiumParchmentBackground(ctx, W, H, data.tradition);
  drawPremiumPanel(ctx, { x: 40, y: 40, w: W - 80, h: H - 80 });
  await drawShoonayaBrandHeader(ctx, W);

  drawTraditionBadge(ctx, W, 170, `${getTraditionLabel(data.tradition)} · Morning Complete`);

  if (data.todayTithi) {
    ctx.font = '600 24px -apple-system, sans-serif';
    ctx.fillStyle = '#B45309';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${data.todayTithi} — Auspicious completion`, W / 2, 250);
  }

  // Large Checkmark
  ctx.beginPath();
  ctx.arc(W / 2, 450, 120, 0, Math.PI * 2);
  ctx.fillStyle = '#D4AF3720';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(W / 2, 450, 100, 0, Math.PI * 2);
  ctx.fillStyle = '#D4AF37';
  ctx.fill();
  ctx.font = '700 112px -apple-system, sans-serif';
  ctx.fillStyle = '#0F172A';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('✓', W / 2, 443);

  ctx.font = '700 72px Georgia, serif';
  ctx.fillStyle = '#0F172A';
  ctx.fillText('Morning complete', W / 2, 650);

  ctx.font = '600 32px -apple-system, sans-serif';
  ctx.fillStyle = '#475569';
  ctx.fillText(`${data.stepsCompletedToday ?? 0} of ${data.totalSteps ?? 7} sacred steps`, W / 2, 720);

  const dateLabel = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
  ctx.font = '600 28px -apple-system, sans-serif';
  ctx.fillStyle = '#94A3B8';
  ctx.fillText(dateLabel, W / 2, 770);

  drawOrnamentalDivider(ctx, W, 860);

  const streak = getStreakLabel(data.streak);
  drawMetricLine(ctx, W, H - 150, streak > 1 ? `🔥 ${streak}-day sacred morning streak` : `Completed today`);
  drawShoonayaFooter(ctx, W, H);
}

async function renderStreakMilestone(ctx: CanvasRenderingContext2D, data: NityaShareCardData) {
  const W = 1080;
  const H = 1080;

  await drawPremiumParchmentBackground(ctx, W, H, data.tradition);
  drawPremiumPanel(ctx, { x: 40, y: 40, w: W - 80, h: H - 80 });
  await drawShoonayaBrandHeader(ctx, W);

  drawTraditionBadge(ctx, W, 170, `${getTraditionLabel(data.tradition)} · ${data.milestoneLabel}`);

  ctx.font = '120px serif';
  ctx.fillStyle = '#D4AF37';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(data.symbol, W / 2, 320);

  ctx.font = '700 220px Georgia, serif';
  ctx.fillStyle = '#0F172A';
  ctx.fillText(String(data.streak ?? 0), W / 2, 540);

  ctx.font = '600 48px -apple-system, sans-serif';
  ctx.fillStyle = '#B45309';
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
  ctx.fillStyle = '#D4AF37';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('“', W / 2, 300);

  ctx.fillStyle = '#0F172A';
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
    ctx.fillStyle = '#B45309';
    ctx.fillText(data.quoteSource, W / 2, endY + 40);
  }

  drawOrnamentalDivider(ctx, W, endY + 120);

  const streak = getStreakLabel(data.streak);
  drawMetricLine(ctx, W, H - 150, streak > 1 ? `🔥 ${streak}-day sacred reading streak` : `Completed today`);
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

  ctx.font = '700 80px Georgia, serif';
  ctx.fillStyle = '#0F172A';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${data.userName}'s Journey`, W / 2, 280);

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
    fillRoundRect(ctx, x, boxY, boxW, boxH, 30, '#0F172A08');
    strokeRoundRect(ctx, x, boxY, boxW, boxH, 30, '#D4AF37', 2);
    ctx.font = '700 72px Georgia, serif';
    ctx.fillStyle = '#0F172A';
    ctx.fillText(box.value, x + boxW / 2, boxY + 80);
    ctx.font = '600 22px -apple-system, sans-serif';
    ctx.fillStyle = '#B45309';
    ctx.fillText(box.label, x + boxW / 2, boxY + 140);
  });

  const dow = data.dowData?.slice(0, 7) ?? Array(7).fill(0);
  const max = Math.max(...dow, 1);
  const miniStart = 252;
  const miniY = 740;
  dow.forEach((value, index) => {
    const x = miniStart + index * 96;
    const h = Math.max(4, (value / max) * 40);
    fillRoundRect(ctx, x, miniY + 44 - h, 52, h, 12, '#D4AF37');
    ctx.font = '600 18px -apple-system, sans-serif';
    ctx.fillStyle = '#475569';
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
  ctx.fillStyle = '#0F172A';
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

  ctx.font = '100px serif';
  ctx.fillStyle = '#D4AF37';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(data.symbol, W / 2, 340);

  ctx.font = '700 72px Georgia, serif';
  ctx.fillStyle = '#0F172A';
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
    ctx.fillStyle = '#475569';
    ctx.fillText(labels[i], x + barWidth / 2, chartTop - 64);
    const value = Math.max(0, Math.min(7, dow[i] ?? 0));
    const h = (value / 7) * chartHeight;
    fillRoundRect(ctx, x, chartTop + chartHeight - h, barWidth, Math.max(10, h), 38, value > 0 ? '#0F172A' : '#0F172A10');
    if (i === todayIndex) {
      ctx.beginPath();
      ctx.arc(x + barWidth / 2, chartTop + chartHeight - h - 34, 10, 0, Math.PI * 2);
      ctx.fillStyle = '#D4AF37';
      ctx.fill();
    }
  }

  const delta = (data.thisWeekActive ?? 0) - (data.lastWeekActive ?? 0);
  ctx.font = '700 86px Georgia, serif';
  ctx.fillStyle = '#0F172A';
  ctx.fillText(`${data.thisWeekActive ?? 0}/7 days active`, W / 2, 1480);

  ctx.font = '600 38px -apple-system, sans-serif';
  ctx.fillStyle = delta > 0 ? '#16A34A' : delta < 0 ? '#DC2626' : '#B45309';
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

// Retaining this specific footer used by generateSadhanaShareImage
async function drawShoonayaDailyFooter(
  ctx: CanvasRenderingContext2D,
  y: number,
  accentColor: string,
) {
  const logoWidth = 178;
  const logoHeight = 28;
  const separator = '·';
  const label = 'Daily Sādhana';
  const separatorWidth = 18;

  ctx.font = '300 30px -apple-system, sans-serif';
  const labelWidth = ctx.measureText(label).width;
  const totalWidth = logoWidth + separatorWidth + labelWidth;
  const startX = 540 - totalWidth / 2;

  try {
    const logo = await loadCanvasImage('/assets/images/logos/river-light/river-light-horizontal.png');
    ctx.save();
    ctx.globalAlpha = 0.92;
    ctx.drawImage(
      logo,
      805,
      318,
      1020,
      145,
      startX,
      y - logoHeight / 2 - 1,
      logoWidth,
      logoHeight,
    );
    ctx.restore();
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

export async function generateSadhanaShareImage({
  tradition,
  accentColor,
  type,
  lines,
  symbol,
  activeSymbolId,
}: {
  tradition: string;
  accentColor: string;
  type: string;
  lines: Array<{ text: string; size: number; weight?: string; color?: string }>;
  symbol: string;
  activeSymbolId?: string | null;
}): Promise<Blob | null> {
  if (typeof document === 'undefined') return null;

  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Background: deep gradient per tradition
    const gradients = {
      hindu: ['#1a0800', '#3d1500'],
      sikh: ['#001a4d', '#00205c'],
      buddhist: ['#2d0a1a', '#3d0f22'],
      jain: ['#1a1a00', '#2d2d00'],
    };
    const [c1, c2] = gradients[tradition as keyof typeof gradients] ?? gradients.hindu;
    const bg = ctx.createLinearGradient(0, 0, 0, 1080);
    bg.addColorStop(0, c1);
    bg.addColorStop(1, c2);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 1080, 1080);

    // Subtle radial glow center
    const glow = ctx.createRadialGradient(540, 540, 0, 540, 540, 500);
    glow.addColorStop(0, accentColor + '22');
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, 1080, 1080);

    // Symbol (large emoji) — center top
    ctx.font = '160px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(symbol, 540, 280);

    // Lines (stacked, centered)
    let y = 480;
    for (const line of lines) {
      ctx.font = `${line.weight ?? '600'} ${line.size}px -apple-system, Georgia, serif`;
      ctx.fillStyle = line.color ?? '#fff';
      ctx.textAlign = 'center';
      ctx.fillText(line.text, 540, y);
      y += line.size * 1.5;
    }

    // Branding — bottom
    await drawShoonayaDailyFooter(ctx, 980, accentColor);

    // Fine line above branding
    ctx.strokeStyle = accentColor + '33';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(200, 950);
    ctx.lineTo(880, 950);
    ctx.stroke();

    // Draw active relic badge
    if (activeSymbolId) {
      const relic = SACRED_RELICS.find((r) => r.id === activeSymbolId);
      if (relic?.imageUrl) {
        const relicImg = await loadCanvasImage(relic.imageUrl);
        // Draw in bottom-right corner of the card, 32×32px, with circular clip:
        ctx.save();
        ctx.beginPath();
        ctx.arc(1080 - 80, 1080 - 80, 32, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(relicImg, 1080 - 112, 1080 - 112, 64, 64);
        ctx.restore();
        // Draw amber ring around it:
        ctx.strokeStyle = 'rgba(197,160,89,0.6)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(1080 - 80, 1080 - 80, 34, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    return new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
  } catch (error) {
    console.error('Error generating share image:', error);
    return null;
  }
}
