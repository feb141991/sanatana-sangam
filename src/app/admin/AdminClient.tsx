'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import toast from 'react-hot-toast';
import {
  Users, Flag, MessageSquare, Home, BarChart2,
  CheckCircle, XCircle, Shield, AlertTriangle,
  Trash2, Crown, Send, LogOut, Image as ImageIcon, UploadCloud,
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────
type UserRow    = { id: string; full_name: string | null; username: string | null; email?: string | null; tradition: string | null; city: string | null; country: string | null; shloka_streak: number | null; seva_score: number | null; is_admin: boolean | null; is_banned: boolean | null; ban_reason: string | null; created_at: string };
type ReportRow  = { id: string; content_type: string; content_id: string; content_author_id: string; reason: string; status: string; admin_note: string | null; created_at: string; reported_by: string; reporter: { full_name: string | null; username: string | null } | null };
type PostRow    = { id: string; content: string; type: string; created_at: string; mandali_id: string | null; author_id: string; profiles: { full_name: string | null; username: string | null } | null };
type KulRow     = { id: string; name: string; invite_code: string; avatar_emoji: string; created_at: string; created_by: string };
type MandaliRow = { id: string; name: string; city: string; country: string; member_count: number };
type HeroAssetRow = { id: string | null; label: string; hero_image: string; hero_alt: string; object_position: string; traditions: string[]; sampradayas: string[]; ishta_devatas: string[]; festival_slugs: string[]; tags: string[]; priority: number; is_active: boolean; created_at?: string };

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
  heroAssets: HeroAssetRow[];
}

const TRADITION_EMOJI: Record<string, string> = {
  hindu: '🕉️', sikh: '☬', buddhist: '☸️', jain: '🤲', other: '✨',
};

const STATUS_BADGE: Record<string, string> = {
  pending:  'bg-amber-50 text-amber-700 border-amber-200',
  reviewed: 'bg-blue-50 text-blue-700 border-blue-200',
  actioned: 'bg-green-50 text-green-700 border-green-200',
  dismissed:'bg-gray-100 text-[color:var(--brand-muted)] border-gray-200',
};

function StatCard({ label, value, emoji, sub, onClick }: { label: string; value: number | string; emoji: string; sub?: string; onClick?: () => void }) {
  const Wrapper = onClick ? 'button' : 'div';
  return (
    <Wrapper
      onClick={onClick}
      className={`glass-panel rounded-2xl p-4 flex items-center gap-3 text-left w-full ${onClick ? 'hover:bg-[#7B1A1A08] active:scale-[0.98] transition-all cursor-pointer' : ''}`}
    >
      <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: '#7B1A1A0D' }}>{emoji}</div>
      <div>
        <p className="text-2xl font-display font-bold text-[color:var(--text-cream)]">{value}</p>
        <p className="text-xs text-[color:var(--text-dim)]">{label}</p>
        {sub && <p className="text-[10px] text-gray-300 mt-0.5">{sub}</p>}
      </div>
      {onClick && <span className="ml-auto text-gray-300 text-sm">›</span>}
    </Wrapper>
  );
}

// ── Dashboard Tab ─────────────────────────────────────────────────────────────
type TabKey = 'dashboard' | 'moderation' | 'users' | 'posts' | 'hero-assets' | 'notifications' | 'broadcast' | 'festivals';

function DashboardTab({ users, reports, kuls, mandalis, onTabChange }: { users: UserRow[]; reports: ReportRow[]; kuls: KulRow[]; mandalis: MandaliRow[]; onTabChange: (tab: TabKey) => void }) {
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
        <StatCard label="Total Users"    value={users.length}    emoji="👥" onClick={() => onTabChange('users')} />
        <StatCard label="Open Reports"   value={pendingReports}  emoji="🚩" sub="requires action" onClick={() => onTabChange('moderation')} />
        <StatCard label="Active Kuls"    value={kuls.length}     emoji="🏡" />
        <StatCard label="Total Mandalis" value={mandalis.length} emoji="🕌" />
      </div>
      <StatCard label="Combined Shloka Streaks" value={totalStreak} emoji="🔥" sub="community total" onClick={() => onTabChange('users')} />

      {/* Tradition breakdown */}
      <div>
        <p className="text-xs text-[color:var(--text-dim)] font-medium uppercase tracking-wider mb-3">
          User Traditions {users.length === 0 && <span className="normal-case font-normal">(no data yet)</span>}
        </p>
        <div className="glass-panel rounded-2xl p-4 space-y-3">
          {traditions.length === 0 && (
            <p className="text-sm text-[color:var(--text-dim)] text-center py-2">No users yet</p>
          )}
          {traditions.map(([trad, count]) => (
            <div key={trad} className="flex items-center gap-3">
              <span className="text-lg w-6">{TRADITION_EMOJI[trad] ?? '✨'}</span>
              <span className="text-sm text-[color:var(--text-muted-warm)] capitalize flex-1">{trad}</span>
              <div className="flex items-center gap-2">
                <div className="h-2 rounded-full bg-orange-100 w-24">
                  <div className="h-2 rounded-full" style={{ background: '#7B1A1A', width: `${Math.round(count / users.length * 100)}%` }} />
                </div>
                <span className="text-xs text-[color:var(--text-dim)] w-8 text-right">{count}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Mandalis */}
      <div>
        <p className="text-xs text-[color:var(--text-dim)] font-medium uppercase tracking-wider mb-3">Top Mandalis by Size</p>
        <div className="space-y-2">
          {mandalis.slice(0, 5).map((m, i) => (
            <div key={m.id} className="glass-panel rounded-2xl p-3 flex items-center gap-3">
              <div className="w-6 text-xs font-bold text-gray-300 text-center">{i + 1}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[color:var(--text-cream)] truncate">{m.name}</p>
                <p className="text-xs text-[color:var(--text-dim)]">{m.city}, {m.country}</p>
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

  async function warnUser(userId: string, name: string) {
    const reason = prompt(`Issue official warning to ${name}:`, 'Inappropriate behavior in Mandali');
    if (!reason) return;
    setBusyId(userId);
    try {
      await requestJson(`/api/admin/users/${userId}/warn`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
      toast.success(`Warning sent to ${name} ⚠️`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to warn user');
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
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition capitalize ${filter === f ? 'text-white' : 'bg-gray-100 text-[color:var(--brand-muted)]'}`}
            style={filter === f ? { background: '#7B1A1A' } : {}}>
            {f}
          </button>
        ))}
        <span className="ml-auto text-xs text-[color:var(--text-dim)] self-center">
          {filtered.length} report{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-[color:var(--text-dim)]">
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
                <span className="text-sm font-semibold text-[color:var(--text-cream)] capitalize">{report.content_type.replace('_', ' ')}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${STATUS_BADGE[report.status] ?? STATUS_BADGE.pending}`}>
                  {report.status}
                </span>
              </div>
              <p className="text-xs text-[color:var(--text-dim)]">
                Reason: <span className="font-medium text-[color:var(--brand-muted)]">{report.reason}</span>
                {' · '}by {report.reporter?.full_name || report.reporter?.username || 'User'}
              </p>
              <p className="text-xs text-gray-300 mt-0.5">
                {new Date(report.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
          </div>
          {report.admin_note && (
            <p className="text-xs text-[color:var(--brand-muted)] bg-gray-50 rounded-xl px-3 py-2">Note: {report.admin_note}</p>
          )}
          {report.status === 'pending' && (
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => updateStatus(report.id, 'dismissed')}
                disabled={busyId === report.id}
                className="flex-1 py-2 rounded-xl text-xs font-medium border border-gray-200 text-[color:var(--brand-muted)] hover:border-gray-300 transition">
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
              <button onClick={() => warnUser(report.content_author_id, 'Author')}
                disabled={busyId === report.id || !report.content_author_id}
                className="w-full py-2 rounded-xl text-xs font-medium border border-amber-200 text-amber-600 hover:bg-amber-50 transition flex items-center justify-center gap-1">
                <AlertTriangle size={11} /> Warn Author
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

  async function toggleBan(userId: string, name: string, current: boolean) {
    if (current) {
      if (!confirm(`Unban ${name}?`)) return;
      setBusyId(userId);
      try {
        const payload = await requestJson<{ user: { is_banned: boolean } }>(`/api/admin/users/${userId}`, {
          method: 'PATCH',
          body: JSON.stringify({ isBanned: false }),
        });
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_banned: payload.user.is_banned } : u));
        toast.success(`${name} unbanned`);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Unable to unban user');
      } finally {
        setBusyId(null);
      }
    } else {
      const reason = prompt(`Ban ${name}? Enter reason for suspension:`, 'Violating community guidelines');
      if (reason === null) return;
      setBusyId(userId);
      try {
        const payload = await requestJson<{ user: { is_banned: boolean } }>(`/api/admin/users/${userId}`, {
          method: 'PATCH',
          body: JSON.stringify({ isBanned: true, banReason: reason }),
        });
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_banned: payload.user.is_banned } : u));
        toast.success(`${name} banned`);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Unable to ban user');
      } finally {
        setBusyId(null);
      }
    }
  }

  async function warnUser(userId: string, name: string) {
    const reason = prompt(`Issue official warning to ${name}:`, 'Inappropriate behavior in Mandali');
    if (!reason) return;
    setBusyId(userId);
    try {
      await requestJson(`/api/admin/users/${userId}/warn`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
      toast.success(`Warning sent to ${name} ⚠️`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to warn user');
    } finally {
      setBusyId(null);
    }
  }

  async function deleteUser(userId: string, name: string) {
    if (!confirm(`PERMANENTLY DELETE ${name}? This will remove them from Auth and DB. Only use for bots/spam.`)) return;
    setBusyId(userId);
    try {
      await requestJson(`/api/admin/users/${userId}`, { method: 'DELETE' });
      setUsers(prev => prev.filter(u => u.id !== userId));
      toast.success(`${name} permanently removed`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to delete user');
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
      <p className="text-xs text-[color:var(--text-dim)]">{filtered.length} of {users.length} users</p>

      <div className="space-y-2">
        {filtered.map(u => (
          <div key={u.id} className="glass-panel rounded-2xl p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
              style={{ background: u.is_admin ? '#7B1A1A' : 'linear-gradient(135deg, #ff7722, #d4a017)' }}>
              {u.is_admin ? <Crown size={14} /> : (u.full_name?.[0] || u.username?.[0] || '?').toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-semibold text-[color:var(--text-cream)] truncate">{u.full_name || u.username}</p>
                {u.is_admin && <Shield size={11} className="text-[#7B1A1A] flex-shrink-0" />}
                {u.is_banned && <ShieldBan size={11} className="text-red-500 flex-shrink-0" />}
              </div>
              <p className="text-xs text-[color:var(--text-dim)] truncate">
                {u.username && `@${u.username}`}
                {u.city && ` · ${u.city}`}
                {u.tradition && ` · ${TRADITION_EMOJI[u.tradition] ?? ''}`}
                {` · 🔥${u.shloka_streak ?? 0} · ⭐${u.seva_score ?? 0}`}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => warnUser(u.id, u.full_name || u.username || 'User')}
                disabled={busyId === u.id}
                className="w-7 h-7 rounded-lg flex items-center justify-center border border-gray-200 text-[color:var(--text-dim)] hover:text-amber-500 hover:border-amber-200 transition"
                title="Send warning">
                <AlertTriangle size={12} />
              </button>
              <button onClick={() => toggleAdmin(u.id, u.is_admin ?? false)}
                disabled={busyId === u.id}
                className="w-7 h-7 rounded-lg flex items-center justify-center border border-gray-200 text-[color:var(--text-dim)] hover:text-[#7B1A1A] hover:border-[#7B1A1A]/30 transition"
                title={u.is_admin ? 'Remove admin' : 'Make admin'}>
                <Shield size={12} />
              </button>
              <button onClick={() => toggleBan(u.id, u.full_name || u.username || 'User', u.is_banned ?? false)}
                disabled={busyId === u.id}
                className={`w-7 h-7 rounded-lg flex items-center justify-center border border-gray-200 transition ${u.is_banned ? 'bg-red-500 text-white border-red-500' : 'text-[color:var(--text-dim)] hover:text-red-500 hover:border-red-200'}`}
                title={u.is_banned ? 'Unban user' : 'Ban user'}>
                <ShieldBan size={12} />
              </button>
              <button onClick={() => deleteUser(u.id, u.full_name || u.username || 'User')}
                disabled={busyId === u.id}
                className="w-7 h-7 rounded-lg flex items-center justify-center border border-gray-200 text-[color:var(--text-dim)] hover:text-red-600 hover:border-red-300 transition"
                title="Permanently delete (Auth)">
                <Trash2 size={12} />
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
          <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center text-xs font-bold text-[color:var(--text-dim)] flex-shrink-0">
            {post.type?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-[color:var(--text-dim)] mb-1">
              {post.profiles?.full_name || post.profiles?.username}
              {' · '}{new Date(post.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            </p>
            <p className="text-sm text-[color:var(--text-cream)] leading-snug line-clamp-2">{post.content}</p>
          </div>
          <button onClick={() => deletePost(post.id)}
            disabled={busyId === post.id}
            className="w-7 h-7 rounded-lg flex items-center justify-center border border-gray-200 text-[color:var(--text-dim)] hover:text-red-500 hover:border-red-200 transition flex-shrink-0">
            <Trash2 size={12} />
          </button>
        </div>
      ))}
      {posts.length === 0 && (
        <p className="text-center text-sm text-[color:var(--text-dim)] py-12">No posts yet</p>
      )}
    </div>
  );
}

// ── Hero Assets Tab ───────────────────────────────────────────────────────────
function HeroAssetsTab({ assets: initialAssets }: { assets: HeroAssetRow[] }) {
  const [assets, setAssets] = useState(initialAssets);
  const [uploading, setUploading] = useState(false);

  async function uploadHeroAsset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    setUploading(true);
    try {
      const response = await fetch('/api/admin/hero-assets', { method: 'POST', body: formData });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error ?? 'Hero upload failed');

      setAssets(prev => [payload.asset, ...prev]);
      form.reset();
      toast.success(payload.metadataStored ? 'Hero asset uploaded' : 'Image uploaded. Run migration v35 to store metadata.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Hero upload failed');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="glass-panel rounded-2xl p-4">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#7B1A1A0D', color: '#7B1A1A' }}>
            <ImageIcon size={18} />
          </div>
          <div>
            <h2 className="font-display font-bold text-[color:var(--text-cream)]">Hero assets</h2>
            <p className="text-xs text-[color:var(--text-dim)]">
              Files upload to Supabase Storage. The DB stores only metadata: tradition, ishta devata, festival, and object-position rules.
            </p>
          </div>
        </div>

        <div className="mb-4 rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-bg)] p-3">
          <p className="text-xs font-semibold text-[color:var(--text-cream)]">Upload rules</p>
          <div className="mt-2 grid gap-1.5 text-[11px] leading-relaxed text-[color:var(--text-dim)]">
            <p>Filename format: use lowercase kebab-case, e.g. <span className="font-mono text-[color:var(--brand-muted)]">shiv-default.webp</span>, <span className="font-mono text-[color:var(--brand-muted)]">janmashtami-krishna.webp</span>.</p>
            <p>Best image format: <span className="font-mono text-[color:var(--brand-muted)]">.webp</span>, portrait/tall crop, ideally 1200x1600 or 1440x1920, under 500 KB.</p>
            <p>Composition: keep the deity/subject upper-center or upper-right; the hero text sits at the bottom over a cream overlay.</p>
            <p>DB rule: image files stay in Supabase Storage bucket <span className="font-mono text-[color:var(--brand-muted)]">hero-assets</span>; DB stores metadata only.</p>
            <p>Matching fields are comma-separated. Example: traditions <span className="font-mono text-[color:var(--brand-muted)]">hindu</span>, sampradayas <span className="font-mono text-[color:var(--brand-muted)]">shaiva</span>, ishta devatas <span className="font-mono text-[color:var(--brand-muted)]">shiva, mahadev</span>, festival slugs <span className="font-mono text-[color:var(--brand-muted)]">maha-shivaratri</span>.</p>
            <p>Priority: higher number wins. Festival assets should usually be 100+, default tradition assets 10-50.</p>
          </div>
        </div>

        <form onSubmit={uploadHeroAsset} className="grid gap-3">
          <input name="label" required placeholder="Label, e.g. Shaiva default" className="rounded-xl border border-[color:var(--card-border)] bg-[color:var(--card-bg)] px-3 py-2 text-sm" />
          <input name="heroAlt" required placeholder="Alt text, e.g. Soft devotional Shiva artwork" className="rounded-xl border border-[color:var(--card-border)] bg-[color:var(--card-bg)] px-3 py-2 text-sm" />
          <div className="grid sm:grid-cols-2 gap-3">
            <input name="objectPosition" defaultValue="58% 24%" placeholder="Object position" className="rounded-xl border border-[color:var(--card-border)] bg-[color:var(--card-bg)] px-3 py-2 text-sm" />
            <input name="priority" type="number" defaultValue="0" placeholder="Priority" className="rounded-xl border border-[color:var(--card-border)] bg-[color:var(--card-bg)] px-3 py-2 text-sm" />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <input name="traditions" placeholder="Traditions: hindu, sikh" className="rounded-xl border border-[color:var(--card-border)] bg-[color:var(--card-bg)] px-3 py-2 text-sm" />
            <input name="sampradayas" placeholder="Sampradayas: shaiva, vaishnava" className="rounded-xl border border-[color:var(--card-border)] bg-[color:var(--card-bg)] px-3 py-2 text-sm" />
            <input name="ishtaDevatas" placeholder="Ishta devatas: shiva, krishna" className="rounded-xl border border-[color:var(--card-border)] bg-[color:var(--card-bg)] px-3 py-2 text-sm" />
            <input name="festivalSlugs" placeholder="Festival slugs: maha-shivaratri" className="rounded-xl border border-[color:var(--card-border)] bg-[color:var(--card-bg)] px-3 py-2 text-sm" />
          </div>
          <input name="tags" placeholder="Tags: soft, portrait, launch" className="rounded-xl border border-[color:var(--card-border)] bg-[color:var(--card-bg)] px-3 py-2 text-sm" />
          <input name="file" required type="file" accept="image/webp,image/jpeg,image/png" className="rounded-xl border border-dashed border-[color:var(--card-border)] bg-[color:var(--card-bg)] px-3 py-3 text-sm" />
          <button disabled={uploading} className="inline-flex items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold text-white disabled:opacity-60" style={{ background: '#7B1A1A' }}>
            <UploadCloud size={16} />
            {uploading ? 'Uploading...' : 'Upload hero asset'}
          </button>
        </form>
      </div>

      <div className="space-y-3">
        {assets.length === 0 && (
          <p className="glass-panel rounded-2xl p-4 text-sm text-[color:var(--text-dim)]">
            No DB hero assets found yet. Static config fallback is still active for Home.
          </p>
        )}
        {assets.map((asset) => (
          <div key={`${asset.id ?? asset.hero_image}-${asset.label}`} className="glass-panel rounded-2xl p-3 flex gap-3">
            <div className="h-20 w-16 rounded-xl bg-[color:var(--surface-soft)] bg-cover bg-center border border-[color:var(--card-border)]" style={{ backgroundImage: `url(${asset.hero_image})` }} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[color:var(--text-cream)]">{asset.label}</p>
              <p className="text-xs text-[color:var(--text-dim)] truncate">{asset.hero_alt}</p>
              <p className="text-[11px] text-[color:var(--brand-muted)] mt-1">Position: {asset.object_position} · Priority: {asset.priority}</p>
              <p className="text-[11px] text-[color:var(--text-dim)] mt-1 truncate">
                {[...asset.traditions, ...asset.sampradayas, ...asset.ishta_devatas, ...asset.festival_slugs].join(', ') || 'No tags'}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Broadcast Tab ─────────────────────────────────────────────────────────────
function BroadcastTab({ userCount }: { userCount: number }) {
  const [title,   setTitle]   = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  async function handleSend() {
    if (!title.trim() || !message.trim()) { toast.error('Fill in both fields'); return; }
    setSending(true);
    try {
      const res  = await fetch('/api/admin/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body: message }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error(data.error ?? 'Broadcast failed'); return; }
      toast.success(`📢 Broadcast sent to ${data.sent ?? userCount} users`);
      setTitle(''); setMessage('');
    } catch { toast.error('Broadcast request failed'); }
    finally { setSending(false); }
  }

  return (
    <div className="space-y-4">
      <div className="glass-panel rounded-2xl p-4">
        <p className="text-xs font-semibold text-amber-700">📢 Broadcast to all {userCount} users</p>
        <p className="text-xs text-amber-600 mt-1">Sends an in-app notification and a push via OneSignal. Use sparingly.</p>
      </div>
      <input type="text" placeholder="Notification title…" value={title}
        onChange={e => setTitle(e.target.value)}
        className="glass-input w-full px-4 py-3 rounded-xl focus:border-[#7B1A1A] outline-none text-sm" />
      <textarea placeholder="Message body…" value={message}
        onChange={e => setMessage(e.target.value)} rows={4}
        className="glass-input w-full px-4 py-3 rounded-xl focus:border-[#7B1A1A] outline-none resize-none text-sm" />
      <button onClick={handleSend} disabled={sending}
        className="glass-button-primary w-full py-3 text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition flex items-center justify-center gap-2">
        <Send size={14} /> {sending ? 'Sending…' : 'Send Broadcast 🙏'}
      </button>
    </div>
  );
}

// ── Notifications Tab ─────────────────────────────────────────────────────────
type CronResult = { ok: boolean; status: number; result: Record<string, unknown> } | null;
type PanchangDebug = Record<string, unknown> | null;

const CRONS = [
  { path: '/api/cron/brahma-muhurta',    label: 'Brahma Muhurta', emoji: '🌙', desc: 'Sacred wake-up alert sent exactly when each user\'s BM window opens' },
  { path: '/api/cron/nitya-reminder',    label: 'Nitya Karma',    emoji: '🌅', desc: 'Fires for users in Brahma Muhurta who haven\'t started today' },
  { path: '/api/cron/shloka-reminder',   label: 'Shloka Streak',  emoji: '🕉️', desc: 'Fires at 7 PM for users who haven\'t read today\'s shloka' },
  { path: '/api/cron/festival-reminder', label: 'Festival',       emoji: '🪔', desc: 'Fires 7 days and 1 day before tradition-matching festivals' },
  { path: '/api/cron/tithi-reminder',    label: 'Tithi',          emoji: '🌕', desc: 'Fires on Ekadashi, Purnima, Amavasya, Pradosh, Chaturthi, Shivaratri' },
] as const;

function NotificationsTab() {
  const [cronResults, setCronResults] = useState<Record<string, CronResult>>({});
  const [runningCron, setRunningCron] = useState<string | null>(null);
  const [panchang,    setPanchang]    = useState<PanchangDebug>(null);
  const [loadingPanchang, setLoadingPanchang] = useState(false);

  async function runCron(cronPath: string) {
    setRunningCron(cronPath);
    try {
      const res  = await fetch('/api/admin/run-cron', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cronPath }),
      });
      const data = await res.json().catch(() => ({}));
      setCronResults(prev => ({ ...prev, [cronPath]: { ok: res.ok, status: res.status, result: data.result ?? data } }));
      if (res.ok && data.result?.inserted > 0) toast.success(`Sent ${data.result.inserted} notification(s)`);
      else if (res.ok) toast.success(data.result?.message ?? 'Cron ran — no notifications sent this time');
      else toast.error(data.error ?? 'Cron failed');
    } catch { toast.error('Could not reach cron runner'); }
    finally { setRunningCron(null); }
  }

  async function loadPanchang() {
    setLoadingPanchang(true);
    try {
      const res  = await fetch('/api/admin/panchang-debug');
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error(data.error ?? 'Panchang debug failed'); return; }
      setPanchang(data);
    } catch { toast.error('Could not reach Panchang debug endpoint'); }
    finally { setLoadingPanchang(false); }
  }

  function fmtTime(iso: string | undefined) {
    if (!iso) return '—';
    return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  }

  return (
    <div className="space-y-6">

      {/* ── Panchang Debug ───────────────────────────────────────── */}
      <div className="glass-panel rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-sm text-[color:var(--text-cream)]">🪐 Live Panchang Engine</p>
            <p className="text-xs text-[color:var(--text-dim)] mt-0.5">Verifies the engine computes correctly for your saved location</p>
          </div>
          <button onClick={loadPanchang} disabled={loadingPanchang}
            className="px-4 py-1.5 rounded-xl text-xs font-semibold border border-[#7B1A1A]/30 text-[#7B1A1A] hover:bg-[#7B1A1A]/5 transition disabled:opacity-50">
            {loadingPanchang ? 'Computing…' : 'Run now'}
          </button>
        </div>

        {panchang && (
          <div className="grid grid-cols-2 gap-2 text-xs">
            {[
              { label: 'Tithi',      value: `${(panchang as any).tithi} (${(panchang as any).paksha} Paksha, #${(panchang as any).tithiIndex})` },
              { label: 'Nakshatra',  value: (panchang as any).nakshatra },
              { label: 'Yoga',       value: (panchang as any).yoga },
              { label: 'Brahma Muhurta', value: `${fmtTime((panchang as any).brahmaMuhurta?.start)} – ${fmtTime((panchang as any).brahmaMuhurta?.end)}` },
              { label: 'Rahu Kalam', value: `${fmtTime((panchang as any).rahuKaal?.start)} – ${fmtTime((panchang as any).rahuKaal?.end)}` },
              { label: 'Abhijit Muhurta', value: `${fmtTime((panchang as any).abhijitMuhurta?.start)} – ${fmtTime((panchang as any).abhijitMuhurta?.end)}` },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl bg-gray-50 px-3 py-2">
                <p className="text-[color:var(--text-dim)]">{label}</p>
                <p className="font-medium text-[color:var(--text-cream)] mt-0.5">{value}</p>
              </div>
            ))}
            <div className="col-span-2 rounded-xl px-3 py-2 flex gap-4"
              style={{ background: (panchang as any).brahmaMuhurta?.active_now ? '#dcfce7' : '#fef9c3' }}>
              <span className="text-xs font-semibold">
                {(panchang as any).brahmaMuhurta?.active_now ? '✅ In Brahma Muhurta right now' : '⏳ Outside Brahma Muhurta window'}
              </span>
              {(panchang as any).rahuKaal?.active_now && (
                <span className="text-xs font-semibold text-red-600">⚠️ Rahu Kalam active — crons will skip users</span>
              )}
            </div>
            {(panchang as any).tithi_reminder && (
              <div className="col-span-2 rounded-xl px-3 py-2 bg-amber-50">
                <p className="text-[color:var(--text-dim)] text-[10px] mb-1">Today&apos;s tithi reminder (tithi-reminder cron would send this)</p>
                <p className="font-semibold text-amber-800">{(panchang as any).tithi_reminder?.title}</p>
                <p className="text-amber-700 mt-0.5">{(panchang as any).tithi_reminder?.body}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Cron Runners ─────────────────────────────────────────── */}
      <div className="space-y-3">
        <p className="font-semibold text-sm text-[color:var(--text-cream)] px-1">⚡ Trigger Crons Manually</p>
        {CRONS.map(({ path, label, emoji, desc }) => {
          const result = cronResults[path];
          const running = runningCron === path;
          return (
            <div key={path} className="glass-panel rounded-2xl p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="font-semibold text-sm text-[color:var(--text-cream)]">{emoji} {label} Reminder</p>
                  <p className="text-xs text-[color:var(--text-dim)] mt-0.5">{desc}</p>
                </div>
                <button
                  onClick={() => runCron(path)}
                  disabled={running || runningCron !== null}
                  className="shrink-0 px-4 py-1.5 rounded-xl text-xs font-semibold border border-[#7B1A1A]/30 text-[#7B1A1A] hover:bg-[#7B1A1A]/5 transition disabled:opacity-40"
                >
                  {running ? 'Running…' : 'Run now'}
                </button>
              </div>
              {result && (
                <div className={`rounded-xl px-3 py-2.5 text-xs font-mono space-y-1 ${result.ok ? 'bg-green-50' : 'bg-red-50'}`}>
                  <p className={`font-semibold ${result.ok ? 'text-green-700' : 'text-red-700'}`}>
                    {result.ok ? '✅' : '❌'} HTTP {result.status}
                  </p>
                  <pre className="text-[color:var(--brand-muted)] whitespace-pre-wrap break-all text-[10px]">
                    {JSON.stringify(result.result, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Test notification to self ─────────────────────────────── */}
      <div className="glass-panel rounded-2xl p-4 flex items-center justify-between gap-4">
        <div>
          <p className="font-semibold text-sm text-[color:var(--text-cream)]">🔔 Test Notification (to yourself)</p>
          <p className="text-xs text-[color:var(--text-dim)] mt-0.5">Inserts a notification into the DB + fires a push to your device</p>
        </div>
        <button
          onClick={async () => {
            const res  = await fetch('/api/notifications/test', { method: 'POST' });
            const data = await res.json().catch(() => ({}));
            res.ok ? toast.success(data.push_targets > 0 ? 'Test sent — check bell + browser 🔔' : 'Added to bell 🔔') : toast.error(data.error ?? 'Failed');
          }}
          className="shrink-0 px-4 py-1.5 rounded-xl text-xs font-semibold border border-[#7B1A1A]/30 text-[#7B1A1A] hover:bg-[#7B1A1A]/5 transition"
        >
          Send test
        </button>
      </div>
    </div>
  );
}

// ── Festivals Tab ─────────────────────────────────────────────────────────────
type FestivalRow = { id: string; name: string; date: string; emoji: string; description: string; type: string; tradition: string };

const TRADITION_OPTIONS = ['hindu', 'sikh', 'buddhist', 'jain', 'all'] as const;
const TYPE_OPTIONS      = ['major', 'vrat', 'regional'] as const;

function FestivalsTab() {
  const [festivals,    setFestivals]    = useState<FestivalRow[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [deletingId,   setDeletingId]   = useState<string | null>(null);
  const [showForm,     setShowForm]     = useState(false);
  const [filterTrad,   setFilterTrad]   = useState<string>('all');
  const [form, setForm] = useState({
    name: '', date: '', emoji: '🪔', description: '', type: 'major', tradition: 'hindu',
  });

  // Calendar health: how many festivals remain from today?
  const today = new Date().toISOString().split('T')[0];
  const upcoming = festivals.filter(f => f.date >= today);
  const calendarHealthy = upcoming.length >= 30;

  async function load() {
    setLoading(true);
    try {
      const res  = await fetch('/api/admin/festivals');
      const data = await res.json();
      setFestivals(data.festivals ?? []);
    } catch { toast.error('Could not load festivals'); }
    finally  { setLoading(false); }
  }

  useState(() => { load(); });

  async function addFestival(e: FormEvent) {
    e.preventDefault();
    if (!form.name || !form.date) { toast.error('Name and date are required'); return; }
    setSaving(true);
    try {
      await requestJson('/api/admin/festivals', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      toast.success('Festival added ✅');
      setForm({ name: '', date: '', emoji: '🪔', description: '', type: 'major', tradition: 'hindu' });
      setShowForm(false);
      await load();
    } catch (err: any) { toast.error(err.message ?? 'Failed'); }
    finally { setSaving(false); }
  }

  async function deleteFestival(id: string, name: string) {
    if (!confirm(`Delete "${name}"?`)) return;
    setDeletingId(id);
    try {
      await requestJson(`/api/admin/festivals?id=${id}`, { method: 'DELETE' });
      toast.success('Deleted');
      setFestivals(prev => prev.filter(f => f.id !== id));
    } catch (err: any) { toast.error(err.message ?? 'Failed'); }
    finally { setDeletingId(null); }
  }

  const visible = filterTrad === 'all'
    ? festivals
    : festivals.filter(f => f.tradition === filterTrad);

  return (
    <div className="space-y-4 pb-8">
      {/* Calendar health banner */}
      {!loading && !calendarHealthy && (
        <div className="rounded-2xl border border-amber-400/40 bg-amber-400/8 px-4 py-3 flex items-start gap-3">
          <span className="text-xl">⚠️</span>
          <div>
            <p className="font-semibold text-sm text-amber-400">Calendar running low</p>
            <p className="text-xs text-[color:var(--text-dim)] mt-0.5">
              Only <strong>{upcoming.length}</strong> upcoming festivals remain. Add next year&apos;s entries before the year ends so reminders and countdowns keep working.
            </p>
          </div>
        </div>
      )}
      {!loading && calendarHealthy && (
        <div className="rounded-2xl border border-green-500/20 bg-green-500/5 px-4 py-3 flex items-center gap-3">
          <span className="text-lg">✅</span>
          <p className="text-xs text-[color:var(--text-dim)]">
            <strong className="text-green-400">{upcoming.length}</strong> upcoming festivals — calendar is healthy.
          </p>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center gap-2 flex-wrap">
        {(['all', ...TRADITION_OPTIONS] as string[]).map(t => (
          <button key={t} onClick={() => setFilterTrad(t)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
              filterTrad === t
                ? 'border-[#7B1A1A] bg-[#7B1A1A]/10 text-[#C8924A]'
                : 'border-white/10 text-[color:var(--text-dim)]'
            }`}
          >
            {TRADITION_EMOJI[t] ?? '🌐'} {t}
          </button>
        ))}
        <button
          onClick={() => setShowForm(v => !v)}
          className="ml-auto px-3 py-1.5 rounded-xl text-xs font-semibold border border-[#7B1A1A]/40 text-[#C8924A] hover:bg-[#7B1A1A]/8 transition-all"
        >
          {showForm ? '✕ Cancel' : '+ Add festival'}
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <form onSubmit={addFestival} className="glass-panel rounded-2xl p-4 space-y-3">
          <p className="font-semibold text-sm text-[color:var(--text-cream)]">New Festival</p>
          <div className="grid grid-cols-2 gap-3">
            <input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="Name" className="col-span-2 input-field text-sm" />
            <input required type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
              className="input-field text-sm" />
            <input value={form.emoji} onChange={e => setForm(p => ({ ...p, emoji: e.target.value }))}
              placeholder="Emoji" className="input-field text-sm" maxLength={4} />
            <select value={form.tradition} onChange={e => setForm(p => ({ ...p, tradition: e.target.value }))}
              className="input-field text-sm">
              {TRADITION_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
              className="input-field text-sm">
              {TYPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="Description" rows={2} className="col-span-2 input-field text-sm resize-none" />
          </div>
          <button type="submit" disabled={saving}
            className="w-full py-2.5 rounded-xl text-sm font-semibold bg-[#7B1A1A] text-white disabled:opacity-50">
            {saving ? 'Saving…' : 'Add Festival'}
          </button>
        </form>
      )}

      {/* Festival list */}
      {loading ? (
        <p className="text-xs text-[color:var(--text-dim)] text-center py-8">Loading…</p>
      ) : visible.length === 0 ? (
        <p className="text-xs text-[color:var(--text-dim)] text-center py-8">No festivals found.</p>
      ) : (
        <div className="space-y-2">
          {visible.map(f => (
            <div key={f.id}
              className={`glass-panel rounded-2xl px-4 py-3 flex items-center gap-3 ${f.date < today ? 'opacity-50' : ''}`}>
              <span className="text-xl shrink-0">{f.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-sm text-[color:var(--text-cream)] truncate">{f.name}</p>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full border"
                    style={{ borderColor: 'rgba(200,146,74,0.3)', color: '#C8924A', background: 'rgba(200,146,74,0.08)' }}>
                    {f.tradition}
                  </span>
                  <span className="text-[10px] text-[color:var(--text-dim)]">{f.type}</span>
                </div>
                <p className="text-xs text-[color:var(--text-dim)] mt-0.5">{f.date}</p>
              </div>
              <button onClick={() => deleteFestival(f.id, f.name)} disabled={deletingId === f.id}
                className="shrink-0 p-1.5 rounded-lg hover:bg-red-500/10 text-red-400/60 hover:text-red-400 transition-all disabled:opacity-40">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Admin Component ──────────────────────────────────────────────────────
export default function AdminClient({ adminName, users, reports, posts, kuls, mandalis, heroAssets }: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const pendingReports = reports.filter(r => r.status === 'pending').length;

  const tabs: Array<{ key: TabKey; label: string; icon: React.ReactNode; badge?: number }> = [
    { key: 'dashboard',     label: 'Dashboard',      icon: <BarChart2 size={14} /> },
    { key: 'moderation',    label: 'Moderation',     icon: <Flag size={14} />, badge: pendingReports || undefined },
    { key: 'users',         label: 'Users',          icon: <Users size={14} />, badge: users.length },
    { key: 'posts',         label: 'Posts',          icon: <MessageSquare size={14} /> },
    { key: 'hero-assets',   label: 'Hero assets',    icon: <ImageIcon size={14} />, badge: heroAssets.length || undefined },
    { key: 'notifications', label: 'Notifications',  icon: <CheckCircle size={14} /> },
    { key: 'broadcast',     label: 'Broadcast',      icon: <Send size={14} /> },
    { key: 'festivals',     label: 'Festivals',      icon: <span className="text-xs">🪔</span> },
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
            <h1 className="font-display font-bold text-[color:var(--text-cream)] text-base">Admin Portal</h1>
            <p className="text-xs text-[color:var(--text-dim)]">Sanatana Sangam · {adminName}</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <a href="/home" className="text-xs text-[color:var(--text-dim)] hover:text-[color:var(--brand-muted)] flex items-center gap-1">
              <Home size={12} /> App
            </a>
            <button
              onClick={async () => {
                await fetch('/api/admin/auth', { method: 'DELETE' });
                window.location.href = '/admin/login';
              }}
              className="text-xs text-[color:var(--text-dim)] hover:text-red-500 flex items-center gap-1 transition-colors"
              title="Sign out"
            >
              <LogOut size={12} /> Sign out
            </button>
          </div>
        </div>

        {/* Tab bar */}
        <div className="max-w-4xl mx-auto px-4 flex gap-1 pb-0 overflow-x-auto">
          {tabs.map(({ key, label, icon, badge }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap relative ${
                activeTab === key
                  ? 'border-[#7B1A1A] text-[#7B1A1A]'
                  : 'border-transparent text-[color:var(--brand-muted)] hover:text-[color:var(--text-muted-warm)]'
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
        {activeTab === 'dashboard'     && <DashboardTab     users={users} reports={reports} kuls={kuls} mandalis={mandalis} onTabChange={setActiveTab} />}
        {activeTab === 'moderation'    && <ModerationTab    reports={reports} />}
        {activeTab === 'users'         && <UsersTab         users={users} />}
        {activeTab === 'posts'         && <PostsTab         posts={posts} />}
        {activeTab === 'hero-assets'   && <HeroAssetsTab    assets={heroAssets} />}
        {activeTab === 'notifications' && <NotificationsTab />}
        {activeTab === 'broadcast'     && <BroadcastTab     userCount={users.length} />}
        {activeTab === 'festivals'     && <FestivalsTab />}
      </div>
    </div>
  );
}
