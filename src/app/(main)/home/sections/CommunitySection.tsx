'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useLanguage } from '@/lib/i18n/LanguageContext';

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
  isDark,
}: CommunitySectionProps) {
  const { t } = useLanguage();

  const items = [
    { label: t('liveDarshan'), href: '/live-darshan', emoji: '📺', bg: 'rgba(100,181,246,0.14)' },
    { label: t('mandali'),     href: '/mandali',       emoji: '👥', bg: 'rgba(165,148,224,0.14)' },
    { label: 'Seva',           href: '/seva',          emoji: '🤝', bg: 'rgba(100,181,246,0.14)' },
  ];

  return (
    <div className="px-4 mb-4">
      <div className="grid grid-cols-4 gap-2.5">
        {items.map((item, i) => (
          <motion.div
            key={item.label}
            whileTap={{ scale: 0.87 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          >
            <Link
              href={item.href}
              className="flex flex-col items-center gap-1.5 rounded-[1.2rem] py-3 px-1 no-underline"
              style={{
                background: isDark ? item.bg : item.bg.replace('0.14', '0.12'),
                border: `1px solid ${item.bg.replace('0.14', '0.3')}`,
              }}
            >
              <span
                style={{
                  fontSize: '2rem',
                  lineHeight: 1,
                  display: 'block',
                  filter: 'drop-shadow(0px 3px 5px rgba(0,0,0,0.22)) drop-shadow(0px 1px 2px rgba(0,0,0,0.14))',
                }}
              >
                {item.emoji}
              </span>
              <span
                className="text-[10px] font-semibold text-center leading-tight"
                style={{ color: isDark ? 'rgba(240,237,230,0.80)' : 'rgba(30,20,5,0.72)' }}
              >
                {item.label}
              </span>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
