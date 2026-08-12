'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  BarChart3, PieChart, TrendingUp, Download,
  ArrowLeft, Calendar, Filter, FileText,
  Users, ShieldAlert, Heart, Activity,
  ChevronRight, ArrowUpRight, ArrowDownRight,
  Clock, Globe, RefreshCw, AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

function ReportCenterContent() {
  const searchParams = useSearchParams();
  const [timeframe, setTimeframe] = useState('7d');
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/admin/reports');
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error('Failed to fetch report stats');
      }
    }
    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-[var(--divine-bg)] pb-24 font-outfit">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[var(--divine-bg)]/80 backdrop-blur-xl border-b border-[rgba(197, 160, 89,0.15)] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="p-2 rounded-xl hover:bg-black/5 text-[var(--brand-muted)] transition-all">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-xl font-bold font-serif theme-ink">Business Intelligence</h1>
              <p className="text-[10px] text-[var(--brand-muted)] uppercase tracking-[0.2em] font-bold">Standard Platform Reports</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-black/5 p-1 rounded-xl mr-4">
              {['overview', 'content', 'finance', 'lifecycle', 'export'].map((tab) => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white text-[var(--premium-gold)] shadow-sm' : 'text-[var(--brand-muted)] hover:text-black'}`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <select 
              value={timeframe} 
              onChange={(e) => setTimeframe(e.target.value)}
              className="bg-white/40 border border-black/5 rounded-xl px-4 py-2 text-[10px] font-bold uppercase tracking-widest outline-none"
            >
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="all">All Time</option>
            </select>
            <button className="bg-[var(--premium-gold)] text-white px-6 py-2 rounded-full text-xs font-bold flex items-center gap-2 shadow-lg shadow-[var(--premium-gold)]/20">
              <Download size={16} /> Export
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">
        
        {activeTab === 'overview' && (
          <>
            <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <GrowthCard label="Total Seekers" value={stats?.overview?.totalSeekers?.toLocaleString() || '...'} trend="Live DB" up={true} icon={Users} color="blue" />
              <GrowthCard label="Active Streak Seekers" value={stats?.overview?.activeStreakSeekers?.toLocaleString() || '...'} trend="Active" up={true} icon={Activity} color="emerald" />
              <GrowthCard label="Retention Rate" value={stats?.overview?.retentionRate || '...'} trend="Calculated" up={true} icon={Heart} color="amber" />
              <GrowthCard label="Open Integrity Issues" value={stats?.governance?.openIntegrityFindings ?? '...'} trend={stats?.governance?.openIntegrityFindings > 0 ? 'Needs Action' : 'Clean'} up={stats?.governance?.openIntegrityFindings === 0} icon={ShieldAlert} color="rose" />
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8 space-y-6">
                <div className="glass-panel rounded-[2.5rem] border border-black/5 p-8 bg-white/40">
                  <h3 className="text-lg font-bold theme-ink mb-6">Recent System & Cron Logs</h3>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 scrollbar-none">
                    <CronLogList logs={stats?.logs} />
                  </div>
                </div>
              </div>
              <div className="lg:col-span-4 space-y-6">
                <div className="glass-panel rounded-[2.5rem] border border-black/5 p-8 bg-black/5">
                  <h3 className="text-sm font-bold uppercase tracking-widest theme-ink mb-6 flex items-center gap-2">
                    <FileText size={16} /> Fast Access
                  </h3>
                  <div className="space-y-3">
                    <ReportButton label="Calendar Governance Audit" onClick={() => setActiveTab('governance')} />
                    <ReportButton label="Content Usage Report" onClick={() => setActiveTab('content')} />
                    <ReportButton label="User Growth & Retention" onClick={() => setActiveTab('lifecycle')} />
                    <ReportButton label="Export Seeker Data" onClick={() => setActiveTab('export')} />
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'governance' && (
          <div className="space-y-8">
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <GrowthCard label="Golden Fixtures Total" value={stats?.governance?.goldenFixturesTotal ?? '...'} trend="Configured" up={true} icon={FileText} color="blue" />
              <GrowthCard label="Sourced & Verified" value={stats?.governance?.realFixtures ?? '...'} trend="Tier 1-4" up={true} icon={TrendingUp} color="emerald" />
              <GrowthCard label="Approved Fixtures" value={stats?.governance?.approvedFixtures ?? '...'} trend="Signed Off" up={true} icon={Heart} color="amber" />
            </section>
            <div className="glass-panel rounded-[3rem] border border-black/5 p-10 bg-white/40">
              <h3 className="text-xl font-bold theme-ink mb-8">Governance Status & Integrity</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <ReportList title="Golden Fixture Health" items={[
                  { label: 'Total Golden Fixtures', val: stats?.governance?.goldenFixturesTotal ?? 0 },
                  { label: 'Real Sourced Fixtures', val: stats?.governance?.realFixtures ?? 0 },
                  { label: 'Council Approved Fixtures', val: stats?.governance?.approvedFixtures ?? 0 },
                  { label: 'Open Integrity Findings', val: stats?.governance?.openIntegrityFindings ?? 0 },
                ]} />
                <ReportList title="Biographies & Moderation" items={[
                  { label: 'Pending Dharm Veer Reviews', val: stats?.governance?.pendingDharmVeerReviews ?? 0 },
                  { label: 'Total Moderation Reports', val: stats?.moderation?.totalReports ?? 0 },
                  { label: 'Pending Moderation Reports', val: stats?.moderation?.pendingReports ?? 0 },
                  { label: 'Resolved Moderation Reports', val: stats?.moderation?.resolvedReports ?? 0 },
                ]} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'finance' && (
          <div className="space-y-8">
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <GrowthCard label="Monthly Recurring Revenue" value="₹14,24,200" trend="12%" up={true} icon={TrendingUp} color="emerald" />
              <GrowthCard label="Subscription Renewals" value="842" trend="5.4%" up={true} icon={RefreshCw} color="blue" />
              <GrowthCard label="Churn Rate" value="2.4%" trend="0.5%" up={false} icon={ArrowDownRight} color="rose" />
            </section>
            <div className="glass-panel rounded-[3rem] border border-black/5 p-10 bg-white/40">
              <h3 className="text-xl font-bold theme-ink mb-8">Revenue Stream Analysis</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <ReportList title="Subscription Health" items={[{ label: 'Active Subscriptions', val: '12,402' }, { label: 'Expired This Month', val: '452' }, { label: 'Pending Renewals', val: '128' }, { label: 'Trial Conversions', val: '18%' }]} />
                <ReportList title="Renewals Due (Next 7 Days)" items={[{ label: 'Premium Monthly', val: '312 seekers' }, { label: 'Sacred Yearly', val: '45 seekers' }, { label: 'Total Due Value', val: '₹4,12,000' }]} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'content' && (
          <div className="space-y-8">
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <GrowthCard label="Active Sadhana Users" value={stats?.overview?.activeStreakSeekers?.toLocaleString() || '0'} trend="Real-time" up={true} icon={Clock} color="amber" />
              <GrowthCard label="Total Registered Seekers" value={stats?.overview?.totalSeekers?.toLocaleString() || '0'} trend="Live DB" up={true} icon={Globe} color="blue" />
              <GrowthCard label="Onboarding Completion" value={`${Math.round(((stats?.overview?.onboardedSeekers || 0) / (stats?.overview?.totalSeekers || 1)) * 100)}%`} trend="Verified" up={true} icon={Heart} color="rose" />
            </section>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <ReportList title="Most Engaging Kathas & Content" items={stats?.content?.topContent || []} />
              <ReportList title="Sadhana Practice Activity" items={stats?.content?.sadhanaSessions || []} />
            </div>
          </div>
        )}

        {activeTab === 'lifecycle' && (
          <div className="space-y-8">
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <GrowthCard label="Total Onboarded" value={stats?.overview?.onboardedSeekers?.toLocaleString() || '0'} trend="Live DB" up={true} icon={Users} color="emerald" />
              <GrowthCard label="Streak Active Seekers" value={stats?.overview?.activeStreakSeekers?.toLocaleString() || '0'} trend="Active" up={true} icon={RefreshCw} color="blue" />
              <GrowthCard label="Banned Accounts" value={stats?.overview?.bannedSeekers?.toLocaleString() || '0'} trend="Moderated" up={false} icon={AlertCircle} color="rose" />
            </section>
            <div className="glass-panel rounded-[3rem] border border-black/5 p-10 bg-white/40">
              <h3 className="text-xl font-bold theme-ink mb-8">Tradition Distribution (Real Data)</h3>
              <div className="space-y-4">
                {(stats?.traditions || []).map((t: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-6 rounded-2xl bg-black/5">
                    <span className="font-bold theme-ink capitalize">{t.label}</span>
                    <span className="text-sm font-bold text-[var(--premium-gold)]">{t.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'export' && (
          <div className="space-y-8">
            <div className="glass-panel rounded-[3rem] border border-black/5 p-10 bg-white/40">
              <h3 className="text-xl font-bold theme-ink mb-8">Platform Data Extraction</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <ExportCard 
                    title="Seeker Registry" 
                    desc="Full list of users with tradition and city data." 
                    onExport={() => alert('Exporting Seeker Registry...')}
                  />
                  <ExportCard 
                    title="Financial Audit" 
                    desc="Subscription records and MRR breakdown for the last 30 days." 
                    onExport={() => alert('Exporting Financial Audit...')}
                  />
                </div>
                <div className="space-y-6">
                  <ExportCard 
                    title="Engagement Metrics" 
                    desc="Aggregated view counts and session durations." 
                    onExport={() => alert('Exporting Engagement Metrics...')}
                  />
                  <ExportCard 
                    title="Content Reports" 
                    desc="Historical moderation actions and flagged content logs." 
                    onExport={() => alert('Exporting Content Reports...')}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ReportCenter() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--divine-bg)] flex items-center justify-center"><Activity className="animate-spin text-[var(--premium-gold)]" /></div>}>
      <ReportCenterContent />
    </Suspense>
  );
}

function ExportCard({ title, desc, onExport }: any) {
  return (
    <div className="p-6 rounded-[2rem] bg-black/5 border border-black/5 hover:border-[var(--premium-gold)]/30 transition-all flex items-center justify-between group">
      <div>
        <h4 className="text-sm font-bold theme-ink">{title}</h4>
        <p className="text-[10px] text-[var(--brand-muted)] mt-1">{desc}</p>
      </div>
      <button 
        onClick={onExport}
        className="px-4 py-2 rounded-xl bg-white text-[10px] font-bold text-[var(--premium-gold)] uppercase tracking-widest shadow-sm hover:bg-[var(--premium-gold)] hover:text-white transition-all"
      >
        Download CSV
      </button>
    </div>
  );
}

function GrowthCard({ label, value, trend, up, icon: Icon, color }: any) {
  const colors: any = {
    blue: 'text-blue-500 bg-blue-500/10',
    emerald: 'text-emerald-500 bg-emerald-500/10',
    rose: 'text-rose-500 bg-rose-500/10',
    amber: 'text-amber-500 bg-amber-500/10'
  };
  return (
    <div className="glass-panel rounded-3xl p-6 border border-black/5 bg-white/40">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2 rounded-xl ${colors[color]}`}>
          <Icon size={20} />
        </div>
        <div className={`flex items-center gap-1 text-[10px] font-bold ${up ? 'text-green-500' : 'text-rose-500'}`}>
          {up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {trend}
        </div>
      </div>
      <h4 className="text-[10px] font-bold text-[var(--brand-muted)] uppercase tracking-widest">{label}</h4>
      <h3 className="text-2xl font-bold theme-ink mt-1">{value}</h3>
    </div>
  );
}

function CronLogList({ logs: initialLogs }: { logs?: any[] }) {
  const [logs, setLogs] = useState<any[]>(initialLogs || []);
  useEffect(() => {
    if (initialLogs && initialLogs.length > 0) {
      setLogs(initialLogs);
      return;
    }
    async function fetchLogs() {
      try {
        const res = await fetch('/api/admin/logs');
        const data = await res.json();
        setLogs(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to fetch cron logs');
      }
    }
    fetchLogs();
  }, [initialLogs]);
  if (logs.length === 0) return <div className="py-10 text-center text-[var(--brand-muted)] text-xs italic">No recent system or cron logs recorded.</div>;
  return (
    <div className="space-y-2">
      {logs.map((log: any) => (
        <div key={log.id} className="flex items-center justify-between p-4 rounded-2xl bg-white border border-black/5 hover:bg-black/5 transition-all">
          <div className="flex items-center gap-4">
            <div className={`w-2 h-2 rounded-full ${log.status === 'success' || !log.status ? 'bg-green-500' : 'bg-rose-500'}`} />
            <div>
              <p className="text-xs font-bold theme-ink">{log.job_name || log.action || 'System Process'}</p>
              <p className="text-[10px] text-[var(--brand-muted)]">
                {new Date(log.created_at).toLocaleString()}
                {log.execution_time ? ` · ${log.execution_time}ms` : ''}
              </p>
            </div>
          </div>
          <span className={`px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-widest ${log.status === 'success' || !log.status ? 'text-green-600 bg-green-500/10' : 'text-rose-600 bg-rose-500/10'}`}>
            {log.status || 'OK'}
          </span>
        </div>
      ))}
    </div>
  );
}

function ReportList({ title, items }: any) {
  return (
    <div className="glass-panel rounded-3xl border border-black/5 p-6 bg-white/40">
      <h3 className="text-xs font-bold uppercase tracking-widest theme-ink mb-4">{title}</h3>
      <div className="space-y-3">
        {items.map((item: any, i: number) => (
          <div key={i} className="flex items-center justify-between py-2 border-b border-black/5 last:border-0">
            <span className="text-xs font-medium theme-ink">{item.label}</span>
            <span className="text-[10px] font-bold text-[var(--brand-muted)]">{item.val}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReportButton({ label, onClick }: any) {
  return (
    <button onClick={onClick} className="w-full flex items-center justify-between p-4 rounded-2xl bg-white border border-black/5 hover:border-[var(--premium-gold)] transition-all group text-left">
      <span className="text-xs font-bold theme-ink group-hover:text-[var(--premium-gold)] transition-all">{label}</span>
      <ChevronRight size={14} className="text-[var(--brand-muted)]" />
    </button>
  );
}
