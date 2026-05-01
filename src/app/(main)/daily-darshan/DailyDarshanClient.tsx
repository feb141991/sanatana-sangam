'use client';

import { useState } from 'react';
import { Bookmark, Download, Share2 } from 'lucide-react';
import toast from 'react-hot-toast';

const DARSHAN_CARDS = [
  {
    id: 'mahadev',
    tradition: 'Shaiva',
    title: 'Mahadev darshan',
    symbol: 'ॐ',
    blessing: 'May Shiva steady your mind, soften your speech, and make today’s action clear.',
  },
  {
    id: 'narayana',
    tradition: 'Vaishnava',
    title: 'Narayana darshan',
    symbol: 'श्री',
    blessing: 'May Vishnu protect your rhythm and keep your home, work, and sadhana in balance.',
  },
  {
    id: 'devi',
    tradition: 'Shakta',
    title: 'Devi darshan',
    symbol: 'ऐं',
    blessing: 'May Maa bring courage, compassion, and sacred strength into your day.',
  },
  {
    id: 'hanuman',
    tradition: 'Bhakti',
    title: 'Hanuman darshan',
    symbol: 'राम',
    blessing: 'May Hanuman give you focus, devotion, and the energy to complete what matters.',
  },
];

function buildWallpaperSvg(card: typeof DARSHAN_CARDS[number]) {
  const safeTitle = card.title.replace(/&/g, '&amp;');
  const safeBlessing = card.blessing.replace(/&/g, '&amp;');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1170" height="2532" viewBox="0 0 1170 2532">
  <rect width="1170" height="2532" fill="#FAF6EF"/>
  <circle cx="585" cy="650" r="360" fill="none" stroke="#C9A35B" stroke-opacity="0.24" stroke-width="3"/>
  <circle cx="585" cy="650" r="250" fill="#FFFDF9" stroke="#E8DCCB" stroke-width="3"/>
  <text x="585" y="720" text-anchor="middle" font-size="190" fill="#D88A1C" font-family="Georgia, serif">${card.symbol}</text>
  <text x="585" y="1080" text-anchor="middle" font-size="76" fill="#3E2A1F" font-family="Georgia, serif" font-weight="700">${safeTitle}</text>
  <foreignObject x="180" y="1160" width="810" height="360">
    <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: Inter, Arial, sans-serif; font-size: 42px; line-height: 1.5; color: #6C4B35; text-align: center;">${safeBlessing}</div>
  </foreignObject>
  <text x="585" y="2200" text-anchor="middle" font-size="34" fill="#C9A35B" font-family="Inter, Arial, sans-serif">Sanatan Universe</text>
</svg>`;
}

export default function DailyDarshanClient() {
  const [saved, setSaved] = useState<Set<string>>(new Set());

  async function shareCard(card: typeof DARSHAN_CARDS[number]) {
    const text = `${card.title}\n\n${card.blessing}\n\nShared via Sanatan Universe`;
    if (navigator.share) {
      await navigator.share({ title: card.title, text });
      return;
    }

    await navigator.clipboard.writeText(text);
    toast.success('Darshan copied to clipboard');
  }

  function saveCard(card: typeof DARSHAN_CARDS[number]) {
    setSaved(prev => new Set(prev).add(card.id));
    toast.success(`${card.title} saved`);
  }

  function downloadWallpaper(card: typeof DARSHAN_CARDS[number]) {
    const blob = new Blob([buildWallpaperSvg(card)], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${card.id}-darshan-wallpaper.svg`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success('Wallpaper artwork downloaded');
  }

  return (
    <main className="divine-home-shell pb-28">
      <section className="divine-topbar">
        <div>
          <p className="divine-brand">Daily Darshan</p>
          <p className="divine-helper">A quiet blessing card for every tradition.</p>
        </div>
      </section>

      <div className="grid gap-4">
        {DARSHAN_CARDS.map((card) => (
          <article key={card.id} className="divine-darshan-card">
            <span className="divine-card-motif divine-card-motif-large" aria-hidden="true" />
            <div className="divine-darshan-art" aria-hidden="true">
              <span>{card.symbol}</span>
            </div>
            <div>
              <span className="divine-chip">{card.tradition}</span>
              <h1 className="divine-darshan-title">{card.title}</h1>
              <p className="divine-card-copy mt-2">{card.blessing}</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button type="button" onClick={() => shareCard(card)} className="divine-darshan-action">
                <Share2 size={15} />
                Share
              </button>
              <button type="button" onClick={() => saveCard(card)} className="divine-darshan-action">
                <Bookmark size={15} fill={saved.has(card.id) ? 'currentColor' : 'none'} />
                {saved.has(card.id) ? 'Saved' : 'Save'}
              </button>
              <button type="button" onClick={() => downloadWallpaper(card)} className="divine-darshan-action">
                <Download size={15} />
                Wallpaper
              </button>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
