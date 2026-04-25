'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { MapPin, Loader2, ChevronRight, Check, Monitor, Moon, Sun } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { TRADITIONS } from '@/lib/traditions';
import { APP_LANGUAGES } from '@/lib/language-preferences';
import { getAllAshramaStages, type LifeStage } from '@/lib/ashrama';
import { THEME_OPTIONS, type ThemePreference } from '@/lib/theme-preferences';
import { useThemePreference } from '@/components/providers/ThemeProvider';
import toast from 'react-hot-toast';

// ─── Types ────────────────────────────────────────────────────────────────────
type TraditionKey = 'hindu' | 'sikh' | 'buddhist' | 'jain' | 'other';
type Step = 1 | 2 | 3 | 4 | 5 | 6;

const GOALS = [
  { id: 'japa',      emoji: '📿', label: 'Daily Japa',      desc: 'Mantra practice & mala' },
  { id: 'learning',  emoji: '📖', label: 'Learn Scripture', desc: 'Pathshala, Gita, Granth' },
  { id: 'festivals', emoji: '🗓️', label: 'Festivals',       desc: 'Auspicious days & vrats' },
  { id: 'family',    emoji: '👨‍👩‍👧', label: 'Family & Kul',   desc: 'Lineage, Sanskaras, tree' },
  { id: 'temples',   emoji: '🛕', label: 'Sacred Places',   desc: 'Tirthas & gurudwaras' },
  { id: 'community', emoji: '💬', label: 'Community',       desc: 'Mandali, sangat, wisdom' },
] as const;

// ─── Per-screen background gradients ─────────────────────────────────────────
const SCREEN_BG: Record<number, string> = {
  1: 'radial-gradient(ellipse at 40% 30%, rgba(60,32,8,0.95) 0%, rgba(16,10,4,0.98) 55%, rgba(10,8,6,1) 100%)',
  2: 'radial-gradient(ellipse at 60% 25%, rgba(46,24,8,0.96) 0%, rgba(12,8,4,0.98) 55%, rgba(8,6,4,1) 100%)',
  3: 'radial-gradient(ellipse at 50% 40%, rgba(16,28,16,0.96) 0%, rgba(8,16,8,0.98) 55%, rgba(4,10,4,1) 100%)',
  4: 'radial-gradient(ellipse at 40% 60%, rgba(24,20,40,0.96) 0%, rgba(10,8,18,0.98) 55%, rgba(8,6,14,1) 100%)',
  5: 'radial-gradient(ellipse at 55% 35%, rgba(8,24,32,0.96) 0%, rgba(6,12,20,0.98) 55%, rgba(4,8,14,1) 100%)',
  6: 'radial-gradient(ellipse at 45% 45%, rgba(28,16,8,0.96) 0%, rgba(12,8,4,0.98) 55%, rgba(8,5,3,1) 100%)',
};

// ─── Ambient sacred glow — diya flame ────────────────────────────────────────
function SacredFlame() {
  const prefersReducedMotion = useReducedMotion();
  return (
    <div className="relative flex items-center justify-center mx-auto" style={{ width: 120, height: 120 }}>
      {/* Outer breathing halo */}
      <motion.div
        className="absolute rounded-full"
        style={{ inset: 0, background: 'radial-gradient(circle, rgba(200,120,24,0.18) 0%, transparent 70%)' }}
        animate={prefersReducedMotion ? {} : { scale: [1, 1.22, 1], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Mid glow */}
      <motion.div
        className="absolute rounded-full"
        style={{ width: 68, height: 68, background: 'radial-gradient(circle, rgba(200,146,74,0.32) 0%, transparent 70%)' }}
        animate={prefersReducedMotion ? {} : { scale: [1, 1.3, 0.92, 1], opacity: [0.5, 0.9, 0.55, 0.5] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Flame body */}
      <motion.div
        style={{
          width: 18, height: 30,
          background: 'linear-gradient(180deg, #fffde0 0%, #ffc040 38%, #ff7020 72%, #cc3010 100%)',
          borderRadius: '50% 50% 50% 50% / 36% 36% 64% 64%',
          boxShadow: '0 0 18px rgba(255,140,20,0.85), 0 0 6px rgba(255,240,180,0.5)',
          position: 'relative', top: -14,
        }}
        animate={prefersReducedMotion ? {} : {
          scaleX: [1, 1.12, 0.9, 1.08, 1],
          scaleY: [1, 0.92, 1.08, 0.95, 1],
          rotate: [-2, 4, -3, 3, -2],
        }}
        transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Flame highlight */}
      <div style={{
        position: 'absolute', top: '20%', width: 6, height: 12,
        background: 'rgba(255,255,240,0.55)',
        borderRadius: '50%',
        filter: 'blur(2px)',
        transform: 'translateX(-3px)',
      }} />
      {/* Diya bowl */}
      <div style={{
        position: 'absolute', top: '53%', width: 42, height: 12,
        background: 'linear-gradient(90deg, #6b3412 0%, #b86c28 48%, #6b3412 100%)',
        borderRadius: '2px 2px 50% 50% / 2px 2px 80% 80%',
      }} />
      {/* Oil wick line */}
      <div style={{
        position: 'absolute', top: '50%', width: 3, height: 8,
        background: 'rgba(255,200,120,0.6)',
        borderRadius: '2px',
      }} />
    </div>
  );
}

// ─── Decorative particles ─────────────────────────────────────────────────────
function AmbientParticles({ count = 16 }: { count?: number }) {
  const prefersReducedMotion = useReducedMotion();
  if (prefersReducedMotion) return null;
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: 1 + (i % 2),
            height: 1 + (i % 2),
            left: `${(i * 6.2 + 3) % 97}%`,
            top: `${(i * 7.1 + 5) % 85}%`,
            background: i % 3 === 0 ? 'rgba(200,146,74,0.7)' : 'rgba(255,230,160,0.5)',
          }}
          animate={{ opacity: [0.05, 0.55, 0.05], y: [0, -4, 0] }}
          transition={{ duration: 3 + (i % 5), repeat: Infinity, delay: i * 0.22, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

// ─── Progress indicator ───────────────────────────────────────────────────────
function ProgressPills({ step, total }: { step: Step; total: number }) {
  return (
    <div className="flex items-center justify-center gap-1.5">
      {Array.from({ length: total }, (_, i) => {
        const isActive = i + 1 === step;
        const isDone   = i + 1 < step;
        return (
          <motion.div
            key={i}
            className="rounded-full"
            animate={{
              width: isActive ? 28 : 6,
              background: isActive
                ? '#C8924A'
                : isDone
                  ? 'rgba(200, 146, 74, 0.45)'
                  : 'rgba(200, 146, 74, 0.15)',
            }}
            style={{ height: 5 }}
            transition={{ duration: 0.32, ease: [0.34, 1.26, 0.64, 1] }}
          />
        );
      })}
    </div>
  );
}

// ─── Slide transition ─────────────────────────────────────────────────────────
const slide = {
  initial: { opacity: 0, x: 28, filter: 'blur(3px)' },
  animate: { opacity: 1, x: 0,  filter: 'blur(0px)' },
  exit:    { opacity: 0, x: -24, filter: 'blur(2px)' },
};

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  userId:        string;
  hasTradition:  boolean;
  hasLifeStage:  boolean;
  hasCity:       boolean;
  hasLanguage:   boolean;
}

export default function OnboardingClient({ userId, hasTradition, hasLifeStage, hasCity, hasLanguage }: Props) {
  const router   = useRouter();
  const supabase = createClient();
  const prefersReducedMotion = useReducedMotion();
  const { preference: themePreference, setPreference: setThemePreference } = useThemePreference();

  const firstStep: Step = !hasTradition ? 1 : !hasLifeStage ? 3 : !hasLanguage ? 4 : !hasCity ? 5 : 6;
  const [step, setStep]       = useState<Step>(firstStep === 6 ? 6 : firstStep);
  const [prevStep, setPrevStep] = useState<Step>(firstStep === 6 ? 6 : firstStep);

  const [saving,     setSaving]     = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [tradition,  setTradition]  = useState<TraditionKey | ''>('');
  const [lifeStage,  setLifeStage]  = useState<LifeStage | ''>('');
  const [language,   setLanguage]   = useState('en');
  const [city,       setCity]       = useState('');
  const [country,    setCountry]    = useState('');
  const [latitude,   setLatitude]   = useState<number | null>(null);
  const [longitude,  setLongitude]  = useState<number | null>(null);
  const [goals,      setGoals]      = useState<string[]>([]);
  const themeIconMap = {
    system: Monitor,
    dark: Moon,
    light: Sun,
  } satisfies Record<ThemePreference, typeof Monitor>;

  // Animated background crossfade
  const [bgStep, setBgStep] = useState(step);
  useEffect(() => {
    const t = setTimeout(() => setBgStep(step), 60);
    return () => clearTimeout(t);
  }, [step]);

  function navigateTo(s: Step) {
    setPrevStep(step);
    setStep(s);
  }

  // ── Geolocation ──────────────────────────────────────────────────────────────
  async function detectLocation() {
    if (!navigator.geolocation) { toast.error('Geolocation not supported'); return; }
    setGeoLoading(true);
    try {
      const pos = await new Promise<GeolocationPosition>((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 8000 })
      );
      const { latitude: lat, longitude: lon } = pos.coords;
      setLatitude(lat); setLongitude(lon);
      try {
        const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);
        const d = await r.json();
        setCity(d.address?.city || d.address?.town || d.address?.village || d.address?.county || '');
        setCountry(d.address?.country || '');
      } catch { /* silent */ }
    } catch { toast.error('Could not detect location — type your city instead'); }
    finally { setGeoLoading(false); }
  }

  function toggleGoal(id: string) {
    setGoals(prev => prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]);
  }

  async function finish() {
    setSaving(true);
    try {
      const updates: Record<string, unknown> = { onboarding_completed: true };
      if (tradition)  updates.tradition    = tradition;
      if (lifeStage)  updates.life_stage   = lifeStage;
      if (language)   updates.app_language = language;
      if (city)      updates.city         = city;
      if (country)   updates.country      = country;
      if (latitude)  updates.latitude     = latitude;
      if (longitude) updates.longitude    = longitude;
      if (goals.length > 0) updates.seeking = goals;

      const { error } = await supabase.from('profiles').update(updates).eq('id', userId);
      if (error) throw error;
      toast.success('Welcome to Sanatana Sangam 🙏', { duration: 3000 });
      router.replace('/home');
    } catch (err) {
      console.error(err);
      toast.error('Could not save — please try again');
    } finally { setSaving(false); }
  }

  function canAdvance() {
    if (step === 1) return true;
    if (step === 2) return tradition !== '';
    if (step === 3) return lifeStage !== '';
    return true;
  }

  function advance() {
    if (step < 6) navigateTo((step + 1) as Step);
    else finish();
  }

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 overflow-hidden" style={{ fontFamily: 'var(--font-inter)' }}>
      {/* ── Background — animated crossfade between screen gradients ── */}
      <AnimatePresence mode="sync">
        <motion.div
          key={`bg-${bgStep}`}
          className="absolute inset-0"
          style={{ background: SCREEN_BG[bgStep] }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9 }}
        />
      </AnimatePresence>

      {/* Subtle texture overlay */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'4\' height=\'4\'%3E%3Crect width=\'4\' height=\'4\' fill=\'transparent\'/%3E%3Ccircle cx=\'1\' cy=\'1\' r=\'0.5\' fill=\'rgba(255,255,255,0.015)\'/%3E%3C/svg%3E")',
        opacity: 0.6,
      }} />

      <AmbientParticles />

      {/* ── Content scroll container ── */}
      <div className="relative h-full flex flex-col items-center overflow-y-auto">
        <div className="w-full max-w-sm px-5 py-10 flex flex-col min-h-full">

          {/* Progress pills */}
          <div className="mb-8">
            <ProgressPills step={step} total={6} />
          </div>

          {/* ── Screens ── */}
          <div className="flex-1">
            <AnimatePresence mode="wait">

              {/* ── Screen 1 — Sanctuary Welcome ─────────────────────── */}
              {step === 1 && (
                <motion.div
                  key="s1"
                  {...(prefersReducedMotion ? {} : slide)}
                  transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                  className="space-y-10 text-center"
                >
                  {/* Sacred mark */}
                  <motion.div
                    initial={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.85 }}
                    animate={prefersReducedMotion ? undefined : { opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2, duration: 0.6, ease: [0.34, 1.26, 0.64, 1] }}
                  >
                    <SacredFlame />
                  </motion.div>

                  <div className="space-y-4">
                    {/* Sanskrit */}
                    <motion.p
                      initial={prefersReducedMotion ? undefined : { opacity: 0 }}
                      animate={prefersReducedMotion ? undefined : { opacity: 1 }}
                      transition={{ delay: 0.35 }}
                      className="text-sm tracking-[0.28em] font-medium"
                      style={{ color: 'rgba(200, 146, 74, 0.50)', fontFamily: 'var(--font-devanagari)' }}
                    >
                      सनातन संगम
                    </motion.p>

                    {/* Main title — serif */}
                    <motion.h1
                      initial={prefersReducedMotion ? undefined : { opacity: 0, y: 8 }}
                      animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
                      transition={{ delay: 0.45, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                      style={{
                        fontFamily: 'var(--font-serif)',
                        fontSize: '2.4rem',
                        fontWeight: 600,
                        lineHeight: 1.1,
                        letterSpacing: '-0.02em',
                        color: '#f0e2c0',
                      }}
                    >
                      Sanatana<br />Sangam
                    </motion.h1>

                    {/* Tagline */}
                    <motion.p
                      initial={prefersReducedMotion ? undefined : { opacity: 0 }}
                      animate={prefersReducedMotion ? undefined : { opacity: 1 }}
                      transition={{ delay: 0.65 }}
                      className="text-sm leading-relaxed max-w-[260px] mx-auto"
                      style={{ color: 'rgba(230, 200, 140, 0.50)' }}
                    >
                      A home for Dharma. Your daily practice,<br />your lineage, your tradition.
                    </motion.p>
                  </div>

                  {/* Welcome pillars — three sacred aspects */}
                  <motion.div
                    initial={prefersReducedMotion ? undefined : { opacity: 0, y: 10 }}
                    animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
                    transition={{ delay: 0.8, duration: 0.4 }}
                    className="grid grid-cols-3 gap-3"
                  >
                    {[
                      { icon: '🪔', label: 'Nitya Karma', sub: 'Daily rituals' },
                      { icon: '📖', label: 'Pathshala',   sub: 'Scripture study' },
                      { icon: '👨‍👩‍👧', label: 'Kul',         sub: 'Family & lineage' },
                    ].map((p) => (
                      <div
                        key={p.label}
                        className="rounded-[1.1rem] px-2 py-3 text-center"
                        style={{ background: 'rgba(200, 146, 74, 0.07)', border: '1px solid rgba(200, 146, 74, 0.12)' }}
                      >
                        <div className="text-xl mb-1">{p.icon}</div>
                        <p className="text-[11px] font-semibold" style={{ color: 'rgba(240,210,150,0.75)' }}>{p.label}</p>
                        <p className="text-[9px] mt-0.5" style={{ color: 'rgba(200,170,110,0.40)' }}>{p.sub}</p>
                      </div>
                    ))}
                  </motion.div>
                </motion.div>
              )}

              {/* ── Screen 2 — Your Tradition ─────────────────────────── */}
              {step === 2 && (
                <motion.div
                  key="s2"
                  {...(prefersReducedMotion ? {} : slide)}
                  transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: 'rgba(200,146,74,0.55)' }}>
                      Step 1 of 5
                    </p>
                    <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', fontWeight: 600, color: '#f0e2c0', lineHeight: 1.15, letterSpacing: '-0.01em' }}>
                      Your Tradition
                    </h2>
                    <p className="text-sm leading-relaxed" style={{ color: 'rgba(220,190,130,0.50)' }}>
                      This shapes your Panchang, scripture, festivals, and the language of your practice.
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    {TRADITIONS.map((t, i) => {
                      const selected = tradition === t.value;
                      return (
                        <motion.button
                          key={t.value}
                          onClick={() => setTradition(t.value as TraditionKey)}
                          className="w-full flex items-center gap-4 rounded-[1.1rem] px-4 py-3.5 text-left relative overflow-hidden"
                          style={{
                            background: selected
                              ? 'rgba(200, 146, 74, 0.14)'
                              : 'rgba(255, 255, 255, 0.03)',
                            border: `1.5px solid ${selected ? 'rgba(200, 146, 74, 0.45)' : 'rgba(255, 255, 255, 0.07)'}`,
                            transition: 'all 220ms cubic-bezier(0.34, 1.26, 0.64, 1)',
                          }}
                          initial={prefersReducedMotion ? undefined : { opacity: 0, x: 12 }}
                          animate={prefersReducedMotion ? undefined : { opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.06, duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                        >
                          {/* Selection glow */}
                          {selected && (
                            <div className="absolute inset-0 pointer-events-none" style={{
                              background: 'radial-gradient(ellipse at left, rgba(200,146,74,0.12), transparent 60%)',
                            }} />
                          )}

                          {/* Emoji well */}
                          <div
                            className="relative flex-shrink-0 w-11 h-11 rounded-[0.85rem] flex items-center justify-center text-2xl"
                            style={{ background: selected ? 'rgba(200,146,74,0.18)' : 'rgba(255,255,255,0.05)' }}
                          >
                            {t.emoji}
                          </div>

                          <div className="flex-1 min-w-0 relative">
                            <p className="text-sm font-semibold" style={{ color: selected ? '#f0c870' : 'rgba(230, 200, 130, 0.72)' }}>
                              {t.label}
                            </p>
                            <p className="text-xs mt-0.5" style={{ color: 'rgba(200, 170, 110, 0.38)' }}>{t.desc}</p>
                          </div>

                          {/* Check */}
                          <AnimatePresence>
                            {selected && (
                              <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                                className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
                                style={{ background: '#C8924A' }}
                              >
                                <Check size={11} color="#1a0e04" strokeWidth={2.5} />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.button>
                      );
                    })}
                  </div>

                  <p className="text-center text-[10px]" style={{ color: 'rgba(200,170,110,0.30)' }}>
                    🔒 Your tradition anchors your practice — set once
                  </p>
                </motion.div>
              )}

              {/* ── Screen 3 — Life Stage / Ashrama ──────────────────── */}
              {step === 3 && (
                <motion.div
                  key="s3"
                  {...(prefersReducedMotion ? {} : slide)}
                  transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: 'rgba(100,180,100,0.55)' }}>
                      Step 2 of 5
                    </p>
                    <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', fontWeight: 600, color: '#f0e2c0', lineHeight: 1.15, letterSpacing: '-0.01em' }}>
                      Your Stage<br />of Life
                    </h2>
                    <p className="text-sm leading-relaxed" style={{ color: 'rgba(160,210,160,0.50)' }}>
                      Your duties shift with each stage. This shapes your Nitya Karma, daily guidance, and how we speak to you.
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    {getAllAshramaStages(tradition || 'hindu').map((stage, i) => {
                      const selected = lifeStage === stage.key;
                      return (
                        <motion.button
                          key={stage.key}
                          onClick={() => setLifeStage(stage.key)}
                          className="w-full flex items-center gap-4 rounded-[1.1rem] px-4 py-3.5 text-left relative overflow-hidden"
                          style={{
                            background: selected
                              ? `${stage.accent}1a`
                              : 'rgba(255,255,255,0.03)',
                            border: `1.5px solid ${selected ? `${stage.accent}55` : 'rgba(255,255,255,0.07)'}`,
                            transition: 'all 220ms cubic-bezier(0.34, 1.26, 0.64, 1)',
                          }}
                          initial={prefersReducedMotion ? undefined : { opacity: 0, x: 12 }}
                          animate={prefersReducedMotion ? undefined : { opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.07, duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                        >
                          {/* Selection glow */}
                          {selected && (
                            <div className="absolute inset-0 pointer-events-none" style={{
                              background: `radial-gradient(ellipse at left, ${stage.accent}18, transparent 60%)`,
                            }} />
                          )}

                          {/* Icon well */}
                          <div
                            className="relative flex-shrink-0 w-11 h-11 rounded-[0.85rem] flex items-center justify-center text-2xl"
                            style={{ background: selected ? `${stage.accent}22` : 'rgba(255,255,255,0.05)' }}
                          >
                            {stage.icon}
                          </div>

                          <div className="flex-1 min-w-0 relative">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold" style={{ color: selected ? stage.accent : 'rgba(230,200,130,0.72)' }}>
                                {stage.label}
                              </p>
                              <span className="text-[9px] rounded-full px-1.5 py-0.5" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(200,180,130,0.40)' }}>
                                {stage.ageRange}
                              </span>
                            </div>
                            <p className="text-xs mt-0.5" style={{ color: 'rgba(200,170,110,0.38)' }}>{stage.subtitle}</p>
                          </div>

                          {/* Check */}
                          <AnimatePresence>
                            {selected && (
                              <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                                className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
                                style={{ background: stage.accent }}
                              >
                                <Check size={11} color="#1a0e04" strokeWidth={2.5} />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.button>
                      );
                    })}
                  </div>

                  <p className="text-center text-[10px]" style={{ color: 'rgba(160,200,160,0.28)' }}>
                    Age ranges are a guide — choose what feels true for you
                  </p>
                </motion.div>
              )}

              {/* ── Screen 4 — Language ────────────────────────────────── */}
              {step === 4 && (
                <motion.div
                  key="s4"
                  {...(prefersReducedMotion ? {} : slide)}
                  transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: 'rgba(180,120,220,0.55)' }}>
                      Step 3 of 5
                    </p>
                    <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', fontWeight: 600, color: '#f0e2c0', lineHeight: 1.15, letterSpacing: '-0.01em' }}>
                      Your Language
                    </h2>
                    <p className="text-sm leading-relaxed" style={{ color: 'rgba(200, 170, 210, 0.48)' }}>
                      Choose how Sanatana Sangam speaks to you. You can change this any time.
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    {APP_LANGUAGES.map((lang, i) => {
                      const selected = language === lang.value;
                      return (
                        <motion.button
                          key={lang.value}
                          onClick={() => setLanguage(lang.value)}
                          className="w-full flex items-center justify-between rounded-[1.1rem] px-5 py-4 text-left relative overflow-hidden"
                          style={{
                            background: selected ? 'rgba(160, 110, 220, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                            border: `1.5px solid ${selected ? 'rgba(160,110,220,0.40)' : 'rgba(255,255,255,0.07)'}`,
                            transition: 'all 220ms cubic-bezier(0.34, 1.26, 0.64, 1)',
                          }}
                          initial={prefersReducedMotion ? undefined : { opacity: 0, x: 12 }}
                          animate={prefersReducedMotion ? undefined : { opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05, duration: 0.30, ease: [0.22, 1, 0.36, 1] }}
                        >
                          <p className="text-sm font-semibold" style={{ color: selected ? '#d8c0f8' : 'rgba(210,190,230,0.68)' }}>
                            {lang.label}
                          </p>
                          <AnimatePresence>
                            {selected && (
                              <motion.div
                                initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                                className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                                style={{ background: 'rgba(160,110,220,0.85)' }}
                              >
                                <Check size={11} color="#1a0e04" strokeWidth={2.5} />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* ── Screen 5 — Location ────────────────────────────────── */}
              {step === 5 && (
                <motion.div
                  key="s5"
                  {...(prefersReducedMotion ? {} : slide)}
                  transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: 'rgba(80,160,200,0.55)' }}>
                      Step 4 of 5
                    </p>
                    <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', fontWeight: 600, color: '#f0e2c0', lineHeight: 1.15, letterSpacing: '-0.01em' }}>
                      Your Sacred<br />Location
                    </h2>
                    <p className="text-sm leading-relaxed" style={{ color: 'rgba(130, 185, 210, 0.48)' }}>
                      For accurate Panchang, local festivals, and temples near you. Optional.
                    </p>
                  </div>

                  {/* Detect button */}
                  <motion.button
                    onClick={detectLocation}
                    disabled={geoLoading}
                    className="w-full flex items-center justify-center gap-2.5 rounded-[1.1rem] py-4 text-sm font-medium disabled:opacity-60"
                    style={{
                      background: 'rgba(80, 150, 200, 0.10)',
                      border: '1.5px dashed rgba(80, 150, 200, 0.35)',
                      color: 'rgba(130, 195, 235, 0.85)',
                      transition: 'all 220ms ease',
                    }}
                    whileTap={prefersReducedMotion ? {} : { scale: 0.97 }}
                  >
                    {geoLoading
                      ? <><Loader2 size={16} className="animate-spin" /> Locating you…</>
                      : <><MapPin size={16} /> Detect my location</>}
                  </motion.button>

                  {/* Confirmed location */}
                  <AnimatePresence>
                    {city && (
                      <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4 }}
                        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                        className="flex items-center gap-2.5 rounded-[1rem] px-4 py-3"
                        style={{ background: 'rgba(60, 180, 100, 0.08)', border: '1px solid rgba(60, 180, 100, 0.22)' }}
                      >
                        <span>📍</span>
                        <p className="text-sm font-medium" style={{ color: 'rgba(160, 230, 175, 0.85)' }}>
                          {[city, country].filter(Boolean).join(', ')}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
                    <p className="text-[10px]" style={{ color: 'rgba(200,180,140,0.30)' }}>or type below</p>
                    <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
                  </div>

                  {/* Manual inputs */}
                  <div className="grid grid-cols-2 gap-3">
                    {([
                      { placeholder: 'City', value: city, setter: setCity },
                      { placeholder: 'Country', value: country, setter: setCountry },
                    ] as const).map(({ placeholder, value, setter }) => (
                      <input
                        key={placeholder}
                        type="text"
                        placeholder={placeholder}
                        value={value}
                        onChange={(e) => setter(e.target.value)}
                        className="rounded-[0.9rem] px-4 py-3 text-sm outline-none"
                        style={{
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(80, 150, 200, 0.18)',
                          color: 'rgba(220,200,160,0.85)',
                        }}
                      />
                    ))}
                  </div>

                  <motion.button
                    onClick={advance}
                    className="w-full text-center text-xs py-2"
                    style={{ color: 'rgba(200,180,140,0.32)' }}
                    whileTap={prefersReducedMotion ? {} : { opacity: 0.7 }}
                  >
                    Skip for now →
                  </motion.button>
                </motion.div>
              )}

              {/* ── Screen 6 — Intentions ─────────────────────────────── */}
              {step === 6 && (
                <motion.div
                  key="s6"
                  {...(prefersReducedMotion ? {} : slide)}
                  transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: 'rgba(200,146,74,0.55)' }}>
                      Step 5 of 5
                    </p>
                    <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', fontWeight: 600, color: '#f0e2c0', lineHeight: 1.15, letterSpacing: '-0.01em' }}>
                      What draws<br />you here?
                    </h2>
                    <p className="text-sm leading-relaxed" style={{ color: 'rgba(220,190,130,0.48)' }}>
                      Choose what resonates. This shapes your home screen and guidance.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    {GOALS.map((goal, i) => {
                      const selected = goals.includes(goal.id);
                      return (
                        <motion.button
                          key={goal.id}
                          onClick={() => toggleGoal(goal.id)}
                          className="rounded-[1.1rem] px-3 py-4 text-left relative overflow-hidden"
                          style={{
                            background: selected ? 'rgba(200, 146, 74, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                            border: `1.5px solid ${selected ? 'rgba(200, 146, 74, 0.40)' : 'rgba(255, 255, 255, 0.07)'}`,
                            transition: 'all 220ms cubic-bezier(0.34, 1.26, 0.64, 1)',
                          }}
                          initial={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.95 }}
                          animate={prefersReducedMotion ? undefined : { opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.05, duration: 0.30, ease: [0.22, 1, 0.36, 1] }}
                          whileTap={prefersReducedMotion ? {} : { scale: 0.96 }}
                        >
                          {selected && (
                            <div className="absolute inset-0 pointer-events-none" style={{
                              background: 'radial-gradient(circle at top right, rgba(200,146,74,0.10), transparent 55%)',
                            }} />
                          )}
                          <div className="flex items-start justify-between gap-1 mb-2">
                            <span className="text-xl">{goal.emoji}</span>
                            <AnimatePresence>
                              {selected && (
                                <motion.div
                                  initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                                  transition={{ type: 'spring', stiffness: 450, damping: 20 }}
                                  className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                                  style={{ background: '#C8924A' }}
                                >
                                  <Check size={9} color="#1a0e04" strokeWidth={2.5} />
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                          <p className="text-[12px] font-semibold leading-tight" style={{ color: selected ? '#f0c870' : 'rgba(220,195,130,0.65)' }}>
                            {goal.label}
                          </p>
                          <p className="text-[10px] mt-0.5 leading-tight" style={{ color: 'rgba(200,170,110,0.35)' }}>
                            {goal.desc}
                          </p>
                        </motion.button>
                      );
                    })}
                  </div>

                  <p className="text-center text-[10px]" style={{ color: 'rgba(200,170,110,0.28)' }}>
                    Select any that resonate — or none at all
                  </p>

                  <div className="space-y-2">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: 'rgba(200,146,74,0.55)' }}>
                      App theme
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {THEME_OPTIONS.map((option) => {
                        const selected = themePreference === option.value;
                        const Icon = themeIconMap[option.value];
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setThemePreference(option.value)}
                            className="rounded-[1rem] px-3 py-3 text-left"
                            style={{
                              background: selected ? 'rgba(200, 146, 74, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                              border: `1px solid ${selected ? 'rgba(200, 146, 74, 0.38)' : 'rgba(255, 255, 255, 0.07)'}`,
                            }}
                          >
                            <Icon size={15} style={{ color: selected ? '#f0c870' : 'rgba(200,170,110,0.45)' }} />
                            <p className="mt-2 text-[12px] font-medium leading-tight" style={{ color: selected ? '#f0c870' : 'rgba(220,195,130,0.65)' }}>
                              {option.label}
                            </p>
                            <p className="mt-0.5 text-[10px] leading-tight" style={{ color: 'rgba(200,170,110,0.35)' }}>
                              {option.description}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>

          {/* ── CTA ──────────────────────────────────────────────────────── */}
          <div className="mt-8 space-y-3">
            {/* Primary advance button — all screens except location (step 5) */}
            {step !== 5 && (
              <motion.button
                onClick={advance}
                disabled={!canAdvance() || saving}
                className="w-full flex items-center justify-center gap-2 rounded-[1.1rem] py-4 text-sm font-semibold relative overflow-hidden disabled:opacity-35"
                style={{
                  background: canAdvance()
                    ? 'linear-gradient(135deg, rgba(200,120,24,0.92), rgba(200,146,74,0.85))'
                    : 'rgba(200,146,74,0.10)',
                  color: canAdvance() ? '#1a0c04' : 'rgba(220,190,120,0.4)',
                  boxShadow: canAdvance() ? '0 6px 24px rgba(200,120,24,0.28), inset 0 1px 0 rgba(255,230,180,0.18)' : 'none',
                  transition: 'all 240ms cubic-bezier(0.34, 1.26, 0.64, 1)',
                }}
                whileTap={prefersReducedMotion ? {} : { scale: 0.97 }}
              >
                {saving
                  ? <><Loader2 size={15} className="animate-spin" /> Saving…</>
                  : step === 6
                    ? '🙏 Enter Sanatana Sangam'
                    : <>Continue <ChevronRight size={15} /></>}
              </motion.button>
            )}

            {/* Screen 5 — location CTA */}
            {step === 5 && (
              <motion.button
                onClick={advance}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 rounded-[1.1rem] py-4 text-sm font-semibold"
                style={{
                  background: 'linear-gradient(135deg, rgba(80,150,200,0.85), rgba(80,120,200,0.75))',
                  color: '#e8f0ff',
                  boxShadow: '0 6px 24px rgba(60,120,200,0.24), inset 0 1px 0 rgba(200,220,255,0.14)',
                }}
                whileTap={prefersReducedMotion ? {} : { scale: 0.97 }}
              >
                {city ? <>Continue <ChevronRight size={15} /></> : 'Skip for now'}
              </motion.button>
            )}

            {/* Back */}
            {step > 1 && (
              <button
                onClick={() => navigateTo((step - 1) as Step)}
                className="w-full text-center text-xs py-2"
                style={{ color: 'rgba(200,170,110,0.30)' }}
              >
                ← Back
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
