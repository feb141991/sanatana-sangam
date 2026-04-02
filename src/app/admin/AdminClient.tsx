'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import {
  Users, Flag, MessageSquare, Home, BarChart2,
  CheckCircle, XCircle, Shield, AlertTriangle,
  Trash2, Crown, Send,
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────
type UserRow    = { id: string; full_name: string | null; username: string | null; email?: string | null; tradition: string | null; city: string | null; country: string | null; shloka_streak: number | null; seva_score: number | null; is_admin: boolean | null; created_at: string };
type ReportRow  = { id: string; content_type: string; content_id: string; reason: string; status: string; admin_note: string | null; created_at: string; reported_by: string; reporter: { full_name: string | null; username: string | null } | null };
type PostRow    = { id: string; content: string; type: string; created_at: string; mandali_id: string | null; author_id: string; profiles: { full_name: string | null; username: string | null } | null };
type KulRow     = { id: string; name: string; invite_code: string; avatar_emoji: string; created_at: string; created_by: string };
type MandaliRow = { id: string; name: string; city: string; country: string; member_count: number };

async function requestJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(input, {
    ...init,
    headers,
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.error ?? 'Request failed');
  }

  return payload as T;
}

interface Props {
  adminName: string;
  users:     UserRow[];
  reports:   ReportRow[];
  posts:     PostRow[];
  kuls:      KulRow[];
  mandalis:  MandaliRow[];
}

const TRADITION_EMOJI: Record<string, string> = {
  hindu: '🕉️', sikh: '☬', buddhist: '☸️', jain: '🤲', other: '✨',
};

const STATUS_BADGE: Record<string, string> = {
  pending:  'bg-amber-50 text-amber-700 border-amber-200',
  reviewed: 'bg-blue-50 text-blue-700 border-blue-200',
  actioned: 'bg-green-50 text-green-700 border-green-200',
  dismissed:'bg-gray-100 text-gray-500 border-gray-200',
};

function StatCard({ label, value, emoji, sub }: { label: string; value: number | string; emoji: string; sub?: string }) {
  return (
    <div className="glass-panel rounded-2xl p-4 flex items-center gap-3">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl" style={{ background: '#7B1A1A0D' }}>{emoji}</div>
      <div>
        <p className="text-2xl font-display font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-400">{label}</p>
        {sub && <p className="text-[10px] text-gray-300 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ── Dashboard Tab ─────────────────────────────────────────────────────────────
function DashboardTab({ users, reports, kuls, mandalis }: { users: UserRow[]; reports: ReportRow[]; kuls: KulRow[]; mandalis: MandaliRow[] }) {
  const pendingReports = reports.filter(r => r.status === 'pending').length;
  const totalStreak    = users.reduce((s, u) => s + (u.shloka_streak ?? 0), 0);
  const traditions = Object.entries(
    users.reduce((acc: Record<string, number>, u) => {
      const t = u.tradition ?? 'other';
      acc[t] = (acc[t] ?? 0) + 1;
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-6">
      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Total Users"     value={users.length}   emoji="👥" />
        <StatCard label="Open Reports"    value={pendingReports} emoji="🚩" sub="requires action" />
        <StatCard label="Active Kuls"     value={kuls.length}    emoji="🏡" />
        <StatCard label="Total Mandalis"  value={mandalis.length}emoji="🕌" />
      </div>
      <StatCard label="Combined Shloka Streaks" value={totalStreak} emoji="🔥" sub="community total" />

      {/* Tradition breakdown */}
      <div>
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-3">User Traditions</p>
        <div className="glass-panel rounded-2xl p-4 space-y-3">
          {traditions.map(([trad, count]) => (
            <div key={trad} className="flex items-center gap-3">
              <span className="text-lg w-6">{TRADITION_EMOJI[trad] ?? '✨'}</span>
              <span className="text-sm text-gray-700 capitalize flex-1">{trad}</span>
              <div className="flex items-center gap-2">
                <div className="h-2 rounded-full bg-orange-100 w-24">
                  <div className="h-2 rounded-full" style={{ background: '#7B1A1A', width: `${Math.round(count / users.length * 100)}%` }} />
                </div>
                <span className="text-xs text-gray-400 w-8 text-right">{count}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Mandalis */}
      <div>
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-3">Top Mandalis by Size</p>
        <div className="space-y-2">
          {mandalis.slice(0, 5).map((m, i) => (
            <div key={m.id} className="glass-panel rounded-2xl p-3 flex items-center gap-3">
              <div className="w-6 text-xs font-bold text-gray-300 text-center">{i + 1}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{m.name}</p>
                <p className="text-xs text-gray-400">{m.city}, {m.country}</p>
              </div>
              <span className="text-sm font-bold text-[#7B1A1A]">{m.member_count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Moderation Tab ────────────────────────────────────────────────────────────
function ModerationTab({ reports: initialReports }: { reports: ReportRow[] }) {
  const [reports, setReports] = useState(initialReports);
  const [filter,  setFilter]  = useState<'all' | 'pending' | 'actioned'>('pending');
  const [busyId, setBusyId] = useState<string | null>(null);

  const filtered = filter === 'all' ? reports : reports.filter(r => r.status === filter);

  async function updateStatus(id: string, status: string, note?: string) {
    setBusyId(id);
    try {
      const payload = await requestJson<{ report: { status: string; admin_note: string | null } }>(
        `/api/admin/reports/${id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ status, note: note ?? '' }),
        }
      );
      setReports(prev => prev.map(r => r.id === id ? { ...r, status: payload.report.status, admin_note: payload.report.admin_note } : r));
      toast.success(`Report ${status} 🙏`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to update report');
    } finally {
      setBusyId(null);
    }
  }

  async function deleteContent(report: ReportRow) {
    if (!confirm(`Delete this ${report.content_type}? This cannot be undone.`)) return;
    setBusyId(report.id);
    try {
      const payload = await requestJson<{ report: { status: string; admin_note: string | null } }>(
        `/api/admin/reports/${report.id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            status: 'actioned',
            note: 'Content removed by admin',
            removeContent: true,
            contentType: report.content_type,
            contentId: report.content_id,
          }),
        }
      );
      setReports(prev => prev.map(r => (
        r.id === report.id
          ? { ...r, status: payload.report.status, admin_note: payload.report.admin_note }
          : r
      )));
      toast.success('Content removed');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to remove content');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex gap-2">
        {(['pending', 'actioned', 'all'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition capitalize ${filter === f ? 'text-white' : 'bg-gray-100 text-gray-500'}`}
            style={filter === f ? { background: '#7B1A1A' } : {}}>
            {f}
          </button>
        ))}
        <span className="ml-auto text-xs text-gray-400 self-center">
          {filtered.length} report{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <CheckCircle size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No {filter === 'all' ? '' : filter} reports</p>
        </div>
      )}

      {filtered.map(report => (
        <div key={report.id} className="glass-panel rounded-2xl p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle size={13} className="text-amber-500" />
                <span className="text-sm font-semibold text-gray-900 capitalize">{report.content_type.replace('_', ' ')}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${STATUS_BADGE[report.status] ?? STATUS_BADGE.pending}`}>
                  {report.status}
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Reason: <span className="font-medium text-gray-600">{report.reason}</span>
                {' · '}by {report.reporter?.full_name || report.reporter?.username || 'User'}
              </p>
              <p className="text-xs text-gray-300 mt-0.5">
                {new Date(report.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
          </div>
          {report.admin_note && (
            <p className="text-xs text-gray-500 bg-gray-50 rounded-xl px-3 py-2">Note: {report.admin_note}</p>
          )}
          {report.status === 'pending' && (
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => updateStatus(report.id, 'dismissed')}
                disabled={busyId === report.id}
                className="flex-1 py-2 rounded-xl text-xs font-medium border border-gray-200 text-gray-500 hover:border-gray-300 transition">
                Dismiss
              </button>
              <button onClick={() => updateStatus(report.id, 'reviewed', 'Under review')}
                disabled={busyId === report.id}
                className="flex-1 py-2 rounded-xl text-xs font-medium border border-blue-200 text-blue-600 hover:bg-blue-50 transition">
                Mark Reviewed
              </button>
              <button onClick={() => deleteContent(report)}
                disabled={busyId === report.id}
                className="flex-1 py-2 rounded-xl text-xs font-medium bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition flex items-center justify-center gap-1">
                <Trash2 size={11} /> Remove Content
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Users Tab ─────────────────────────────────────────────────────────────────
function UsersTab({ users: initialUsers }: { users: UserRow[] }) {
  const [users,  setUsers]  = useState(initialUsers);
  const [search, setSearch] = useState('');
  const [tradFilter, setTradFilter] = useState('all');
  const [busyId, setBusyId] = useState<string | null>(null);

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = !q || (u.full_name?.toLowerCase().includes(q) || u.username?.toLowerCase().includes(q));
    const matchTrad   = tradFilter === 'all' || u.tradition === tradFilter;
    return matchSearch && matchTrad;
  });

  async function toggleAdmin(userId: string, current: boolean) {
    if (!confirm(`${current ? 'Remove' : 'Grant'} admin access for this user?`)) return;
    setBusyId(userId);
    try {
      const payload = await requestJson<{ user: { is_admin: boolean } }>(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify({ isAdmin: !current }),
      });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_admin: payload.user.is_admin } : u));
      toast.success(`Admin access ${current ? 'removed' : 'granted'} 🔐`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to change admin access');
    } finally {
      setBusyId(null);
    }
  }

  async function banUser(userId: string, name: string) {
    if (!confirm(`Ban ${name}? This will delete their profile data.`)) return;
    setBusyId(userId);
    try {
      await requestJson(`/api/admin/users/${userId}`, { method: 'DELETE' });
      setUsers(prev => prev.filter(u => u.id !== userId));
      toast.success(`${name} banned and removed`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to ban user');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* Search + filter */}
      <div className="flex gap-2">
        <input type="text" placeholder="Search users…" value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#7B1A1A] outline-none text-sm" />
        <select value={tradFilter} onChange={e => setTradFilter(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-gray-200 outline-none text-sm">
          <option value="all">All</option>
          {['hindu', 'sikh', 'buddhist', 'jain', 'other'].map(t => (
            <option key={t} value={t}>{TRADITION_EMOJI[t]} {t}</option>
          ))}
        </select>
      </div>
      <p className="text-xs text-gray-400">{filtered.length} of {users.length} users</p>

      <div className="space-y-2">
        {filtered.map(u => (
          <div key={u.id} className="glass-panel rounded-2xl p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
              style={{ background: u.is_admin ? '#7B1A1A' : 'linear-gradient(135deg, #ff7722, #d4a017)' }}>
              {u.is_admin ? <Crown size={14} /> : (u.full_name?.[0] || u.username?.[0] || '?').toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-semibold text-gray-900 truncate">{u.full_name || u.username}</p>
                {u.is_admin && <Shield size={11} className="text-[#7B1A1A] flex-shrink-0" />}
              </div>
              <p className="text-xs text-gray-400 truncate">
                {u.username && `@${u.username}`}
                {u.city && ` · ${u.city}`}
                {u.tradition && ` · ${TRADITION_EMOJI[u.tradition] ?? ''}`}
                {` · 🔥${u.shloka_streak ?? 0} · ⭐${u.seva_score ?? 0}`}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => toggleAdmin(u.id, u.is_admin ?? false)}
                disabled={busyId === u.id}
                className="w-7 h-7 rounded-lg flex items-center justify-center border border-gray-200 text-gray-400 hover:text-[#7B1A1A] hover:border-[#7B1A1A]/30 transition"
                title={u.is_admin ? 'Remove admin' : 'Make admin'}>
                <Shield size={12} />
              </button>
              <button onClick={() => banUser(u.id, u.full_name || u.username || 'User')}
                disabled={busyId === u.id}
                className="w-7 h-7 rounded-lg flex items-center justify-center border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 transition"
                title="Ban user">
                <XCircle size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Posts Tab ─────────────────────────────────────────────────────────────────
function PostsTab({ posts: initialPosts }: { posts: PostRow[] }) {
  const [posts,  setPosts]  = useState(initialPosts);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function deletePost(id: string) {
    if (!confirm('Delete this post?')) return;
    setBusyId(id);
    try {
      await requestJson(`/api/admin/posts/${id}`, { method: 'DELETE' });
      setPosts(prev => prev.filter(p => p.id !== id));
      toast.success('Post removed');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to remove post');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-3">
      {posts.map(post => (
        <div key={post.id} className="glass-panel rounded-2xl p-4 flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center text-xs font-bold text-gray-400 flex-shrink-0">
            {post.type?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400 mb-1">
              {post.profiles?.full_name || post.profiles?.username}
              {' · '}{new Date(post.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            </p>
            <p className="text-sm text-gray-800 leading-snug line-clamp-2">{post.content}</p>
          </div>
          <button onClick={() => deletePost(post.id)}
            disabled={busyId === post.id}
            className="w-7 h-7 rounded-lg flex items-center justify-center border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 transition flex-shrink-0">
            <Trash2 size={12} />
          </button>
        </div>
      ))}
      {posts.length === 0 && (
        <p className="text-center text-sm text-gray-400 py-12">No posts yet</p>
      )}
    </div>
  );
}

// ── Broadcast Tab ─────────────────────────────────────────────────────────────
function BroadcastTab({ userCount }: { userCount: number }) {
  const [title,   setTitle]   = useState('');
  const [message, setMessage] = useState('');
  const [sent,    setSent]    = useState(false);

  function handleSend() {
    if (!title.trim() || !message.trim()) { toast.error('Fill in both fields'); return; }
    // Future: integrate with push notification service
    toast.success(`📢 Broadcast queued for ${userCount} users`);
    setTitle(''); setMessage(''); setSent(true);
    setTimeout(() => setSent(false), 3000);
  }

  return (
    <div className="space-y-4">
      <div className="glass-panel rounded-2xl p-4">
        <p className="text-xs font-semibold text-amber-700">📢 Broadcast to all {userCount} users</p>
        <p className="text-xs text-amber-600 mt-1">This will send a notification to all registered users. Use sparingly.</p>
      </div>
      <input type="text" placeholder="Notification title…" value={title}
        onChange={e => setTitle(e.target.value)}
        className="glass-input w-full px-4 py-3 rounded-xl focus:border-[#7B1A1A] outline-none text-sm" />
      <textarea placeholder="Message body…" value={message}
        onChange={e => setMessage(e.target.value)} rows={4}
        className="glass-input w-full px-4 py-3 rounded-xl focus:border-[#7B1A1A] outline-none resize-none text-sm" />
      <button onClick={handleSend} disabled={sent}
        className="glass-button-primary w-full py-3 text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition flex items-center justify-center gap-2">
        <Send size={14} /> {sent ? 'Sent!' : 'Send Broadcast 🙏'}
      </button>
    </div>
  );
}

// ── Main Admin Component ──────────────────────────────────────────────────────
export default function AdminClient({ adminName, users, reports, posts, kuls, mandalis }: Props) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'moderation' | 'users' | 'posts' | 'broadcast'>('dashboard');
  const pendingReports = reports.filter(r => r.status === 'pending').length;

  const tabs: Array<{ key: typeof activeTab; label: string; icon: React.ReactNode; badge?: number }> = [
    { key: 'dashboard',  label: 'Dashboard',  icon: <BarChart2 size={14} /> },
    { key: 'moderation', label: 'Moderation', icon: <Flag size={14} />, badge: pendingReports || undefined },
    { key: 'users',      label: 'Users',      icon: <Users size={14} />, badge: users.length },
    { key: 'posts',      label: 'Posts',      icon: <MessageSquare size={14} /> },
    { key: 'broadcast',  label: 'Broadcast',  icon: <Send size={14} /> },
  ];

  return (
    <div className="min-h-screen px-3 py-3">
      {/* Admin header */}
      <div className="sticky top-0 z-40">
        <div className="glass-panel-strong max-w-4xl mx-auto px-4 py-3 rounded-[1.85rem] flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-sm font-bold"
            style={{ background: '#7B1A1A' }}>
            <Crown size={14} />
          </div>
          <div>
            <h1 className="font-display font-bold text-gray-900 text-base">Admin Portal</h1>
            <p className="text-xs text-gray-400">Sanatana Sangam · {adminName}</p>
          </div>
          <a href="/home" className="ml-auto text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
            <Home size={12} /> App
          </a>
        </div>

        {/* Tab bar */}
        <div className="max-w-4xl mx-auto px-4 flex gap-1 pb-0 overflow-x-auto">
          {tabs.map(({ key, label, icon, badge }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap relative ${
                activeTab === key
                  ? 'border-[#7B1A1A] text-[#7B1A1A]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              {icon}{label}
              {badge != null && badge > 0 && (
                <span className="ml-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold text-white"
                  style={{ background: '#7B1A1A' }}>
                  {badge > 99 ? '99+' : badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-1 py-6">
        {activeTab === 'dashboard'  && <DashboardTab  users={users} reports={reports} kuls={kuls} mandalis={mandalis} />}
        {activeTab === 'moderation' && <ModerationTab reports={reports} />}
        {activeTab === 'users'      && <UsersTab      users={users} />}
        {activeTab === 'posts'      && <PostsTab      posts={posts} />}
        {activeTab === 'broadcast'  && <BroadcastTab  userCount={users.length} />}
      </div>
    </div>
  );
}
