'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, UserMinus, UserCheck, Shield, 
  MapPin, Flame, Mail, Calendar, 
  ChevronRight, Filter, MoreVertical,
  AlertCircle, Users
} from 'lucide-react';
import { createClient } from '@/lib/supabase';
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
  city: string | null;
  country: string | null;
  created_at: string;
}

export default function UserManagement() {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const supabase = createClient();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
        .limit(20);

      if (error) throw error;
      setUsers(data || []);
    } catch (err: any) {
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const toggleBan = async (user: UserProfile) => {
    const action = user.is_banned ? 'unban' : 'ban';
    if (!confirm(`Are you sure you want to ${action} @${user.username}?`)) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_banned: !user.is_banned })
        .eq('id', user.id);

      if (error) throw error;

      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_banned: !user.is_banned } : u));
      if (selectedUser?.id === user.id) {
        setSelectedUser({ ...selectedUser, is_banned: !user.is_banned });
      }
      toast.success(`User ${action}ned successfully`);
    } catch (err: any) {
      toast.error('Action failed');
    }
  };

  return (
    <div className="min-h-screen bg-[var(--divine-bg)] pb-24 font-outfit">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[var(--divine-bg)]/80 backdrop-blur-xl border-b border-[rgba(200,146,74,0.15)] px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
              <Users size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold font-serif theme-ink">User Directory</h1>
              <p className="text-[10px] text-[var(--brand-muted)] uppercase tracking-[0.2em] font-bold">Level 2 Access</p>
            </div>
          </div>
          
          <form onSubmit={handleSearch} className="flex-1 max-w-md mx-8 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--brand-muted)]" size={18} />
            <input 
              type="text" 
              placeholder="Search by username or name..." 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-[var(--surface-raised)] border border-black/5 rounded-full pl-12 pr-4 py-2 text-sm focus:border-blue-500 outline-none transition-all"
            />
          </form>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Results List */}
          <div className="lg:col-span-7 space-y-4">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto" />
                <p className="text-sm text-[var(--brand-muted)] mt-4">Searching seekers...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-24 glass-panel rounded-[2rem] border border-black/5">
                <div className="w-16 h-16 bg-black/5 rounded-full flex items-center justify-center mx-auto text-[var(--brand-muted)] mb-4">
                  <Search size={32} />
                </div>
                <h3 className="text-lg font-serif theme-ink">No seekers found</h3>
                <p className="text-sm text-[var(--brand-muted)]">Search by username or full name to manage profiles.</p>
              </div>
            ) : (
              users.map((user) => (
                <motion.div
                  key={user.id}
                  layoutId={user.id}
                  onClick={() => setSelectedUser(user)}
                  className={`group relative overflow-hidden glass-panel rounded-3xl p-4 border transition-all cursor-pointer ${
                    selectedUser?.id === user.id ? 'border-blue-500 bg-blue-50/10' : 'border-black/5 hover:border-blue-500/30'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="relative w-12 h-12 rounded-full overflow-hidden border border-black/5">
                      {user.avatar_url ? (
                        <Image src={user.avatar_url} alt="" fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-blue-500/10 text-blue-500 font-bold">
                          {getInitials(user.full_name || user.username)}
                        </div>
                      )}
                      {user.is_banned && (
                        <div className="absolute inset-0 bg-red-500/40 flex items-center justify-center">
                          <UserMinus size={16} className="text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold theme-ink truncate">{user.full_name || 'Anonymous Seeker'}</h4>
                      <p className="text-[10px] text-[var(--brand-muted)] font-bold">@{user.username}</p>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="flex items-center gap-1 text-[10px] font-bold text-amber-600">
                        <Flame size={12} /> {user.shloka_streak}
                      </div>
                      <span className={`text-[8px] uppercase tracking-widest font-bold mt-1 ${user.is_banned ? 'text-red-500' : 'text-green-500'}`}>
                        {user.is_banned ? 'Banned' : 'Active'}
                      </span>
                    </div>
                    <ChevronRight size={16} className="text-[var(--brand-muted)] group-hover:translate-x-1 transition-transform" />
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {/* User Details Sidebar */}
          <div className="lg:col-span-5">
            <AnimatePresence mode="wait">
              {selectedUser ? (
                <motion.div
                  key={selectedUser.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="sticky top-24 glass-panel rounded-[2.5rem] border border-black/5 p-8 space-y-8"
                >
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="relative w-24 h-24 rounded-[2rem] overflow-hidden border-2 border-white shadow-xl">
                      {selectedUser.avatar_url ? (
                        <Image src={selectedUser.avatar_url} alt="" fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-blue-500/10 text-blue-500 text-2xl font-bold">
                          {getInitials(selectedUser.full_name || selectedUser.username)}
                        </div>
                      )}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold theme-ink">{selectedUser.full_name}</h2>
                      <p className="text-sm text-blue-500 font-bold">@{selectedUser.username}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-black/5 border border-black/5">
                      <p className="text-[10px] text-[var(--brand-muted)] font-bold uppercase tracking-widest mb-1">Tradition</p>
                      <p className="text-sm font-bold theme-ink">{selectedUser.tradition || 'Not Set'}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-black/5 border border-black/5">
                      <p className="text-[10px] text-[var(--brand-muted)] font-bold uppercase tracking-widest mb-1">Location</p>
                      <p className="text-sm font-bold theme-ink">{selectedUser.city || 'Unknown'}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm text-[var(--brand-muted)]">
                      <Calendar size={16} />
                      Joined {new Date(selectedUser.created_at).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-[var(--brand-muted)]">
                      <MapPin size={16} />
                      {selectedUser.country || 'Global Seeker'}
                    </div>
                  </div>

                  <div className="pt-8 border-t border-black/5 space-y-4">
                    <button 
                      onClick={() => toggleBan(selectedUser)}
                      className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${
                        selectedUser.is_banned 
                          ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' 
                          : 'bg-red-500 text-white shadow-lg shadow-red-500/20'
                      }`}
                    >
                      {selectedUser.is_banned ? (
                        <> <UserCheck size={20} /> Unban Seeker </>
                      ) : (
                        <> <UserMinus size={20} /> Ban Seeker </>
                      )}
                    </button>
                    
                    <button className="w-full py-4 rounded-2xl border border-black/5 font-bold text-[var(--brand-muted)] hover:bg-black/5 transition-all flex items-center justify-center gap-2">
                      <AlertCircle size={20} /> Reset Sadhana Streak
                    </button>
                  </div>
                </motion.div>
              ) : (
                <div className="sticky top-24 h-[400px] flex flex-col items-center justify-center text-center p-8 glass-panel rounded-[2.5rem] border border-dashed border-black/10">
                  <div className="w-16 h-16 bg-black/5 rounded-full flex items-center justify-center text-[var(--brand-muted)] mb-4">
                    <Shield size={32} />
                  </div>
                  <h3 className="text-lg font-serif theme-ink">Seeker Intelligence</h3>
                  <p className="text-sm text-[var(--brand-muted)]">Select a seeker from the list to view detailed profile data and perform Level 2 operations.</p>
                </div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>
    </div>
  );
}
