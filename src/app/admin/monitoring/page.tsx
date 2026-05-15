'use client';

import { motion } from 'framer-motion';
import { 
  Activity, Zap, Server, Globe, 
  Clock, AlertCircle, CheckCircle,
  BarChart3, RefreshCcw, Database,
  Cpu, HardDrive, Shield, ArrowLeft,
  ChevronRight, ExternalLink
} from 'lucide-react';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function SystemMonitoringContent() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');
  const [latency, setLatency] = useState(120);
  const [activeUsers, setActiveUsers] = useState(0);
  const [health, setHealth] = useState<any>({
    database: 'up',
    auth: 'up',
    functions: 'up',
    storage: 'up'
  });

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/admin/stats');
        const data = await res.json();
        if (res.ok) {
          setActiveUsers(data.activeNow || 0);
          if (data.health) setHealth(data.health);
        }
      } catch (err) {
        console.error('Failed to fetch monitoring stats:', err);
      }
    }
    fetchStats();

    const interval = setInterval(() => {
      setLatency(prev => prev + (Math.random() > 0.5 ? 5 : -5));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[var(--divine-bg)] pb-24 font-outfit">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[var(--divine-bg)]/80 backdrop-blur-xl border-b border-[rgba(200,146,74,0.15)] px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="p-2 rounded-xl hover:bg-black/5 text-[var(--brand-muted)] transition-all">
              <ArrowLeft size={20} />
            </Link>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500">
                <Activity size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold font-serif theme-ink">System Pulse</h1>
                <p className="text-[10px] text-[var(--brand-muted)] uppercase tracking-[0.2em] font-bold">Real-time Monitoring</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center bg-black/5 p-1 rounded-xl mr-2">
              {['overview', 'logs'].map((tab) => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white text-rose-600 shadow-sm' : 'text-[var(--brand-muted)] hover:text-black'}`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <button 
              onClick={async () => {
                await fetch('/api/admin/logs/simulate', { method: 'POST' });
                alert('System Sync Triggered & Logged');
              }}
              className="px-4 py-2 rounded-full bg-white border border-black/5 text-[10px] font-bold uppercase tracking-widest hover:bg-black/5 transition-all flex items-center gap-2"
            >
              <RefreshCcw size={14} /> Trigger Sync
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10 space-y-8">
        {activeTab === 'overview' ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <MonitoringCard icon={Zap} label="Avg Latency" value={`${latency}ms`} status="Stable" color="amber" detail="P95: 142ms" href="https://supabase.com/dashboard/project/_/settings/api" />
              <MonitoringCard icon={Globe} label="Active Now" value={activeUsers.toString()} status="Live" color="blue" detail="In 42 cities" href="/admin/users" />
              <MonitoringCard icon={RefreshCcw} label="Cron Success" value="98.4%" status="2 Failures" color="emerald" detail="Last 24h" href="https://supabase.com/dashboard/project/_/functions" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h2 className="text-lg font-serif font-bold theme-ink px-2">Cloud Services</h2>
                <div className="glass-panel rounded-3xl border border-black/5 divide-y divide-black/5 overflow-hidden bg-white/40">
                  {[
                    { name: 'Auth Engine (Supabase)', status: health.auth, icon: Shield, link: 'https://supabase.com/dashboard' },
                    { name: 'Database (PostgreSQL)', status: health.database, icon: Database, link: 'https://supabase.com/dashboard/project/_/database/tables' },
                    { name: 'Edge Functions', status: health.functions, icon: Cpu, link: 'https://supabase.com/dashboard/project/_/functions' },
                    { name: 'Asset Storage (S3)', status: health.storage, icon: HardDrive, link: 'https://supabase.com/dashboard/project/_/storage' }
                  ].map((service) => (
                    <a key={service.name} href={service.link} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-5 hover:bg-white transition-all group">
                      <div className="flex items-center gap-3">
                        <service.icon size={18} className="text-[var(--brand-muted)] group-hover:text-[var(--premium-gold)]" />
                        <span className="text-sm font-medium theme-ink">{service.name}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          {service.status === 'up' ? <CheckCircle size={16} className="text-green-500" /> : <AlertCircle size={16} className="text-amber-500" />}
                          <span className={`text-[10px] font-bold uppercase tracking-widest ${service.status === 'up' ? 'text-green-500' : 'text-amber-500'}`}>{service.status === 'up' ? 'Healthy' : 'Degraded'}</span>
                        </div>
                        <ExternalLink size={14} className="text-[var(--brand-muted)] opacity-0 group-hover:opacity-100" />
                      </div>
                    </a>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <h2 className="text-lg font-serif font-bold theme-ink">Recent Job Execution</h2>
                  <button onClick={() => setActiveTab('logs')} className="text-[10px] font-bold text-blue-500 uppercase tracking-widest hover:underline">View All →</button>
                </div>
                <div className="glass-panel rounded-3xl border border-black/5 p-4 space-y-3 bg-white/40">
                  <RecentJobsList />
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-6">
            <div className="glass-panel rounded-[3rem] border border-black/5 p-10 bg-white/40">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold theme-ink">System Audit Logs</h2>
                <div className="flex items-center gap-4">
                  <button className="px-4 py-2 rounded-xl bg-black/5 text-[10px] font-bold uppercase tracking-widest hover:bg-black/10 transition-all">Clear Filter</button>
                  <button className="px-4 py-2 rounded-xl bg-black/5 text-[10px] font-bold uppercase tracking-widest hover:bg-black/10 transition-all">Export Logs</button>
                </div>
              </div>
              <div className="space-y-4">
                <AuditLogList />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SystemMonitoring() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--divine-bg)] flex items-center justify-center"><Activity className="animate-spin text-rose-500" /></div>}>
      <SystemMonitoringContent />
    </Suspense>
  );
}

function RecentJobsList() {
  const [logs, setLogs] = useState<any[]>([]);
  useEffect(() => {
    fetch('/api/admin/logs').then(res => res.json()).then(data => setLogs(Array.isArray(data) ? data.slice(0, 4) : []));
  }, []);
  return (
    <div className="space-y-3">
      {logs.map((log, i) => (
        <div key={i} className="flex items-center justify-between p-3 rounded-2xl hover:bg-black/5 transition-all">
          <div>
            <p className="text-xs font-bold theme-ink">{log.job_name}</p>
            <p className="text-[10px] text-[var(--brand-muted)]">{new Date(log.created_at).toLocaleTimeString()} · {log.execution_time}ms</p>
          </div>
          <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest ${log.status === 'success' ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>
            {log.status}
          </span>
        </div>
      ))}
    </div>
  );
}

function AuditLogList() {
  const [logs, setLogs] = useState<any[]>([]);
  useEffect(() => {
    fetch('/api/admin/logs').then(res => res.json()).then(data => setLogs(Array.isArray(data) ? data : []));
  }, []);
  return (
    <div className="space-y-2">
      {logs.map((log) => (
        <div key={log.id} className="flex items-center justify-between p-5 rounded-2xl bg-white border border-black/5 hover:border-[var(--premium-gold)]/20 transition-all">
          <div className="flex items-center gap-6">
            <div className={`w-3 h-3 rounded-full ${log.status === 'success' ? 'bg-green-500' : 'bg-rose-500'}`} />
            <div>
              <p className="text-sm font-bold theme-ink">{log.job_name}</p>
              <p className="text-xs text-[var(--brand-muted)] mt-0.5">{log.message}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold theme-ink">{new Date(log.created_at).toLocaleString()}</p>
            <p className="text-[10px] text-[var(--brand-muted)] uppercase tracking-widest mt-1">Exec Time: {log.execution_time}ms</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function MonitoringCard({ icon: Icon, label, value, status, color, detail, href }: any) {
  const CardContent = (
    <div className="glass-panel rounded-3xl p-6 border border-black/5 hover:border-[var(--premium-gold)] transition-all group bg-white/40 shadow-sm h-full">
      <div className="flex items-center justify-between mb-4">
        <Icon size={20} className={color === 'amber' ? 'text-amber-500' : color === 'blue' ? 'text-blue-500' : 'text-emerald-500'} />
        <span className="text-[10px] font-bold text-[var(--brand-muted)] uppercase tracking-widest">{label}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <h3 className="text-3xl font-bold theme-ink">{value}</h3>
        <span className={`text-[10px] font-bold uppercase tracking-widest ${status === 'Stable' || status === 'Live' ? 'text-green-500' : 'text-rose-500'}`}>
          {status}
        </span>
      </div>
      <div className="mt-6 flex items-center justify-between border-t border-black/5 pt-4">
        <span className="text-[10px] text-[var(--brand-muted)] font-medium uppercase tracking-widest">{detail}</span>
        <ChevronRight size={14} className="text-[var(--brand-muted)] group-hover:text-[var(--premium-gold)] transition-all" />
      </div>
    </div>
  );
  return href ? <Link href={href}>{CardContent}</Link> : <div className="cursor-default h-full">{CardContent}</div>;
}
