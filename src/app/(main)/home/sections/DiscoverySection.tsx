'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { MotionItem, MotionStagger } from '@/components/motion/MotionPrimitives';

interface DiscoverySectionProps {
  tradition: string | null;
  isDark: boolean;
  isPro: boolean;
  pathshalaProgress: number;
  pathshalaDoneToday: boolean;
  pathshalaLabel: string;
  pathshalaHref: string;
  isAdmin: boolean;
}

const FEATURE_ICON_BG: Record<string, string> = {
  '/bhakti/mala':               'rgba(197,160,89,0.15)',
  '/pathshala':                 'rgba(107,196,126,0.15)',
  '/panchang':                  'rgba(100,181,246,0.15)',
  '/scoreboard':                'rgba(165,148,224,0.15)',
  '/pathshala?tradition=sikh':  'rgba(0,150,136,0.15)',
  '/bhakti':                    'rgba(197,160,89,0.15)',
  '/mandali':                   'rgba(255,183,77,0.15)',
  '/tirtha-map':                'rgba(255,138,101,0.15)',
};

export function DiscoverySection({
  tradition,
  isDark,
  isPro,
  pathshalaProgress,
  pathshalaDoneToday,
  pathshalaLabel,
  pathshalaHref,
  isAdmin,
}: DiscoverySectionProps) {
  const { t } = useLanguage();

  const cards = [
    {
      title: pathshalaLabel || 'Pathshala',
      description: pathshalaDoneToday ? 'All lessons complete today! 🌟' : 'Continue your pathshala study.',
      href: pathshalaHref || '/pathshala',
      emoji: '📖',
    },
    {
      title: t('tithi'),
      description: t('panchangDesc'),
      href: '/panchang',
      emoji: '📅',
    },
    {
      title: t('mandaliRanks'),
      description: t('mandaliRanksDesc'),
      href: '/scoreboard',
      emoji: '🏆',
    },
    {
      title: t('tirtha'),
      description: t('tirthaDesc'),
      href: '/tirtha-map',
      emoji: '🗺️',
    },
    ...(isAdmin ? [{
      title: 'Moderation Hub',
      description: 'Review reports & safety',
      href: '/admin/moderation',
      emoji: '🛡️',
    }] : []),
  ];

  return (
    <div className="px-4">
      <p
        className="text-[11px] font-bold uppercase tracking-[0.18em] mb-3 px-0"
        style={{ color: 'var(--text-dim)' }}
      >
        {tradition ? `${tradition.charAt(0).toUpperCase() + tradition.slice(1)} Practice` : 'Explore'}
      </p>
      
      <MotionStagger className="divine-feature-grid gap-3" delay={0.08}>
        {cards.map((item) => {
          const bg = FEATURE_ICON_BG[item.href] || 'rgba(197,160,89,0.15)';
          return (
            <MotionItem key={item.title}>
              <Link href={item.href} className="no-underline">
                <div
                  className="divine-feature-card motion-lift relative flex flex-col p-4 rounded-[1.5rem]"
                  style={{
                    minHeight: '120px',
                  }}
                >
                  <span className="divine-card-motif" aria-hidden="true" />
                  
                  {/* Icon container */}
                  <div
                    className="rounded-[14px] flex items-center justify-center flex-shrink-0"
                    style={{
                      width: '56px',
                      height: '56px',
                      background: bg,
                    }}
                  >
                    <span
                      className="select-none"
                      style={{ fontSize: '2.8rem', lineHeight: 1, display: 'block' }}
                      aria-hidden="true"
                    >
                      {item.emoji}
                    </span>
                  </div>

                  {/* Content layout */}
                  <div className="mt-3 flex flex-col gap-1 pr-4">
                    <span
                      className="divine-feature-title font-bold text-[14px] leading-snug"
                      style={{ color: 'var(--text-cream)' }}
                    >
                      {item.title}
                    </span>
                    <span
                      className="divine-feature-copy text-[11px] line-clamp-2 leading-relaxed"
                      style={{ color: 'var(--text-dim)' }}
                    >
                      {item.description}
                    </span>
                  </div>

                  {/* Chevron Right Indicator */}
                  <ChevronRight
                    size={12}
                    className="absolute bottom-4 right-4 opacity-20"
                    style={{ color: 'var(--text-cream)' }}
                  />
                </div>
              </Link>
            </MotionItem>
          );
        })}
      </MotionStagger>
    </div>
  );
}
