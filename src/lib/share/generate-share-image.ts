import { SACRED_RELICS } from '@/lib/relics';

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
