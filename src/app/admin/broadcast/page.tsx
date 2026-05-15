'use client';

import { useState } from 'react';
import { 
  Megaphone, Shield, ArrowLeft, 
  Send, Users, Globe, Smartphone,
  Info, AlertTriangle, CheckCircle2
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

export default function GlobalBroadcast() {
  const [target, setTarget] = useState('all');
  const [type, setType] = useState('announcement');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    // Simulate API call
    setTimeout(() => {
      setSending(false);
      setSent(true);
      setTimeout(() => setSent(false), 5000);
    }, 2000);
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
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500">
                <Megaphone size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold font-serif theme-ink">Global Broadcast</h1>
                <p className="text-[10px] text-[var(--brand-muted)] uppercase tracking-[0.2em] font-bold">Admin Communications</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-600 text-[10px] font-bold uppercase tracking-widest">
            <Shield size={14} /> Authority Mode
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Form Area */}
          <div className="lg:col-span-7 space-y-8">
            <form onSubmit={handleSend} className="glass-panel rounded-[2.5rem] border border-black/5 p-8 bg-white/40 space-y-6">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-[var(--brand-muted)] uppercase tracking-widest px-2">Broadcast Target</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'all', label: 'All Seekers', icon: Users },
                    { id: 'active', label: 'Recently Active', icon: Globe },
                    { id: 'tradition', label: 'Specific Tradition', icon: Info },
                    { id: 'mandali', label: 'Mandali Admins', icon: Shield }
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTarget(t.id)}
                      className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${target === t.id ? 'bg-[var(--premium-gold)] text-white border-[var(--premium-gold)]' : 'bg-white/50 border-black/5 hover:border-black/10'}`}
                    >
                      <t.icon size={18} />
                      <span className="text-xs font-bold">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <label className="text-[10px] font-black text-[var(--brand-muted)] uppercase tracking-widest px-2">Announcement Content</label>
                <div className="space-y-3">
                  <input 
                    type="text" 
                    placeholder="Subject Title (e.g. Festival Update)" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="w-full bg-white/50 border border-black/5 rounded-2xl px-6 py-4 text-sm font-bold placeholder:text-slate-400 outline-none focus:border-[var(--premium-gold)] transition-all"
                  />
                  <textarea 
                    placeholder="Type your message here..." 
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    rows={6}
                    className="w-full bg-white/50 border border-black/5 rounded-3xl px-6 py-4 text-sm font-medium placeholder:text-slate-400 outline-none focus:border-[var(--premium-gold)] transition-all resize-none"
                  />
                </div>
              </div>

              <div className="pt-4">
                <button 
                  disabled={sending}
                  className={`w-full py-5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-black uppercase tracking-[0.2em] shadow-lg shadow-orange-500/20 hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-3 ${sending ? 'opacity-50' : ''}`}
                >
                  {sending ? (
                    <span className="animate-pulse">Broadcasting Signal...</span>
                  ) : (
                    <>
                      <Send size={18} /> Send Global Notification
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Preview & Info Area */}
          <div className="lg:col-span-5 space-y-6">
            <div className="glass-panel rounded-[2.5rem] border border-black/5 p-8 bg-black/5 space-y-6">
              <h3 className="text-sm font-bold theme-ink flex items-center gap-2">
                <Smartphone size={18} /> Seeker Preview
              </h3>
              <div className="bg-white rounded-3xl p-6 shadow-xl border border-black/5 scale-90 origin-top">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center text-white">
                    <Megaphone size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">Sanatan Sangam</p>
                    <p className="text-xs font-bold theme-ink">{title || 'Announcement Title'}</p>
                  </div>
                </div>
                <p className="text-xs text-[var(--brand-muted)] leading-relaxed line-clamp-3">
                  {message || 'Your broadcast message will appear here for all selected seekers across the platform.'}
                </p>
              </div>
            </div>

            <div className="glass-panel rounded-[2.5rem] border border-orange-500/10 p-8 bg-orange-500/5 space-y-4">
              <h3 className="text-[10px] font-black text-orange-600 uppercase tracking-widest flex items-center gap-2">
                <AlertTriangle size={14} /> Authority Warning
              </h3>
              <p className="text-[10px] text-orange-800 leading-relaxed font-medium">
                Sending a global broadcast will trigger push notifications and in-app alerts for thousands of users. Ensure the content is verified and respects spiritual decorum.
              </p>
            </div>

            <AnimatePresence>
              {sent && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="p-6 rounded-[2rem] bg-green-500 text-white flex items-center gap-4 shadow-xl shadow-green-500/20"
                >
                  <CheckCircle2 size={32} />
                  <div>
                    <p className="text-sm font-bold">Broadcast Sent Successfully</p>
                    <p className="text-[10px] opacity-80 uppercase tracking-widest font-bold">Delivered to ~12.4k seekers</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
