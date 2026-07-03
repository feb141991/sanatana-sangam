'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Loader2, Lock, Mail, Sparkles } from 'lucide-react';
import BrandMark from '@/components/BrandMark';
import { createClient } from '@/lib/supabase';
import { getAuthCallbackUrl } from '@/lib/auth-redirect';
import { getClientPostAuthDestination } from '@/lib/auth-client-destination';

function usernameFromEmail(email: string) {
  const base = email
    .split('@')[0]
    ?.toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 24);

  return `${base || 'seeker'}_${Date.now().toString(36).slice(-4)}`;
}

function nameFromEmail(email: string) {
  const base = email.split('@')[0]?.replace(/[._-]+/g, ' ').trim();
  return base || 'Shoonaya Seeker';
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.';
}

export default function SignupPage() {
  const router = useRouter();
  const supabase = useMemo(() => {
    if (typeof window === 'undefined') return null;
    return createClient();
  }, []);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [acceptedPolicies, setAcceptedPolicies] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [claimToken, setClaimToken] = useState('');
  const [utmSource, setUtmSource] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setInviteCode(params.get('ref')?.trim().toUpperCase() ?? '');
    setClaimToken(params.get('claim_token')?.trim() ?? '');
    setUtmSource(params.get('utm_source')?.trim() ?? params.get('source')?.trim() ?? '');
  }, []);

  const onboardingNext = '/onboarding' + (claimToken ? `?claim_token=${encodeURIComponent(claimToken)}` : '');
  const signupContext = claimToken
    ? {
        iconLabel: 'Claim your profile',
        headline: 'Complete your sacred profile',
        description: 'Create your account to save this reading, then choose your path in onboarding.',
        googleLabel: 'Continue with Google',
        dividerLabel: 'or create with email',
      }
    : inviteCode
      ? {
          iconLabel: 'Invitation',
          headline: 'Join your Sangam',
          description: 'Create your account to accept the invitation and begin your Shoonaya journey.',
          googleLabel: 'Join with Google',
          dividerLabel: 'or join with email',
        }
      : {
          iconLabel: 'New beginning',
          headline: 'Begin your Shoonaya journey',
          description: 'Create your account, choose your tradition, and set up your daily practice.',
          googleLabel: 'Create account with Google',
          dividerLabel: 'or create with email',
        };

  async function handleGoogleSignup() {
    if (!supabase) {
      toast.error('Auth is still initializing. Please try again.');
      return;
    }

    if (!acceptedPolicies) {
      toast.error('Please accept the Terms and Privacy Policy to continue.');
      return;
    }

    setGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: getAuthCallbackUrl(onboardingNext),
      },
    });

    if (error) {
      setGoogleLoading(false);
      toast.error(error.message);
    }
  }

  async function handleEmailSignup(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase) {
      toast.error('Auth is still initializing. Please try again.');
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      toast.error('Enter your email address.');
      return;
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters.');
      return;
    }

    if (!acceptedPolicies) {
      toast.error('Please accept the Terms and Privacy Policy to continue.');
      return;
    }

    setLoading(true);

    try {
      const profilePayload = {
        full_name: nameFromEmail(normalizedEmail),
        username: usernameFromEmail(normalizedEmail),
        phone: null,
        app_language: 'en',
        onboarding_completed: false,
      };

      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(onboardingNext)}`,
          data: {
            ...profilePayload,
            referred_by_code: inviteCode || null,
            referral_source: utmSource || null,
          },
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

        toast.success('Welcome to Shoonaya.');
        const destination = await getClientPostAuthDestination(onboardingNext);
        router.push(destination);
        router.refresh();
      } else {
        toast.success('Please check your inbox to confirm your email.');
        router.push(`/login?message=check_email&email=${encodeURIComponent(normalizedEmail)}`);
      }
    } catch (error: unknown) {
      toast.error(errorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[var(--divine-bg)] px-4 py-8 text-[var(--text-cream)] sm:px-6">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,color-mix(in_srgb,var(--brand-primary)_26%,transparent),transparent_38%),linear-gradient(180deg,color-mix(in_srgb,var(--surface-soft)_76%,transparent),var(--divine-bg))]" />

      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md flex-col justify-center">
        <div className="mb-7 text-center">
          <Link href="/" className="inline-flex items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] focus:ring-offset-2 focus:ring-offset-[var(--divine-bg)]">
            <BrandMark />
          </Link>
          <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.34em] text-[var(--brand-muted)]">
            Welcome to
          </p>
          <h1 className="mt-2 font-display text-4xl font-bold tracking-normal text-[var(--text-cream)]">
            Shoonaya
          </h1>
        </div>

        <section className="rounded-[2rem] border border-[var(--premium-border)] bg-[color-mix(in_srgb,var(--surface-soft)_84%,transparent)] p-6 shadow-[0_24px_80px_color-mix(in_srgb,var(--brand-primary)_18%,transparent)] backdrop-blur-xl sm:p-7">
          <div className="mb-7 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--premium-border)] bg-[var(--premium-gold-soft)] text-[var(--brand-primary)]">
              <Sparkles size={22} aria-hidden="true" />
              <span className="sr-only">{signupContext.iconLabel}</span>
            </div>
            <h2 className="font-display text-3xl font-bold tracking-normal text-[var(--text-cream)]">
              {signupContext.headline}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--brand-muted)]">
              {signupContext.description}
            </p>
          </div>

          <label className="mb-4 flex items-start gap-3 rounded-2xl border border-[var(--premium-border)] bg-[var(--card-bg)] p-4 text-xs leading-5 text-[var(--brand-muted)]">
            <input
              type="checkbox"
              checked={acceptedPolicies}
              onChange={(event) => setAcceptedPolicies(event.target.checked)}
              className="mt-1 h-4 w-4 shrink-0 accent-[var(--brand-primary)]"
            />
            <span>
              I agree to the{' '}
              <Link href="/terms" className="font-semibold text-[var(--brand-primary)] hover:underline">
                Terms
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="font-semibold text-[var(--brand-primary)] hover:underline">
                Privacy Policy
              </Link>
              . This applies whether you continue with Google or email.
            </span>
          </label>

          <button
            type="button"
            onClick={handleGoogleSignup}
            disabled={googleLoading}
            className="flex min-h-14 w-full items-center justify-center gap-3 rounded-full border border-[var(--premium-border)] bg-[var(--card-bg)] px-5 text-sm font-bold text-[var(--text-cream)] shadow-[inset_0_1px_0_color-mix(in_srgb,var(--text-cream)_14%,transparent)] transition hover:border-[var(--brand-primary)] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {googleLoading ? (
              <Loader2 className="animate-spin" size={18} aria-hidden="true" />
            ) : (
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--text-cream)] text-sm font-black text-[var(--divine-bg)]">
                G
              </span>
            )}
            {signupContext.googleLabel}
          </button>

          <div className="my-6 flex items-center gap-4">
            <div className="h-px flex-1 bg-[var(--premium-border)]" />
            <span className="text-xs text-[var(--brand-muted)]">{signupContext.dividerLabel}</span>
            <div className="h-px flex-1 bg-[var(--premium-border)]" />
          </div>

          <form onSubmit={handleEmailSignup} className="space-y-4">
            <label className="block">
              <span className="sr-only">Email address</span>
              <span className="relative block">
                <Mail className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--brand-muted)]" size={18} aria-hidden="true" />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                  className="min-h-14 w-full rounded-full border border-[var(--premium-border)] bg-[var(--card-bg)] px-12 text-base text-[var(--text-cream)] outline-none transition placeholder:text-[var(--text-dim)] focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--premium-gold-soft)]"
                />
              </span>
            </label>

            <label className="block">
              <span className="sr-only">Password</span>
              <span className="relative block">
                <Lock className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--brand-muted)]" size={18} aria-hidden="true" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                  className="min-h-14 w-full rounded-full border border-[var(--premium-border)] bg-[var(--card-bg)] px-12 pr-14 text-base text-[var(--text-cream)] outline-none transition placeholder:text-[var(--text-dim)] focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--premium-gold-soft)]"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((current) => !current)}
                  className="absolute right-4 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-[var(--brand-muted)] transition hover:bg-[var(--surface-soft)] hover:text-[var(--text-cream)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]"
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                >
                  {showPass ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                </button>
              </span>
            </label>

            <div className="flex justify-end">
              <Link href="/forgot-password" className="text-sm font-medium text-[var(--brand-muted)] hover:text-[var(--brand-primary)] hover:underline">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,var(--brand-primary),var(--brand-primary-strong))] px-5 text-base font-bold text-[var(--divine-bg)] shadow-[0_16px_38px_color-mix(in_srgb,var(--brand-primary)_28%,transparent),inset_0_1px_0_color-mix(in_srgb,var(--text-cream)_28%,transparent)] transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? <Loader2 className="animate-spin" size={19} aria-hidden="true" /> : null}
              Create account
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[var(--brand-muted)]">
            Already have an account?{' '}
            <Link href="/login" className="font-bold text-[var(--brand-primary)] hover:underline">
              Sign in
            </Link>
          </p>
        </section>

        <Link href="/" className="mx-auto mt-6 inline-flex rounded-full px-4 py-2 text-sm font-medium text-[var(--brand-muted)] transition hover:text-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]">
          Back to Shoonaya
        </Link>
      </div>
    </main>
  );
}
