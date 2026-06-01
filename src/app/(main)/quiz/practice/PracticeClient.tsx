'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, RotateCcw, CheckCircle2, XCircle, Zap, Loader2 } from 'lucide-react';
import { getTraditionMeta } from '@/lib/tradition-config';
import { useLanguage } from '@/lib/i18n/LanguageContext';

// ── Types ─────────────────────────────────────────────────────────────────────

interface PracticeQuestion {
  question:    string;
  options:     string[];
  answerIndex: number;
  explanation: string;
  fact:        string;
  source:      string;
}

type Stage = 'setup' | 'loading' | 'playing' | 'summary' | 'error';

interface Props {
  userId:            string;
  tradition:         string;
  initialTopic:      string | null;
  initialDifficulty: string | null;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const TOPICS = [
  { key: 'deities',    emoji: '🙏', label: 'Deities & Stories',   color: '#C5A059' },
  { key: 'scriptures', emoji: '📖', label: 'Scriptures & Texts',   color: '#9898dd' },
  { key: 'philosophy', emoji: '🧘', label: 'Philosophy',           color: '#7aab7a' },
  { key: 'festivals',  emoji: '🪔', label: 'Festivals & Calendar', color: '#d4843a' },
  { key: 'geography',  emoji: '🗺️', label: 'Sacred Geography',    color: '#6aadad' },
  { key: 'sanskrit',   emoji: '🔤', label: 'Sanskrit & Language',  color: '#ad7ad4' },
] as const;

type TopicKey = typeof TOPICS[number]['key'];

const DIFFICULTIES = [
  { key: 'seeker',  emoji: '🌱', label: 'Seeker',  desc: 'Accessible facts for curious beginners' },
  { key: 'gyani',   emoji: '🧿', label: 'Gyani',   desc: 'Nuanced knowledge for dedicated learners' },
  { key: 'pandit',  emoji: '🏵️', label: 'Pandit',  desc: 'Specialist-grade, rare and scholarly' },
] as const;

type DifficultyKey = typeof DIFFICULTIES[number]['key'];

const glass = {
  background: 'var(--surface-soft)',
  backdropFilter: 'blur(12px)',
  border: '1px solid rgba(197, 160, 89,0.15)',
} as const;

// ── Setup Screen ──────────────────────────────────────────────────────────────

function SetupScreen({
  tradition,
  initialTopic,
  initialDifficulty,
  onStart,
}: {
  tradition: string;
  initialTopic: string | null;
  initialDifficulty: string | null;
  onStart: (topic: TopicKey, difficulty: DifficultyKey) => void;
}) {
  const meta = getTraditionMeta(tradition);
  const [topic,      setTopic]      = useState<TopicKey | null>((initialTopic as TopicKey) ?? null);
  const [difficulty, setDifficulty] = useState<DifficultyKey>((initialDifficulty as DifficultyKey) ?? 'seeker');
  const [practiceSessions, setPracticeSessions] = useState<any[]>([]);
  const { lang, t } = useLanguage();
  const effectiveAppLanguage = lang === 'hi' || lang === 'pa' ? lang : 'en';

  useEffect(() => {
    fetch('/api/quiz/stats')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.practice_sessions) setPracticeSessions(d.practice_sessions);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen pb-28 px-5" style={{ background: 'var(--divine-bg)', color: 'var(--brand-ink)' }}>
      {/* Back */}
      <div className="pt-safe pt-4 mb-6">
        <Link href="/quiz"
          className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest transition-opacity hover:opacity-70"
          style={{ color: 'var(--brand-muted)' }}>
          <ChevronLeft size={12} /> {effectiveAppLanguage === 'hi' ? 'महारत' : effectiveAppLanguage === 'pa' ? 'ਮਹਾਰਤ' : 'Mastery'}
        </Link>
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.38 }}>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ background: `${meta.accentColour}22` }}>
            <Zap size={18} style={{ color: meta.accentColour }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-serif)' }}>{effectiveAppLanguage === 'hi' ? 'अभ्यास मोड' : effectiveAppLanguage === 'pa' ? 'ਅਭਿਆਸ ਮੋਡ' : 'Practice Mode'}</h1>
            <p className="text-[12px]" style={{ color: 'var(--brand-muted)' }}>{effectiveAppLanguage === 'hi' ? '5 प्रश्न · 8 कर्म अंक प्रति सही उत्तर' : effectiveAppLanguage === 'pa' ? '5 ਸਵਾਲ · 8 ਕਰਮ ਅੰਕ ਹਰੇਕ ਸਹੀ ਉੱਤਰ ਲਈ' : '5 questions · Earn 8 karma each correct'}</p>
          </div>
        </div>

        {/* Topic picker */}
        <h2 className="text-[11px] font-bold uppercase tracking-[0.16em] mt-8 mb-3" style={{ color: 'var(--brand-muted)' }}>
          {effectiveAppLanguage === 'hi' ? 'विषय चुनें' : effectiveAppLanguage === 'pa' ? 'ਵਿਸ਼ਾ ਚੁਣੋ' : 'Choose Topic'}
        </h2>
        <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
          {TOPICS.map(tItem => {
            const topicSessions = practiceSessions.filter((s: any) => s.topic === tItem.key);
            const topicTotal    = topicSessions.reduce((a: number, s: any) => a + s.questions_total, 0);
            const topicCorrect  = topicSessions.reduce((a: number, s: any) => a + s.questions_correct, 0);
            const mastery       = topicTotal > 0 ? Math.round((topicCorrect / topicTotal) * 100) : 0;
            const isSelected    = topic === tItem.key;

            return (
              <button key={tItem.key}
                onClick={() => setTopic(tItem.key)}
                className="flex-shrink-0 w-36 flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all active:scale-95"
                style={{
                  background: isSelected ? `${tItem.color}18` : 'var(--surface-soft)',
                  borderColor: isSelected ? `${tItem.color}50` : 'rgba(197,160,89,0.15)',
                }}
              >
                <svg width="44" height="44" viewBox="0 0 44 44">
                  <circle cx="22" cy="22" r="18" fill="none"
                    stroke="rgba(128,128,128,0.15)" strokeWidth="3" />
                  <circle cx="22" cy="22" r="18" fill="none"
                    stroke={tItem.color} strokeWidth="3"
                    strokeDasharray={`${2 * Math.PI * 18}`}
                    strokeDashoffset={`${2 * Math.PI * 18 * (1 - mastery / 100)}`}
                    strokeLinecap="round"
                    transform="rotate(-90 22 22)"
                    style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                  />
                  <text x="22" y="26" textAnchor="middle"
                    fontSize="11" fontWeight="700" fill={tItem.color}>
                    {mastery}%
                  </text>
                </svg>
                <span className="text-[11px] font-bold text-center leading-snug"
                  style={{ color: isSelected ? tItem.color : 'var(--text-cream)' }}>
                  {tItem.emoji} {tItem.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Difficulty picker */}
        <h2 className="text-[11px] font-bold uppercase tracking-[0.16em] mb-3" style={{ color: 'var(--brand-muted)' }}>
          {effectiveAppLanguage === 'hi' ? 'कठिनाई चुनें' : effectiveAppLanguage === 'pa' ? 'ਮੁਸ਼ਕਲ ਚੁਣੋ' : 'Choose Difficulty'}
        </h2>
        <div className="space-y-2.5 mb-10">
          {DIFFICULTIES.map((dItem) => (
            <button
              key={dItem.key}
              onClick={() => setDifficulty(dItem.key)}
              className="w-full flex items-center gap-4 rounded-2xl p-4 text-left transition-all"
              style={{
                background: difficulty === dItem.key ? 'rgba(197, 160, 89,0.2)' : 'var(--surface-soft)',
                border: difficulty === dItem.key ? '1px solid rgba(197, 160, 89,0.5)' : '1px solid rgba(197, 160, 89,0.15)',
              }}
            >
              <span className="text-xl" aria-hidden="true">{dItem.emoji}</span>
              <div>
                <p className="text-[14px] font-bold" style={{ color: difficulty === dItem.key ? 'var(--brand-primary)' : 'var(--brand-ink)' }}>
                  {dItem.label}
                </p>
                <p className="text-[11px] leading-snug" style={{ color: 'var(--brand-muted)' }}>{dItem.desc}</p>
              </div>
              {difficulty === dItem.key && (
                <CheckCircle2 size={16} className="ml-auto flex-shrink-0" style={{ color: 'var(--brand-primary)' }} />
              )}
            </button>
          ))}
        </div>

        <button
          onClick={() => topic && onStart(topic, difficulty)}
          disabled={!topic}
          className="w-full py-4 rounded-[1.4rem] font-bold text-[15px] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: topic ? `linear-gradient(135deg, var(--brand-primary), var(--brand-primary-strong))` : 'var(--surface-soft)', color: topic ? 'var(--divine-bg)' : 'var(--brand-muted)' }}
        >
          {topic ? `${effectiveAppLanguage === 'hi' ? 'शुरू करें' : effectiveAppLanguage === 'pa' ? 'ਸ਼ੁਰੂ ਕਰੋ' : 'Start'} — ${TOPICS.find(tItem => tItem.key === topic)?.label}` : effectiveAppLanguage === 'hi' ? 'शुरू करने के लिए एक विषय चुनें' : effectiveAppLanguage === 'pa' ? 'ਸ਼ੁਰੂ ਕਰਨ ਲਈ ਇੱਕ ਵਿਸ਼ਾ ਚੁਣੋ' : 'Select a topic to begin'}
        </button>
      </motion.div>
    </div>
  );
}

// ── Question Screen ────────────────────────────────────────────────────────────

function QuestionScreen({
  question,
  questionNumber,
  total,
  topic,
  fallbackLanguage,
  onAnswer,
}: {
  question: PracticeQuestion;
  questionNumber: number;
  total: number;
  topic: TopicKey;
  fallbackLanguage?: string;
  onAnswer: (isCorrect: boolean) => void;
}) {
  const [chosen, setChosen] = useState<number | null>(null);
  const topicMeta = TOPICS.find(t => t.key === topic)!;
  const { lang } = useLanguage();
  const effectiveAppLanguage = lang === 'hi' || lang === 'pa' ? lang : 'en';

  function handleAnswer(idx: number) {
    if (chosen !== null) return;
    setChosen(idx);
    // Auto-advance after 1.8s
    setTimeout(() => onAnswer(idx === question.answerIndex), 1800);
  }

  return (
    <motion.div
      key={questionNumber}
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="min-h-screen pb-28 px-5"
      style={{ background: 'var(--divine-bg)', color: 'var(--brand-ink)' }}
    >
      {/* Header */}
      <div className="pt-safe pt-4 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl" aria-hidden="true">{topicMeta.emoji}</span>
            <span className="text-[12px] font-bold uppercase tracking-widest" style={{ color: topicMeta.color }}>
              {topicMeta.label}
            </span>
          </div>
          <div className="px-3 py-1 rounded-full text-[11px] font-bold" style={{ background: 'var(--surface-soft)' }}>
            {questionNumber} / {total}
          </div>
        </div>

        {fallbackLanguage === 'en' && effectiveAppLanguage !== 'en' && (
          <div className="mt-4 text-[11px] py-2 px-3 rounded-lg flex items-start gap-2" style={{ backgroundColor: 'rgba(212, 120, 74, 0.08)', color: 'var(--brand-primary-strong)' }}>
            <span className="shrink-0 mt-0.5">🌐</span>
            <p>{effectiveAppLanguage === 'hi' ? 'यह प्रश्न अभी केवल अंग्रेजी में उपलब्ध है।' : 'ਇਹ ਸਵਾਲ ਅਜੇ ਸਿਰਫ਼ ਅੰਗਰੇਜ਼ੀ ਵਿੱਚ ਉਪਲਬਧ ਹੈ।'}</p>
          </div>
        )}
      </div>

      {/* Question */}
      <h2 className="text-2xl font-semibold mb-8 leading-snug" style={{ fontFamily: 'var(--font-serif)' }}>
        {question.question}
      </h2>

      {/* Options */}
      <div className="space-y-3 mb-8">
        {question.options.map((opt, idx) => {
          let state: 'idle' | 'correct' | 'incorrect' = 'idle';
          if (chosen !== null) {
            if (idx === question.answerIndex) state = 'correct';
            else if (idx === chosen) state = 'incorrect';
          }

          let bg = 'var(--surface-soft)';
          let border = '1px solid rgba(197, 160, 89,0.15)';
          let color = 'var(--brand-ink)';
          if (state === 'correct') {
            bg = 'rgba(197, 160, 89,0.2)';
            border = '1px solid rgba(197, 160, 89,0.5)';
            color = 'var(--brand-primary)';
          } else if (state === 'incorrect') {
            bg = 'rgba(200,80,80,0.1)';
            border = '1px solid rgba(200,80,80,0.3)';
            color = '#cd7a7a';
          } else if (chosen !== null) {
            color = 'var(--brand-muted)';
          }

          return (
            <button
              key={idx}
              onClick={() => handleAnswer(idx)}
              className="w-full text-left p-4 rounded-[1.4rem] flex items-center justify-between transition-all"
              style={{ background: bg, border, color }}
            >
              <span className="text-[15px] font-medium leading-tight pr-4">{opt}</span>
              {state === 'correct' && <CheckCircle2 size={18} className="flex-shrink-0" />}
              {state === 'incorrect' && <XCircle size={18} className="flex-shrink-0" />}
            </button>
          );
        })}
      </div>

      {/* Explanation Reveal */}
      <AnimatePresence>
        {chosen !== null && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-5 rounded-[1.4rem] border" style={{ background: 'var(--surface-soft)', borderColor: 'var(--surface-soft)' }}>
              <p className="text-[14px] leading-relaxed mb-3" style={{ color: 'var(--brand-muted)' }}>
                {question.explanation}
              </p>
              <div className="flex gap-2 p-3 rounded-xl" style={{ background: 'rgba(197, 160, 89,0.08)' }}>
                <span className="text-lg leading-none" aria-hidden="true">💡</span>
                <p className="text-[13px] leading-relaxed" style={{ color: 'var(--brand-primary-light)' }}>
                  {question.fact}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Summary Screen ─────────────────────────────────────────────────────────────

function SummaryScreen({
  correct,
  total,
  topic,
  difficulty,
  karmaEarned,
  onPlayAgain,
}: {
  correct:     number;
  total:       number;
  topic:       TopicKey;
  difficulty:  DifficultyKey;
  karmaEarned: number;
  onPlayAgain: () => void;
}) {
  const topicMeta = TOPICS.find(t => t.key === topic)!;
  const pct = Math.round((correct / total) * 100);
  const { lang } = useLanguage();
  const effectiveAppLanguage = lang === 'hi' || lang === 'pa' ? lang : 'en';

  const message = pct === 100 ? (effectiveAppLanguage === 'hi' ? 'बिल्कुल सही! आप एक सच्चे पंडित हैं! 🏵️' : effectiveAppLanguage === 'pa' ? 'ਬਿਲਕੁਲ ਸਹੀ! ਤੁਸੀਂ ਸੱਚੇ ਪੰਡਿਤ ਹੋ! 🏵️' : 'Perfect score! You\'re a true Pandit! 🏵️')
    : pct >= 80 ? (effectiveAppLanguage === 'hi' ? 'उत्कृष्ट! आपमें गहरा ज्ञान है। 🧿' : effectiveAppLanguage === 'pa' ? 'ਬਹੁਤ ਵਧੀਆ! ਤੁਹਾਡੇ ਕੋਲ ਡੂੰਘਾ ਗਿਆਨ ਹੈ। 🧿' : 'Excellent! Deep knowledge flows through you. 🧿')
    : pct >= 60 ? (effectiveAppLanguage === 'hi' ? 'अच्छा प्रयास! अपनी समझ बढ़ाने के लिए अध्ययन करते रहें। 🪔' : effectiveAppLanguage === 'pa' ? 'ਵਧੀਆ ਕੋਸ਼ਿਸ਼! ਆਪਣੀ ਸਮਝ ਵਧਾਉਣ ਲਈ ਅਧਿਐਨ ਕਰਦੇ ਰਹੋ। 🪔' : 'Good effort! Keep studying to deepen your understanding. 🪔')
    : (effectiveAppLanguage === 'hi' ? 'हर प्रश्न एक सबक है। कल फिर वापस आएं! 🌱' : effectiveAppLanguage === 'pa' ? 'ਹਰ ਸਵਾਲ ਇੱਕ ਸਬਕ ਹੈ। ਕੱਲ੍ਹ ਫਿਰ ਵਾਪਸ ਆਓ! 🌱' : 'Every question is a lesson. Return again tomorrow! 🌱');

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.42, ease: [0.34, 1.26, 0.64, 1] }}
      className="min-h-screen pb-28 px-5 flex flex-col"
      style={{ background: 'var(--divine-bg)', color: 'var(--brand-ink)' }}
    >
      <div className="pt-safe pt-12 flex-1 flex flex-col items-center justify-center text-center">
        {/* Score circle */}
        <div
          className="w-32 h-32 rounded-full flex flex-col items-center justify-center mb-6"
          style={{
            background: pct >= 80 ? 'rgba(100,200,100,0.12)' : pct >= 60 ? 'rgba(197, 160, 89,0.2)' : 'rgba(200,80,80,0.10)',
            border: pct >= 80 ? '2px solid rgba(100,200,100,0.40)' : pct >= 60 ? '2px solid rgba(197, 160, 89,0.40)' : '2px solid rgba(200,80,80,0.30)',
          }}
        >
          <p className="text-4xl font-bold" style={{ fontFamily: 'var(--font-serif)', color: pct >= 80 ? '#7acd7a' : pct >= 60 ? 'var(--brand-primary)' : '#cd7a7a' }}>
            {correct}/{total}
          </p>
          <p className="text-[12px] font-bold" style={{ color: 'var(--brand-muted)' }}>{pct}%</p>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl" aria-hidden="true">{topicMeta.emoji}</span>
          <span className="text-[13px] font-semibold" style={{ color: topicMeta.color }}>{topicMeta.label}</span>
        </div>

        <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'var(--font-serif)' }}>{effectiveAppLanguage === 'hi' ? 'सत्र पूर्ण' : effectiveAppLanguage === 'pa' ? 'ਸੈਸ਼ਨ ਪੂਰਾ' : 'Session Complete'}</h2>
        <p className="text-[14px] leading-relaxed max-w-xs mx-auto mb-6" style={{ color: 'var(--brand-muted)' }}>
          {message}
        </p>

        {/* Karma earned */}
        <div
          className="rounded-2xl px-6 py-4 mb-8"
          style={{ background: 'rgba(197, 160, 89,0.10)', border: '1px solid rgba(197, 160, 89,0.22)' }}
        >
          <p className="text-3xl font-bold" style={{ fontFamily: 'var(--font-serif)', color: 'var(--brand-primary)' }}>
            +{karmaEarned} ✨
          </p>
          <p className="text-[11px] font-bold uppercase tracking-widest mt-0.5" style={{ color: 'var(--brand-muted)' }}>
            {effectiveAppLanguage === 'hi' ? 'कर्म अंक' : effectiveAppLanguage === 'pa' ? 'ਕਰਮ ਅੰਕ' : 'Karma Earned'}
          </p>
        </div>

        {/* Actions */}
        <div className="w-full max-w-sm space-y-3">
          <button
            onClick={onPlayAgain}
            className="w-full py-4 rounded-[1.4rem] font-bold text-[15px] flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-primary-strong))', color: 'var(--divine-bg)' }}
          >
            <RotateCcw size={16} />
            {effectiveAppLanguage === 'hi' ? 'फिर अभ्यास करें' : effectiveAppLanguage === 'pa' ? 'ਫਿਰ ਅਭਿਆਸ ਕਰੋ' : 'Practice Again'}
          </button>
          <Link
            href="/quiz"
            className="block w-full py-4 rounded-[1.4rem] font-bold text-[15px] text-center"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', color: 'var(--brand-muted)' }}
          >
            {effectiveAppLanguage === 'hi' ? 'महारत पर वापस' : effectiveAppLanguage === 'pa' ? 'ਮਹਾਰਤ ਤੇ ਵਾਪਸ' : 'Back to Mastery'}
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

// ── Main PracticeClient ────────────────────────────────────────────────────────

export default function PracticeClient({ userId, tradition, initialTopic, initialDifficulty }: Props) {
  const [stage,      setStage]      = useState<Stage>('setup');
  const [questions,  setQuestions]  = useState<PracticeQuestion[]>([]);
  const [currentQ,   setCurrentQ]   = useState(0);
  const [correct,    setCorrect]    = useState(0);
  const [topic,      setTopic]      = useState<TopicKey | null>((initialTopic as TopicKey) ?? null);
  const [difficulty, setDifficulty] = useState<DifficultyKey>('seeker');
  const [karmaEarned, setKarmaEarned] = useState(0);
  const [fallbackLanguage, setFallbackLanguage] = useState<string | undefined>();
  const { lang } = useLanguage();
  const appLanguage = lang === 'hi' || lang === 'pa' ? lang : 'en';

  const startSession = useCallback(async (t: TopicKey, d: DifficultyKey) => {
    setTopic(t);
    setDifficulty(d);
    setStage('loading');
    setCurrentQ(0);
    setCorrect(0);

    try {
      const res = await fetch(`/api/quiz/practice?tradition=${tradition}&topic=${t}&difficulty=${d}&language=${appLanguage}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setQuestions(data.questions);
      setFallbackLanguage(data.fallbackLanguage);
      setStage('playing');
    } catch (err) {
      console.error('[practice] Failed to load questions:', err);
      setStage('error');
    }
  }, [tradition, appLanguage]);

  const handleAnswer = useCallback(async (isCorrect: boolean) => {
    const newCorrect = correct + (isCorrect ? 1 : 0);

    if (currentQ + 1 >= questions.length) {
      // Session complete — save
      const karma = newCorrect * 8;
      setCorrect(newCorrect);
      setKarmaEarned(karma);
      setStage('summary');

      try {
        await fetch('/api/quiz/practice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tradition,
            topic,
            difficulty,
            questions_correct: newCorrect,
            questions_total:   questions.length,
          }),
        });
      } catch { /* non-fatal */ }
    } else {
      setCorrect(newCorrect);
      setCurrentQ(q => q + 1);
    }
  }, [correct, currentQ, questions.length, tradition, topic, difficulty]);

  const reset = () => {
    setStage('setup');
    setQuestions([]);
    setCurrentQ(0);
    setCorrect(0);
  };

  return (
    <AnimatePresence mode="wait">
      {stage === 'setup' && (
        <SetupScreen
          key="setup"
          tradition={tradition}
          initialTopic={initialTopic}
          initialDifficulty={initialDifficulty}
          onStart={startSession}
        />
      )}

      {stage === 'loading' && (
        <motion.div
          key="loading"
          className="fixed inset-0 flex flex-col items-center justify-center gap-4"
          style={{ background: 'var(--divine-bg)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <Loader2 size={32} className="animate-spin" style={{ color: 'var(--brand-primary)' }} />
          <p className="text-[14px]" style={{ color: 'var(--brand-muted)' }}>
            Generating questions…
          </p>
        </motion.div>
      )}

      {stage === 'playing' && questions[currentQ] && (
        <QuestionScreen
          key={`q-${currentQ}`}
          question={questions[currentQ]}
          questionNumber={currentQ + 1}
          total={questions.length}
          topic={topic!}
          fallbackLanguage={fallbackLanguage}
          onAnswer={handleAnswer}
        />
      )}

      {stage === 'summary' && (
        <SummaryScreen
          key="summary"
          correct={correct}
          total={questions.length}
          topic={topic!}
          difficulty={difficulty}
          karmaEarned={karmaEarned}
          onPlayAgain={reset}
        />
      )}

      {stage === 'error' && (
        <motion.div
          key="error"
          className="fixed inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center"
          style={{ background: 'var(--divine-bg)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <p className="text-2xl">🙏</p>
          <p className="text-[16px] font-semibold" style={{ color: 'var(--brand-ink)' }}>
            Questions unavailable
          </p>
          <p className="text-[13px]" style={{ color: 'var(--brand-muted)' }}>
            The AI couldn&apos;t generate questions right now. Please try again.
          </p>
          <button
            onClick={reset}
            className="mt-4 px-6 py-3 rounded-[1.2rem] font-bold text-[13px]"
            style={{ background: 'rgba(197, 160, 89,0.15)', color: '#C5A059', border: '1px solid rgba(197, 160, 89,0.25)' }}
          >
            Try Again
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
