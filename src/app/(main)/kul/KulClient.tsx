'use client';

import Image from 'next/image';
import { useState, useEffect, useRef, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  Users, MessageSquare, CheckSquare, Plus, X, Copy,
  Send, Crown, ChevronLeft, ChevronRight, Flame, Pencil,
  Check, ClipboardList, Share2, Search, UserPlus,
} from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { getInitials } from '@/lib/utils';
import type { KulSectionView } from './sections';
import { AsyncStateCard, EmptyState } from '@/components/ui';
import ConfettiOverlay from '@/components/ui/ConfettiOverlay';
import { useKulMutations, useKulQuery } from '@/hooks/useKul';

// ── Types ────────────────────────────────────────────────────────────────────
type KulData   = { id: string; name: string; invite_code: string; avatar_emoji: string; created_by: string; created_at: string };
type MemberRow = { id: string; role: 'guardian' | 'sadhak'; joined_at: string; user_id: string; profiles: { id: string; full_name: string | null; username: string | null; avatar_url: string | null; tradition: string | null; sampradaya: string | null; shloka_streak: number | null; spiritual_level: string | null; bio?: string | null; city?: string | null; country?: string | null; home_town?: string | null; gotra?: string | null; kul_devata?: string | null } | null };
type TaskRow   = { id: string; title: string; description: string | null; task_type: string; content_ref: string | null; due_date: string | null; completed: boolean; completed_at: string | null; score: number | null; guardian_note: string | null; assigned_by: string; assigned_to: string; created_at: string; assigned_to_profile: { full_name: string | null; username: string | null; avatar_url: string | null } | null; assigned_by_profile: { full_name: string | null; username: string | null } | null };
type MessageRow= { id: string; content: string; created_at: string; sender_id: string; reaction: string | null; profiles: { full_name: string | null; username: string | null; avatar_url: string | null } };

type FamilyMember = {
  id: string; kul_id: string; name: string; role: string | null; gender: string | null;
  birth_year: number | null; birth_date: string | null;
  death_year: number | null; death_date: string | null;
  marriage_date: string | null;
  parent_id: string | null; spouse_id: string | null;
  linked_user_id: string | null;
  notes: string | null; photo_url: string | null;
  is_alive: boolean; generation: number | null; display_order: number | null;
};

type KulEvent = {
  id: string; kul_id: string; title: string; event_type: string;
  event_date: string; recurring: boolean; description: string | null;
  member_id: string | null;
  member: { name: string; role: string | null } | null;
};

interface Props {
  userId:        string;
  userName:      string;
  userProfile:   any;
  kul:           KulData | null;
  members:       MemberRow[];
  tasks:         TaskRow[];
  messages:      MessageRow[];
  familyMembers: FamilyMember[];
  kulEvents:     KulEvent[];
  myRole:        'guardian' | 'sadhak';
  view?:         'hub' | KulSectionView;
}

// ── Constants ────────────────────────────────────────────────────────────────
const KUL_EMOJIS = ['🏡', '🕉️', '🙏', '🔱', '🪔', '🌸', '☀️', '🌺', '🫶', '✨'];
const TASK_TYPES: Record<string, { label: string; emoji: string }> = {
  read:      { label: 'Read',      emoji: '📖' },
  recite:    { label: 'Recite',    emoji: '🎙️' },
  practice:  { label: 'Practice',  emoji: '🧘' },
  memorise:  { label: 'Memorise',  emoji: '🧠' },
};
const TRADITION_EMOJI: Record<string, string> = {
  hindu: '🕉️', sikh: '☬', buddhist: '☸️', jain: '🤲', other: '✨',
};

// ── Helpers ──────────────────────────────────────────────────────────────────
function generateInviteCode(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function Avatar({ name, url, size = 10, gradient = 'linear-gradient(135deg, var(--brand-primary), var(--brand-accent))' }: { name: string; url?: string | null; size?: number; gradient?: string }) {
  const s = `w-${size} h-${size}`;
  return (
    <div className={`${s} relative rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 overflow-hidden`}
      style={{ background: gradient }}>
      {url ? <Image src={url} alt="" fill sizes={`${size * 4}px`} className="object-cover" /> : getInitials(name || '?')}
    </div>
  );
}

function TaskBadge({ type }: { type: string }) {
  const t = TASK_TYPES[type] ?? { label: type, emoji: '📌' };
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border border-[rgba(200,146,74,0.16)] bg-[var(--card-bg)] theme-ink">
      {t.emoji} {t.label}
    </span>
  );
}

function getUnreadSignature(
  view: KulSectionView,
  data: {
    members: MemberRow[];
    tasks: TaskRow[];
    messages: MessageRow[];
    familyMembers: FamilyMember[];
    kulEvents: KulEvent[];
  },
) {
  switch (view) {
    case 'tasks':
      return data.tasks
        .filter((task) => !task.completed)
        .map((task) => `${task.id}:${task.created_at}`)
        .join('|');
    case 'members':
      return data.members
        .map((member) => `${member.id}:${member.joined_at}`)
        .join('|');
    case 'sabha':
      return data.messages
        .map((message) => `${message.id}:${message.created_at}`)
        .join('|');
    case 'vansh':
      return data.familyMembers
        .map((member) => `${member.id}:${member.display_order ?? 0}:${member.birth_date ?? ''}:${member.death_date ?? ''}`)
        .join('|');
    case 'events':
      return data.kulEvents
        .map((event) => `${event.id}:${event.event_date}`)
        .join('|');
  }
}

function FamilyProfileSheet({
  member,
  onClose,
}: {
  member: MemberRow;
  onClose: () => void;
}) {
  const profile = member.profiles;
  const name = profile?.full_name || profile?.username || 'Family member';
  const location = [profile?.city, profile?.country].filter(Boolean).join(', ');
  const detailRows = [
    profile?.tradition ? { label: 'Tradition', value: `${TRADITION_EMOJI[profile.tradition] ?? '🙏'} ${profile.tradition}` } : null,
    profile?.sampradaya ? { label: 'Sampradaya', value: profile.sampradaya } : null,
    profile?.spiritual_level ? { label: 'Level', value: profile.spiritual_level } : null,
    profile?.home_town ? { label: 'Home Town', value: profile.home_town } : null,
    profile?.gotra ? { label: 'Gotra', value: profile.gotra } : null,
    profile?.kul_devata ? { label: 'Kul Devata', value: profile.kul_devata } : null,
  ].filter(Boolean) as Array<{ label: string; value: string }>;

  return (
    <div className="fixed inset-0 z-[70] bg-black/45 backdrop-blur-sm px-4 pb-6 pt-24 sm:py-6 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="w-full max-w-md max-h-[calc(100vh-7rem)] sm:max-h-[85vh] overflow-y-auto clay-card rounded-[2rem] p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar
              name={name}
              url={profile?.avatar_url}
              size={16}
              gradient={member.role === 'guardian'
                ? 'linear-gradient(135deg, var(--brand-primary-strong), var(--brand-primary))'
                : 'linear-gradient(135deg, var(--brand-primary), var(--brand-accent))'}
            />
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-[color:var(--brand-ink)] truncate">{name}</h2>
              <p className="text-sm text-[color:var(--brand-muted)]">
                {member.role === 'guardian' ? 'Kul Guardian' : 'Kul Member'}
                {profile?.username ? ` · @${profile.username}` : ''}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full glass-panel border border-white/10 flex items-center justify-center text-[color:var(--brand-muted)]"
            aria-label="Close family profile"
          >
            <X size={16} />
          </button>
        </div>

        <div className="glass-panel rounded-[1.5rem] p-4 space-y-3">
          {location ? (
            <div className="flex items-center gap-2 text-sm text-[color:var(--brand-ink)]">
              <span className="text-base">📍</span>
              <span>{location}</span>
            </div>
          ) : null}
          <div className="flex items-center gap-2 text-sm text-[color:var(--brand-ink)]">
            <span className="text-base">🔥</span>
            <span>{profile?.shloka_streak ?? 0} day shloka streak</span>
          </div>
          {profile?.bio ? (
            <p className="text-sm text-[color:var(--brand-ink)] leading-relaxed">{profile.bio}</p>
          ) : (
            <p className="text-sm text-[color:var(--brand-muted)]">This family member has not added a short introduction yet.</p>
          )}
        </div>

        {detailRows.length > 0 && (
          <div className="glass-panel rounded-[1.5rem] border border-white/8 p-4">
            <p className="text-[10px] uppercase tracking-[0.16em] font-semibold text-[color:var(--brand-muted)] mb-3">Family profile</p>
            <div className="space-y-2">
              {detailRows.map((row) => (
                <div key={row.label} className="flex items-center justify-between gap-4 py-2 border-b border-white/6 last:border-b-0">
                  <span className="text-sm text-[color:var(--brand-muted)]">{row.label}</span>
                  <span className="text-sm font-medium text-[color:var(--brand-ink)] text-right">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-xs text-[color:var(--brand-muted)] leading-relaxed">
          Family profiles show only Kul-safe details so the space stays warm, useful, and private.
        </p>
      </div>
    </div>
  );
}

function FamilyKeepsakeStage({ member }: { member: FamilyMember }) {
  const initials = getInitials(member.name || '?');
  
  // Traditional Sacred Colors
  const terracotta = 'rgba(195, 82, 45,'; // Sindoor/Terracotta
  const sandalwood = 'rgba(240, 220, 180,'; // Chandan/Sandalwood
  const ash        = 'rgba(120, 115, 110,'; // Bhasma/Ash
  
  const medallionRing = member.is_alive
    ? `linear-gradient(145deg, ${terracotta} 0.22), ${sandalwood} 0.26))`
    : `linear-gradient(145deg, ${ash} 0.16), rgba(125, 138, 139, 0.22))`;
    
  const medallionFill = member.is_alive
    ? 'linear-gradient(145deg, #fdfaf5, #f5f0e5)'
    : 'linear-gradient(145deg, #f2eee9, #e6ebeb)';
    
  const statusTone = member.is_alive ? 'var(--brand-primary-strong)' : 'var(--brand-earth)';
  const railTone = member.is_alive ? 'rgba(22, 77, 84, 0.72)' : 'rgba(95, 82, 72, 0.72)';
  const branchLabel = member.parent_id ? 'Linked branch' : 'Root branch';

  return (
    <div className="clay-portrait-stage relative group">
      {/* Decorative Aura / Halo */}
      <div className={`absolute inset-0 rounded-full blur-[12px] opacity-20 group-hover:opacity-40 transition-opacity ${member.is_alive ? 'bg-orange-200' : 'bg-slate-200'}`} />
      
      <div className="clay-memory-orbit" />
      <div className="clay-memory-medallion" style={{ background: medallionRing }}>
        <div className="clay-memory-medallion-inner relative overflow-hidden flex items-center justify-center" style={{ background: medallionFill }}>
          {/* Subtle Clay Texture Overlay */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')]" />
          
          {member.photo_url ? (
            <Image
              src={member.photo_url}
              alt={`${member.name} keepsake`}
              fill
              sizes="160px"
              className="object-cover rounded-[1.2rem] filter sepia-[0.1] contrast-[1.05]"
            />
          ) : (
            <div className="flex flex-col items-center">
              <span className="font-display text-lg font-bold tracking-[0.16em]" style={{ color: statusTone }}>
                {initials}
              </span>
              {/* Sacred Symbol placeholder */}
              <span className="text-[10px] opacity-40 mt-1">
                {member.is_alive ? '🕉️' : '🪷'}
              </span>
            </div>
          )}
        </div>
      </div>
      
      {/* Ritual Seal - Bottom Right overlay */}
      <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full shadow-lg flex items-center justify-center text-[10px] border border-white/20"
        style={{ 
          background: member.is_alive ? 'var(--brand-primary)' : 'var(--brand-earth)',
          color: 'white',
          boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
        }}>
        {member.is_alive ? 'ॐ' : '🪷'}
      </div>

      <div className="clay-memory-badge" style={{ color: statusTone, fontStyle: 'italic' }}>
        {member.is_alive ? 'Living memory' : 'In remembrance'}
      </div>
      
      <div className="absolute inset-x-3 bottom-2 flex items-center justify-between text-[10px] font-medium" style={{ color: railTone }}>
        <span className="opacity-60">{branchLabel}</span>
        <span className="font-bold">{member.generation ? `Gen ${member.generation}` : 'Kul'}</span>
      </div>
    </div>
  );
}

function FamilyLineageSheet({
  member,
  parent,
  spouse,
  relatedEvents,
  canManage,
  onClose,
  onOpenEvents,
  onEdit,
}: {
  member: FamilyMember;
  parent: FamilyMember | null;
  spouse: FamilyMember | null;
  relatedEvents: Array<KulEvent & { daysUntil: number }>;
  canManage: boolean;
  onClose: () => void;
  onOpenEvents: () => void;
  onEdit?: () => void;
}) {
  const lifeLabel = member.is_alive
    ? member.birth_year || member.birth_date
      ? `Born ${member.birth_year ?? new Date(member.birth_date!).getFullYear()}`
      : 'Living family member'
    : `${member.birth_year ?? '—'} – ${member.death_year ?? (member.death_date ? new Date(member.death_date).getFullYear() : '—')}`;

  return (
    <div className="fixed inset-0 z-[70] bg-black/45 backdrop-blur-sm px-4 pb-6 pt-24 sm:py-6 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="w-full max-w-lg clay-card rounded-[2.5rem] p-6 space-y-5 max-h-[calc(100vh-7rem)] sm:max-h-[85vh] overflow-y-auto" 
        style={{ background: 'linear-gradient(150deg, #fdfcf9 0%, #f7f3ed 100%)' }}
        onClick={(e) => e.stopPropagation()}>
        
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-24 flex-shrink-0">
              <FamilyKeepsakeStage member={member} />
            </div>
            <div className="min-w-0">
              <h2 className="text-2xl font-bold theme-ink leading-tight premium-serif">{member.name}</h2>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] mt-1" style={{ color: 'var(--brand-primary-strong)' }}>
                {member.role || 'Family Member'}
                {member.generation ? ` · Gen ${member.generation}` : ''}
              </p>
              <p className="text-xs theme-muted mt-2 font-medium italic opacity-80">{lifeLabel}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full border border-black/[0.05] bg-white shadow-sm flex items-center justify-center text-[color:var(--brand-muted)] transition-all active:scale-90"
            aria-label="Close lineage profile"
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        <div className="rounded-[1.8rem] p-5 space-y-4 border border-black/[0.03]" 
          style={{ background: 'rgba(200, 146, 74, 0.04)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.01)' }}>
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-40">Heritage Snapshot</p>
          <div className="space-y-2.5 text-sm theme-ink">
            {parent ? <p className="flex justify-between"><span>Parent</span> <span className="font-bold">{parent.name}</span></p> : null}
            {spouse ? <p className="flex justify-between"><span>Spouse</span> <span className="font-bold">{spouse.name}</span></p> : null}
            {member.birth_date ? <p className="flex justify-between"><span>Birth Date</span> <span className="font-bold">{new Date(member.birth_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span></p> : null}
            {member.marriage_date ? <p className="flex justify-between"><span>Vivaha</span> <span className="font-bold">{new Date(member.marriage_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span></p> : null}
            {member.death_date ? <p className="flex justify-between"><span>Remembrance</span> <span className="font-bold">{new Date(member.death_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span></p> : null}
          </div>
          
          <div className="pt-3 border-t border-black/[0.03]">
            <p className="text-xs theme-muted leading-relaxed italic">
              {member.notes?.trim() || 'A sacred space for stories, values, and memories that keep the Vansh alive.'}
            </p>
          </div>
        </div>

        <div className="rounded-[1.8rem] p-5 border border-black/[0.03]" style={{ background: 'rgba(255,255,255,0.4)' }}>
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-40 mb-4">Vansh Dates</p>
          {relatedEvents.length > 0 ? (
            <div className="space-y-2.5">
              {relatedEvents.slice(0, 3).map((event) => (
                <div key={event.id} className="flex items-center justify-between gap-3 rounded-2xl border border-black/[0.03] px-4 py-3 bg-white/60 shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{EVENT_EMOJI[event.event_type] ?? '📅'}</span>
                    <div>
                      <p className="text-sm font-bold theme-ink">{event.title}</p>
                      <p className="text-[10px] theme-muted font-medium uppercase tracking-wider mt-0.5">{event.event_type.replace('_', ' ')}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-[var(--brand-primary)]/10" style={{ color: 'var(--brand-primary-strong)' }}>
                    {event.daysUntil === 0 ? 'Today' : `In ${event.daysUntil}d`}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[color:var(--brand-muted)]">No linked family dates yet. Add birthdays, anniversaries, or remembrance days to make this branch feel lived in.</p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onOpenEvents}
            className="glass-button-secondary px-4 py-2 rounded-full text-sm font-semibold"
            style={{ color: 'var(--brand-primary-strong)' }}
          >
            Open family dates
          </button>
          {canManage && onEdit ? (
            <button
              type="button"
              onClick={onEdit}
              className="glass-button-secondary px-4 py-2 rounded-full text-sm font-semibold"
              style={{ color: 'var(--brand-primary-strong)' }}
            >
              Edit member
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ── No-Kul Prompt (Create / Join) ────────────────────────────────────────────
function NoKulPrompt({ userId, userName }: { userId: string; userName: string }) {
  const kulMutations = useKulMutations(userId);

  const [tab,       setTab]       = useState<'create' | 'join'>('create');
  const [kulName,   setKulName]   = useState('');
  const [emoji,     setEmoji]     = useState('🏡');
  const [joinCode,  setJoinCode]  = useState('');

  async function createKul() {
    if (!kulName.trim()) { toast.error('Give your Kul a name 🙏'); return; }
    try {
      await kulMutations.createKul.mutateAsync({ name: kulName.trim(), emoji });
      toast.success(`${emoji} ${kulName} created! Welcome, Guardian 🙏`);
    } catch (error: any) {
      toast.error(error.message ?? 'Could not create the Kul right now.');
    }
  }

  async function joinKul() {
    const code = joinCode.trim().toUpperCase();
    if (code.length < 4) { toast.error('Enter the 6-character invite code'); return; }
    try {
      const kul = await kulMutations.joinKul.mutateAsync(code);
      toast.success(`${kul?.avatar_emoji ?? '🏡'} Joined ${kul?.name ?? 'Kul'}! Jai Ho 🙏`);
    } catch (error: any) {
      toast.error(error.message ?? 'Could not join that Kul right now.');
    }
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center space-y-6 fade-in">
      <div className="w-24 h-24 rounded-full flex items-center justify-center text-5xl"
        style={{ background: 'linear-gradient(135deg, rgba(31, 107, 114, 0.12), rgba(195, 135, 47, 0.14))' }}>
        🏡
      </div>
      <div>
        <h1 className="font-display font-bold text-3xl text-[color:var(--brand-ink)] mb-2">Kul</h1>
        <p className="font-semibold text-sm mb-3" style={{ color: 'var(--brand-primary)' }}>कुल — Your Family Sangam</p>
        <p className="text-[color:var(--brand-muted)] max-w-sm text-sm leading-relaxed">
          A private space for your family to learn, practice dharma together — tasks, streaks, chat, and more.
        </p>
      </div>

      {/* Tab selector */}
      <div className="flex glass-panel rounded-2xl p-1 w-full max-w-sm border border-white/8">
        {(['create', 'join'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${tab === t ? 'text-[#1c1c1a] shadow-sm font-semibold' : 'text-[color:var(--brand-muted)]'}`}
            style={tab === t ? { background: 'var(--brand-primary)' } : undefined}>
            {t === 'create' ? '✨ Create Kul' : '🔗 Join Kul'}
          </button>
        ))}
      </div>

      {tab === 'create' ? (
        <div className="glass-panel rounded-2xl border border-white/8 p-5 w-full max-w-sm space-y-4">
          {/* Emoji picker */}
          <div>
            <p className="text-xs text-[color:var(--brand-muted)] mb-2 font-medium">Choose your Kul symbol</p>
            <div className="flex gap-2 flex-wrap justify-center">
              {KUL_EMOJIS.map(e => (
                <button key={e} onClick={() => setEmoji(e)}
                  className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition ${emoji === e ? 'border-2 border-[color:var(--brand-primary)]' : 'border border-white/10 hover:border-white/20'}`}
                  style={emoji === e ? { background: 'rgba(200,146,74,0.14)' } : undefined}>
                  {e}
                </button>
              ))}
            </div>
          </div>
          <input type="text" placeholder="Name your Kul (e.g. Sharma Parivar)"
            value={kulName} onChange={e => setKulName(e.target.value)}
            maxLength={40}
            className="w-full px-4 py-3 rounded-xl border border-white/12 bg-white/6 text-[color:var(--brand-ink)] placeholder:text-[color:var(--brand-muted)] focus:border-white/24 outline-none text-sm" />
          <button onClick={createKul} disabled={kulMutations.createKul.isPending || !kulName.trim()}
            className="w-full py-3 text-[#1c1c1a] font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition"
            style={{ background: 'var(--brand-primary)' }}>
            {kulMutations.createKul.isPending ? 'Creating…' : `Create ${emoji} ${kulName || 'My Kul'} 🙏`}
          </button>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl border border-white/8 p-5 w-full max-w-sm space-y-4">
          <p className="text-sm text-[color:var(--brand-muted)] text-left">Enter the 6-character invite code from your family guardian.</p>
          <input type="text" placeholder="e.g. AB12CD"
            value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())}
            maxLength={6}
            className="w-full px-4 py-3 rounded-xl border border-white/12 bg-white/6 text-[color:var(--brand-ink)] placeholder:text-[color:var(--brand-muted)] focus:border-white/24 outline-none text-sm tracking-widest font-bold text-center text-2xl uppercase" />
          <button onClick={joinKul} disabled={kulMutations.joinKul.isPending || joinCode.length < 4}
            className="w-full py-3 text-[#1c1c1a] font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition"
            style={{ background: 'var(--brand-primary)' }}>
            {kulMutations.joinKul.isPending ? 'Joining…' : 'Join Kul 🙏'}
          </button>
        </div>
      )}

      <p className="text-xs text-[color:var(--brand-muted)]">
        Want this sooner? Share the app with your family 🙏
      </p>
    </div>
  );
}

// ── Board Tab ────────────────────────────────────────────────────────────────
function BoardTab({ kul, members, tasks, userId, myRole }: {
  kul: KulData; members: MemberRow[]; tasks: TaskRow[]; userId: string; myRole: string;
}) {
  const [selectedMember,    setSelectedMember]    = useState<MemberRow | null>(null);
  const [showInviteSearch, setShowInviteSearch]   = useState(false);
  const totalTasks     = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const pendingTasks   = totalTasks - completedTasks;
  const totalStreak    = members.reduce((s, m) => s + (m.profiles?.shloka_streak ?? 0), 0);

  async function copyCode() {
    try { await navigator.clipboard.writeText(kul.invite_code); toast.success('Invite code copied!'); }
    catch { toast.error('Could not copy'); }
  }

  async function shareKul() {
    const text = `Join our Kul "${kul.name}" on Shoonaya!\nUse invite code: ${kul.invite_code}`;
    if (navigator.share) { try { await navigator.share({ title: kul.name, text }); return; } catch {} }
    await navigator.clipboard.writeText(text);
    toast.success('Invite message copied!');
  }

  return (
    <div className="space-y-4">
      {selectedMember ? (
        <FamilyProfileSheet member={selectedMember} onClose={() => setSelectedMember(null)} />
      ) : null}
      {showInviteSearch && (
        <InviteSearchModal
          kulId={kul.id}
          kulName={kul.name}
          inviteCode={kul.invite_code}
          userId={userId}
          onClose={() => setShowInviteSearch(false)}
        />
      )}
      <div className="flex justify-end">
        <button onClick={shareKul} className="glass-button-secondary px-4 py-2 rounded-full type-chip" style={{ color: 'var(--chip-text)' }}>
          Share Kul
        </button>
      </div>

      {/* Kul header card */}
      <div className="clay-card rounded-[2.2rem] p-6 relative overflow-hidden" 
        style={{ background: 'linear-gradient(150deg, #fdfcf9 0%, #f7f3ed 100%)' }}>
        
        {/* Subtle Background Mark */}
        <div className="absolute -bottom-6 -right-6 text-6xl opacity-[0.03] select-none pointer-events-none">
          {kul.avatar_emoji}
        </div>

        <div className="flex items-center gap-4 mb-6 relative z-10">
          <div className="w-16 h-16 rounded-[1.8rem] flex items-center justify-center text-4xl shadow-inner border border-black/[0.03]"
            style={{ background: 'rgba(200, 146, 74, 0.08)', boxShadow: 'inset 0 4px 8px rgba(0,0,0,0.05)' }}>
            {kul.avatar_emoji}
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold theme-ink premium-serif">{kul.name}</h2>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] mt-1" style={{ color: 'var(--brand-primary-strong)', opacity: 0.7 }}>
              {members.length} Member{members.length !== 1 ? 's' : ''} · {myRole === 'guardian' ? 'Guardian' : 'Sadhak'}
            </p>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 relative z-10">
          {[
            { label: 'Members', value: members.length, emoji: '👨‍👩‍👧‍👦' },
            { label: 'Kul Streak', value: totalStreak, emoji: '🔥' },
            { label: 'Tasks Due', value: pendingTasks, emoji: '📋' },
          ].map(({ label, value, emoji }) => (
            <div key={label} className="rounded-2xl px-3 py-3 text-center border border-black/[0.03]" 
              style={{ background: 'rgba(255,255,255,0.4)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
              <div className="text-xl mb-1">{emoji}</div>
              <div className="text-xl font-bold theme-ink leading-none">{value}</div>
              <div className="text-[9px] uppercase font-bold tracking-widest theme-muted mt-2">{label}</div>
            </div>
          ))}
        </div>

        {/* Invite row */}
        <div className="mt-6 space-y-3 relative z-10">
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 px-4 py-3 rounded-2xl border border-black/[0.04]" 
              style={{ background: 'rgba(0,0,0,0.02)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Code:</span>
              <span className="text-lg font-bold tracking-[0.25em] theme-ink">{kul.invite_code}</span>
            </div>
            <button onClick={copyCode} className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all bg-white shadow-sm border border-black/[0.05] hover:scale-105 active:scale-95">
              <Copy size={16} style={{ color: 'var(--brand-primary-strong)' }} />
            </button>
          </div>
          
          <button
            onClick={() => setShowInviteSearch(true)}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold transition-all border border-[var(--brand-primary)]/20 shadow-sm active:scale-[0.98]"
            style={{ background: 'rgba(200, 146, 74, 0.08)', color: 'var(--brand-primary-strong)' }}
          >
            <UserPlus size={16} strokeWidth={2.5} />
            Invite Member by Name
          </button>
        </div>
      </div>

      {/* Member streaks */}
      <div>
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="type-card-label">Sadhana streaks</p>
          <Link href="/kul/members" className="type-micro text-[color:var(--text-saffron-soft)]">Members</Link>
        </div>
        <div className="space-y-2">
          {[...members].sort((a, b) => (b.profiles?.shloka_streak ?? 0) - (a.profiles?.shloka_streak ?? 0)).map(m => {
            const p = m.profiles;
            const streak = p?.shloka_streak ?? 0;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedMember(m)}
                className="w-full rounded-2xl border border-[rgba(200,146,74,0.14)] bg-[color:var(--brand-accent)] p-3 text-left flex items-center gap-3 transition hover:border-[color:var(--brand-primary-soft)]"
              >
                <Avatar name={p?.full_name || p?.username || '?'} url={p?.avatar_url} size={10}
                  gradient={m.user_id === userId ? 'var(--brand-primary)' : 'linear-gradient(135deg, var(--brand-accent), #d6b06a)'} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="type-card-heading truncate">{p?.full_name || p?.username}</p>
                    {m.role === 'guardian' && <Crown size={11} className="flex-shrink-0" style={{ color: 'var(--brand-primary-strong)' }} />}
                    {m.user_id === userId && <span className="type-tab" style={{ color: 'var(--text-saffron-soft)' }}>(you)</span>}
                  </div>
                  <p className="type-micro">{p?.spiritual_level ?? 'Seeker'} · {TRADITION_EMOJI[p?.tradition ?? ''] ?? '🙏'}</p>
                </div>
                <div className="text-right">
                  <div className="type-card-heading flex items-center gap-1">
                    <Flame size={13} style={{ color: streak > 0 ? 'var(--brand-primary-strong)' : 'var(--text-dim)' }} />
                    <span style={{ color: streak > 0 ? 'var(--brand-primary-strong)' : 'var(--text-dim)' }}>{streak}</span>
                  </div>
                  <div className="type-tab">streak</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Pending tasks summary */}
      {pendingTasks > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3 px-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--brand-primary-strong)', opacity: 0.7 }}>
              Kul Seva — कुल सेवा
            </p>
            <Link href="/kul/tasks" className="text-xs font-bold text-[color:var(--brand-primary-strong)]">View All</Link>
          </div>
          <div className="space-y-2.5">
            {tasks.filter(t => !t.completed).slice(0, 3).map(task => (
              <Link key={task.id} href="/kul/tasks" 
                className="clay-card rounded-[1.8rem] p-3.5 flex items-center gap-4 transition-all hover:scale-[1.01] active:scale-[0.99]"
                style={{ background: 'linear-gradient(150deg, #fdfcf9 0%, #f7f3ed 100%)' }}>
                <div className="w-10 h-10 rounded-[1.2rem] flex items-center justify-center text-xl shadow-inner" 
                  style={{ background: 'rgba(200, 146, 74, 0.08)', border: '1px solid rgba(0,0,0,0.03)' }}>
                  {TASK_TYPES[task.task_type]?.emoji ?? '📌'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold theme-ink truncate tracking-tight">{task.title}</p>
                  <p className="text-[11px] font-medium text-[color:var(--brand-muted)] truncate mt-0.5">
                    For {task.assigned_to_profile?.full_name || task.assigned_to_profile?.username}
                    {task.due_date && ` · ${new Date(task.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`}
                  </p>
                </div>
              </Link>
            ))}
            {pendingTasks > 3 && (
              <Link href="/kul/tasks" className="block text-[11px] font-bold text-center py-1 opacity-60" style={{ color: 'var(--brand-primary-strong)' }}>
                +{pendingTasks - 3} more seva tasks
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Members Tab ───────────────────────────────────────────────────────────────
function MembersTab({ members, userId, myRole, kul }: {
  members: MemberRow[]; userId: string; myRole: string; kul: KulData;
}) {
  const kulMutations = useKulMutations(userId);
  const [selectedMember, setSelectedMember] = useState<MemberRow | null>(null);

  async function promote(memberId: string, kulId: string) {
    try {
      await kulMutations.promoteMember.mutateAsync(memberId);
      toast.success('Member promoted to Guardian 👑');
    } catch (error: any) {
      toast.error(error.message ?? 'Could not promote this member.');
    }
  }

  async function remove(memberId: string, memberName: string) {
    if (!confirm(`Remove ${memberName} from the Kul?`)) return;
    try {
      await kulMutations.removeMember.mutateAsync(memberId);
      toast.success(`${memberName} removed`);
    } catch (error: any) {
      toast.error(error.message ?? 'Could not remove this member.');
    }
  }

  return (
    <div className="space-y-4">
      {selectedMember ? (
        <FamilyProfileSheet member={selectedMember} onClose={() => setSelectedMember(null)} />
      ) : null}
      <div className="space-y-3">
      {members.map(m => {
        const p     = m.profiles;
        const isMe  = m.user_id === userId;
        const name  = p?.full_name || p?.username || 'Member';
        return (
          <div key={m.id} 
            className={`clay-card rounded-[1.8rem] p-3 flex items-center gap-4 transition-all hover:scale-[1.01] active:scale-[0.99] ${isMe ? 'ring-2 ring-[var(--brand-primary)]/20' : ''}`}
            style={{ background: 'linear-gradient(150deg, #fdfcf9 0%, #f7f3ed 100%)' }}>
            
            <button
              type="button"
              onClick={() => setSelectedMember(m)}
              className="flex flex-1 items-center gap-4 min-w-0 text-left"
            >
              <div className="relative">
                <Avatar name={name} url={p?.avatar_url} size={12}
                  gradient={isMe ? 'var(--brand-primary-strong)' : 'linear-gradient(135deg, var(--brand-primary), var(--brand-accent))'} />
                {isMe && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-[var(--brand-primary)] rounded-full border-2 border-white flex items-center justify-center shadow-sm">
                    <Check size={10} color="white" strokeWidth={4} />
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-base font-bold theme-ink truncate">{name}</p>
                  {m.role === 'guardian' && <Crown size={14} className="flex-shrink-0" style={{ color: 'var(--brand-primary-strong)' }} />}
                </div>
                <p className="text-[11px] font-semibold text-[color:var(--brand-muted)] flex items-center gap-1.5 mt-0.5">
                  <span className="uppercase tracking-widest">{m.role === 'guardian' ? 'Guardian' : 'Sadhak'}</span>
                  {p?.tradition && <span>· {TRADITION_EMOJI[p.tradition] ?? '🙏'}</span>}
                  {p?.shloka_streak ? <span className="text-[var(--brand-primary-strong)]">· 🔥 {p.shloka_streak}</span> : ''}
                </p>
              </div>
            </button>

            {/* Guardian actions */}
            {myRole === 'guardian' && !isMe && (
              <div className="flex items-center gap-2 pr-1">
                {m.role === 'sadhak' && (
                  <button onClick={() => promote(m.id, kul.id)}
                    className="h-10 px-4 text-xs font-bold rounded-2xl transition-all shadow-sm border border-[var(--brand-primary)]/10 hover:bg-white active:scale-95"
                    style={{ color: 'var(--brand-primary-strong)', background: 'rgba(200,146,74,0.06)' }}>
                    Promote
                  </button>
                )}
                <button onClick={() => remove(m.id, name)}
                  className="w-10 h-10 rounded-2xl flex items-center justify-center border border-black/[0.04] text-[color:var(--brand-muted)] hover:bg-red-50 hover:text-red-500 transition-all active:scale-90">
                  <X size={16} strokeWidth={2.5} />
                </button>
              </div>
            )}
          </div>
        );
      })}
      </div>
    </div>
  );
}

// ── Tasks Tab ─────────────────────────────────────────────────────────────────
function TasksTab({ tasks, members, userId, myRole, kulId }: {
  tasks: TaskRow[]; members: MemberRow[]; userId: string; myRole: string; kulId: string;
}) {
  const kulMutations = useKulMutations(userId);

  const [showCompose, setShowCompose] = useState(false);
  const [title,       setTitle]       = useState('');
  const [taskType,    setTaskType]    = useState('read');
  const [assignTo,    setAssignTo]    = useState('');
  const [dueDate,     setDueDate]     = useState('');
  const [description, setDescription] = useState('');
  const [saving,      setSaving]      = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const myTasks    = tasks.filter(t => t.assigned_to === userId);
  const otherTasks = tasks.filter(t => t.assigned_to !== userId);

  async function assignTask() {
    if (!title.trim() || !assignTo) { toast.error('Fill in title and assignee'); return; }
    setSaving(true);
    try {
      await kulMutations.assignTask.mutateAsync({
        kulId,
        title,
        description,
        taskType,
        assignTo,
        dueDate,
      });
      toast.success('Task assigned! 📋');
      setTitle(''); setDescription(''); setAssignTo(''); setDueDate('');
      setShowCompose(false);
    } catch (error: any) {
      toast.error(error.message ?? 'Could not assign the task.');
    } finally {
      setSaving(false);
    }
  }

  async function completeTask(taskId: string) {
    try {
      await kulMutations.completeTask.mutateAsync(taskId);
      setShowConfetti(true);
      toast.success('Task completed! 🎉 +10 seva');
    } catch (error: any) {
      toast.error(error.message ?? 'Could not complete this task.');
    }
  }

  return (
    <div className="space-y-4">
      <ConfettiOverlay show={showConfetti} onComplete={() => setShowConfetti(false)} />

      {/* Assign button for guardians */}
      {myRole === 'guardian' && (
        <button onClick={() => setShowCompose(!showCompose)}
          className="w-full glass-panel border border-dashed border-[color:var(--brand-primary)]/30 rounded-2xl p-3 flex items-center gap-3 text-[color:var(--brand-muted)] hover:border-[color:var(--brand-primary)]/50 hover:text-[color:var(--brand-primary-strong)] transition">
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(200,146,74,0.10)' }}>
            <Plus size={15} style={{ color: 'var(--brand-primary)' }} />
          </div>
          <span className="text-sm">Assign a sadhana task…</span>
        </button>
      )}

      {/* Compose panel */}
      {showCompose && (
        <div className="glass-panel rounded-2xl border border-white/8 p-4 space-y-3 fade-in">
          <p className="text-sm font-semibold text-[color:var(--brand-ink)]">Assign New Task</p>
          {/* Task type */}
          <div className="flex gap-2 flex-wrap">
            {Object.entries(TASK_TYPES).map(([k, v]) => (
              <button key={k} onClick={() => setTaskType(k)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition ${taskType === k ? 'bg-[#7B1A1A]/10 text-[color:var(--brand-primary-strong)] border border-[color:var(--brand-primary)]/30' : 'bg-white/4 text-[color:var(--brand-muted)] border border-white/10'}`}>
                {v.emoji} {v.label}
              </button>
            ))}
          </div>
          <input type="text" placeholder="Task title (e.g. Recite Gayatri Mantra 3 times)"
            value={title} onChange={e => setTitle(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-white/10 focus:border-[color:var(--brand-primary)] outline-none text-sm" />
          <textarea placeholder="Optional description / guidance…"
            value={description} onChange={e => setDescription(e.target.value)} rows={2}
            className="w-full px-4 py-3 rounded-xl border border-white/10 focus:border-[color:var(--brand-primary)] outline-none resize-none text-sm" />
          <div className="grid grid-cols-2 gap-2">
            <select value={assignTo} onChange={e => setAssignTo(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-white/10 focus:border-[color:var(--brand-primary)] outline-none text-sm">
              <option value="">Assign to…</option>
              {members.filter(m => m.user_id !== userId).map(m => (
                <option key={m.user_id} value={m.user_id}>
                  {m.profiles?.full_name || m.profiles?.username || 'Member'}
                </option>
              ))}
            </select>
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-white/10 focus:border-[color:var(--brand-primary)] outline-none text-sm" />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowCompose(false)} className="px-4 py-2 text-sm text-[color:var(--brand-muted)]">Cancel</button>
            <button onClick={assignTask} disabled={saving || !title.trim() || !assignTo}
              className="px-5 py-2 text-white text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition"
              style={{ background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-primary-strong))' }}>
              {saving ? 'Assigning…' : 'Assign Task 🙏'}
            </button>
          </div>
        </div>
      )}

      {/* My tasks */}
      {myTasks.length > 0 && (
        <div>
          <p className="text-xs text-[color:var(--brand-muted)] font-medium uppercase tracking-wider mb-2">My Tasks</p>
          <div className="space-y-2">
            {myTasks.map(task => (
              <TaskCard key={task.id} task={task} isMyTask userId={userId} onComplete={completeTask} />
            ))}
          </div>
        </div>
      )}

      {/* Others' tasks (guardian view) */}
      {myRole === 'guardian' && otherTasks.length > 0 && (
        <div>
          <p className="text-xs text-[color:var(--brand-muted)] font-medium uppercase tracking-wider mb-2">Assigned Tasks</p>
          <div className="space-y-2">
            {otherTasks.map(task => (
              <TaskCard key={task.id} task={task} isMyTask={false} userId={userId} onComplete={completeTask} />
            ))}
          </div>
        </div>
      )}

      {tasks.length === 0 && (
        <EmptyState
          icon="📋"
          title={myRole === 'guardian' ? 'Assign the first sadhana task' : 'No tasks assigned yet'}
          description="Tasks are where family practice becomes visible, repeatable, and shared."
        />
      )}
    </div>
  );
}

function TaskCard({ task, isMyTask, userId, onComplete }: {
  task: TaskRow; isMyTask: boolean; userId: string; onComplete: (id: string) => void;
}) {
  const assignee = task.assigned_to_profile;
  return (
    <div className={`glass-panel rounded-2xl border border-white/8 p-3 flex items-start gap-3 ${task.completed ? 'opacity-70' : ''}`}>
      <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0"
        style={{ background: task.completed ? 'rgba(34,197,94,0.14)' : 'rgba(200,146,74,0.12)' }}>
        {task.completed ? '✅' : (TASK_TYPES[task.task_type]?.emoji ?? '📌')}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className={`text-sm font-medium ${task.completed ? 'line-through text-[color:var(--brand-muted)]' : 'text-[color:var(--brand-ink)]'}`}>{task.title}</p>
            {task.description && <p className="text-xs text-[color:var(--brand-muted)] mt-0.5 leading-snug">{task.description}</p>}
          </div>
          {isMyTask && !task.completed && (
            <button onClick={() => onComplete(task.id)}
              className="flex-shrink-0 px-3 py-1.5 text-xs font-semibold rounded-full text-white hover:opacity-90 transition"
              style={{ background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-primary-strong))' }}>
              Done ✓
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <TaskBadge type={task.task_type} />
          {!isMyTask && assignee && (
            <span className="text-xs text-[color:var(--brand-muted)]">→ {assignee.full_name || assignee.username}</span>
          )}
          {task.due_date && (
            <span className="text-xs text-[color:var(--brand-muted)]">
              Due {new Date(task.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            </span>
          )}
          {task.completed && task.score != null && (
            <span className="text-xs font-medium" style={{ color: '#86efac' }}>Score: {task.score}/100</span>
          )}
        </div>
      </div>
    </div>
  );
}


// ── Sabha (Kul Chat) Tab — dark themed, emoji-first ───────────────────────────
const REACTION_EMOJIS = ['🙏', '❤️', '🕉️', '🔥', '😊', '💛', '👏', '💐'];
const QUICK_EMOJIS    = ['🙏', '🕉️', '🔥', '❤️', '🌅', '💛', '☀️', '🫶'];

function SabhaTab({ messages: initialMessages, userId, kulId, userName }: {
  messages: MessageRow[]; userId: string; kulId: string; userName: string;
}) {
  const supabase     = useRef(createClient()).current;
  const kulMutations = useKulMutations(userId);
  const bottomRef    = useRef<HTMLDivElement>(null);
  const inputRef     = useRef<HTMLTextAreaElement>(null);

  const [msgs,           setMsgs]           = useState(initialMessages);
  const [content,        setContent]        = useState('');
  const [sending,        setSending]        = useState(false);
  const [reactionTrayFor, setReactionTray]  = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojis]   = useState(false);

  // Scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`kul_messages_${kulId}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'kul_messages', filter: `kul_id=eq.${kulId}` },
        async () => {
          const { data } = await supabase
            .from('kul_messages')
            .select('*, profiles!kul_messages_sender_id_fkey(full_name, username, avatar_url)')
            .eq('kul_id', kulId)
            .order('created_at', { ascending: true })
            .limit(80);
          if (data) setMsgs(data as MessageRow[]);
        })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [kulId, supabase]);

  async function sendMessage() {
    const text = content.trim();
    if (!text || sending) return;
    setSending(true);
    setContent('');
    try {
      await kulMutations.sendMessage.mutateAsync({ kulId, content: text });
    } catch {
      setContent(text);
      toast.error('Could not send — try again');
    } finally {
      setSending(false);
    }
  }

  async function addReaction(msgId: string, emoji: string) {
    setReactionTray(null);
    try {
      await kulMutations.reactToMessage.mutateAsync({ messageId: msgId, emoji });
      setMsgs(prev => prev.map(m => m.id === msgId ? { ...m, reaction: emoji } : m));
    } catch { /* silent */ }
  }

  function formatTime(ts: string) {
    return new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  }

  return (
    <div className="flex flex-col" style={{ height: 'calc(100svh - 280px)', minHeight: '400px' }}>

      {/* Messages list */}
      <div className="flex-1 overflow-y-auto space-y-2 py-2 px-1">
        {msgs.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full py-12 text-center">
            <div className="text-5xl mb-3">🙏</div>
            <p className="font-semibold text-[color:var(--brand-ink)]">Sabha is open</p>
            <p className="text-sm text-[color:var(--brand-muted)] mt-1 max-w-xs leading-relaxed">
              Begin with one family message — let the conversation flow from there.
            </p>
          </div>
        )}

        {msgs.map(msg => {
          const isMe = msg.sender_id === userId;
          const name = msg.profiles?.full_name || msg.profiles?.username || 'Member';
          const showReactions = reactionTrayFor === msg.id;

          return (
            <div key={msg.id} className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
              {/* Avatar — only for others */}
              {!isMe && (
                <Avatar name={name} url={msg.profiles?.avatar_url} size={7} />
              )}

              <div className={`max-w-[78%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                {/* Sender name */}
                {!isMe && (
                  <p className="text-[10px] text-[color:var(--brand-muted)] mb-1 px-2">{name}</p>
                )}

                {/* Bubble */}
                <div className="relative group">
                  <div
                    className={`px-3.5 py-2.5 text-sm leading-relaxed relative ${
                      isMe
                        ? 'text-[#1c1c1a] rounded-2xl rounded-tr-sm font-medium'
                        : 'text-[color:var(--brand-ink)] rounded-2xl rounded-tl-sm border border-white/8'
                    }`}
                    style={isMe
                      ? { background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-primary-strong))' }
                      : { background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(8px)' }
                    }
                  >
                    {msg.content}
                    {/* Reaction badge */}
                    {msg.reaction && (
                      <span className="absolute -bottom-2.5 -right-1 text-base leading-none bg-black/60 rounded-full px-1.5 py-0.5 border border-white/10">
                        {msg.reaction}
                      </span>
                    )}
                  </div>

                  {/* Hover reaction button */}
                  <button
                    onClick={() => setReactionTray(r => r === msg.id ? null : msg.id)}
                    className={`absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-sm w-10 h-10 rounded-full border border-white/12 bg-black/60 text-[color:var(--brand-muted)] ${
                      isMe ? '-left-8' : '-right-8'
                    }`}
                  >
                    😊
                  </button>
                </div>

                {/* Timestamp */}
                <p className="text-[9px] text-white/25 mt-1 px-1">{formatTime(msg.created_at)}</p>

                {/* Reaction tray — tap to show */}
                {showReactions && (
                  <div className={`mt-1.5 flex gap-1.5 px-1 flex-wrap ${isMe ? 'justify-end' : 'justify-start'}`}>
                    {REACTION_EMOJIS.map(e => (
                      <button
                        key={e}
                        onClick={() => addReaction(msg.id, e)}
                        className="text-lg hover:scale-125 transition-transform active:scale-110 py-0.5 px-1"
                        title={e}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Emoji quick-bar */}
      {showEmojiPicker && (
        <div className="px-1 pb-2 flex flex-wrap gap-2">
          {QUICK_EMOJIS.map((em) => (
            <button
              key={em}
              onClick={() => { setContent(c => c + em); setShowEmojis(false); inputRef.current?.focus(); }}
              className="text-2xl active:scale-90 transition-transform"
            >
              {em}
            </button>
          ))}
        </div>
      )}

      {/* Input bar */}
      <div
        className="flex items-end gap-2 pt-2 border-t"
        style={{ borderColor: 'rgba(255,255,255,0.07)' }}
      >
        {/* Emoji toggle */}
        <button
          onClick={() => setShowEmojis(e => !e)}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-xl shrink-0 transition"
          style={{ background: showEmojiPicker ? 'rgba(200,146,74,0.18)' : 'rgba(255,255,255,0.06)' }}
        >
          🙏
        </button>

        {/* Text input */}
        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            placeholder="Message the family… 🕉️"
            value={content}
            onChange={e => setContent(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            rows={1}
            className="w-full px-4 py-2.5 rounded-2xl border border-white/10 outline-none resize-none text-sm leading-relaxed"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--brand-ink)' }}
          />
        </div>

        {/* Send button */}
        <button
          onClick={sendMessage}
          disabled={sending || !content.trim()}
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition disabled:opacity-30"
          style={{ background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-primary-strong))' }}
        >
          <Send size={15} className="text-[#1c1c1a]" />
        </button>
      </div>
    </div>
  );
}

// ── Vansh (Family Lineage) Tab ───────────────────────────────────────────────
const GENERATION_LABELS: Record<number, string> = {
  1: 'परदादा / परदादी — Great-Grandparents',
  2: 'दादा / दादी / नाना / नानी — Grandparents',
  3: 'माता / पिता — Parents',
  4: 'हम — Our Generation',
  5: 'पुत्र / पुत्री — Children',
  6: 'पौत्र / पौत्री — Grandchildren',
};
const EVENT_EMOJI: Record<string, string> = {
  birthday:          '🎂',
  anniversary:       '💍',
  death_anniversary: '🕯️',
  puja:              '🪔',
  custom:            '📅',
};

function daysUntilNextOccurrence(dateStr: string): number {
  const today    = new Date();
  const d        = new Date(dateStr);
  const thisYear = new Date(today.getFullYear(), d.getMonth(), d.getDate());
  if (thisYear < today) thisYear.setFullYear(today.getFullYear() + 1);
  return Math.ceil((thisYear.getTime() - today.setHours(0,0,0,0)) / 86_400_000);
}

type KulView = 'hub' | KulSectionView;

const KUL_SECTION_META: Record<KulSectionView, {
  label: string;
  eyebrow: string;
  emoji: string;
  description: string;
  group: 'today' | 'family' | 'lineage';
}> = {
  members: {
    label: 'Members',
    eyebrow: 'Care circle',
    emoji: '👨‍👩‍👧‍👦',
    description: 'Manage roles, view who is participating, and keep the family circle clear.',
    group: 'family',
  },
  tasks: {
    label: 'Tasks',
    eyebrow: 'Do together',
    emoji: '📋',
    description: 'Assign and complete shared practices, readings, and small family commitments.',
    group: 'today',
  },
  sabha: {
    label: 'Kul Sabha',
    eyebrow: 'Family conversation',
    emoji: '💬',
    description: 'Keep your Kul chat in a dedicated, full-page conversation space.',
    group: 'family',
  },
  vansh: {
    label: 'Vansh',
    eyebrow: 'Lineage',
    emoji: '🫶',
    description: 'Read your family tree as a warm keepsake wall with room to breathe.',
    group: 'lineage',
  },
  events: {
    label: 'Family Dates',
    eyebrow: 'Ritual calendar',
    emoji: '📅',
    description: 'Birthdays, anniversaries, pujas, and remembrance dates in one dedicated page.',
    group: 'lineage',
  },
};

function getKulSectionHref(section: KulSectionView) {
  return `/kul/${section}`;
}

function KulSectionTiles({
  currentView,
  members,
  tasks,
  messages,
  familyMembers,
  kulEvents,
  large = false,
}: {
  currentView?: KulView;
  members: MemberRow[];
  tasks: TaskRow[];
  messages: MessageRow[];
  familyMembers: FamilyMember[];
  kulEvents: KulEvent[];
  large?: boolean;
}) {
  const pendingTasks = tasks.filter((task) => !task.completed).length;
  const upcomingEvents = kulEvents
    .map((event) => ({ ...event, daysUntil: daysUntilNextOccurrence(event.event_date) }))
    .filter((event) => event.daysUntil <= 90).length;
  const [seenSignatures, setSeenSignatures] = useState<Record<string, string>>({});

  const liveSignatures: Record<KulSectionView, string> = {
    tasks: getUnreadSignature('tasks', { members, tasks, messages, familyMembers, kulEvents }),
    members: getUnreadSignature('members', { members, tasks, messages, familyMembers, kulEvents }),
    sabha: getUnreadSignature('sabha', { members, tasks, messages, familyMembers, kulEvents }),
    vansh: getUnreadSignature('vansh', { members, tasks, messages, familyMembers, kulEvents }),
    events: getUnreadSignature('events', { members, tasks, messages, familyMembers, kulEvents }),
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem('kul-section-seen-signatures');
      if (raw) setSeenSignatures(JSON.parse(raw) as Record<string, string>);
    } catch {}
  }, []);

  useEffect(() => {
    if (!currentView || currentView === 'hub' || typeof window === 'undefined') return;
    const nextSignatures = { ...seenSignatures, [currentView]: liveSignatures[currentView] };
    setSeenSignatures(nextSignatures);
    window.localStorage.setItem('kul-section-seen-signatures', JSON.stringify(nextSignatures));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentView, liveSignatures.tasks, liveSignatures.members, liveSignatures.sabha, liveSignatures.vansh, liveSignatures.events]);

  const tiles: Array<{ key: KulSectionView; badge?: number }> = [
    {
      key: 'tasks',
      badge: liveSignatures.tasks && seenSignatures.tasks !== liveSignatures.tasks ? 1 : undefined,
    },
    {
      key: 'members',
      badge: liveSignatures.members && seenSignatures.members !== liveSignatures.members ? 1 : undefined,
    },
    {
      key: 'sabha',
      badge: liveSignatures.sabha && seenSignatures.sabha !== liveSignatures.sabha ? 1 : undefined,
    },
    {
      key: 'vansh',
      badge: liveSignatures.vansh && seenSignatures.vansh !== liveSignatures.vansh ? 1 : undefined,
    },
    {
      key: 'events',
      badge: liveSignatures.events && seenSignatures.events !== liveSignatures.events ? 1 : undefined,
    },
  ];

  return (
    <div className={`grid gap-3 ${large ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2 sm:grid-cols-3'}`}>
      {tiles.map(({ key, badge }) => {
        const meta = KUL_SECTION_META[key];
        const active = currentView === key;
        return (
          <Link
            key={key}
            href={getKulSectionHref(key)}
            className={`group rounded-[1.6rem] p-4 transition-all ${active ? 'clay-card' : 'glass-panel'}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className="clay-icon-well text-lg flex-shrink-0">{meta.emoji}</div>
                <div className="min-w-0">
          <p className="type-card-label">
                    {meta.eyebrow}
                  </p>
                  <h3 className="type-card-heading mt-1 leading-tight">
                    {meta.label}
                  </h3>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                {badge != null && badge > 0 && (
                  <span className="type-chip rounded-full px-2 py-1 text-[#1c1c1a]" style={{ background: 'var(--brand-primary)' }}>
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
                <ChevronRight size={16} className="theme-dim group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
            <p className="type-body mt-3">
              {meta.description}
            </p>
          </Link>
        );
      })}
    </div>
  );
}

// ── Invite Member Search Modal ────────────────────────────────────────────────
function InviteSearchModal({
  kulId, kulName, inviteCode, userId, onClose,
}: { kulId: string; kulName: string; inviteCode: string; userId: string; onClose: () => void }) {
  const supabase = createClient();
  const [query,   setQuery]   = useState('');
  const [results, setResults] = useState<{ id: string; full_name: string | null; username: string | null; avatar_url: string | null; tradition: string | null }[]>([]);
  const [loading, setLoading] = useState(false);
  const [invited, setInvited] = useState<Set<string>>(new Set());

  async function search() {
    if (!query.trim()) return;
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, username, avatar_url, tradition')
      .or(`full_name.ilike.%${query.trim()}%,username.ilike.%${query.trim()}%`)
      .neq('id', userId)
      .limit(15);
    setResults(data ?? []);
    setLoading(false);
  }

  async function sendInvite(toUserId: string, toName: string) {
    try {
      // Must go through API — the notifications table has no client INSERT policy.
      // Direct supabase.from('notifications').insert({ user_id: toUserId }) is
      // blocked by RLS because user_id belongs to another user.
      const res = await fetch('/api/kul/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toUserId, kulId, kulName, inviteCode }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? 'Could not send invite');
        return;
      }
      setInvited(prev => new Set(prev).add(toUserId));
      toast.success(`Invite sent to ${toName} 🙏`);
    } catch {
      toast.error('Could not send invite');
    }
  }

  const TRAD_ICON: Record<string, string> = { hindu: '🕉️', sikh: '☬', buddhist: '☸️', jain: '🤲', other: '✨' };

  return (
    <div className="fixed inset-0 z-50 flex items-end" onClick={onClose}>
      <div
        className="w-full max-w-lg mx-auto rounded-t-3xl max-h-[85vh] flex flex-col"
        style={{ background: 'var(--card-bg)', border: '1px solid rgba(255,255,255,0.10)', backdropFilter: 'blur(20px)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-white/8">
          <div>
            <h2 className="font-bold text-[color:var(--brand-ink)]">Invite a Member</h2>
            <p className="text-xs text-[color:var(--brand-muted)] mt-0.5">Search by name or username</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/6 flex items-center justify-center">
            <X size={16} className="text-[color:var(--brand-muted)]" />
          </button>
        </div>

        <div className="px-5 py-3 border-b border-white/8 flex gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--brand-muted)]" />
            <input
              autoFocus
              type="text" placeholder="Search name or @username…"
              value={query} onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && search()}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-white/10 bg-white/6 text-sm text-[color:var(--brand-ink)] placeholder:text-[color:var(--brand-muted)] outline-none focus:border-white/20"
            />
          </div>
          <button
            onClick={search} disabled={loading || !query.trim()}
            className="px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-40 transition"
            style={{ background: 'var(--brand-primary)', color: '#1c1c1a' }}
          >
            {loading ? '…' : 'Search'}
          </button>
        </div>

        <div className="overflow-y-auto flex-1 divide-y divide-white/6">
          {results.length === 0 && query && !loading && (
            <p className="text-center text-sm text-[color:var(--brand-muted)] py-8">No results for &ldquo;{query}&rdquo;</p>
          )}
          {results.map(r => (
            <div key={r.id} className="flex items-center gap-3 px-5 py-3.5">
              <Avatar name={r.full_name || r.username || '?'} url={r.avatar_url} size={10} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[color:var(--brand-ink)] truncate">{r.full_name || r.username}</p>
                <p className="text-xs text-[color:var(--brand-muted)] truncate">
                  {TRAD_ICON[r.tradition ?? ''] ?? '🙏'} {r.username ? `@${r.username}` : ''}
                </p>
              </div>
              <button
                onClick={() => sendInvite(r.id, r.full_name || r.username || 'them')}
                disabled={invited.has(r.id)}
                className="px-4 py-1.5 rounded-xl text-xs font-semibold transition disabled:opacity-50"
                style={{ background: invited.has(r.id) ? 'rgba(34,197,94,0.14)' : 'rgba(200,146,74,0.14)', color: invited.has(r.id) ? '#4ade80' : 'var(--brand-primary-strong)', border: `1px solid ${invited.has(r.id) ? 'rgba(34,197,94,0.25)' : 'rgba(200,146,74,0.25)'}` }}
              >
                {invited.has(r.id) ? '✓ Invited' : 'Invite'}
              </button>
            </div>
          ))}
        </div>

        {/* Also show the invite code to copy */}
        <div className="px-5 py-4 border-t border-white/8 flex items-center gap-3">
          <div className="flex-1 text-xs text-[color:var(--brand-muted)]">
            Or share code: <span className="font-bold text-[color:var(--brand-ink)] tracking-widest">{inviteCode}</span>
          </div>
          <button
            onClick={async () => { await navigator.clipboard.writeText(inviteCode); toast.success('Code copied!'); }}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-white/10 text-[color:var(--brand-muted)]"
          >
            Copy
          </button>
        </div>
      </div>
    </div>
  );
}

function KulHubView({
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
  savingName,
}: {
  kul: KulData;
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
  savingName: boolean;
}) {
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
      <div className="relative clay-card rounded-[2.5rem] p-6 overflow-hidden flex flex-col items-center text-center">
        {/* Background Accents */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--brand-primary)] opacity-[0.03] blur-[60px]" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-[var(--brand-primary-strong)] opacity-[0.03] blur-[80px]" />

        {/* Top Actions Row */}
        <div className="w-full flex items-center justify-between z-10 mb-8">
          <Link href="/home"
            className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-4 py-2 rounded-full glass-panel border border-white/5 transition hover:bg-white/10"
            style={{ color: 'var(--brand-primary)' }}>
            <ChevronLeft size={14} strokeWidth={3} />
            Home
          </Link>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--brand-primary)]/20 bg-[var(--brand-primary)]/5">
            <span className="text-[10px] font-bold text-[var(--brand-primary)] uppercase tracking-widest opacity-60">Invite</span>
            <span className="text-xs font-bold text-[var(--brand-primary)] tracking-[0.2em]">{kul.invite_code}</span>
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
            <div className="flex items-center gap-2">
              <input
                autoFocus
                value={newKulName}
                onChange={(e) => setNewKulName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') saveKulName(); if (e.key === 'Escape') setEditingName(false); }}
                className="text-3xl font-bold bg-transparent outline-none border-b-2 border-[var(--brand-primary)] text-center w-64 premium-serif"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1">
              <h1 className="text-3xl sm:text-4xl font-bold theme-ink premium-serif flex items-center gap-2">
                {kul.name}
                {myRole === 'guardian' && (
                  <button onClick={() => { setNewKulName(kul.name); setEditingName(true); }} className="opacity-40 hover:opacity-100 transition">
                    <Pencil size={14} />
                  </button>
                )}
              </h1>
              <p className="text-[10px] uppercase tracking-[0.3em] font-semibold text-[var(--brand-primary)] opacity-70">
                Lineage of {members.find(m => m.profiles?.gotra)?.profiles?.gotra || 'Dharma'}
              </p>
            </div>
          )}
        </div>

        {/* Floating Metrics Row */}
        <div className="flex flex-wrap justify-center gap-3 mt-10 z-10 w-full max-w-lg">
          {[
            { label: 'Members', value: members.length, emoji: '👨‍👩‍👧‍👦', href: '/kul/members' },
            { label: 'Pending', value: openTasks, emoji: '📋', href: '/kul/tasks' },
            { label: 'Kul Streak', value: totalStreak, emoji: '🔥', href: '/kul/sabha' },
            { label: 'Dates', value: upcomingEvents.length, emoji: '📅', href: '/kul/events' },
          ].map((item) => (
            <Link key={item.label} href={item.href} className="floating-pill px-4 py-3 rounded-2xl flex items-center gap-3 min-w-[110px] transition-all hover:scale-105 active:scale-95">
              <div className="text-xl">{item.emoji}</div>
              <div className="text-left">
                <p className="text-lg font-bold leading-none theme-ink">{item.value}</p>
                <p className="text-[9px] uppercase tracking-wider theme-muted mt-1 font-semibold">{item.label}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── FAMILY ALTAR (KUL DEVATA) ── */}
      {members.some(m => m.profiles?.kul_devata) && (
        <div className="relative glass-panel rounded-[2rem] p-5 border border-[var(--brand-primary)]/10 overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--brand-primary)] opacity-5 blur-2xl" />
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full flex items-center justify-center text-3xl bg-[var(--brand-primary)]/10 border border-[var(--brand-primary)]/20 shadow-inner">
              🪔
            </div>
            <div className="flex-1">
              <p className="text-[10px] uppercase tracking-widest font-bold text-[var(--brand-primary)]">Family Altar</p>
              <h3 className="text-lg font-bold theme-ink premium-serif mt-0.5">
                {members.find(m => m.profiles?.kul_devata)?.profiles?.kul_devata}
              </h3>
              <p className="text-xs theme-muted">Our sacred Kul Devata, protecting this lineage.</p>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 text-[10px] font-bold text-[var(--brand-primary)] uppercase tracking-tighter">
              Protected
            </div>
          </div>
        </div>
      )}
      {/* ── SECTIONS TILES ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <p className="type-card-label">Open a section</p>
          {upcomingEvents[0] ? (
            <Link href="/kul/events" className="text-xs font-semibold theme-ink">
              Next date in {upcomingEvents[0].daysUntil}d
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
          large
        />

        {/* Sanskaras — lifecycle rites */}
        <Link
          href="/kul/sanskara"
          className="group flex items-center gap-4 rounded-[1.6rem] px-4 py-4 transition-all glass-panel"
        >
          <div className="clay-icon-well text-xl flex-shrink-0">🪬</div>
          <div className="flex-1 min-w-0">
            <p className="type-card-label">Lifecycle</p>
            <h3 className="type-card-heading mt-1">16 Sanskaras</h3>
            <p className="type-body mt-0.5">
              Track the sacred rites of passage — from birth to liberation.
            </p>
          </div>
          <ChevronRight size={16} className="theme-dim group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
        </Link>
      </div>
    </div>
  );
}

function KulSectionShell({
  view,
  kul,
  members,
  tasks,
  messages,
  familyMembers,
  kulEvents,
  children,
}: {
  view: KulSectionView;
  kul: KulData;
  members: MemberRow[];
  tasks: TaskRow[];
  messages: MessageRow[];
  familyMembers: FamilyMember[];
  kulEvents: KulEvent[];
  children: ReactNode;
}) {
  const meta = KUL_SECTION_META[view];

  return (
    <div className="space-y-4">
      <Link
        href="/kul"
        className="inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium glass-button-secondary"
        style={{ color: 'var(--brand-primary-strong)' }}>
        <ChevronRight size={14} className="rotate-180" />
        Back to Kul Home
      </Link>

      <div className="clay-card rounded-[1.9rem] p-5">
        <div className="flex items-start gap-4">
          <div className="clay-icon-well text-xl flex-shrink-0">{meta.emoji}</div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-[0.18em] font-semibold" style={{ color: 'rgba(22, 77, 84, 0.72)' }}>
              {kul.name} · {meta.eyebrow}
            </p>
            <h1 className="font-display font-bold text-2xl theme-ink mt-1">{meta.label}</h1>
            <p className="text-sm theme-muted mt-2 leading-relaxed max-w-xl">{meta.description}</p>
          </div>
        </div>
      </div>

      {children}
    </div>
  );
}

function VanshTab({ familyMembers: initial, kulEvents: initialEvents, kulId, userId, myRole, forcedView }: {
  familyMembers: FamilyMember[]; kulEvents: KulEvent[]; kulId: string; userId: string; myRole: 'guardian' | 'sadhak'; forcedView?: 'tree' | 'events';
}) {
  const kulMutations = useKulMutations(userId);
  const canManageVansh = myRole === 'guardian';

  const [members,     setMembers]     = useState(initial);
  const [events,      setEvents]      = useState(initialEvents);
  const [activeView,  setActiveView]  = useState<'tree' | 'events'>(forcedView ?? 'tree');
  const [showAdd,     setShowAdd]     = useState(false);
  const [showAddEvent,setShowAddEvent]= useState(false);
  const [editMember,  setEditMember]  = useState<FamilyMember | null>(null);
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);

  // Form state — add/edit member
  const [form, setForm] = useState({
    name: '', role: '', gender: '', birth_year: '', birth_date: '',
    death_year: '', death_date: '', marriage_date: '',
    parent_id: '', spouse_id: '', generation: '4',
    notes: '', is_alive: true,
  });
  // Linked app user for this family member (null = not on the app)
  const [linkedUser, setLinkedUser] = useState<{ id: string; name: string; username: string | null } | null>(null);
  const [linkUserQuery, setLinkUserQuery] = useState('');
  const [linkUserResults, setLinkUserResults] = useState<{ id: string; full_name: string | null; username: string | null; avatar_url: string | null }[]>([]);
  const [linkUserSearching, setLinkUserSearching] = useState(false);

  // Event form
  const [eForm, setEForm] = useState({
    title: '', event_type: 'custom', event_date: '', description: '', member_id: '', recurring: true,
  });

  useEffect(() => {
    if (forcedView) setActiveView(forcedView);
  }, [forcedView]);

  useEffect(() => {
    setMembers(initial);
  }, [initial]);

  useEffect(() => {
    setEvents(initialEvents);
  }, [initialEvents]);

  function resetForm() {
    setForm({ name:'',role:'',gender:'',birth_year:'',birth_date:'',death_year:'',death_date:'',marriage_date:'',parent_id:'',spouse_id:'',generation:'4',notes:'',is_alive:true });
    setLinkedUser(null);
    setLinkUserQuery('');
    setLinkUserResults([]);
  }

  async function searchAppUsers() {
    if (!linkUserQuery.trim()) return;
    setLinkUserSearching(true);
    const supabase = createClient();
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, username, avatar_url')
      .or(`full_name.ilike.%${linkUserQuery.trim()}%,username.ilike.%${linkUserQuery.trim()}%`)
      .limit(8);
    setLinkUserResults(data ?? []);
    setLinkUserSearching(false);
  }

  function openEdit(m: FamilyMember) {
    setEditMember(m);
    setForm({
      name: m.name, role: m.role ?? '', gender: m.gender ?? '',
      birth_year: m.birth_year ? String(m.birth_year) : '',
      birth_date: m.birth_date ?? '', death_year: m.death_year ? String(m.death_year) : '',
      death_date: m.death_date ?? '', marriage_date: m.marriage_date ?? '',
      parent_id: m.parent_id ?? '', spouse_id: m.spouse_id ?? '',
      generation: m.generation ? String(m.generation) : '4',
      notes: m.notes ?? '', is_alive: m.is_alive,
    });
    // Restore linked user display if already linked
    if (m.linked_user_id) {
      setLinkedUser({ id: m.linked_user_id, name: m.name, username: null });
    } else {
      setLinkedUser(null);
    }
    setLinkUserQuery('');
    setLinkUserResults([]);
    setShowAdd(true);
  }

  function openMemberDetails(member: FamilyMember) {
    setSelectedMember(member);
  }

  async function saveMember() {
    if (!canManageVansh) {
      toast.error('Only Kul guardians can update the Vansh');
      return;
    }
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    try {
      await kulMutations.saveFamilyMember.mutateAsync({
        kulId,
        memberId: editMember?.id,
        name: form.name,
        role: form.role,
        gender: form.gender,
        birth_year: form.birth_year ? parseInt(form.birth_year, 10) : null,
        birth_date: form.birth_date || null,
        death_year: form.death_year ? parseInt(form.death_year, 10) : null,
        death_date: form.death_date || null,
        marriage_date: form.marriage_date || null,
        parent_id: form.parent_id || null,
        spouse_id: form.spouse_id || null,
        generation: parseInt(form.generation, 10) || 4,
        notes: form.notes,
        is_alive: form.is_alive,
        linked_user_id: linkedUser?.id ?? null,
      });
      toast.success(editMember ? 'Member updated 🙏' : 'Member added to Vansh 🙏');
      resetForm(); setEditMember(null); setShowAdd(false);
    } catch (error: any) {
      toast.error(error.message ?? 'Could not save this family member.');
    }
  }

  async function deleteMember(id: string, name: string) {
    if (!canManageVansh) {
      toast.error('Only Kul guardians can remove Vansh members');
      return;
    }
    if (!confirm(`Remove ${name} from the Vansh?`)) return;
    try {
      await kulMutations.deleteFamilyMember.mutateAsync(id);
      setMembers(prev => prev.filter(m => m.id !== id));
      toast.success(`${name} removed`);
    } catch (error: any) {
      toast.error(error.message ?? 'Could not remove this family member.');
    }
  }

  async function saveEvent() {
    if (!canManageVansh) {
      toast.error('Only Kul guardians can create Vansh events');
      return;
    }
    if (!eForm.title.trim() || !eForm.event_date) { toast.error('Title and date required'); return; }
    try {
      await kulMutations.saveEvent.mutateAsync({
        kulId,
        title: eForm.title,
        event_type: eForm.event_type,
        event_date: eForm.event_date,
        description: eForm.description,
        member_id: eForm.member_id || null,
        recurring: eForm.recurring,
      });
      setEForm({ title:'', event_type:'custom', event_date:'', description:'', member_id:'', recurring:true });
      setShowAddEvent(false);
      toast.success('Event added! 📅');
    } catch (error: any) {
      toast.error(error.message ?? 'Could not save this event.');
    }
  }

  // Group members by generation
  const byGen = members.reduce((acc, m) => {
    const g = m.generation ?? 4;
    if (!acc[g]) acc[g] = [];
    acc[g].push(m);
    return acc;
  }, {} as Record<number, FamilyMember[]>);
  const generations = Object.keys(byGen).map(Number).sort((a, b) => a - b);

  // Upcoming events (next 90 days)
  const upcomingEvents = [...events]
    .map(e => ({ ...e, daysUntil: daysUntilNextOccurrence(e.event_date) }))
    .filter(e => e.daysUntil <= 90)
    .sort((a, b) => a.daysUntil - b.daysUntil);

  const selectedParent = selectedMember?.parent_id ? members.find((member) => member.id === selectedMember.parent_id) ?? null : null;
  const selectedSpouse = selectedMember?.spouse_id ? members.find((member) => member.id === selectedMember.spouse_id) ?? null : null;
  const selectedEvents = selectedMember
    ? upcomingEvents.filter((event) => event.member_id === selectedMember.id)
    : [];

  return (
    <div className="space-y-4">
      {selectedMember ? (
        <FamilyLineageSheet
          member={selectedMember}
          parent={selectedParent}
          spouse={selectedSpouse}
          relatedEvents={selectedEvents}
          canManage={canManageVansh}
          onClose={() => setSelectedMember(null)}
          onOpenEvents={() => {
            setSelectedMember(null);
            setActiveView('events');
          }}
          onEdit={canManageVansh ? () => {
            setSelectedMember(null);
            openEdit(selectedMember);
          } : undefined}
        />
      ) : null}
      {/* View toggle + add buttons */}
      <div className="flex items-center gap-2">
        {!forcedView && (
          <div className="surface-tabbar flex rounded-xl p-1 gap-1 flex-1">
            {(['tree', 'events'] as const).map(v => (
              <button key={v} onClick={() => setActiveView(v)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition ${activeView === v ? 'surface-tab-active font-semibold' : 'theme-dim'}`}
                style={activeView === v ? { color: 'var(--text-cream)' } : undefined}>
                {v === 'tree' ? '🫶 Vansh' : `📅 Events (${upcomingEvents.length})`}
              </button>
            ))}
          </div>
        )}
        {canManageVansh ? (
          <button onClick={() => {
            if (activeView === 'events') {
              setShowAddEvent((prev) => !prev);
              return;
            }
            resetForm();
            setEditMember(null);
            setShowAdd(true);
          }}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white flex-shrink-0"
            style={{ background: 'var(--brand-primary)' }}>
            <Plus size={16} />
          </button>
        ) : (
          <div className="px-3 py-2 rounded-xl text-[11px] font-medium flex-shrink-0" style={{ border: '1px solid rgba(200,146,74,0.18)', background: 'rgba(200,146,74,0.08)', color: 'var(--brand-primary-strong)' }}>
            Guardian managed
          </div>
        )}
      </div>

      {!canManageVansh && (
        <div className="surface-soft-card rounded-2xl p-4">
          <p className="text-sm font-semibold theme-ink">Vansh editing is guardian-only</p>
          <p className="text-xs theme-dim mt-1 leading-relaxed">
            Kul guardians can add, update, and remove lineage members and family events. Other members can still view the family tree and upcoming dates.
          </p>
        </div>
      )}

      {/* ── Add / Edit Member form ── */}
      {showAdd && (
        <div className="glass-panel rounded-2xl border border-white/8 p-4 space-y-3 fade-in">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-[color:var(--brand-ink)]">{editMember ? 'Edit Member' : 'Add Family Member'}</p>
            <button onClick={() => { setShowAdd(false); setEditMember(null); resetForm(); }}
              className="w-7 h-7 rounded-full bg-white/6 flex items-center justify-center"><X size={13} className="text-[color:var(--brand-muted)]" /></button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input placeholder="Full name *" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))}
              className="col-span-2 px-3 py-2.5 rounded-xl border border-white/10 focus:border-[color:var(--brand-primary)] outline-none text-sm" />
            <input placeholder="Role (e.g. Dada Ji)" value={form.role} onChange={e => setForm(f => ({...f, role: e.target.value}))}
              className="px-3 py-2.5 rounded-xl border border-white/10 focus:border-[color:var(--brand-primary)] outline-none text-sm" />
            <select value={form.gender} onChange={e => setForm(f => ({...f, gender: e.target.value}))}
              className="px-3 py-2.5 rounded-xl border border-white/10 outline-none text-sm">
              <option value="">Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
            <select value={form.generation} onChange={e => setForm(f => ({...f, generation: e.target.value}))}
              className="col-span-2 px-3 py-2.5 rounded-xl border border-white/10 outline-none text-sm">
              {[1,2,3,4,5,6].map(g => <option key={g} value={g}>Generation {g} — {GENERATION_LABELS[g]?.split('—')[0].trim()}</option>)}
            </select>
          </div>
          {/* Dates */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-[10px] text-[color:var(--brand-muted)] mb-1">Birth Date (exact)</p>
              <input type="date" value={form.birth_date} onChange={e => setForm(f => ({...f, birth_date: e.target.value}))}
                className="w-full px-3 py-2 rounded-xl border border-white/10 outline-none text-sm" />
            </div>
            <div>
              <p className="text-[10px] text-[color:var(--brand-muted)] mb-1">Birth Year (if date unknown)</p>
              <input type="number" placeholder="e.g. 1942" value={form.birth_year} onChange={e => setForm(f => ({...f, birth_year: e.target.value}))}
                className="w-full px-3 py-2 rounded-xl border border-white/10 outline-none text-sm" />
            </div>
            <div>
              <p className="text-[10px] text-[color:var(--brand-muted)] mb-1">Marriage Date</p>
              <input type="date" value={form.marriage_date} onChange={e => setForm(f => ({...f, marriage_date: e.target.value}))}
                className="w-full px-3 py-2 rounded-xl border border-white/10 outline-none text-sm" />
            </div>
            <div>
              <p className="text-[10px] text-[color:var(--brand-muted)] mb-1">Death Date (if applicable)</p>
              <input type="date" value={form.death_date} onChange={e => setForm(f => ({...f, death_date: e.target.value, is_alive: false}))}
                className="w-full px-3 py-2 rounded-xl border border-white/10 outline-none text-sm" />
            </div>
          </div>
          {/* Parent / Spouse links */}
          {members.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              <select value={form.parent_id} onChange={e => setForm(f => ({...f, parent_id: e.target.value}))}
                className="px-3 py-2.5 rounded-xl border border-white/10 outline-none text-sm">
                <option value="">Link parent…</option>
                {members.filter(m => m.id !== editMember?.id).map(m => (
                  <option key={m.id} value={m.id}>{m.name} {m.role ? `(${m.role})` : ''}</option>
                ))}
              </select>
              <select value={form.spouse_id} onChange={e => setForm(f => ({...f, spouse_id: e.target.value}))}
                className="px-3 py-2.5 rounded-xl border border-white/10 outline-none text-sm">
                <option value="">Link spouse…</option>
                {members.filter(m => m.id !== editMember?.id).map(m => (
                  <option key={m.id} value={m.id}>{m.name} {m.role ? `(${m.role})` : ''}</option>
                ))}
              </select>
            </div>
          )}
          {/* Link to existing app user */}
          <div className="space-y-1.5">
            <p className="text-[10px] text-[color:var(--brand-muted)] uppercase tracking-wider">Link to Shoonaya account (optional)</p>
            {linkedUser ? (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/4">
                <span className="text-sm flex-1 text-[color:var(--brand-ink)]">
                  ✓ {linkedUser.name}{linkedUser.username ? ` (@${linkedUser.username})` : ''}
                </span>
                <button onClick={() => { setLinkedUser(null); setLinkUserQuery(''); setLinkUserResults([]); }}
                  className="text-[10px] text-[color:var(--brand-muted)] hover:text-red-400 transition">Remove</button>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="flex gap-2">
                  <input
                    type="text" placeholder="Search by name or @username…"
                    value={linkUserQuery} onChange={e => setLinkUserQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && searchAppUsers()}
                    className="flex-1 px-3 py-2 rounded-xl border border-white/10 focus:border-[color:var(--brand-primary)] outline-none text-sm"
                  />
                  <button onClick={searchAppUsers} disabled={linkUserSearching || !linkUserQuery.trim()}
                    className="px-3 py-2 rounded-xl text-xs font-semibold disabled:opacity-40 transition"
                    style={{ background: 'rgba(200,146,74,0.14)', color: 'var(--brand-primary-strong)' }}>
                    {linkUserSearching ? '…' : 'Find'}
                  </button>
                </div>
                {linkUserResults.length > 0 && (
                  <div className="rounded-xl border border-white/10 divide-y divide-white/6 overflow-hidden">
                    {linkUserResults.map(u => (
                      <button key={u.id}
                        onClick={() => { setLinkedUser({ id: u.id, name: u.full_name || u.username || u.id, username: u.username }); setLinkUserResults([]); setLinkUserQuery(''); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-white/6 transition">
                        <Avatar name={u.full_name || u.username || '?'} url={u.avatar_url} size={7} />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-[color:var(--brand-ink)] truncate">{u.full_name || u.username}</p>
                          {u.username && <p className="text-[10px] text-[color:var(--brand-muted)]">@{u.username}</p>}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {linkUserResults.length === 0 && linkUserQuery && !linkUserSearching && (
                  <p className="text-[11px] text-[color:var(--brand-muted)] px-1">Not on Shoonaya yet — add them and invite later.</p>
                )}
              </div>
            )}
          </div>

          <textarea placeholder="Notes (origin, stories, memories…)" value={form.notes}
            onChange={e => setForm(f => ({...f, notes: e.target.value}))} rows={2}
            className="w-full px-3 py-2 rounded-xl border border-white/10 focus:border-[color:var(--brand-primary)] outline-none resize-none text-sm" />
          <button onClick={saveMember}
            className="w-full py-2.5 text-white font-semibold rounded-xl hover:opacity-90 transition text-sm"
            style={{ background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-primary-strong))' }}>
            {editMember ? 'Save Changes 🙏' : 'Add to Vansh 🙏'}
          </button>
        </div>
      )}

      {/* ── Tree View ── */}
      {activeView === 'tree' && (
        <div className="space-y-6">
          <div className="relative clay-card rounded-[2.2rem] p-6 overflow-hidden">
            {/* Traditional Heritage Background Accents */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-[var(--brand-primary)] opacity-[0.04] blur-[60px]" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-[var(--brand-earth)] opacity-[0.06] blur-[40px] rounded-full" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg" 
                  style={{ background: 'rgba(200, 146, 74, 0.12)', border: '1px solid rgba(200, 146, 74, 0.2)' }}>
                  🌳
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--brand-primary-strong)' }}>
                    Kul Vriksha — कुल वृक्ष
                  </p>
                  <h3 className="font-display text-xl font-bold theme-ink mt-0.5">The Living Vansh Lineage</h3>
                </div>
              </div>
              
              <p className="text-sm theme-muted leading-relaxed max-w-xl">
                Your family heritage is a sacred thread connecting past, present, and future. 
                Hold your lineage like a wall of keepsakes—each card a living memory of those who paved the path.
              </p>
            </div>
          </div>

          {members.length === 0 && !showAdd && (
            <div className="clay-card rounded-[2.2rem] text-center py-16 px-6 text-[color:var(--brand-muted)] border-dashed border-2 border-black/[0.04]">
              <div className="mx-auto max-w-[12rem] mb-6">
                <div className="clay-portrait-stage">
                  <div className="clay-memory-orbit scale-110" />
                  <div
                    className="clay-memory-medallion"
                    style={{ background: 'linear-gradient(145deg, rgba(200, 146, 74, 0.18), rgba(122, 26, 26, 0.12))' }}>
                    <div
                      className="clay-memory-medallion-inner"
                      style={{ background: 'linear-gradient(145deg, #fdfaf5, #f5f0e5)' }}>
                      <span className="font-display text-2xl font-bold" style={{ color: 'var(--brand-primary-strong)' }}>
                        वं
                      </span>
                    </div>
                  </div>
                  <div className="clay-memory-badge mt-4" style={{ color: 'var(--brand-primary-strong)' }}>
                    Begin your heritage wall
                  </div>
                </div>
              </div>
              <h4 className="text-lg font-bold theme-ink">A Vansh yet to be written</h4>
              <p className="text-xs mt-2 theme-muted max-w-xs mx-auto">Add your parents, grandparents, and ancestors to create your family&apos;s spiritual map.</p>
            </div>
          )}
          {generations.map(gen => (
            <div key={gen} className="clay-lineage-rail">
              <p className="text-[10px] font-semibold theme-dim uppercase tracking-wider mb-3 px-1">
                {GENERATION_LABELS[gen] ?? `Generation ${gen}`}
              </p>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {byGen[gen].map(m => {
                  const parent = m.parent_id ? members.find(p => p.id === m.parent_id) : null;
                  const spouse = m.spouse_id ? members.find(s => s.id === m.spouse_id) : null;
                  const age    = m.birth_date
                    ? Math.floor((Date.now() - new Date(m.birth_date).getTime()) / (365.25 * 86400000))
                    : m.birth_year ? new Date().getFullYear() - m.birth_year : null;
                  return (
                    <div
                      key={m.id}
                      onClick={() => openMemberDetails(m)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          openMemberDetails(m);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      className="clay-portrait-card flex-shrink-0 w-[10.5rem] rounded-[2rem] p-4 text-center relative transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]"
                      style={{
                        background: 'linear-gradient(150deg, #fdfcf9 0%, #f7f3ed 100%)',
                        boxShadow: '0 8px 24px rgba(60, 45, 30, 0.08), inset 0 2px 4px rgba(255,255,255,0.8)'
                      }}
                    >
                      <FamilyKeepsakeStage member={m} />
                      
                      <div className="mt-4 space-y-1">
                        <p className="text-[13px] font-bold theme-ink leading-tight tracking-tight">{m.name}</p>
                        {m.role && (
                          <p className="text-[10px] font-bold uppercase tracking-[0.1em]" style={{ color: 'var(--brand-primary)' }}>
                            {m.role}
                          </p>
                        )}
                      </div>

                      {/* Tactile divider */}
                      <div className="w-8 h-[1px] mx-auto my-3 opacity-20" style={{ background: 'var(--brand-primary)' }} />

                      <div className="text-[10px] theme-dim space-y-1 leading-relaxed italic">
                        {age !== null && (
                          <p className="font-medium">
                            {m.is_alive 
                              ? `Ayush: ${age}y` 
                              : `${m.birth_year ?? '—'} ~ ${m.death_year ?? '—'}`}
                          </p>
                        )}
                        {spouse && <p className="truncate px-1">💍 {spouse.name}</p>}
                      </div>
                      
                      {/* Pressed-clay footer marker */}
                      <div className="mt-4 pt-3 border-t border-black/[0.03] flex items-center justify-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--brand-primary)', opacity: 0.3 }} />
                        <span className="text-[9px] font-extrabold uppercase tracking-widest" style={{ color: 'var(--brand-primary-strong)', opacity: 0.6 }}>
                          Vansh
                        </span>
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--brand-primary)', opacity: 0.3 }} />
                      </div>
                      {/* Edit button */}
                      {canManageVansh && (
                        <div className="flex gap-1 mt-2 justify-center">
                          <button type="button" onClick={(e) => { e.stopPropagation(); openEdit(m); }}
                            className="px-2 py-1 rounded-lg text-[10px] border border-white/10 theme-dim transition"
                            style={{ boxShadow: '0 4px 10px rgba(90, 61, 43, 0.06)' }}>
                            Edit
                          </button>
                          <button type="button" onClick={(e) => { e.stopPropagation(); deleteMember(m.id, m.name); }}
                            className="px-2 py-1 rounded-lg text-[10px] border border-white/10 text-[color:var(--brand-muted)] hover:border-red-300 hover:text-red-500 transition">
                            ✕
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Events View ── */}
      {activeView === 'events' && (
        <div className="space-y-3">
          {canManageVansh && (
            <button onClick={() => setShowAddEvent(!showAddEvent)}
              className="w-full glass-panel border border-dashed border-[color:var(--brand-primary)]/30 rounded-2xl p-3 flex items-center gap-3 text-[color:var(--brand-muted)] hover:border-[color:var(--brand-primary)]/50 hover:text-[color:var(--brand-primary-strong)] transition">
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(200,146,74,0.10)' }}>
                <Plus size={14} style={{ color: 'var(--brand-primary)' }} />
              </div>
              <span className="text-sm">Add event, puja date, anniversary…</span>
            </button>
          )}

          {showAddEvent && (
            <div className="glass-panel rounded-2xl border border-white/8 p-4 space-y-3 fade-in">
              <div className="flex gap-2 flex-wrap">
                {['birthday','anniversary','death_anniversary','puja','custom'].map(t => (
                  <button key={t} onClick={() => setEForm(f => ({...f, event_type: t}))}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition ${eForm.event_type === t ? 'bg-[#7B1A1A]/10 text-[color:var(--brand-primary-strong)] border border-[color:var(--brand-primary)]/30' : 'bg-white/4 text-[color:var(--brand-muted)] border border-white/10'}`}>
                    {EVENT_EMOJI[t]} {t.replace('_', ' ')}
                  </button>
                ))}
              </div>
              <input placeholder="Event title *" value={eForm.title} onChange={e => setEForm(f => ({...f, title: e.target.value}))}
                className="w-full px-3 py-2.5 rounded-xl border border-white/10 focus:border-[color:var(--brand-primary)] outline-none text-sm" />
              <div className="grid grid-cols-2 gap-2">
                <input type="date" value={eForm.event_date} onChange={e => setEForm(f => ({...f, event_date: e.target.value}))}
                  className="px-3 py-2.5 rounded-xl border border-white/10 outline-none text-sm" />
                <select value={eForm.member_id} onChange={e => setEForm(f => ({...f, member_id: e.target.value}))}
                  className="px-3 py-2.5 rounded-xl border border-white/10 outline-none text-sm">
                  <option value="">Link to member…</option>
                  {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm text-[color:var(--brand-muted)]">
                <input type="checkbox" checked={eForm.recurring} onChange={e => setEForm(f => ({...f, recurring: e.target.checked}))} className="rounded" />
                Repeat every year
              </label>
              <textarea placeholder="Optional notes…" value={eForm.description} onChange={e => setEForm(f => ({...f, description: e.target.value}))} rows={2}
                className="w-full px-3 py-2 rounded-xl border border-white/10 focus:border-[color:var(--brand-primary)] outline-none resize-none text-sm" />
              <button onClick={saveEvent}
                className="w-full py-2.5 text-white font-semibold rounded-xl hover:opacity-90 transition text-sm"
                style={{ background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-primary-strong))' }}>
                Save Event 🙏
              </button>
            </div>
          )}

          {upcomingEvents.length === 0 && (
            <div className="text-center py-12 text-[color:var(--brand-muted)]">
              <div className="text-4xl mb-3">📅</div>
              <p className="text-sm">No upcoming events in the next 90 days</p>
              <p className="text-xs mt-1">Add birthdays, anniversaries, and puja dates above</p>
            </div>
          )}

          {upcomingEvents.map(ev => (
            <div key={ev.id} className="rounded-2xl border border-white/8 p-3 flex items-center gap-3" style={{ background: 'rgba(28, 22, 14, 0.92)' }}>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ background: '#7B1A1A0D' }}>
                {EVENT_EMOJI[ev.event_type] ?? '📅'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[color:var(--brand-ink)]">{ev.title}</p>
                <p className="text-xs text-[color:var(--brand-muted)] truncate">
                  {new Date(ev.event_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })}
                  {ev.member && ` · ${ev.member.name}`}
                  {ev.recurring && ' · Annual'}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                {ev.daysUntil === 0 ? (
                  <span className="text-xs font-medium px-2 py-1 rounded-full text-[#1c1c1a]" style={{ background: 'var(--brand-primary)' }}>Today</span>
                ) : ev.daysUntil === 1 ? (
                  <span className="text-xs font-medium" style={{ color: 'var(--brand-primary-strong)' }}>Tomorrow</span>
                ) : ev.daysUntil <= 7 ? (
                  <span className="text-xs font-medium" style={{ color: 'var(--brand-primary-strong)' }}>In {ev.daysUntil}d</span>
                ) : (
                  <span className="text-xs text-[color:var(--brand-muted)]">{ev.daysUntil}d</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function KulClient({ userId, userName, userProfile, kul, members, tasks, messages, familyMembers, kulEvents, myRole, view = 'hub' }: Props) {
  const kulQuery = useKulQuery(userId, {
    userId,
    userName,
    userProfile,
    kul,
    members,
    tasks,
    messages,
    familyMembers,
    kulEvents,
    myRole,
  });
  const kulMutations = useKulMutations(userId);
  const [editingName,  setEditingName]  = useState(false);
  const [newKulName,   setNewKulName]   = useState(kul?.name ?? '');
  const [savingName,   setSavingName]   = useState(false);
  const data = kulQuery.data ?? {
    userId,
    userName,
    userProfile,
    kul,
    members,
    tasks,
    messages,
    familyMembers,
    kulEvents,
    myRole,
  };

  useEffect(() => {
    setNewKulName(data.kul?.name ?? '');
  }, [data.kul?.name]);

  if (kulQuery.isPending && !kulQuery.data) {
    return (
      <AsyncStateCard
        state="loading"
        title="Loading your Kul"
        description="Gathering family members, tasks, sabha, and upcoming dates."
      />
    );
  }

  if (kulQuery.isError && !kulQuery.data) {
    return (
      <AsyncStateCard
        state="error"
        title="Kul could not load"
        description="Family data did not come through cleanly. Try refreshing in a moment."
      />
    );
  }

  if (!data.kul) {
    return <NoKulPrompt userId={userId} userName={userName} />;
  }

  const liveKul = data.kul;

  async function saveKulName() {
    const trimmed = newKulName.trim();
    if (!trimmed) { toast.error('Kul name cannot be empty'); return; }
    if (trimmed === liveKul.name) { setEditingName(false); return; }
    setSavingName(true);
    try {
      await kulMutations.renameKul.mutateAsync({ kulId: liveKul.id, name: trimmed });
      toast.success(`Kul renamed to "${trimmed}" 🙏`);
      setEditingName(false);
    } catch (error: any) {
      toast.error(error.message ?? 'Could not rename the Kul.');
    } finally {
      setSavingName(false);
    }
  }

  const renderSection = () => {
    switch (view) {
      case 'hub':
        return (
          <KulHubView
            kul={liveKul}
            members={data.members}
            tasks={data.tasks}
            messages={data.messages}
            familyMembers={data.familyMembers}
            kulEvents={data.kulEvents}
            myRole={data.myRole}
            editingName={editingName}
            newKulName={newKulName}
            setNewKulName={setNewKulName}
            setEditingName={setEditingName}
            saveKulName={saveKulName}
            savingName={savingName}
          />
        );
      case 'members':
        return (
          <KulSectionShell
            view={view}
            kul={liveKul}
            members={data.members}
            tasks={data.tasks}
            messages={data.messages}
            familyMembers={data.familyMembers}
            kulEvents={data.kulEvents}
          >
            <MembersTab members={data.members} userId={userId} myRole={data.myRole} kul={liveKul} />
          </KulSectionShell>
        );
      case 'tasks':
        return (
          <KulSectionShell
            view={view}
            kul={liveKul}
            members={data.members}
            tasks={data.tasks}
            messages={data.messages}
            familyMembers={data.familyMembers}
            kulEvents={data.kulEvents}
          >
            <TasksTab tasks={data.tasks} members={data.members} userId={userId} myRole={data.myRole} kulId={liveKul.id} />
          </KulSectionShell>
        );
      case 'sabha':
        return (
          <KulSectionShell
            view={view}
            kul={liveKul}
            members={data.members}
            tasks={data.tasks}
            messages={data.messages}
            familyMembers={data.familyMembers}
            kulEvents={data.kulEvents}
          >
            <SabhaTab messages={data.messages} userId={userId} kulId={liveKul.id} userName={data.userName} />
          </KulSectionShell>
        );
      case 'vansh':
        return (
          <KulSectionShell
            view={view}
            kul={liveKul}
            members={data.members}
            tasks={data.tasks}
            messages={data.messages}
            familyMembers={data.familyMembers}
            kulEvents={data.kulEvents}
          >
            <VanshTab familyMembers={data.familyMembers} kulEvents={data.kulEvents} kulId={liveKul.id} userId={userId} myRole={data.myRole} forcedView="tree" />
          </KulSectionShell>
        );
      case 'events':
        return (
          <KulSectionShell
            view={view}
            kul={liveKul}
            members={data.members}
            tasks={data.tasks}
            messages={data.messages}
            familyMembers={data.familyMembers}
            kulEvents={data.kulEvents}
          >
            <VanshTab familyMembers={data.familyMembers} kulEvents={data.kulEvents} kulId={liveKul.id} userId={userId} myRole={data.myRole} forcedView="events" />
          </KulSectionShell>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4 pb-2 fade-in">{renderSection()}</div>
  );
}
