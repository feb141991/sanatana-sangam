'use client';

import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronRight, Sparkles } from 'lucide-react';
import MoodPulse from '@/components/mood/MoodPulse';
import SankalpaBanner from '@/components/home/SankalpaBanner';
import SacredIcon from '@/components/ui/SacredIcon';
import { TRADITION_META, type DharmVeer } from '@/lib/dharm-veer';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { getTraditionMeta } from '@/lib/tradition-config';

interface DailyDharmaStackState {
  japaBeads: number;
  japaRounds: number;
  quizDone: boolean;
  dharmVeerDone: boolean;
  stotramDone: boolean;
  kathaDone: boolean;
  pathshalaProgress: number;
}

interface SadhanaSectionProps {
  userId: string;
  userName: string;
  tradition: string | null;
  sampradaya: string | null;
  isPro: boolean;
  japaAlreadyDoneToday: boolean;
  nityaDoneToday: boolean;
  activeSankalpa: { id: string; text: string; start_date: string; end_date: string; tradition: string; related_practice?: string | null } | null;
  sankalpaCheckedToday: boolean;
  onSankalpaCheckin: () => void;
  onSetSankalpa: () => void;
  onSankalpaComplete: () => void;
  isDark: boolean;
  readToday: boolean;
  dailyDharmaStackState: DailyDharmaStackState;
  dharmVeer: DharmVeer;
  appLanguage: string;
  onOpenMoodJourney: (moodKey: string) => void;
  onDismissMood: () => void;
  backendMoodState: any;
  quiz: any;
  quizAnswered: number | null;
  quizStreak: number;
  onOpenQuiz: () => void;
}

export function SadhanaSection({
  userId,
  userName,
  tradition,
  sampradaya,
  isPro,
  japaAlreadyDoneToday,
  nityaDoneToday,
  activeSankalpa,
  sankalpaCheckedToday,
  onSankalpaCheckin,
  onSetSankalpa,
  onSankalpaComplete,
  isDark,
  readToday,
  dailyDharmaStackState,
  dharmVeer,
  appLanguage,
  onOpenMoodJourney,
  onDismissMood,
  backendMoodState,
  quiz,
  quizAnswered,
  quizStreak,
  onOpenQuiz,
}: SadhanaSectionProps) {
  const { t } = useLanguage();
  const meta = getTraditionMeta(tradition);
  const effectiveAppLanguage = appLanguage === 'hi' || appLanguage === 'pa' ? appLanguage : 'en';

  const dharmVeerTradMeta = TRADITION_META[dharmVeer.tradition] ?? TRADITION_META['hindu'];

  return (
    <>
      {/* ── Mood Check-In Card ───────────────────────────────────────────── */}
      <MoodPulse 
        userName={userName}
        tradition={tradition}
        onOpen={onOpenMoodJourney}
        onDismiss={onDismissMood}
        backendState={backendMoodState}
      />

      {/* ── Sankalpa Banner ── */}
      <div className="px-4 mb-2">
        <SankalpaBanner
          sankalpa={activeSankalpa ?? null}
          tradition={tradition ?? 'hindu'}
          onSet={onSetSankalpa}
          onComplete={onSankalpaComplete}
          checkedToday={sankalpaCheckedToday}
          onCheckin={onSankalpaCheckin}
          relatedPractice={activeSankalpa?.related_practice ?? null}
        />
      </div>

      {/* ── Dharm Veer Card ── */}
      <AnimatePresence>
        {!dailyDharmaStackState.dharmVeerDone && (
          <motion.div
            key="dharm-veer-card"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
            className="group relative hover:scale-[1.02] transition-transform duration-300 block overflow-hidden"
            style={{
              background: isDark ? 'linear-gradient(145deg, #1C150A, #1A1208)' : 'linear-gradient(145deg, rgba(255, 253, 248, 0.94), rgba(255, 253, 248, 0.94))',
              border: isDark ? '1px solid rgba(197,160,89,0.15)' : '1px solid rgba(157, 100, 60, 0.15)',
              borderRadius: '16px',
              margin: '0 16px 10px',
              boxShadow: isDark ? '0 8px 32px rgba(0, 0, 0, 0.25)' : '0 8px 32px rgba(157, 100, 60, 0.05)',
            }}
          >
            <Link
              href={`/dharm-veer/${dharmVeer.id}`}
              className="flex items-center gap-3 w-full px-4 py-3.5 pr-6 text-left no-underline"
            >
              <span aria-hidden="true" className="text-[26px] leading-none shrink-0">
                <SacredIcon name="sparkles" size={18} />
              </span>
              <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                <span className="font-serif tracking-[0.01em]" style={{ fontSize: '15px', fontWeight: 700, color: isDark ? '#F0EDE6' : '#1a140e' }}>
                  {effectiveAppLanguage !== 'en' && dharmVeer.nameLocal ? dharmVeer.nameLocal : dharmVeer.name}
                </span>
                <span className="line-clamp-1" style={{ fontSize: '12px', lineHeight: 1.45, color: isDark ? 'rgba(240,220,180,0.55)' : 'rgba(60, 45, 28, 0.75)' }}>
                  {effectiveAppLanguage !== 'en' && dharmVeerTradMeta.dharmVeerLocal ? dharmVeerTradMeta.dharmVeerLocal : t('journeyLabel')} · {effectiveAppLanguage !== 'en' && dharmVeerTradMeta.labelLocal ? dharmVeerTradMeta.labelLocal : dharmVeerTradMeta.label}
                </span>
              </div>
              <ChevronRight size={16} color="#C5A059" className="shrink-0" aria-hidden="true" />
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Daily Quiz Spark Card ── */}
      <AnimatePresence>
        {quiz && quiz !== 'loading' && quiz !== 'error' && quizAnswered === null && (
          <motion.div
            key="quiz-spark-teaser"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.38 }}
            className="quiz-spark-card compact cursor-pointer group mb-3 mx-4"
            onClick={onOpenQuiz}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[rgba(197,160,89,0.12)] flex items-center justify-center">
                  <SacredIcon name="brain" size={16} />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--brand-primary)] opacity-80">
                    {tradition ? `${tradition} ${effectiveAppLanguage === 'hi' ? 'क्विज़' : effectiveAppLanguage === 'pa' ? 'ਕੁਇਜ਼' : 'Quiz'}` : effectiveAppLanguage === 'hi' ? 'क्या आप जानते हैं?' : effectiveAppLanguage === 'pa' ? 'ਕੀ ਤੁਸੀਂ ਜਾਣਦੇ ਹੋ?' : 'Do You Know?'}
                  </span>
                  <h3 className="text-sm font-bold theme-ink line-clamp-1 mt-0.5">{quiz.question}</h3>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {quizStreak > 1 && (
                  <span className="flex items-center gap-0.5 text-[11px] font-bold" style={{ color: 'var(--brand-primary)' }}>
                    <SacredIcon name="flame" size={11} />{quizStreak}
                  </span>
                )}
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Play →
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Quick Access pills ── */}
      <div className="px-4 mb-4">
        <div
          className="flex gap-2 overflow-x-auto pb-0.5"
          style={{ scrollbarWidth: 'none' } as React.CSSProperties}
        >
          {[
            { emoji: '🧘', label: 'Nitya',    href: '/nitya-karma' },
            { emoji: '🧠', label: 'Quiz',     href: '/quiz' },
            { emoji: '✨', label: 'AI Guide',  href: '/ai-chat' },
            { emoji: '📈', label: 'Progress', href: '/my-progress' },
            { emoji: '🛕', label: 'Tirtha',   href: '/tirtha-map' },
            { emoji: '🪔', label: 'Sanskar',  href: '/kul/sanskara' },
            { emoji: '🤝', label: 'Seva',     href: '/seva' },
          ].map(item => (
            <Link
              key={item.label}
              href={item.href}
              className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full border transition-transform active:scale-95"
              style={{
                background:   isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,253,246,0.88)',
                borderColor:  isDark ? 'rgba(197,160,89,0.18)' : 'rgba(197,160,89,0.22)',
                textDecoration: 'none',
              }}
            >
              <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>{item.emoji}</span>
              <span
                className="text-[12px] font-semibold"
                style={{ color: isDark ? 'rgba(240,237,230,0.85)' : 'rgba(30,20,5,0.78)' }}
              >
                {item.label}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Post-japa Dharma Mitra nudge ── */}
      {japaAlreadyDoneToday && !isPro && (
        <div className="px-4 mb-4">
          <Link
            href="/ai-chat"
            className="flex items-center gap-3 rounded-2xl px-4 py-3 transition-all active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, rgba(139,92,246,0.12) 0%, rgba(139,92,246,0.05) 100%)',
              border: '1px solid rgba(139,92,246,0.25)',
            }}
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-base"
              style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.25)' }}
            >
              ✨
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold leading-tight" style={{ color: 'rgba(255,255,255,0.88)' }}>
                Ask Dharma Mitra about today&apos;s mantra
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: 'rgba(139,92,246,0.75)' }}>
                5 free questions daily · Unlimited with Zenith
              </p>
            </div>
            <ChevronRight size={14} style={{ color: 'rgba(139,92,246,0.55)', flexShrink: 0 }} />
          </Link>
        </div>
      )}
    </>
  );
}
