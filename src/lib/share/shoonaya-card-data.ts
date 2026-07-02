import {
  generateShoonayaShareCard,
  resolveShoonayaVariant,
  type ShoonayaShareCardData,
  type ShoonayaShareCardVariant,
} from '@/lib/share/generate-share-image';

export type {
  ShoonayaShareCardData,
  ShoonayaShareCardVariant,
} from '@/lib/share/generate-share-image';

/**
 * Outcome of a share attempt, so calling UI can decide what (if anything) to
 * show the user. `cancelled` means the user dismissed the native sheet — a
 * neutral result that should not surface an error.
 */
export type ShoonayaShareResult = 'shared' | 'downloaded' | 'cancelled' | 'failed';

export interface ShoonayaShareOptions {
  /** Clean download filename, e.g. shoonaya-sadhana-card.png */
  fileName?: string;
  /** Title for the native share sheet. */
  shareTitle?: string;
  /** Text included alongside the image in the native share sheet. */
  shareText?: string;
  /** Optional URL (e.g. an invite link) included in the native share sheet. */
  shareUrl?: string;
}

function triggerDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Generate a Shoonaya share card and hand it off:
 *  · Web Share API with the PNG File when the platform supports file sharing
 *    (mobile / installed apps) — keeps native share targets working.
 *  · Falls back to a PNG download on desktop or when file sharing is absent.
 *
 * Throws nothing; returns a {@link ShoonayaShareResult} the caller can act on.
 */
export async function shareShoonayaShareCard(
  data: ShoonayaShareCardData,
  options: ShoonayaShareOptions = {},
): Promise<ShoonayaShareResult> {
  const fileName = options.fileName ?? 'shoonaya-sadhana-card.png';

  let blob: Blob | null;
  try {
    blob = await generateShoonayaShareCard(data);
  } catch {
    blob = null;
  }
  if (!blob) return 'failed';

  const file = new File([blob], fileName, { type: 'image/png' });

  if (typeof navigator !== 'undefined' && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({
        title: options.shareTitle ?? 'My Shoonaya practice',
        text: options.shareText ?? 'Practicing with Shoonaya 🙏',
        url: options.shareUrl,
        files: [file],
      });
      return 'shared';
    } catch (err: unknown) {
      // User dismissed the native share sheet — neutral, not a failure.
      if (err instanceof DOMException && err.name === 'AbortError') return 'cancelled';
      // Otherwise fall through to a download so the user still gets the card.
    }
  }

  try {
    triggerDownload(blob, fileName);
    return 'downloaded';
  } catch {
    return 'failed';
  }
}

/**
 * Convenience builder so surfaces don't re-derive the variant/label mapping.
 * Pure data — no rendering, no DOM.
 */
export function buildShoonayaShareCardData(input: {
  tradition: string;
  streakCount?: number;
  score?: number;
  title?: string;
  subtitle?: string;
  caption?: string;
  userName?: string;
  date?: string;
  footer?: string;
}): ShoonayaShareCardData {
  return {
    tradition: input.tradition,
    streakCount: input.streakCount,
    score: input.score,
    title: input.title,
    subtitle: input.subtitle,
    caption: input.caption,
    userName: input.userName,
    date: input.date,
    footer: input.footer,
  };
}

export { resolveShoonayaVariant };
