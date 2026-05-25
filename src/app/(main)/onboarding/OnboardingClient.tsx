'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';

const TOTAL_STEPS = 5;
const SPRING = { type: 'spring', stiffness: 300, damping: 30 } as const;

const TRADITIONS = [
  { key: 'hindu', emoji: '🪔', label: 'Sanatan Dharma', desc: 'Vedic and Hindu traditions' },
  { key: 'sikh', emoji: '☬', label: 'Sikhi', desc: 'The path of the Guru' },
  { key: 'buddhist', emoji: '☸️', label: 'Buddha Dharma', desc: 'The middle path' },
  { key: 'jain', emoji: '🤲', label: 'Jain Dharma', desc: 'Ahimsa and liberation' },
] as const;

const GOALS = [
  { key: 'daily_practice', label: 'Build a daily practice', emoji: '🌅' },
  { key: 'deeper_faith', label: 'Deepen my faith', emoji: '🙏' },
  { key: 'peace', label: 'Find inner peace', emoji: '🕊️' },
  { key: 'community', label: 'Connect with community', emoji: '🤝' },
  { key: 'knowledge', label: 'Learn scripture', emoji: '📖' },
] as const;

const READY_COPY: Record<string, { heading: string; body: string }> = {
  hindu: { heading: '🪔 Hari Om', body: 'Your sadhana path is ready. Begin with Japa.' },
  sikh: { heading: '☬ Waheguru Ji', body: 'Your nitnem awaits. Begin your practice.' },
  buddhist: { heading: '☸️ Namo Buddhaya', body: 'Your meditation path is ready.' },
  jain: { heading: '🤲 Jai Jinendra', body: 'Your samayika path begins now.' },
};

function getGoalHeading(tradition: string) {
  if (tradition === 'sikh') return 'What is your ardas?';
  if (tradition === 'buddhist') return 'What is your intention?';
  if (tradition === 'jain') return 'What is your pratikraman?';
  return 'What is your sankalpa?';
}

export default function OnboardingClient({
  userId,
  initialName,
  initialTradition,
}: {
  userId: string;
  initialName: string;
  initialTradition: string;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [tradition, setTradition] = useState<string>(initialTradition || '');
  const [goal, setGoal] = useState<string>('');
  const [name, setName] = useState<string>(initialName || '');
  const [saving, setSaving] = useState(false);

  const progressPct = (step / TOTAL_STEPS) * 100;
  const readyCopy = READY_COPY[tradition] ?? READY_COPY.hindu;

  const canContinueFromName = true;

  const currentTitle = useMemo(() => {
    if (step === 2) return 'Which path do you walk?';
    if (step === 3) return getGoalHeading(tradition);
    if (step === 4) return 'What shall we call you?';
    return '';
  }, [step, tradition]);

  function goNext(nextStep = step + 1) {
    setDirection(1);
    setStep(nextStep);
  }

  function goBack() {
    setDirection(-1);
    setStep((current) => Math.max(1, current - 1));
  }

  async function complete(nextPath: '/japa' | '/home') {
    if (saving) return;
    setSaving(true);
    try {
      const res = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tradition, goal, name }),
      });

      if (!res.ok) throw new Error('Failed to complete onboarding');

      queryClient.invalidateQueries({ queryKey: queryKeys.profile(userId) }).catch(() => {});
      router.replace(nextPath);
      router.refresh();
    } catch (error) {
      toast.error('Could not save onboarding. Try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0E0E0F] flex flex-col text-white/90">
      <div className="px-5 pt-6 pb-3">
        <div className="h-1 w-full rounded-full bg-white/[0.06] overflow-hidden">
          <motion.div
            className="h-full bg-[#C5A059]"
            animate={{ width: `${progressPct}%` }}
            transition={SPRING}
          />
        </div>
        <div className="mt-3 flex items-center justify-center gap-2">
          {Array.from({ length: TOTAL_STEPS }, (_, index) => (
            <div
              key={index}
              className="h-2 w-2 rounded-full"
              style={{ background: index + 1 <= step ? '#C5A059' : 'rgba(255,255,255,0.16)' }}
            />
          ))}
        </div>
      </div>

      <div className="px-5">
        {step > 1 && step < 5 ? (
          <button onClick={goBack} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04]">
            <ChevronLeft size={18} />
          </button>
        ) : (
          <div className="h-10" />
        )}
      </div>

      <div className="flex-1 px-5 pb-8 flex items-center justify-center">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            initial={{ opacity: 0, x: direction > 0 ? 32 : -32 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction > 0 ? -32 : 32 }}
            transition={SPRING}
            className="w-full max-w-lg"
          >
            {step === 1 && (
              <div className="min-h-[65vh] flex flex-col items-center justify-center text-center">
                <div className="text-5xl mb-5">🪔</div>
                <div className="text-4xl font-medium tracking-tight mb-4" style={{ fontFamily: 'var(--font-serif)' }}>
                  Shoonaya
                </div>
                <h1 className="text-3xl font-medium mb-3" style={{ fontFamily: 'var(--font-serif)' }}>
                  Your sacred journey begins
                </h1>
                <p className="text-white/50 mb-8">A daily companion for dharmic living</p>
                <button onClick={() => goNext(2)} className="w-full rounded-full bg-[#C5A059] text-black font-bold py-4">
                  Begin →
                </button>
              </div>
            )}

            {step === 2 && (
              <div>
                <h1 className="text-3xl font-medium mb-3" style={{ fontFamily: 'var(--font-serif)' }}>{currentTitle}</h1>
                <div className="grid grid-cols-2 gap-3 mt-6">
                  {TRADITIONS.map((item) => {
                    const selected = tradition === item.key;
                    return (
                      <button
                        key={item.key}
                        onClick={() => {
                          setTradition(item.key);
                          setTimeout(() => {
                            setDirection(1);
                            setStep(3);
                          }, 400);
                        }}
                        className="rounded-2xl p-4 text-left bg-white/[0.04] border border-white/[0.06]"
                        style={selected ? { borderColor: '#C5A059', background: 'rgba(197,160,89,0.08)' } : undefined}
                      >
                        <div className="text-2xl mb-3">{item.emoji}</div>
                        <div className="font-semibold">{item.label}</div>
                        <div className="text-sm text-white/50 mt-1">{item.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <h1 className="text-3xl font-medium mb-3" style={{ fontFamily: 'var(--font-serif)' }}>{currentTitle}</h1>
                <div className="space-y-3 mt-6">
                  {GOALS.map((item) => {
                    const selected = goal === item.key;
                    return (
                      <button
                        key={item.key}
                        onClick={() => {
                          setGoal(item.key);
                          setTimeout(() => {
                            setDirection(1);
                            setStep(4);
                          }, 300);
                        }}
                        className="w-full rounded-full px-4 py-3 text-left bg-white/[0.04] border border-white/[0.06] flex items-center gap-3"
                        style={selected ? { borderColor: '#C5A059', background: 'rgba(197,160,89,0.08)' } : undefined}
                      >
                        <span className="text-xl">{item.emoji}</span>
                        <span className="font-medium">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {step === 4 && (
              <div>
                <h1 className="text-3xl font-medium mb-3" style={{ fontFamily: 'var(--font-serif)' }}>{currentTitle}</h1>
                <p className="text-white/50 mb-6">This is how you&apos;ll appear to your Mandali</p>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name or spiritual name"
                  className="w-full rounded-2xl bg-white/[0.04] border border-white/[0.06] p-4 outline-none"
                />
                <div className="mt-6 space-y-3">
                  <button
                    disabled={!canContinueFromName}
                    onClick={() => goNext(5)}
                    className="w-full rounded-full bg-[#C5A059] text-black font-bold py-4 disabled:opacity-60"
                  >
                    Continue →
                  </button>
                  <button onClick={() => goNext(5)} className="w-full text-white/40 text-sm underline">
                    Skip for now
                  </button>
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="min-h-[65vh] flex flex-col items-center justify-center text-center">
                <h1 className="text-3xl font-medium mb-4" style={{ fontFamily: 'var(--font-serif)' }}>
                  {readyCopy.heading}
                </h1>
                <p className="text-white/60 mb-8">{readyCopy.body}</p>
                <div className="w-full space-y-3">
                  <button
                    onClick={() => complete('/japa')}
                    disabled={saving}
                    className="w-full rounded-full bg-[#C5A059] text-black font-bold py-4 disabled:opacity-60"
                  >
                    Start Japa Now →
                  </button>
                  <button
                    onClick={() => complete('/home')}
                    disabled={saving}
                    className="text-white/40 text-sm underline"
                  >
                    Go to home
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
