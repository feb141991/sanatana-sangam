'use client';

import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { MotionItem, MotionStagger } from '@/components/motion/MotionPrimitives';

interface CommunitySectionProps {
  userId: string;
  userName?: string;
  tradition: string | null;
  isPro: boolean;
  sevaScore: number;
  isDark: boolean;
  onInviteClick?: () => void;
}

export function CommunitySection({
  userId,
  userName,
  tradition,
  isPro,
  sevaScore,
  isDark,
  onInviteClick,
}: CommunitySectionProps) {
  const { t } = useLanguage();

  const cards = [
    {
      title: t('liveDarshan'),
      description: t('liveDarshanDesc'),
      href: '/live-darshan',
      emoji: '📺',
      bg: 'rgba(100,181,246,0.14)',
    },
    {
      title: t('mandali'),
      description: t('mandaliDesc'),
      href: '/mandali',
      emoji: '👥',
      bg: 'rgba(165,148,224,0.14)',
    },
    {
      title: t('kul'),
      description: t('kulDesc'),
      href: '/kul',
      emoji: '🏡',
      bg: 'rgba(255,138,101,0.14)',
    },
  ];

  return (
    <div className="space-y-4">
      {/* ── Community Grid ── */}
      <div className="px-4">
        <MotionStagger className="divine-feature-grid" delay={0.08}>
          {cards.map((item) => (
            <MotionItem key={item.title}>
              <Link href={item.href} className="no-underline">
                <div className="divine-feature-card motion-lift">
                  <span className="divine-card-motif" aria-hidden="true" />
                  <span
                    className="flex items-center justify-center rounded-[1.2rem] mb-1 select-none"
                    style={{
                      width: '3rem',
                      height: '3rem',
                      background: isDark ? item.bg : item.bg.replace('0.14', '0.12'),
                      border: `1px solid ${item.bg.replace('0.14', '0.3')}`,
                    }}
                    aria-hidden="true"
                  >
                    <span style={{
                      fontSize: '1.7rem',
                      lineHeight: 1,
                      filter: 'drop-shadow(0px 3px 5px rgba(0,0,0,0.22)) drop-shadow(0px 1px 2px rgba(0,0,0,0.14))',
                    }}>
                      {item.emoji}
                    </span>
                  </span>
                  <span className="divine-feature-title">{item.title}</span>
                  <span className="divine-feature-copy">{item.description}</span>
                </div>
              </Link>
            </MotionItem>
          ))}
        </MotionStagger>
      </div>

    </div>
  );
}
