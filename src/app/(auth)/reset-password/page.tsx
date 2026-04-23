'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import BrandMark from '@/components/BrandMark';

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = useMemo(() => {
    if (typeof window === 'undefined') return null;
    return createClient();
  }, []);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [hasRecoverySession, setHasRecoverySession] = useState(false);

  useEffect(() => {
    if (!supabase) return;

    let active = true;
    const auth = supabase.auth;

    const { data: authListener } = auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === 'PASSWORD_RECOVERY') {
        toast.success('Recovery link verified. You can set a new password now.');
      }

      setHasRecoverySession(Boolean(session));
      setCheckingSession(false);
    });

    async function loadRecoveryState() {
      const { data: { session } } = await auth.getSession();
      if (!active) return;

      setHasRecoverySession(Boolean(session));
      setCheckingSession(false);
    }

    loadRecoveryState();

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, [supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!supabase) {
      toast.error('Auth is still initializing. Please try again.');
      return;
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      await supabase.auth.signOut();
      router.push('/login?message=password_reset_success');
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Could not update your password.');
    } finally {
      setLoading(false);
    }
  }

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <BrandMark />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex">
            <BrandMark />
          </Link>
          <h1 className="font-display text-2xl font-bold text-[color:var(--text-cream)] mt-2">Choose a new password</h1>
          <p className="text-[color:var(--brand-muted)] text-sm mt-1">Set a strong new password for your account.</p>
        </div>

        {!hasRecoverySession ? (
          <div className="glass-panel-strong rounded-[2rem] shadow-card p-6 text-center space-y-4">
            <p className="text-sm text-[color:var(--brand-muted)] leading-6">
              This recovery session is missing or has expired. Request a fresh reset link and open it from your email.
            </p>
            <Link href="/forgot-password" className="glass-button-primary inline-flex px-5 py-3 rounded-xl text-sm font-semibold text-white">
              Request a new reset link
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="glass-panel-strong rounded-[2rem] shadow-card p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-[color:var(--text-muted-warm)] mb-1.5">New password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min. 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="glass-input w-full px-4 py-3 pr-12 rounded-xl focus:border-[color:var(--brand-primary)] focus:ring-2 focus:ring-[rgba(200,146,74,0.12)] outline-none transition text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[color:var(--text-dim)] hover:text-[color:var(--brand-muted)]"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[color:var(--text-muted-warm)] mb-1.5">Confirm new password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Repeat your new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="glass-input w-full px-4 py-3 rounded-xl focus:border-[color:var(--brand-primary)] focus:ring-2 focus:ring-[rgba(200,146,74,0.12)] outline-none transition text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="glass-button-primary w-full py-3 text-white font-semibold rounded-xl hover:opacity-90 transition disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? <><Loader2 size={16} className="animate-spin" /> Updating password...</> : 'Save new password'}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-[color:var(--brand-muted)] mt-6">
          Need to go back?{' '}
          <Link href="/login" className="text-[color:var(--brand-primary)] font-medium hover:underline">
            Return to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
