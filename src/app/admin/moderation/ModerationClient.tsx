'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldAlert, ShieldCheck, Trash2, 
  UserMinus, MessageCircle, MoreHorizontal,
  ChevronRight, AlertCircle, CheckCircle,
  XCircle, Filter
} from 'lucide-react';
import { getInitials } from '@/lib/utils';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase';

interface Report {
  id: string;
  reported_by: string;
  content_author_id: string;
  content_type: string;
  content_id: string;
  reason: string;
  status: string;
  created_at: string;
  reporter: {
    username: string;
    full_name: string | null;
    avatar_url: string | null;
  };
  author: {
    username: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

export default function ModerationClient({ initialReports }: { initialReports: Report[] }) {
  const [reports, setReports] = useState<Report[]>(initialReports);
  const [filter, setFilter] = useState<'all' | 'pending' | 'resolved'>('all');
  const supabase = createClient();

  const handleAction = async (report: Report, action: 'resolve' | 'dismiss' | 'delete' | 'ban') => {
    try {
      if (action === 'delete') {
        let table = '';
        switch (report.content_type) {
          case 'thread': table = 'forum_threads'; break;
          case 'reply':  table = 'forum_replies'; break;
          case 'mandali_post': table = 'posts'; break;
        }

        if (table) {
          const { error: delError } = await supabase
            .from(table)
            .delete()
            .eq('id', report.content_id);
          
          if (delError) throw delError;
          toast.success('Content permanently removed');
        }
      }

      if (action === 'ban') {
        const { error: banError } = await supabase
          .from('profiles')
          .update({ is_banned: true })
          .eq('id', report.content_author_id);
        
        if (banError) throw banError;
        toast.success('User has been banned from Shoonaya');
      }

      const { error } = await supabase
        .from('content_reports')
        .update({ status: action === 'dismiss' ? 'dismissed' : 'resolved' })
        .eq('id', report.id);

      if (error) throw error;

      setReports(prev => prev.filter(r => r.id !== report.id));
      if (action !== 'delete' && action !== 'ban') {
        toast.success(`Report ${action}d successfully`);
      }
    } catch (error: any) {
      toast.error(error.message || 'Action failed');
    }
  };

  const filteredReports = reports.filter(r => 
    filter === 'all' ? true : r.status === filter
  );

  return (
    <div className="min-h-screen bg-[var(--divine-bg)] pb-24">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[var(--divine-bg)]/80 backdrop-blur-xl border-b border-[rgba(200,146,74,0.15)] px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <ShieldAlert size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold font-serif theme-ink">Moderation Hub</h1>
              <p className="text-[10px] text-[var(--text-muted-warm)] uppercase tracking-[0.2em] font-bold">Admin Console</p>
            </div>
          </div>
          <div className="flex bg-[var(--surface-raised)] rounded-full p-1 border border-black/5 dark:border-white/5">
            {['all', 'pending', 'resolved'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
                  filter === f ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'text-[var(--text-muted-warm)]'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {filteredReports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
            <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center text-green-500/40">
              <ShieldCheck size={40} />
            </div>
            <div>
              <h3 className="text-lg font-serif theme-ink">All Clear</h3>
              <p className="text-sm text-[var(--text-muted-warm)]">No pending reports for review.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReports.map((report, idx) => (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="group relative overflow-hidden bg-[var(--surface-soft)] border border-black/5 dark:border-white/5 rounded-3xl p-6 hover:border-amber-500/30 transition-all"
              >
                <div className="flex flex-wrap items-start justify-between gap-6">
                  {/* Reporter & Author Info */}
                  <div className="flex items-center gap-6">
                    <div className="flex flex-col items-center gap-1">
                      <p className="text-[9px] font-bold text-[#C5A059] uppercase tracking-widest">Reporter</p>
                      <div className="relative w-10 h-10 rounded-full overflow-hidden border border-black/5">
                        {report.reporter.avatar_url ? (
                          <Image src={report.reporter.avatar_url} alt="Reporter" fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-black/5 text-[10px] font-bold theme-ink">
                            {getInitials(report.reporter.full_name || report.reporter.username)}
                          </div>
                        )}
                      </div>
                      <p className="text-[10px] font-bold theme-ink">@{report.reporter.username}</p>
                    </div>

                    <div className="h-10 w-px bg-black/5 dark:bg-white/5" />

                    <div className="flex flex-col items-center gap-1">
                      <p className="text-[9px] font-bold text-red-500 uppercase tracking-widest">Author</p>
                      <div className="relative w-10 h-10 rounded-full overflow-hidden border border-red-500/20">
                        {report.author.avatar_url ? (
                          <Image src={report.author.avatar_url} alt="Author" fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-red-500/5 text-[10px] font-bold text-red-500">
                            {getInitials(report.author.full_name || report.author.username)}
                          </div>
                        )}
                      </div>
                      <p className="text-[10px] font-bold text-red-500">@{report.author.username}</p>
                    </div>
                  </div>

                  {/* Content & Reason */}
                  <div className="flex-1 min-w-[200px] space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/5 text-[9px] font-bold uppercase tracking-widest theme-ink">
                        {report.content_type}
                      </span>
                      <span className="text-[10px] text-[var(--text-muted-warm)]">
                        {new Date(report.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10">
                      <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-1">Reason: {report.reason}</p>
                      <p className="text-sm text-[var(--text-muted-warm)] italic">&quot;Content ID: {report.content_id.slice(0, 8)}...&quot;</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleAction(report, 'dismiss')}
                      className="p-3 rounded-2xl bg-black/5 dark:bg-white/5 text-[var(--text-muted-warm)] hover:bg-green-500/10 hover:text-green-500 transition-all"
                      title="Dismiss Report"
                    >
                      <CheckCircle size={20} />
                    </button>
                    <button 
                      onClick={() => handleAction(report, 'delete')}
                      className="p-3 rounded-2xl bg-black/5 dark:bg-white/5 text-[var(--text-muted-warm)] hover:bg-red-500/10 hover:text-red-500 transition-all"
                      title="Remove Content"
                    >
                      <Trash2 size={20} />
                    </button>
                    <button 
                      onClick={() => handleAction(report, 'ban')}
                      className="p-3 rounded-2xl bg-black/5 dark:bg-white/5 text-[var(--text-muted-warm)] hover:bg-red-700/10 hover:text-red-700 transition-all"
                      title="Ban Author"
                    >
                      <UserMinus size={20} />
                    </button>
                    <button 
                      onClick={() => handleAction(report, 'resolve')}
                      className="p-3 rounded-2xl bg-amber-500 text-white shadow-lg shadow-amber-500/20 hover:scale-105 transition-all"
                      title="Mark Resolved"
                    >
                      <ShieldCheck size={20} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
