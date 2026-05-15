'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Pencil } from 'lucide-react';
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
          width: 280px;
          height: 280px;
          background: radial-gradient(circle, var(--brand-primary) 0%, transparent 70%);
          filter: blur(40px);
          animation: aura-pulse 6s ease-in-out infinite;
          pointer-events: none;
          z-index: 0;
        }
        .kul-seal-ring {
          position: relative;
          z-index: 1;
          background: linear-gradient(135deg, #f0c040, #d4a645, #a07830);
          padding: 3px;
          border-radius: 999px;
          box-shadow: 0 10px 30px rgba(160, 120, 48, 0.3);
        }
        .kul-seal-inner {
          background: var(--surface-soft);
          border-radius: 999px;
          width: 96px;
          height: 96px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 42px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .floating-pill {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
        }
        .premium-serif {
          font-family: var(--font-serif);
          letter-spacing: -0.01em;
        }
      `}</style>

      {/* ── NEW SACRED HERO ── */}
      <div className="relative clay-card rounded-[2.5rem] p-6 overflow-hidden flex flex-col items-center text-center min-h-[360px]">
        {/* Banner / Cover Image */}
        {kul.cover_url ? (
          <div className="absolute inset-0 z-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={kul.cover_url} 
              alt="" 
              className="w-full h-full object-cover opacity-20" 
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/40 to-white" />
          </div>
        ) : (
          <>
            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--brand-primary)] opacity-[0.03] blur-[60px]" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-[var(--brand-primary-strong)] opacity-[0.03] blur-[80px]" />
          </>
        )}

        {/* Top Actions Row */}
        <div className="w-full flex items-center justify-between z-10 mb-8">
          <Link href="/home"
            className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-4 py-2 rounded-full glass-panel border border-white/5 transition hover:bg-white/10"
            style={{ color: 'var(--brand-primary)' }}>
            <ChevronLeft size={14} strokeWidth={3} />
            {t('back')}
          </Link>
          <div className="flex items-center gap-3">
             {myRole === 'guardian' && (
               <button 
                 onClick={() => {
                   const url = prompt('Enter Image URL for Kul Banner:', kul.cover_url || '');
                   if (url !== null) {
                     onUpdateKul({ cover_url: url || null });
                     import('react-hot-toast').then(m => m.default.success('Banner updated!'));
                   }
                 }}
                 className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full bg-black/5 hover:bg-black/10 transition border border-black/5"
               >
                 {t('kulChangeCover')}
               </button>
             )}
             <button 
               onClick={() => {
                 navigator.clipboard.writeText(kul.invite_code);
                 import('react-hot-toast').then(m => m.default.success('Invite code copied!'));
               }}
               className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--brand-primary)]/20 bg-[var(--brand-primary)]/5 hover:bg-[var(--brand-primary)]/10 transition-colors"
             >
                <span className="text-[10px] font-bold text-[var(--brand-primary)] uppercase tracking-widest opacity-60">{t('kulInviteLabel')}</span>
                <span className="text-xs font-bold text-[var(--brand-primary)] tracking-[0.2em]">{kul.invite_code}</span>
             </button>
          </div>
        </div>

        {/* Central Seal & Aura */}
        <div className="relative mb-6">
          <div className="kul-sacred-aura" />
          <div className="kul-seal-ring">
            <div className="kul-seal-inner">
              {kul.avatar_emoji}
            </div>
          </div>
        </div>

        {/* Kul Name & Identity */}
        <div className="z-10 space-y-1">
          {editingName && myRole === 'guardian' ? (
            <div className="flex flex-col items-center gap-2">
              <input
                autoFocus
                value={newKulName}
                onChange={(e) => setNewKulName(e.target.value)}
                onBlur={saveKulName}
                onKeyDown={(e) => { 
                  if (e.key === 'Enter') saveKulName(); 
                  if (e.key === 'Escape') setEditingName(false); 
                }}
                className="text-3xl font-bold bg-transparent outline-none border-b-2 border-[var(--brand-primary)] text-center w-64 premium-serif theme-ink"
              />
              <p className="text-[10px] theme-muted uppercase tracking-widest font-bold">Press Enter to Save</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1">
              <h1 className="text-3xl sm:text-4xl font-bold theme-ink premium-serif flex items-center gap-2">
                {kul.name}
                {myRole === 'guardian' && (
                  <button onClick={() => { setNewKulName(kul.name); setEditingName(true); }} className="opacity-40 hover:opacity-100 transition p-1">
                    <Pencil size={18} />
                  </button>
                )}
              </h1>
              <p className="text-[10px] uppercase tracking-[0.3em] font-semibold text-[var(--brand-primary)] opacity-70">
                {t('kulLineageOf')} {members.find(m => m.profiles?.gotra)?.profiles?.gotra || 'Dharma'}
              </p>
            </div>
          )}
        </div>

        {/* Floating Metrics Row */}
        <div className="flex flex-wrap justify-center gap-3 mt-10 z-10 w-full max-w-lg">
          {[
            { label: t('kulMembersTitle'), value: members.length, emoji: '👨‍👩‍👧‍👦', href: '/kul/members' },
            { label: t('kulTasksTitle'), value: openTasks, emoji: '📋', href: '/kul/tasks' },
            { label: 'Kul Streak', value: totalStreak, emoji: '🔥', href: '/kul/sabha' },
            { label: t('kulEventsTitle'), value: upcomingEvents.length, emoji: '📅', href: '/kul/events' },
          ].map((item) => (
            <motion.div
              key={item.label}
              whileHover={{ y: -3, scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link href={item.href} className="floating-pill px-4 py-3 rounded-2xl flex items-center gap-3 min-w-[110px] transition-all h-full">
                <div className="text-xl">{item.emoji}</div>
                <div className="text-left">
                  <p className="text-lg font-bold leading-none theme-ink">{item.value}</p>
                  <p className="text-[9px] uppercase tracking-wider theme-muted mt-1 font-semibold">{item.label}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── FAMILY ALTAR (KUL DEVATA) ── */}
      {members.some(m => m.profiles?.kul_devata) && (
        <motion.div 
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="relative glass-panel rounded-[2rem] p-4 border border-[var(--brand-primary)]/15 overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--brand-primary)] opacity-5 blur-2xl" />
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl bg-[var(--brand-primary)]/10 border border-[var(--brand-primary)]/20 shadow-inner">
              🪔
            </div>
            <div className="flex-1">
              <p className="text-[10px] uppercase tracking-widest font-bold text-[var(--brand-primary)] opacity-70">{t('kulFamilyAltar')}</p>
              <h3 className="text-base font-bold theme-ink premium-serif mt-0.5">
                {members.find(m => m.profiles?.kul_devata)?.profiles?.kul_devata}
              </h3>
            </div>
            <div className="px-2.5 py-1 rounded-full bg-[var(--brand-primary)]/10 border border-[var(--brand-primary)]/20 text-[9px] font-bold text-[var(--brand-primary)] uppercase tracking-widest">
              {t('kulProtected')}
            </div>
          </div>
        </motion.div>
      )}

      {/* ── SECTIONS TILES ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold theme-muted">{t('kulOpenSection')}</p>
          {upcomingEvents[0] ? (
            <Link href="/kul/events" className="text-xs font-semibold theme-ink">
              {t('kulNextDateIn')} {upcomingEvents[0].daysUntil}{t('kulDays')}
            </Link>
          ) : null}
        </div>
        <KulSectionTiles
          currentView="hub"
          members={members}
          tasks={tasks}
          messages={messages}
          familyMembers={familyMembers}
          kulEvents={kulEvents}
        />

        {/* Sanskaras — lifecycle rites */}
        <motion.div
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
        >
          <Link
            href="/kul/sanskara"
            className="group flex items-center gap-4 rounded-[1.8rem] px-5 py-4 transition-all glass-panel border border-white/5 hover:border-white/10"
          >
            <div className="w-12 h-12 rounded-2xl bg-[var(--brand-primary)]/10 border border-[var(--brand-primary)]/10 flex items-center justify-center text-xl flex-shrink-0 shadow-inner">🪬</div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--brand-primary)] opacity-70">{t('lineage')}</p>
              <h3 className="text-base font-bold theme-ink mt-0.5 premium-serif">16 {t('sanskara')}</h3>
            </div>
            <ChevronRight size={16} className="theme-dim group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
