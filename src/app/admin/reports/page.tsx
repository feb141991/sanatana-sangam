'use client';

import { useState } from 'react';
import { 
  BarChart3, PieChart, TrendingUp, Download,
  ArrowLeft, Calendar, Filter, FileText,
  Users, ShieldAlert, Heart, Activity,
  ChevronRight, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function ReportCenter() {
  const [timeframe, setTimeframe] = useState('7d');

  return (
    <div className="min-h-screen bg-[var(--divine-bg)] pb-24 font-outfit">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[var(--divine-bg)]/80 backdrop-blur-xl border-b border-[rgba(200,146,74,0.15)] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="p-2 rounded-xl hover:bg-black/5 text-[var(--brand-muted)] transition-all">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-xl font-bold font-serif theme-ink">Report Center</h1>
              <p className="text-[10px] text-[var(--brand-muted)] uppercase tracking-[0.2em] font-bold">Platform Intelligence</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
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
              <Download size={16} /> Export Data
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">
        
        {/* Growth Overview */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <GrowthCard 
            label="New Seekers" 
            value="+1,242" 
            trend="14.2%" 
            up={true} 
            icon={Users} 
            color="blue" 
          />
          <GrowthCard 
            label="Daily Engagements" 
            value="42.8k" 
            trend="8.1%" 
            up={true} 
            icon={Activity} 
            color="emerald" 
          />
          <GrowthCard 
            label="Moderation Load" 
            value="14" 
            trend="22%" 
            up={false} 
            icon={ShieldAlert} 
            color="rose" 
          />
        </section>

        {/* Detailed Reports Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Analytics Block */}
          <div className="lg:col-span-8 space-y-6">
            <div className="glass-panel rounded-[2.5rem] border border-black/5 p-8 bg-white/40">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-lg font-bold theme-ink">Spiritual Engagement Trends</h3>
                  <p className="text-[10px] text-[var(--brand-muted)] uppercase tracking-widest font-bold">Activity by Tradition</p>
                </div>
                <TrendingUp size={24} className="text-[var(--premium-gold)]" />
              </div>
              
              <div className="h-64 flex items-end justify-between gap-4 px-4">
                {[45, 62, 85, 54, 92, 74, 88].map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-3 group">
                    <div className="w-full bg-[var(--premium-gold)]/10 rounded-t-xl relative overflow-hidden transition-all group-hover:bg-[var(--premium-gold)]/20" style={{ height: `${h}%` }}>
                      <motion.div 
                        initial={{ height: 0 }} 
                        animate={{ height: '100%' }} 
                        className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[var(--premium-gold)] to-amber-400 opacity-60" 
                      />
                    </div>
                    <span className="text-[9px] font-bold text-[var(--brand-muted)]">Day {i+1}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ReportList 
                title="Top Content" 
                items={[
                  { label: 'Bhagavad Gita Ch. 2', val: '8.4k views' },
                  { label: 'Morning Sadhana Guide', val: '5.2k views' },
                  { label: 'Hanuman Chalisa', val: '4.9k views' }
                ]}
              />
              <ReportList 
                title="Community Health" 
                items={[
                  { label: 'Active Mandalis', val: '124' },
                  { label: 'Daily Vichaar Posts', val: '2.1k' },
                  { label: 'Resolved Reports', val: '98%' }
                ]}
              />
            </div>
          </div>

          {/* Quick Access Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <div className="glass-panel rounded-[2.5rem] border border-black/5 p-8 bg-black/5">
              <h3 className="text-sm font-bold uppercase tracking-widest theme-ink mb-6 flex items-center gap-2">
                <FileText size={16} /> Pre-built Reports
              </h3>
              <div className="space-y-3">
                <ReportButton label="User Growth Analysis" />
                <ReportButton label="Content Engagement Audit" />
                <ReportButton label="Moderation Efficiency" />
                <ReportButton label="Geographic Distribution" />
                <ReportButton label="Retention Cohorts" />
              </div>
            </div>

            <div className="glass-panel rounded-[2.5rem] border border-black/5 p-8 bg-[var(--premium-gold-soft)]/30 border-[var(--premium-gold)]/10">
              <h3 className="text-sm font-bold theme-ink mb-2">Export Custom Data</h3>
              <p className="text-[10px] text-[var(--brand-muted)] leading-relaxed mb-4">Generate a custom CSV export with specific filters and date ranges.</p>
              <button className="w-full py-3 rounded-2xl bg-white border border-[var(--premium-gold)]/20 text-[10px] font-bold text-[var(--premium-gold)] uppercase tracking-widest hover:bg-[var(--premium-gold)] hover:text-white transition-all">
                Configure Export
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

function GrowthCard({ label, value, trend, up, icon: Icon, color }: any) {
  const colors: any = {
    blue: 'text-blue-500 bg-blue-500/10',
    emerald: 'text-emerald-500 bg-emerald-500/10',
    rose: 'text-rose-500 bg-rose-500/10'
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

function ReportButton({ label }: any) {
  return (
    <button className="w-full flex items-center justify-between p-4 rounded-2xl bg-white border border-black/5 hover:border-[var(--premium-gold)] transition-all group text-left">
      <span className="text-xs font-bold theme-ink group-hover:text-[var(--premium-gold)] transition-all">{label}</span>
      <ChevronRight size={14} className="text-[var(--brand-muted)]" />
    </button>
  );
}
