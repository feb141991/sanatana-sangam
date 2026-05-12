'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import toast from 'react-hot-toast';
import { 
  ArrowRight, ArrowLeft, Eye, EyeOff, MapPin, Loader2, Lock, 
  Sparkles, Check, Heart, Globe, Users, BookOpen, Shield, 
  BarChart3, Star
} from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { TRADITIONS } from '@/lib/utils';
import type { TraditionKey } from '@/lib/traditions';

type Step = 1 | 2 | 3;

const QUOTES = [
  { text: "Dharmo rakṣati rakṣitaḥ", author: "Mahabharata", meaning: "Dharma protects those who protect it.", tradition: 'hindu' },
  { text: "Man jeetai jag jeet", author: "Guru Granth Sahib", meaning: "To conquer the mind is to conquer the world.", tradition: 'sikh' },
  { text: "Attā hi attano nātho", author: "Dhammapada", meaning: "One is one's own master.", tradition: 'buddhist' },
  { text: "Parasparopagraho Jīvānām", author: "Tattvartha Sutra", meaning: "Souls render service to one another.", tradition: 'jain' },
  { text: "Sarve bhavantu sukhinaḥ", author: "Rig Veda", meaning: "May everyone be happy and free from suffering.", tradition: 'hindu' }
];

const APP_FEATURES = [
  { 
    id: 'mandali',
    title: "Global Mandali", 
    desc: "Connect with seekers in your city and across the world.", 
    icon: Users,
    color: "var(--glow-sikh)"
  },
  { 
    id: 'pathshala',
    title: "Sacred Pathshala", 
    desc: "Interactive library of Gita, Gurbani, Dhammapada & Agamas.", 
    icon: BookOpen,
    color: "var(--glow-hindu)"
  },
  { 
    id: 'pulse',
    title: "Sadhana Pulse", 
    desc: "Track your daily rhythms, mala counts and spiritual growth.", 
    icon: BarChart3,
    color: "var(--glow-jain)"
  },
  { 
    id: 'kul',
    title: "Kul & Lineage", 
    desc: "Preserve your family traditions and ancestral wisdom.", 
    icon: Shield,
    color: "var(--glow-buddhist)"
  }
];

const FACTS = [
  "Did you know? Shoonaya covers Hindu, Sikh, Buddhist, and Jain traditions.",
  "Join over 10,000 seekers dedicated to a life of Dharma.",
  "Access personalized Panchang and Vrat notifications for your location.",
  "Discover sacred Tirthas and local Mandalis near you."
];

const TRADITION_SIGNS = [
  { char: '🕉️', label: 'Sanatan', color: 'var(--glow-hindu)' },
  { char: '☬', label: 'Sikh', color: 'var(--glow-sikh)' },
  { char: '☸️', label: 'Buddhist', color: 'var(--glow-buddhist)' },
  { char: '🤲', label: 'Jain', color: 'var(--glow-jain)' }
];

const TRADITION_COLORS: Record<TraditionKey | '', string> = {
  'hindu': 'var(--glow-hindu)',
  'sikh': 'var(--glow-sikh)',
  'buddhist': 'var(--glow-buddhist)',
  'jain': 'var(--glow-jain)',
  'other': 'rgba(216, 138, 28, 0.2)',
  '': 'rgba(216, 138, 28, 0.15)'
};

// ─── Tradition Signages Display ──────────────────────────────────────────────
function TraditionSignages({ activeIdx }: { activeIdx: number }) {
  return (
    <div className="relative flex items-center justify-center gap-8 py-10">
      {TRADITION_SIGNS.map((sign, i) => (
        <motion.div
          key={sign.label}
          animate={{ 
            scale: activeIdx === i ? 1.4 : 1,
            opacity: activeIdx === i ? 1 : 0.4,
            y: activeIdx === i ? -10 : 0
          }}
          className="flex flex-col items-center gap-3"
        >
          <div className="text-5xl drop-shadow-xl filter">{sign.char}</div>
          <div className={`text-[10px] font-bold uppercase tracking-widest transition-opacity ${activeIdx === i ? 'opacity-100' : 'opacity-0'}`} style={{ color: sign.color }}>
            {sign.label}
          </div>
          {activeIdx === i && (
            <motion.div 
              layoutId="sign-glow"
              className="absolute inset-0 -z-10 blur-3xl opacity-30 rounded-full"
              style={{ background: sign.color }}
            />
          )}
        </motion.div>
      ))}
    </div>
  );
}

export default function SignupPage() {
  const router   = useRouter();
  const supabase = useMemo(() => {
    if (typeof window === 'undefined') return null;
    return createClient();
  }, []);

  const [step,       setStep]       = useState<Step>(1);
  const [loading,    setLoading]    = useState(false);
  const [showPass,   setShowPass]   = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [acceptedPolicies, setAcceptedPolicies] = useState(false);
  const [quoteIdx, setQuoteIdx] = useState(0);
  const [factIdx, setFactIdx] = useState(0);
  const [hoveredTradition, setHoveredTradition] = useState<TraditionKey | ''>('');
  const [activeFeature, setActiveFeature] = useState(0);

  const [form, setForm] = useState({
    email:          '',
    password:       '',
    full_name:      '',
    username:       '',
    tradition:      '' as TraditionKey | '',
    city:           '',
    country:        '',
    latitude:       null as number | null,
    longitude:      null as number | null,
    sampradaya:     '',
    ishta_devata:   '',
    spiritual_level:'jigyasu',
    seeking:        [] as string[],
    kul:            '',
    gotra:          '',
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setInviteCode(params.get('ref')?.trim().toUpperCase() ?? '');

    const interval = setInterval(() => {
      setQuoteIdx(prev => (prev + 1) % QUOTES.length);
      setFactIdx(prev => (prev + 1) % FACTS.length);
      setActiveFeature(prev => (prev + 1) % APP_FEATURES.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  async function detectLocation() {
    if (!navigator.geolocation) { toast.error('Geolocation not supported'); return; }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res  = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`, { 
            headers: { 
              'Accept-Language': 'en',
              'User-Agent': 'Shoonaya-App-v1'
            } 
          });
          const data = await res.json();
          const addr = data.address ?? {};
          const city = addr.city || addr.town || addr.municipality || addr.village || addr.suburb || addr.county || '';
          const country = addr.country || '';
          setForm(f => ({ ...f, city, country, latitude, longitude }));
          if (city) {
            toast.success(`📍 ${city} detected!`);
          } else if (country) {
            toast.success(`📍 Located in ${country}`);
          } else {
            toast.error('Could not determine exact location');
          }
        } catch {
          toast.error('Location lookup failed');
        } finally {
          setGeoLoading(false);
        }
      },
      () => { toast.error('Location access denied'); setGeoLoading(false); }
    );
  }

  function toggleSeeking(value: string) {
    setForm(f => ({
      ...f,
      seeking: f.seeking.includes(value) ? f.seeking.filter(s => s !== value) : [...f.seeking, value],
    }));
  }

  async function handleSubmit() {
    if (!supabase || !acceptedPolicies) return;
    setLoading(true);
    try {
      const normalizedEmail = form.email.trim().toLowerCase();
      const normalizedUsername = form.username.toLowerCase().trim().replace(/\s+/g, '_');
      
      const profilePayload = {
        full_name: form.full_name.trim(),
        username: normalizedUsername,
        tradition: form.tradition || null,
        city: form.city.trim() || null,
        country: form.country.trim() || null,
        latitude: form.latitude,
        longitude: form.longitude,
        sampradaya: form.sampradaya || null,
        ishta_devata: form.ishta_devata || null,
        spiritual_level: form.spiritual_level,
        seeking: form.seeking,
        kul: form.kul.trim() || null,
        gotra: form.gotra.trim() || null,
        app_language: 'en',
        transliteration_language: 'en',
        scripture_script: 'devanagari',
        show_transliteration: true,
        meaning_language: 'en',
        wants_festival_reminders: true,
        wants_shloka_reminders: true,
        wants_community_notifications: true,
        wants_family_notifications: true,
        is_admin: false,
        is_pro: false,
        life_stage_locked: false,
        is_banned: false,
      };

      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password: form.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: { ...profilePayload, referred_by_code: inviteCode || null },
        },
      });

      if (error) {
        if (error.message.includes('unique constraint') || error.message.includes('already registered')) {
          throw new Error('This email or username is already taken. Please try another.');
        }
        throw error;
      }

      if (data.session) {
        const { error: syncError } = await supabase.from('profiles').update(profilePayload).eq('id', data.user!.id);
        if (syncError) console.error('Profile sync error:', syncError);
        toast.success('Welcome to Shoonaya! 🙏');
        router.push('/home');
      } else {
        toast.success('Pranam! Please check your inbox to confirm.');
        router.push(`/login?message=check_email&email=${encodeURIComponent(normalizedEmail)}`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong while saving. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const activeAuraColor = TRADITION_SIGNS[quoteIdx % TRADITION_SIGNS.length].color;

  return (
    <div className="min-h-screen flex bg-[var(--premium-ivory)] overflow-hidden font-outfit">
      
      {/* ── LEFT SIDE: Immersive & Interactive (Value Section) ─────────────────────── */}
      <div className="hidden lg:flex w-1/2 relative flex-col items-center justify-between p-16 overflow-hidden border-r border-[var(--premium-border)] bg-[#faf6ef]">
        
        {/* Dynamic Background Aura */}
        <motion.div 
          animate={{ 
            backgroundColor: activeAuraColor,
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="absolute inset-0 z-0 blur-[120px] opacity-20"
          style={{ background: `radial-gradient(circle at center, ${activeAuraColor} 0%, transparent 70%)` }}
        />

        {/* Top: Shoonaya Logo & Signs */}
        <div className="relative z-10 w-full flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-2 text-4xl font-serif font-bold text-[var(--brand-primary-strong)] tracking-tighter"
          >
            Shoonaya
          </motion.div>
          <div className="text-[10px] uppercase tracking-[0.4em] text-[var(--brand-muted)] font-bold mb-8">Sanatan Sangam</div>
          
          <TraditionSignages activeIdx={quoteIdx % TRADITION_SIGNS.length} />
        </div>

        {/* Middle: Interactive Content Carousel */}
        <div className="relative z-10 w-full max-w-lg space-y-12">
          
          {/* Why Shoonaya? Featured Apps */}
          <div className="space-y-6">
            <h2 className="text-sm font-bold uppercase tracking-[0.3em] text-[var(--premium-gold)] text-center">Your Spiritual Companion</h2>
            <div className="grid grid-cols-2 gap-4">
              {APP_FEATURES.map((feat, i) => (
                <motion.div
                  key={feat.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ 
                    opacity: activeFeature === i ? 1 : 0.6,
                    scale: activeFeature === i ? 1.05 : 1,
                    borderColor: activeFeature === i ? feat.color : 'rgba(0,0,0,0.05)'
                  }}
                  className="p-5 rounded-[2rem] bg-white/40 border-2 backdrop-blur-sm transition-all duration-500 cursor-default shadow-sm"
                >
                  <div className="p-3 rounded-2xl w-fit mb-3" style={{ background: activeFeature === i ? feat.color : 'rgba(0,0,0,0.05)' }}>
                    <feat.icon size={20} className={activeFeature === i ? "text-white" : "text-[var(--brand-muted)]"} />
                  </div>
                  <h4 className="font-bold text-[var(--brand-primary-strong)] text-sm">{feat.title}</h4>
                  <p className="text-[10px] text-[var(--brand-muted)] mt-1 leading-relaxed">{feat.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Facts & Shloka Section */}
          <div className="h-40 flex flex-col justify-center text-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={quoteIdx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                <h2 className="text-3xl font-devanagari text-[var(--brand-primary-strong)] leading-relaxed">
                  {QUOTES[quoteIdx].text}
                </h2>
                <p className="text-lg italic font-outfit text-[var(--brand-muted)]">
                  &quot;{QUOTES[quoteIdx].meaning}&quot;
                </p>
                <div className="flex items-center justify-center gap-2 text-xs uppercase tracking-[0.1em] text-[var(--premium-gold)] font-bold">
                  <Star size={12} fill="var(--premium-gold)" />
                  {QUOTES[quoteIdx].author}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Bottom: "Did you know?" Bubbles */}
        <div className="relative z-10 w-full flex justify-center">
           <AnimatePresence mode="wait">
            <motion.div
              key={factIdx}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="px-6 py-3 rounded-full bg-[var(--premium-gold-soft)] border border-[var(--premium-gold)]/20 text-[11px] font-bold text-[var(--premium-gold)] flex items-center gap-3"
            >
              <Sparkles size={14} />
              {FACTS[factIdx]}
            </motion.div>
           </AnimatePresence>
        </div>
      </div>

      {/* ── RIGHT SIDE: "Cloud Glass" Signup Flow ────────────────────────── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 relative bg-[var(--premium-ivory)]">
        
        {/* Mobile Header */}
        <div className="lg:hidden absolute top-8 left-0 right-0 flex flex-col items-center">
          <div className="text-2xl font-serif font-bold text-[var(--brand-primary-strong)]">Shoonaya</div>
          <h1 className="text-xs uppercase tracking-widest text-[var(--brand-muted)] mt-1">Sanatan Sangam</h1>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          {/* Cloud Glass Card */}
          <div className="bg-white/70 backdrop-blur-[40px] rounded-[3rem] border border-[var(--premium-border)] shadow-[0_40px_80px_rgba(142,94,42,0.1)] p-10 relative overflow-hidden">
            
            {/* Header */}
            <div className="mb-10 text-center lg:text-left">
              <h3 className="text-3xl font-poppins font-bold text-[var(--brand-primary-strong)] tracking-tight">Join the Sangam</h3>
              <p className="text-sm text-[var(--brand-muted)] font-outfit mt-2">Your journey into the infinite begins here.</p>
            </div>

            {/* Steps Flow */}
            <div className="relative min-h-[420px]">
              <AnimatePresence mode="wait" initial={false}>
                
                {/* STEP 1: Account */}
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ x: 300, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -300, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="space-y-6"
                  >
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-widest text-[var(--premium-gold)] ml-1">Full Name</label>
                        <input type="text" placeholder="Arjun Sharma" value={form.full_name}
                          onChange={e => setForm({ ...form, full_name: e.target.value })}
                          className="w-full bg-white/50 border border-[var(--premium-border)] rounded-2xl px-6 py-4 text-sm font-outfit focus:border-[var(--premium-gold)] focus:ring-4 focus:ring-[var(--premium-gold-soft)] outline-none transition-all shadow-sm" />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-widest text-[var(--premium-gold)] ml-1">Username</label>
                        <div className="relative">
                          <span className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--brand-muted)] font-bold">@</span>
                          <input type="text" placeholder="arjun_seeker" value={form.username}
                            onChange={e => setForm({ ...form, username: e.target.value })}
                            className="w-full bg-white/50 border border-[var(--premium-border)] rounded-2xl pl-12 pr-6 py-4 text-sm font-outfit focus:border-[var(--premium-gold)] focus:ring-4 focus:ring-[var(--premium-gold-soft)] outline-none transition-all shadow-sm" />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-widest text-[var(--premium-gold)] ml-1">Email</label>
                        <input type="email" placeholder="arjun@wisdom.com" value={form.email}
                          onChange={e => setForm({ ...form, email: e.target.value })}
                          className="w-full bg-white/50 border border-[var(--premium-border)] rounded-2xl px-6 py-4 text-sm font-outfit focus:border-[var(--premium-gold)] focus:ring-4 focus:ring-[var(--premium-gold-soft)] outline-none transition-all shadow-sm" />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-widest text-[var(--premium-gold)] ml-1">Password</label>
                        <div className="relative">
                          <input type={showPass ? 'text' : 'password'} placeholder="Min. 8 characters" value={form.password}
                            onChange={e => setForm({ ...form, password: e.target.value })}
                            className="w-full bg-white/50 border border-[var(--premium-border)] rounded-2xl px-6 py-4 text-sm font-outfit focus:border-[var(--premium-gold)] focus:ring-4 focus:ring-[var(--premium-gold-soft)] outline-none transition-all shadow-sm" />
                          <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-6 top-1/2 -translate-y-1/2 text-[var(--brand-muted)] hover:text-[var(--premium-gold)] transition-colors">
                            {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={() => {
                        if (!form.full_name || !form.email || !form.password || !form.username) return toast.error('Please fill all fields');
                        setStep(2);
                      }}
                      className="w-full bg-[var(--premium-gold)] text-white py-5 rounded-2xl font-bold font-outfit shadow-[0_15px_30px_rgba(216,138,28,0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-6"
                    >
                      Share Your Path <ArrowRight size={18} />
                    </button>
                  </motion.div>
                )}

                {/* STEP 2: Tradition & Identity */}
                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ x: 300, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -300, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="space-y-8"
                  >
                    <div className="space-y-6">
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <label className="text-xs font-bold uppercase tracking-widest text-[var(--premium-gold)] ml-1">Choose Tradition</label>
                          <span className="flex items-center gap-1 text-[9px] font-bold text-[var(--premium-gold)] bg-[var(--premium-gold-soft)] px-2.5 py-1 rounded-full border border-[var(--premium-border)]">
                            <Lock size={10} /> CORE IDENTITY
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          {TRADITIONS.map(t => (
                            <motion.button 
                              key={t.value}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onMouseEnter={() => setHoveredTradition(t.value as TraditionKey)}
                              onMouseLeave={() => setHoveredTradition('')}
                              onClick={() => setForm({ ...form, tradition: t.value as TraditionKey })}
                              className={`p-5 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-3 relative overflow-hidden ${
                                form.tradition === t.value 
                                  ? "border-[var(--premium-gold)] bg-white shadow-[0_15px_30px_rgba(216,138,28,0.15)]"
                                  : "border-[var(--premium-border)] bg-white/20 hover:border-[var(--premium-gold)] hover:bg-white/40"
                              }`}
                            >
                              {form.tradition === t.value && (
                                <motion.div layoutId="trad-glow" className="absolute inset-0 opacity-10 bg-[var(--premium-gold)]" />
                              )}
                              <span className="text-4xl relative z-10">{t.emoji}</span>
                              <span className={`text-xs font-bold font-outfit relative z-10 ${form.tradition === t.value ? "text-[var(--premium-gold)]" : "text-[var(--brand-muted)]"}`}>
                                {t.label}
                              </span>
                            </motion.button>
                          ))}
                        </div>
                      </div>

                      {form.tradition && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                          <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-[var(--premium-gold)] ml-1">Your Location</label>
                            <div className="relative">
                              <input type="text" placeholder="Search City" value={form.city}
                                onChange={e => setForm({ ...form, city: e.target.value })}
                                className="w-full bg-white/50 border border-[var(--premium-border)] rounded-2xl px-6 py-4 text-sm font-outfit focus:border-[var(--premium-gold)] outline-none shadow-sm" />
                              <button onClick={detectLocation} className="absolute right-5 top-1/2 -translate-y-1/2 text-[var(--premium-gold)] hover:scale-110 transition-transform">
                                {geoLoading ? <Loader2 size={18} className="animate-spin" /> : <MapPin size={20} />}
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>

                    <div className="flex gap-4 pt-6">
                      <button onClick={() => setStep(1)} className="p-5 rounded-2xl border-2 border-[var(--premium-border)] text-[var(--brand-muted)] font-bold hover:bg-white transition-all">
                        <ArrowLeft size={20} />
                      </button>
                      <button 
                        onClick={() => {
                          if (!form.tradition) return toast.error('Choose a tradition');
                          setStep(3);
                        }}
                        className="flex-1 bg-[var(--premium-gold)] text-white py-5 rounded-2xl font-bold font-outfit shadow-[0_15px_30px_rgba(216,138,28,0.2)] hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                      >
                        Last Step <ArrowRight size={18} />
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* STEP 3: Seeking */}
                {step === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ x: 300, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -300, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="space-y-8"
                  >
                    <div className="space-y-6">
                      <label className="text-xs font-bold uppercase tracking-widest text-[var(--premium-gold)] ml-1">What are you seeking?</label>
                      <div className="grid grid-cols-1 gap-3">
                        {[
                          { id: 'community',  label: 'Local Sangam', icon: Users, sub: 'Connect with nearby seekers' },
                          { id: 'knowledge',  label: 'Sacred Pathshala', icon: Globe, sub: 'Learn Shastras & Wisdom' },
                          { id: 'events',     label: 'Auspicious Utsav', icon: Sparkles, sub: 'Festivals & Holy Days' },
                          { id: 'mentorship', label: 'Guru Connection', icon: Heart, sub: 'Spiritual Mentorship' },
                        ].map(opt => (
                          <button 
                            key={opt.id}
                            onClick={() => toggleSeeking(opt.id)}
                            className={`flex items-center gap-5 px-6 py-4 rounded-[2rem] border-2 transition-all group ${
                              form.seeking.includes(opt.id)
                                ? "border-[var(--premium-gold)] bg-white shadow-lg"
                                : "border-[var(--premium-border)] bg-white/20 hover:border-[var(--premium-gold)] hover:bg-white/40"
                            }`}
                          >
                            <div className={`p-3 rounded-2xl transition-colors ${form.seeking.includes(opt.id) ? "bg-[var(--premium-gold)] text-white" : "bg-[var(--premium-gold-soft)] text-[var(--premium-gold)] group-hover:bg-[var(--premium-gold)] group-hover:text-white"}`}>
                              <opt.icon size={20} />
                            </div>
                            <div className="text-left">
                              <span className={`block text-sm font-bold font-outfit ${form.seeking.includes(opt.id) ? "text-[var(--premium-gold)]" : "text-[var(--brand-primary-strong)]"}`}>
                                {opt.label}
                              </span>
                              <span className="text-[10px] text-[var(--brand-muted)]">{opt.sub}</span>
                            </div>
                            {form.seeking.includes(opt.id) && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="ml-auto"><Check size={20} className="text-[var(--premium-gold)]" /></motion.div>}
                          </button>
                        ))}
                      </div>

                      <div className="pt-4 flex items-start gap-4 px-2">
                        <div className="relative mt-1">
                          <input type="checkbox" checked={acceptedPolicies} onChange={e => setAcceptedPolicies(e.target.checked)} className="peer appearance-none w-6 h-6 border-2 border-[var(--premium-border)] rounded-lg checked:bg-[var(--premium-gold)] checked:border-transparent transition-all cursor-pointer" />
                          <Check size={16} className="absolute left-1 top-1 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" />
                        </div>
                        <p className="text-[11px] text-[var(--brand-muted)] font-outfit leading-relaxed">
                          I agree to the <Link href="/terms" className="text-[var(--premium-gold)] font-bold">Terms</Link> and <Link href="/privacy" className="text-[var(--premium-gold)] font-bold">Privacy Policy</Link>. I commit to maintaining the dharma of this community.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                      <button onClick={() => setStep(2)} className="p-5 rounded-2xl border-2 border-[var(--premium-border)] text-[var(--brand-muted)] font-bold hover:bg-white transition-all">
                        <ArrowLeft size={20} />
                      </button>
                      <button 
                        onClick={handleSubmit}
                        disabled={loading || !acceptedPolicies}
                        className="flex-1 bg-[var(--premium-gold)] text-white py-5 rounded-2xl font-bold font-outfit shadow-[0_15px_30px_rgba(216,138,28,0.2)] hover:scale-[1.02] disabled:opacity-50 transition-all flex items-center justify-center gap-3"
                      >
                        {loading ? <Loader2 className="animate-spin" /> : <>Enter Shoonaya 🙏</>}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Bottom Section */}
            <div className="mt-10 pt-8 border-t border-[var(--premium-border)] text-center">
              <p className="text-sm text-[var(--brand-muted)] font-outfit">
                Already part of the mandali? {' '}
                <Link href="/login" className="text-[var(--premium-gold)] font-bold hover:underline">Sign In</Link>
              </p>
            </div>
          </div>
          
          {/* Social Proof & Extras */}
          <div className="mt-10 flex flex-col items-center gap-6">
            <div className="flex items-center gap-4 w-full">
              <div className="h-px flex-1 bg-[var(--premium-border)]" />
              <span className="text-[9px] font-bold text-[var(--brand-muted)] uppercase tracking-[0.3em]">Ancient Paths Modern Reach</span>
              <div className="h-px flex-1 bg-[var(--premium-border)]" />
            </div>
            <Link href="/guest" className="flex items-center gap-3 px-8 py-3.5 rounded-full bg-white/40 border-2 border-[var(--premium-border)] text-[10px] font-bold text-[var(--brand-muted)] hover:border-[var(--premium-gold)] hover:text-[var(--premium-gold)] transition-all uppercase tracking-widest">
              👁️ Explore as Guest
            </Link>
          </div>
        </motion.div>
      </div>

      <style jsx global>{`
        body {
          background-color: var(--premium-ivory);
        }
        ::placeholder {
          color: rgba(133, 79, 11, 0.35);
        }
      `}</style>
    </div>
  );
}
