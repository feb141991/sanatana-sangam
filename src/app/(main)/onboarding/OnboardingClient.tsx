'use client';

import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { useThemePreference } from '@/components/providers/ThemeProvider';

const TOTAL_STEPS = 7;
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

const LIFE_STAGES = [
  { key: 'brahmacharya', label: 'Brahmacharya', age: '0–25', desc: 'Student — learn, build, purify', emoji: '⭐' },
  { key: 'grihastha',    label: 'Grihastha',    age: '25–50', desc: 'Householder — work, family, dharma', emoji: '🏡' },
  { key: 'vanaprastha',  label: 'Vanaprastha',  age: '50–75', desc: 'Forest Dweller — mentor, withdraw', emoji: '🌳' },
  { key: 'sannyasa',     label: 'Sannyasa',     age: '75+',   desc: 'Renunciate — release, liberation', emoji: '💨' },
] as const;

const GENDERS = [
  { key: 'male',   label: 'Male',   emoji: '♂' },
  { key: 'female', label: 'Female', emoji: '♀' },
  { key: 'other',  label: 'Prefer not to say', emoji: '·' },
] as const;

const INTERESTS = [
  { key: 'daily_japa',    label: 'Daily Japa',      desc: 'Mantra practice & mala',            emoji: '📿' },
  { key: 'scripture',     label: 'Learn Scripture',  desc: 'Pathshala, Gita, Granth',           emoji: '📖' },
  { key: 'festivals',     label: 'Festivals',        desc: 'Auspicious days & vrats',           emoji: '🎪' },
  { key: 'family_kul',    label: 'Family & Kul',     desc: 'Lineage, Sanskaras, tree',          emoji: '🏠' },
  { key: 'sacred_places', label: 'Sacred Places',    desc: 'Tirthas & gurudwaras',              emoji: '🛕' },
  { key: 'community',     label: 'Community',        desc: 'Mandali, sangat, wisdom',           emoji: '🤝' },
] as const;

const THEMES = [
  { key: 'system', label: 'System',  desc: 'Follow this device', icon: '🖥' },
  { key: 'dark',   label: 'Dark',    desc: 'Temple evening mode', icon: '🌙' },
  { key: 'light',  label: 'Light',   desc: 'Calm daylight mode',  icon: '☀️' },
] as const;

const GREETINGS = [
  { text: 'Hari Om', script: 'हरि ॐ', tradition: 'hindu' },
  { text: 'Waheguru Ji', script: 'ਵਾਹਿਗੁਰੂ', tradition: 'sikh' },
  { text: 'Namo Buddhaya', script: 'नमो बुद्धाय', tradition: 'buddhist' },
  { text: 'Jai Jinendra', script: 'जय जिनेन्द्र', tradition: 'jain' },
] as const;

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

  const [lifeStage, setLifeStage] = useState('');
  const [gender, setGender] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const { setPreference } = useThemePreference();
  const [theme, setTheme] = useState<'system' | 'dark' | 'light'>('system');

  const [greetIdx, setGreetIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setGreetIdx(i => (i + 1) % GREETINGS.length), 2200);
    return () => clearInterval(t);
  }, []);

  const progressPct = (step / TOTAL_STEPS) * 100;
  const readyCopy = READY_COPY[tradition] ?? READY_COPY.hindu;

  const canContinueFromName = true;

  const currentTitle = useMemo(() => {
    if (step === 2) return 'Which path do you walk?';
    if (step === 5) return getGoalHeading(tradition);
    if (step === 6) return 'What shall we call you?';
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
        body: JSON.stringify({ tradition, goal, name, life_stage: lifeStage, gender, interests }),
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
        {step > 1 && step < 7 ? (
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
                {/* Rotating greeting */}
                <div className="h-20 flex flex-col items-center justify-center mb-6 overflow-hidden">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={greetIdx}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={{ duration: 0.4 }}
                      className="text-center"
                    >
                      <p className="text-2xl font-serif text-[#C5A059] mb-1">{GREETINGS[greetIdx].script}</p>
                      <p className="text-[11px] uppercase tracking-[0.25em] text-white/30">{GREETINGS[greetIdx].text}</p>
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Tradition dots */}
                <div className="flex gap-2 mb-8">
                  {GREETINGS.map((_, i) => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full transition-colors duration-300"
                      style={{ background: i === greetIdx ? '#C5A059' : 'rgba(255,255,255,0.18)' }} />
                  ))}
                </div>

                <h1 className="text-3xl font-medium mb-3 text-white" style={{ fontFamily: 'var(--font-serif)' }}>
                  Your sacred journey begins
                </h1>
                <p className="text-white/40 mb-10 text-sm leading-relaxed max-w-xs">
                  A daily companion for dharmic living — across all traditions
                </p>
                <button onClick={() => goNext(2)}
                  className="w-full rounded-full bg-[#C5A059] text-black font-bold py-4 text-[15px]">
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

            {/* Step 3: Life Stage + Gender */}
            {step === 3 && (
              <div>
                <h1 className="text-3xl font-medium mb-1" style={{ fontFamily: 'var(--font-serif)' }}>
                  Your Stage of Life
                </h1>
                <p className="text-white/40 text-sm mb-6">
                  Your duties shift with each stage. This shapes your Nitya Karma and guidance.
                </p>

                {/* Life Stages */}
                <div className="space-y-2 mb-6">
                  {LIFE_STAGES.map(stage => (
                    <button key={stage.key}
                      type="button"
                      onClick={() => setLifeStage(stage.key)}
                      className="w-full flex items-center gap-4 rounded-2xl p-4 text-left border transition-all"
                      style={lifeStage === stage.key
                        ? { borderColor: '#C5A059', background: 'rgba(197,160,89,0.10)' }
                        : { borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.03)' }
                      }
                    >
                      <span className="text-2xl">{stage.emoji}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white/90">{stage.label}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/40">{stage.age}</span>
                        </div>
                        <p className="text-xs text-white/40 mt-0.5">{stage.desc}</p>
                      </div>
                      {lifeStage === stage.key && (
                        <div className="w-5 h-5 rounded-full bg-[#C5A059] flex items-center justify-center text-black text-[10px] font-bold">✓</div>
                      )}
                    </button>
                  ))}
                </div>

                {/* Gender */}
                <p className="text-[11px] uppercase tracking-widest text-white/30 mb-3">Gender</p>
                <div className="flex gap-2">
                  {GENDERS.map(g => (
                    <button key={g.key}
                      type="button"
                      onClick={() => setGender(g.key)}
                      className="flex-1 py-3 rounded-2xl text-sm font-medium border transition-all"
                      style={gender === g.key
                        ? { borderColor: '#C5A059', background: 'rgba(197,160,89,0.10)', color: '#C5A059' }
                        : { borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.50)' }
                      }
                    >
                      {g.emoji} {g.label}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => goNext(4)}
                  disabled={!lifeStage}
                  className="w-full mt-6 rounded-full bg-[#C5A059] text-black font-bold py-4 disabled:opacity-40"
                >
                  Continue →
                </button>
                <button type="button" onClick={() => goNext(4)} className="w-full mt-3 text-white/25 text-xs underline">Skip for now</button>
              </div>
            )}

            {/* Step 4: Interests */}
            {step === 4 && (
              <div>
                <h1 className="text-3xl font-medium mb-1" style={{ fontFamily: 'var(--font-serif)' }}>
                  What draws you here?
                </h1>
                <p className="text-white/40 text-sm mb-6">Choose what resonates. This shapes your home screen.</p>

                <div className="grid grid-cols-2 gap-3">
                  {INTERESTS.map(item => {
                    const selected = interests.includes(item.key);
                    return (
                      <button key={item.key}
                        type="button"
                        onClick={() => setInterests(prev =>
                          prev.includes(item.key) ? prev.filter(k => k !== item.key) : [...prev, item.key]
                        )}
                        className="rounded-2xl p-4 text-left border transition-all"
                        style={selected
                          ? { borderColor: '#C5A059', background: 'rgba(197,160,89,0.10)' }
                          : { borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.03)' }
                        }
                      >
                        <span className="text-2xl block mb-2">{item.emoji}</span>
                        <p className="font-semibold text-white/90 text-sm">{item.label}</p>
                        <p className="text-[11px] text-white/40 mt-0.5">{item.desc}</p>
                      </button>
                    );
                  })}
                </div>
                <p className="text-center text-[11px] text-white/25 mt-4">Select any that resonate — or none at all</p>

                <button type="button" onClick={() => goNext(5)} className="w-full mt-5 rounded-full bg-[#C5A059] text-black font-bold py-4">
                  Continue →
                </button>
              </div>
            )}

            {/* Step 5: Goals (renumbered from 3) */}
            {step === 5 && (
              <div>
                <h1 className="text-3xl font-medium mb-3" style={{ fontFamily: 'var(--font-serif)' }}>{currentTitle}</h1>
                <div className="space-y-3 mt-6">
                  {GOALS.map((item) => {
                    const selected = goal === item.key;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => {
                          setGoal(item.key);
                          setTimeout(() => {
                            setDirection(1);
                            setStep(6);
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

            {/* Step 6: Name (renumbered from 4) */}
            {step === 6 && (
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
                    type="button"
                    disabled={!canContinueFromName}
                    onClick={() => goNext(7)}
                    className="w-full rounded-full bg-[#C5A059] text-black font-bold py-4 disabled:opacity-60"
                  >
                    Continue →
                  </button>
                  <button type="button" onClick={() => goNext(7)} className="w-full text-white/40 text-sm underline">
                    Skip for now
                  </button>
                </div>
              </div>
            )}

            {/* Step 7: Ready (renumbered from 5) */}
            {step === 7 && (
              <div className="min-h-[65vh] flex flex-col items-center justify-center text-center">
                <h1 className="text-3xl font-medium mb-4" style={{ fontFamily: 'var(--font-serif)' }}>
                  {readyCopy.heading}
                </h1>
                <p className="text-white/60 mb-8">{readyCopy.body}</p>

                <div className="w-full mb-6">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-white/30 mb-3 text-left">App Theme</p>
                  <div className="grid grid-cols-3 gap-2">
                    {THEMES.map(t => (
                      <button key={t.key}
                        type="button"
                        onClick={() => {
                          setTheme(t.key as any);
                          setPreference?.(t.key as any); // apply immediately
                        }}
                        className="flex flex-col items-center gap-2 rounded-2xl py-4 border transition-all"
                        style={theme === t.key
                          ? { borderColor: '#C5A059', background: 'rgba(197,160,89,0.14)', color: '#C5A059' }
                          : { borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.45)' }
                        }
                      >
                        <span className="text-2xl">{t.icon}</span>
                        <span className="font-semibold text-sm" style={{ color: theme === t.key ? '#C5A059' : 'rgba(255,255,255,0.70)' }}>
                          {t.label}
                        </span>
                        <span className="text-[10px] text-center leading-tight" style={{ color: 'rgba(255,255,255,0.28)' }}>
                          {t.desc}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="w-full space-y-3">
                  <button
                    type="button"
                    onClick={() => complete('/japa')}
                    disabled={saving}
                    className="w-full rounded-full bg-[#C5A059] text-black font-bold py-4 disabled:opacity-60"
                  >
                    Start Japa Now →
                  </button>
                  <button
                    type="button"
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
