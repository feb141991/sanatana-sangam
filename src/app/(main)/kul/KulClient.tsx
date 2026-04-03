'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  Users, MessageSquare, CheckSquare, Heart, Plus, X, Copy,
  Send, Crown, Shield, ChevronRight, Flame, Star, Pencil,
  Check, ClipboardList, Share2,
} from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { getInitials } from '@/lib/utils';

// ── Types ────────────────────────────────────────────────────────────────────
type KulData   = { id: string; name: string; invite_code: string; avatar_emoji: string; created_by: string; created_at: string };
type MemberRow = { id: string; role: 'guardian' | 'sadhak'; joined_at: string; user_id: string; profiles: { id: string; full_name: string | null; username: string | null; avatar_url: string | null; tradition: string | null; sampradaya: string | null; shloka_streak: number | null; spiritual_level: string | null } };
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
    <div className={`${s} rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 overflow-hidden`}
      style={{ background: gradient }}>
      {url ? <img src={url} className="w-full h-full object-cover" alt="" /> : getInitials(name || '?')}
    </div>
  );
}

function TaskBadge({ type }: { type: string }) {
  const t = TASK_TYPES[type] ?? { label: type, emoji: '📌' };
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-orange-50 text-orange-700 border border-orange-100">
      {t.emoji} {t.label}
    </span>
  );
}

function FamilyKeepsakeStage({ member }: { member: FamilyMember }) {
  const initials = getInitials(member.name || '?');
  const medallionRing = member.is_alive
    ? 'linear-gradient(145deg, rgba(31, 107, 114, 0.22), rgba(195, 135, 47, 0.26))'
    : 'linear-gradient(145deg, rgba(95, 82, 72, 0.16), rgba(125, 138, 139, 0.22))';
  const medallionFill = member.is_alive
    ? 'linear-gradient(145deg, rgba(247, 243, 235, 0.98), rgba(226, 239, 239, 0.96))'
    : 'linear-gradient(145deg, rgba(242, 238, 233, 0.98), rgba(230, 235, 235, 0.96))';
  const statusTone = member.is_alive ? 'var(--brand-primary-strong)' : 'var(--brand-earth)';
  const railTone = member.is_alive ? 'rgba(22, 77, 84, 0.72)' : 'rgba(95, 82, 72, 0.72)';
  const branchLabel = member.parent_id ? 'Linked branch' : 'Root branch';

  return (
    <div className="clay-portrait-stage">
      <div className="clay-memory-orbit" />
      <div className="clay-memory-medallion" style={{ background: medallionRing }}>
        <div className="clay-memory-medallion-inner" style={{ background: medallionFill }}>
          {member.photo_url ? (
            <img src={member.photo_url} className="w-full h-full object-cover rounded-[1.2rem]" alt={`${member.name} keepsake`} />
          ) : (
            <span className="font-display text-lg font-bold tracking-[0.16em]" style={{ color: statusTone }}>
              {initials}
            </span>
          )}
        </div>
      </div>
      <div className="clay-memory-badge" style={{ color: statusTone }}>
        {member.is_alive ? 'Living memory' : 'In remembrance'}
      </div>
      <div className="absolute inset-x-3 bottom-2 flex items-center justify-between text-[10px] font-medium" style={{ color: railTone }}>
        <span>{branchLabel}</span>
        <span>{member.generation ? `Gen ${member.generation}` : 'Kul'}</span>
      </div>
    </div>
  );
}

// ── No-Kul Prompt (Create / Join) ────────────────────────────────────────────
function NoKulPrompt({ userId, userName }: { userId: string; userName: string }) {
  const supabase = createClient();
  const router   = useRouter();

  const [tab,       setTab]       = useState<'create' | 'join'>('create');
  const [kulName,   setKulName]   = useState('');
  const [emoji,     setEmoji]     = useState('🏡');
  const [joinCode,  setJoinCode]  = useState('');
  const [saving,    setSaving]    = useState(false);

  async function createKul() {
    if (!kulName.trim()) { toast.error('Give your Kul a name 🙏'); return; }
    setSaving(true);
    // Single atomic RPC — creates kul + adds guardian member + updates profile.kul_id
    // Avoids the RLS ordering bug where .select() after insert fails because
    // auth_kul_id() still returns null before the profile is updated.
    const { data, error } = await supabase.rpc('create_kul', {
      p_name:        kulName.trim(),
      p_emoji:       emoji,
      p_invite_code: generateInviteCode(),
    });
    if (error) { toast.error(error.message); setSaving(false); return; }
    toast.success(`${emoji} ${kulName} created! Welcome, Guardian 🙏`);
    router.refresh();
  }

  async function joinKul() {
    const code = joinCode.trim().toUpperCase();
    if (code.length < 4) { toast.error('Enter the 6-character invite code'); return; }
    setSaving(true);
    // Single atomic RPC — looks up kul by invite code + adds sadhak + updates profile.kul_id
    // The previous approach couldn't look up the kul because SELECT RLS blocks
    // users who aren't yet in any kul (auth_kul_id() returns null for them).
    const { data, error } = await supabase.rpc('join_kul', { p_invite_code: code });
    if (error) { toast.error(error.message); setSaving(false); return; }
    const kul = data as { avatar_emoji: string; name: string } | null;
    toast.success(`${kul?.avatar_emoji ?? '🏡'} Joined ${kul?.name ?? 'Kul'}! Jai Ho 🙏`);
    router.refresh();
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center space-y-6 fade-in">
      <div className="w-24 h-24 rounded-full flex items-center justify-center text-5xl"
        style={{ background: 'linear-gradient(135deg, rgba(31, 107, 114, 0.12), rgba(195, 135, 47, 0.14))' }}>
        🏡
      </div>
      <div>
        <h1 className="font-display font-bold text-3xl text-gray-900 mb-2">Kul</h1>
        <p className="font-semibold text-sm mb-3" style={{ color: 'var(--brand-primary)' }}>कुल — Your Family Sangam</p>
        <p className="text-gray-500 max-w-sm text-sm leading-relaxed">
          A private space for your family to learn, practice dharma together — tasks, streaks, chat, and more.
        </p>
      </div>

      {/* Tab selector */}
      <div className="flex bg-gray-100 rounded-2xl p-1 w-full max-w-sm">
        {(['create', 'join'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${tab === t ? 'bg-white shadow-sm font-semibold' : 'text-gray-500'}`}
            style={tab === t ? { color: 'var(--brand-primary)' } : undefined}>
            {t === 'create' ? '✨ Create Kul' : '🔗 Join Kul'}
          </button>
        ))}
      </div>

      {tab === 'create' ? (
        <div className="bg-white rounded-2xl border border-orange-100 shadow-sm p-5 w-full max-w-sm space-y-4">
          {/* Emoji picker */}
          <div>
            <p className="text-xs text-gray-400 mb-2 font-medium">Choose your Kul symbol</p>
            <div className="flex gap-2 flex-wrap justify-center">
              {KUL_EMOJIS.map(e => (
                <button key={e} onClick={() => setEmoji(e)}
                  className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition ${emoji === e ? 'border-2 border-[color:var(--brand-primary)]' : 'border border-gray-100 hover:border-orange-200'}`}
                  style={emoji === e ? { background: 'rgba(31, 107, 114, 0.08)' } : undefined}>
                  {e}
                </button>
              ))}
            </div>
          </div>
          <input type="text" placeholder="Name your Kul (e.g. Sharma Parivar)"
            value={kulName} onChange={e => setKulName(e.target.value)}
            maxLength={40}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[color:var(--brand-primary)] outline-none text-sm" />
          <button onClick={createKul} disabled={saving || !kulName.trim()}
            className="w-full py-3 text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition"
            style={{ background: 'var(--brand-primary)' }}>
            {saving ? 'Creating…' : `Create ${emoji} ${kulName || 'My Kul'} 🙏`}
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-orange-100 shadow-sm p-5 w-full max-w-sm space-y-4">
          <p className="text-sm text-gray-500 text-left">Enter the 6-character invite code from your family guardian.</p>
          <input type="text" placeholder="e.g. AB12CD"
            value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())}
            maxLength={6}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[color:var(--brand-primary)] outline-none text-sm tracking-widest font-bold text-center text-2xl uppercase" />
          <button onClick={joinKul} disabled={saving || joinCode.length < 4}
            className="w-full py-3 text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition"
            style={{ background: 'var(--brand-primary)' }}>
            {saving ? 'Joining…' : 'Join Kul 🙏'}
          </button>
        </div>
      )}

      <p className="text-xs text-gray-400">
        Want this sooner? Share the app with your family 🙏
      </p>
    </div>
  );
}

// ── Board Tab ────────────────────────────────────────────────────────────────
function BoardTab({ kul, members, tasks, userId, myRole }: {
  kul: KulData; members: MemberRow[]; tasks: TaskRow[]; userId: string; myRole: string;
}) {
  const totalTasks     = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const pendingTasks   = totalTasks - completedTasks;
  const totalStreak    = members.reduce((s, m) => s + (m.profiles?.shloka_streak ?? 0), 0);

  async function copyCode() {
    try { await navigator.clipboard.writeText(kul.invite_code); toast.success('Invite code copied!'); }
    catch { toast.error('Could not copy'); }
  }

  async function shareKul() {
    const text = `Join our Kul "${kul.name}" on Sanatana Sangam!\nUse invite code: ${kul.invite_code}`;
    if (navigator.share) { try { await navigator.share({ title: kul.name, text }); return; } catch {} }
    await navigator.clipboard.writeText(text);
    toast.success('Invite message copied!');
  }

  return (
    <div className="space-y-4">
      {/* Kul header card */}
      <div className="rounded-2xl p-5 text-white" style={{ background: 'linear-gradient(135deg, var(--brand-primary-strong), var(--brand-primary))' }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl bg-white/10">
            {kul.avatar_emoji}
          </div>
          <div className="flex-1">
            <h2 className="font-display font-bold text-xl">{kul.name}</h2>
            <p className="text-white/60 text-xs mt-0.5">{members.length} member{members.length !== 1 ? 's' : ''} · {myRole === 'guardian' ? '👑 Guardian' : '🙏 Sadhak'}</p>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Members', value: members.length, emoji: '👨‍👩‍👧‍👦' },
            { label: 'Kul Streak', value: totalStreak, emoji: '🔥' },
            { label: 'Tasks Due', value: pendingTasks, emoji: '📋' },
          ].map(({ label, value, emoji }) => (
            <div key={label} className="rounded-xl px-3 py-2 text-center" style={{ background: 'rgba(255,255,255,0.12)' }}>
              <div className="text-lg">{emoji}</div>
              <div className="font-bold text-lg">{value}</div>
              <div className="text-white/60 text-[10px]">{label}</div>
            </div>
          ))}
        </div>

        {/* Invite row */}
        <div className="mt-3 flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.12)' }}>
            <span className="text-xs text-white/70">Code:</span>
            <span className="font-bold tracking-widest text-white text-sm">{kul.invite_code}</span>
          </div>
          <button onClick={copyCode}  className="w-9 h-9 rounded-xl flex items-center justify-center transition" style={{ background: 'rgba(255,255,255,0.18)' }}><Copy size={14} color="white" /></button>
          <button onClick={shareKul} className="w-9 h-9 rounded-xl flex items-center justify-center transition" style={{ background: 'rgba(255,255,255,0.18)' }}><Share2 size={14} color="white" /></button>
        </div>
      </div>

      {/* Member streaks */}
      <div>
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-2">Sadhana Streaks</p>
        <div className="space-y-2">
          {[...members].sort((a, b) => (b.profiles?.shloka_streak ?? 0) - (a.profiles?.shloka_streak ?? 0)).map(m => {
            const p = m.profiles;
            const streak = p?.shloka_streak ?? 0;
            return (
              <div key={m.id} className="bg-white rounded-2xl border border-gray-100 p-3 flex items-center gap-3">
                <Avatar name={p?.full_name || p?.username || '?'} url={p?.avatar_url} size={10}
                  gradient={m.user_id === userId ? 'var(--brand-primary)' : 'linear-gradient(135deg, var(--brand-accent), #d6b06a)'} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold text-gray-900 truncate">{p?.full_name || p?.username}</p>
                    {m.role === 'guardian' && <Crown size={11} className="text-amber-500 flex-shrink-0" />}
                    {m.user_id === userId && <span className="text-[10px]" style={{ color: 'var(--brand-primary)' }}>(you)</span>}
                  </div>
                  <p className="text-xs text-gray-400">{p?.spiritual_level ?? 'Seeker'} · {TRADITION_EMOJI[p?.tradition ?? ''] ?? '🙏'}</p>
                </div>
                <div className="text-right">
                  <div className="font-bold text-sm flex items-center gap-1">
                    <Flame size={13} className="text-orange-500" />
                    <span style={{ color: streak > 0 ? '#ea580c' : '#9ca3af' }}>{streak}</span>
                  </div>
                  <div className="text-[10px] text-gray-400">streak</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pending tasks summary */}
      {pendingTasks > 0 && (
        <div>
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-2">Pending Tasks</p>
          <div className="space-y-2">
            {tasks.filter(t => !t.completed).slice(0, 3).map(task => (
              <div key={task.id} className="bg-white rounded-2xl border border-orange-100 p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center text-base flex-shrink-0">
                  {TASK_TYPES[task.task_type]?.emoji ?? '📌'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                  <p className="text-xs text-gray-400 truncate">
                    → {task.assigned_to_profile?.full_name || task.assigned_to_profile?.username}
                    {task.due_date && ` · due ${new Date(task.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`}
                  </p>
                </div>
              </div>
            ))}
            {pendingTasks > 3 && (
              <p className="text-xs text-center text-gray-400">+{pendingTasks - 3} more tasks in the Tasks tab</p>
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
  const supabase = createClient();
  const router   = useRouter();

  async function promote(memberId: string, kulId: string) {
    await supabase.from('kul_members').update({ role: 'guardian' }).eq('id', memberId);
    toast.success('Member promoted to Guardian 👑');
    router.refresh();
  }

  async function remove(memberId: string, memberName: string) {
    if (!confirm(`Remove ${memberName} from the Kul?`)) return;
    await supabase.from('kul_members').delete().eq('id', memberId);
    toast.success(`${memberName} removed`);
    router.refresh();
  }

  return (
    <div className="space-y-2">
      {members.map(m => {
        const p     = m.profiles;
        const isMe  = m.user_id === userId;
        const name  = p?.full_name || p?.username || 'Member';
        return (
          <div key={m.id} className={`bg-white rounded-2xl border p-3 flex items-center gap-3 ${isMe ? 'border-[#7B1A1A]/30' : 'border-gray-100'}`}>
            <Avatar name={name} url={p?.avatar_url} size={11}
              gradient={isMe ? '#7B1A1A' : 'linear-gradient(135deg, #ff7722, #d4a017)'} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-semibold text-gray-900 truncate">{name}</p>
                {m.role === 'guardian' && <Crown size={12} className="text-amber-500 flex-shrink-0" />}
                {isMe && <span className="text-[10px] text-[#7B1A1A] font-medium">(you)</span>}
              </div>
              <p className="text-xs text-gray-400">
                {m.role === 'guardian' ? '👑 Guardian' : '🙏 Sadhak'}
                {p?.tradition && ` · ${TRADITION_EMOJI[p.tradition] ?? ''}`}
                {p?.shloka_streak ? ` · 🔥 ${p.shloka_streak}` : ''}
              </p>
            </div>
            {/* Guardian actions */}
            {myRole === 'guardian' && !isMe && (
              <div className="flex items-center gap-1">
                {m.role === 'sadhak' && (
                  <button onClick={() => promote(m.id, kul.id)}
                    className="px-2 py-1 text-[10px] font-medium rounded-lg border border-amber-200 text-amber-600 hover:bg-amber-50 transition">
                    Promote
                  </button>
                )}
                <button onClick={() => remove(m.id, name)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 transition">
                  <X size={12} />
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Tasks Tab ─────────────────────────────────────────────────────────────────
function TasksTab({ tasks, members, userId, myRole, kulId }: {
  tasks: TaskRow[]; members: MemberRow[]; userId: string; myRole: string; kulId: string;
}) {
  const supabase = createClient();
  const router   = useRouter();

  const [showCompose, setShowCompose] = useState(false);
  const [title,       setTitle]       = useState('');
  const [taskType,    setTaskType]    = useState('read');
  const [assignTo,    setAssignTo]    = useState('');
  const [dueDate,     setDueDate]     = useState('');
  const [description, setDescription] = useState('');
  const [saving,      setSaving]      = useState(false);

  const myTasks    = tasks.filter(t => t.assigned_to === userId);
  const otherTasks = tasks.filter(t => t.assigned_to !== userId);

  async function assignTask() {
    if (!title.trim() || !assignTo) { toast.error('Fill in title and assignee'); return; }
    setSaving(true);
    const { error } = await supabase.from('kul_tasks').insert({
      kul_id: kulId, assigned_by: userId, assigned_to: assignTo,
      title: title.trim(), description: description.trim() || null,
      task_type: taskType, due_date: dueDate || null,
    });
    if (error) { toast.error(error.message); setSaving(false); return; }
    toast.success('Task assigned! 📋');
    setTitle(''); setDescription(''); setAssignTo(''); setDueDate('');
    setShowCompose(false);
    router.refresh();
  }

  async function completeTask(taskId: string) {
    await supabase.from('kul_tasks').update({ completed: true, completed_at: new Date().toISOString() }).eq('id', taskId);
    toast.success('Task completed! 🎉 +10 seva');
    // Award seva points
    const { data: prof } = await supabase.from('profiles').select('seva_score').eq('id', userId).single();
    if (prof) await supabase.from('profiles').update({ seva_score: (prof.seva_score ?? 0) + 10 }).eq('id', userId);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {/* Assign button for guardians */}
      {myRole === 'guardian' && (
        <button onClick={() => setShowCompose(!showCompose)}
          className="w-full bg-white border border-dashed border-[#7B1A1A]/30 rounded-2xl p-3 flex items-center gap-3 text-gray-400 hover:border-[#7B1A1A]/50 hover:text-[#7B1A1A] transition">
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: '#7B1A1A15' }}>
            <Plus size={15} style={{ color: '#7B1A1A' }} />
          </div>
          <span className="text-sm">Assign a sadhana task…</span>
        </button>
      )}

      {/* Compose panel */}
      {showCompose && (
        <div className="bg-white rounded-2xl border border-orange-100 p-4 shadow-sm space-y-3 fade-in">
          <p className="text-sm font-semibold text-gray-800">Assign New Task</p>
          {/* Task type */}
          <div className="flex gap-2 flex-wrap">
            {Object.entries(TASK_TYPES).map(([k, v]) => (
              <button key={k} onClick={() => setTaskType(k)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition ${taskType === k ? 'bg-[#7B1A1A]/10 text-[#7B1A1A] border border-[#7B1A1A]/30' : 'bg-gray-50 text-gray-500 border border-gray-200'}`}>
                {v.emoji} {v.label}
              </button>
            ))}
          </div>
          <input type="text" placeholder="Task title (e.g. Recite Gayatri Mantra 3 times)"
            value={title} onChange={e => setTitle(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#7B1A1A] outline-none text-sm" />
          <textarea placeholder="Optional description / guidance…"
            value={description} onChange={e => setDescription(e.target.value)} rows={2}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#7B1A1A] outline-none resize-none text-sm" />
          <div className="grid grid-cols-2 gap-2">
            <select value={assignTo} onChange={e => setAssignTo(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-gray-200 focus:border-[#7B1A1A] outline-none text-sm">
              <option value="">Assign to…</option>
              {members.filter(m => m.user_id !== userId).map(m => (
                <option key={m.user_id} value={m.user_id}>
                  {m.profiles?.full_name || m.profiles?.username || 'Member'}
                </option>
              ))}
            </select>
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-gray-200 focus:border-[#7B1A1A] outline-none text-sm" />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowCompose(false)} className="px-4 py-2 text-sm text-gray-500">Cancel</button>
            <button onClick={assignTask} disabled={saving || !title.trim() || !assignTo}
              className="px-5 py-2 text-white text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition"
              style={{ background: '#7B1A1A' }}>
              {saving ? 'Assigning…' : 'Assign Task 🙏'}
            </button>
          </div>
        </div>
      )}

      {/* My tasks */}
      {myTasks.length > 0 && (
        <div>
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-2">My Tasks</p>
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
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-2">Assigned Tasks</p>
          <div className="space-y-2">
            {otherTasks.map(task => (
              <TaskCard key={task.id} task={task} isMyTask={false} userId={userId} onComplete={completeTask} />
            ))}
          </div>
        </div>
      )}

      {tasks.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <ClipboardList size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">{myRole === 'guardian' ? 'Assign the first sadhana task' : 'No tasks assigned yet'}</p>
        </div>
      )}
    </div>
  );
}

function TaskCard({ task, isMyTask, userId, onComplete }: {
  task: TaskRow; isMyTask: boolean; userId: string; onComplete: (id: string) => void;
}) {
  const assignee = task.assigned_to_profile;
  return (
    <div className={`bg-white rounded-2xl border p-3 flex items-start gap-3 ${task.completed ? 'border-green-100 opacity-70' : 'border-orange-100'}`}>
      <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0"
        style={{ background: task.completed ? '#f0fdf4' : '#fff8f0' }}>
        {task.completed ? '✅' : (TASK_TYPES[task.task_type]?.emoji ?? '📌')}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className={`text-sm font-medium ${task.completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>{task.title}</p>
            {task.description && <p className="text-xs text-gray-400 mt-0.5 leading-snug">{task.description}</p>}
          </div>
          {isMyTask && !task.completed && (
            <button onClick={() => onComplete(task.id)}
              className="flex-shrink-0 px-3 py-1.5 text-xs font-semibold rounded-full text-white hover:opacity-90 transition"
              style={{ background: '#7B1A1A' }}>
              Done ✓
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <TaskBadge type={task.task_type} />
          {!isMyTask && assignee && (
            <span className="text-xs text-gray-400">→ {assignee.full_name || assignee.username}</span>
          )}
          {task.due_date && (
            <span className="text-xs text-gray-400">
              Due {new Date(task.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            </span>
          )}
          {task.completed && task.score != null && (
            <span className="text-xs text-green-600 font-medium">Score: {task.score}/100</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Sabha (Chat) Tab ──────────────────────────────────────────────────────────
function SabhaTab({ messages: initialMessages, userId, kulId, userName }: {
  messages: MessageRow[]; userId: string; kulId: string; userName: string;
}) {
  const supabase    = createClient();
  const router      = useRouter();
  const bottomRef   = useRef<HTMLDivElement>(null);
  const [msgs,    setMsgs]    = useState(initialMessages);
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel(`kul_messages_${kulId}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'kul_messages', filter: `kul_id=eq.${kulId}` },
        async (payload) => {
          // Fetch full row with profile
          const { data } = await supabase
            .from('kul_messages')
            .select('*, profiles!kul_messages_sender_id_fkey(full_name, username, avatar_url)')
            .eq('id', payload.new.id)
            .single();
          if (data) setMsgs(prev => [...prev, data as MessageRow]);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [kulId]);

  async function sendMessage() {
    if (!content.trim()) return;
    setSending(true);
    const msg = content.trim();
    setContent('');
    await supabase.from('kul_messages').insert({ kul_id: kulId, sender_id: userId, content: msg });
    setSending(false);
  }

  const REACTION_EMOJIS = ['🙏', '🔥', '❤️', '✨', '🛕'];

  async function addReaction(msgId: string, emoji: string) {
    await supabase.from('kul_messages').update({ reaction: emoji }).eq('id', msgId);
    setMsgs(prev => prev.map(m => m.id === msgId ? { ...m, reaction: emoji } : m));
  }

  function formatTime(ts: string) {
    return new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  }

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 300px)', minHeight: '400px' }}>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 pb-2">
        {msgs.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <MessageSquare size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No messages yet — say Jai Ho! 🙏</p>
          </div>
        )}
        {msgs.map(msg => {
          const isMe = msg.sender_id === userId;
          const name = msg.profiles?.full_name || msg.profiles?.username || 'Member';
          return (
            <div key={msg.id} className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
              {!isMe && (
                <Avatar name={name} url={msg.profiles?.avatar_url} size={8} />
              )}
              <div className={`max-w-[75%] group`}>
                {!isMe && <p className="text-[10px] text-gray-400 mb-1 px-1">{name}</p>}
                <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed relative ${
                  isMe
                    ? 'text-white rounded-tr-sm'
                    : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm'
                }`}
                  style={isMe ? { background: '#7B1A1A' } : {}}>
                  {msg.content}
                  {msg.reaction && (
                    <span className="absolute -bottom-2 -right-1 text-base">{msg.reaction}</span>
                  )}
                </div>
                <div className={`flex items-center gap-1 mt-1.5 px-1 ${isMe ? 'justify-end' : ''}`}>
                  <p className="text-[10px] text-gray-300">{formatTime(msg.created_at)}</p>
                  {/* Quick reactions (show on hover) */}
                  <div className="hidden group-hover:flex gap-0.5">
                    {REACTION_EMOJIS.map(e => (
                      <button key={e} onClick={() => addReaction(msg.id, e)}
                        className="text-xs hover:scale-125 transition-transform">
                        {e}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="pt-3 border-t border-gray-100">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <textarea
              placeholder="Message your Kul… 🙏"
              value={content}
              onChange={e => setContent(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              rows={1}
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-[#7B1A1A] outline-none resize-none text-sm"
            />
          </div>
          <button onClick={sendMessage} disabled={sending || !content.trim()}
            className="w-11 h-11 rounded-2xl flex items-center justify-center text-white hover:opacity-90 disabled:opacity-40 transition flex-shrink-0"
            style={{ background: '#7B1A1A' }}>
            <Send size={16} />
          </button>
        </div>
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

function VanshTab({ familyMembers: initial, kulEvents: initialEvents, kulId, userId, myRole }: {
  familyMembers: FamilyMember[]; kulEvents: KulEvent[]; kulId: string; userId: string; myRole: 'guardian' | 'sadhak';
}) {
  const supabase = createClient();
  const router   = useRouter();
  const canManageVansh = myRole === 'guardian';

  const [members,     setMembers]     = useState(initial);
  const [events,      setEvents]      = useState(initialEvents);
  const [activeView,  setActiveView]  = useState<'tree' | 'events'>('tree');
  const [showAdd,     setShowAdd]     = useState(false);
  const [showAddEvent,setShowAddEvent]= useState(false);
  const [editMember,  setEditMember]  = useState<FamilyMember | null>(null);

  // Form state — add/edit member
  const [form, setForm] = useState({
    name: '', role: '', gender: '', birth_year: '', birth_date: '',
    death_year: '', death_date: '', marriage_date: '',
    parent_id: '', spouse_id: '', generation: '4',
    notes: '', is_alive: true,
  });

  // Event form
  const [eForm, setEForm] = useState({
    title: '', event_type: 'custom', event_date: '', description: '', member_id: '', recurring: true,
  });

  function resetForm() {
    setForm({ name:'',role:'',gender:'',birth_year:'',birth_date:'',death_year:'',death_date:'',marriage_date:'',parent_id:'',spouse_id:'',generation:'4',notes:'',is_alive:true });
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
    setShowAdd(true);
  }

  async function saveMember() {
    if (!canManageVansh) {
      toast.error('Only Kul guardians can update the Vansh');
      return;
    }
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    const payload = {
      kul_id:        kulId,
      name:          form.name.trim(),
      role:          form.role.trim() || null,
      gender:        form.gender || null,
      birth_year:    form.birth_year ? parseInt(form.birth_year) : null,
      birth_date:    form.birth_date || null,
      death_year:    form.death_year ? parseInt(form.death_year) : null,
      death_date:    form.death_date || null,
      marriage_date: form.marriage_date || null,
      parent_id:     form.parent_id || null,
      spouse_id:     form.spouse_id || null,
      generation:    parseInt(form.generation) || 4,
      notes:         form.notes.trim() || null,
      is_alive:      form.is_alive,
      created_by:    userId,
    };

    if (editMember) {
      const { data, error } = await supabase.from('kul_family_members').update(payload).eq('id', editMember.id).select().single();
      if (error) { toast.error(error.message); return; }
      setMembers(prev => prev.map(m => m.id === editMember.id ? data as FamilyMember : m));
      toast.success('Member updated 🙏');
    } else {
      const { data, error } = await supabase.from('kul_family_members').insert(payload).select().single();
      if (error) { toast.error(error.message); return; }
      const newMember = data as FamilyMember;
      setMembers(prev => [...prev, newMember]);
      // Auto-create birthday event if birth_date set
      if (form.birth_date) {
        await supabase.from('kul_events').insert({
          kul_id: kulId, member_id: newMember.id, created_by: userId,
          title: `${form.name}'s Birthday`,
          event_type: 'birthday', event_date: form.birth_date, recurring: true,
        });
      }
      if (form.marriage_date) {
        await supabase.from('kul_events').insert({
          kul_id: kulId, member_id: newMember.id, created_by: userId,
          title: `${form.name}'s Anniversary`,
          event_type: 'anniversary', event_date: form.marriage_date, recurring: true,
        });
      }
      toast.success('Member added to Vansh 🙏');
    }

    resetForm(); setEditMember(null); setShowAdd(false);
    router.refresh();
  }

  async function deleteMember(id: string, name: string) {
    if (!canManageVansh) {
      toast.error('Only Kul guardians can remove Vansh members');
      return;
    }
    if (!confirm(`Remove ${name} from the Vansh?`)) return;
    await supabase.from('kul_family_members').delete().eq('id', id);
    setMembers(prev => prev.filter(m => m.id !== id));
    toast.success(`${name} removed`);
  }

  async function saveEvent() {
    if (!canManageVansh) {
      toast.error('Only Kul guardians can create Vansh events');
      return;
    }
    if (!eForm.title.trim() || !eForm.event_date) { toast.error('Title and date required'); return; }
    const { data, error } = await supabase.from('kul_events').insert({
      kul_id: kulId, created_by: userId,
      title: eForm.title.trim(), event_type: eForm.event_type,
      event_date: eForm.event_date, description: eForm.description.trim() || null,
      member_id: eForm.member_id || null, recurring: eForm.recurring,
    }).select('*, member:kul_family_members(name, role)').single();
    if (error) { toast.error(error.message); return; }
    setEvents(prev => [...prev, data as KulEvent]);
    setEForm({ title:'', event_type:'custom', event_date:'', description:'', member_id:'', recurring:true });
    setShowAddEvent(false);
    toast.success('Event added! 📅');
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

  return (
    <div className="space-y-4">
      {/* View toggle + add buttons */}
      <div className="flex items-center gap-2">
        <div className="flex bg-gray-100 rounded-xl p-1 gap-1 flex-1">
          {(['tree', 'events'] as const).map(v => (
            <button key={v} onClick={() => setActiveView(v)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition ${activeView === v ? 'bg-white shadow-sm font-semibold' : 'text-gray-500'}`}
              style={activeView === v ? { color: 'var(--brand-primary)' } : undefined}>
              {v === 'tree' ? '🫶 Vansh' : `📅 Events (${upcomingEvents.length})`}
            </button>
          ))}
        </div>
        {canManageVansh ? (
          <button onClick={() => { resetForm(); setEditMember(null); setShowAdd(true); }}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white flex-shrink-0"
            style={{ background: 'var(--brand-primary)' }}>
            <Plus size={16} />
          </button>
        ) : (
          <div className="px-3 py-2 rounded-xl border border-amber-200 bg-amber-50 text-[11px] font-medium text-amber-700 flex-shrink-0">
            Guardian managed
          </div>
        )}
      </div>

      {!canManageVansh && (
        <div className="bg-white rounded-2xl border border-amber-200 p-4">
          <p className="text-sm font-semibold text-gray-800">Vansh editing is guardian-only</p>
          <p className="text-xs text-gray-500 mt-1 leading-relaxed">
            Kul guardians can add, update, and remove lineage members and family events. Other members can still view the family tree and upcoming dates.
          </p>
        </div>
      )}

      {/* ── Add / Edit Member form ── */}
      {showAdd && (
        <div className="bg-white rounded-2xl border border-orange-100 p-4 shadow-sm space-y-3 fade-in">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-800">{editMember ? 'Edit Member' : 'Add Family Member'}</p>
            <button onClick={() => { setShowAdd(false); setEditMember(null); resetForm(); }}
              className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center"><X size={13} className="text-gray-500" /></button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input placeholder="Full name *" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))}
              className="col-span-2 px-3 py-2.5 rounded-xl border border-gray-200 focus:border-[#7B1A1A] outline-none text-sm" />
            <input placeholder="Role (e.g. Dada Ji)" value={form.role} onChange={e => setForm(f => ({...f, role: e.target.value}))}
              className="px-3 py-2.5 rounded-xl border border-gray-200 focus:border-[#7B1A1A] outline-none text-sm" />
            <select value={form.gender} onChange={e => setForm(f => ({...f, gender: e.target.value}))}
              className="px-3 py-2.5 rounded-xl border border-gray-200 outline-none text-sm">
              <option value="">Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
            <select value={form.generation} onChange={e => setForm(f => ({...f, generation: e.target.value}))}
              className="col-span-2 px-3 py-2.5 rounded-xl border border-gray-200 outline-none text-sm">
              {[1,2,3,4,5,6].map(g => <option key={g} value={g}>Generation {g} — {GENERATION_LABELS[g]?.split('—')[0].trim()}</option>)}
            </select>
          </div>
          {/* Dates */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-[10px] text-gray-400 mb-1">Birth Date (exact)</p>
              <input type="date" value={form.birth_date} onChange={e => setForm(f => ({...f, birth_date: e.target.value}))}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 outline-none text-sm" />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 mb-1">Birth Year (if date unknown)</p>
              <input type="number" placeholder="e.g. 1942" value={form.birth_year} onChange={e => setForm(f => ({...f, birth_year: e.target.value}))}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 outline-none text-sm" />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 mb-1">Marriage Date</p>
              <input type="date" value={form.marriage_date} onChange={e => setForm(f => ({...f, marriage_date: e.target.value}))}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 outline-none text-sm" />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 mb-1">Death Date (if applicable)</p>
              <input type="date" value={form.death_date} onChange={e => setForm(f => ({...f, death_date: e.target.value, is_alive: false}))}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 outline-none text-sm" />
            </div>
          </div>
          {/* Parent / Spouse links */}
          {members.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              <select value={form.parent_id} onChange={e => setForm(f => ({...f, parent_id: e.target.value}))}
                className="px-3 py-2.5 rounded-xl border border-gray-200 outline-none text-sm">
                <option value="">Link parent…</option>
                {members.filter(m => m.id !== editMember?.id).map(m => (
                  <option key={m.id} value={m.id}>{m.name} {m.role ? `(${m.role})` : ''}</option>
                ))}
              </select>
              <select value={form.spouse_id} onChange={e => setForm(f => ({...f, spouse_id: e.target.value}))}
                className="px-3 py-2.5 rounded-xl border border-gray-200 outline-none text-sm">
                <option value="">Link spouse…</option>
                {members.filter(m => m.id !== editMember?.id).map(m => (
                  <option key={m.id} value={m.id}>{m.name} {m.role ? `(${m.role})` : ''}</option>
                ))}
              </select>
            </div>
          )}
          <textarea placeholder="Notes (origin, stories, memories…)" value={form.notes}
            onChange={e => setForm(f => ({...f, notes: e.target.value}))} rows={2}
            className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-[#7B1A1A] outline-none resize-none text-sm" />
          <button onClick={saveMember}
            className="w-full py-2.5 text-white font-semibold rounded-xl hover:opacity-90 transition text-sm"
            style={{ background: '#7B1A1A' }}>
            {editMember ? 'Save Changes 🙏' : 'Add to Vansh 🙏'}
          </button>
        </div>
      )}

      {/* ── Tree View ── */}
      {activeView === 'tree' && (
        <div className="space-y-6">
          <div className="clay-card rounded-[1.8rem] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: 'rgba(22, 77, 84, 0.72)' }}>
              Family keepsakes
            </p>
            <h3 className="font-display text-lg font-bold text-gray-900 mt-1">Hold your Vansh like a keepsake wall, not just a tree</h3>
            <p className="text-sm text-gray-600 mt-2 leading-relaxed">
              Each lineage card keeps the structure readable, but now feels calmer and more polished. This is the visual base for the future family memory vault.
            </p>
          </div>

          {members.length === 0 && !showAdd && (
            <div className="clay-card rounded-[1.8rem] text-center py-12 px-6 text-gray-400">
              <div className="mx-auto max-w-[10rem]">
                <div className="clay-portrait-stage">
                  <div className="clay-memory-orbit" />
                  <div
                    className="clay-memory-medallion"
                    style={{ background: 'linear-gradient(145deg, rgba(31, 107, 114, 0.18), rgba(195, 135, 47, 0.22))' }}>
                    <div
                      className="clay-memory-medallion-inner"
                      style={{ background: 'linear-gradient(145deg, rgba(247, 243, 235, 0.98), rgba(226, 239, 239, 0.96))' }}>
                      <span className="font-display text-xl font-bold" style={{ color: 'var(--brand-primary-strong)' }}>
                        वं
                      </span>
                    </div>
                  </div>
                  <div className="clay-memory-badge" style={{ color: 'var(--brand-primary-strong)' }}>
                    Ready for first lineage
                  </div>
                  <div className="absolute inset-x-3 bottom-2 flex items-center justify-between text-[10px] font-medium" style={{ color: 'rgba(22, 77, 84, 0.72)' }}>
                    <span>Family roots</span>
                    <span>Kul</span>
                  </div>
                </div>
              </div>
              <p className="text-sm font-medium text-gray-500">Start your Vansh tree</p>
              <p className="text-xs mt-1">Add family members to preserve your lineage</p>
            </div>
          )}
          {generations.map(gen => (
            <div key={gen} className="clay-lineage-rail">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">
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
                    <div key={m.id}
                      className="clay-portrait-card flex-shrink-0 w-40 rounded-[1.7rem] p-3 text-center relative">
                      <FamilyKeepsakeStage member={m} />
                      <p className="text-xs font-bold text-gray-900 leading-tight mt-3">{m.name}</p>
                      {m.role && <p className="text-[10px] mt-0.5" style={{ color: 'var(--brand-primary)' }}>{m.role}</p>}
                      <div className="text-[10px] text-gray-500 mt-1.5 space-y-0.5 leading-relaxed">
                        {age !== null && <p>{m.is_alive ? `Age ${age}` : `${m.birth_year ?? new Date(m.birth_date!).getFullYear()} – ${m.death_year ?? new Date(m.death_date!).getFullYear()}`}</p>}
                        {spouse && <p>💍 {spouse.name}</p>}
                        {parent && <p>↑ {parent.name}</p>}
                      </div>
                      {/* Edit button */}
                      {canManageVansh && (
                        <div className="flex gap-1 mt-2 justify-center">
                          <button onClick={() => openEdit(m)}
                            className="px-2 py-1 rounded-lg text-[10px] border border-gray-200 text-gray-500 transition"
                            style={{ boxShadow: '0 4px 10px rgba(90, 61, 43, 0.06)' }}>
                            Edit
                          </button>
                          <button onClick={() => deleteMember(m.id, m.name)}
                            className="px-2 py-1 rounded-lg text-[10px] border border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-500 transition">
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
              className="w-full bg-white border border-dashed border-[#7B1A1A]/30 rounded-2xl p-3 flex items-center gap-3 text-gray-400 hover:border-[#7B1A1A]/50 hover:text-[#7B1A1A] transition">
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: '#7B1A1A15' }}>
                <Plus size={14} style={{ color: '#7B1A1A' }} />
              </div>
              <span className="text-sm">Add event, puja date, anniversary…</span>
            </button>
          )}

          {showAddEvent && (
            <div className="bg-white rounded-2xl border border-orange-100 p-4 space-y-3 fade-in">
              <div className="flex gap-2 flex-wrap">
                {['birthday','anniversary','death_anniversary','puja','custom'].map(t => (
                  <button key={t} onClick={() => setEForm(f => ({...f, event_type: t}))}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition ${eForm.event_type === t ? 'bg-[#7B1A1A]/10 text-[#7B1A1A] border border-[#7B1A1A]/30' : 'bg-gray-50 text-gray-500 border border-gray-200'}`}>
                    {EVENT_EMOJI[t]} {t.replace('_', ' ')}
                  </button>
                ))}
              </div>
              <input placeholder="Event title *" value={eForm.title} onChange={e => setEForm(f => ({...f, title: e.target.value}))}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-[#7B1A1A] outline-none text-sm" />
              <div className="grid grid-cols-2 gap-2">
                <input type="date" value={eForm.event_date} onChange={e => setEForm(f => ({...f, event_date: e.target.value}))}
                  className="px-3 py-2.5 rounded-xl border border-gray-200 outline-none text-sm" />
                <select value={eForm.member_id} onChange={e => setEForm(f => ({...f, member_id: e.target.value}))}
                  className="px-3 py-2.5 rounded-xl border border-gray-200 outline-none text-sm">
                  <option value="">Link to member…</option>
                  {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input type="checkbox" checked={eForm.recurring} onChange={e => setEForm(f => ({...f, recurring: e.target.checked}))} className="rounded" />
                Repeat every year
              </label>
              <textarea placeholder="Optional notes…" value={eForm.description} onChange={e => setEForm(f => ({...f, description: e.target.value}))} rows={2}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-[#7B1A1A] outline-none resize-none text-sm" />
              <button onClick={saveEvent}
                className="w-full py-2.5 text-white font-semibold rounded-xl hover:opacity-90 transition text-sm"
                style={{ background: '#7B1A1A' }}>
                Save Event 🙏
              </button>
            </div>
          )}

          {upcomingEvents.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <div className="text-4xl mb-3">📅</div>
              <p className="text-sm">No upcoming events in the next 90 days</p>
              <p className="text-xs mt-1">Add birthdays, anniversaries, and puja dates above</p>
            </div>
          )}

          {upcomingEvents.map(ev => (
            <div key={ev.id} className="bg-white rounded-2xl border border-gray-100 p-3 flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ background: '#7B1A1A0D' }}>
                {EVENT_EMOJI[ev.event_type] ?? '📅'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">{ev.title}</p>
                <p className="text-xs text-gray-400 truncate">
                  {new Date(ev.event_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })}
                  {ev.member && ` · ${ev.member.name}`}
                  {ev.recurring && ' · Annual'}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                {ev.daysUntil === 0 ? (
                  <span className="text-xs font-bold px-2 py-1 rounded-full text-white" style={{ background: '#7B1A1A' }}>Today 🎉</span>
                ) : ev.daysUntil === 1 ? (
                  <span className="text-xs font-semibold text-orange-600">Tomorrow</span>
                ) : ev.daysUntil <= 7 ? (
                  <span className="text-xs font-semibold text-amber-600">In {ev.daysUntil}d</span>
                ) : (
                  <span className="text-xs text-gray-400">{ev.daysUntil}d</span>
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
export default function KulClient({ userId, userName, userProfile, kul, members, tasks, messages, familyMembers, kulEvents, myRole }: Props) {
  const supabase  = createClient();
  const router    = useRouter();
  const [activeTab,    setActiveTab]    = useState<'board' | 'members' | 'tasks' | 'sabha' | 'vansh'>('board');
  const [editingName,  setEditingName]  = useState(false);
  const [newKulName,   setNewKulName]   = useState(kul?.name ?? '');
  const [savingName,   setSavingName]   = useState(false);

  if (!kul) {
    return <NoKulPrompt userId={userId} userName={userName} />;
  }

  async function saveKulName() {
    const trimmed = newKulName.trim();
    if (!trimmed) { toast.error('Kul name cannot be empty'); return; }
    if (trimmed === kul!.name) { setEditingName(false); return; }
    setSavingName(true);
    const { error } = await supabase
      .from('kuls')
      .update({ name: trimmed })
      .eq('id', kul!.id);
    setSavingName(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`Kul renamed to "${trimmed}" 🙏`);
    setEditingName(false);
    router.refresh();
  }

  const pendingTasks = tasks.filter(t => !t.completed && (t.assigned_to === userId || myRole === 'guardian')).length;
  const unreadMsgs   = 0; // Future: track last-read timestamp

  const tabs: Array<{ key: typeof activeTab; label: string; icon: React.ReactNode; badge?: number }> = [
    { key: 'board',   label: 'Board',   icon: <Star size={14} /> },
    { key: 'members', label: 'Members', icon: <Users size={14} />, badge: members.length },
    { key: 'tasks',   label: 'Tasks',   icon: <CheckSquare size={14} />, badge: pendingTasks || undefined },
    { key: 'sabha',   label: 'Sabha',   icon: <MessageSquare size={14} /> },
    { key: 'vansh',   label: 'Vansh',   icon: <span className="text-xs">🫶</span> },
  ];

  return (
    <div className="space-y-4 pb-2 fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 pt-1">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #7B1A1A15, #b4530915)' }}>
          {kul.avatar_emoji}
        </div>
        <div className="flex-1 min-w-0">
          {editingName && myRole === 'guardian' ? (
            <div className="flex items-center gap-2">
              <input
                autoFocus
                value={newKulName}
                onChange={e => setNewKulName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') saveKulName(); if (e.key === 'Escape') setEditingName(false); }}
                maxLength={40}
                className="flex-1 font-display font-bold text-gray-900 text-xl leading-tight border-b-2 border-[#7B1A1A] outline-none bg-transparent"
              />
              <button onClick={saveKulName} disabled={savingName}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white disabled:opacity-50"
                style={{ background: '#7B1A1A' }}>
                {savingName ? <span className="text-[10px]">…</span> : <Check size={13} />}
              </button>
              <button onClick={() => setEditingName(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center bg-gray-100">
                <X size={13} className="text-gray-500" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h1 className="font-display font-bold text-gray-900 text-xl leading-tight truncate">{kul.name}</h1>
              {myRole === 'guardian' && (
                <button
                  onClick={() => { setNewKulName(kul.name); setEditingName(true); }}
                  className="w-6 h-6 rounded-lg flex items-center justify-center bg-gray-100 hover:bg-orange-50 transition flex-shrink-0"
                  title="Rename Kul">
                  <Pencil size={11} className="text-gray-400" />
                </button>
              )}
            </div>
          )}
          <p className="text-xs text-gray-400 mt-0.5">
            {myRole === 'guardian' ? '👑 Guardian' : '🙏 Sadhak'} · {members.length} member{members.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="px-3 py-1.5 rounded-xl text-xs font-bold tracking-widest border"
          style={{ borderColor: '#7B1A1A30', color: '#7B1A1A' }}>
          {kul.invite_code}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 rounded-2xl p-1 gap-0.5">
        {tabs.map(({ key, label, icon, badge }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-1 relative ${
              activeTab === key ? 'bg-white text-[#7B1A1A] shadow-sm font-semibold' : 'text-gray-500 hover:text-gray-700'
            }`}>
            {icon}
            <span className="hidden sm:inline">{label}</span>
            <span className="sm:hidden">{label}</span>
            {badge != null && badge > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[9px] font-bold text-white flex items-center justify-center"
                style={{ background: '#7B1A1A' }}>
                {badge > 9 ? '9+' : badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'board'   && <BoardTab   kul={kul} members={members} tasks={tasks} userId={userId} myRole={myRole} />}
      {activeTab === 'members' && <MembersTab members={members} userId={userId} myRole={myRole} kul={kul} />}
      {activeTab === 'tasks'   && <TasksTab   tasks={tasks} members={members} userId={userId} myRole={myRole} kulId={kul.id} />}
      {activeTab === 'sabha'   && <SabhaTab   messages={messages} userId={userId} kulId={kul.id} userName={userName} />}
      {activeTab === 'vansh'  && <VanshTab  familyMembers={familyMembers} kulEvents={kulEvents} kulId={kul.id} userId={userId} myRole={myRole} />}
    </div>
  );
}
