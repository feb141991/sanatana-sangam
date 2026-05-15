'use client';

import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Pencil, Sparkles, Camera, Loader2 } from 'lucide-react';
import { KulSummary, MemberRow, TaskRow, MessageRow, FamilyMember, KulEvent } from '../types';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { daysUntilNextOccurrence } from '../utils';
import { KulSectionTiles } from './KulSectionTiles';
import { useRef } from 'react';

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
  onUploadCover,
  isUploading,
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
  onUploadCover: (file: File) => void;
  isUploading: boolean;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useLanguage();
  const completedTasks = tasks.filter((task) => task.completed).length;
  const openTasks = tasks.length - completedTasks;
  const totalStreak = members.reduce((sum, member) => sum + (member.profiles?.shloka_streak ?? 0), 0);
  const upcomingEvents = kulEvents
    .map((event) => ({ ...event, daysUntil: daysUntilNextOccurrence(event.event_date) }))
    .filter((event) => event.daysUntil <= 90)
    .sort((a, b) => a.daysUntil - b.daysUntil);

  return (
    <div className="space-y-6">
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
          width: 300px;
          height: 300px;
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
          box-shadow: 0 10px 30px rgba(160, 120, 48, 0.35);
        }
        .kul-seal-inner {
          background: var(--surface-soft);
          border-radius: 999px;
          width: 100px;
          height: 100px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 42px;
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
      <div className="immersive-hero pt-2 pb-8 flex flex-col items-center text-center group/hero">
        {/* Hidden File Input */}
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onUploadCover(file);
          }}
        />

        {/* Banner Background (Immersive) */}
        <div className={`absolute inset-x-[-1rem] top-[-1.5rem] h-[380px] z-[-1] overflow-hidden transition-all duration-500 ${editingName ? 'opacity-50 blur-[4px]' : 'opacity-30 blur-[1px]'}`}>
           {kul.cover_url ? (
             // eslint-disable-next-line @next/next/no-img-element
             <img src={kul.cover_url} alt="" className="w-full h-full object-cover" />
           ) : (
             <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300 opacity-20" />
           )}
           <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/40 to-[color:var(--surface-soft)]" />
        </div>

        {/* Top Floating Actions */}
        <div className="w-full flex items-center justify-between mb-8">
          <Link href="/home"
            className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] px-4 py-2 rounded-full glass-panel border border-white/10 transition hover:bg-white/20 theme-ink shadow-sm">
            <ChevronLeft size={14} strokeWidth={3} />
            {t('back')}
          </Link>

          <div className="flex items-center gap-2">
             {!editingName ? (
               <div className="flex items-center gap-2">
                 <button 
                   onClick={() => {
                     navigator.clipboard.writeText(kul.invite_code);
                     import('react-hot-toast').then(m => m.default.success('Invite code copied!'));
                   }}
                   className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full glass-panel border border-[var(--brand-primary)]/20 bg-[var(--brand-primary)]/5 hover:bg-[var(--brand-primary)]/10 transition-all shadow-sm"
                 >
                    <span className="text-[9px] font-bold text-[var(--brand-primary)] uppercase tracking-[0.2em] opacity-70">{t('kulInviteLabel')}</span>
                    <span className="text-sm font-bold text-[var(--brand-primary)] tracking-[0.1em]">{kul.invite_code}</span>
                 </button>
                 {myRole === 'guardian' && (
                   <div className="flex flex-col gap-2">
                     <button 
                       disabled={isUploading}
                       onClick={() => fileInputRef.current?.click()}
                       className="flex items-center justify-center w-9 h-9 rounded-full glass-panel border border-white/10 hover:bg-white/20 transition shadow-sm text-[var(--brand-primary)]"
                       title="Change Banner"
                     >
                       {isUploading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={16} />}
                     </button>
                   </div>
                 )}
               </div>
             ) : (
               <button 
                 onClick={() => {
                   saveKulName();
                   setEditingName(false);
                 }}
                 className="flex items-center gap-2 px-5 py-2 rounded-full bg-[var(--brand-primary)] text-white text-[10px] font-bold uppercase tracking-[0.2em] shadow-lg shadow-[var(--brand-primary)]/20 active:scale-95 transition-transform"
               >
                 {t('done')}
               </button>
             )}
          </div>
        </div>

        {/* Central Identity Section */}
        <div className="relative mb-5 group">
          <div className="kul-sacred-aura" />
          <motion.div 
            className="kul-seal-ring"
            whileHover={{ scale: 1.05, rotate: 3 }}
            transition={{ type: 'spring', damping: 15 }}
          >
            <div className="kul-seal-inner">
              {kul.avatar_emoji}
            </div>
          </motion.div>
        </div>

        <div className="space-y-1 mb-6 w-full max-w-sm">
          <div className="flex items-center justify-center gap-3">
            {editingName ? (
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center gap-2 w-full"
              >
                <input
                  autoFocus
                  value={newKulName}
                  onChange={(e) => setNewKulName(e.target.value)}
                  onKeyDown={(e) => { 
                    if (e.key === 'Enter') {
                      saveKulName();
                      setEditingName(false);
                    }
                    if (e.key === 'Escape') setEditingName(false); 
                  }}
                  className="text-3xl font-bold bg-transparent outline-none border-b-2 border-[var(--brand-primary)] text-center w-full premium-serif theme-ink placeholder:opacity-30 drop-shadow-sm"
                  placeholder={t('kulNamePlaceholder')}
                />
                <p className="text-[9px] theme-muted uppercase tracking-widest font-bold opacity-60">
                  {t('save')} — Press Enter
                </p>
              </motion.div>
            ) : (
              <div className="flex items-center gap-3 group/title">
                <motion.h1 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-3xl sm:text-4xl font-bold theme-ink premium-serif tracking-tight"
                >
                  {kul.name}
                </motion.h1>
                {myRole === 'guardian' && (
                  <button 
                    onClick={() => {
                       setNewKulName(kul.name);
                       setEditingName(true);
                    }}
                    className="p-2 rounded-full glass-panel border border-white/10 hover:bg-white/20 transition-all opacity-0 group-hover/title:opacity-100 text-[var(--brand-primary)]"
                    title="Edit Name"
                  >
                    <Pencil size={18} />
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center justify-center gap-2.5">
             <div className="h-px w-6 bg-gradient-to-r from-transparent to-[var(--brand-primary)] opacity-20" />
             <p className="text-[10px] uppercase tracking-[0.4em] font-bold text-[var(--brand-primary)] opacity-70">
               {t('kulLineageOf')} {members.find(m => m.profiles?.gotra)?.profiles?.gotra || 'Dharma'}
             </p>
             <div className="h-px w-6 bg-gradient-to-l from-transparent to-[var(--brand-primary)] opacity-20" />
          </div>
        </div>

        {/* Horizontal Performance Metrics */}
        <div className="flex flex-wrap justify-center gap-3 w-full max-w-2xl px-4 mt-4">
          {[
            { label: t('kulMembersTitle'), value: members.length, emoji: '👨‍👩‍👧‍👦', href: '/kul/members' },
            { label: t('kulTasksTitle'), value: openTasks, emoji: '📋', href: '/kul/tasks' },
            { label: 'Power', value: totalStreak, emoji: '✨', href: '/kul/sabha' },
            { label: t('kulEventsTitle'), value: upcomingEvents.length, emoji: '📅', href: '/kul/events' },
          ].map((item, idx) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + idx * 0.05 }}
              className="flex-1 min-w-[110px]"
            >
              <Link href={item.href} className="flex flex-col items-center gap-1 p-3 rounded-[1.8rem] glass-panel border border-white/5 hover:border-[var(--brand-primary)]/20 transition-all hover:bg-white/10 group shadow-sm">
                <span className="text-xl group-hover:scale-110 transition-transform">{item.emoji}</span>
                <span className="text-lg font-bold theme-ink leading-none">{item.value}</span>
                <span className="text-[8px] uppercase tracking-widest theme-muted font-bold">{item.label}</span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── DASHBOARD GRID ── */}
      <div className="space-y-5">
        <div className="flex items-center justify-between px-2">
           <div className="flex items-center gap-2">
              <Sparkles size={12} className="text-[var(--brand-primary)]" />
              <p className="text-[9px] uppercase tracking-[0.2em] font-bold theme-muted">{t('kulOpenSection')}</p>
           </div>
           {upcomingEvents[0] && (
             <Link href="/kul/events" className="text-[9px] font-bold theme-ink bg-white/40 px-2.5 py-1 rounded-full border border-white/10">
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
