'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Search } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import toast from 'react-hot-toast';

export function KulInviteSheet({ inviteCode, onClose }: { inviteCode: string; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [invited, setInvited] = useState<Set<string>>(new Set());

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url, tradition')
        .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
        .limit(10);
      setResults(data || []);
    } catch (e) {
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const sendInvite = async (targetId: string, name: string) => {
    try {
      const supabase = createClient();
      await supabase.from('kul_invites').insert({
        target_user_id: targetId,
        invite_code: inviteCode,
      });
      setInvited(prev => new Set([...Array.from(prev), targetId]));
      toast.success(`Invited ${name}!`);
    } catch (e) {
      toast.error('Could not send invite');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <motion.div 
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="w-full max-w-md bg-[var(--surface-soft)] rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl border border-white/10" 
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-white/8 flex items-center justify-between">
          <div>
            <h2 className="font-bold theme-ink">Invite Family</h2>
            <p className="text-[10px] theme-muted uppercase tracking-widest mt-0.5">Expand the circle</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center">
            <X size={16} className="theme-muted" />
          </button>
        </div>

        <div className="p-5 flex gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 theme-muted" />
            <input
              autoFocus
              type="text" placeholder="Search name or @username…"
              value={query} onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && search()}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-sm theme-ink outline-none focus:border-[var(--brand-primary)]/40"
            />
          </div>
          <button
            onClick={search} disabled={loading || !query.trim()}
            className="px-4 py-2 rounded-xl text-xs font-bold disabled:opacity-40 transition"
            style={{ background: 'var(--brand-primary)', color: '#1c1c1a' }}
          >
            {loading ? '…' : 'Find'}
          </button>
        </div>

        <div className="max-h-[300px] overflow-y-auto px-5 pb-5 space-y-1">
          {results.map(r => (
            <div key={r.id} className="flex items-center gap-3 py-3 border-b border-black/[0.03] last:border-0">
              <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                {r.avatar_url ? (
                   // eslint-disable-next-line @next/next/no-img-element
                   <img src={r.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                   <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-400">
                     {(r.full_name || r.username || '?')[0].toUpperCase()}
                   </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold theme-ink truncate">{r.full_name || r.username}</p>
                <p className="text-[10px] theme-muted truncate">@{r.username}</p>
              </div>
              <button
                onClick={() => sendInvite(r.id, r.full_name || r.username || 'them')}
                disabled={invited.has(r.id)}
                className="px-4 py-1.5 rounded-xl text-[10px] font-bold transition disabled:opacity-50"
                style={{ 
                  background: invited.has(r.id) ? 'rgba(34,197,94,0.1)' : 'rgba(200,146,74,0.1)', 
                  color: invited.has(r.id) ? '#16a34a' : 'var(--brand-primary-strong)',
                  border: `1px solid ${invited.has(r.id) ? 'rgba(34,197,94,0.2)' : 'rgba(200,146,74,0.2)'}`
                }}
              >
                {invited.has(r.id) ? '✓ Invited' : 'Invite'}
              </button>
            </div>
          ))}
        </div>

        <div className="px-6 py-4 bg-black/5 border-t border-white/8 flex items-center justify-between">
          <p className="text-[10px] theme-muted font-bold uppercase tracking-widest">Code: {inviteCode}</p>
          <button
            onClick={() => { navigator.clipboard.writeText(inviteCode); toast.success('Code copied!'); }}
            className="text-[10px] font-bold text-[var(--brand-primary)] hover:underline"
          >
            Copy Code
          </button>
        </div>
      </motion.div>
    </div>
  );
}
