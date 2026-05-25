'use client';


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

// Country codes for international phone input
const COUNTRY_CODES = [
  { code: '+91', flag: '🇮🇳', name: 'India' },
  { code: '+1', flag: '🇺🇸', name: 'USA' },
  { code: '+44', flag: '🇬🇧', name: 'UK' },
  { code: '+61', flag: '🇦🇺', name: 'Australia' },
  { code: '+971', flag: '🇦🇪', name: 'UAE' },
  { code: '+65', flag: '🇸🇬', name: 'Singapore' },
  { code: '+1',   flag: '🇨🇦', name: 'Canada' },
  { code: '+60', flag: '🇲🇾', name: 'Malaysia' },
  { code: '+27', flag: '🇿🇦', name: 'South Africa' },
  { code: '+81', flag: '🇯🇵', name: 'Japan' },
  { code: '+49', flag: '🇩🇪', name: 'Germany' },
  { code: '+33', flag: '🇫🇷', name: 'France' },
  { code: '+86', flag: '🇨🇳', name: 'China' },
  { code: '+55', flag: '🇧🇷', name: 'Brazil' },
  { code: '+92', flag: '🇵🇰', name: 'Pakistan' },
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

  const handleOAuth = async (provider: 'google' | 'apple') => {
    if (!supabase) return;
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/onboarding` },
    });
  };

  const [step,       setStep]       = useState<1 | 2>(1);
  const [loading,    setLoading]    = useState(false);
  const [showPass,   setShowPass]   = useState(false);
  const [inviteCode,  setInviteCode]  = useState('');
  const [claimToken,  setClaimToken]  = useState('');
  const [acceptedPolicies, setAcceptedPolicies] = useState(false);
  const [quoteIdx, setQuoteIdx] = useState(0);
  const [factIdx, setFactIdx] = useState(0);
  const [activeFeature, setActiveFeature] = useState(0);
  const [countryCode, setCountryCode] = useState<string>('+1');
  const [phoneNumber, setPhoneNumber] = useState<string>('');

  const [form, setForm] = useState({
    email:          '',
    password:       '',
    full_name:      '',
    username:       '',
    phone:          '',
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setInviteCode(params.get('ref')?.trim().toUpperCase() ?? '');
    setClaimToken(params.get('claim_token')?.trim() ?? '');

    const interval = setInterval(() => {
      setQuoteIdx(prev => (prev + 1) % QUOTES.length);
      setFactIdx(prev => (prev + 1) % FACTS.length);
      setActiveFeature(prev => (prev + 1) % APP_FEATURES.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  async function handleSubmit() {
    if (!supabase || !acceptedPolicies) return;
    setLoading(true);
    try {
      const normalizedEmail = form.email.trim().toLowerCase();
      const normalizedUsername = form.username.toLowerCase().trim().replace(/\s+/g, '_');
      
      const profilePayload = {
        full_name: form.full_name.trim(),
        username: normalizedUsername,
        phone: form.phone.trim() || null,
        app_language: 'en',
        onboarding_completed: false,
      };

      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password: form.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(
          '/onboarding' + (claimToken ? `?claim_token=${encodeURIComponent(claimToken)}` : '')
        )}`,
          data: { ...profilePayload, referred_by_code: inviteCode || null },
        },
      });

      if (error) throw error;

      if (data.session) {
        if (claimToken) {
          await fetch('/api/jyotish/birth-profiles', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session_token: claimToken }),
          }).catch(() => {});
        }
        toast.success('Pranam! Welcome to Shoonaya. 🙏');
        router.push('/onboarding');
      } else {
        toast.success('Pranam! Please check your inbox to confirm.');
        router.push(`/login?message=check_email&email=${encodeURIComponent(normalizedEmail)}`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const activeAuraColor = TRADITION_SIGNS[quoteIdx % TRADITION_SIGNS.length].color;

  return (
    <div className="min-h-screen flex bg-[var(--premium-ivory)] overflow-hidden font-outfit">
      
      {/* ── LEFT SIDE: Immersive & Interactive (Value Section) ─────────────────────── */}
      <div className="hidden lg:flex w-1/2 relative flex-col items-center justify-between p-16 overflow-hidden border-r border-[var(--premium-border)] bg-[#faf6ef]">
        <motion.div 
          animate={{ backgroundColor: activeAuraColor }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0 z-0 blur-[120px] opacity-20"
          style={{ background: `radial-gradient(circle at center, ${activeAuraColor} 0%, transparent 70%)` }}
        />
        <div className="relative z-10 w-full flex flex-col items-center">
          <div className="mb-2 text-4xl font-serif font-bold text-[var(--brand-primary-strong)] tracking-tighter">Shoonaya</div>
          <div className="text-[10px] uppercase tracking-[0.4em] text-[var(--brand-muted)] font-bold mb-8">Sanatan Sangam</div>
          <TraditionSignages activeIdx={quoteIdx % TRADITION_SIGNS.length} />
        </div>
        <div className="relative z-10 w-full max-w-lg space-y-12 text-center">
          <AnimatePresence mode="wait">
            <motion.div key={quoteIdx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <h2 className="text-3xl font-devanagari text-[var(--brand-primary-strong)] leading-relaxed">{QUOTES[quoteIdx].text}</h2>
              <p className="text-lg italic text-[var(--brand-muted)] mt-2">&quot;{QUOTES[quoteIdx].meaning}&quot;</p>
              <div className="mt-4 text-xs font-bold text-[var(--premium-gold)] uppercase tracking-widest">{QUOTES[quoteIdx].author}</div>
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="relative z-10">
          <div className="px-6 py-3 rounded-full bg-[var(--premium-gold-soft)] border border-[var(--premium-gold)]/20 text-[11px] font-bold text-[var(--premium-gold)] flex items-center gap-3">
            <Sparkles size={14} /> {FACTS[factIdx]}
          </div>
        </div>
      </div>

      {/* ── RIGHT SIDE: Signup Flow ────────────────────────── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-[var(--premium-ivory)]">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="bg-white/70 backdrop-blur-[40px] rounded-[3rem] border border-[var(--premium-border)] shadow-xl p-10">
            <div className="mb-10">
              <h3 className="text-3xl font-bold text-[var(--brand-primary-strong)]">Create Account</h3>
              <p className="text-sm text-[var(--brand-muted)] mt-2">Enter your basics to start your journey.</p>
            </div>

            <div className="flex items-center gap-4 w-full">
    <div className="h-px flex-1 bg-[var(--premium-border)]" />
    <span className="text-[9px] font-bold text-[var(--brand-muted)] uppercase tracking-[0.3em]">
      or continue with
    </span>
    <div className="h-px flex-1 bg-[var(--premium-border)]" />
  </div>
  <div className="flex flex-col gap-3 my-4">
    <button
      type="button"
      onClick={() => handleOAuth('google')}
      className="w-full flex items-center justify-center gap-2 rounded-2xl border border-gray-300 bg-white py-3 text-sm font-medium text-gray-800 hover:bg-gray-50"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 533.5 544.3" className="w-5 h-5">
        <path fill="#EA4335" d="M533.5 278.4c0-17.9-1.6-35.1-4.6-51.7H272v97.8h146.9c-6.3 34-25.1 62.9-53.4 82.1v68.5h86.3c50.5-46.5 79.7-115 79.7-197.7"/>
        <path fill="#34A853" d="M272 544.3c71.6 0 131.7-23.6 175.6-64.1l-86.3-68.5c-23.9 16-54.5 25.5-89.3 25.5-68.7 0-127-46.4-147.8-108.9H37.7v68.8c44.4 86.9 134.9 147.2 234.3 147.2"/>
        <path fill="#4A90E2" d="M124.2 327.3c-10.4-30.9-10.4-64.1 0-95l-86.5-68.8c-37.5 72.9-37.5 159.5 0 232.4l86.5-68.6"/>
        <path fill="#FBBC05" d="M272 107.7c39.2-.6 76.9 14.6 105.5 42.1l78.9-78.9C424.5 24.6 349 0 272 0 172.6 0 82.1 60.3 37.7 147.2l86.5 68.8C145 154.1 203.3 107.7 272 107.7"/>
      </svg>
      Continue with Google
    </button>
    <button
      type="button"
      onClick={() => handleOAuth('apple')}
      className="w-full flex items-center justify-center gap-2 rounded-2xl border border-gray-800 bg-black py-3 text-sm font-medium text-white hover:bg-gray-900"
    >
      🍎 Continue with Apple
    </button>
  </div>
  <div className="space-y-6">
              {step === 1 ? (
                <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-widest text-[var(--premium-gold)]">Full Name</label>
                    <input type="text" placeholder="Arjun Sharma" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} className="w-full bg-white/50 border border-[var(--premium-border)] rounded-2xl px-6 py-4 text-sm outline-none focus:border-[var(--premium-gold)]" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-widest text-[var(--premium-gold)]">Username</label>
                    <input type="text" placeholder="arjun_seeker" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} className="w-full bg-white/50 border border-[var(--premium-border)] rounded-2xl px-6 py-4 text-sm outline-none focus:border-[var(--premium-gold)]" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-widest text-[var(--premium-gold)]">Phone (optional for WhatsApp updates)</label>
                    <div className="flex gap-2">
                      <select value={countryCode} onChange={e => setCountryCode(e.target.value)} className="w-1/3 bg-white/50 border border-[var(--premium-border)] rounded-2xl px-3 py-2 text-sm outline-none focus:border-[var(--premium-gold)]">
                        {COUNTRY_CODES.map(cc => (
                          <option key={cc.code} value={cc.code}>
                            {cc.flag} {cc.code}
                          </option>
                        ))}
                      </select>
                      <input type="tel" placeholder="9876543210" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} className="flex-1 bg-white/50 border border-[var(--premium-border)] rounded-2xl px-3 py-2 text-sm outline-none focus:border-[var(--premium-gold)]" />
                    </div>
                  </div>
                  <button onClick={() => {
                    if (form.full_name && form.username) {
                      const combinedPhone = phoneNumber ? `${countryCode}${phoneNumber.replace(/\s+/g, '')}` : '';
                      setForm(prev => ({ ...prev, phone: combinedPhone }));
                      setStep(2);
                    } else {
                      toast.error('Fill in your name');
                    }
                  }} className="w-full bg-[var(--premium-gold)] text-white py-5 rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2">Next <ArrowRight size={18} /></button>
                </motion.div>
              ) : (
                <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-widest text-[var(--premium-gold)]">Email</label>
                    <input type="email" placeholder="arjun@wisdom.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full bg-white/50 border border-[var(--premium-border)] rounded-2xl px-6 py-4 text-sm outline-none focus:border-[var(--premium-gold)]" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-widest text-[var(--premium-gold)]">Password</label>
                    <input type="password" placeholder="••••••••" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="w-full bg-white/50 border border-[var(--premium-border)] rounded-2xl px-6 py-4 text-sm outline-none focus:border-[var(--premium-gold)]" />
                  </div>
                  <div className="flex items-start gap-3 py-2">
                    <input type="checkbox" checked={acceptedPolicies} onChange={e => setAcceptedPolicies(e.target.checked)} className="mt-1 w-5 h-5 rounded accent-[var(--premium-gold)]" />
                    <p className="text-[11px] text-[var(--brand-muted)]">I agree to the <Link href="/terms" className="text-[var(--premium-gold)] font-bold">Terms</Link> and <Link href="/privacy" className="text-[var(--premium-gold)] font-bold">Privacy Policy</Link>.</p>
                  </div>
                  <div className="flex gap-4">
                    <button onClick={() => setStep(1)} className="p-5 rounded-2xl border-2 border-[var(--premium-border)]"><ArrowLeft size={20} /></button>
                    <button onClick={handleSubmit} disabled={loading || !acceptedPolicies} className="flex-1 bg-[var(--premium-gold)] text-white py-5 rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2">{loading ? <Loader2 className="animate-spin" /> : 'Create Account'}</button>
                  </div>
                </motion.div>
              )}
            </div>

            <div className="mt-10 text-center">
              <p className="text-sm text-[var(--brand-muted)]">Already have an account? <Link href="/login" className="text-[var(--premium-gold)] font-bold">Sign In</Link></p>
            </div>
          </div>

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
