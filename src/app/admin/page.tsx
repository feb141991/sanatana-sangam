'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  ShieldAlert, Users, BookOpen, MapPin, 
  Settings, Activity, Bell, Search,
  ArrowUpRight, BarChart3, AlertTriangle, 
  UserCheck, ShieldCheck, LogOut
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

const ADMIN_TOOLS = [
  {
    id: 'moderation',
    title: 'Content Moderation',
    desc: 'Review reports and take action on threads, comments, and media.',
    icon: ShieldAlert,
    href: '/admin/moderation',
    color: 'bg-amber-500',
    stats: '12 Pending',
    priority: 'high'
  },
  {
    id: 'users',
    title: 'User Management',
    desc: 'Manage profiles, streaks, and access levels. Ban or unban seekers.',
    icon: Users,
    href: '/admin/users',
    color: 'bg-blue-500',
    stats: '10.2k Total',
    priority: 'medium'
  },
  {
    id: 'content',
    title: 'Library & Katha',
    desc: 'Update scriptures, add new Dharm Veer stories, or edit Pathshala nodes.',
    icon: BookOpen,
    href: '/admin/content',
    color: 'bg-emerald-500',
    stats: '4.2k Items',
    priority: 'low'
  },
  {
    id: 'tirtha',
    title: 'Tirtha & Mandali',
    desc: 'Verify and manage sacred places and local community chapters.',
    icon: MapPin,
    href: '/admin/tirtha',
    color: 'bg-purple-500',
    stats: '840 Sites',
    priority: 'medium'
  },
  {
    id: 'monitoring',
    title: 'System Health',
    desc: 'Monitor API performance, Cron job status, and error logs.',
    icon: Activity,
    href: '/admin/monitoring',
    color: 'bg-rose-500',
    stats: 'Healthy',
    priority: 'high'
  },
  {
    id: 'settings',
    title: 'Global Settings',
    desc: 'Update terms, privacy policies, and app-wide feature flags.',
    icon: Settings,
    href: '/admin/settings',
    color: 'bg-slate-500',
    stats: 'v2.4.0',
    priority: 'low'
  }
];

export default function AdminHub() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('all');
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeNow: 0,
    reportsCount: 0,
    systemStatus: 'Optimal'
  });

  const handleLogout = async () => {
    // Admin logout logic usually involves clearing the admin cookie
    document.cookie = "shoonaya_admin_session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    router.push('/admin/login');
  };

  return (
    <div className="min-h-screen bg-[var(--divine-bg)] pb-24 font-outfit">
      {/* Premium Header */}
      <div className="sticky top-0 z-50 bg-[var(--divine-bg)]/80 backdrop-blur-xl border-b border-[rgba(200,146,74,0.15)] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-2xl bg-gradient-sacred flex items-center justify-center text-white shadow-lg">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold font-serif theme-ink">Shoonaya Command</h1>
              <p className="text-[10px] text-[color:var(--brand-muted)] uppercase tracking-[0.2em] font-bold">Admin Level 2 · Global Access</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex bg-[var(--surface-raised)] rounded-full p-1 border border-black/5">
              <button className="p-2 text-[var(--brand-muted)] hover:text-[var(--brand-ink)] transition-colors">
                <Bell size={20} />
              </button>
              <button onClick={handleLogout} className="p-2 text-red-500 hover:text-red-700 transition-colors" title="Logout">
                <LogOut size={20} />
              </button>
            </div>
            <div className="h-8 w-px bg-black/5" />
            <div className="flex items-center gap-3 pl-2">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold theme-ink">Admin Principal</p>
                <p className="text-[9px] text-green-500 font-bold uppercase tracking-widest">Active Session</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-[var(--brand-primary-soft)] border border-[var(--brand-primary)]/20 flex items-center justify-center text-[var(--brand-primary-strong)] font-bold">
                AP
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10 space-y-12">
        
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Total Seekers', value: '12,842', trend: '+12%', icon: Users, color: 'text-blue-500' },
            { label: 'Active Sangam', value: '1,420', trend: '+5%', icon: Activity, color: 'text-emerald-500' },
            { label: 'Pending Reports', value: '12', trend: '-2', icon: AlertTriangle, color: 'text-amber-500' },
            { label: 'System Health', value: '99.9%', trend: 'Stable', icon: ShieldCheck, color: 'text-purple-500' }
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-panel rounded-[2rem] p-6 border border-black/5 hover:shadow-xl transition-all"
            >
              <div className="flex items-start justify-between">
                <div className={`p-3 rounded-2xl bg-white/50 ${stat.color}`}>
                  <stat.icon size={24} />
                </div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${stat.trend.startsWith('+') ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>
                  {stat.trend}
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-bold theme-ink">{stat.value}</h3>
                <p className="text-[10px] font-bold text-[var(--brand-muted)] uppercase tracking-widest mt-1">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Level 2 Operations Grid */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-serif font-bold theme-ink">Operations Center</h2>
              <p className="text-sm text-[var(--brand-muted)]">Maintain the heartbeat of the Shoonaya ecosystem.</p>
            </div>
            <div className="flex gap-2">
              {['all', 'high', 'medium', 'low'].map(p => (
                <button
                  key={p}
                  onClick={() => setActiveTab(p)}
                  className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
                    activeTab === p ? 'bg-black text-white' : 'bg-white/50 text-[var(--brand-muted)] hover:bg-white'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ADMIN_TOOLS.filter(t => activeTab === 'all' || t.priority === activeTab).map((tool, i) => (
              <Link href={tool.href} key={tool.id}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="group relative overflow-hidden glass-panel rounded-[2.5rem] p-8 border border-black/5 hover:border-[var(--brand-primary)]/30 transition-all h-full flex flex-col justify-between"
                >
                  {/* Tool Background Glow */}
                  <div className={`absolute -right-10 -top-10 w-32 h-32 blur-[60px] opacity-10 group-hover:opacity-20 transition-opacity ${tool.color}`} />
                  
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg ${tool.color}`}>
                        <tool.icon size={28} />
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] font-bold theme-ink px-3 py-1 rounded-full bg-white/50 border border-black/5">
                          {tool.stats}
                        </span>
                        <span className={`text-[8px] font-bold uppercase tracking-widest mt-2 ${tool.priority === 'high' ? 'text-red-500' : 'text-[var(--brand-muted)]'}`}>
                          {tool.priority} Priority
                        </span>
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-bold theme-ink group-hover:text-[var(--brand-primary-strong)] transition-colors">{tool.title}</h3>
                    <p className="text-sm text-[var(--brand-muted)] mt-3 leading-relaxed">
                      {tool.desc}
                    </p>
                  </div>

                  <div className="mt-8 flex items-center gap-2 text-xs font-bold text-[var(--brand-primary-strong)]">
                    Access Dashboard <ArrowUpRight size={16} />
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </div>

        {/* System Alerts Section */}
        <div className="glass-panel rounded-[2.5rem] p-8 border border-red-500/10 bg-red-500/[0.02]">
          <div className="flex items-center gap-3 mb-6">
            <AlertTriangle className="text-red-500" size={24} />
            <h2 className="text-xl font-serif font-bold text-red-900">Critical System Health</h2>
          </div>
          
          <div className="space-y-4">
            {[
              { label: 'API Latency Spiking', time: '2m ago', desc: 'Regional node in Mumbai reporting higher than usual response times (340ms).', type: 'warning' },
              { label: 'Cron Job Failure', time: '14m ago', desc: '`nitya-reminder` failed to execute for 240 users in UK timezone.', type: 'error' }
            ].map((alert, i) => (
              <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-white/40 border border-black/5">
                <div className={`w-2 h-2 rounded-full mt-1.5 ${alert.type === 'error' ? 'bg-red-500' : 'bg-amber-500'}`} />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold theme-ink">{alert.label}</p>
                    <span className="text-[10px] text-[var(--brand-muted)] font-bold">{alert.time}</span>
                  </div>
                  <p className="text-xs text-[var(--brand-muted)] mt-1">{alert.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
