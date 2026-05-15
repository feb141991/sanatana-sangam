'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, UserPlus, ChevronLeft, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

const KUL_EMOJIS = ['🏡', '🕉️', '🙏', '🔱', '🪔', '🌸', '☀️', '🌺', '🫶', '✨'];

export function NoKulPrompt({
  userId,
  userName,
  onCreate,
  onJoin,
}: {
  userId: string;
  userName: string;
  onCreate: (name: string, emoji: string) => Promise<void>;
  onJoin: (code: string) => Promise<void>;
}) {
  const [mode, setMode] = useState<'pick' | 'create' | 'join'>('pick');
  const [kulName, setKulName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('🏡');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!kulName.trim()) return toast.error('Please enter a name');
    setLoading(true);
    try {
      await onCreate(kulName, selectedEmoji);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!inviteCode.trim()) return toast.error('Enter invite code');
    setLoading(true);
    try {
      await onJoin(inviteCode);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
      <AnimatePresence mode="wait">
        {mode === 'pick' ? (
          <motion.div
            key="pick"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="max-w-md w-full space-y-8"
          >
            <div className="w-24 h-24 bg-[var(--brand-primary)]/10 rounded-[2.5rem] flex items-center justify-center text-5xl mx-auto shadow-inner border border-[var(--brand-primary)]/10">
              🌳
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold theme-ink premium-serif">Begin your Lineage</h1>
              <p className="text-sm theme-muted leading-relaxed">
                A Kul is a sacred family circle where you preserve your traditions, track your vansh (tree), and practice together.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 pt-4">
              <button
                onClick={() => setMode('create')}
                className="group flex items-center gap-4 p-5 rounded-[2rem] clay-card hover:border-[var(--brand-primary)]/30 transition-all text-left"
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-primary-strong)] text-white flex items-center justify-center text-xl shadow-lg">
                  <Plus size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold theme-ink">Create a new Kul</h3>
                  <p className="text-[11px] theme-muted mt-0.5">Start your own family circle and invite others.</p>
                </div>
                <ArrowRight size={18} className="theme-dim opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
              </button>

              <button
                onClick={() => setMode('join')}
                className="group flex items-center gap-4 p-5 rounded-[2rem] glass-panel border border-white/5 hover:border-white/10 transition-all text-left"
              >
                <div className="w-12 h-12 rounded-2xl bg-white/10 text-[var(--brand-primary)] flex items-center justify-center text-xl border border-white/10">
                  <UserPlus size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold theme-ink">Join an existing Kul</h3>
                  <p className="text-[11px] theme-muted mt-0.5">Ask a family guardian for their invite code.</p>
                </div>
                <ArrowRight size={18} className="theme-dim opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
              </button>
            </div>
          </motion.div>
        ) : mode === 'create' ? (
          <motion.div
            key="create"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="max-w-md w-full clay-card rounded-[3rem] p-8 space-y-8"
          >
             <button onClick={() => setMode('pick')} className="absolute top-8 left-8 p-2 theme-muted hover:theme-ink transition-colors">
                <ChevronLeft size={20} />
             </button>

             <div className="space-y-6 pt-4">
                <div className="flex flex-wrap justify-center gap-3">
                  {KUL_EMOJIS.map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => setSelectedEmoji(emoji)}
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl transition-all ${selectedEmoji === emoji ? 'clay-card border-[var(--brand-primary)]' : 'hover:bg-black/5'}`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>

                <div className="space-y-4">
                  <div className="text-left space-y-1.5">
                    <label className="text-[10px] uppercase tracking-widest font-bold theme-muted ml-1">Family Name</label>
                    <input
                      autoFocus
                      placeholder="e.g. Sharma Parivar"
                      value={kulName}
                      onChange={e => setKulName(e.target.value)}
                      className="w-full px-5 py-4 rounded-[1.8rem] bg-white/5 border border-white/10 focus:border-[var(--brand-primary)]/40 outline-none text-lg theme-ink"
                    />
                  </div>
                </div>

                <button
                  disabled={loading || !kulName.trim()}
                  onClick={handleCreate}
                  className="w-full py-5 rounded-[2rem] text-white font-bold shadow-xl transition-all disabled:opacity-40"
                  style={{ background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-primary-strong))' }}
                >
                  {loading ? 'Creating…' : 'Establish Lineage 🙏'}
                </button>
             </div>
          </motion.div>
        ) : (
          <motion.div
            key="join"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="max-w-md w-full clay-card rounded-[3rem] p-8 space-y-8"
          >
             <button onClick={() => setMode('pick')} className="absolute top-8 left-8 p-2 theme-muted hover:theme-ink transition-colors">
                <ChevronLeft size={20} />
             </button>

             <div className="space-y-6 pt-4">
                <div className="w-20 h-20 bg-[var(--brand-primary)]/10 rounded-[2rem] flex items-center justify-center text-4xl mx-auto border border-[var(--brand-primary)]/10">
                  🗝️
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold theme-ink premium-serif">Enter Invite Code</h2>
                  <p className="text-sm theme-muted">Lineages are private circles of trust.</p>
                </div>

                <input
                  autoFocus
                  placeholder="CODE123"
                  value={inviteCode}
                  onChange={e => setInviteCode(e.target.value.toUpperCase())}
                  className="w-full px-5 py-5 rounded-[1.8rem] bg-white/5 border border-white/10 focus:border-[var(--brand-primary)]/40 outline-none text-3xl font-bold text-center tracking-[0.2em] theme-ink uppercase"
                />

                <button
                  disabled={loading || !inviteCode.trim()}
                  onClick={handleJoin}
                  className="w-full py-5 rounded-[2rem] text-white font-bold shadow-xl transition-all disabled:opacity-40"
                  style={{ background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-primary-strong))' }}
                >
                  {loading ? 'Joining…' : 'Enter the Kul 🙏'}
                </button>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
