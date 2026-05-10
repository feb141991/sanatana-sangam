'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, RotateCcw, CheckCircle2, XCircle, Zap, Loader2 } from 'lucide-react';
import { getTraditionMeta } from '@/lib/tradition-config';

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
  { key: 'deities',    emoji: '🙏', label: 'Deities & Stories',   color: '#c8924a' },
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
  background: 'rgba(255,255,255,0.03)',
  backdropFilter: 'blur(12px)',
  border: '1px solid rgba(255,255,255,0.08)',
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

  return (
    <div className="min-h-screen pb-28 px-5" style={{ background: '#0a0a08', color: 'var(--text-cream)' }}>
      {/* Back */}
      <div className="pt-safe pt-4 mb-6">
        <Link href="/quiz"
          className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest transition-opacity hover:opacity-70"
          style={{ color: 'var(--text-dim)' }}>
          <ChevronLeft size={12} /> Mastery
        </Link>
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.38 }}>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ background: `${meta.accentColour}22` }}>
            <Zap size={18} style={{ color: meta.accentColour }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-serif)' }}>Practice Mode</h1>
            <p className="text-[12px]" style={{ color: 'var(--text-dim)' }}>5 questions · Earn 8 karma each correct</p>
          </div>
        </div>

        {/* Topic picker */}
        <h2 className="text-[11px] font-bold uppercase tracking-[0.16em] mt-8 mb-3" style={{ color: 'var(--text-dim)' }}>
          Choose Topic
        </h2>
        <div className="grid grid-cols-2 gap-3 mb-8">
          {TOPICS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTopic(t.key)}
              className="rounded-[1.4rem] p-4 text-left transition-all"
              style={{
                background: topic === t.key ? `${t.color}20` : 'rgba(255,255,255,0.03)',
                border: topic === t.key ? `1px solid ${t.color}50` : '1px solid rgba(255,255,255,0.07)',
                boxShadow: topic === t.key ? `0 0 16px ${t.color}18` : 'none',
              }}
            >
              <span className="text-2xl block mb-2" aria-hidden="true">{t.emoji}</span>
              <p className="text-[13px] font-semibold leading-tight" style={{ color: topic === t.key ? t.color : 'var(--text-cream)' }}>
                {t.label}
              </p>
            </button>
          ))}
        </div>

        {/* Difficulty picker */}
        <h2 className="text-[11px] font-bold uppercase tracking-[0.16em] mb-3" style={{ color: 'var(--text-dim)' }}>
          Choose Difficulty
        </h2>
        <div className="space-y-2.5 mb-10">
          {DIFFICULTIES.map((d) => (
            <button
              key={d.key}
              onClick={() => setDifficulty(d.key)}
              className="w-full flex items-center gap-4 rounded-2xl p-4 text-left transition-all"
              style={{
                background: difficulty === d.key ? 'rgba(200,146,74,0.12)' : 'rgba(255,255,255,0.03)',
                border: difficulty === d.key ? '1px solid rgba(200,146,74,0.35)' : '1px solid rgba(255,255,255,0.07)',
              }}
            >
              <span className="text-xl" aria-hidden="true">{d.emoji}</span>
              <div>
                <p className="text-[14px] font-bold" style={{ color: difficulty === d.key ? 'var(--brand-primary)' : 'var(--text-cream)' }}>
                  {d.label}
                </p>
                <p className="text-[11px] leading-snug" style={{ color: 'var(--text-dim)' }}>{d.desc}</p>
              </div>
              {difficulty === d.key && (
                <CheckCircle2 size={16} className="ml-auto flex-shrink-0" style={{ color: 'var(--brand-primary)' }} />
              )}
            </button>
          ))}
        </div>

        <button
          onClick={() => topic && onStart(topic, difficulty)}
          disabled={!topic}
          className="w-full py-4 rounded-[1.4rem] font-bold text-[15px] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: topic ? `linear-gradient(135deg, var(--brand-primary), var(--brand-primary-strong))` : 'rgba(255,255,255,0.08)', color: topic ? '#1a1610' : 'var(--text-dim)' }}
        >
          {topic ? `Start — ${TOPICS.find(t => t.key === topic)?.label}` : 'Select a topic to begin'}
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
  onAnswer,
}: {
  question: PracticeQuestion;
  questionNumber: number;
  total: number;
  topic: TopicKey;
  onAnswer: (isCorrect: boolean) => void;
}) {
  const [chosen, setChosen] = useState<number | null>(null);
  const topicMeta = TOPICS.find(t => t.key === topic)!;

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
      style={{ background: '#0a0a08', color: 'var(--text-cream)' }}
    >
      {/* Header */}
      <div className="pt-safe pt-4 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg" aria-hidden="true">{topicMeta.emoji}</span>
            <span className="text-[12px] font-semibold" style={{ color: topicMeta.color }}>{topicMeta.label}</span>
          </div>
          <span className="text-[12px] font-bold" style={{ color: 'var(--text-dim)' }}>
            {questionNumber} / {total}
          </span>
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <div
            className="h-1 rounded-full transition-all duration-500"
            style={{ width: `${((questionNumber - 1) / total) * 100}%`, background: topicMeta.color }}
          />
        </div>
      </div>

      {/* Question */}
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] mb-3" style={{ color: 'var(--text-dim)' }}>
        {question.source}
      </p>
      <h2 className="text-[1.2rem] font-semibold leading-relaxed mb-8" style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-cream)', lineHeight: 1.45 }}>
        {question.question}
      </h2>

      {/* Options */}
      <div className="space-y-3">
        {question.options.map((opt, i) => {
          const isChosen  = chosen === i;
          const isCorrect = i === question.answerIndex;
          const showResult = chosen !== null && (isChosen || isCorrect);

          let borderColor = 'rgba(255,255,255,0.08)';
          let bgColor     = 'rgba(255,255,255,0.03)';
          let textColor   = 'var(--text-cream)';
          if (showResult) {
            if (isCorrect)               { borderColor = 'rgba(100,200,100,0.50)'; bgColor = 'rgba(100,200,100,0.10)'; textColor = '#7acd7a'; }
            else if (isChosen)           { borderColor = 'rgba(200,80,80,0.50)';   bgColor = 'rgba(200,80,80,0.10)';   textColor = '#cd7a7a'; }
          }

          return (
            <button
              key={i}
              onClick={() => handleAnswer(i)}
              disabled={chosen !== null}
              className="w-full flex items-center gap-4 rounded-2xl p-4 text-left transition-all"
              style={{ border: `1px solid ${borderColor}`, background: bgColor }}
            >
              <span
                className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                style={{ background: 'rgba(255,255,255,0.06)', color: textColor }}
              >
                {String.fromCharCode(65 + i)}
              </span>
              <span className="text-[14px] flex-1 leading-snug" style={{ color: textColor }}>{opt}</span>
              {showResult && isCorrect && <CheckCircle2 size={16} style={{ color: '#7acd7a', flexShrink: 0 }} />}
              {showResult && isChosen && !isCorrect && <XCircle size={16} style={{ color: '#cd7a7a', flexShrink: 0 }} />}
            </button>
          );
        })}
      </div>

      {/* Explanation after answering */}
      <AnimatePresence>
        {chosen !== null && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.3 }}
            className="mt-5 rounded-[1.2rem] p-4 overflow-hidden"
            style={{ background: 'rgba(100,140,220,0.10)', border: '1px solid rgba(100,140,220,0.20)' }}
          >
            <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: '#8888cc' }}>
              {chosen === question.answerIndex ? '✨ Correct!' : '💡 Explanation'}
            </p>
            <p className="text-[13px] leading-relaxed" style={{ color: 'var(--text-muted-warm)' }}>
              {question.explanation}
            </p>
            {question.fact && (
              <p className="text-[12px] leading-relaxed mt-2 italic" style={{ color: 'var(--text-dim)' }}>
                Did you know: {question.fact}
              </p>
            )}
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

  const message = pct === 100 ? 'Perfect score! You\'re a true Pandit! 🏵️'
    : pct >= 80 ? 'Excellent! Deep knowledge flows through you. 🧿'
    : pct >= 60 ? 'Good effort! Keep studying to deepen your understanding. 🪔'
    : 'Every question is a lesson. Return again tomorrow! 🌱';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.42, ease: [0.34, 1.26, 0.64, 1] }}
      className="min-h-screen pb-28 px-5 flex flex-col"
      style={{ background: '#0a0a08', color: 'var(--text-cream)' }}
    >
      <div className="pt-safe pt-12 flex-1 flex flex-col items-center justify-center text-center">
        {/* Score circle */}
        <div
          className="w-32 h-32 rounded-full flex flex-col items-center justify-center mb-6"
          style={{
            background: pct >= 80 ? 'rgba(100,200,100,0.12)' : pct >= 60 ? 'rgba(200,146,74,0.12)' : 'rgba(200,80,80,0.10)',
            border: pct >= 80 ? '2px solid rgba(100,200,100,0.40)' : pct >= 60 ? '2px solid rgba(200,146,74,0.40)' : '2px solid rgba(200,80,80,0.30)',
          }}
        >
          <p className="text-4xl font-bold" style={{ fontFamily: 'var(--font-serif)', color: pct >= 80 ? '#7acd7a' : pct >= 60 ? 'var(--brand-primary)' : '#cd7a7a' }}>
            {correct}/{total}
          </p>
          <p className="text-[12px] font-bold" style={{ color: 'var(--text-dim)' }}>{pct}%</p>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl" aria-hidden="true">{topicMeta.emoji}</span>
          <span className="text-[13px] font-semibold" style={{ color: topicMeta.color }}>{topicMeta.label}</span>
        </div>

        <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'var(--font-serif)' }}>Session Complete</h2>
        <p className="text-[14px] leading-relaxed max-w-xs mx-auto mb-6" style={{ color: 'var(--text-muted-warm)' }}>
          {message}
        </p>

        {/* Karma earned */}
        <div
          className="rounded-2xl px-6 py-4 mb-8"
          style={{ background: 'rgba(200,146,74,0.10)', border: '1px solid rgba(200,146,74,0.22)' }}
        >
          <p className="text-3xl font-bold" style={{ fontFamily: 'var(--font-serif)', color: 'var(--brand-primary)' }}>
            +{karmaEarned} ✨
          </p>
          <p className="text-[11px] font-bold uppercase tracking-widest mt-0.5" style={{ color: 'var(--text-dim)' }}>
            Karma Earned
          </p>
        </div>

        {/* Actions */}
        <div className="w-full max-w-sm space-y-3">
          <button
            onClick={onPlayAgain}
            className="w-full py-4 rounded-[1.4rem] font-bold text-[15px] flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-primary-strong))', color: '#1a1610' }}
          >
            <RotateCcw size={16} />
            Practice Again
          </button>
          <Link
            href="/quiz"
            className="block w-full py-4 rounded-[1.4rem] font-bold text-[15px] text-center"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', color: 'var(--text-muted-warm)' }}
          >
            Back to Mastery
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

  const startSession = useCallback(async (t: TopicKey, d: DifficultyKey) => {
    setTopic(t);
    setDifficulty(d);
    setStage('loading');
    setCurrentQ(0);
    setCorrect(0);

    try {
      const res = await fetch(`/api/quiz/practice?tradition=${tradition}&topic=${t}&difficulty=${d}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setQuestions(data.questions);
      setStage('playing');
    } catch (err) {
      console.error('[practice] Failed to load questions:', err);
      setStage('error');
    }
  }, [tradition]);

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
          style={{ background: '#0a0a08' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <Loader2 size={32} className="animate-spin" style={{ color: 'var(--brand-primary)' }} />
          <p className="text-[14px]" style={{ color: 'var(--text-dim)' }}>
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
          style={{ background: '#0a0a08' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <p className="text-2xl">🙏</p>
          <p className="text-[16px] font-semibold" style={{ color: 'var(--text-cream)' }}>
            Questions unavailable
          </p>
          <p className="text-[13px]" style={{ color: 'var(--text-dim)' }}>
            The AI couldn&apos;t generate questions right now. Please try again.
          </p>
          <button
            onClick={reset}
            className="mt-4 px-6 py-3 rounded-[1.2rem] font-bold text-[13px]"
            style={{ background: 'rgba(200,146,74,0.15)', color: '#c8924a', border: '1px solid rgba(200,146,74,0.25)' }}
          >
            Try Again
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
