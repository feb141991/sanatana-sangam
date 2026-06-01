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
    },
    {
      title: t('mandali'),
      description: t('mandaliDesc'),
      href: '/mandali',
      emoji: '👥',
    },
    {
      title: t('kul'),
      description: t('kulDesc'),
      href: '/kul',
      emoji: '🏡',
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

    </div>
  );
}
