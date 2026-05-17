'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Copy,
  GitBranch,
  ImagePlus,
  Loader2,
  MessageCircle,
  Pencil,
  Send,
  Shield,
  Sparkles,
  Users,
} from 'lucide-react';
import { KulSummary, MemberRow, TaskRow, MessageRow, FamilyMember, KulEvent } from '../types';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { daysUntilNextOccurrence } from '../utils';
import { KulSectionTiles } from './KulSectionTiles';
import { useMemo, useRef, useState } from 'react';

function getDisplayName(member?: MemberRow) {
  return member?.profiles?.full_name || member?.profiles?.username || 'Family';
}

function KulSabhaPreview({
  messages,
  members,
  userId,
  onSendMessage,
}: {
  messages: MessageRow[];
  members: MemberRow[];
  userId: string;
  onSendMessage: (content: string) => void;
}) {
  const [draft, setDraft] = useState('');
  const recentMessages = useMemo(() => messages.slice(-3), [messages]);
  const activeMemberIds = new Set(messages.slice(-12).map(message => message.sender_id));

  function send() {
    const content = draft.trim();
    if (!content) return;
    onSendMessage(content);
    setDraft('');
  }

  return (
    <section className="rounded-[2rem] border border-[var(--card-border)] bg-[var(--card-bg)]/80 p-4 shadow-sm backdrop-blur-xl">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]">
            <MessageCircle size={19} />
          </div>
          <div>
            <p className="text-[15px] font-medium theme-ink premium-serif">Kul sabha</p>
            <p className="text-[11px] theme-muted">{activeMemberIds.size || members.length} voices in the family circle</p>
          </div>
        </div>
        <Link href="/kul/sabha" className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--card-border)] text-[var(--brand-primary)]" aria-label="Open Kul sabha">
          <ChevronRight size={17} />
        </Link>
      </div>

      <div className="space-y-2">
        {recentMessages.length > 0 ? recentMessages.map(message => {
          const member = members.find(item => item.user_id === message.sender_id);
          const isMe = message.sender_id === userId;
          return (
            <div key={message.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${isMe ? 'bg-[var(--brand-primary)] text-white' : 'bg-[var(--surface-raised)] theme-ink border border-[var(--card-border)]'}`}>
                {!isMe && <p className="mb-1 text-[10px] font-medium text-[var(--brand-primary)]">{getDisplayName(member)}</p>}
                {message.content}
              </div>
            </div>
          );
        }) : (
          <div className="rounded-2xl border border-dashed border-[var(--card-border)] px-4 py-5 text-center">
            <p className="text-[13px] theme-ink">Start the first family note.</p>
            <p className="mt-1 text-[11px] theme-muted">A blessing, plan, memory, or simple check-in.</p>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-full border border-[var(--card-border)] bg-[var(--surface-raised)] px-2 py-2">
        <input
          value={draft}
          onChange={event => setDraft(event.target.value)}
          onKeyDown={event => {
            if (event.key === 'Enter') send();
          }}
          placeholder="Write to your Kul..."
          className="min-h-10 flex-1 bg-transparent px-3 text-[14px] theme-ink outline-none placeholder:text-[var(--text-dim)]"
        />
        <motion.button
          whileTap={{ scale: 0.94 }}
          onClick={send}
          disabled={!draft.trim()}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--brand-primary)] text-white disabled:opacity-35"
          aria-label="Send message"
        >
          <Send size={16} />
        </motion.button>
      </div>
    </section>
  );
}

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
  onUploadCover,
  isUploading,
  userId,
  onSendMessage,
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
  userId: string;
  onSendMessage: (content: string) => void;
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
  const guardianName = getDisplayName(members.find(member => member.role === 'guardian'));
  const kulDevata = members.find(member => member.profiles?.kul_devata)?.profiles?.kul_devata;
  const gotra = members.find(member => member.profiles?.gotra)?.profiles?.gotra || 'Dharma';

  const actionButtons = [
    { label: 'Members', value: members.length, href: '/kul/members', icon: Users },
    { label: 'Tasks', value: openTasks, href: '/kul/tasks', icon: Shield },
    { label: 'Vansh', value: familyMembers.length, href: '/kul/vansh', icon: GitBranch },
    { label: 'Dates', value: upcomingEvents.length, href: '/kul/events', icon: CalendarDays },
  ];

  return (
    <div className="space-y-5">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onUploadCover(file);
        }}
      />

      <section className="relative overflow-hidden rounded-[2rem] border border-[var(--card-border)] bg-[var(--card-bg)]/80 p-4 shadow-sm backdrop-blur-xl">
        {kul.cover_url && (
          <div className="pointer-events-none absolute inset-x-0 top-0 h-28 opacity-25">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={kul.cover_url} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[var(--card-bg)]" />
          </div>
        )}

        <div className="relative z-10 flex items-center justify-between gap-3">
          <Link href="/home" className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--card-border)] bg-[var(--surface-raised)] theme-ink" aria-label={t('back')}>
            <ChevronLeft size={18} />
          </Link>

          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={() => {
                navigator.clipboard.writeText(kul.invite_code);
                import('react-hot-toast').then(module => module.default.success('Invite code copied'));
              }}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--card-border)] bg-[var(--surface-raised)] text-[var(--brand-primary)]"
              aria-label="Copy invite code"
            >
              <Copy size={17} />
            </motion.button>
            {myRole === 'guardian' && (
              <motion.button
                whileTap={{ scale: 0.94 }}
                disabled={isUploading}
                onClick={() => fileInputRef.current?.click()}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--card-border)] bg-[var(--surface-raised)] text-[var(--brand-primary)] disabled:opacity-60"
                aria-label="Change Kul photo"
              >
                {isUploading ? <Loader2 size={17} className="animate-spin" /> : <ImagePlus size={17} />}
              </motion.button>
            )}
          </div>
        </div>

        <div className="relative z-10 mt-7 flex items-end gap-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[1.6rem] border border-[var(--brand-primary)]/20 bg-[var(--brand-primary)]/10 shadow-inner"
          >
            {kul.cover_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={kul.cover_url} alt="Kul" className="h-full w-full object-cover" />
            ) : (
              <span className="text-[34px] leading-none">{kul.avatar_emoji}</span>
            )}
          </motion.div>

          <div className="min-w-0 flex-1 pb-1">
            <p className="text-[11px] theme-muted">Lineage of {gotra}</p>
            {editingName ? (
              <div className="mt-1 flex items-center gap-2">
                <input
                  autoFocus
                  value={newKulName}
                  onChange={(event) => setNewKulName(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') saveKulName();
                    if (event.key === 'Escape') setEditingName(false);
                  }}
                  className="min-w-0 flex-1 border-b border-[var(--brand-primary)] bg-transparent pb-1 text-[25px] font-medium leading-tight theme-ink outline-none premium-serif"
                  placeholder={t('kulNamePlaceholder')}
                />
                <button onClick={saveKulName} className="rounded-full bg-[var(--brand-primary)] px-3 py-2 text-[11px] font-medium text-white">
                  {t('done')}
                </button>
              </div>
            ) : (
              <div className="mt-1 flex items-center gap-2">
                <h1 className="min-w-0 truncate text-[28px] font-medium leading-none theme-ink premium-serif">{kul.name}</h1>
                {myRole === 'guardian' && (
                  <button
                    onClick={() => {
                      setNewKulName(kul.name);
                      setEditingName(true);
                    }}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--card-border)] text-[var(--brand-primary)]"
                    aria-label="Edit Kul name"
                  >
                    <Pencil size={15} />
                  </button>
                )}
              </div>
            )}
            <p className="mt-2 text-[12px] theme-muted">Guardian: {guardianName} · Code {kul.invite_code}</p>
          </div>
        </div>

        <div className="relative z-10 mt-5 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {actionButtons.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className="shrink-0"
              >
                <Link href={item.href} className="flex min-w-[78px] flex-col items-center gap-1.5 rounded-[1.4rem] border border-[var(--card-border)] bg-[var(--surface-raised)] px-3 py-3 text-center active:scale-95 transition-transform">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]">
                    <Icon size={18} />
                  </span>
                  <span className="text-[15px] font-medium theme-ink leading-none">{item.value}</span>
                  <span className="text-[10px] theme-muted">{item.label}</span>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>

      <KulSectionTiles
        currentView="hub"
        members={members}
        tasks={tasks}
        messages={messages}
        familyMembers={familyMembers}
        kulEvents={kulEvents}
      />

      <KulSabhaPreview
        messages={messages}
        members={members}
        userId={userId}
        onSendMessage={onSendMessage}
      />

      <motion.div whileTap={{ scale: 0.985 }}>
        <Link
          href="/kul/sanskara"
          className="group flex items-center gap-4 rounded-[2rem] border border-[var(--card-border)] bg-[var(--card-bg)]/80 p-4 shadow-sm backdrop-blur-xl"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]">
            <Sparkles size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-medium theme-ink premium-serif">16 Sanskaras</p>
            <p className="mt-0.5 text-[12px] theme-muted">Rites, reminders, and family milestones</p>
          </div>
          <ChevronRight size={18} className="theme-muted transition-transform group-hover:translate-x-0.5" />
        </Link>
      </motion.div>

      {kulDevata && (
        <section className="rounded-[2rem] border border-[var(--card-border)] bg-[var(--card-bg)]/70 p-5 text-center shadow-sm backdrop-blur-xl">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]">
            <Shield size={20} />
          </div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--brand-primary)]">Family altar</p>
          <h3 className="mt-1 text-[21px] font-medium theme-ink premium-serif">{kulDevata}</h3>
        </section>
      )}

      {(totalStreak > 0 || upcomingEvents[0]) && (
        <div className="flex flex-wrap items-center justify-center gap-2 px-2 text-[11px] theme-muted">
          {totalStreak > 0 && <span>{totalStreak} combined practice days</span>}
          {upcomingEvents[0] && <span>Next family date in {upcomingEvents[0].daysUntil} days</span>}
        </div>
      )}
    </div>
  );
}
