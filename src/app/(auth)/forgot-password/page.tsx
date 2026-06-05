'use client';

export const dynamic = 'force-dynamic';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import BrandMark from '@/components/BrandMark';

function ForgotPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => {
    if (typeof window === 'undefined') return null;
    return createClient();
  }, []);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const presetEmail = searchParams.get('email')?.trim().toLowerCase() ?? '';
  const errorCode = searchParams.get('error');

  useEffect(() => {
    if (presetEmail) {
      setEmail((current) => current || presetEmail);
    }
    if (errorCode === 'password_reset_failed') {
      toast.error('That reset link was invalid or expired. Request a fresh one below.');
    }
  }, [errorCode, presetEmail]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) {
      toast.error('Auth is still initializing. Please try again.');
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      toast.error('Enter your email address first.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;

      router.push(`/login?message=password_reset_requested&email=${encodeURIComponent(normalizedEmail)}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Could not send reset email.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex">
            <BrandMark />
          </Link>
          <h1 className="font-display text-2xl font-bold text-[color:var(--text-cream)] mt-2">Reset your password</h1>
          <p className="text-[color:var(--brand-muted)] text-sm mt-1">We&apos;ll email you a secure link to set a new password.</p>
        </div>

        <div className="glass-panel rounded-[1.45rem] px-4 py-4 mb-4">
          <p className="text-[10px] uppercase tracking-[0.18em] font-semibold text-[color:var(--brand-primary)]">Recovery</p>
          <p className="font-semibold text-[color:var(--text-cream)] mt-2">Keep the front door gentle</p>
          <p className="text-sm text-[color:var(--brand-muted)] mt-2 leading-relaxed">
            If the link expires or your confirmation email is still missing, the next step stays on this same path instead of making you start over.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="glass-panel-strong rounded-[2rem] shadow-card p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[color:var(--text-muted-warm)] mb-1.5">Email</label>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="glass-input w-full px-4 py-3 rounded-xl focus:border-[color:var(--brand-primary)] focus:ring-2 focus:ring-orange-100 outline-none transition text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="glass-button-primary w-full py-3 text-white font-semibold rounded-xl hover:opacity-90 transition disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 size={16} className="animate-spin" /> Sending link...</> : 'Send reset link'}
          </button>
        </form>

        <div className="glass-panel rounded-2xl px-4 py-3 mt-4 text-sm text-[color:var(--brand-muted)]">
          <p className="font-medium text-[color:var(--text-cream)]">Still waiting for account confirmation?</p>
          <Link
            href={(email.trim().toLowerCase() || presetEmail) ? `/confirm-email?email=${encodeURIComponent(email.trim().toLowerCase() || presetEmail)}` : '/confirm-email'}
            className="mt-2 inline-flex text-xs font-semibold text-orange-600 hover:underline"
          >
            Resend confirmation email
          </Link>
        </div>

        <p className="text-center text-sm text-[color:var(--brand-muted)] mt-6">
          Remembered your password?{' '}
          <Link href="/login" className="text-orange-600 font-medium hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <BrandMark />
      </div>
    }>
      <ForgotPasswordForm />
    </Suspense>
  );
}
