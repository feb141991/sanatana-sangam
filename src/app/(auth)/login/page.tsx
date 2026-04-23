'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, Suspense, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import BrandMark from '@/components/BrandMark';

function LoginForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const supabase     = useMemo(() => {
    if (typeof window === 'undefined') return null;
    return createClient();
  }, []);
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const presetEmail = searchParams.get('email')?.trim().toLowerCase() ?? '';
  const message = searchParams.get('message');
  const errorCode = searchParams.get('error');
  const emailHint = email.trim().toLowerCase() || presetEmail;

  const forgotPasswordHref = emailHint
    ? `/forgot-password?email=${encodeURIComponent(emailHint)}`
    : '/forgot-password';
  const confirmEmailHref = emailHint
    ? `/confirm-email?email=${encodeURIComponent(emailHint)}`
    : '/confirm-email';

  useEffect(() => {
    if (presetEmail) {
      setEmail((current) => current || presetEmail);
    }
    if (message === 'check_email') {
      toast('Check your inbox for the confirmation link. If this email already has an account, sign in, reset your password, or resend confirmation below.', { icon: '📧' });
    }
    if (message === 'password_reset_requested') {
      toast.success('Password reset link sent. Check your email and open the secure link.');
    }
    if (message === 'password_reset_success') {
      toast.success('Password updated successfully. You can sign in now.');
    }
    if (message === 'confirmation_resent') {
      toast.success('Confirmation email resent. Check your inbox and spam folder.');
    }
    if (errorCode === 'email_verification_failed') {
      toast.error('Email verification failed — please try signing up again.');
    }
    if (errorCode === 'password_reset_failed') {
      toast.error('Password reset link was invalid or expired. Request a fresh one.');
    }
  }, [errorCode, message, presetEmail]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) {
      toast.error('Auth is still initializing. Please try again.');
      return;
    }

    setLoading(true);
    const normalizedEmail = email.trim().toLowerCase();
    const { error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Jai Shri Ram! Welcome back 🙏');
      router.push('/home');
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        <div className="text-center mb-8">
          <Link href="/" className="inline-flex">
            <BrandMark />
          </Link>
          <h1 className="font-display text-2xl font-bold text-[color:var(--text-cream)] mt-2">Welcome back</h1>
          <p className="text-[color:var(--brand-muted)] text-sm mt-1">Sign in to your Sangam</p>
        </div>

        <div className="hidden sm:grid gap-3 mb-4 sm:grid-cols-2">
          {[
            {
              eyebrow: 'Return',
              title: 'Pick up where you left off',
              description: 'Home, Pathshala, and your sacred-time rhythm will be waiting as you left them.',
            },
            {
              eyebrow: 'Need help?',
              title: 'Recovery stays close',
              description: 'Password reset and confirmation resend remain nearby so the front door never feels blocking.',
            },
          ].map((item) => (
            <div key={item.title} className="glass-panel rounded-[1.45rem] px-4 py-4">
              <p className="text-[10px] uppercase tracking-[0.18em] font-semibold text-[color:var(--brand-primary)]">{item.eyebrow}</p>
              <p className="font-semibold text-[color:var(--text-cream)] mt-2">{item.title}</p>
              <p className="text-sm text-[color:var(--brand-muted)] mt-2 leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>

        <form onSubmit={handleLogin} className="glass-panel-strong rounded-[2rem] shadow-card p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[color:var(--text-muted-warm)] mb-1.5">Email</label>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="glass-input w-full px-4 py-3 rounded-xl focus:border-[color:var(--brand-primary)] focus:ring-2 focus:ring-[rgba(200,146,74,0.12)] outline-none transition text-sm"
            />
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <label className="block text-sm font-medium text-[color:var(--text-muted-warm)]">Password</label>
              <Link href={forgotPasswordHref} className="text-xs font-medium text-[color:var(--brand-primary)] hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="glass-input w-full px-4 py-3 pr-12 rounded-xl focus:border-[color:var(--brand-primary)] focus:ring-2 focus:ring-[rgba(200,146,74,0.12)] outline-none transition text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[color:var(--text-dim)] hover:text-[color:var(--brand-muted)]"
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="glass-button-primary w-full py-3 text-white font-semibold rounded-xl hover:opacity-90 transition disabled:opacity-60"
          >
            {loading ? 'Signing in...' : 'Sign In 🙏'}
          </button>
        </form>

        <div className="glass-panel rounded-2xl px-4 py-3 mt-4 text-sm text-[color:var(--brand-muted)]">
          <p className="font-medium text-[color:var(--text-cream)]">Didn&apos;t get your confirmation email?</p>
          <p className="mt-1 text-xs leading-5 text-[color:var(--brand-muted)]">
            If you already started signup, you can resend the confirmation link here.
          </p>
          <Link href={confirmEmailHref} className="mt-2 inline-flex text-xs font-semibold text-[color:var(--brand-primary)] hover:underline">
            Resend confirmation email
          </Link>
        </div>

        <p className="text-center text-sm text-[color:var(--brand-muted)] mt-6">
          New to Sanatana Sangam?{' '}
          <Link href="/signup" className="text-[color:var(--brand-primary)] font-medium hover:underline">
            Join free
          </Link>
        </p>

        {/* Continue as Guest */}
        <div className="text-center mt-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-[color:var(--text-dim)]">or</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>
          <Link
            href="/guest"
            className="glass-button-secondary inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm text-[color:var(--brand-muted)] hover:text-[color:var(--brand-primary)] transition"
          >
            <span>👁️</span>
            <span>Explore as Guest</span>
          </Link>
          <p className="hidden sm:block text-xs text-[color:var(--text-dim)] mt-2">Read discussions and discover nearby sacred places without creating an account</p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <BrandMark />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
