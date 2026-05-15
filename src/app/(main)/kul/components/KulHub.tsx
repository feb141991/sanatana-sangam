'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Pencil, Sparkles } from 'lucide-react';
import { KulSummary, MemberRow, TaskRow, MessageRow, FamilyMember, KulEvent } from '../types';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { daysUntilNextOccurrence } from '../utils';
import { KulSectionTiles } from './KulSectionTiles';

export function KulHub({
  kul,
  members,
  tasks,
  messages,
  familyMembers,
  kulEvents,
  myRole,
  editingName,
  newKulName,
  setNewKulName,
  setEditingName,
  saveKulName,
  onUpdateKul,
}: {
  kul: KulSummary;
  members: MemberRow[];
  tasks: TaskRow[];
  messages: MessageRow[];
  familyMembers: FamilyMember[];
  kulEvents: KulEvent[];
  myRole: 'guardian' | 'sadhak';
  editingName: boolean;
  newKulName: string;
  setNewKulName: (value: string) => void;
  setEditingName: (value: boolean) => void;
  saveKulName: () => void;
  onUpdateKul: (updates: { name?: string; cover_url?: string | null }) => void;
}) {
  const { t } = useLanguage();
  const completedTasks = tasks.filter((task) => task.completed).length;
  const openTasks = tasks.length - completedTasks;
  const totalStreak = members.reduce((sum, member) => sum + (member.profiles?.shloka_streak ?? 0), 0);
  const upcomingEvents = kulEvents
    .map((event) => ({ ...event, daysUntil: daysUntilNextOccurrence(event.event_date) }))
    .filter((event) => event.daysUntil <= 90)
    .sort((a, b) => a.daysUntil - b.daysUntil);

  return (
    <div className="space-y-8">
      <style>{`
        @keyframes aura-pulse {
          0% { transform: translate(-50%, -50%) scale(1); opacity: 0.15; }
          50% { transform: translate(-50%, -50%) scale(1.15); opacity: 0.25; }
          100% { transform: translate(-50%, -50%) scale(1); opacity: 0.15; }
        }
        .kul-sacred-aura {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 320px;
          height: 320px;
          background: radial-gradient(circle, var(--brand-primary) 0%, transparent 70%);
          filter: blur(50px);
          animation: aura-pulse 8s ease-in-out infinite;
          pointer-events: none;
          z-index: 0;
        }
        .kul-seal-ring {
          position: relative;
          z-index: 1;
          background: linear-gradient(135deg, #f0c040, #d4a645, #a07830);
          padding: 4px;
          border-radius: 999px;
          box-shadow: 0 15px 40px rgba(160, 120, 48, 0.4);
        }
        .kul-seal-inner {
          background: var(--surface-soft);
          border-radius: 999px;
          width: 110px;
          height: 110px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 48px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .premium-serif {
          font-family: var(--font-serif);
          letter-spacing: -0.01em;
        }
        .immersive-hero {
          background: transparent;
          position: relative;
          z-index: 1;
        }
      `}</style>

      {/* ── IMMERSIVE ZENITH HERO ── */}
      <div className="immersive-hero pt-4 pb-12 flex flex-col items-center text-center">
        {/* Banner Background (Immersive) */}
        {kul.cover_url && (
          <div className="absolute inset-x-[-1rem] top-[-2rem] h-[450px] z-[-1] overflow-hidden opacity-30 mask-gradient-b">
             {/* eslint-disable-next-line @next/next/no-img-element */}
             <img src={kul.cover_url} alt="" className="w-full h-full object-cover blur-[2px]" />
             <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/50 to-[color:var(--surface-soft)]" />
          </div>
        )}

        {/* Top Floating Actions */}
        <div className="w-full flex items-center justify-between mb-12">
          <Link href="/home"
            className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] px-5 py-2.5 rounded-full glass-panel border border-white/10 transition hover:bg-white/20 theme-ink shadow-sm">
            <ChevronLeft size={14} strokeWidth={3} />
            {t('back')}
          </Link>
          <div className="flex items-center gap-3">
             <button 
               onClick={() => {
                 navigator.clipboard.writeText(kul.invite_code);
                 import('react-hot-toast').then(m => m.default.success('Invite code copied!'));
               }}
               className="flex items-center gap-3 px-4 py-2 rounded-full glass-panel border border-[var(--brand-primary)]/20 bg-[var(--brand-primary)]/5 hover:bg-[var(--brand-primary)]/10 transition-all shadow-sm"
             >
                <span className="text-[9px] font-bold text-[var(--brand-primary)] uppercase tracking-[0.2em] opacity-70">{t('kulInviteLabel')}</span>
                <span className="text-sm font-bold text-[var(--brand-primary)] tracking-[0.1em]">{kul.invite_code}</span>
             </button>
             {myRole === 'guardian' && (
               <button 
                 onClick={() => {
                   const newName = prompt('Rename Kul:', kul.name);
                   if (newName && newName !== kul.name) {
                      setNewKulName(newName);
                      saveKulName();
                   }
                   const url = prompt('New Banner Image URL (Optional):', kul.cover_url || '');
                   if (url !== null && url !== kul.cover_url) onUpdateKul({ cover_url: url || null });
                 }}
                 className="flex items-center justify-center w-10 h-10 rounded-full glass-panel border border-white/10 hover:bg-white/20 transition shadow-sm text-[var(--brand-primary)]"
               >
                 <Pencil size={18} />
               </button>
             )}
          </div>
        </div>

        {/* Central Identity Section */}
        <div className="relative mb-8 group">
          <div className="kul-sacred-aura" />
          <motion.div 
            className="kul-seal-ring"
            whileHover={{ scale: 1.05, rotate: 5 }}
            transition={{ type: 'spring', damping: 15 }}
          >
            <div className="kul-seal-inner">
              {kul.avatar_emoji}
            </div>
          </motion.div>
        </div>

        <div className="space-y-2 mb-10">
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl sm:text-5xl font-bold theme-ink premium-serif tracking-tight"
          >
            {kul.name}
          </motion.h1>
          <div className="flex items-center justify-center gap-3">
             <div className="h-px w-8 bg-gradient-to-r from-transparent to-[var(--brand-primary)] opacity-30" />
             <p className="text-[11px] uppercase tracking-[0.4em] font-bold text-[var(--brand-primary)] opacity-80">
               {t('kulLineageOf')} {members.find(m => m.profiles?.gotra)?.profiles?.gotra || 'Dharma'}
             </p>
             <div className="h-px w-8 bg-gradient-to-l from-transparent to-[var(--brand-primary)] opacity-30" />
          </div>
        </div>

        {/* Horizontal Performance Metrics */}
        <div className="flex flex-wrap justify-center gap-4 w-full max-w-2xl px-4">
          {[
            { label: t('kulMembersTitle'), value: members.length, emoji: '👨‍👩‍👧‍👦', href: '/kul/members' },
            { label: t('kulTasksTitle'), value: openTasks, emoji: '📋', href: '/kul/tasks' },
            { label: 'Lineage Power', value: totalStreak, emoji: '✨', href: '/kul/sabha' },
            { label: t('kulEventsTitle'), value: upcomingEvents.length, emoji: '📅', href: '/kul/events' },
          ].map((item, idx) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + idx * 0.05 }}
              className="flex-1 min-w-[130px]"
            >
              <Link href={item.href} className="flex flex-col items-center gap-1.5 p-4 rounded-3xl glass-panel border border-white/5 hover:border-[var(--brand-primary)]/20 transition-all hover:bg-white/10 group shadow-sm">
                <span className="text-2xl group-hover:scale-110 transition-transform">{item.emoji}</span>
                <span className="text-xl font-bold theme-ink leading-none">{item.value}</span>
                <span className="text-[9px] uppercase tracking-widest theme-muted font-bold">{item.label}</span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── DASHBOARD GRID ── */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
           <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-[var(--brand-primary)]" />
              <p className="text-[10px] uppercase tracking-[0.2em] font-bold theme-muted">{t('kulOpenSection')}</p>
           </div>
           {upcomingEvents[0] && (
             <Link href="/kul/events" className="text-[10px] font-bold theme-ink bg-white/40 px-3 py-1 rounded-full border border-white/10">
               {t('kulNextDateIn')} {upcomingEvents[0].daysUntil} {t('kulDays')}
             </Link>
           )}
        </div>

        <KulSectionTiles
          currentView="hub"
          members={members}
          tasks={tasks}
          messages={messages}
          familyMembers={familyMembers}
          kulEvents={kulEvents}
        />

        {/* High-Impact Sanskara Tile */}
        <motion.div
          whileHover={{ y: -4, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
          whileTap={{ scale: 0.98 }}
        >
          <Link
            href="/kul/sanskara"
            className="group relative flex items-center gap-6 rounded-[2.5rem] px-8 py-6 transition-all glass-panel border border-white/10 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[var(--brand-primary)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-16 h-16 rounded-[1.8rem] bg-gradient-to-br from-orange-400/20 to-orange-600/20 border border-orange-200/20 flex items-center justify-center text-3xl shadow-inner z-10">🪬</div>
            <div className="flex-1 z-10">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--brand-primary)] opacity-80">{t('lineage')}</p>
              <h3 className="text-xl font-bold theme-ink mt-1 premium-serif">16 {t('sanskara')}</h3>
              <p className="text-xs theme-muted mt-1 opacity-60">Lifecyle Rites & Sacred Transitions</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:translate-x-1 transition-transform z-10">
              <ChevronRight size={20} className="theme-dim" />
            </div>
          </Link>
        </motion.div>
      </div>

      {/* ── SACRED ALTAR FOOTER ── */}
      {members.some(m => m.profiles?.kul_devata) && (
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="relative glass-panel rounded-[2.5rem] p-8 border border-[var(--brand-primary)]/10 text-center overflow-hidden"
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-[var(--brand-primary)] opacity-[0.03] blur-[60px]" />
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-[var(--brand-primary)]/5 border border-[var(--brand-primary)]/10 text-3xl mb-4">🪔</div>
          <p className="text-[11px] uppercase tracking-[0.4em] font-bold text-[var(--brand-primary)] opacity-60 mb-2">{t('kulFamilyAltar')}</p>
          <h3 className="text-2xl font-bold theme-ink premium-serif tracking-tight">
            {members.find(m => m.profiles?.kul_devata)?.profiles?.kul_devata}
          </h3>
          <div className="mt-6 inline-block px-4 py-1.5 rounded-full bg-green-500/5 border border-green-500/10 text-[9px] font-bold text-green-600 uppercase tracking-widest animate-pulse">
            {t('kulProtected')}
          </div>
        </motion.div>
      )}
    </div>
  );
}
