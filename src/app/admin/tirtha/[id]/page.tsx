'use client';

import { useState, useEffect, use } from 'react';
import { 
  ArrowLeft, MapPin, Users, Globe, 
  Shield, Settings, Star, Mail,
  ExternalLink, Calendar, MoreVertical,
  CheckCircle2, AlertCircle, Trash2,
  Lock, Unlock, ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';

export default function ChapterManagement({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [loading, setLoading] = useState(true);
  const [mandali, setMandali] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const supabase = createClient();

  useEffect(() => {
    async function fetchChapterData() {
      try {
        // Fetch mandali details
        const { data: mData, error: mError } = await supabase
          .from('mandalis')
          .select('*')
          .eq('id', id)
          .single();
        
        if (mError) throw mError;
        setMandali(mData);

        // Fetch members (this is a mock/placeholder until we have a proper relationship table)
        // For now, we'll fetch profiles that match the mandali name or just some random ones for UI demo
        const { data: pData } = await supabase
          .from('profiles')
          .select('*')
          .limit(10);
        
        setMembers(pData || []);
      } catch (err) {
        console.error('Failed to fetch chapter data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchChapterData();
  }, [id, supabase]);

  if (loading) return (
    <div className="min-h-screen bg-[var(--divine-bg)] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-[var(--premium-gold)] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!mandali) return (
    <div className="min-h-screen bg-[var(--divine-bg)] flex flex-col items-center justify-center space-y-4">
      <AlertCircle size={48} className="text-rose-500" />
      <h1 className="text-xl font-bold theme-ink">Chapter Not Found</h1>
      <Link href="/admin/tirtha" className="text-sm text-[var(--premium-gold)] hover:underline">Return to Registry</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--divine-bg)] pb-24 font-outfit">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[var(--divine-bg)]/80 backdrop-blur-xl border-b border-[rgba(200,146,74,0.15)] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/tirtha" className="p-2 rounded-xl hover:bg-black/5 text-[var(--brand-muted)] transition-all">
              <ArrowLeft size={20} />
            </Link>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-[var(--premium-gold-soft)] text-[var(--premium-gold)]">
                <Globe size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold font-serif theme-ink">{mandali.name}</h1>
                <p className="text-[10px] text-[var(--brand-muted)] uppercase tracking-[0.2em] font-bold">Chapter Administration</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 rounded-full bg-white border border-black/5 text-[10px] font-bold uppercase tracking-widest hover:bg-black/5 transition-all flex items-center gap-2">
              <Lock size={14} /> Suspend Chapter
            </button>
            <button className="bg-rose-500 text-white px-6 py-2 rounded-full text-xs font-bold flex items-center gap-2 shadow-lg shadow-rose-500/20">
              <Trash2 size={16} /> Delete
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Info Column */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Overview Card */}
            <div className="glass-panel rounded-[2.5rem] border border-black/5 p-10 bg-white/40 relative overflow-hidden">
              <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black text-[var(--brand-muted)] uppercase tracking-widest block mb-2">Location & Territory</label>
                    <div className="flex items-center gap-3 text-lg font-bold theme-ink">
                      <MapPin className="text-rose-500" size={20} />
                      {mandali.location}
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-[var(--brand-muted)] uppercase tracking-widest block mb-2">Primary Tradition</label>
                    <div className="flex items-center gap-3 text-lg font-bold theme-ink">
                      <Star className="text-[var(--premium-gold)]" size={20} />
                      {mandali.tradition || 'Global / Universal'}
                    </div>
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="p-6 rounded-3xl bg-black/5">
                    <label className="text-[10px] font-black text-[var(--brand-muted)] uppercase tracking-widest block mb-2">Growth Metric</label>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold theme-ink">{mandali.members_count || 0}</span>
                      <span className="text-xs font-bold text-green-500 uppercase tracking-widest">Seekers</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -right-10 -bottom-10 opacity-[0.03] text-[var(--premium-gold)]">
                <Globe size={300} />
              </div>
            </div>

            {/* Member List */}
            <div className="glass-panel rounded-[2.5rem] border border-black/5 bg-white/40 overflow-hidden">
              <div className="px-8 py-6 border-b border-black/5 flex items-center justify-between bg-black/5">
                <h3 className="text-sm font-bold uppercase tracking-widest theme-ink flex items-center gap-2">
                  <Users size={18} /> Chapter Members
                </h3>
                <button className="text-[10px] font-bold text-blue-500 uppercase tracking-widest hover:underline">Invite Seekers</button>
              </div>
              <div className="divide-y divide-black/5">
                {members.map((member) => (
                  <div key={member.id} className="p-6 flex items-center justify-between hover:bg-black/5 transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-slate-200 border border-black/5" />
                      <div>
                        <p className="text-sm font-bold theme-ink">{member.full_name || 'Anonymous Seeker'}</p>
                        <p className="text-[10px] text-[var(--brand-muted)] uppercase tracking-widest font-bold mt-0.5">{member.tradition} · {member.location}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button className="p-2 rounded-xl hover:bg-black/10 text-[var(--brand-muted)] opacity-0 group-hover:opacity-100 transition-all">
                        <Mail size={16} />
                      </button>
                      <button className="p-2 rounded-xl hover:bg-black/10 text-[var(--brand-muted)] opacity-0 group-hover:opacity-100 transition-all">
                        <Shield size={16} />
                      </button>
                      <button className="p-2 rounded-xl hover:bg-rose-500/10 text-rose-500 opacity-0 group-hover:opacity-100 transition-all">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Settings & Sidebar */}
          <div className="lg:col-span-4 space-y-8">
            
            {/* Quick Actions */}
            <section className="glass-panel rounded-[2.5rem] border border-black/5 p-8 bg-black/5 space-y-6">
              <h3 className="text-[10px] font-black text-[var(--brand-muted)] uppercase tracking-widest">Chapter Control</h3>
              <div className="space-y-3">
                <button className="w-full p-4 rounded-2xl bg-white border border-black/5 hover:border-[var(--premium-gold)] transition-all flex items-center justify-between group text-left">
                  <div className="flex items-center gap-3">
                    <Settings size={18} className="text-[var(--brand-muted)] group-hover:text-[var(--premium-gold)]" />
                    <span className="text-xs font-bold theme-ink">General Settings</span>
                  </div>
                  <ChevronRight size={14} className="text-[var(--brand-muted)]" />
                </button>
                <button className="w-full p-4 rounded-2xl bg-white border border-black/5 hover:border-[var(--premium-gold)] transition-all flex items-center justify-between group text-left">
                  <div className="flex items-center gap-3">
                    <Calendar size={18} className="text-[var(--brand-muted)] group-hover:text-[var(--premium-gold)]" />
                    <span className="text-xs font-bold theme-ink">Event Scheduling</span>
                  </div>
                  <ChevronRight size={14} className="text-[var(--brand-muted)]" />
                </button>
                <button className="w-full p-4 rounded-2xl bg-white border border-black/5 hover:border-[var(--premium-gold)] transition-all flex items-center justify-between group text-left">
                  <div className="flex items-center gap-3">
                    <Shield size={18} className="text-[var(--brand-muted)] group-hover:text-[var(--premium-gold)]" />
                    <span className="text-xs font-bold theme-ink">Security & Permissions</span>
                  </div>
                  <ChevronRight size={14} className="text-[var(--brand-muted)]" />
                </button>
              </div>
            </section>

            {/* Health Status */}
            <section className="glass-panel rounded-[2.5rem] border border-green-500/10 p-8 bg-green-500/5 space-y-4">
              <h3 className="text-[10px] font-black text-green-600 uppercase tracking-widest flex items-center gap-2">
                <CheckCircle2 size={14} /> Chapter Health
              </h3>
              <p className="text-[10px] text-green-800 leading-relaxed font-medium">
                This chapter is currently active and compliant with platform community standards. No recent reports or moderation actions are pending.
              </p>
              <div className="pt-2">
                <div className="flex items-center justify-between text-[10px] font-bold text-green-600 uppercase tracking-widest mb-2">
                  <span>Engagement Level</span>
                  <span>94%</span>
                </div>
                <div className="w-full h-1.5 bg-green-200 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500" style={{ width: '94%' }} />
                </div>
              </div>
            </section>

          </div>

        </div>

      </div>
    </div>
  );
}
