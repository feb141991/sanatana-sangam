import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { resolveWisdomOgContent } from './wisdom-og-content';

export const runtime = 'edge';

const TRADITION_THEMES: Record<string, { bg: string; accent: string; text: string; symbol: string; label: string }> = {
  hindu: {
    bg: '#140A04',
    accent: '#D4A645',
    text: '#FAF6EE',
    symbol: '🪔',
    label: 'Sanatan Dharma',
  },
  sikh: {
    bg: '#040C18',
    accent: '#E6A817',
    text: '#F2F6FA',
    symbol: '☬',
    label: 'Gurmat / Sikhi',
  },
  jain: {
    bg: '#06100E',
    accent: '#2ECC71',
    text: '#EAF7F2',
    symbol: '🤲',
    label: 'Jain Dharma',
  },
  buddhist: {
    bg: '#10060A',
    accent: '#E67E22',
    text: '#FDF2E9',
    symbol: '☸️',
    label: 'Buddha Dharma',
  },
  all: {
    bg: '#0E0906',
    accent: '#D4A645',
    text: '#FAF6EE',
    symbol: '🕉️',
    label: 'Dharmic Wisdom',
  },
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const { title, subtitle, traditionKey, categoryBadge } = resolveWisdomOgContent(searchParams);

    const theme = TRADITION_THEMES[traditionKey] || TRADITION_THEMES.hindu;
    const truncatedSubtitle = subtitle.length > 140 ? `${subtitle.slice(0, 137)}...` : subtitle;

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            backgroundColor: theme.bg,
            backgroundImage: `radial-gradient(circle at 50% 115%, ${theme.accent}30 0%, transparent 65%)`,
            padding: '56px 72px',
            color: theme.text,
            fontFamily: 'serif',
            position: 'relative',
          }}
        >
          {/* Inner Golden Border */}
          <div
            style={{
              position: 'absolute',
              top: '24px',
              left: '24px',
              right: '24px',
              bottom: '24px',
              border: `1px solid ${theme.accent}40`,
              borderRadius: '16px',
              pointerEvents: 'none',
            }}
          />

          {/* Top Header: Brand & Category Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '32px' }}>{theme.symbol}</span>
              <span
                style={{
                  fontSize: '24px',
                  fontWeight: 700,
                  letterSpacing: '3px',
                  color: theme.accent,
                  textTransform: 'uppercase',
                }}
              >
                SHOONAYA • शून्यता
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: `${theme.accent}22`,
                border: `1px solid ${theme.accent}66`,
                borderRadius: '999px',
                padding: '8px 20px',
                fontSize: '18px',
                fontWeight: 600,
                color: theme.accent,
                letterSpacing: '1px',
              }}
            >
              {categoryBadge}
            </div>
          </div>

          {/* Center Main Content */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              margin: 'auto 0',
              maxWidth: '1000px',
            }}
          >
            <div
              style={{
                fontSize: title.length > 40 ? '48px' : '56px',
                fontWeight: 800,
                lineHeight: 1.15,
                color: '#FFFFFF',
                textShadow: '0 4px 20px rgba(0,0,0,0.8)',
              }}
            >
              {title}
            </div>

            <div
              style={{
                fontSize: '24px',
                lineHeight: 1.4,
                color: '#D8C7B5',
                maxHeight: '96px',
                overflow: 'hidden',
              }}
            >
              {truncatedSubtitle}
            </div>
          </div>

          {/* Bottom Footer: Tradition Label & Domain */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              borderTop: `1px solid ${theme.accent}25`,
              paddingTop: '20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px', color: theme.accent }}>✦</span>
              <span style={{ fontSize: '18px', color: '#D8C7B5', letterSpacing: '0.5px' }}>
                {theme.label}
              </span>
            </div>

            <div
              style={{
                fontSize: '18px',
                fontWeight: 600,
                color: theme.accent,
                letterSpacing: '1px',
              }}
            >
              www.shoonaya.com
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        headers: {
          'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000',
        },
      }
    );
  } catch (err: any) {
    return new Response(`OG generation error: ${err?.message || 'unknown'}`, { status: 500 });
  }
}
