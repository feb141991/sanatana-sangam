'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { useThemePreference } from '@/components/providers/ThemeProvider';

interface LedgerRow {
  id: string;
  amount: number;
  reason: string;
  source_route?: string;
  metadata?: any;
  created_at: string;
}

interface Props {
  initialLedger: LedgerRow[];
}

const REASON_EMOJIS: Record<string, string> = {
  japa_complete: '📿',
  quiz_complete: '📖',
  new_member_welcome: '🤝',
  scripture_correction: '✏️',
  satsang_hosted: '🕌',
  blessing_shared: '🌟',
};

const REASON_LABELS: Record<string, string> = {
  japa_complete: 'Japa Completed',
  quiz_complete: 'Quiz Completed',
  nitya_karma: 'Nitya Karma Completed',
  pathshala_lesson: 'Pathshala Lesson Completed',
  dharm_veer: 'Dharm Veer Challenge',
  sankalpa_complete: 'Sankalpa Completed',
  seva: 'Seva Contribution',
  referral: 'Referee Joined',
  profile_complete: 'Profile Completed',
  streak_milestone: 'Streak Milestone',
  mala_session: 'Mala Session Completed',
  vrat_complete: 'Vrat Observed',
  sankalpa_milestone: 'Sankalpa Milestone',
  kul_event: 'Kul Event Completed',
  ai_chat_response: 'Dharma Mitra Chat',
  blessing_shared: 'Blessing Shared',
  scripture_correction: 'Translation Corrected',
  new_member_welcome: 'Welcomed Member',
  satsang_hosted: 'Satsang Hosted',
  family_prayer_upload: 'Family Prayer Upload',
  content_flagged: 'Content Error Flagged',
};

export default function LedgerClient({ initialLedger }: Props) {
  const router = useRouter();
  const { resolvedTheme } = useThemePreference();
  const isDark = resolvedTheme === 'dark';

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      // Format as e.g. "4 Jun 2026"
      return d.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  };

  const getEmoji = (reason: string) => {
    return REASON_EMOJIS[reason] || '⭐';
  };

  const getLabel = (reason: string) => {
    return REASON_LABELS[reason] || 'Seva Reward';
  };

  // Theme Variables
  const bgStyle = isDark
    ? 'linear-gradient(165deg, #0e0a05 0%, #17100a 50%, #1a1208 100%)'
    : 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(200, 146, 74, 0.08) 0%, transparent 60%), #FAF6EF';

  const textColor = isDark ? '#F5ECD7' : '#3E2A1F';
  const mutedTextColor = isDark ? 'rgba(245, 236, 215, 0.55)' : 'rgba(62, 42, 31, 0.55)';
  const cardBg = isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.7)';
  const cardBorder = isDark ? 'rgba(200, 146, 74, 0.15)' : 'rgba(200, 160, 110, 0.25)';

  return (
    <div
      className="min-h-screen pb-20 px-4 md:px-6 relative"
      style={{ background: bgStyle, color: textColor }}
    >
      {/* Safe Area Top Spacer */}
      <div style={{ height: 'max(env(safe-area-inset-top, 0px), 16px)' }} />

      {/* Header */}
      <header className="relative flex items-center justify-between py-6 max-w-2xl mx-auto">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full flex items-center justify-center transition-opacity active:opacity-60"
          style={{
            background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(62, 42, 31, 0.06)',
            border: `1px solid ${cardBorder}`,
          }}
          aria-label="Go Back"
        >
          <ArrowLeft size={20} />
        </button>

        <h1
          className="text-2xl font-bold font-serif text-center flex-1"
          style={{ fontFamily: 'var(--font-serif)' }}
        >
          Seva History Ledger
        </h1>

        <div className="w-10" />
      </header>

      {/* Main Ledger List */}
      <main className="max-w-2xl mx-auto mt-6">
        {initialLedger.length === 0 ? (
          <div className="text-center py-16 flex flex-col items-center">
            <span className="text-4xl mb-4">📿</span>
            <p className="font-semibold text-lg">No Seva history yet.</p>
            <p className="text-sm mt-1" style={{ color: mutedTextColor }}>
              Your spiritual practices and community contributions will appear here.
            </p>
          </div>
        ) : (
          <div className="relative pl-6 border-l-2 border-dashed" style={{ borderColor: isDark ? 'rgba(200, 146, 74, 0.3)' : 'rgba(200, 160, 110, 0.4)' }}>
            {initialLedger.map((row, idx) => {
              const isCrossTradition = row.metadata?.cross_tradition === true;
              return (
                <motion.div
                  key={row.id}
                  className="mb-8 relative"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(idx * 0.05, 1.2), duration: 0.4 }}
                >
                  {/* Timeline Bullet Emoji */}
                  <span
                    className="absolute -left-[43px] top-1 w-8 h-8 rounded-full flex items-center justify-center text-lg bg-[#FAF6EF] shadow-sm"
                    style={{
                      backgroundColor: isDark ? '#1a1208' : '#FAF6EF',
                      border: `1.5px solid ${row.amount > 0 ? '#C8924A' : '#888'}`,
                    }}
                  >
                    {getEmoji(row.reason)}
                  </span>

                  {/* Card Content */}
                  <div
                    className="rounded-2xl p-5 shadow-sm transition-all"
                    style={{
                      background: cardBg,
                      border: `1px solid ${cardBorder}`,
                      backdropFilter: 'blur(8px)',
                    }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        {/* Reason / Title */}
                        <h3 className="font-bold text-base leading-snug">
                          {getLabel(row.reason)}
                        </h3>

                        {/* Date */}
                        <p className="text-xs mt-1" style={{ color: mutedTextColor }}>
                          {formatDate(row.created_at)}
                        </p>

                        {/* Extra cross-tradition badge */}
                        {isCrossTradition && (
                          <div className="inline-flex items-center gap-1 mt-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/10 text-teal-600 dark:text-teal-400 dark:bg-teal-500/20">
                            🌏 Cross-tradition +10
                          </div>
                        )}
                      </div>

                      {/* Points earned */}
                      <div className="text-right flex-shrink-0">
                        <span
                          className="text-lg font-bold"
                          style={{ color: '#C8924A' }}
                        >
                          {row.amount > 0 ? `+${row.amount}` : row.amount} Seva points
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
