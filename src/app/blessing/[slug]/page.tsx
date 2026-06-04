import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getBlessingBySlug, FESTIVAL_BLESSINGS } from '@/lib/festival-blessings';

// ─── Static params ────────────────────────────────────────────────────────────
export async function generateStaticParams() {
  return FESTIVAL_BLESSINGS.map(b => ({ slug: b.slug }));
}

// ─── Dynamic OG metadata ──────────────────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const b = getBlessingBySlug(slug);
  if (!b) return { title: 'Blessing — Shoonaya' };

  const desc = `${b.greeting} — ${b.translation.replace(/"/g, '')} · ${b.source}`;

  return {
    title: `${b.emoji} ${b.name} — Shoonaya`,
    description: desc,
    openGraph: {
      title: `${b.emoji} ${b.shareTitle}`,
      description: b.shareBody,
      url: `https://shoonaya.com/blessing/${slug}`,
      siteName: 'Shoonaya',
      type: 'website',
      images: [
        {
          url: `https://shoonaya.com/api/blessing-og?slug=${slug}`,
          width: 1200,
          height: 630,
          alt: `${b.name} blessing from Shoonaya`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${b.emoji} ${b.shareTitle}`,
      description: b.shareBody,
      images: [`https://shoonaya.com/api/blessing-og?slug=${slug}`],
    },
  };
}

// ─── Tradition label ──────────────────────────────────────────────────────────
const TRAD_LABEL: Record<string, string> = {
  hindu:    'Sanatan Dharma · हिन्दू धर्म',
  sikh:     'Sikhi · ਸਿੱਖ ਧਰਮ',
  buddhist: 'Buddhism · बौद्ध धर्म',
  jain:     'Jainism · जैन धर्म',
  all:      'All Dharmic Traditions',
};

const TRAD_SYMBOL: Record<string, string> = {
  hindu: 'ॐ', sikh: 'ੴ', buddhist: '☸', jain: '☮', all: '🪔',
};

// ─── Script font mapping ──────────────────────────────────────────────────────
const SCRIPT_STYLE: Record<string, string> = {
  gurmukhi: "font-family:'Noto Sans Gurmukhi', 'Mukta Mahee', sans-serif; font-size: 1.45rem; line-height: 1.9;",
  pali:     "font-family: Georgia, 'Times New Roman', serif; font-style: italic; font-size: 1.4rem; line-height: 1.8;",
  prakrit:  "font-family: Georgia, 'Times New Roman', serif; font-size: 1.35rem; line-height: 1.8;",
  sanskrit: "font-family: 'Noto Serif Devanagari', 'Mangal', Georgia, serif; font-size: 1.5rem; line-height: 2.0;",
  hindi:    "font-family: 'Noto Serif Devanagari', 'Mangal', Georgia, serif; font-size: 1.4rem; line-height: 1.9;",
};

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function BlessingPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ ref?: string }>;
}) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const ref = resolvedSearchParams?.ref?.trim() ?? '';
  const b = getBlessingBySlug(slug);
  if (!b) notFound();

  const scriptStyle = SCRIPT_STYLE[b.scriptLang] ?? SCRIPT_STYLE.sanskrit;
  const tradLabel   = TRAD_LABEL[b.tradition] ?? TRAD_LABEL.all;
  const tradSymbol  = TRAD_SYMBOL[b.tradition] ?? TRAD_SYMBOL.all;

  // Format date for display
  const festDate = new Date(b.date + 'T00:00:00');
  const dateStr  = festDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  // Share URLs
  const pageUrl   = `https://shoonaya.com/blessing/${slug}`;
  const waText    = encodeURIComponent(`${b.shareTitle}\n\n${b.shareBody}\n\n${pageUrl}`);
  const twText    = encodeURIComponent(`${b.shareTitle}\n\n${b.shareBody}`);
  const twUrl     = encodeURIComponent(pageUrl);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; }
        body {
          min-height: 100vh;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: ${b.bgGradient};
          color: ${b.textColor};
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 24px 16px 40px;
        }
        .card {
          width: 100%;
          max-width: 560px;
          border: 1px solid ${b.accentColor}44;
          border-radius: 28px;
          padding: 48px 40px 40px;
          background: ${b.accentColor}10;
          backdrop-filter: blur(12px);
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse 70% 60% at 50% 20%, ${b.accentColor}18 0%, transparent 70%);
          pointer-events: none;
        }
        .brand { font-size: 10px; letter-spacing: 0.28em; text-transform: uppercase; opacity: 0.40; margin-bottom: 28px; }
        .trad-symbol { font-size: 42px; margin-bottom: 10px; line-height: 1; }
        .trad-label { font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: ${b.accentColor}; opacity: 0.75; margin-bottom: 24px; }
        .festival-date { font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; opacity: 0.35; margin-bottom: 12px; }
        .festival-name {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: clamp(32px, 6vw, 48px);
          font-weight: 300;
          line-height: 1.1;
          margin-bottom: 6px;
          color: ${b.textColor};
        }
        .greeting {
          font-size: 13px;
          color: ${b.accentColor};
          letter-spacing: 0.06em;
          margin-bottom: 36px;
          opacity: 0.88;
        }
        .divider {
          width: 40px;
          height: 1px;
          background: ${b.accentColor}55;
          margin: 0 auto 32px;
        }
        .script-line {
          ${scriptStyle}
          color: ${b.textColor};
          margin-bottom: 20px;
          white-space: pre-line;
        }
        .divider2 {
          width: 28px;
          height: 1px;
          background: ${b.accentColor}33;
          margin: 0 auto 18px;
        }
        .translation {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: clamp(17px, 2.8vw, 22px);
          font-weight: 300;
          font-style: italic;
          line-height: 1.65;
          color: ${b.textColor}cc;
          margin-bottom: 12px;
        }
        .source {
          font-size: 10px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: ${b.accentColor};
          opacity: 0.65;
          margin-bottom: 40px;
        }
        /* Share row */
        .share-row {
          display: flex;
          gap: 10px;
          justify-content: center;
          flex-wrap: wrap;
          margin-bottom: 32px;
        }
        .share-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 10px 20px;
          border-radius: 100px;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.04em;
          border: 1px solid;
          cursor: pointer;
          text-decoration: none;
          transition: opacity 0.2s;
        }
        .share-btn:hover { opacity: 0.82; }
        .share-wa  { background: rgba(37,211,102,0.15); border-color: rgba(37,211,102,0.35); color: #25d366; }
        .share-tw  { background: rgba(255,255,255,0.07); border-color: rgba(255,255,255,0.18); color: ${b.textColor}; }
        .share-cp  { background: ${b.accentColor}20; border-color: ${b.accentColor}45; color: ${b.accentColor}; }
        /* CTA */
        .cta-divider { width: 100%; height: 1px; background: ${b.accentColor}22; margin-bottom: 28px; }
        .cta-text {
          font-size: 12px;
          opacity: 0.42;
          margin-bottom: 16px;
          line-height: 1.6;
        }
        .cta-btn {
          display: inline-block;
          background: ${b.accentColor};
          color: #0C0A07;
          font-weight: 700;
          font-size: 13px;
          letter-spacing: 0.04em;
          padding: 13px 32px;
          border-radius: 100px;
          text-decoration: none;
          transition: opacity 0.2s;
        }
        .cta-btn:hover { opacity: 0.88; }
        @media (max-width: 480px) {
          .card { padding: 36px 24px 32px; border-radius: 20px; }
        }
      `}</style>

      <div className="card">
        <div className="brand">Shoonaya · शून्य</div>

        <div className="trad-symbol">{tradSymbol}</div>
        <div className="trad-label">{tradLabel}</div>

        <div className="festival-date">{dateStr}</div>
        <div className="festival-name">{b.emoji} {b.name}</div>
        <div className="greeting">{b.greeting}</div>

        <div className="divider" />

        <div
          className="script-line"
          style={{ fontFamily: scriptStyle.match(/font-family:([^;]+)/)?.[1]?.trim() ?? 'Georgia' }}
          dangerouslySetInnerHTML={{ __html: b.scriptLine.replace(/\n/g, '<br/>') }}
        />

        <div className="divider2" />

        <div className="translation">{b.translation}</div>
        <div className="source">{b.source}</div>

        {/* Share */}
        <div className="share-row">
          <a
            className="share-btn share-wa"
            href={`https://wa.me/?text=${waText}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            📲 WhatsApp
          </a>
          <a
            className="share-btn share-tw"
            href={`https://twitter.com/intent/tweet?text=${twText}&url=${twUrl}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            𝕏 Twitter
          </a>
          <button
            className="share-btn share-cp"
            onClick={undefined}
            data-copy-url={pageUrl}
            id="copy-btn"
          >
            🔗 Copy Link
          </button>
        </div>

        <div className="cta-divider" />
        <div className="cta-text">
          Shoonaya is the first digital home for Hindu, Sikh, Buddhist &amp; Jain wisdom.<br/>
          One home. Four traditions. Launching June 17, 2026.
        </div>
        <Link className="cta-btn" href={ref ? `/?ref=${encodeURIComponent(ref)}&from=blessing` : "/?from=blessing"}>
          Join as Sthapaka →
        </Link>
      </div>

      {/* Copy link script */}
      <script dangerouslySetInnerHTML={{ __html: `
        document.getElementById('copy-btn').addEventListener('click', function() {
          navigator.clipboard.writeText('${pageUrl}').then(function() {
            var btn = document.getElementById('copy-btn');
            btn.textContent = '✓ Copied!';
            setTimeout(function(){ btn.textContent = '🔗 Copy Link'; }, 2000);
          });
        });
      ` }} />
    </>
  );
}
