'use client';

import { useState } from 'react';
import { Bookmark, Download, Share2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

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
  {
    id: 'sikh',
    tradition: 'Sikh',
    title: 'Guru’s Kirpa',
    symbol: '☬',
    blessing: 'May the Guru’s wisdom light your path and keep your heart in Chardi Kala (eternal optimism).',
  },
  {
    id: 'buddhist',
    tradition: 'Buddhist',
    title: 'Nirvana Path',
    symbol: '☸️',
    blessing: 'May you find peace in the present moment and move with mindfulness through the day.',
  },
  {
    id: 'jain',
    tradition: 'Jain',
    title: 'Ahimsa Blessing',
    symbol: '🤲',
    blessing: 'May your thoughts and actions be rooted in compassion and non-violence toward all beings.',
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
  const [activeCardId, setActiveCardId] = useState<string | null>(null);

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

  const activeCard = DARSHAN_CARDS.find(c => c.id === activeCardId);

  return (
    <main className="divine-home-shell pb-28">
      <section className="divine-topbar">
        <div>
          <p className="divine-brand">Daily Darshan</p>
          <p className="divine-helper">A quiet blessing card for every tradition.</p>
        </div>
      </section>

      <div className="grid gap-4 pt-[100px] px-4">
        {DARSHAN_CARDS.map((card) => (
          <article 
            key={card.id} 
            className="divine-darshan-card cursor-pointer active:scale-[0.98] transition-transform"
            onClick={() => setActiveCardId(card.id)}
          >
            <span className="divine-card-motif divine-card-motif-large" aria-hidden="true" />
            <div className="divine-darshan-art" aria-hidden="true">
              <span>{card.symbol}</span>
            </div>
            <div>
              <span className="divine-chip">{card.tradition}</span>
              <h1 className="divine-darshan-title">{card.title}</h1>
              <p className="divine-card-copy mt-2 line-clamp-2">{card.blessing}</p>
            </div>
          </article>
        ))}
      </div>

      <AnimatePresence>
        {activeCard && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed inset-0 z-[100] bg-[var(--divine-bg)] flex flex-col items-center justify-center p-4 md:p-8 touch-none overflow-hidden"
          >
            {/* Close Button */}
            <button 
              onClick={() => setActiveCardId(null)}
              className="absolute top-6 right-6 z-50 p-3 rounded-full bg-[var(--divine-surface)] shadow-md border border-[var(--divine-border)] text-[var(--divine-text)] active:scale-95 transition-transform"
            >
              <X size={24} />
            </button>

            {/* Immersive Card */}
            <div className="w-full max-w-sm aspect-[9/16] max-h-[75vh] relative rounded-[2.5rem] overflow-hidden shadow-[0_20px_50px_rgba(62,42,31,0.15)] border border-[var(--divine-border)] bg-[var(--divine-surface)] flex flex-col items-center justify-center p-8 text-center">
              <span className="divine-card-motif divine-card-motif-large opacity-50" aria-hidden="true" />
              <div className="text-[140px] font-serif text-[var(--divine-saffron)] leading-none mb-8">
                {activeCard.symbol}
              </div>
              <span className="px-4 py-1.5 rounded-full border border-[var(--divine-gold)]/30 text-[var(--divine-gold)] text-[10px] font-bold uppercase tracking-widest mb-6">
                {activeCard.tradition}
              </span>
              <h1 className="font-serif text-3xl font-bold text-[var(--divine-text)] mb-4">
                {activeCard.title}
              </h1>
              <p className="text-[var(--divine-muted)] text-lg leading-relaxed italic px-4">
                &ldquo;{activeCard.blessing}&rdquo;
              </p>
            </div>

            {/* Action Bar */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="mt-8 flex items-center justify-center gap-6 z-20"
            >
              <button
                onClick={() => saveCard(activeCard)}
                className="p-4 rounded-full bg-[var(--divine-surface)] border border-[var(--divine-border)] text-[var(--divine-text)] shadow-sm active:scale-95 transition-transform"
              >
                <Bookmark size={22} fill={saved.has(activeCard.id) ? 'currentColor' : 'none'} />
              </button>
              <button
                onClick={() => shareCard(activeCard)}
                className="p-4 rounded-full bg-[var(--divine-surface)] border border-[var(--divine-border)] text-[var(--divine-text)] shadow-sm active:scale-95 transition-transform"
              >
                <Share2 size={22} />
              </button>
              <button
                onClick={() => downloadWallpaper(activeCard)}
                className="p-4 rounded-full bg-[var(--divine-surface)] border border-[var(--divine-border)] text-[var(--divine-text)] shadow-sm active:scale-95 transition-transform"
              >
                <Download size={22} />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
