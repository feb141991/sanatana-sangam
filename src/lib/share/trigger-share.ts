import { generateSadhanaShareImage } from './generate-share-image';
import { getTraditionMeta } from '@/lib/tradition-config';

export async function triggerSadhanaShare({
  tradition,
  type,
  lines,
  symbol,
  activeSymbolId,
}: {
  tradition: string;
  type: string;
  lines: Array<{ text: string; size: number; weight?: string; color?: string }>;
  symbol: string;
  activeSymbolId?: string | null;
}): Promise<void> {
  try {
    const meta = getTraditionMeta(tradition);
    const blob = await generateSadhanaShareImage({
      tradition,
      accentColor: meta.accentColour,
      type,
      lines,
      symbol,
      activeSymbolId,
    });
    
    if (!blob) return;

    const file = new File([blob], 'sadhana.png', { type: 'image/png' });

    const shareTitle = 'My Sādhana';
    const shareText = 'Practicing with Shoonaya 🙏';

    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: shareTitle,
        text: shareText,
      });
    } else if (navigator.share) {
      await navigator.share({
        title: shareTitle,
        text: shareText,
      });
    } else {
      // Fallback: download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'sadhana.png';
      a.click();
      URL.revokeObjectURL(url);
    }
  } catch (error) {
    console.error('Share failed:', error);
  }
}
