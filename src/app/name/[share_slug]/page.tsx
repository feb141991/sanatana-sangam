export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase-server';

// ─── Dynamic OG metadata ──────────────────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ share_slug: string }>;
}): Promise<Metadata> {
  const { share_slug } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: story } = await supabase
    .from('name_stories')
    .select('name_input, normalized_first_name, meaning_summary, sacred_meaning, tradition')
    .eq('share_slug', share_slug)
    .eq('is_public', true)
    .maybeSingle();

  if (!story) return { title: 'Dharmic Name Story — Shoonaya' };

  const name = story.normalized_first_name || story.name_input;
  const title = `Spiritual Name Story of ${name} — Shoonaya`;
  const desc = story.sacred_meaning || story.meaning_summary || `Discover the first-name story, scripture connection, and blessing for ${name} on Shoonaya.`;

  return {
    title,
    description: desc,
    openGraph: {
      title,
      description: desc,
      url: `https://shoonaya.com/name/${share_slug}`,
      siteName: 'Shoonaya',
      type: 'website',
      images: [
        {
          url: `https://shoonaya.com/api/name-story-og?slug=${share_slug}`,
          width: 1200,
          height: 630,
          alt: `Spiritual Name Story of ${name} on Shoonaya`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: desc,
      images: [`https://shoonaya.com/api/name-story-og?slug=${share_slug}`],
    },
  };
}

interface ThemeConfig {
  bgGradient: string;
  accentColor: string;
  textColor: string;
  symbol: string;
  label: string;
}

const TRADITION_THEMES: Record<string, ThemeConfig> = {
  hindu: {
    bgGradient: 'radial-gradient(circle at center, #231207 0%, #0E0703 100%)',
    accentColor: '#C5A059',
    textColor: '#F5E6C9',
    symbol: '🪔',
    label: 'Sanatan Dharma · हिन्दू धर्म',
  },
  sikh: {
    bgGradient: 'radial-gradient(circle at center, #0B192C 0%, #030813 100%)',
    accentColor: '#F1C40F',
    textColor: '#E8F1F5',
    symbol: '☬',
    label: 'Sikhi · ਸਿੱਖ ਧਰਮ',
  },
  buddhist: {
    bgGradient: 'radial-gradient(circle at center, #1E121E 0%, #0C060C 100%)',
    accentColor: '#D35400',
    textColor: '#FADBD8',
    symbol: '☸️',
    label: 'Buddha Dharma · बौद्ध धर्म',
  },
  jain: {
    bgGradient: 'radial-gradient(circle at center, #0F2027 0%, #050A0E 100%)',
    accentColor: '#1ABC9C',
    textColor: '#E0F2F1',
    symbol: '🤲',
    label: 'Jain Dharma · जैन धर्म',
  },
  all: {
    bgGradient: 'radial-gradient(circle at center, #1A1A1D 0%, #0F0F10 100%)',
    accentColor: '#C5A059',
    textColor: '#EAEAEA',
    symbol: '🪔',
    label: 'Dharmic Traditions · शून्य',
  },
};

export default async function NameStorySharePage({
  params,
  searchParams,
}: {
  params: Promise<{ share_slug: string }>;
  searchParams?: Promise<{ ref?: string }>;
}) {
  const { share_slug } = await params;
  const resolvedSearchParams = await searchParams;
  const ref = resolvedSearchParams?.ref?.trim() ?? '';

  const supabase = await createServerSupabaseClient();
  const { data: story, error } = await supabase
    .from('name_stories')
    .select('id, name_input, display_name, normalized_first_name, name_native_script, name_transliteration, tradition, origin_tradition, meaning_summary, sacred_meaning, etymology_text, name_story, inner_quality, life_blessing, practice_suggestion, name_mantra, name_mantra_translation, deity_connection, historical_bearers, scripture_line, scripture_original, scripture_transliteration, scripture_translation, scripture_source, source_confidence, source_note, share_slug')
    .eq('share_slug', share_slug)
    .eq('is_public', true)
    .maybeSingle();

  if (error || !story) {
    notFound();
  }

  const tradition = story.tradition || 'all';
  const theme = TRADITION_THEMES[tradition] ?? TRADITION_THEMES.all;
  const displayName = story.normalized_first_name || story.name_input;
  const meaning = story.sacred_meaning || story.meaning_summary;
  const storyText = story.name_story || story.etymology_text;
  const scriptureText = [
    story.scripture_original,
    story.scripture_transliteration,
    story.scripture_translation,
  ].filter(Boolean).join('\n\n') || story.scripture_line || '';

  // Share URLs
  const pageUrl = `https://shoonaya.com/name/${share_slug}`;
  const shareTitle = `Discover the Spiritual Name Story of ${displayName}`;
  const shareBody = `Meaning: ${meaning}\n\nExplore the first-name story and scripture connection on Shoonaya:`;
  const waText = encodeURIComponent(`${shareTitle}\n${shareBody}\n${pageUrl}`);
  const twText = encodeURIComponent(`${shareTitle}\n${shareBody}`);
  const twUrl = encodeURIComponent(pageUrl);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; }
        body {
          min-height: 100vh;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: ${theme.bgGradient};
          color: ${theme.textColor};
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 24px 16px 40px;
        }
        .card {
          width: 100%;
          max-width: 580px;
          border: 1px solid ${theme.accentColor}44;
          border-radius: 28px;
          padding: 48px 40px 40px;
          background: ${theme.accentColor}0b;
          backdrop-filter: blur(16px);
          position: relative;
          overflow: hidden;
        }
        .card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse 70% 60% at 50% 20%, ${theme.accentColor}12 0%, transparent 70%);
          pointer-events: none;
        }
        .header {
          text-align: center;
          margin-bottom: 32px;
        }
        .brand { font-size: 10px; letter-spacing: 0.28em; text-transform: uppercase; opacity: 0.40; margin-bottom: 24px; }
        .trad-symbol { font-size: 42px; margin-bottom: 10px; line-height: 1; }
        .trad-label { font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: ${theme.accentColor}; opacity: 0.85; margin-bottom: 8px; }
        .origin-badge {
          display: inline-block;
          font-size: 9px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          background: ${theme.accentColor}18;
          color: ${theme.accentColor};
          padding: 4px 12px;
          border-radius: 100px;
          border: 1px solid ${theme.accentColor}33;
          margin-bottom: 24px;
        }
        .name-title {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: clamp(38px, 7vw, 54px);
          font-weight: 300;
          line-height: 1.1;
          margin-bottom: 12px;
          color: ${theme.textColor};
          text-align: center;
        }
        .meaning-box {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 19px;
          font-style: italic;
          line-height: 1.5;
          text-align: center;
          color: ${theme.textColor}e2;
          margin-bottom: 32px;
          padding: 0 10px;
        }
        .divider {
          width: 40px;
          height: 1px;
          background: ${theme.accentColor}44;
          margin: 0 auto 32px;
        }
        .section-title {
          font-size: 10px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: ${theme.accentColor};
          opacity: 0.65;
          margin-bottom: 10px;
          font-weight: 600;
        }
        .section-content {
          font-size: 14px;
          line-height: 1.6;
          color: ${theme.textColor}c0;
          margin-bottom: 28px;
        }
        .bearers-list {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 28px;
        }
        .bearer-tag {
          font-size: 12px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 6px 14px;
          border-radius: 100px;
          color: ${theme.textColor}dd;
        }
        .scripture-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid ${theme.accentColor}22;
          border-radius: 16px;
          padding: 20px;
          margin-bottom: 36px;
          position: relative;
        }
        .scripture-line {
          font-family: 'Noto Serif Devanagari', 'Noto Sans Gurmukhi', Georgia, serif;
          font-size: clamp(15px, 2.5vw, 18px);
          line-height: 1.8;
          color: ${theme.textColor};
          margin-bottom: 12px;
          text-align: center;
          white-space: pre-line;
        }
        .scripture-source {
          font-size: 10px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: ${theme.accentColor};
          opacity: 0.8;
          text-align: center;
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
        .share-tw  { background: rgba(255,255,255,0.07); border-color: rgba(255,255,255,0.18); color: ${theme.textColor}; }
        .share-cp  { background: ${theme.accentColor}20; border-color: ${theme.accentColor}45; color: ${theme.accentColor}; }
        /* CTA */
        .cta-divider { width: 100%; height: 1px; background: rgba(255, 255, 255, 0.06); margin-bottom: 28px; }
        .cta-text {
          font-size: 12px;
          text-align: center;
          opacity: 0.42;
          margin-bottom: 16px;
          line-height: 1.6;
        }
        .cta-btn {
          display: block;
          background: ${theme.accentColor};
          color: #0C0A07;
          font-weight: 700;
          font-size: 13px;
          letter-spacing: 0.04em;
          padding: 13px 32px;
          border-radius: 100px;
          text-decoration: none;
          text-align: center;
          transition: opacity 0.2s;
        }
        .cta-btn:hover { opacity: 0.88; }
        @media (max-width: 480px) {
          .card { padding: 36px 24px 32px; border-radius: 20px; }
        }
      `}</style>

      <div className="card">
        <div className="header">
          <div className="brand">Shoonaya · शून्य</div>
          <div className="trad-symbol">{theme.symbol}</div>
          <div className="trad-label">{theme.label}</div>
          {story.origin_tradition && (
            <div className="origin-badge">{story.origin_tradition}</div>
          )}
          <h1 className="name-title">{displayName}</h1>
          {(story.name_native_script || story.name_transliteration) && (
            <p className="section-content" style={{ textAlign: 'center', marginBottom: 12 }}>
              {[story.name_native_script, story.name_transliteration].filter(Boolean).join(' · ')}
            </p>
          )}
          <p className="meaning-box">“{meaning}”</p>
        </div>

        <div className="divider" />

        <h3 className="section-title">Name Story</h3>
        <p className="section-content">{storyText}</p>

        {(story.inner_quality || story.deity_connection) && (
          <>
            <h3 className="section-title">Inner Quality</h3>
            <p className="section-content">{story.inner_quality || story.deity_connection}</p>
          </>
        )}

        {story.life_blessing && (
          <>
            <h3 className="section-title">Life Blessing</h3>
            <p className="section-content">{story.life_blessing}</p>
          </>
        )}

        {(story.practice_suggestion || story.name_mantra) && (
          <>
            <h3 className="section-title">Practice</h3>
            {story.practice_suggestion && <p className="section-content">{story.practice_suggestion}</p>}
            {story.name_mantra && <p className="meaning-box">“{story.name_mantra}”</p>}
            {story.name_mantra_translation && <p className="section-content">{story.name_mantra_translation}</p>}
          </>
        )}

        {scriptureText && (
          <div className="scripture-card">
            <div className="scripture-line">{scriptureText}</div>
            {story.scripture_source && (
              <div className="scripture-source">— {story.scripture_source}</div>
            )}
          </div>
        )}

        {story.source_note && (
          <p className="section-content">{story.source_note}</p>
        )}

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
            data-copy-url={pageUrl}
            id="copy-btn"
          >
            🔗 Copy Link
          </button>
        </div>

        <div className="cta-divider" />
        <p className="cta-text">
          Shoonaya is the first digital home for Hindu, Sikh, Buddhist &amp; Jain wisdom.<br />
          One home. Four traditions. Launching June 17, 2026.
        </p>
        <Link className="cta-btn" href={ref ? `/?ref=${encodeURIComponent(ref)}&from=name_story` : "/?from=name_story"}>
          Discover Your Name Story →
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
