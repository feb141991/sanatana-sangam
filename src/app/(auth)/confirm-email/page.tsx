'use client';

export const dynamic = 'force-dynamic';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import BrandMark from '@/components/BrandMark';

function ConfirmEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const presetEmail = searchParams.get('email')?.trim().toLowerCase() ?? '';

  useEffect(() => {
    if (presetEmail) {
      setEmail((current) => current || presetEmail);
    }
  }, [presetEmail]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      toast.error('Enter your email address first.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: normalizedEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;

      router.push(`/login?message=confirmation_resent&email=${encodeURIComponent(normalizedEmail)}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Could not resend confirmation email.');
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
          <h1 className="font-display text-2xl font-bold text-gray-900 mt-2">Resend confirmation</h1>
          <p className="text-gray-500 text-sm mt-1">Use this if your signup email never arrived or the original link expired.</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-panel-strong rounded-[2rem] shadow-card p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="glass-input w-full px-4 py-3 rounded-xl focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="glass-button-primary w-full py-3 text-white font-semibold rounded-xl hover:opacity-90 transition disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 size={16} className="animate-spin" /> Sending email...</> : 'Resend confirmation email'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already confirmed?{' '}
          <Link href={presetEmail ? `/login?email=${encodeURIComponent(presetEmail)}` : '/login'} className="text-orange-600 font-medium hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function ConfirmEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <BrandMark />
      </div>
    }>
      <ConfirmEmailForm />
    </Suspense>
  );
}
