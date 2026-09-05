'use client';

import Link from 'next/link';
import { useEffect, useState, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, UserMinus, UserCheck, Shield, ArrowLeft, Trash2, ShieldOff,
  MapPin, Flame, Mail, Calendar, ChevronRight, Filter, MoreVertical,
  AlertCircle, Users, History, UserPlus, Heart, Sparkles,
  RefreshCw, Clock, Award, ShieldAlert, ArrowUpDown, ExternalLink,
  CheckCircle2, XCircle, Ban, Zap, Smartphone
} from 'lucide-react';
import { getInitials } from '@/lib/utils';
import toast from 'react-hot-toast';

interface UserProfile {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  email?: string;
  tradition: string | null;
  is_banned: boolean;
  shloka_streak: number;
  karma_points: number;
  city: string | null;
  country: string | null;
  created_at: string;
  is_deleting?: boolean;
  deletion_requested_at?: string | null;
}

interface UserStats {
  total: number;
  newThisWeek: number;
  activeSadhaks: number;
  staleUsers: number;
  banned: number;
  deletionPending: number;
}

export default function UserManagement() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const urlSegment = searchParams.get('segment') || 'all';
  const urlQuery = searchParams.get('query') || '';
  const urlUserId = searchParams.get('userId');

  const [query, setQuery] = useState(urlQuery);
  const [segment, setSegment] = useState<string>(urlSegment);
  const [sort, setSort] = useState<string>('newest');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set('query', query.trim());
      if (segment !== 'all') params.set('segment', segment);
      if (sort !== 'newest') params.set('sort', sort);
      if (urlUserId) params.set('userId', urlUserId);

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch seekers');

      const userList: UserProfile[] = data.users || [];
      setUsers(userList);
      setStats(data.stats || null);

      if (urlUserId && userList.length > 0) {
        setSelectedUser(userList[0]);
      } else if (userList.length > 0 && !selectedUser) {
        setSelectedUser(userList[0]);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to load seekers');
    } finally {
      setLoading(false);
    }
  }, [query, segment, sort, urlUserId]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleSegmentChange = (newSegment: string) => {
    setSegment(newSegment);
    setSelectedUser(null);
  };

  const handleDeleteUser = async (user: UserProfile, mode: 'complete' | 'pii') => {
    const title = mode === 'complete' ? 'Complete Hard Purge' : 'PII Scrub & Disable';
    const confirmMsg = mode === 'complete'
      ? `Are you sure you want to PERMANENTLY PURGE @${user.username || user.id}? This will hard delete their account from Supabase Auth and database ledgers.`
      : `Are you sure you want to SCRUB ALL PII for @${user.username || user.id}? Personal identifiers will be erased and login disabled.`;

    if (!confirm(`${title}\n\n${confirmMsg}`)) return;

    try {
      const res = await fetch(`/api/admin/users/${user.id}?mode=${mode}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Deletion failed');

      toast.success(
        mode === 'complete' ? 'Seeker permanently purged' : 'Seeker PII scrubbed & account disabled'
      );

      setUsers(prev => prev.filter(u => u.id !== user.id));
      if (selectedUser?.id === user.id) {
        setSelectedUser(null);
      }
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || 'Deletion failed');
    }
  };

  const toggleBan = async (user: UserProfile) => {
    const action = user.is_banned ? 'unban' : 'ban';
    if (!confirm(`Are you sure you want to ${action} @${user.username || user.id}?`)) return;

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Action failed');

      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_banned: !user.is_banned } : u));
      if (selectedUser?.id === user.id) {
        setSelectedUser({ ...selectedUser, is_banned: !user.is_banned });
      }
      toast.success(`Seeker account ${action}ned successfully`);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || 'Action failed');
    }
  };

  return (
    <div className="min-h-screen bg-[var(--divine-bg,#FAF6EF)] font-outfit pb-24 text-stone-900">
      
      {/* Top Banner */}
      <div className="border-b border-[rgba(197,160,89,0.2)] bg-white/40 backdrop-blur-md px-6 py-5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link 
              href="/admin" 
              className="p-2 rounded-xl bg-black/5 hover:bg-black/10 text-[var(--brand-muted)] hover:text-stone-900 transition-all"
              title="Return to Command Center"
            >
              <ArrowLeft size={18} />
            </Link>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-800 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Users size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold font-serif theme-ink leading-tight">Seeker Directory & Dossiers</h1>
                <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-700 text-[10px] font-bold uppercase tracking-wider">
                  Level 2 Ops
                </span>
              </div>
              <p className="text-xs text-[var(--brand-muted)]">
                End-to-end seeker lifecycle tracking, sadhana journey ledgers, and governance actions.
              </p>
            </div>
          </div>

          {/* Quick Refresh */}
          <div className="flex items-center gap-2">
            <button
              onClick={fetchUsers}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-black/10 bg-white hover:bg-black/5 text-xs font-bold transition-all shadow-xs"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin text-amber-600' : ''} />
              <span>Refresh Directory</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        
        {/* ─── LIFECYCLE KPI CARDS ─────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div 
            onClick={() => handleSegmentChange('all')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              segment === 'all' ? 'bg-white border-blue-500 shadow-md ring-2 ring-blue-500/20' : 'bg-white/60 border-black/5 hover:border-black/15'
            }`}
          >
            <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider block">Total Seekers</span>
            <b className="text-2xl font-bold text-gray-900 mt-1 block">{stats?.total?.toLocaleString() ?? 0}</b>
            <span className="text-[9px] text-gray-400">All registered</span>
          </div>

          <div 
            onClick={() => handleSegmentChange('new_signups')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              segment === 'new_signups' ? 'bg-purple-50/50 border-purple-500 shadow-md ring-2 ring-purple-500/20' : 'bg-white/60 border-black/5 hover:border-black/15'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-purple-700 tracking-wider">✨ New Signups</span>
              <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
            </div>
            <b className="text-2xl font-bold text-purple-900 mt-1 block">+{stats?.newThisWeek?.toLocaleString() ?? 0}</b>
            <span className="text-[9px] text-purple-600 font-medium">Joined last 7 days</span>
          </div>

          <div 
            onClick={() => handleSegmentChange('active_sadhaks')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              segment === 'active_sadhaks' ? 'bg-emerald-50/50 border-emerald-500 shadow-md ring-2 ring-emerald-500/20' : 'bg-white/60 border-black/5 hover:border-black/15'
            }`}
          >
            <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider block">🔥 Active Sadhaks</span>
            <b className="text-2xl font-bold text-emerald-900 mt-1 block">{stats?.activeSadhaks?.toLocaleString() ?? 0}</b>
            <span className="text-[9px] text-emerald-600 font-medium">Daily practice active</span>
          </div>

          <div 
            onClick={() => handleSegmentChange('stale_users')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              segment === 'stale_users' ? 'bg-amber-50/50 border-amber-500 shadow-md ring-2 ring-amber-500/20' : 'bg-white/60 border-black/5 hover:border-black/15'
            }`}
          >
            <span className="text-[10px] uppercase font-bold text-amber-700 tracking-wider block">💤 Dormant Seekers</span>
            <b className="text-2xl font-bold text-amber-900 mt-1 block">{stats?.staleUsers?.toLocaleString() ?? 0}</b>
            <span className="text-[9px] text-amber-600 font-medium">Inactive &gt;30 days</span>
          </div>

          <div 
            onClick={() => handleSegmentChange('banned')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              segment === 'banned' ? 'bg-rose-50/50 border-rose-500 shadow-md ring-2 ring-rose-500/20' : 'bg-white/60 border-black/5 hover:border-black/15'
            }`}
          >
            <span className="text-[10px] uppercase font-bold text-rose-700 tracking-wider block">🚫 Suspended</span>
            <b className="text-2xl font-bold text-rose-900 mt-1 block">{stats?.banned?.toLocaleString() ?? 0}</b>
            <span className="text-[9px] text-rose-600 font-medium">Banned accounts</span>
          </div>

          <div 
            onClick={() => handleSegmentChange('deletion_pending')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              segment === 'deletion_pending' ? 'bg-stone-100 border-stone-600 shadow-md ring-2 ring-stone-500/20' : 'bg-white/60 border-black/5 hover:border-black/15'
            }`}
          >
            <span className="text-[10px] uppercase font-bold text-stone-700 tracking-wider block">🗑️ Deletion (DPDP)</span>
            <b className="text-2xl font-bold text-stone-900 mt-1 block">{stats?.deletionPending?.toLocaleString() ?? 0}</b>
            <span className="text-[9px] text-stone-500 font-medium">Cooling-off period</span>
          </div>
        </div>

        {/* ─── SEARCH & FILTER TOOLBAR ────────────────────────────────────── */}
        <div className="glass-panel rounded-2xl p-4 border border-black/5 bg-white/70 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search seekers by username, full name, or UUID..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              />
            </form>

            {/* Lifecycle Segment Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto py-1 scrollbar-none">
              {[
                { id: 'all', label: 'All Seekers' },
                { id: 'new_signups', label: '✨ New' },
                { id: 'active_sadhaks', label: '🔥 Active' },
                { id: 'stale_users', label: '💤 Dormant' },
                { id: 'banned', label: '🚫 Banned' },
                { id: 'deletion_pending', label: '🗑️ Deletion' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleSegmentChange(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    segment === tab.id
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-black/5 text-gray-700 hover:bg-black/10'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Sort Selector */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Sort:</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none focus:border-blue-500"
              >
                <option value="newest">Newest Joined</option>
                <option value="streak">Longest Streak 🔥</option>
                <option value="karma">Highest Karma ☸</option>
                <option value="name">Name (A-Z)</option>
              </select>
            </div>
          </div>
        </div>

        {/* ─── MAIN TWO-COLUMN WORKSPACE ───────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Seeker List (7 Cols) */}
          <div className="lg:col-span-7 space-y-3">
            {loading ? (
              <div className="text-center py-16 glass-panel rounded-3xl border border-black/5 bg-white/40 space-y-3">
                <RefreshCw size={24} className="animate-spin text-blue-600 mx-auto" />
                <p className="text-xs font-bold text-gray-600">Querying seeker ledger records...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-20 glass-panel rounded-3xl border border-black/5 bg-white/40 space-y-3">
                <div className="w-14 h-14 bg-black/5 rounded-full flex items-center justify-center mx-auto text-gray-400">
                  <Search size={28} />
                </div>
                <h3 className="text-base font-bold theme-ink">No Seekers Found</h3>
                <p className="text-xs text-[var(--brand-muted)] max-w-sm mx-auto">
                  No seeker profiles match the current filter or search criteria.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {users.map((user) => {
                  const isSelected = selectedUser?.id === user.id;
                  const isNew = user.created_at >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
                  
                  return (
                    <motion.div
                      key={user.id}
                      layoutId={user.id}
                      onClick={() => setSelectedUser(user)}
                      className={`group relative overflow-hidden glass-panel rounded-2xl p-4 border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50/20 shadow-md ring-2 ring-blue-500/20'
                          : 'border-black/5 hover:border-blue-500/40 bg-white/70 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5 min-w-0">
                          {/* Avatar */}
                          <div className="relative w-12 h-12 rounded-2xl overflow-hidden border border-black/10 shrink-0 bg-blue-500/10">
                            {user.avatar_url ? (
                              <Image src={user.avatar_url} alt="" fill className="object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-blue-700 font-bold text-sm">
                                {getInitials(user.full_name || user.username)}
                              </div>
                            )}
                            {user.is_banned && (
                              <div className="absolute inset-0 bg-rose-600/70 flex items-center justify-center">
                                <Ban size={14} className="text-white" />
                              </div>
                            )}
                          </div>

                          {/* Seeker Vitals */}
                          <div className="space-y-0.5 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-sm font-bold theme-ink truncate">
                                {user.full_name || 'Anonymous Seeker'}
                              </h4>
                              {isNew && (
                                <span className="px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 text-[9px] font-bold">
                                  NEW
                                </span>
                              )}
                              {user.is_deleting && (
                                <span className="px-1.5 py-0.2 rounded bg-stone-200 text-stone-800 text-[9px] font-bold">
                                  DELETION PENDING
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-gray-500 font-mono">@{user.username || user.id.slice(0, 8)}</p>
                            <p className="text-[10px] text-gray-400">
                              Joined {new Date(user.created_at).toLocaleDateString()} · {user.tradition || 'Sanatan'}
                            </p>
                          </div>
                        </div>

                        {/* Badges & Actions */}
                        <div className="flex items-center gap-4 shrink-0">
                          <div className="text-right space-y-1">
                            <div className="flex items-center gap-1.5 justify-end text-xs font-bold">
                              <span className="flex items-center gap-0.5 text-amber-600">
                                <Flame size={13} /> {user.shloka_streak || 0}d
                              </span>
                              <span className="text-gray-300">•</span>
                              <span className="text-emerald-700 font-mono text-[11px]">
                                {user.karma_points || 0} pts
                              </span>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider block ${
                              user.is_banned ? 'bg-rose-100 text-rose-800' :
                              user.is_deleting ? 'bg-stone-200 text-stone-700' : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {user.is_banned ? 'Banned' : user.is_deleting ? 'Deleting' : 'Active'}
                            </span>
                          </div>

                          <ChevronRight size={16} className={`text-gray-400 group-hover:translate-x-1 transition-transform ${isSelected ? 'text-blue-600' : ''}`} />
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Live Seeker Dossier & Action Inspector (5 Cols) */}
          <div className="lg:col-span-5">
            <AnimatePresence mode="wait">
              {selectedUser ? (
                <motion.div
                  key={selectedUser.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="sticky top-24 glass-panel rounded-3xl border border-black/10 p-6 space-y-6 bg-white shadow-lg"
                >
                  {/* Seeker Profile Summary */}
                  <div className="flex flex-col items-center text-center space-y-3 pb-4 border-b border-black/5">
                    <div className="relative w-20 h-20 rounded-3xl overflow-hidden border-2 border-white shadow-lg bg-blue-500/10">
                      {selectedUser.avatar_url ? (
                        <Image src={selectedUser.avatar_url} alt="" fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-blue-700 text-xl font-bold">
                          {getInitials(selectedUser.full_name || selectedUser.username)}
                        </div>
                      )}
                    </div>
                    <div>
                      <h2 className="text-lg font-bold font-serif theme-ink">{selectedUser.full_name || 'Anonymous Seeker'}</h2>
                      <p className="text-xs text-blue-600 font-mono font-bold">@{selectedUser.username}</p>
                      <p className="text-[10px] text-gray-400 font-mono mt-0.5">UUID: {selectedUser.id}</p>
                    </div>
                  </div>

                  {/* Vitals Grid */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 space-y-0.5">
                      <span className="text-[10px] uppercase font-bold text-gray-400">Tradition</span>
                      <p className="font-bold text-gray-800">{selectedUser.tradition || 'Sanatan (Universal)'}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 space-y-0.5">
                      <span className="text-[10px] uppercase font-bold text-gray-400">Location</span>
                      <p className="font-bold text-gray-800">{selectedUser.city ? `${selectedUser.city}, ${selectedUser.country || ''}` : 'Hidden'}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-0.5">
                      <span className="text-[10px] uppercase font-bold text-amber-800">Shloka Streak</span>
                      <p className="font-bold text-amber-950 font-mono text-sm">{selectedUser.shloka_streak || 0} Days 🔥</p>
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-0.5">
                      <span className="text-[10px] uppercase font-bold text-emerald-800">Karma Punya</span>
                      <p className="font-bold text-emerald-950 font-mono text-sm">{selectedUser.karma_points || 0} Pts ☸</p>
                    </div>
                  </div>

                  {/* Deep Linking Navigation Cards */}
                  <div className="space-y-2 pt-2">
                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">
                      End-to-End Dossier Deep Links
                    </span>

                    <Link
                      href={`/admin/users/${selectedUser.id}?tab=timeline`}
                      className="w-full p-3 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-950 text-xs font-bold flex items-center justify-between transition-all"
                    >
                      <div className="flex items-center gap-2">
                        <History size={14} className="text-amber-700" />
                        <span>Devotional Journey Timeline</span>
                      </div>
                      <ChevronRight size={14} />
                    </Link>

                    <Link
                      href={`/admin/users/${selectedUser.id}?tab=notifications`}
                      className="w-full p-3 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-800 text-xs font-bold flex items-center justify-between transition-all"
                    >
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-gray-600" />
                        <span>Push Notification & Quiet Hours Ledger</span>
                      </div>
                      <ChevronRight size={14} />
                    </Link>

                    <Link
                      href={`/admin/users/${selectedUser.id}?tab=karma`}
                      className="w-full p-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-950 text-xs font-bold flex items-center justify-between transition-all"
                    >
                      <div className="flex items-center gap-2">
                        <Award size={14} className="text-emerald-700" />
                        <span>Karma Points Reconciler</span>
                      </div>
                      <ChevronRight size={14} />
                    </Link>

                    <Link
                      href={`/admin/users/${selectedUser.id}?tab=compliance`}
                      className="w-full p-3 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-950 text-xs font-bold flex items-center justify-between transition-all"
                    >
                      <div className="flex items-center gap-2">
                        <Smartphone size={14} className="text-purple-700" />
                        <span>Registered Devices & DPDP Consent</span>
                      </div>
                      <ChevronRight size={14} />
                    </Link>
                  </div>

                  {/* Primary & Governance Actions */}
                  <div className="pt-4 border-t border-black/5 space-y-2.5">
                    <Link
                      href={`/admin/users/${selectedUser.id}`}
                      className="w-full py-3 rounded-xl bg-amber-900 hover:bg-amber-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-amber-950/20 transition-all"
                    >
                      <Sparkles size={15} />
                      <span>Open Full Comprehensive Dossier &rarr;</span>
                    </Link>

                    <button
                      onClick={() => toggleBan(selectedUser)}
                      className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                        selectedUser.is_banned 
                          ? 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700' 
                          : 'bg-rose-500/15 text-rose-700 hover:bg-rose-600 hover:text-white'
                      }`}
                    >
                      {selectedUser.is_banned ? (
                        <> <UserCheck size={14} /> Unban Seeker Account </>
                      ) : (
                        <> <UserMinus size={14} /> Suspend / Ban Seeker </>
                      )}
                    </button>

                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <button
                        onClick={() => handleDeleteUser(selectedUser, 'pii')}
                        className="py-2.5 px-3 rounded-xl bg-amber-500/10 text-amber-800 hover:bg-amber-500 hover:text-white font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all"
                        title="Scrubs personal identifiers, disables login, retains anonymized sadhana counts"
                      >
                        <ShieldOff size={13} /> Scrub PII
                      </button>
                      <button
                        onClick={() => handleDeleteUser(selectedUser, 'complete')}
                        className="py-2.5 px-3 rounded-xl bg-rose-500/10 text-rose-700 hover:bg-rose-600 hover:text-white font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all"
                        title="Hard purges account from Supabase Auth and database tables"
                      >
                        <Trash2 size={13} /> Hard Purge
                      </button>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="sticky top-24 h-[450px] flex flex-col items-center justify-center text-center p-8 glass-panel rounded-3xl border border-dashed border-black/10 bg-white/40 space-y-3">
                  <div className="w-14 h-14 bg-black/5 rounded-full flex items-center justify-center text-gray-400">
                    <Shield size={28} />
                  </div>
                  <h3 className="text-base font-bold theme-ink">Seeker Intelligence</h3>
                  <p className="text-xs text-[var(--brand-muted)] max-w-xs">
                    Select any seeker from the list to view their complete dossier, device tokens, and journey telemetry.
                  </p>
                </div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>
    </div>
  );
}
