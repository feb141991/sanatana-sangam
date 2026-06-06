import { SACRED_RELICS } from '@/lib/relics';

export type NityaCardType =
  | 'streak_milestone'
  | 'week_summary'
  | 'morning_complete'
  | 'sadhana_quote'
  | 'monthly_report';

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
}

const TRADITION_BG_GRADIENT: Record<string, [string, string]> = {
  hindu:    ['#120600', '#2a0e00'],
  sikh:     ['#00061a', '#000f2e'],
  buddhist: ['#1a0008', '#2d0010'],
  jain:     ['#0a0a00', '#1a1a00'],
};

const CARD_DIMENSIONS: Record<NityaCardType, [number, number]> = {
  streak_milestone: [1080, 1080],
  week_summary:     [1080, 1920],
  morning_complete: [1080, 1080],
  sadhana_quote:    [1080, 1080],
  monthly_report:   [1080, 1350],
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

function getTraditionColors(tradition: string) {
  return TRADITION_BG_GRADIENT[tradition] ?? TRADITION_BG_GRADIENT.hindu;
}

function drawLinearBackground(ctx: CanvasRenderingContext2D, width: number, height: number, colors: [string, string]) {
  const bg = ctx.createLinearGradient(0, 0, 0, height);
  bg.addColorStop(0, colors[0]);
  bg.addColorStop(1, colors[1]);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);
}

function drawRadialBurst(ctx: CanvasRenderingContext2D, width: number, height: number, inner: string, accentColor: string) {
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, width, height);
  const bg = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width * 0.72);
  bg.addColorStop(0, inner);
  bg.addColorStop(0.52, inner);
  bg.addColorStop(1, '#000000');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  const glow = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, 420);
  glow.addColorStop(0, `${accentColor}30`);
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);
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

function drawBranding(ctx: CanvasRenderingContext2D, width: number, y: number, accentColor: string, label = 'Shoonaya') {
  ctx.strokeStyle = `${accentColor}33`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(width * 0.22, y - 34);
  ctx.lineTo(width * 0.78, y - 34);
  ctx.stroke();

  ctx.font = '300 26px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.fillStyle = `${accentColor}80`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, width / 2, y);
}

function drawSymbolRings(ctx: CanvasRenderingContext2D, x: number, y: number, symbol: string, accentColor: string, size = 180) {
  const glow = ctx.createRadialGradient(x, y, 0, x, y, 150);
  glow.addColorStop(0, `${accentColor}40`);
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.fillRect(x - 180, y - 180, 360, 360);

  ctx.strokeStyle = `${accentColor}66`;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(x, y, 124, 0, Math.PI * 2);
  ctx.stroke();

  ctx.save();
  ctx.setLineDash([16, 18]);
  ctx.strokeStyle = `${accentColor}40`;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y, 154, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  ctx.font = `${size}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(symbol, x, y + 4);
}

function getDefaultQuote(data: NityaShareCardData) {
  if (data.quote) return data.quote;
  const quotes = TRADITION_SHARE_QUOTES[data.tradition] ?? TRADITION_SHARE_QUOTES.hindu;
  return quotes[(data.streak ?? 0) % quotes.length];
}

function renderStreakMilestone(ctx: CanvasRenderingContext2D, data: NityaShareCardData) {
  const [inner] = getTraditionColors(data.tradition);
  drawRadialBurst(ctx, 1080, 1080, inner, data.accentColor);

  drawSymbolRings(ctx, 540, 225, data.symbol, data.accentColor, 180);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '700 200px Georgia, "Times New Roman", serif';
  ctx.fillStyle = data.accentColor;
  ctx.fillText(String(data.streak ?? 0), 540, 505);

  ctx.font = '300 40px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.60)';
  ctx.fillText('days', 540, 640);

  ctx.strokeStyle = `${data.accentColor}4d`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(108, 700);
  ctx.lineTo(972, 700);
  ctx.stroke();

  ctx.font = '500 48px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fillText(data.milestoneLabel, 540, 760);

  ctx.font = '400 32px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.fillText(`${data.userName}'s Sadhana`, 540, 905);

  ctx.font = '300 24px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.fillStyle = `${data.accentColor}80`;
  ctx.fillText(`Shoonaya · ${data.tradition}`, 540, 948);
  drawBranding(ctx, 1080, 1010, data.accentColor, 'Shoonaya · Nitya Karma');
}

function renderWeekSummary(ctx: CanvasRenderingContext2D, data: NityaShareCardData) {
  drawLinearBackground(ctx, 1080, 1920, getTraditionColors(data.tradition));
  const deep = ctx.createLinearGradient(0, 0, 0, 1920);
  deep.addColorStop(0, 'transparent');
  deep.addColorStop(1, '#0a0806');
  ctx.fillStyle = deep;
  ctx.fillRect(0, 0, 1080, 1920);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '80px serif';
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.fillText(data.symbol, 540, 165);
  ctx.font = '600 54px Georgia, "Times New Roman", serif';
  ctx.fillStyle = 'rgba(255,255,255,0.94)';
  ctx.fillText('This Week\'s Practice', 540, 250);

  const dow = data.dowData?.slice(0, 7) ?? Array(7).fill(0);
  const labels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const chartTop = 520;
  const chartHeight = 760;
  const barWidth = 78;
  const gap = 52;
  const startX = (1080 - (barWidth * 7 + gap * 6)) / 2;
  const todayIndex = (new Date().getDay() + 6) % 7;

  for (let i = 0; i < 7; i++) {
    const x = startX + i * (barWidth + gap);
    ctx.font = '600 32px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.fillText(labels[i], x + barWidth / 2, chartTop - 64);
    const value = Math.max(0, Math.min(7, dow[i] ?? 0));
    const h = (value / 7) * chartHeight;
    fillRoundRect(ctx, x, chartTop + chartHeight - h, barWidth, Math.max(10, h), 38, value > 0 ? `${data.accentColor}e6` : 'rgba(255,255,255,0.10)');
    if (i === todayIndex) {
      ctx.beginPath();
      ctx.arc(x + barWidth / 2, chartTop + chartHeight - h - 34, 10, 0, Math.PI * 2);
      ctx.fillStyle = data.accentColor;
      ctx.fill();
    }
  }

  const delta = (data.thisWeekActive ?? 0) - (data.lastWeekActive ?? 0);
  ctx.font = '700 76px Georgia, "Times New Roman", serif';
  ctx.fillStyle = 'rgba(255,255,255,0.96)';
  ctx.fillText(`${data.thisWeekActive ?? 0}/7 days active`, 540, 1410);

  ctx.font = '500 34px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.fillStyle = delta > 0 ? '#6BAE75' : delta < 0 ? '#b86d6d' : `${data.accentColor}cc`;
  const deltaLabel = delta > 0
    ? `↑ ${delta} more than last week`
    : delta < 0
      ? `↓ ${Math.abs(delta)} fewer than last week`
      : 'Same rhythm as last week';
  ctx.fillText(deltaLabel, 540, 1480);

  ctx.font = '400 32px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.70)';
  ctx.fillText(`${data.userName} · ${data.milestoneLabel}`, 540, 1710);
  drawBranding(ctx, 1080, 1815, data.accentColor, 'Shoonaya · Nitya Karma');
}

function renderMorningComplete(ctx: CanvasRenderingContext2D, data: NityaShareCardData) {
  drawLinearBackground(ctx, 1080, 1080, getTraditionColors(data.tradition));

  ctx.fillStyle = 'rgba(255,255,255,0.03)';
  for (let x = 0; x < 1080; x += 42) {
    for (let y = 0; y < 1080; y += 42) {
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (data.todayTithi) {
    ctx.font = '400 28px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillStyle = `${data.accentColor}b3`;
    ctx.fillText(`${data.todayTithi} — Auspicious completion`, 540, 240);
  }

  ctx.beginPath();
  ctx.arc(540, 435, 120, 0, Math.PI * 2);
  ctx.fillStyle = `${data.accentColor}40`;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(540, 435, 100, 0, Math.PI * 2);
  ctx.fillStyle = data.accentColor;
  ctx.fill();
  ctx.font = '700 112px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('✓', 540, 428);

  ctx.font = '700 72px Georgia, "Times New Roman", serif';
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.fillText('Morning complete', 540, 640);

  ctx.font = '400 32px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.50)';
  ctx.fillText(`${data.stepsCompletedToday ?? 0} of ${data.totalSteps ?? 7} sacred steps`, 540, 702);

  const dateLabel = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
  ctx.font = '400 28px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.fillStyle = `${data.accentColor}66`;
  ctx.fillText(dateLabel, 540, 752);

  ctx.font = '400 30px Georgia, "Times New Roman", serif';
  ctx.fillStyle = 'rgba(255,255,255,0.70)';
  ctx.fillText('A day lived in dharma is a day lived fully.', 540, 900);
  drawBranding(ctx, 1080, 995, data.accentColor, 'Shoonaya · Nitya Karma');
}

function renderSadhanaQuote(ctx: CanvasRenderingContext2D, data: NityaShareCardData) {
  drawLinearBackground(ctx, 1080, 1080, getTraditionColors(data.tradition));
  const glow = ctx.createRadialGradient(540, 480, 0, 540, 480, 620);
  glow.addColorStop(0, `${data.accentColor}26`);
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 1080, 1080);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '60px serif';
  ctx.fillStyle = 'rgba(255,255,255,0.90)';
  ctx.fillText(data.symbol, 540, 110);

  ctx.font = '120px Georgia, "Times New Roman", serif';
  ctx.fillStyle = data.accentColor;
  ctx.fillText('“', 540, 260);

  ctx.font = '500 52px Georgia, "Times New Roman", serif';
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  const endY = wrapText(ctx, getDefaultQuote(data), 540, 365, 840, 82, 6);

  if (data.quoteSource) {
    ctx.font = 'italic 28px Georgia, "Times New Roman", serif';
    ctx.fillStyle = `${data.accentColor}8c`;
    ctx.fillText(data.quoteSource, 540, endY + 28);
  }

  const pillY = Math.min(760, endY + 92);
  fillRoundRect(ctx, 398, pillY, 284, 62, 31, `${data.accentColor}26`);
  strokeRoundRect(ctx, 398, pillY, 284, 62, 31, `${data.accentColor}40`, 2);
  ctx.font = '600 26px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.fillStyle = data.accentColor;
  ctx.fillText(`🔥 ${data.streak ?? 0} days`, 540, pillY + 32);

  ctx.strokeStyle = `${data.accentColor}35`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(250, 875);
  ctx.lineTo(830, 875);
  ctx.stroke();

  ctx.font = '400 30px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.66)';
  ctx.fillText(`${data.userName} · ${data.milestoneLabel}`, 540, 930);
  ctx.font = '300 24px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.34)';
  ctx.fillText('Shoonaya', 540, 980);
}

function renderMonthlyReport(ctx: CanvasRenderingContext2D, data: NityaShareCardData) {
  drawLinearBackground(ctx, 1080, 1350, getTraditionColors(data.tradition));
  const month = data.month ?? new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '700 80px Georgia, "Times New Roman", serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(month, 540, 150);

  ctx.font = '42px serif';
  ctx.fillText(data.symbol, 458, 235);
  ctx.font = '400 30px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.68)';
  ctx.fillText(data.milestoneLabel, 555, 237);

  ctx.strokeStyle = `${data.accentColor}80`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(210, 305);
  ctx.lineTo(870, 305);
  ctx.stroke();

  const boxes = [
    { value: `${data.consistencyScore ?? 0}%`, label: 'Consistency', bg: `${data.accentColor}1f` },
    { value: String(data.activeDays ?? 0), label: 'Active days', bg: data.tradition === 'hindu' || data.tradition === 'jain' ? '#3a7a4a1f' : `${data.accentColor}1f` },
    { value: String(data.fullMorningDays ?? 0), label: 'Complete', bg: `${data.accentColor}14` },
  ];
  const boxY = 430;
  const boxW = 286;
  const boxH = 190;
  const boxGap = 26;
  const boxStart = (1080 - boxW * 3 - boxGap * 2) / 2;
  boxes.forEach((box, index) => {
    const x = boxStart + index * (boxW + boxGap);
    fillRoundRect(ctx, x, boxY, boxW, boxH, 30, box.bg);
    strokeRoundRect(ctx, x, boxY, boxW, boxH, 30, `${data.accentColor}26`, 2);
    ctx.font = '700 72px Georgia, "Times New Roman", serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(box.value, x + boxW / 2, boxY + 78);
    ctx.font = '500 22px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.58)';
    ctx.fillText(box.label, x + boxW / 2, boxY + 137);
  });

  const dow = data.dowData?.slice(0, 7) ?? Array(7).fill(0);
  const max = Math.max(...dow, 1);
  const miniStart = 252;
  const miniY = 710;
  dow.forEach((value, index) => {
    const x = miniStart + index * 96;
    const h = Math.max(4, (value / max) * 40);
    fillRoundRect(ctx, x, miniY + 44 - h, 52, h, 12, data.accentColor);
    ctx.font = '500 18px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
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
  ctx.font = '400 34px Georgia, "Times New Roman", serif';
  ctx.fillStyle = 'rgba(255,255,255,0.82)';
  wrapText(ctx, insight, 540, 855, 780, 50, 3);

  ctx.font = '400 30px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.fillStyle = `${data.accentColor}b3`;
  ctx.fillText(`Practice peaks at ${data.peakHourLabel ?? 'your chosen hour'}`, 540, 1115);

  ctx.font = '400 28px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.62)';
  ctx.fillText(`${data.userName} · Shoonaya Nitya Karma`, 540, 1190);
  ctx.font = '300 22px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.34)';
  ctx.fillText(month, 540, 1240);
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
        renderStreakMilestone(ctx, data);
        break;
      case 'week_summary':
        renderWeekSummary(ctx, data);
        break;
      case 'morning_complete':
        renderMorningComplete(ctx, data);
        break;
      case 'sadhana_quote':
        renderSadhanaQuote(ctx, data);
        break;
      case 'monthly_report':
        renderMonthlyReport(ctx, data);
        break;
    }

    return toBlob(canvas);
  } catch (error) {
    console.error('Error generating Nitya share card:', error);
    return null;
  }
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
    ctx.font = '300 32px -apple-system, sans-serif';
    ctx.fillStyle = accentColor + 'aa';
    ctx.fillText('Shoonaya · Daily Sādhana', 540, 980);

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
        const relicImg = new Image();
        relicImg.src = relic.imageUrl;
        await new Promise((resolve) => { relicImg.onload = resolve; });
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
