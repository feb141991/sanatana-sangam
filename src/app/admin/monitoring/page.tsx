'use client';

import { motion } from 'framer-motion';
import { 
  Activity, Zap, Server, Globe, 
  Clock, AlertCircle, CheckCircle,
  BarChart3, RefreshCcw, Database,
  Cpu, HardDrive, Shield
} from 'lucide-react';
import { useState, useEffect } from 'react';

export default function SystemMonitoring() {
  const [latency, setLatency] = useState(120);
  const [activeUsers, setActiveUsers] = useState(842);

  useEffect(() => {
    const interval = setInterval(() => {
      setLatency(prev => prev + (Math.random() > 0.5 ? 5 : -5));
      setActiveUsers(prev => prev + (Math.random() > 0.5 ? 2 : -2));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[var(--divine-bg)] pb-24 font-outfit">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[var(--divine-bg)]/80 backdrop-blur-xl border-b border-[rgba(200,146,74,0.15)] px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500">
              <Activity size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold font-serif theme-ink">System Pulse</h1>
              <p className="text-[10px] text-[var(--brand-muted)] uppercase tracking-[0.2em] font-bold">Real-time Monitoring</p>
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
          <div className="glass-panel rounded-3xl p-6 border border-black/5">
            <div className="flex items-center justify-between mb-4">
              <Zap className="text-amber-500" size={20} />
              <span className="text-[10px] font-bold text-[var(--brand-muted)] uppercase tracking-widest">Avg Latency</span>
            </div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-bold theme-ink">{latency}ms</h3>
              <span className="text-xs text-green-500 font-bold">Stable</span>
            </div>
            <div className="mt-4 h-12 flex items-end gap-1">
              {[...Array(20)].map((_, i) => (
                <div key={i} className="flex-1 bg-amber-500/20 rounded-t-sm" style={{ height: `${Math.random() * 100}%` }} />
              ))}
            </div>
          </div>

          <div className="glass-panel rounded-3xl p-6 border border-black/5">
            <div className="flex items-center justify-between mb-4">
              <Globe className="text-blue-500" size={20} />
              <span className="text-[10px] font-bold text-[var(--brand-muted)] uppercase tracking-widest">Active Now</span>
            </div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-bold theme-ink">{activeUsers}</h3>
              <span className="text-xs text-blue-500 font-bold">Seekers</span>
            </div>
            <div className="mt-4 flex -space-x-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200" />
              ))}
              <div className="w-8 h-8 rounded-full border-2 border-white bg-blue-500 flex items-center justify-center text-[10px] text-white font-bold">
                +830
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-3xl p-6 border border-black/5">
            <div className="flex items-center justify-between mb-4">
              <RefreshCcw className="text-emerald-500" size={20} />
              <span className="text-[10px] font-bold text-[var(--brand-muted)] uppercase tracking-widest">Cron Success</span>
            </div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-bold theme-ink">98.4%</h3>
              <span className="text-xs text-red-500 font-bold">2 Fails</span>
            </div>
            <div className="mt-4 text-xs text-[var(--brand-muted)]">
              Last run: 4 minutes ago (`shloka-reminder`)
            </div>
          </div>
        </div>

        {/* Infrastructure Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Services */}
          <div className="space-y-4">
            <h2 className="text-lg font-serif font-bold theme-ink px-2">Cloud Services</h2>
            <div className="glass-panel rounded-3xl border border-black/5 divide-y divide-black/5 overflow-hidden">
              {[
                { name: 'Auth Engine (Supabase)', status: 'up', icon: Shield },
                { name: 'Database (PostgreSQL)', status: 'up', icon: Database },
                { name: 'Edge Functions', status: 'warning', icon: Cpu },
                { name: 'Asset Storage (S3)', status: 'up', icon: HardDrive }
              ].map((service) => (
                <div key={service.name} className="flex items-center justify-between p-4 bg-white/40">
                  <div className="flex items-center gap-3">
                    <service.icon size={18} className="text-[var(--brand-muted)]" />
                    <span className="text-sm font-medium theme-ink">{service.name}</span>
                  </div>
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
                </div>
              ))}
            </div>
          </div>

          {/* Job Logs */}
          <div className="space-y-4">
            <h2 className="text-lg font-serif font-bold theme-ink px-2">Recent Job Execution</h2>
            <div className="glass-panel rounded-3xl border border-black/5 p-4 space-y-3 bg-white/40">
              {[
                { job: 'nitya-reminder', time: '12:00 PM', result: 'success', count: '4,204 sent' },
                { job: 'shloka-reminder', time: '11:45 AM', result: 'fail', count: 'Timeout' },
                { job: 'panchang-sync', time: '06:00 AM', result: 'success', count: 'Updated' },
                { job: 'analytics-rollup', time: '00:05 AM', result: 'success', count: 'Aggregated' }
              ].map((log, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-black/5 last:border-0">
                  <div>
                    <p className="text-xs font-bold theme-ink">{log.job}</p>
                    <p className="text-[10px] text-[var(--brand-muted)]">{log.time} · {log.count}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest ${log.result === 'success' ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>
                    {log.result}
                  </span>
                </div>
              ))}
              <button className="w-full pt-2 text-[10px] font-bold text-blue-500 uppercase tracking-widest hover:underline">
                View Full Logs →
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
