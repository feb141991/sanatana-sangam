'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { ArrowRight, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { SAMPRADAYAS, ISHTA_DEVATAS, SPIRITUAL_LEVELS } from '@/lib/utils';

type Step = 1 | 2 | 3;

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const [form, setForm] = useState({
    email:          '',
    password:       '',
    full_name:      '',
    username:       '',
    city:           '',
    country:        '',
    sampradaya:     '',
    ishta_devata:   '',
    spiritual_level:'jigyasu',
    seeking:        [] as string[],
    kul:            '',
    gotra:          '',
  });

  const seeking_options = [
    { value: 'community',   label: '🤝 Local community' },
    { value: 'knowledge',   label: '📚 Knowledge & learning' },
    { value: 'events',      label: '🎉 Events & festivals' },
    { value: 'mentorship',  label: '🙏 Spiritual mentorship' },
    { value: 'youth',       label: '🌱 Youth connection' },
  ];

  function toggleSeeking(value: string) {
    setForm((f) => ({
      ...f,
      seeking: f.seeking.includes(value)
        ? f.seeking.filter((s) => s !== value)
        : [...f.seeking, value],
    }));
  }

  async function handleSubmit() {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email:    form.email,
        password: form.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            full_name: form.full_name,
            username:  form.username.toLowerCase().replace(/\s+/g, '_'),
          },
        },
      });
      if (error) throw error;
      if (!data.user) throw new Error('Signup failed — please try again.');

      // Update profile with Dharmic Identity
      // Note: setting city + country fires the auto_assign_mandali DB trigger
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name:       form.full_name,
          username:        form.username.toLowerCase().replace(/\s+/g, '_'),
          city:            form.city    || null,
          country:         form.country || null,
          sampradaya:      form.sampradaya    || null,
          ishta_devata:    form.ishta_devata  || null,
          spiritual_level: form.spiritual_level,
          seeking:         form.seeking,
          kul:             form.kul   || null,
          gotra:           form.gotra || null,
        })
        .eq('id', data.user.id);

      if (profileError) console.warn('Profile update:', profileError.message);

      // If email confirmation is required, user won't be logged in yet
      if (data.session) {
        toast.success('Welcome to Sanatana Sangam! 🕉️');
        router.push('/home');
      } else {
        toast.success('Check your email to confirm your account 🙏');
        router.push('/login?message=check_email');
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  const progress = ((step - 1) / 2) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fff8f0] via-white to-[#fdf6e3] flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl om-pulse inline-block">🕉️</Link>
          <h1 className="font-display text-2xl font-bold text-gray-900 mt-2">
            Join Sanatana Sangam
          </h1>
          <p className="text-gray-500 text-sm mt-1">Your dharmic home awaits</p>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-xs text-gray-400 mb-2">
            <span className={step >= 1 ? 'text-orange-600 font-medium' : ''}>Account</span>
            <span className={step >= 2 ? 'text-orange-600 font-medium' : ''}>Identity</span>
            <span className={step >= 3 ? 'text-orange-600 font-medium' : ''}>Seeking</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-sacred rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-card border border-orange-50 p-6">

          {/* ── STEP 1: Account ─────────────────────── */}
          {step === 1 && (
            <div className="space-y-4 fade-in">
              <h2 className="font-display font-semibold text-lg text-gray-900">Create your account</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                <input
                  type="text"
                  placeholder="Arjun Sharma"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Username</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">@</span>
                  <input
                    type="text"
                    placeholder="arjun_sharma"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    className="w-full pl-8 pr-4 py-3 rounded-xl border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <input
                  type="email"
                  placeholder="arjun@email.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    placeholder="Min. 8 characters"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                onClick={() => {
                  if (!form.full_name || !form.email || !form.password || !form.username) {
                    toast.error('Please fill in all fields'); return;
                  }
                  if (form.password.length < 8) {
                    toast.error('Password must be at least 8 characters'); return;
                  }
                  setStep(2);
                }}
                className="w-full py-3 bg-gradient-sacred text-white font-semibold rounded-xl hover:opacity-90 transition flex items-center justify-center gap-2"
              >
                Continue <ArrowRight size={16} />
              </button>
            </div>
          )}

          {/* ── STEP 2: Dharmic Identity ─────────────── */}
          {step === 2 && (
            <div className="space-y-5 fade-in">
              <h2 className="font-display font-semibold text-lg text-gray-900">Your Dharmic Identity</h2>
              <p className="text-sm text-gray-500">This personalises your feed. You can always update it later.</p>

              {/* Location */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">City</label>
                  <input
                    type="text"
                    placeholder="Leicester"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-orange-400 outline-none transition text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Country</label>
                  <input
                    type="text"
                    placeholder="UK"
                    value={form.country}
                    onChange={(e) => setForm({ ...form, country: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-orange-400 outline-none transition text-sm"
                  />
                </div>
              </div>

              {/* Ishta Devata */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ishta Devata</label>
                <div className="grid grid-cols-2 gap-2">
                  {ISHTA_DEVATAS.map((d) => (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() => setForm({ ...form, ishta_devata: d.value })}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition ${
                        form.ishta_devata === d.value
                          ? 'border-orange-400 bg-orange-50 text-orange-700 font-medium'
                          : 'border-gray-200 hover:border-orange-200 text-gray-600'
                      }`}
                    >
                      <span>{d.emoji}</span>
                      <span>{d.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sampradaya */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sampradaya</label>
                <select
                  value={form.sampradaya}
                  onChange={(e) => setForm({ ...form, sampradaya: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-orange-400 outline-none transition text-sm bg-white"
                >
                  <option value="">Select your tradition (optional)</option>
                  {SAMPRADAYAS.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              {/* Spiritual Level */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Where are you on the path?</label>
                <div className="space-y-2">
                  {SPIRITUAL_LEVELS.map((l) => (
                    <button
                      key={l.value}
                      type="button"
                      onClick={() => setForm({ ...form, spiritual_level: l.value })}
                      className={`w-full text-left px-4 py-3 rounded-xl border transition ${
                        form.spiritual_level === l.value
                          ? 'border-orange-400 bg-orange-50'
                          : 'border-gray-200 hover:border-orange-200'
                      }`}
                    >
                      <div className={`font-medium text-sm ${form.spiritual_level === l.value ? 'text-orange-700' : 'text-gray-800'}`}>
                        {l.label}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">{l.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Lineage (optional) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Kul / Family (optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Kashyap"
                    value={form.kul}
                    onChange={(e) => setForm({ ...form, kul: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-orange-400 outline-none transition text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Gotra (optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Bharadwaj"
                    value={form.gotra}
                    onChange={(e) => setForm({ ...form, gotra: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-orange-400 outline-none transition text-sm"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1 px-4 py-3 text-gray-500 hover:text-gray-800 transition text-sm"
                >
                  <ArrowLeft size={16} /> Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 py-3 bg-gradient-sacred text-white font-semibold rounded-xl hover:opacity-90 transition flex items-center justify-center gap-2"
                >
                  Continue <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3: What are you seeking ────────── */}
          {step === 3 && (
            <div className="space-y-5 fade-in">
              <h2 className="font-display font-semibold text-lg text-gray-900">What are you seeking?</h2>
              <p className="text-sm text-gray-500">Select all that apply — helps us personalise your Sangam.</p>

              <div className="space-y-2">
                {seeking_options.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => toggleSeeking(opt.value)}
                    className={`w-full text-left px-4 py-3 rounded-xl border transition text-sm font-medium ${
                      form.seeking.includes(opt.value)
                        ? 'border-orange-400 bg-orange-50 text-orange-700'
                        : 'border-gray-200 hover:border-orange-200 text-gray-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setStep(2)}
                  className="flex items-center gap-1 px-4 py-3 text-gray-500 hover:text-gray-800 transition text-sm"
                >
                  <ArrowLeft size={16} /> Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 py-3 bg-gradient-sacred text-white font-semibold rounded-xl hover:opacity-90 transition flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {loading ? 'Joining...' : <>Enter the Sangam 🕉️</>}
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already a member?{' '}
          <Link href="/login" className="text-orange-600 font-medium hover:underline">
            Sign in
          </Link>
        </p>

        {/* Continue as Guest */}
        <div className="text-center mt-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">or</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>
          <Link
            href="/vichaar-sabha"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-gray-200 text-sm text-gray-500 hover:border-orange-300 hover:text-orange-600 transition bg-white"
          >
            <span>👁️</span>
            <span>Continue as Guest</span>
          </Link>
          <p className="text-xs text-gray-400 mt-2">Browse Vichaar Sabha & Tirtha Map without an account</p>
        </div>
      </div>
    </div>
  );
}
