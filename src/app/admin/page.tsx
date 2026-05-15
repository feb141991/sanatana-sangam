'use client';

import { 
  Users, ShieldAlert, Globe, Activity, 
  Settings, ChevronRight, Search, 
  ArrowUpRight, BarChart3, AlertTriangle, 
  UserCheck, ShieldCheck, LogOut, ArrowLeft,
  FileText, Megaphone, MapPin, Calendar,
  RefreshCw, Heart
} from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<any>({
    totalSeekers: 0,
    activeNow: 0,
    pendingReports: 0,
    globalReach: 0,
    intelligence: null
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      setStats({
        totalSeekers: data.totalSeekers || 0,
        activeNow: data.activeNow || 0,
        pendingReports: data.pendingReports || 0,
        globalReach: data.globalReach || 0
      });
    } catch (err) {
      console.error('Failed to fetch stats');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleLogout = async () => {
    document.cookie = "admin_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    router.push('/admin/login');
  };

  return (
    <div className="min-h-screen bg-[var(--divine-bg)] font-outfit pb-20">
      {/* Premium Sidebar / Header Area */}
      <div className="sticky top-0 z-50 bg-[var(--divine-bg)]/80 backdrop-blur-xl border-b border-[rgba(200,146,74,0.15)] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold font-serif theme-ink leading-tight">Command Center</h1>
              <p className="text-[10px] text-[var(--brand-muted)] uppercase tracking-[0.2em] font-bold">Shoonaya Global Admin</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/admin/settings" className="p-2.5 rounded-xl hover:bg-black/5 text-[var(--brand-muted)] hover:text-[var(--premium-gold)] transition-all">
              <Settings size={20} />
            </Link>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500/10 text-rose-600 text-xs font-bold hover:bg-rose-500 hover:text-white transition-all"
            >
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-10">
        
        {/* Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatCard 
            href="/admin/users"
            icon={Users} 
            label="Total Seekers" 
            value={stats.totalSeekers.toLocaleString()} 
            trend="+12% this week" 
            color="blue"
          />
          <StatCard 
            href="/admin/reports"
            icon={Heart} 
            label="Retention Rate" 
            value={stats.intelligence?.retentionRate || '0%'} 
            trend="Active Pulse" 
            color="rose"
            pulse
          />
          <StatCard 
            href="/admin/moderation"
            icon={ShieldAlert} 
            label="Pending Reports" 
            value={stats.pendingReports.toLocaleString()} 
            trend="Needs Attention" 
            color="amber"
            alert={stats.pendingReports > 0}
          />
          <StatCard 
            href="/admin/tirtha"
            icon={Globe} 
            label="Active Mandalis" 
            value={stats.globalReach.toLocaleString()} 
            trend="Across 12 countries" 
            color="emerald"
          />
        </div>

        {/* Core Administrative Command Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Command Column */}
          <div className="lg:col-span-8 space-y-8">
            <section>
              <div className="flex items-center justify-between mb-6 px-2">
                <h2 className="text-lg font-serif font-bold theme-ink">Command Operations</h2>
                <span className="text-[10px] font-bold text-[var(--brand-muted)] uppercase tracking-widest">Platform Integrity</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CommandLink 
                  href="/admin/moderation"
                  icon={ShieldAlert} 
                  title="Content Moderation" 
                  desc="Review flagged reports and account deletion requests." 
                  count={stats.pendingReports}
                />
                <CommandLink 
                  href="/admin/users"
                  icon={UserCheck} 
                  title="Seeker Directory" 
                  desc="Global user registry with ban/unban authority." 
                />
                <CommandLink 
                  href="/admin/content"
                  icon={Calendar} 
                  title="Festival Management" 
                  desc="Update the global spiritual calendar and holy days." 
                />
                <CommandLink 
                  href="/admin/tirtha"
                  icon={MapPin} 
                  title="Mandali Hub" 
                  desc="Manage local spiritual community chapters." 
                />
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between mb-6 px-2">
                <h2 className="text-lg font-serif font-bold theme-ink">System Reports</h2>
                <Link href="/admin/reports" className="text-[10px] font-bold text-blue-500 uppercase tracking-widest hover:underline">View All Reports →</Link>
              </div>
              <Link href="/admin/reports" className="block">
                <div className="glass-panel rounded-[2.5rem] border border-black/5 p-8 bg-white/40 hover:border-[var(--premium-gold)] transition-all cursor-pointer group">
                  <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-black/5 flex items-center justify-center text-[var(--brand-muted)] group-hover:bg-[var(--premium-gold)] group-hover:text-white transition-all">
                      <BarChart3 size={32} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold theme-ink">Analytics Engine</h3>
                      <p className="text-sm text-[var(--brand-muted)] max-w-sm">Live spiritual engagement metrics and growth trends dashboard.</p>
                    </div>
                    <div className="px-6 py-2 rounded-full border border-black/5 text-xs font-bold bg-white/50 group-hover:bg-[var(--premium-gold)] group-hover:text-white transition-all">Open Report Center</div>
                  </div>
                </div>
              </Link>
            </section>
          </div>

          {/* Side Column: Alerts & Quick Tools */}
          <div className="lg:col-span-4 space-y-8">
            <section className="glass-panel rounded-[2.5rem] border border-black/5 p-8 bg-black/5 overflow-hidden relative">
              <div className="relative z-10 space-y-6">
                <h3 className="text-sm font-bold uppercase tracking-widest theme-ink">Quick Tools</h3>
                <div className="space-y-3">
                  <QuickTool icon={Megaphone} label="Global Broadcast" href="/admin/broadcast" />
                  <QuickTool icon={FileText} label="Export User Data" href="/admin/reports?tab=export" />
                  <QuickTool icon={RefreshCw} label="Flush Cache" onClick={() => alert('Cache flushed successfully')} />
                  <QuickTool icon={ShieldCheck} label="Audit Logs" href="/admin/monitoring?tab=logs" />
                </div>
              </div>
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <Settings size={120} />
              </div>
            </section>

            <section className="glass-panel rounded-[2.5rem] border border-black/5 p-8 bg-rose-500/5">
              <h3 className="text-sm font-bold uppercase tracking-widest text-rose-600 mb-6 flex items-center gap-2">
                <AlertTriangle size={16} /> Urgent Alerts
              </h3>
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-white border border-rose-500/20 shadow-sm">
                  <p className="text-xs font-bold theme-ink">Database Latency Spike</p>
                  <p className="text-[10px] text-[var(--brand-muted)] mt-1">Detected +200ms increase in query resolution for `vichaar_sabha` table.</p>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-rose-500/20 shadow-sm">
                  <p className="text-xs font-bold theme-ink">Abnormal Login Attempts</p>
                  <p className="text-[10px] text-[var(--brand-muted)] mt-1">12 failed attempts from IP 192.168.1.1 on @sangam_admin.</p>
                </div>
              </div>
            </section>
          </div>

        </div>
      </main>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, trend, color, pulse, alert, href }: any) {
  const colors: any = {
    blue: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    rose: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
    amber: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
  };

  return (
    <Link href={href}>
      <div className={`glass-panel rounded-3xl p-6 border transition-all hover:scale-[1.02] cursor-pointer shadow-sm relative overflow-hidden ${alert ? 'ring-2 ring-rose-500/50' : 'border-black/5'}`}>
        <div className="flex items-center justify-between mb-4 relative z-10">
          <div className={`p-2 rounded-xl ${colors[color]}`}>
            <Icon size={20} />
          </div>
          {pulse && <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />}
        </div>
        <div className="relative z-10">
          <h4 className="text-xs font-bold text-[var(--brand-muted)] uppercase tracking-widest">{label}</h4>
          <h3 className="text-3xl font-bold theme-ink mt-1">{value}</h3>
          <p className="text-[10px] font-bold text-slate-400 mt-2 flex items-center gap-1 uppercase tracking-widest">
            <ArrowUpRight size={12} /> {trend}
          </p>
        </div>
        <div className={`absolute -right-4 -bottom-4 opacity-[0.03] ${colors[color]}`}>
          <Icon size={100} />
        </div>
      </div>
    </Link>
  );
}

function CommandLink({ icon: Icon, title, desc, count, href }: any) {
  return (
    <Link href={href}>
      <div className="glass-panel rounded-[2rem] border border-black/5 p-6 bg-white/40 hover:border-[var(--premium-gold)] transition-all group cursor-pointer h-full flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-2xl bg-black/5 text-[var(--brand-muted)] group-hover:bg-[var(--premium-gold)] group-hover:text-white transition-all">
              <Icon size={24} />
            </div>
            {count !== undefined && count > 0 && (
              <span className="px-3 py-1 rounded-full bg-rose-500 text-white text-[10px] font-bold">{count} Actionable</span>
            )}
          </div>
          <div>
            <h4 className="text-sm font-bold theme-ink">{title}</h4>
            <p className="text-xs text-[var(--brand-muted)] mt-1 leading-relaxed">{desc}</p>
          </div>
        </div>
        <div className="mt-6 flex items-center gap-2 text-[10px] font-bold text-[var(--premium-gold)] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all">
          Manage System <ChevronRight size={12} />
        </div>
      </div>
    </Link>
  );
}

function QuickTool({ icon: Icon, label, href, onClick }: any) {
  const content = (
    <div className="w-full flex items-center justify-between p-4 rounded-2xl bg-white border border-black/5 hover:border-[var(--premium-gold)] transition-all group cursor-pointer">
      <div className="flex items-center gap-3">
        <Icon size={18} className="text-[var(--brand-muted)] group-hover:text-[var(--premium-gold)] transition-all" />
        <span className="text-xs font-bold theme-ink">{label}</span>
      </div>
      <ChevronRight size={14} className="text-[var(--brand-muted)]" />
    </div>
  );

  if (href) return <Link href={href} className="block">{content}</Link>;
  return <div onClick={onClick} className="block">{content}</div>;
}
