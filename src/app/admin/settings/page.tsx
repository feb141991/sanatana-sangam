'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings, Save, Shield, Bell, 
  Globe, Database, ArrowLeft, Lock,
  RefreshCw, Cloud
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function GlobalSettings() {
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success('System settings updated');
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[var(--divine-bg)] pb-24 font-outfit">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[var(--divine-bg)]/80 backdrop-blur-xl border-b border-[rgba(200,146,74,0.15)] px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="p-2 rounded-xl hover:bg-black/5 text-[var(--brand-muted)] transition-all">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-xl font-bold font-serif theme-ink">Global Settings</h1>
              <p className="text-[10px] text-[var(--brand-muted)] uppercase tracking-[0.2em] font-bold">Platform Configuration</p>
            </div>
          </div>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="bg-[var(--premium-gold)] text-white px-6 py-2 rounded-full text-xs font-bold flex items-center gap-2 shadow-lg shadow-[var(--premium-gold)]/20 disabled:opacity-50"
          >
            {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
            Save Changes
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">
        
        {/* Security Section */}
        <section className="space-y-4">
          <h2 className="flex items-center gap-2 text-sm font-bold theme-ink px-2 uppercase tracking-widest">
            <Shield size={16} className="text-blue-500" /> Security & Access
          </h2>
          <div className="glass-panel rounded-3xl border border-black/5 p-6 space-y-6 bg-white/40">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold theme-ink">Maintenance Mode</p>
                <p className="text-[10px] text-[var(--brand-muted)]">Disable all public access except for administrators.</p>
              </div>
              <div className="w-12 h-6 rounded-full bg-slate-200 relative cursor-pointer">
                <div className="absolute left-1 top-1 w-4 h-4 rounded-full bg-white shadow-sm" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold theme-ink">Two-Factor Enforcement</p>
                <p className="text-[10px] text-[var(--brand-muted)]">Require 2FA for all administrative accounts.</p>
              </div>
              <div className="w-12 h-6 rounded-full bg-green-500 relative cursor-pointer">
                <div className="absolute right-1 top-1 w-4 h-4 rounded-full bg-white shadow-sm" />
              </div>
            </div>
          </div>
        </section>

        {/* Integration Section */}
        <section className="space-y-4">
          <h2 className="flex items-center gap-2 text-sm font-bold theme-ink px-2 uppercase tracking-widest">
            <Cloud size={16} className="text-purple-500" /> Third-Party Hooks
          </h2>
          <div className="glass-panel rounded-3xl border border-black/5 p-6 space-y-6 bg-white/40">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-[var(--brand-muted)] uppercase tracking-widest">OneSignal App ID</label>
              <div className="relative">
                <input type="password" value="********-****-****-****-************" readOnly className="w-full bg-black/5 border border-black/5 rounded-2xl px-5 py-3 text-xs outline-none" />
                <Lock size={14} className="absolute right-5 top-1/2 -translate-y-1/2 text-[var(--brand-muted)]" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-[var(--brand-muted)] uppercase tracking-widest">WhatsApp API Endpoint</label>
              <input type="text" placeholder="https://api.whatsapp.com/..." className="w-full bg-white border border-black/5 rounded-2xl px-5 py-3 text-xs outline-none" />
            </div>
          </div>
        </section>

        {/* Infrastructure Section */}
        <section className="space-y-4">
          <h2 className="flex items-center gap-2 text-sm font-bold theme-ink px-2 uppercase tracking-widest">
            <Database size={16} className="text-amber-500" /> Database & Storage
          </h2>
          <div className="glass-panel rounded-3xl border border-black/5 p-6 bg-white/40">
            <div className="flex items-center justify-between p-4 bg-amber-500/5 rounded-2xl border border-amber-500/10">
              <div className="flex items-center gap-3">
                <RefreshCw size={20} className="text-amber-500" />
                <div>
                  <p className="text-sm font-bold text-amber-900">Clear Cache</p>
                  <p className="text-[10px] text-amber-700/60">Flush all Redis and Edge caches immediately.</p>
                </div>
              </div>
              <button className="px-4 py-2 rounded-xl bg-amber-500 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-amber-600 transition-colors">
                Run Flush
              </button>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
