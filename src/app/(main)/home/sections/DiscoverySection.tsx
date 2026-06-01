'use client';

import Link from 'next/link';
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
      <MotionStagger className="divine-feature-grid" delay={0.08}>
        {cards.map((item) => (
          <MotionItem key={item.title}>
            <Link href={item.href} className="no-underline">
              <div className="divine-feature-card motion-lift">
                <span className="divine-card-motif" aria-hidden="true" />
                <span
                  className="drop-shadow-md select-none mb-1"
                  style={{ fontSize: '2.2rem', lineHeight: 1, display: 'block' }}
                  aria-hidden="true"
                >
                  {item.emoji}
                </span>
                <span className="divine-feature-title">{item.title}</span>
                <span className="divine-feature-copy">{item.description}</span>
              </div>
            </Link>
          </MotionItem>
        ))}
      </MotionStagger>
    </div>
  );
}
