'use client';

/**
 * Share-card preview — renders every Shoonaya share-card variant in a
 * responsive grid so the unified generator can be eyeballed in one place.
 *
 * Thumbnails are scaled down for layout, but Share/Download always exports the
 * full 1080 × 1920 PNG from the same generator the app surfaces use. No
 * admin-only assumptions: it's a plain authed route that only renders canvases
 * in the browser.
 */

import { useEffect, useState } from 'react';
import {
  generateShoonayaShareCard,
  shoonayaVariantDefaultTitle,
  SHOONAYA_SHARE_VARIANTS,
  type ShoonayaShareCardVariant,
} from '@/lib/share/generate-share-image';
import {
  buildShoonayaShareCardData,
  shareShoonayaShareCard,
  type ShoonayaShareCardData,
} from '@/lib/share/shoonaya-card-data';

const VARIANT_SAMPLE: Record<ShoonayaShareCardVariant, ShoonayaShareCardData> = {
  sanatan: buildShoonayaShareCardData({
    tradition: 'hindu',
    streakCount: 108,
    caption: 'The sacred number, complete. One morning at a time.',
    userName: 'Aarav',
    date: 'June 2026',
  }),
  sikh: buildShoonayaShareCardData({
    tradition: 'sikh',
    streakCount: 40,
    caption: 'Forty days of Simran — the Naam takes root.',
    userName: 'Gurleen',
    date: 'June 2026',
  }),
  jain: buildShoonayaShareCardData({
    tradition: 'jain',
    streakCount: 21,
    caption: 'Three weeks of mindful Ahimsa, in thought and deed.',
    userName: 'Mahavir',
    date: 'June 2026',
  }),
  buddhist: buildShoonayaShareCardData({
    tradition: 'buddhist',
    streakCount: 88,
    caption: 'Returning to the cushion, breath after breath.',
    userName: 'Tenzin',
    date: 'June 2026',
  }),
  universal: buildShoonayaShareCardData({
    tradition: 'universal',
    score: 1240,
    title: 'Seva Score',
    caption: 'Small acts, gathered over many quiet days.',
    userName: 'A seeker',
    date: 'June 2026',
  }),
};

export default function SharePreviewPage() {
  const [thumbs, setThumbs] = useState<Partial<Record<ShoonayaShareCardVariant, string>>>({});
  const [busy, setBusy] = useState<ShoonayaShareCardVariant | null>(null);

  useEffect(() => {
    let cancelled = false;
    const urls: string[] = [];

    (async () => {
      for (const variant of SHOONAYA_SHARE_VARIANTS) {
        const blob = await generateShoonayaShareCard(VARIANT_SAMPLE[variant]);
        if (cancelled || !blob) continue;
        const url = URL.createObjectURL(blob);
        urls.push(url);
        setThumbs((prev) => ({ ...prev, [variant]: url }));
      }
    })();

    return () => {
      cancelled = true;
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const onShare = async (variant: ShoonayaShareCardVariant) => {
    setBusy(variant);
    try {
      await shareShoonayaShareCard(VARIANT_SAMPLE[variant], {
        fileName: `shoonaya-${variant}-card.png`,
        shareText: 'Practicing with Shoonaya 🙏',
      });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="min-h-screen px-5 pb-24 pt-8" style={{ background: 'var(--divine-bg, #12100b)' }}>
      <header className="mx-auto mb-7 max-w-3xl text-center">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--brand-ink)' }}>
          Share Card Preview
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--brand-muted)' }}>
          Every variant from the unified generator. Export is full 1080 &times; 1920.
        </p>
      </header>

      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {SHOONAYA_SHARE_VARIANTS.map((variant) => {
          const thumb = thumbs[variant];
          return (
            <div
              key={variant}
              className="flex flex-col gap-3 rounded-2xl p-3"
              style={{ background: 'var(--card-bg, rgba(255,255,255,0.04))', border: '1px solid var(--card-border, rgba(197,160,89,0.18))' }}
            >
              <div
                className="relative w-full overflow-hidden rounded-xl"
                style={{ aspectRatio: '9 / 16', background: 'rgba(0,0,0,0.2)' }}
              >
                {thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={thumb} alt={`${variant} share card`} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs" style={{ color: 'var(--brand-muted)' }}>
                    Rendering…
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold capitalize" style={{ color: 'var(--brand-ink)' }}>
                    {variant}
                  </p>
                  <p className="truncate text-[11px]" style={{ color: 'var(--brand-muted)' }}>
                    {shoonayaVariantDefaultTitle(variant)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onShare(variant)}
                  disabled={busy === variant}
                  className="shrink-0 rounded-full px-4 py-2 text-xs font-bold transition-transform active:scale-95 disabled:opacity-60"
                  style={{ background: 'var(--brand-primary)', color: '#1a1107' }}
                >
                  {busy === variant ? 'Working…' : 'Share / Download'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
