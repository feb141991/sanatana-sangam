'use client';

import { motion } from 'framer-motion';
import { ShieldAlert, LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function BannedPage() {
  const supabase = createClient();
  const router = useRouter();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/');
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-6">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-20 h-20 rounded-3xl bg-red-500/10 flex items-center justify-center border border-red-500/20"
      >
        <ShieldAlert size={40} className="text-red-500" />
      </motion.div>

      <div className="space-y-2">
        <h1 className="text-2xl font-display font-bold text-white">Access Suspended</h1>
        <p className="text-sm text-gray-400 max-w-sm mx-auto">
          Your account has been suspended for violating our community guidelines.
          If you believe this is a mistake, please reach out to our support team.
        </p>
      </div>

      <button
        onClick={handleSignOut}
        className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-white font-medium hover:bg-white/10 transition"
      >
        <LogOut size={18} />
        Sign Out
      </button>

      <p className="text-[10px] text-gray-500 uppercase tracking-widest pt-8">
        Shoonaya Safety
      </p>
    </div>
  );
}
