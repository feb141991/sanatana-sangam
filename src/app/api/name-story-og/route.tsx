import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { isNameStoryTradition, type NameStoryTradition } from '@/lib/name-story';

export const runtime = 'edge';

const THEMES: Record<NameStoryTradition, {
  bg: string;
  accent: string;
  text: string;
  symbol: string;
  label: string;
}> = {
  hindu: {
    bg: '#160B04',
    accent: '#C5A059',
    text: '#F5E6C9',
    symbol: '🪔',
    label: 'Sanatan Dharma',
  },
  sikh: {
    bg: '#030813',
    accent: '#F1C40F',
    text: '#E8F1F5',
    symbol: '☬',
    label: 'Sikhi',
  },
  buddhist: {
    bg: '#0C060C',
    accent: '#D35400',
    text: '#FADBD8',
    symbol: '☸️',
    label: 'Buddha Dharma',
  },
  jain: {
    bg: '#050A0E',
    accent: '#1ABC9C',
    text: '#E0F2F1',
    symbol: '🤲',
    label: 'Jain Dharma',
  },
  all: {
    bg: '#0F0F10',
    accent: '#C5A059',
    text: '#EAEAEA',
    symbol: '🪔',
    label: 'Dharmic Traditions',
  },
};

function resolveTradition(value: unknown): NameStoryTradition {
  return isNameStoryTradition(value) ? value : 'all';
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error';
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug');
    const format = searchParams.get('format');
    const isSquare = format === 'square' || format === 'story';

    if (!slug) {
      return new Response('Missing slug parameter', { status: 400 });
    }

    const supabase = await createServerSupabaseClient();
    const { data: story, error } = await supabase
      .from('name_stories')
      .select('name_input, normalized_first_name, name_native_script, name_transliteration, meaning_summary, sacred_meaning, tradition, scripture_line, scripture_original, scripture_translation, scripture_source, is_public')
      .eq('share_slug', slug)
      .eq('is_public', true)
      .maybeSingle();

    if (error || !story) {
      return new Response('Name story not found', { status: 404 });
    }

    const tradition = resolveTradition(story.tradition);
    const theme = THEMES[tradition];
    const displayName = story.normalized_first_name || story.name_input;
    const meaning = story.sacred_meaning || story.meaning_summary;

    const shortScripture = story.scripture_translation
      || story.scripture_original
      || story.scripture_line?.split('\n').find((line: string) => line.trim().length > 0)
      || '';

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: theme.bg,
            backgroundImage: `radial-gradient(circle at 50% 120%, ${theme.accent}33 0%, transparent 60%)`,
            color: theme.text,
            padding: isSquare ? '64px' : '40px 80px',
            fontFamily: 'serif',
          }}
        >
          {/* Top Brand Logo & Tradition */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '40px' }}>
            <span style={{ fontSize: '24px', letterSpacing: '0.3em', textTransform: 'uppercase', opacity: 0.6, marginBottom: '20px' }}>
              Shoonaya
            </span>
            <span style={{ fontSize: '64px', marginBottom: '10px' }}>{theme.symbol}</span>
            <span style={{ fontSize: '18px', letterSpacing: '0.2em', textTransform: 'uppercase', color: theme.accent, opacity: 0.9 }}>
              {theme.label}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '24px', maxWidth: '900px' }}>
            <h1 style={{ fontSize: isSquare ? '92px' : '100px', fontWeight: 300, margin: 0, lineHeight: 1.1 }}>
              {displayName}
            </h1>
            {(story.name_native_script || story.name_transliteration) && (
              <p style={{ fontSize: '24px', margin: 0, opacity: 0.62 }}>
                {[story.name_native_script, story.name_transliteration].filter(Boolean).join(' · ')}
              </p>
            )}
            <p style={{ fontSize: isSquare ? '32px' : '36px', fontStyle: 'italic', margin: 0, opacity: 0.9, lineHeight: 1.4 }}>
              &quot;{meaning}&quot;
            </p>
          </div>

          {shortScripture && (
            <div style={{ 
              display: 'flex', 
              marginTop: '60px', 
              padding: '24px 40px', 
              border: `1px solid ${theme.accent}44`, 
              borderRadius: '24px',
              backgroundColor: 'rgba(255,255,255,0.03)'
            }}>
              <span style={{ fontSize: '32px', opacity: 0.8, textAlign: 'center' }}>
                {shortScripture}
              </span>
            </div>
          )}
        </div>
      ),
      {
        width: isSquare ? 1080 : 1200,
        height: isSquare ? 1080 : 630,
      }
    );
  } catch (error: unknown) {
    console.error('[GET /api/name-story-og] Error:', errorMessage(error));
    return new Response('Failed to generate image', {
      status: 500,
    });
  }
}
