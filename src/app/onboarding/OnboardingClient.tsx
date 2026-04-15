'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Loader2, ChevronRight, Check } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { TRADITIONS } from '@/lib/traditions';
import { APP_LANGUAGES } from '@/lib/language-preferences';
import toast from 'react-hot-toast';

// ─── Types ────────────────────────────────────────────────────────────────────
type TraditionKey = 'hindu' | 'sikh' | 'buddhist' | 'jain' | 'other';
type Step = 1 | 2 | 3 | 4 | 5;

const GOALS = [
  { id: 'japa',       emoji: '📿', label: 'Daily Japa',       desc: 'Mantra practice & mala counting' },
  { id: 'learning',   emoji: '📖', label: 'Learn Scripture',  desc: 'Pathshala, Gita, Granth, Sutras' },
  { id: 'festivals',  emoji: '🗓️', label: 'Festivals',        desc: 'Track auspicious days & vrats' },
  { id: 'family',     emoji: '👨‍👩‍👧', label: 'Family & Kul',    desc: 'Kul tree, Sanskaras, lineage' },
  { id: 'temples',    emoji: '🛕', label: 'Find Temples',     desc: 'Nearby tirthas & gurudwaras' },
  { id: 'community',  emoji: '💬', label: 'Community',        desc: 'Mandali, discussions, sangat' },
] as const;

// ─── Flame animation ─────────────────────────────────────────────────────────
function WelcomeFlame() {
  return (
    <div className="relative flex h-28 w-28 items-center justify-center mx-auto">
      <motion.div
        className="absolute rounded-full"
        style={{ width: 112, height: 112, background: 'radial-gradient(circle, rgba(220,110,20,0.22) 0%, transparent 68%)' }}
        animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.8, 0.4] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute rounded-full"
        style={{ width: 70, height: 70, background: 'radial-gradient(circle, rgba(255,160,40,0.4) 0%, transparent 70%)' }}
        animate={{ scale: [1, 1.25, 0.95, 1], opacity: [0.6, 1, 0.7, 0.6] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Flame core */}
      <motion.div
        style={{
          width: 20, height: 34,
          background: 'linear-gradient(180deg, #fff8e0 0%, #ffb820 45%, #ff6515 100%)',
          borderRadius: '50% 50% 50% 50% / 38% 38% 62% 62%',
          boxShadow: '0 0 20px rgba(255,145,22,0.9), 0 0 6px rgba(255,255,200,0.6)',
          position: 'relative', top: -12,
        }}
        animate={{ scaleX: [1, 1.1, 0.93, 1.07, 1], scaleY: [1, 0.93, 1.07, 0.97, 1], rotate: [-3, 4, -2, 3, -3] }}
        transition={{ duration: 0.85, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Diya bowl */}
      <div style={{
        position: 'absolute', top: '54%', width: 44, height: 13,
        background: 'linear-gradient(90deg, #7a3f1c 0%, #c97c3a 50%, #7a3f1c 100%)',
        borderRadius: '2px 2px 50% 50% / 2px 2px 80% 80%',
      }} />
    </div>
  );
}

// ─── Progress dots ────────────────────────────────────────────────────────────
function ProgressDots({ step, total }: { step: Step; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: total }, (_, i) => (
        <motion.div
          key={i}
          className="rounded-full transition-all"
          animate={{
            width: i + 1 === step ? 20 : 6,
            background: i + 1 <= step ? '#d4843a' : 'rgba(212,166,70,0.2)',
          }}
          style={{ height: 6 }}
          transition={{ duration: 0.3 }}
        />
      ))}
    </div>
  );
}

// ─── Slide variants ────────────────────────────────────────────────────────────
const slideIn = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0 },
  exit:    { opacity: 0, x: -40 },
};

interface Props {
  userId:     string;
  hasTradition: boolean;
  hasCity:      boolean;
  hasLanguage:  boolean;
}

export default function OnboardingClient({ userId, hasTradition, hasCity, hasLanguage }: Props) {
  const router   = useRouter();
  const supabase = createClient();

  // Compute first step that needs filling
  const firstStep: Step = !hasTradition ? 1 : !hasLanguage ? 3 : !hasCity ? 4 : 5;
  const [step, setStep] = useState<Step>(firstStep === 5 ? 5 : firstStep);

  const [saving,      setSaving]      = useState(false);
  const [geoLoading,  setGeoLoading]  = useState(false);

  const [tradition,   setTradition]   = useState<TraditionKey | ''>('');
  const [language,    setLanguage]    = useState('en');
  const [city,        setCity]        = useState('');
  const [country,     setCountry]     = useState('');
  const [latitude,    setLatitude]    = useState<number | null>(null);
  const [longitude,   setLongitude]   = useState<number | null>(null);
  const [goals,       setGoals]       = useState<string[]>([]);

  // ── Geolocation ─────────────────────────────────────────────────────────────
  async function detectLocation() {
    if (!navigator.geolocation) { toast.error('Geolocation not supported'); return; }
    setGeoLoading(true);
    try {
      const pos = await new Promise<GeolocationPosition>((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 8000 })
      );
      const { latitude: lat, longitude: lon } = pos.coords;
      setLatitude(lat);
      setLongitude(lon);
      // Reverse-geocode via Open-Meteo (no API key, free)
      try {
        const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);
        const d = await r.json();
        setCity(d.address?.city || d.address?.town || d.address?.village || d.address?.county || '');
        setCountry(d.address?.country || '');
      } catch { /* silent — coordinates saved even if city lookup fails */ }
    } catch {
      toast.error('Could not detect location — type your city instead');
    } finally {
      setGeoLoading(false);
    }
  }

  // ── Toggle goal ──────────────────────────────────────────────────────────────
  function toggleGoal(id: string) {
    setGoals(prev => prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]);
  }

  // ── Save & finish ────────────────────────────────────────────────────────────
  async function finish() {
    setSaving(true);
    try {
      const updates: Record<string, unknown> = {
        onboarding_completed: true,
      };
      if (tradition)  updates.tradition     = tradition;
      if (language)   updates.app_language  = language;
      if (city)       updates.city          = city;
      if (country)    updates.country       = country;
      if (latitude)   updates.latitude      = latitude;
      if (longitude)  updates.longitude     = longitude;
      if (goals.length > 0) updates.seeking = goals;

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);

      if (error) throw error;
      toast.success('Welcome to Sanatana Sangam 🙏', { duration: 3000 });
      router.replace('/home');
    } catch (err) {
      console.error(err);
      toast.error('Could not save — please try again');
    } finally {
      setSaving(false);
    }
  }

  // ── Can advance ──────────────────────────────────────────────────────────────
  function canAdvance(): boolean {
    if (step === 1) return true; // welcome — always can proceed
    if (step === 2) return tradition !== '';
    if (step === 3) return true; // language — always has default
    if (step === 4) return true; // location — optional
    return true;
  }

  function advance() {
    if (step < 5) setStep((s) => (s + 1) as Step);
    else finish();
  }

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #1a0e0e 0%, #1e1208 60%, #16100a 100%)' }}
    >
      {/* Ambient specks */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {Array.from({ length: 18 }).map((_, i) => (
          <motion.div key={i} className="absolute rounded-full"
            style={{ width: 1 + i % 2, height: 1 + i % 2, left: `${(i * 5.5) % 99}%`, top: `${(i * 6.3) % 80}%`, background: 'rgba(245,220,150,0.6)' }}
            animate={{ opacity: [0.1, 0.5, 0.1] }}
            transition={{ duration: 2.5 + i % 4, repeat: Infinity, delay: i * 0.3 }}
          />
        ))}
      </div>

      <div className="relative w-full max-w-sm px-5">
        {/* Progress */}
        <div className="mb-6">
          <ProgressDots step={step} total={5} />
        </div>

        <AnimatePresence mode="wait">
          {/* ── Screen 1 — Welcome ─────────────────────────────────── */}
          {step === 1 && (
            <motion.div key="s1" {...slideIn} transition={{ duration: 0.35 }} className="space-y-8 text-center">
              <WelcomeFlame />
              <div>
                <motion.h1
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-3xl font-bold"
                  style={{ color: '#f5dfa0', letterSpacing: '-0.01em' }}
                >
                  Sanatana Sangam
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="mt-2 text-sm tracking-widest"
                  style={{ color: 'rgba(245,210,130,0.45)' }}
                >
                  सनातन संगम
                </motion.p>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="mt-5 text-sm leading-relaxed"
                  style={{ color: 'rgba(245,210,130,0.55)' }}
                >
                  A home for Dharma — your daily practice, your lineage, your tradition, all in one place.
                </motion.p>
              </div>
            </motion.div>
          )}

          {/* ── Screen 2 — Tradition ───────────────────────────────── */}
          {step === 2 && (
            <motion.div key="s2" {...slideIn} transition={{ duration: 0.35 }} className="space-y-5">
              <div>
                <h2 className="text-xl font-bold" style={{ color: '#f5dfa0' }}>
                  Your Tradition
                </h2>
                <p className="mt-1.5 text-sm" style={{ color: 'rgba(245,210,130,0.5)' }}>
                  This shapes your entire experience — panchang, content, language, and more.
                </p>
              </div>
              <div className="space-y-2.5">
                {TRADITIONS.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setTradition(t.value as TraditionKey)}
                    className="w-full flex items-center gap-4 rounded-2xl px-4 py-3.5 text-left transition-all"
                    style={{
                      background: tradition === t.value ? 'rgba(212,132,58,0.18)' : 'rgba(255,255,255,0.04)',
                      border: `1.5px solid ${tradition === t.value ? 'rgba(212,132,58,0.5)' : 'rgba(255,255,255,0.08)'}`,
                    }}
                  >
                    <span className="text-2xl flex-shrink-0">{t.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold" style={{ color: tradition === t.value ? '#f5c87a' : 'rgba(245,220,150,0.75)' }}>
                        {t.label}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'rgba(245,210,130,0.38)' }}>{t.desc}</p>
                    </div>
                    {tradition === t.value && (
                      <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full" style={{ background: '#d4843a' }}>
                        <Check size={11} color="#1c1208" strokeWidth={2.5} />
                      </div>
                    )}
                  </button>
                ))}
              </div>
              <p className="text-center text-xs" style={{ color: 'rgba(245,210,130,0.3)' }}>
                🔒 This is set once and cannot be changed later
              </p>
            </motion.div>
          )}

          {/* ── Screen 3 — Language ────────────────────────────────── */}
          {step === 3 && (
            <motion.div key="s3" {...slideIn} transition={{ duration: 0.35 }} className="space-y-5">
              <div>
                <h2 className="text-xl font-bold" style={{ color: '#f5dfa0' }}>Your Language</h2>
                <p className="mt-1.5 text-sm" style={{ color: 'rgba(245,210,130,0.5)' }}>
                  Choose how you want the app to speak to you.
                </p>
              </div>
              <div className="space-y-2.5">
                {APP_LANGUAGES.map((lang) => (
                  <button
                    key={lang.value}
                    onClick={() => setLanguage(lang.value)}
                    className="w-full flex items-center justify-between rounded-2xl px-5 py-4 text-left transition-all"
                    style={{
                      background: language === lang.value ? 'rgba(212,132,58,0.18)' : 'rgba(255,255,255,0.04)',
                      border: `1.5px solid ${language === lang.value ? 'rgba(212,132,58,0.5)' : 'rgba(255,255,255,0.08)'}`,
                    }}
                  >
                    <p className="text-sm font-semibold" style={{ color: language === lang.value ? '#f5c87a' : 'rgba(245,220,150,0.75)' }}>
                      {lang.label}
                    </p>
                    {language === lang.value && (
                      <div className="flex h-5 w-5 items-center justify-center rounded-full" style={{ background: '#d4843a' }}>
                        <Check size={11} color="#1c1208" strokeWidth={2.5} />
                      </div>
                    )}
                  </button>
                ))}
              </div>
              <p className="text-center text-xs" style={{ color: 'rgba(245,210,130,0.3)' }}>
                You can change this anytime in your profile settings
              </p>
            </motion.div>
          )}

          {/* ── Screen 4 — Location ────────────────────────────────── */}
          {step === 4 && (
            <motion.div key="s4" {...slideIn} transition={{ duration: 0.35 }} className="space-y-5">
              <div>
                <h2 className="text-xl font-bold" style={{ color: '#f5dfa0' }}>Your Location</h2>
                <p className="mt-1.5 text-sm" style={{ color: 'rgba(245,210,130,0.5)' }}>
                  Used for accurate Panchang, local festivals, and nearby temples. Optional but recommended.
                </p>
              </div>

              {/* GPS detect */}
              <button
                onClick={detectLocation}
                disabled={geoLoading}
                className="w-full flex items-center justify-center gap-2.5 rounded-2xl py-4 text-sm font-medium transition-all disabled:opacity-60"
                style={{
                  background: 'rgba(212,132,58,0.12)',
                  border: '1.5px dashed rgba(212,132,58,0.35)',
                  color: '#d4a040',
                }}
              >
                {geoLoading
                  ? <><Loader2 size={16} className="animate-spin" /> Detecting…</>
                  : <><MapPin size={16} /> Detect my location</>}
              </button>

              {/* City confirmed */}
              {city && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 rounded-xl px-4 py-3"
                  style={{ background: 'rgba(80,200,100,0.08)', border: '1px solid rgba(80,200,100,0.2)' }}
                >
                  <span className="text-green-400">📍</span>
                  <p className="text-sm font-medium" style={{ color: 'rgba(180,240,180,0.8)' }}>
                    {[city, country].filter(Boolean).join(', ')}
                  </p>
                </motion.div>
              )}

              <div className="text-center text-xs" style={{ color: 'rgba(245,210,130,0.3)' }}>— or type manually —</div>

              {/* Manual entry */}
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="City"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="rounded-xl px-4 py-3 text-sm outline-none transition"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'rgba(245,220,150,0.9)',
                  }}
                />
                <input
                  type="text"
                  placeholder="Country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="rounded-xl px-4 py-3 text-sm outline-none transition"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'rgba(245,220,150,0.9)',
                  }}
                />
              </div>

              <button
                onClick={advance}
                className="w-full text-center text-xs py-2 transition"
                style={{ color: 'rgba(245,210,130,0.35)' }}
              >
                Skip for now
              </button>
            </motion.div>
          )}

          {/* ── Screen 5 — Goals ───────────────────────────────────── */}
          {step === 5 && (
            <motion.div key="s5" {...slideIn} transition={{ duration: 0.35 }} className="space-y-5">
              <div>
                <h2 className="text-xl font-bold" style={{ color: '#f5dfa0' }}>What brings you here?</h2>
                <p className="mt-1.5 text-sm" style={{ color: 'rgba(245,210,130,0.5)' }}>
                  Select all that resonate. This personalises your home screen.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {GOALS.map((goal) => {
                  const selected = goals.includes(goal.id);
                  return (
                    <button
                      key={goal.id}
                      onClick={() => toggleGoal(goal.id)}
                      className="rounded-2xl px-3 py-4 text-left transition-all"
                      style={{
                        background: selected ? 'rgba(212,132,58,0.18)' : 'rgba(255,255,255,0.04)',
                        border: `1.5px solid ${selected ? 'rgba(212,132,58,0.45)' : 'rgba(255,255,255,0.07)'}`,
                      }}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <span className="text-xl">{goal.emoji}</span>
                        {selected && (
                          <div className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full" style={{ background: '#d4843a' }}>
                            <Check size={9} color="#1c1208" strokeWidth={2.5} />
                          </div>
                        )}
                      </div>
                      <p className="mt-2 text-xs font-semibold" style={{ color: selected ? '#f5c87a' : 'rgba(245,220,150,0.65)' }}>
                        {goal.label}
                      </p>
                      <p className="mt-0.5 text-[10px]" style={{ color: 'rgba(245,210,130,0.35)' }}>
                        {goal.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── CTA button ──────────────────────────────────────────────────── */}
        <motion.div
          className="mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {/* Don't show main CTA on screen 4 (has its own skip) */}
          {step !== 4 && (
            <motion.button
              onClick={advance}
              disabled={!canAdvance() || saving}
              whileTap={{ scale: 0.97 }}
              className="w-full flex items-center justify-center gap-2 rounded-2xl py-4 text-sm font-semibold transition-all disabled:opacity-40"
              style={{
                background: canAdvance()
                  ? 'linear-gradient(135deg, rgba(212,120,20,0.9), rgba(212,166,70,0.8))'
                  : 'rgba(212,166,70,0.15)',
                color: canAdvance() ? '#1c1208' : 'rgba(245,210,130,0.4)',
                boxShadow: canAdvance() ? '0 4px 20px rgba(212,120,20,0.3)' : 'none',
              }}
            >
              {saving ? (
                <><Loader2 size={16} className="animate-spin" /> Saving…</>
              ) : step === 5 ? (
                '🙏 Enter Sanatana Sangam'
              ) : (
                <>Continue <ChevronRight size={16} /></>
              )}
            </motion.button>
          )}

          {/* Screen 4 — just show Continue (location is optional) */}
          {step === 4 && (
            <motion.button
              onClick={advance}
              disabled={saving}
              whileTap={{ scale: 0.97 }}
              className="w-full flex items-center justify-center gap-2 rounded-2xl py-4 text-sm font-semibold transition-all"
              style={{
                background: 'linear-gradient(135deg, rgba(212,120,20,0.9), rgba(212,166,70,0.8))',
                color: '#1c1208',
                boxShadow: '0 4px 20px rgba(212,120,20,0.3)',
              }}
            >
              {city ? <>Continue <ChevronRight size={16} /></> : 'Skip location'}
            </motion.button>
          )}

          {/* Back link */}
          {step > 1 && (
            <button
              onClick={() => setStep((s) => (s - 1) as Step)}
              className="mt-3 w-full text-center text-xs py-2 transition"
              style={{ color: 'rgba(245,210,130,0.3)' }}
            >
              ← Back
            </button>
          )}
        </motion.div>
      </div>
    </div>
  );
}
