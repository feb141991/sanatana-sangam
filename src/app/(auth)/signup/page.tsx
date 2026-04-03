'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { ArrowRight, ArrowLeft, Eye, EyeOff, MapPin, Loader2, Lock } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import BrandMark from '@/components/BrandMark';
import { TRADITIONS, SAMPRADAYAS_BY_TRADITION, ISHTA_DEVATAS_BY_TRADITION, getSampradayaLabel, getIshtaDevataLabel } from '@/lib/utils';
import { SPIRITUAL_LEVELS } from '@/lib/utils';
import type { TraditionKey } from '@/lib/traditions';

type Step = 1 | 2 | 3;

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

  const [form, setForm] = useState({
    email:          '',
    password:       '',
    full_name:      '',
    username:       '',
    tradition:      '' as TraditionKey | '',
    neighbourhood:  '',
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

  const activeTradition   = (form.tradition || 'hindu') as TraditionKey;
  const sampradayaOptions = SAMPRADAYAS_BY_TRADITION[activeTradition] ?? SAMPRADAYAS_BY_TRADITION['hindu'];
  const devataOptions     = ISHTA_DEVATAS_BY_TRADITION[activeTradition] ?? ISHTA_DEVATAS_BY_TRADITION['hindu'];
  const sampradayaLabel   = getSampradayaLabel(form.tradition);
  const devataLabel       = getIshtaDevataLabel(form.tradition);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setInviteCode(params.get('ref')?.trim().toUpperCase() ?? '');
  }, []);

  // ── Detect location via browser geolocation + Nominatim reverse geocode ──
  async function detectLocation() {
    if (!navigator.geolocation) { toast.error('Geolocation not supported on this device'); return; }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res  = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const data = await res.json();
          const addr = data.address ?? {};
          const neighbourhood = addr.neighbourhood || addr.suburb || addr.quarter || addr.village || '';
          const city          = addr.city || addr.town || addr.municipality || addr.county || '';
          const country       = addr.country || '';
          setForm(f => ({ ...f, neighbourhood, city, country, latitude, longitude }));
          toast.success(`📍 ${city}${country ? ', ' + country : ''} detected!`);
        } catch {
          toast.error('Could not look up your area — please enter manually');
        } finally {
          setGeoLoading(false);
        }
      },
      () => { toast.error('Location access denied — please enter your city manually'); setGeoLoading(false); },
      { timeout: 8000 }
    );
  }

  const seeking_options = [
    { value: 'community',  label: '🤝 Local community'       },
    { value: 'knowledge',  label: '📚 Knowledge & learning'  },
    { value: 'events',     label: '🎉 Events & festivals'     },
    { value: 'mentorship', label: '🙏 Spiritual mentorship'   },
    { value: 'youth',      label: '🌱 Youth connection'       },
  ];

  function toggleSeeking(value: string) {
    setForm(f => ({
      ...f,
      seeking: f.seeking.includes(value)
        ? f.seeking.filter(s => s !== value)
        : [...f.seeking, value],
    }));
  }

  async function handleSubmit() {
    if (!supabase) {
      toast.error('Auth is still initializing. Please try again.');
      return;
    }

    if (!acceptedPolicies) {
      toast.error('Please accept the Terms, Privacy Policy, and Community Guidelines');
      return;
    }

    setLoading(true);
    try {
      const normalizedEmail = form.email.trim().toLowerCase();
      const normalizedUsername = form.username.toLowerCase().trim().replace(/\s+/g, '_');
      const profilePayload = {
        full_name:       form.full_name.trim(),
        username:        normalizedUsername,
        tradition:       form.tradition || null,
        neighbourhood:   form.neighbourhood.trim() || null,
        city:            form.city.trim() || null,
        country:         form.country.trim() || null,
        latitude:        form.latitude,
        longitude:       form.longitude,
        sampradaya:      form.sampradaya || null,
        ishta_devata:    form.ishta_devata || null,
        spiritual_level: form.spiritual_level,
        seeking:         form.seeking,
        kul:             form.kul.trim() || null,
        gotra:           form.gotra.trim() || null,
      };

      const { data, error } = await supabase.auth.signUp({
        email:    normalizedEmail,
        password: form.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            ...profilePayload,
            referred_by_code: inviteCode || null,
          },
        },
      });
      if (error) throw error;
      if (!data.user) throw new Error('Signup failed — please try again.');

      if (data.session) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update(profilePayload)
          .eq('id', data.user.id);

        if (profileError) throw profileError;

        toast.success('Welcome to Sanatana Sangam! 🙏');
        router.push('/home');
        router.refresh();
      } else {
        toast.success('Check your inbox to continue. If this email already has an account, sign in, reset your password, or resend confirmation from the next screen.');
        router.push(`/login?message=check_email&email=${encodeURIComponent(normalizedEmail)}`);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  const progress = ((step - 1) / 2) * 100;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex">
            <BrandMark />
          </Link>
          <h1 className="font-display text-2xl font-bold text-gray-900 mt-2">Join Sanatana Sangam</h1>
          <p className="text-gray-500 text-sm mt-1">Your dharmic home awaits</p>
        </div>

        {inviteCode && (
          <div className="glass-panel mb-5 rounded-2xl px-4 py-3 text-sm text-orange-900">
            Joining with invite code <span className="font-semibold">{inviteCode}</span>
          </div>
        )}

        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-xs text-gray-400 mb-2">
            <span className={step >= 1 ? 'text-orange-600 font-medium' : ''}>Account</span>
            <span className={step >= 2 ? 'text-orange-600 font-medium' : ''}>Identity</span>
            <span className={step >= 3 ? 'text-orange-600 font-medium' : ''}>Seeking</span>
          </div>
          <div className="glass-panel h-1.5 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-sacred rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="glass-panel-strong rounded-[2rem] shadow-card p-6">

          {/* ── STEP 1: Account ─────────────────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-4 fade-in">
              <h2 className="font-display font-semibold text-lg text-gray-900">Create your account</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                <input type="text" placeholder="Arjun Sharma" value={form.full_name}
                  onChange={e => setForm({ ...form, full_name: e.target.value })}
                  className="glass-input w-full px-4 py-3 rounded-xl focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition text-sm" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Username</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">@</span>
                  <input type="text" placeholder="arjun_sharma" value={form.username}
                    onChange={e => setForm({ ...form, username: e.target.value })}
                    className="glass-input w-full pl-8 pr-4 py-3 rounded-xl focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <input type="email" placeholder="arjun@email.com" value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className="glass-input w-full px-4 py-3 rounded-xl focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition text-sm" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                <div className="relative">
                  <input type={showPass ? 'text' : 'password'} placeholder="Min. 8 characters" value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    className="glass-input w-full px-4 py-3 pr-12 rounded-xl focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition text-sm" />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button onClick={() => {
                if (!form.full_name || !form.email || !form.password || !form.username) {
                  toast.error('Please fill in all fields'); return;
                }
                if (form.password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
                setStep(2);
              }} className="glass-button-primary w-full py-3 text-white font-semibold rounded-xl hover:opacity-90 transition flex items-center justify-center gap-2">
                Continue <ArrowRight size={16} />
              </button>
            </div>
          )}

          {/* ── STEP 2: Dharmic Identity ─────────────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-5 fade-in">
              <div>
                <h2 className="font-display font-semibold text-lg text-gray-900">Your Dharmic Identity</h2>
                <p className="text-sm text-gray-500 mt-0.5">Choose your tradition — this shapes your entire experience.</p>
              </div>

              {/* ── Tradition tile picker — LOCKED after set ─────────────── */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-gray-800">Your Tradition</label>
                  <span className="flex items-center gap-1 text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                    <Lock size={9} /> Set once, cannot be changed
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {TRADITIONS.map(t => (
                    <button key={t.value} type="button"
                      onClick={() => setForm({ ...form, tradition: t.value as TraditionKey, sampradaya: '', ishta_devata: '' })}
                      className={`text-left px-4 py-3 rounded-xl border-2 transition flex items-center gap-3 ${
                        form.tradition === t.value
                          ? 'border-orange-400 bg-orange-50'
                          : 'border-gray-100 hover:border-orange-200 bg-gray-50/50'
                      }`}>
                      <span className="text-2xl flex-shrink-0">{t.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold text-sm leading-tight ${form.tradition === t.value ? 'text-orange-700' : 'text-gray-800'}`}>
                          {t.label}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5 leading-tight">{t.desc}</p>
                      </div>
                      {form.tradition === t.value && (
                        <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ background: '#E8640A' }}>
                          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                            <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Only show fields after tradition is chosen ─────────────── */}
              {form.tradition && (
                <>
                  {/* Location */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Your Location</label>
                    <button type="button" onClick={detectLocation} disabled={geoLoading}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-orange-200 text-orange-600 text-sm font-medium hover:border-orange-400 hover:bg-orange-50 transition disabled:opacity-60 mb-2">
                      {geoLoading
                        ? <><Loader2 size={15} className="animate-spin" /> Detecting…</>
                        : <><MapPin size={15} /> Detect my location automatically</>}
                    </button>
                    {form.city && (
                      <div className="mb-2 px-3 py-2 rounded-xl bg-green-50 border border-green-200 text-sm text-green-700 font-medium">
                        📍 {[form.city, form.country].filter(Boolean).join(', ')}
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-2">
                      <input type="text" placeholder="City" value={form.city}
                        onChange={e => setForm({ ...form, city: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-orange-400 outline-none transition text-sm" />
                      <input type="text" placeholder="Country" value={form.country}
                        onChange={e => setForm({ ...form, country: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-orange-400 outline-none transition text-sm" />
                    </div>
                  </div>

                  {/* Sampradaya / Panth / School / Sect — filtered by tradition */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{sampradayaLabel}</label>
                    <select value={form.sampradaya}
                      onChange={e => setForm({ ...form, sampradaya: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-orange-400 outline-none transition text-sm bg-white">
                      <option value="">Select {sampradayaLabel.toLowerCase()} (optional)</option>
                      {sampradayaOptions.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>

                  {/* Ishta Devata / Simran Focus / Bodhisattva / Tirthankar — filtered */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{devataLabel} <span className="text-gray-400 font-normal">(optional)</span></label>
                    <div className="grid grid-cols-2 gap-2">
                      {devataOptions.map(d => (
                        <button key={d.value} type="button"
                          onClick={() => setForm({ ...form, ishta_devata: d.value })}
                          className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition ${
                            form.ishta_devata === d.value
                              ? 'border-orange-400 bg-orange-50 text-orange-700 font-medium'
                              : 'border-gray-200 hover:border-orange-200 text-gray-600'
                          }`}>
                          <span>{d.emoji}</span>
                          <span className="truncate">{d.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Spiritual Level */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Where are you on the path?</label>
                    <div className="space-y-2">
                      {SPIRITUAL_LEVELS.map(l => (
                        <button key={l.value} type="button"
                          onClick={() => setForm({ ...form, spiritual_level: l.value })}
                          className={`w-full text-left px-4 py-3 rounded-xl border transition ${
                            form.spiritual_level === l.value
                              ? 'border-orange-400 bg-orange-50'
                              : 'border-gray-200 hover:border-orange-200'
                          }`}>
                          <div className={`font-medium text-sm ${form.spiritual_level === l.value ? 'text-orange-700' : 'text-gray-800'}`}>{l.label}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{l.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Kul / Gotra — Hindu only */}
                  {form.tradition === 'hindu' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Kul / Vansh <span className="text-gray-400 font-normal">(optional)</span></label>
                        <input type="text" placeholder="e.g. Kashyap"
                          value={form.kul}
                          onChange={e => setForm({ ...form, kul: e.target.value })}
                          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-orange-400 outline-none transition text-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Gotra <span className="text-gray-400 font-normal">(optional)</span></label>
                        <input type="text" placeholder="e.g. Bharadwaj"
                          value={form.gotra}
                          onChange={e => setForm({ ...form, gotra: e.target.value })}
                          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-orange-400 outline-none transition text-sm" />
                      </div>
                    </div>
                  )}
                </>
              )}

              <div className="flex gap-3 pt-2">
                <button onClick={() => setStep(1)}
                  className="flex items-center gap-1 px-4 py-3 text-gray-500 hover:text-gray-800 transition text-sm">
                  <ArrowLeft size={16} /> Back
                </button>
                <button onClick={() => {
                  if (!form.tradition) { toast.error('Please choose your tradition to continue'); return; }
                  setStep(3);
                }} className="flex-1 py-3 bg-gradient-sacred text-white font-semibold rounded-xl hover:opacity-90 transition flex items-center justify-center gap-2">
                  Continue <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3: What are you seeking ─────────────────────────────────── */}
          {step === 3 && (
            <div className="space-y-5 fade-in">
              <div>
                <h2 className="font-display font-semibold text-lg text-gray-900">What are you seeking?</h2>
                <p className="text-sm text-gray-500 mt-0.5">Select all that apply — helps us personalise your Sangam.</p>
              </div>

              <div className="space-y-2">
                {seeking_options.map(opt => (
                  <button key={opt.value} type="button" onClick={() => toggleSeeking(opt.value)}
                    className={`w-full text-left px-4 py-3 rounded-xl border transition text-sm font-medium ${
                      form.seeking.includes(opt.value)
                        ? 'border-orange-400 bg-orange-50 text-orange-700'
                        : 'border-gray-200 hover:border-orange-200 text-gray-700'
                    }`}>
                    {opt.label}
                  </button>
                ))}
              </div>

              <div className="glass-panel rounded-2xl px-4 py-3 text-sm text-gray-600">
                <div className="flex items-start gap-3">
                <input
                  id="policy-consent"
                  type="checkbox"
                  checked={acceptedPolicies}
                  onChange={(e) => setAcceptedPolicies(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-[#7B1A1A] focus:ring-[#7B1A1A]"
                />
                <label htmlFor="policy-consent" className="leading-6">
                  I agree to the{' '}
                  <Link href="/terms" className="text-[#7B1A1A] font-semibold hover:underline">
                    Terms
                  </Link>
                  ,{' '}
                  <Link href="/privacy" className="text-[#7B1A1A] font-semibold hover:underline">
                    Privacy Policy
                  </Link>
                  {' '}and{' '}
                  <Link href="/guidelines" className="text-[#7B1A1A] font-semibold hover:underline">
                    Community Guidelines
                  </Link>
                  .
                </label>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setStep(2)}
                  className="flex items-center gap-1 px-4 py-3 text-gray-500 hover:text-gray-800 transition text-sm">
                  <ArrowLeft size={16} /> Back
                </button>
                <button onClick={handleSubmit} disabled={loading || !acceptedPolicies}
                  className="flex-1 py-3 bg-gradient-sacred text-white font-semibold rounded-xl hover:opacity-90 transition flex items-center justify-center gap-2 disabled:opacity-60">
                  {loading ? 'Joining…' : <>Enter the Sangam 🙏</>}
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already a member?{' '}
          <Link href="/login" className="text-orange-600 font-medium hover:underline">Sign in</Link>
        </p>

        <div className="text-center mt-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">or</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>
          <Link href="/guest"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-gray-200 text-sm text-gray-500 hover:border-orange-300 hover:text-orange-600 transition bg-white">
            <span>👁️</span>
            <span>Explore as Guest</span>
          </Link>
          <p className="text-xs text-gray-400 mt-2">Read discussions and discover nearby sacred places without creating an account</p>
        </div>
      </div>
    </div>
  );
}
