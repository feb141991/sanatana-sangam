'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';
import { createClient } from '@/lib/supabase';

function LoginForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const supabase     = createClient();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);

  useEffect(() => {
    const msg = searchParams.get('message');
    const err = searchParams.get('error');
    if (msg === 'check_email') {
      toast('Check your email and click the confirmation link 📧', { icon: '🙏' });
    }
    if (err === 'email_verification_failed') {
      toast.error('Email verification failed — please try signing up again.');
    }
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
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
    <div className="min-h-screen bg-gradient-to-br from-[#fff8f0] via-white to-[#fdf6e3] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        <div className="text-center mb-8">
          <Link href="/" className="text-3xl om-pulse inline-block">🕉️</Link>
          <h1 className="font-display text-2xl font-bold text-gray-900 mt-2">Welcome back</h1>
          <p className="text-gray-500 text-sm mt-1">Sign in to your Sangam</p>
        </div>

        <form onSubmit={handleLogin} className="bg-white rounded-2xl shadow-card border border-orange-50 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
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
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-sacred text-white font-semibold rounded-xl hover:opacity-90 transition disabled:opacity-60"
          >
            {loading ? 'Signing in...' : 'Sign In 🙏'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          New to Sanatana Sangam?{' '}
          <Link href="/signup" className="text-orange-600 font-medium hover:underline">
            Join free
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

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-[#fff8f0] via-white to-[#fdf6e3] flex items-center justify-center">
        <span className="text-3xl om-pulse">🕉️</span>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
