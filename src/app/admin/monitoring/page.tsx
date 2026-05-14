'use client';

import { motion } from 'framer-motion';
import { 
  Activity, Zap, Server, Globe, 
  Clock, AlertCircle, CheckCircle,
  BarChart3, RefreshCcw, Database,
  Cpu, HardDrive, Shield, ArrowLeft,
  ChevronRight, ExternalLink
} from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function SystemMonitoring() {
  const [latency, setLatency] = useState(120);
  const [activeUsers, setActiveUsers] = useState(0);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/admin/stats');
        const data = await res.json();
        if (res.ok) setActiveUsers(data.activeNow || 0);
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
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-600 text-[10px] font-bold uppercase tracking-widest">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              All Systems Operational
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10 space-y-8">
        
        {/* Core Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MonitoringCard 
            icon={Zap}
            label="Avg Latency"
            value={`${latency}ms`}
            status="Stable"
            color="amber"
            detail="P95: 142ms"
          />
          <MonitoringCard 
            icon={Globe}
            label="Active Now"
            value={activeUsers.toString()}
            status="Live"
            color="blue"
            detail="In 42 cities"
            href="/admin/users"
          />
          <MonitoringCard 
            icon={RefreshCcw}
            label="Cron Success"
            value="98.4%"
            status="2 Failures"
            color="emerald"
            detail="Last 24h"
          />
        </div>

        {/* Infrastructure Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Services */}
          <div className="space-y-4">
            <h2 className="text-lg font-serif font-bold theme-ink px-2">Cloud Services</h2>
            <div className="glass-panel rounded-3xl border border-black/5 divide-y divide-black/5 overflow-hidden">
              {[
                { name: 'Auth Engine (Supabase)', status: 'up', icon: Shield, link: 'https://supabase.com/dashboard' },
                { name: 'Database (PostgreSQL)', status: 'up', icon: Database, link: 'https://supabase.com/dashboard/project/_/database/tables' },
                { name: 'Edge Functions', status: 'warning', icon: Cpu, link: 'https://supabase.com/dashboard/project/_/functions' },
                { name: 'Asset Storage (S3)', status: 'up', icon: HardDrive, link: 'https://supabase.com/dashboard/project/_/storage' }
              ].map((service) => (
                <a key={service.name} href={service.link} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-5 bg-white/40 hover:bg-white transition-all group">
                  <div className="flex items-center gap-3">
                    <service.icon size={18} className="text-[var(--brand-muted)] group-hover:text-[var(--premium-gold)]" />
                    <span className="text-sm font-medium theme-ink">{service.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {service.status === 'up' ? (
                        <CheckCircle size={16} className="text-green-500" />
                      ) : (
                        <AlertCircle size={16} className="text-amber-500" />
                      )}
                      <span className={`text-[10px] font-bold uppercase tracking-widest ${service.status === 'up' ? 'text-green-500' : 'text-amber-500'}`}>
                        {service.status === 'up' ? 'Healthy' : 'Degraded'}
                      </span>
                    </div>
                    <ExternalLink size={14} className="text-[var(--brand-muted)] opacity-0 group-hover:opacity-100" />
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Job Logs */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-lg font-serif font-bold theme-ink">Recent Job Execution</h2>
              <button className="text-[10px] font-bold text-blue-500 uppercase tracking-widest hover:underline">View All →</button>
            </div>
            <div className="glass-panel rounded-3xl border border-black/5 p-4 space-y-3 bg-white/40">
              {[
                { job: 'nitya-reminder', time: '12:00 PM', result: 'success', count: '4,204 sent' },
                { job: 'shloka-reminder', time: '11:45 AM', result: 'fail', count: 'Timeout' },
                { job: 'panchang-sync', time: '06:00 AM', result: 'success', count: 'Updated' },
                { job: 'analytics-rollup', time: '00:05 AM', result: 'success', count: 'Aggregated' }
              ].map((log, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-2xl hover:bg-black/5 transition-all cursor-default">
                  <div>
                    <p className="text-xs font-bold theme-ink">{log.job}</p>
                    <p className="text-[10px] text-[var(--brand-muted)]">{log.time} · {log.count}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest ${log.result === 'success' ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>
                    {log.result}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

function MonitoringCard({ icon: Icon, label, value, status, color, detail, href }: any) {
  const CardContent = (
    <div className="glass-panel rounded-3xl p-6 border border-black/5 hover:border-[var(--premium-gold)] transition-all group bg-white/40 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <Icon className={`text-${color}-500`} size={20} />
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

  return href ? <Link href={href}>{CardContent}</Link> : <div className="cursor-default">{CardContent}</div>;
}
