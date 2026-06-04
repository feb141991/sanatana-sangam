'use client';

import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { useThemePreference } from '@/components/providers/ThemeProvider';

const TOTAL_STEPS = 10;
const COUNTRY_CODES = [
  { code: '+91', flag: '🇮🇳', name: 'India' },
  { code: '+1', flag: '🇺🇸', name: 'USA' },
  { code: '+44', flag: '🇬🇧', name: 'UK' },
  { code: '+61', flag: '🇦🇺', name: 'Australia' },
  { code: '+971', flag: '🇦🇪', name: 'UAE' },
  { code: '+65', flag: '🇸🇬', name: 'Singapore' },
  { code: '+1', flag: '🇨🇦', name: 'Canada' },
  { code: '+60', flag: '🇲🇾', name: 'Malaysia' },
  { code: '+27', flag: '🇿🇦', name: 'South Africa' },
  { code: '+81', flag: '🇯🇵', name: 'Japan' },
  { code: '+49', flag: '🇩🇪', name: 'Germany' },
  { code: '+33', flag: '🇫🇷', name: 'France' },
  { code: '+86', flag: '🇨🇳', name: 'China' },
  { code: '+55', flag: '🇧🇷', name: 'Brazil' },
  { code: '+92', flag: '🇵🇰', name: 'Pakistan' },
];
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

const RASHIS = [
  { key: 'mesha',      label: 'Mesha',      sanskrit: 'मेष',      symbol: '♈', dates: 'Apr 14 – May 14' },
  { key: 'vrishabha',  label: 'Vrishabha',  sanskrit: 'वृषभ',     symbol: '♉', dates: 'May 15 – Jun 14' },
  { key: 'mithuna',    label: 'Mithuna',    sanskrit: 'मिथुन',    symbol: '♊', dates: 'Jun 15 – Jul 14' },
  { key: 'karka',      label: 'Karka',      sanskrit: 'कर्क',     symbol: '♋', dates: 'Jul 15 – Aug 14' },
  { key: 'simha',      label: 'Simha',      sanskrit: 'सिंह',     symbol: '♌', dates: 'Aug 15 – Sep 15' },
  { key: 'kanya',      label: 'Kanya',      sanskrit: 'कन्या',    symbol: '♍', dates: 'Sep 16 – Oct 15' },
  { key: 'tula',       label: 'Tula',       sanskrit: 'तुला',     symbol: '♎', dates: 'Oct 16 – Nov 14' },
  { key: 'vrishchika', label: 'Vrishchika', sanskrit: 'वृश्चिक',  symbol: '♏', dates: 'Nov 15 – Dec 14' },
  { key: 'dhanu',      label: 'Dhanu',      sanskrit: 'धनु',      symbol: '♐', dates: 'Dec 15 – Jan 13' },
  { key: 'makara',     label: 'Makara',     sanskrit: 'मकर',      symbol: '♑', dates: 'Jan 14 – Feb 12' },
  { key: 'kumbha',     label: 'Kumbha',     sanskrit: 'कुम्भ',   symbol: '♒', dates: 'Feb 13 – Mar 13' },
  { key: 'meena',      label: 'Meena',      sanskrit: 'मीन',      symbol: '♓', dates: 'Mar 14 – Apr 13' },
] as const;

const NAKSHATRAS = [
  { key: 'ashwini',           label: 'Ashwini',           sanskrit: 'अश्विनी',        ruler: 'Ketu',    deity: 'Ashwini Kumaras', symbol: '🐴' },
  { key: 'bharani',           label: 'Bharani',           sanskrit: 'भरणी',           ruler: 'Venus',   deity: 'Yama',            symbol: '⚖️' },
  { key: 'krittika',          label: 'Krittika',          sanskrit: 'कृत्तिका',       ruler: 'Sun',     deity: 'Agni',            symbol: '🔥' },
  { key: 'rohini',            label: 'Rohini',            sanskrit: 'रोहिणी',         ruler: 'Moon',    deity: 'Brahma',          symbol: '🌙' },
  { key: 'mrigashira',        label: 'Mrigashira',        sanskrit: 'मृगशिरा',        ruler: 'Mars',    deity: 'Soma',            symbol: '🦌' },
  { key: 'ardra',             label: 'Ardra',             sanskrit: 'आर्द्रा',        ruler: 'Rahu',    deity: 'Rudra',           symbol: '💧' },
  { key: 'punarvasu',         label: 'Punarvasu',         sanskrit: 'पुनर्वसु',       ruler: 'Jupiter', deity: 'Aditi',           symbol: '⭐' },
  { key: 'pushya',            label: 'Pushya',            sanskrit: 'पुष्य',          ruler: 'Saturn',  deity: 'Brihaspati',      symbol: '🌸' },
  { key: 'ashlesha',          label: 'Ashlesha',          sanskrit: 'आश्लेषा',        ruler: 'Mercury', deity: 'Naga',            symbol: '🐍' },
  { key: 'magha',             label: 'Magha',             sanskrit: 'मघा',            ruler: 'Ketu',    deity: 'Pitrs',           symbol: '👑' },
  { key: 'purva_phalguni',    label: 'Purva Phalguni',    sanskrit: 'पूर्व फाल्गुनी', ruler: 'Venus',   deity: 'Bhaga',           symbol: '🌺' },
  { key: 'uttara_phalguni',   label: 'Uttara Phalguni',   sanskrit: 'उत्तर फाल्गुनी', ruler: 'Sun',     deity: 'Aryaman',         symbol: '☀️' },
  { key: 'hasta',             label: 'Hasta',             sanskrit: 'हस्त',           ruler: 'Moon',    deity: 'Savitar',         symbol: '✋' },
  { key: 'chitra',            label: 'Chitra',            sanskrit: 'चित्रा',         ruler: 'Mars',    deity: 'Vishwakarma',     symbol: '💎' },
  { key: 'swati',             label: 'Swati',             sanskrit: 'स्वाती',         ruler: 'Rahu',    deity: 'Vayu',            symbol: '🍃' },
  { key: 'vishakha',          label: 'Vishakha',          sanskrit: 'विशाखा',         ruler: 'Jupiter', deity: 'Indra-Agni',      symbol: '⚡' },
  { key: 'anuradha',          label: 'Anuradha',          sanskrit: 'अनुराधा',        ruler: 'Saturn',  deity: 'Mitra',           symbol: '🤝' },
  { key: 'jyeshtha',          label: 'Jyeshtha',          sanskrit: 'ज्येष्ठा',       ruler: 'Mercury', deity: 'Indra',           symbol: '🛡️' },
  { key: 'mula',              label: 'Mula',              sanskrit: 'मूल',            ruler: 'Ketu',    deity: 'Nirriti',         symbol: '🌿' },
  { key: 'purva_ashadha',     label: 'Purva Ashadha',     sanskrit: 'पूर्वाषाढ़',     ruler: 'Venus',   deity: 'Apas',            symbol: '🌊' },
  { key: 'uttara_ashadha',    label: 'Uttara Ashadha',    sanskrit: 'उत्तराषाढ़',     ruler: 'Sun',     deity: 'Vishwadevas',     symbol: '🏆' },
  { key: 'shravana',          label: 'Shravana',          sanskrit: 'श्रवण',          ruler: 'Moon',    deity: 'Vishnu',          symbol: '👂' },
  { key: 'dhanishta',         label: 'Dhanishta',         sanskrit: 'धниष्ठा',        ruler: 'Mars',    deity: 'Ashta Vasus',     symbol: '🥁' },
  { key: 'shatabhisha',       label: 'Shatabhisha',       sanskrit: 'शतभिषा',         ruler: 'Rahu',    deity: 'Varuna',          symbol: '💫' },
  { key: 'purva_bhadrapada',  label: 'Purva Bhadrapada',  sanskrit: 'पूर्व भाद्रपद',  ruler: 'Jupiter', deity: 'Aja Ekapada',     symbol: '⚔️' },
  { key: 'uttara_bhadrapada', label: 'Uttara Bhadrapada', sanskrit: 'उत्तर भाद्रपद',  ruler: 'Saturn',  deity: 'Ahir Budhnya',    symbol: '🌊' },
  { key: 'revati',            label: 'Revati',            sanskrit: 'रेवती',          ruler: 'Mercury', deity: 'Pushan',          symbol: '🐟' },
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
  const { setPreference } = useThemePreference();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [tradition, setTradition] = useState<string>(initialTradition || '');
  const [goal, setGoal] = useState<string>('');
  const [name, setName] = useState<string>(initialName || '');
  const [saving, setSaving] = useState(false);

  const [whatsappCountryCode, setWhatsappCountryCode] = useState('+91');
  const [whatsappNumberOnly, setWhatsappNumberOnly] = useState('');
  const [whatsappOptIn, setWhatsappOptIn] = useState(false);

  const [lifeStage, setLifeStage] = useState('');
  const [gender, setGender] = useState('');
  const [age, setAge] = useState('');
  const [rashi, setRashi] = useState('');
  const [nakshatra, setNakshatra] = useState('');
  const [theme, setTheme] = useState<'system' | 'dark' | 'light'>('system');

  // Auto-recommend life stage from age
  const recommendedStage = (() => {
    const n = parseInt(age, 10);
    if (isNaN(n)) return null;
    if (n <= 25) return 'brahmacharya';
    if (n <= 50) return 'grihastha';
    if (n <= 75) return 'vanaprastha';
    return 'sannyasa';
  })();
  const [nameStory, setNameStory] = useState<any>(null);
  const [nameStoryLoading, setNameStoryLoading] = useState(false);

  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpCooldown, setOtpCooldown] = useState(0);

  useEffect(() => {
    let timer: any;
    if (otpCooldown > 0) {
      timer = setInterval(() => {
        setOtpCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [otpCooldown]);

  const handleOtpChange = (val: string, index: number) => {
    const cleaned = val.replace(/\D/g, '');
    if (!cleaned && val !== '') return;
    
    const chars = otpValue.split('');
    while (chars.length < 6) chars.push('');
    chars[index] = cleaned;
    const newOtpValue = chars.join('').slice(0, 6);
    setOtpValue(newOtpValue);
    setOtpError('');

    if (cleaned && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      const chars = otpValue.split('');
      while (chars.length < 6) chars.push('');
      if (!chars[index] && index > 0) {
        chars[index - 1] = '';
        setOtpValue(chars.join('').slice(0, 6));
        const prevInput = document.getElementById(`otp-${index - 1}`);
        prevInput?.focus();
      } else {
        chars[index] = '';
        setOtpValue(chars.join('').slice(0, 6));
      }
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtpValue(pasted);
      document.getElementById('otp-5')?.focus();
    }
  };

  const handleSendOtp = async () => {
    if (!whatsappNumberOnly) {
      toast.error("Please enter a phone number.");
      return;
    }
    if (whatsappNumberOnly.length < 7 || whatsappNumberOnly.length > 15) {
      toast.error("Please enter a valid phone number (7 to 15 digits).");
      return;
    }
    
    setOtpError('');
    const phone = `${whatsappCountryCode}${whatsappNumberOnly}`;
    const toastId = toast.loading('Sending verification code...');
    
    try {
      const res = await fetch('/api/auth/whatsapp-otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Failed to send OTP');
      
      setOtpSent(true);
      setOtpCooldown(30);
      toast.success('Verification code sent to WhatsApp!', { id: toastId });
    } catch (err: any) {
      toast.error(err.message || 'Could not send verification code.', { id: toastId });
      setOtpError(err.message || 'Could not send verification code.');
    }
  };

  const handleVerifyOtp = async () => {
    const code = otpValue;
    if (code.length !== 6) {
      setOtpError('Please enter a 6-digit code');
      return;
    }
    
    setOtpError('');
    const phone = `${whatsappCountryCode}${whatsappNumberOnly}`;
    const toastId = toast.loading('Verifying code...');
    
    try {
      const res = await fetch('/api/auth/whatsapp-otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Invalid or expired code');
      
      setOtpVerified(true);
      setOtpSent(false);
      toast.success('WhatsApp number verified successfully!', { id: toastId });
    } catch (err: any) {
      toast.error(err.message || 'Verification failed.', { id: toastId });
      setOtpError(err.message || 'Verification failed. Please check the code.');
    }
  };

  const [greetIdx, setGreetIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setGreetIdx(i => (i + 1) % GREETINGS.length), 2200);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (step === 6) {
      if (direction > 0) {
        setStep(7);
      } else {
        setStep(5);
      }
    }
  }, [step, direction]);

  const progressPct = (step / TOTAL_STEPS) * 100;
  const readyCopy = READY_COPY[tradition] ?? READY_COPY.hindu;

  const canContinueFromName = true;

  const currentTitle = useMemo(() => {
    if (step === 2) return 'Which path do you walk?';
    if (step === 6) return getGoalHeading(tradition);
    if (step === 7) return 'What shall we call you?';
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
      const fullWhatsAppNumber = (whatsappOptIn && otpVerified)
        ? `${whatsappCountryCode}${whatsappNumberOnly}`
        : null;
      const res = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tradition,
          goal,
          name,
          life_stage: lifeStage,
          gender,
          nakshatra: nakshatra || null,
          rashi: rashi || null,
          whatsapp_number: fullWhatsAppNumber,
          whatsapp_opt_in: whatsappOptIn && otpVerified,
        }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody?.error || 'Failed to complete onboarding');
      }

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
    <div className="min-h-screen flex flex-col text-[var(--brand-primary-strong)]" style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(200, 146, 74, 0.08) 0%, transparent 60%), var(--premium-ivory)' }}>
      <div className="px-5 pt-6 pb-3">
        <div className="h-1 w-full rounded-full bg-[var(--premium-border)] overflow-hidden">
          <motion.div
            className="h-full bg-[var(--premium-gold)]"
            animate={{ width: `${progressPct}%` }}
            transition={SPRING}
          />
        </div>
        <div className="mt-3 flex items-center justify-center gap-2">
          {Array.from({ length: TOTAL_STEPS }, (_, index) => (
            <div
              key={index}
              className="h-2 w-2 rounded-full"
              style={{ background: index + 1 <= step ? 'var(--premium-gold)' : 'var(--premium-border)' }}
            />
          ))}
        </div>
      </div>

      <div className="px-5">
        {step > 1 ? (
          <button onClick={goBack} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-transparent bg-transparent text-[var(--brand-muted)] hover:bg-[rgba(62,42,31,0.05)] transition-colors">
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
                      <p className="text-2xl font-serif text-[var(--premium-gold)] mb-1">{GREETINGS[greetIdx].script}</p>
                      <p className="text-[11px] uppercase tracking-[0.25em] text-[var(--brand-muted)] opacity-70 mb-1">{GREETINGS[greetIdx].text}</p>
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Tradition dots */}
                <div className="flex gap-2 mb-8">
                  {GREETINGS.map((_, i) => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full transition-colors duration-300"
                      style={{ background: i === greetIdx ? 'var(--premium-gold)' : 'var(--premium-border)' }} />
                  ))}
                </div>

                <h1 className="text-3xl font-medium mb-3 text-[var(--brand-primary-strong)]" style={{ fontFamily: 'var(--font-serif)' }}>
                  Your sacred journey begins
                </h1>
                <p className="text-[var(--brand-muted)] mb-10 text-sm leading-relaxed max-w-xs">
                  A daily companion for dharmic living — across all traditions
                </p>
                <button onClick={() => goNext(2)}
                  className="w-full rounded-full bg-[var(--premium-gold)] text-white font-bold py-4 px-8 text-[15px] hover:opacity-90 transition-opacity">
                  Begin →
                </button>
              </div>
            )}

            {step === 2 && (
              <div>
                <h1 className="text-3xl font-medium mb-3 text-[var(--brand-primary-strong)]" style={{ fontFamily: 'var(--font-serif)' }}>{currentTitle}</h1>
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
                        className="rounded-2xl p-4 text-left border transition-all"
                        style={
                          selected
                            ? { borderColor: 'var(--premium-gold)', background: 'rgba(200, 146, 74, 0.08)', borderWidth: '1.5px' }
                            : { borderColor: 'var(--premium-border)', background: 'rgba(255, 255, 255, 0.7)', borderWidth: '1px' }
                        }
                      >
                        <div 
                          className="w-12 h-12 flex items-center justify-center rounded-full border-[1.5px] mb-3 bg-white shrink-0"
                          style={{
                            borderColor: 'rgba(200, 146, 74, 0.3)',
                            padding: '12px'
                          }}
                        >
                          <span className="text-xl">{item.emoji}</span>
                        </div>
                        <div className="font-semibold text-[var(--brand-primary-strong)]">{item.label}</div>
                        <div className="text-sm text-[var(--brand-muted)] mt-1">{item.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 3: Life Stage + Gender */}
            {step === 3 && (
              <div>
                {tradition && (
                  <div className="flex justify-center mb-6">
                    <div 
                      className="w-12 h-12 flex items-center justify-center rounded-full border-[1.5px] bg-white shrink-0"
                      style={{
                        borderColor: 'rgba(200, 146, 74, 0.3)',
                        padding: '12px'
                      }}
                    >
                      <span className="text-xl">
                        {TRADITIONS.find(t => t.key === tradition)?.emoji || '🪔'}
                      </span>
                    </div>
                  </div>
                )}
                <h1 className="text-3xl font-medium mb-1 text-[var(--brand-primary-strong)]" style={{ fontFamily: 'var(--font-serif)' }}>
                  Your Stage of Life
                </h1>
                <p className="text-[var(--brand-muted)] text-sm mb-6">
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
                        ? { borderColor: 'var(--premium-gold)', background: 'rgba(200, 146, 74, 0.08)', borderWidth: '1.5px' }
                        : { borderColor: 'var(--premium-border)', background: 'rgba(255, 255, 255, 0.7)', borderWidth: '1px' }
                      }
                    >
                      <div 
                        className="w-12 h-12 flex items-center justify-center rounded-full border-[1.5px] bg-white shrink-0"
                        style={{
                          borderColor: 'rgba(200, 146, 74, 0.3)',
                          padding: '12px'
                        }}
                      >
                        <span className="text-xl">{stage.emoji}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[var(--brand-primary-strong)]">{stage.label}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--premium-border)] text-[var(--brand-primary-strong)]">{stage.age}</span>
                        </div>
                        <p className="text-xs text-[var(--brand-muted)] mt-0.5">{stage.desc}</p>
                      </div>
                      {lifeStage === stage.key && (
                        <div className="w-5 h-5 rounded-full bg-[var(--premium-gold)] flex items-center justify-center text-white text-[10px] font-bold">✓</div>
                      )}
                    </button>
                  ))}
                </div>

                {/* Age */}
                <p className="text-[11px] uppercase tracking-widest text-[var(--brand-muted)] mb-2">Your Age</p>
                <div className="flex items-center gap-3 mb-2">
                  <input
                    type="number"
                    min="5"
                    max="120"
                    value={age}
                    onChange={e => {
                      setAge(e.target.value);
                      const n = parseInt(e.target.value, 10);
                      if (!isNaN(n)) {
                        if (n <= 25) setLifeStage('brahmacharya');
                        else if (n <= 50) setLifeStage('grihastha');
                        else if (n <= 75) setLifeStage('vanaprastha');
                        else setLifeStage('sannyasa');
                      }
                    }}
                    placeholder="e.g. 28"
                    className="w-28 rounded-2xl bg-white border border-[var(--premium-border)] focus:border-[var(--premium-gold)] px-4 py-3 outline-none text-[var(--brand-primary-strong)] text-center text-lg font-semibold"
                  />
                  {recommendedStage && (
                    <span className="text-xs text-[var(--brand-muted)] leading-snug">
                      ✨ Suggested: <span className="font-semibold text-[var(--premium-gold)] capitalize">{LIFE_STAGES.find(s => s.key === recommendedStage)?.label}</span>
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-[var(--brand-muted)] mb-5 opacity-70">Enter your age to get a recommendation, or select manually below.</p>

                {/* Gender */}
                <p className="text-[11px] uppercase tracking-widest text-[var(--brand-muted)] mb-3">Gender</p>
                <div className="flex gap-2">
                  {GENDERS.map(g => (
                    <button key={g.key}
                      type="button"
                      onClick={() => setGender(g.key)}
                      className="flex-1 py-3 rounded-2xl text-sm font-medium border transition-all"
                      style={gender === g.key
                        ? { borderColor: 'var(--premium-gold)', background: 'rgba(200, 146, 74, 0.08)', color: 'var(--brand-primary-strong)', borderWidth: '1.5px' }
                        : { borderColor: 'var(--premium-border)', background: 'rgba(255, 255, 255, 0.7)', color: 'var(--brand-muted)', borderWidth: '1px' }
                      }
                    >
                      {g.emoji} {g.label}
                    </button>
                  ))}
                </div>

                {/* Rashi */}
                <p className="text-[11px] uppercase tracking-widest text-[var(--brand-muted)] mt-5 mb-2">Your Rashi <span className="normal-case text-[var(--brand-muted)] opacity-60">(Vedic Moon Sign)</span></p>
                <p className="text-[10px] text-[var(--brand-muted)] opacity-60 mb-3">Used to personalise festival dates, muhurtas &amp; guidance.</p>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {RASHIS.map(r => (
                    <button key={r.key} type="button"
                      onClick={() => setRashi(r.key)}
                      className="flex flex-col items-center gap-0.5 rounded-xl py-2.5 px-1 border transition-all"
                      style={rashi === r.key
                        ? { borderColor: 'var(--premium-gold)', background: 'rgba(200,146,74,0.09)', borderWidth: '1.5px' }
                        : { borderColor: 'var(--premium-border)', background: 'rgba(255,255,255,0.7)', borderWidth: '1px' }
                      }
                    >
                      <span className="text-base">{r.symbol}</span>
                      <span className="text-[11px] font-semibold text-[var(--brand-primary-strong)]">{r.label}</span>
                      <span className="text-[9px] text-[var(--brand-muted)] font-serif">{r.sanskrit}</span>
                    </button>
                  ))}
                </div>
                {rashi && (
                  <p className="text-[10px] text-center text-[var(--premium-gold)] mb-1">
                    {RASHIS.find(r => r.key === rashi)?.dates}
                  </p>
                )}
                <button type="button" onClick={() => { setRashi(''); }} className="w-full mb-4 text-[var(--brand-muted)] text-[10px] underline">
                  I don&apos;t know my Rashi
                </button>

                <button
                  type="button"
                  onClick={() => goNext(4)}
                  disabled={!lifeStage}
                  className="w-full rounded-full bg-[var(--premium-gold)] text-white font-bold py-4 px-8 disabled:opacity-40 hover:opacity-90 transition-opacity"
                >
                  Continue →
                </button>
                <button type="button" onClick={() => goNext(4)} className="w-full mt-3 text-[var(--brand-muted)] text-xs underline">Skip for now</button>
              </div>
            )}

            {/* Step 4: What calls you here? */}
            {step === 4 && (
              <div>
                {tradition && (
                  <div className="flex justify-center mb-6">
                    <div 
                      className="w-12 h-12 flex items-center justify-center rounded-full border-[1.5px] bg-white shrink-0"
                      style={{
                        borderColor: 'rgba(200, 146, 74, 0.3)',
                        padding: '12px'
                      }}
                    >
                      <span className="text-xl">
                        {TRADITIONS.find(t => t.key === tradition)?.emoji || '🪔'}
                      </span>
                    </div>
                  </div>
                )}
                <h1 className="text-3xl font-medium mb-1 text-[var(--brand-primary-strong)]" style={{ fontFamily: 'var(--font-serif)' }}>
                  What calls you here?
                </h1>
                <p className="text-[var(--brand-muted)] text-sm mb-6">
                  This shapes everything — your feed, your guidance, your path.
                </p>

                <div className="space-y-3">
                  {[
                    { key: 'daily_practice', emoji: '🪔', label: 'Deepen my daily Sadhana', sub: 'Japa, meditation, nitya karma' },
                    { key: 'deeper_faith', emoji: '🔱', label: 'Find my Ishta Devata / path', sub: "Discover your tradition's heart" },
                    { key: 'community', emoji: '👥', label: 'Find my Mandali', sub: 'Sangat, community, belonging' },
                    { key: 'peace', emoji: '🌌', label: "Questions science can't answer", sub: 'Philosophy, meaning, moksha' },
                    { key: 'knowledge', emoji: '📚', label: 'Study the sacred texts', sub: 'Gita, Granth, Dhammapada, Agamas' },
                    { key: 'new_guide', emoji: '🌱', label: "I'm new — guide me gently", sub: 'Begin from the very first step' }
                  ].map((item) => {
                    const selected = goal === item.key;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setGoal(item.key)}
                        className="w-full flex items-center gap-4 rounded-2xl p-4 text-left border transition-all duration-300 transform active:scale-[0.99] relative overflow-hidden"
                        style={selected
                          ? { 
                              borderColor: 'var(--premium-gold)', 
                              background: 'rgba(200, 146, 74, 0.06)',
                              borderWidth: '1.5px',
                              transform: 'scale(1.01)'
                            }
                          : { 
                              borderColor: 'var(--premium-border)', 
                              background: 'rgba(255, 255, 255, 0.7)',
                              borderWidth: '1px'
                            }
                        }
                      >
                        {/* Left Emoji Container */}
                        <div 
                          className="w-12 h-12 flex items-center justify-center rounded-full border shrink-0"
                          style={{
                            backgroundColor: 'rgba(200, 146, 74, 0.08)',
                            borderColor: 'rgba(200, 146, 74, 0.25)',
                          }}
                        >
                          <span className="text-xl">{item.emoji}</span>
                        </div>

                        {/* Middle Text Container */}
                        <div className="flex-1 min-w-0">
                          <p className="text-[15px] font-semibold text-[var(--brand-primary-strong)] leading-tight">
                            {item.label}
                          </p>
                          <p className="text-[11px] text-[var(--brand-muted)] mt-1">
                            {item.sub}
                          </p>
                        </div>

                        {/* Right Selection Indicator */}
                        <div 
                          className="w-5 h-5 rounded-full border flex items-center justify-center shrink-0"
                          style={{
                            borderColor: selected ? 'var(--premium-gold)' : 'var(--premium-border)',
                            backgroundColor: selected ? 'var(--premium-gold)' : 'transparent',
                          }}
                        >
                          {selected && (
                            <span className="text-white text-[10px] font-bold">✓</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  disabled={!goal}
                  onClick={() => goNext(5)}
                  className="w-full mt-6 rounded-full bg-[var(--premium-gold)] text-white font-bold py-4 px-8 disabled:opacity-40 transition-all hover:opacity-90"
                >
                  Continue →
                </button>
              </div>
            )}

            {/* Step 5: Birth Nakshatra */}
            {step === 5 && (
              <div>
                {tradition && (
                  <div className="flex justify-center mb-6">
                    <div 
                      className="w-12 h-12 flex items-center justify-center rounded-full border-[1.5px] bg-white shrink-0"
                      style={{
                        borderColor: 'rgba(200, 146, 74, 0.3)',
                        padding: '12px'
                      }}
                    >
                      <span className="text-xl">
                        {TRADITIONS.find(t => t.key === tradition)?.emoji || '🪔'}
                      </span>
                    </div>
                  </div>
                )}
                <h1 className="text-3xl font-medium mb-1 text-[var(--brand-primary-strong)]" style={{ fontFamily: 'var(--font-serif)' }}>
                  Your Birth Nakshatra
                </h1>
                <p className="text-[var(--brand-muted)] text-sm mb-2 leading-relaxed">
                  The lunar mansion at your birth — more precise than your Rashi. Shapes your mantra, muhurta timing, and daily guidance.
                </p>
                <p className="text-[10px] text-[var(--brand-muted)] opacity-70 mb-5 leading-normal">
                  Not sure? Check a Janma Kundali app with your birth date, time and place — or skip for now.
                </p>

                {/* Scrollable Nakshatras Grid */}
                <div className="max-h-[320px] overflow-y-auto pr-1 border border-[var(--premium-border)] rounded-2xl bg-white/40 p-2 space-y-1">
                  <div className="grid grid-cols-3 gap-2">
                    {NAKSHATRAS.map((n) => {
                      const selected = nakshatra === n.key;
                      return (
                        <button
                          key={n.key}
                          type="button"
                          onClick={() => setNakshatra(selected ? '' : n.key)}
                          className="flex flex-col items-center gap-1 rounded-xl py-3 px-2 border transition-all"
                          style={selected
                            ? { borderColor: 'var(--premium-gold)', background: 'rgba(200, 146, 74, 0.09)', borderWidth: '1.5px' }
                            : { borderColor: 'var(--premium-border)', background: 'rgba(255, 255, 255, 0.7)', borderWidth: '1px' }
                          }
                        >
                          <span className="text-xl">{n.symbol}</span>
                          <span className="text-[11px] font-semibold text-[var(--brand-primary-strong)] truncate max-w-full text-center">
                            {n.label}
                          </span>
                          <span className="text-[9px] text-[var(--brand-muted)] font-serif text-center">
                            {n.sanskrit}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Detail strip when selected */}
                {nakshatra && (() => {
                  const selectedNak = NAKSHATRAS.find(n => n.key === nakshatra);
                  if (!selectedNak) return null;
                  return (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs text-center text-[var(--premium-gold)] bg-[rgba(200,146,74,0.06)] rounded-xl p-2.5 mt-2 border border-[rgba(200,146,74,0.15)]"
                    >
                      {selectedNak.symbol} {selectedNak.label} · Ruled by {selectedNak.ruler} · Deity: {selectedNak.deity}
                    </motion.div>
                  );
                })()}

                <div className="mt-6 space-y-3">
                  <button
                    type="button"
                    onClick={() => goNext(6)}
                    className="w-full rounded-full bg-[var(--premium-gold)] text-white font-bold py-4 px-8 transition-all hover:opacity-90"
                  >
                    Continue →
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNakshatra('');
                      goNext(6);
                    }}
                    className="w-full text-[var(--brand-muted)] text-sm underline text-center"
                  >
                    Skip for now
                  </button>
                </div>
              </div>
            )}

            {/* Step 6: Goals (renumbered from 3, bypassed) */}
            {step === 6 && (
              <div>
                {tradition && (
                  <div className="flex justify-center mb-6">
                    <div 
                      className="w-12 h-12 flex items-center justify-center rounded-full border-[1.5px] bg-white shrink-0"
                      style={{
                        borderColor: 'rgba(200, 146, 74, 0.3)',
                        padding: '12px'
                      }}
                    >
                      <span className="text-xl">
                        {TRADITIONS.find(t => t.key === tradition)?.emoji || '🪔'}
                      </span>
                    </div>
                  </div>
                )}
                <h1 className="text-3xl font-medium mb-3 text-[var(--brand-primary-strong)]" style={{ fontFamily: 'var(--font-serif)' }}>{currentTitle}</h1>
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
                            setStep(7);
                          }, 300);
                        }}
                        className="w-full rounded-full px-4 py-3 text-left flex items-center gap-3 border transition-all"
                        style={selected 
                          ? { borderColor: 'var(--premium-gold)', background: 'rgba(200, 146, 74, 0.08)', borderWidth: '1.5px' } 
                          : { borderColor: 'var(--premium-border)', background: 'rgba(255, 255, 255, 0.7)', borderWidth: '1px' }
                        }
                      >
                        <div 
                          className="w-10 h-10 flex items-center justify-center rounded-full border-[1.5px] bg-white shrink-0"
                          style={{
                            borderColor: 'rgba(200, 146, 74, 0.3)',
                            padding: '8px'
                          }}
                        >
                          <span className="text-base">{item.emoji}</span>
                        </div>
                        <span className="font-medium text-[var(--brand-primary-strong)]">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 7: Name (renumbered from 4) */}
            {step === 7 && (
              <div>
                {tradition && (
                  <div className="flex justify-center mb-6">
                    <div 
                      className="w-12 h-12 flex items-center justify-center rounded-full border-[1.5px] bg-white shrink-0"
                      style={{
                        borderColor: 'rgba(200, 146, 74, 0.3)',
                        padding: '12px'
                      }}
                    >
                      <span className="text-xl">
                        {TRADITIONS.find(t => t.key === tradition)?.emoji || '🪔'}
                      </span>
                    </div>
                  </div>
                )}
                <h1 className="text-3xl font-medium mb-3 text-[var(--brand-primary-strong)]" style={{ fontFamily: 'var(--font-serif)' }}>{currentTitle}</h1>
                <p className="text-[var(--brand-muted)] mb-6">This is how you&apos;ll appear to your Mandali</p>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name or spiritual name"
                  className="w-full rounded-2xl bg-white border border-[var(--premium-border)] focus:border-[var(--premium-gold)] p-4 outline-none text-[var(--brand-primary-strong)] placeholder-[var(--brand-muted)]/50"
                />
                <div className="mt-6 space-y-3">
                  <button
                    type="button"
                    disabled={!canContinueFromName}
                    onClick={() => goNext(8)}
                    className="w-full rounded-full bg-[var(--premium-gold)] text-white font-bold py-4 px-8 disabled:opacity-60 hover:opacity-90 transition-opacity"
                  >
                    Continue →
                  </button>
                  <button type="button" onClick={() => goNext(8)} className="w-full text-[var(--brand-muted)] text-sm underline">
                    Skip for now
                  </button>
                </div>
              </div>
            )}

            {/* Step 8: Name Story Generation/Preview */}
            {step === 8 && (
              <div className="text-left">
                {tradition && (
                  <div className="flex justify-center mb-6">
                    <div 
                      className="w-12 h-12 flex items-center justify-center rounded-full border-[1.5px] bg-white shrink-0"
                      style={{
                        borderColor: 'rgba(200, 146, 74, 0.3)',
                        padding: '12px'
                      }}
                    >
                      <span className="text-xl">
                        {TRADITIONS.find(t => t.key === tradition)?.emoji || '🪔'}
                      </span>
                    </div>
                  </div>
                )}
                {!nameStory && !nameStoryLoading ? (
                  <div>
                    <h1 className="text-3xl font-medium mb-3 text-[var(--brand-primary-strong)]" style={{ fontFamily: 'var(--font-serif)' }}>
                      Discover your Name Story
                    </h1>
                    <p className="text-[var(--brand-muted)] mb-6 leading-relaxed text-sm">
                      Every dharmic name carries a distinct vibration. Would you like to discover the etymological roots and spiritual significance of your name?
                    </p>
                    
                    {!name.trim() ? (
                      <div className="mb-6">
                        <label className="block text-[11px] uppercase tracking-wider text-[var(--brand-muted)] mb-1.5 font-semibold">
                          Please enter a name first
                        </label>
                        <input
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Your name or spiritual name"
                          className="w-full rounded-2xl bg-white border border-[var(--premium-border)] focus:border-[var(--premium-gold)] p-4 outline-none text-[var(--brand-primary-strong)] placeholder-[var(--brand-muted)]/50"
                        />
                      </div>
                    ) : (
                      <div className="p-5 rounded-2xl bg-white border border-[var(--premium-border)] text-center mb-6">
                        <span className="text-[10px] uppercase tracking-widest text-[var(--premium-gold)] block mb-1 font-semibold">Analyzing Significance For</span>
                        <span className="text-xl font-serif text-[var(--brand-primary-strong)]">{name}</span>
                      </div>
                    )}

                    <div className="space-y-3">
                      <button
                        type="button"
                        disabled={!name.trim()}
                        onClick={async () => {
                          setNameStoryLoading(true);
                          try {
                            const res = await fetch('/api/name-story/generate', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ name, tradition }),
                            });
                            const body = await res.json();
                            if (!res.ok) throw new Error(body.error || 'Failed to generate');
                            setNameStory(body.data);
                          } catch (err: any) {
                            toast.error(err.message || 'Could not generate name story.');
                          } finally {
                            setNameStoryLoading(false);
                          }
                        }}
                        className="w-full rounded-full bg-[var(--premium-gold)] text-white font-bold py-4 px-8 disabled:opacity-60 flex items-center justify-center gap-2 transition-all hover:opacity-90"
                      >
                        <Sparkles size={16} />
                        <span>Yes, reveal it →</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => goNext(9)}
                        className="w-full text-[var(--brand-muted)] text-sm underline py-2 text-center"
                      >
                        No, skip this
                      </button>
                    </div>
                  </div>
                ) : nameStoryLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="relative w-16 h-16 mb-6">
                      <div className="absolute inset-0 rounded-full border-2 border-t-[var(--premium-gold)] border-[var(--premium-border)] animate-spin" />
                    </div>
                    <h2 className="text-xl font-serif text-[var(--brand-primary-strong)] mb-2">Invoking Cosmic Etymology</h2>
                    <p className="text-xs text-[var(--brand-muted)] max-w-xs leading-relaxed">
                      Decoding sacred scripts and scripture databases to discover the meaning of {name}...
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <h1 className="text-2xl font-medium text-center text-[var(--brand-primary-strong)]" style={{ fontFamily: 'var(--font-serif)' }}>
                      Your Name Story
                    </h1>
                    
                    <div className="rounded-2xl border border-[var(--premium-border)] bg-white/90 p-6 relative overflow-hidden">
                      <div className="absolute inset-0 bg-radial-gradient from-[var(--premium-gold)]/[0.02] to-transparent pointer-events-none" />
                      
                      <div className="text-center mb-4">
                        <span className="text-[10px] uppercase tracking-widest text-[var(--premium-gold)] block mb-1">
                          {nameStory.origin_tradition || tradition}
                        </span>
                        <h2 className="text-2xl font-serif text-[var(--brand-primary-strong)]">{nameStory.name_input}</h2>
                        <p className="text-xs font-serif italic text-[var(--brand-primary-strong)] mt-1">“{nameStory.meaning_summary}”</p>
                      </div>
                      
                      <div className="h-px bg-[var(--premium-border)] my-4" />
                      
                      <p className="text-xs text-[var(--brand-primary-strong)] leading-relaxed mb-4">
                        {nameStory.etymology_text}
                      </p>
                      
                      {nameStory.scripture_line && (
                        <div className="p-3.5 rounded-xl bg-[rgba(200,146,74,0.06)] border border-[rgba(200,146,74,0.15)] text-center">
                          <p className="text-xs font-serif text-[var(--brand-primary-strong)] italic leading-relaxed mb-1.5 whitespace-pre-line">
                            {nameStory.scripture_line}
                          </p>
                          <p className="text-[9px] uppercase tracking-wider text-[var(--premium-gold)] font-semibold">
                            — {nameStory.scripture_source}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => goNext(9)}
                      className="w-full rounded-full bg-[var(--premium-gold)] text-white font-bold py-4 px-8 transition-all hover:opacity-90"
                    >
                      Continue →
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Step 9: WhatsApp Reminders (Optional) */}
            {step === 9 && (
              <div>
                {tradition && (
                  <div className="flex justify-center mb-6">
                    <div 
                      className="w-12 h-12 flex items-center justify-center rounded-full border-[1.5px] bg-white shrink-0"
                      style={{
                        borderColor: 'rgba(200, 146, 74, 0.3)',
                        padding: '12px'
                      }}
                    >
                      <span className="text-xl">
                        {TRADITIONS.find(t => t.key === tradition)?.emoji || '🪔'}
                      </span>
                    </div>
                  </div>
                )}
                <h1 className="text-3xl font-medium mb-3 text-[var(--brand-primary-strong)]" style={{ fontFamily: 'var(--font-serif)' }}>
                  Daily Reminders
                </h1>
                <p className="text-[var(--brand-muted)] mb-6">
                  Receive tradition-aware daily reminders, shlokas, and blessings directly on WhatsApp.
                </p>

                <div className="space-y-4">
                  {/* Phone input row */}
                  <div className="flex gap-2">
                    <select
                      value={whatsappCountryCode}
                      onChange={(e) => setWhatsappCountryCode(e.target.value)}
                      disabled={otpVerified}
                      className="rounded-2xl bg-white border border-[var(--premium-border)] focus:border-[var(--premium-gold)] p-4 outline-none text-[var(--brand-primary-strong)] shrink-0 max-w-[100px] disabled:opacity-50"
                    >
                      {COUNTRY_CODES.map((c) => (
                        <option key={`${c.code}-${c.name}`} value={c.code} className="bg-white text-[var(--brand-primary-strong)]">
                          {c.flag} {c.code}
                        </option>
                      ))}
                    </select>
                    <div className="relative flex-1">
                      <input
                        type="tel"
                        value={whatsappNumberOnly}
                        disabled={otpVerified}
                        onChange={(e) => {
                          const cleaned = e.target.value.replace(/\D/g, '');
                          setWhatsappNumberOnly(cleaned);
                        }}
                        placeholder="WhatsApp number"
                        className="w-full rounded-2xl bg-white border border-[var(--premium-border)] focus:border-[var(--premium-gold)] p-4 outline-none text-[var(--brand-primary-strong)] disabled:opacity-50 disabled:pr-10 placeholder-[var(--brand-muted)]/50"
                      />
                      {otpVerified && (
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-600 font-semibold text-sm">
                          ✅
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Opt-in Checkbox */}
                  <label className="flex items-start gap-3 cursor-pointer py-2">
                    <input
                      type="checkbox"
                      checked={whatsappOptIn}
                      disabled={otpVerified}
                      onChange={(e) => {
                        setWhatsappOptIn(e.target.checked);
                        if (!e.target.checked) {
                          setOtpSent(false);
                          setOtpError('');
                          setOtpValue('');
                        }
                      }}
                      className="mt-1 w-4 h-4 rounded accent-[var(--premium-gold)] border-[var(--premium-border)] bg-white disabled:opacity-50"
                    />
                    <div className="text-left">
                      <span className="text-sm font-medium text-[var(--brand-primary-strong)]">
                        Opt-in to tradition-aware daily reminders on WhatsApp
                      </span>
                      <p className="text-xs text-[var(--brand-muted)] mt-0.5">
                        We will never spam you. You can opt-out at any time.
                      </p>
                    </div>
                  </label>

                  {/* Verified state banner */}
                  {otpVerified && (
                    <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-700 font-medium">
                      <span>✅ WhatsApp number verified successfully.</span>
                    </div>
                  )}

                  {/* OTP 6-Digit Inputs (Smooth Slide Down) */}
                  <AnimatePresence>
                    {whatsappOptIn && otpSent && !otpVerified && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden space-y-4 pt-2"
                      >
                        <p className="text-xs text-[var(--brand-muted)] text-left">Enter the 6-digit code sent to your WhatsApp:</p>
                        <div className="flex justify-between gap-2" onPaste={handleOtpPaste}>
                          {Array.from({ length: 6 }).map((_, idx) => (
                            <input
                              key={idx}
                              id={`otp-${idx}`}
                              type="text"
                              maxLength={1}
                              value={otpValue[idx] || ''}
                              onChange={(e) => handleOtpChange(e.target.value, idx)}
                              onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                              className="w-12 h-12 rounded-xl text-center text-xl font-bold bg-white border border-[var(--premium-border)] focus:border-[var(--premium-gold)] text-[var(--brand-primary-strong)] outline-none"
                            />
                          ))}
                        </div>
                        
                        {otpError && (
                          <p className="text-xs text-rose-600 font-semibold text-left">{otpError}</p>
                        )}
                        
                        <div className="flex justify-between items-center">
                          {otpCooldown > 0 ? (
                            <span className="text-xs text-[var(--brand-muted)]">Resend code in {otpCooldown}s</span>
                          ) : (
                            <button
                              type="button"
                              onClick={handleSendOtp}
                              className="text-xs text-[var(--premium-gold)] underline hover:opacity-80 font-medium"
                            >
                              Resend Code
                            </button>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="mt-8 space-y-3">
                  {whatsappOptIn && !otpVerified ? (
                    otpSent ? (
                      <button
                        type="button"
                        onClick={handleVerifyOtp}
                        className="w-full rounded-full bg-[var(--premium-gold)] text-white font-bold py-4 px-8 hover:opacity-90 transition-all"
                      >
                        Verify Code
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        className="w-full rounded-full bg-[var(--premium-gold)] text-white font-bold py-4 px-8 hover:opacity-90 transition-all"
                      >
                        Send verification code
                      </button>
                    )
                  ) : (
                    <button
                      type="button"
                      onClick={() => goNext(10)}
                      className="w-full rounded-full bg-[var(--premium-gold)] text-white font-bold py-4 px-8 hover:opacity-90 transition-all"
                    >
                      Continue →
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setWhatsappOptIn(false);
                      setWhatsappNumberOnly('');
                      setOtpSent(false);
                      setOtpVerified(false);
                      setOtpValue('');
                      goNext(10);
                    }}
                    className="w-full text-[var(--brand-muted)] text-sm underline"
                  >
                    Skip for now
                  </button>
                </div>
              </div>
            )}

            {/* Step 10: Ready */}
            {step === 10 && (
              <div className="min-h-[65vh] flex flex-col items-center justify-center text-center">
                {/* Tradition symbol */}
                <div
                  className="w-20 h-20 flex items-center justify-center rounded-full mb-6"
                  style={{ background: 'rgba(200,146,74,0.1)', border: '1.5px solid rgba(200,146,74,0.3)' }}
                >
                  <span className="text-4xl">{TRADITIONS.find(t => t.key === tradition)?.emoji || '🪔'}</span>
                </div>

                <h1 className="text-3xl font-medium mb-3 text-[var(--brand-primary-strong)]" style={{ fontFamily: 'var(--font-serif)' }}>
                  {readyCopy.heading}
                </h1>
                <p className="text-[var(--brand-muted)] mb-2 leading-relaxed">{readyCopy.body}</p>
                <p className="text-xs text-[var(--brand-muted)] mb-8 opacity-60 italic">
                  Welcome to the Zeroists — seekers who find everything in nothing.
                </p>

                {/* Warm sanctuary cards */}
                <div className="w-full grid grid-cols-3 gap-3 mb-8">
                  {[
                    { emoji: '📿', label: 'Daily Japa', desc: 'Mantra & mala' },
                    { emoji: '📅', label: 'Panchang', desc: 'Tithi & muhurta' },
                    { emoji: '👥', label: 'Mandali', desc: 'Your sangat' },
                  ].map(item => (
                    <div key={item.label}
                      className="flex flex-col items-center gap-1.5 rounded-2xl py-4 px-2"
                      style={{ background: 'rgba(200,146,74,0.06)', border: '1px solid rgba(200,146,74,0.15)' }}
                    >
                      <span className="text-2xl">{item.emoji}</span>
                      <span className="text-[11px] font-semibold text-[var(--brand-primary-strong)]">{item.label}</span>
                      <span className="text-[9px] text-[var(--brand-muted)]">{item.desc}</span>
                    </div>
                  ))}
                </div>

                <div className="w-full space-y-3">
                  <button
                    type="button"
                    onClick={() => complete('/japa')}
                    disabled={saving}
                    className="w-full rounded-full bg-[var(--premium-gold)] text-white font-bold py-4 px-8 disabled:opacity-60 hover:opacity-90 transition-opacity"
                  >
                    {saving ? 'Setting up…' : 'Begin my Sadhana →'}
                  </button>
                  <button
                    type="button"
                    onClick={() => complete('/home')}
                    disabled={saving}
                    className="text-[var(--brand-muted)] text-sm underline"
                  >
                    Explore the Sanctuary first
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
