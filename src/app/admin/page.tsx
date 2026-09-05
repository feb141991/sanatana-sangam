'use client';

import { 
  Clock, Users, ShieldAlert, Bell, Globe, Activity, 
  Settings, ChevronRight, Search, ArrowUpRight, BarChart3, 
  AlertTriangle, UserCheck, ShieldCheck, LogOut, ArrowLeft,
  FileText, Megaphone, MapPin, Calendar, RefreshCw, Heart, 
  BookOpen, Radio, Sparkles, Send, CheckCircle2, XCircle,
  Terminal, Copy, Check, ExternalLink, X, Shield, Eye, Languages
} from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

export interface UrgentAlertItem {
  id: string;
  title: string;
  desc: string;
  type: 'integrity' | 'report' | 'dharm_veer' | 'system' | 'client_error';
  severity: 'high' | 'medium' | 'low';
  href: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<any>({
    totalSeekers: 0,
    onboardedSeekers: 0,
    activeNow: 0,
    pendingReports: 0,
    pendingDharmVeerReview: 0,
    globalReach: 0,
    intelligence: null,
  });
  const [alerts, setAlerts] = useState<UrgentAlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFlushing, setIsFlushing] = useState(false);
  const [flushMessage, setFlushMessage] = useState<string | null>(null);

  // Inspector Modal State
  const [selectedAlert, setSelectedAlert] = useState<UrgentAlertItem | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [resolveFeedback, setResolveFeedback] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const [statsRes, alertsRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/alerts'),
      ]);
      const data = await statsRes.json();
      const alertsData = await alertsRes.json();
      setStats({
        totalSeekers: data.totalSeekers || 0,
        onboardedSeekers: data.onboardedSeekers || 0,
        activeNow: data.activeNow || 0,
        pendingReports: data.pendingReports || 0,
        pendingDharmVeerReview: data.pendingDharmVeerReview || 0,
        globalReach: data.globalReach || 0,
        intelligence: data.intelligence,
      });
      setAlerts(alertsData.alerts || []);
    } catch (err) {
      console.error('Failed to fetch stats/alerts:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleFlushCache = async () => {
    setIsFlushing(true);
    setFlushMessage(null);
    try {
      const res = await fetch('/api/admin/flush-cache', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setFlushMessage(data.message || 'Edge & page cache flushed successfully!');
      } else {
        setFlushMessage('Failed: ' + (data.error || 'Unknown error'));
      }
    } catch (e: any) {
      setFlushMessage('Error: ' + (e.message || String(e)));
    } finally {
      setIsFlushing(false);
      setTimeout(() => setFlushMessage(null), 4000);
    }
  };

  const handleResolveAlertFromModal = async () => {
    if (!selectedAlert) return;
    setIsResolving(true);
    setResolveFeedback(null);
    try {
      if (selectedAlert.type === 'integrity' && selectedAlert.metadata?.findingId) {
        const res = await fetch('/api/admin/calendar-governance/integrity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'resolve', id: selectedAlert.metadata.findingId }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to resolve finding');
        setResolveFeedback('Calendar integrity finding marked as resolved!');
      } else if (selectedAlert.type === 'report' && selectedAlert.metadata?.reportId) {
        const res = await fetch('/api/admin/moderation/resolve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reportId: selectedAlert.metadata.reportId, action: 'dismiss' }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to dismiss report');
        setResolveFeedback('Report resolved successfully!');
      } else {
        setResolveFeedback('Item marked as acknowledged.');
      }

      // Refresh alerts
      fetchStats();
      setTimeout(() => {
        setSelectedAlert(null);
        setResolveFeedback(null);
      }, 1500);
    } catch (err: any) {
      setResolveFeedback('Action failed: ' + err.message);
    } finally {
      setIsResolving(false);
    }
  };

  const handleCopyAlertJson = () => {
    if (!selectedAlert) return;
    navigator.clipboard.writeText(JSON.stringify(selectedAlert, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[var(--divine-bg,#FAF6EF)] font-outfit pb-24 text-stone-900">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-10">
        
        {/* Page Title & Subtitle Banner */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[rgba(197,160,89,0.2)]"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-600 to-amber-900 flex items-center justify-center text-white shadow-md shadow-amber-900/20 text-sm font-serif">
                ☸
              </div>
              <h1 className="text-2xl font-bold font-serif theme-ink tracking-tight">
                Command Center
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-900 text-[10px] font-bold uppercase tracking-wider">
                Production Live
              </span>
            </div>
            <p className="text-xs text-[var(--brand-muted)] font-medium">
              Global Platform Telemetry, Autonomous Systems, and Dharma Governance
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchStats}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-black/10 bg-white hover:bg-black/5 text-xs font-bold text-gray-700 transition-all shadow-xs"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin text-amber-600' : ''} />
              <span>Refresh Telemetry</span>
            </button>
            <Link
              href="/admin/settings"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/5 hover:bg-black/10 text-xs font-bold text-gray-700 transition-all"
            >
              <Settings size={14} />
              <span>Settings</span>
            </Link>
          </div>
        </motion.div>

        {/* Global Statistics Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
        >
          <StatCard 
            href="/admin/users"
            icon={Users} 
            label="Onboarded Seekers" 
            value={stats.onboardedSeekers?.toLocaleString() || '0'} 
            trend={`Total: ${stats.totalSeekers?.toLocaleString() || '0'}`} 
            color="blue"
          />
          <StatCard 
            href="/admin/reports"
            icon={Heart} 
            label="Spiritual Pulse" 
            value={stats.intelligence?.retentionRate || '0%'} 
            trend="Active Sadhaks" 
            color="rose"
            pulse
          />
          <StatCard 
            href="/admin/moderation"
            icon={ShieldAlert} 
            label="Pending Moderation" 
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
            trend="Across Pilgrimage Hubs" 
            color="emerald"
          />
        </motion.div>

        {/* Main Workspace: 4-Domain Command Quadrants & Side Column */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main Command Operations (8 Cols) */}
          <div className="lg:col-span-8 space-y-10">
            
            {/* Domain 1: Dharma & Sacred Canon */}
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-amber-600" />
                  <h2 className="text-sm font-bold uppercase tracking-widest text-amber-950 font-serif">
                    1. Dharma & Sacred Canon
                  </h2>
                </div>
                <span className="text-[10px] font-bold text-amber-800/70 uppercase tracking-widest bg-amber-500/10 px-2 py-0.5 rounded-full">
                  Content & Astronomy
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CommandCard 
                  href="/admin/observance-content"
                  icon={BookOpen}
                  title="Observance Content Studio" 
                  desc="Curate festival stories, review drafts, sacred artwork, share copy, and tradition coverage." 
                  badge="Core"
                />
                <CommandCard 
                  href="/admin/calendar-governance"
                  icon={Calendar}
                  title="Calendar Governance & Integrity" 
                  desc="Golden-fixture sourcing, disputed variant review, deterministic engine checks, and integrity findings." 
                  badge={alerts.filter(a => a.type === 'integrity').length > 0 ? `${alerts.filter(a => a.type === 'integrity').length} Findings` : undefined}
                  badgeColor="rose"
                />
                <CommandCard 
                  href="/admin/dharm-veer-review"
                  icon={ShieldCheck}
                  title="Dharm Veer Review Queue" 
                  desc="Verify and approve auto-sourced biographies and inspirational histories before publication." 
                  count={stats.pendingDharmVeerReview}
                />
                <CommandCard 
                  href="/admin/hindi-generator"
                  icon={Languages}
                  title="Sacred Hindi Generator" 
                  desc="Auto-generate and review Hindi meanings and verse explanations for Gita & library items." 
                />
              </div>
            </motion.section>

            {/* Domain 2: Sangam & Community */}
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-blue-600" />
                  <h2 className="text-sm font-bold uppercase tracking-widest text-blue-950 font-serif">
                    2. Sangam & Community
                  </h2>
                </div>
                <span className="text-[10px] font-bold text-blue-800/70 uppercase tracking-widest bg-blue-500/10 px-2 py-0.5 rounded-full">
                  Seekers & Trust
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CommandCard 
                  href="/admin/users"
                  icon={UserCheck}
                  title="Seeker Directory & Dossiers" 
                  desc="Lifecycle segments (new, active, dormant, deletion), karma history, and end-to-end seeker dossiers." 
                  badge="Deep Linked"
                />
                <CommandCard 
                  href="/admin/tirtha"
                  icon={MapPin}
                  title="Mandali & Tirtha Hub" 
                  desc="Oversee local spiritual mandalis, temple pilgrimage nodes, and devotee coordinators." 
                />
                <CommandCard 
                  href="/admin/moderation"
                  icon={ShieldAlert}
                  title="Trust & Moderation Queue" 
                  desc="Review flagged devotee reports, inappropriate content, and account privacy deletion requests." 
                  count={stats.pendingReports}
                />
              </div>
            </motion.section>

            {/* Domain 3: Telemetry & Infrastructure */}
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <Activity size={16} className="text-emerald-600" />
                  <h2 className="text-sm font-bold uppercase tracking-widest text-emerald-950 font-serif">
                    3. Telemetry & Infrastructure
                  </h2>
                </div>
                <span className="text-[10px] font-bold text-emerald-800/70 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  Reliability & Sentry
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CommandCard 
                  href="/admin/crons"
                  icon={Clock}
                  title="Cron Telemetry & Automations" 
                  desc="Monitor ~35 scheduled background jobs, view failure telemetry, and run instant test dispatches." 
                />
                <CommandCard 
                  href="/admin/monitoring"
                  icon={Radio}
                  title="Operational Monitoring & Sentry" 
                  desc="Client exceptions, FCM/APNs delivery success rate, active device tokens, and AI circuit breakers." 
                />
                <CommandCard 
                  href="/admin/reports"
                  icon={BarChart3}
                  title="Executive Analytics & Data Export" 
                  desc="Review retention trajectories, Japa completion metrics, and export compliant seeker data." 
                />
              </div>
            </motion.section>

            {/* Domain 4: Communications & Studio */}
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <Bell size={16} className="text-purple-600" />
                  <h2 className="text-sm font-bold uppercase tracking-widest text-purple-950 font-serif">
                    4. Communications & Studio
                  </h2>
                </div>
                <span className="text-[10px] font-bold text-purple-800/70 uppercase tracking-widest bg-purple-500/10 px-2 py-0.5 rounded-full">
                  Engagement & Push
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CommandCard 
                  href="/admin/notifications"
                  icon={Bell}
                  title="Notification Studio & Copy Editor" 
                  desc="Edit push templates, test dynamic variables, and preview simulated iOS/Android lockscreens." 
                  badge="Interactive"
                />
                <CommandCard 
                  href="/admin/broadcast"
                  icon={Megaphone}
                  title="Global Devotee Broadcast" 
                  desc="Dispatch instant sacred messages, muhurta alerts, or breaking news across all platforms." 
                />
              </div>
            </motion.section>
          </div>

          {/* Side Column: Urgent Alerts & Quick Actions (4 Cols) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Urgent Alerts Section */}
            <motion.section 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-panel rounded-[2rem] border border-rose-500/20 p-6 bg-gradient-to-b from-rose-500/5 via-white/60 to-white/40 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-rose-700 flex items-center gap-2">
                  <AlertTriangle size={15} /> Urgent Alerts
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-700 text-[10px] font-bold">
                  {alerts.length} Active
                </span>
              </div>

              <p className="text-[11px] text-[var(--brand-muted)] mb-4">
                Click any alert card below to inspect full diagnostic logs, date comparisons, and resolution tools.
              </p>

              <div className="space-y-3">
                {alerts.length === 0 ? (
                  <div className="p-5 rounded-2xl bg-white border border-black/5 text-center text-xs text-[var(--brand-muted)]">
                    ✓ All systems operational. No active integrity or crash alerts.
                  </div>
                ) : (
                  alerts.map((item) => (
                    <div 
                      key={item.id}
                      onClick={() => setSelectedAlert(item)}
                      className="p-4 rounded-2xl bg-white border border-rose-500/20 shadow-xs hover:border-rose-500/60 hover:shadow-md transition-all group cursor-pointer relative overflow-hidden"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-bold text-gray-900 group-hover:text-rose-700 transition-colors">
                          {item.title}
                        </p>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(item.href);
                          }}
                          className="p-1 rounded-md text-[var(--brand-muted)] hover:text-rose-700 hover:bg-rose-50 transition-colors shrink-0"
                          title="Open direct page"
                        >
                          <ArrowUpRight size={14} />
                        </button>
                      </div>

                      <p className="text-[11px] text-gray-600 mt-1 line-clamp-2 leading-relaxed font-sans">
                        {item.desc}
                      </p>

                      <div className="mt-2.5 flex items-center justify-between text-[9px] text-[var(--brand-muted)] font-mono border-t border-black/5 pt-1.5">
                        <span className="uppercase font-bold text-rose-700/80">{item.type.replace(/_/g, ' ')}</span>
                        <span>{new Date(item.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.section>

            {/* Quick Tools & Infrastructure Section */}
            <motion.section 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-panel rounded-[2rem] border border-[rgba(197,160,89,0.2)] p-6 bg-white/50 space-y-4 shadow-sm"
            >
              <div className="flex items-center justify-between pb-2 border-b border-black/5">
                <h3 className="text-xs font-bold uppercase tracking-widest text-amber-950 flex items-center gap-2">
                  <Activity size={15} className="text-amber-600" /> Quick Operations
                </h3>
              </div>

              {flushMessage && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 font-medium">
                  {flushMessage}
                </div>
              )}

              <div className="space-y-2.5">
                <QuickTool icon={Users} label="Seeker Directory & Lifecycles" href="/admin/users" />
                <QuickTool icon={Clock} label="Cron Telemetry & Runner" href="/admin/crons" />
                <QuickTool icon={Bell} label="Push Notification Studio" href="/admin/notifications" />
                <QuickTool icon={Megaphone} label="Global Devotee Broadcast" href="/admin/broadcast" />
                <QuickTool icon={FileText} label="Export Seeker Data" href="/admin/reports?tab=export" />
                <QuickTool 
                  icon={RefreshCw} 
                  label={isFlushing ? "Flushing Global Cache..." : "Flush Edge & CDN Cache"} 
                  onClick={handleFlushCache} 
                />
                <QuickTool icon={Radio} label="Live Client Crash Sentry" href="/admin/monitoring" />
              </div>
            </motion.section>

          </div>

        </div>
      </main>

      {/* ─── RICH ALERT & DIAGNOSTIC LOG INSPECTOR MODAL ─────────────────────── */}
      <AnimatePresence>
        {selectedAlert && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-2xl bg-white rounded-3xl border border-[rgba(197,160,89,0.3)] shadow-2xl overflow-hidden my-8"
            >
              {/* Modal Header */}
              <div className="p-6 bg-gradient-to-r from-stone-900 via-stone-800 to-amber-950 text-white flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold uppercase tracking-wider">
                      {selectedAlert.severity} Severity
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-white/10 text-amber-200 text-[10px] font-mono">
                      {selectedAlert.type.toUpperCase()}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold font-serif leading-tight text-white mt-1">
                    {selectedAlert.title}
                  </h2>
                  <p className="text-[11px] text-stone-400 font-mono">
                    Timestamp: {new Date(selectedAlert.timestamp).toLocaleString()}
                  </p>
                </div>

                <button
                  onClick={() => setSelectedAlert(null)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                  title="Close Inspector"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto font-sans">
                
                {/* Feedback Banner */}
                {resolveFeedback && (
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 font-medium flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                    <span>{resolveFeedback}</span>
                  </div>
                )}

                {/* Log & Reason Description Box */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-gray-800 flex items-center gap-1.5">
                      <Terminal size={14} className="text-amber-600" />
                      <span>Audit Diagnostic Reason & Log:</span>
                    </span>
                    <button
                      onClick={handleCopyAlertJson}
                      className="flex items-center gap-1 text-[11px] font-bold text-amber-700 hover:underline"
                    >
                      {copiedJson ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                      <span>{copiedJson ? 'Copied JSON' : 'Copy Diagnostic JSON'}</span>
                    </button>
                  </div>

                  <div className="p-4 rounded-2xl bg-stone-900 text-stone-100 font-mono text-xs leading-relaxed space-y-2 overflow-x-auto shadow-inner">
                    <p className="text-amber-300 font-sans font-medium text-xs">
                      {selectedAlert.desc}
                    </p>
                    {selectedAlert.metadata && (
                      <div className="pt-2 border-t border-stone-800 text-[11px] text-stone-400 space-y-1">
                        {selectedAlert.metadata.engineVersion && (
                          <div>Engine Version: <span className="text-emerald-400">{selectedAlert.metadata.engineVersion}</span></div>
                        )}
                        {selectedAlert.metadata.issueType && (
                          <div>Issue Type: <span className="text-amber-400">{selectedAlert.metadata.issueType}</span></div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Calendar Integrity Specific Diff Viewer */}
                {selectedAlert.type === 'integrity' && selectedAlert.metadata && (
                  <div className="space-y-2 pt-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                      Date Calculation Comparison
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/15 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider block">
                          📁 Stored Date (Curated)
                        </span>
                        <div className="text-xs font-mono font-bold text-gray-900">
                          {selectedAlert.metadata.storedDate || 'Null / Not set'}
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/15 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider block">
                          ⚡ Deterministic Engine Date
                        </span>
                        <div className="text-xs font-mono font-bold text-amber-900">
                          {selectedAlert.metadata.engineDate || 'None calculated'}
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/15 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider block">
                          🎯 Candidate Dates ({selectedAlert.metadata.candidateDates?.length || 0})
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {selectedAlert.metadata.candidateDates?.slice(0, 3).map((cd: string) => (
                            <span key={cd} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white border border-black/10">
                              {cd}
                            </span>
                          ))}
                          {(selectedAlert.metadata.candidateDates?.length || 0) > 3 && (
                            <span className="text-[10px] text-gray-500 font-mono self-center">
                              +{selectedAlert.metadata.candidateDates.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Client Error Specific Breakdown */}
                {selectedAlert.type === 'client_error' && selectedAlert.metadata && (
                  <div className="space-y-2 pt-2 text-xs">
                    <h4 className="font-bold uppercase tracking-wider text-gray-700">
                      Error Crash Details
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-200">
                        <span className="text-[10px] text-gray-500 block">Route</span>
                        <b className="font-mono text-xs">{selectedAlert.metadata.route}</b>
                      </div>
                      <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-200">
                        <span className="text-[10px] text-gray-500 block">Spike (1h)</span>
                        <b className="text-rose-600 text-xs">{selectedAlert.metadata.count1h || 0} hits</b>
                      </div>
                      <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-200">
                        <span className="text-[10px] text-gray-500 block">Sessions</span>
                        <b className="text-gray-900 text-xs">{selectedAlert.metadata.distinctSessionsCount || 1}</b>
                      </div>
                      <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-200">
                        <span className="text-[10px] text-gray-500 block">Fingerprint</span>
                        <b className="font-mono text-[10px] truncate block">{selectedAlert.metadata.fingerprint?.slice(0, 8)}</b>
                      </div>
                    </div>
                  </div>
                )}

              </div>

              {/* Modal Footer Actions */}
              <div className="p-5 bg-gray-50 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3">
                <button
                  onClick={() => setSelectedAlert(null)}
                  className="px-4 py-2 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-100 transition-all"
                >
                  Close
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleResolveAlertFromModal}
                    disabled={isResolving}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm disabled:opacity-50"
                  >
                    <CheckCircle2 size={14} />
                    <span>{isResolving ? 'Resolving...' : 'Mark as Resolved'}</span>
                  </button>

                  <button
                    onClick={() => {
                      router.push(selectedAlert.href);
                      setSelectedAlert(null);
                    }}
                    className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-amber-900 hover:bg-amber-800 text-white text-xs font-bold transition-all shadow-md"
                  >
                    <span>Open in Dedicated View</span>
                    <ArrowUpRight size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

function StatCard({ icon: Icon, label, value, trend, color, pulse, alert, href }: any) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    rose: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
    amber: 'bg-amber-500/10 text-amber-700 border-amber-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  };

  return (
    <Link href={href}>
      <div className={`glass-panel rounded-3xl p-6 border transition-all duration-300 hover:scale-[1.02] cursor-pointer shadow-xs hover:shadow-md relative overflow-hidden bg-white/70 ${alert ? 'ring-2 ring-rose-500/50 border-rose-500/30' : 'border-[rgba(197,160,89,0.2)]'}`}>
        <div className="flex items-center justify-between mb-4 relative z-10">
          <div className={`p-2.5 rounded-2xl ${colors[color] || colors.blue}`}>
            <Icon size={20} />
          </div>
          {pulse && <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />}
        </div>
        <div className="relative z-10 space-y-1">
          <h4 className="text-xs font-bold text-[var(--brand-muted)] uppercase tracking-wider">{label}</h4>
          <h3 className="text-3xl font-bold theme-ink">{value}</h3>
          <p className="text-[10px] font-bold text-slate-400 pt-1 flex items-center gap-1 uppercase tracking-wider">
            <ArrowUpRight size={12} /> {trend}
          </p>
        </div>
        <div className={`absolute -right-4 -bottom-4 opacity-[0.03] ${colors[color] || colors.blue}`}>
          <Icon size={110} />
        </div>
      </div>
    </Link>
  );
}

function CommandCard({ icon: Icon, title, desc, count, badge, badgeColor, href }: any) {
  return (
    <Link href={href}>
      <div className="glass-panel rounded-[2rem] border border-[rgba(197,160,89,0.2)] p-6 bg-white/60 hover:bg-white hover:border-[var(--premium-gold)] transition-all duration-300 group cursor-pointer h-full flex flex-col justify-between shadow-xs hover:shadow-md">
        <div className="space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-800 group-hover:bg-amber-900 group-hover:text-white transition-all shadow-2xs">
              <Icon size={22} />
            </div>
            {count !== undefined && count > 0 && (
              <span className="px-3 py-1 rounded-full bg-rose-500 text-white text-[10px] font-bold shadow-xs">
                {count} Actionable
              </span>
            )}
            {badge && (
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                badgeColor === 'rose'
                  ? 'bg-rose-500/10 text-rose-700 border border-rose-500/20'
                  : 'bg-amber-500/10 text-amber-800 border border-amber-500/20'
              }`}>
                {badge}
              </span>
            )}
          </div>
          <div>
            <h4 className="text-sm font-bold theme-ink group-hover:text-amber-900 transition-colors">
              {title}
            </h4>
            <p className="text-xs text-[var(--brand-muted)] mt-1 leading-relaxed">
              {desc}
            </p>
          </div>
        </div>
        <div className="mt-5 flex items-center gap-1.5 text-[10px] font-bold text-[var(--premium-gold)] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all">
          <span>Manage System</span> <ChevronRight size={12} />
        </div>
      </div>
    </Link>
  );
}

function QuickTool({ icon: Icon, label, href, onClick }: any) {
  const content = (
    <div className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-white border border-black/5 hover:border-[var(--premium-gold)] hover:shadow-xs transition-all group cursor-pointer">
      <div className="flex items-center gap-3">
        <div className="p-1.5 rounded-lg bg-black/5 group-hover:bg-amber-500/10 transition-colors">
          <Icon size={16} className="text-[var(--brand-muted)] group-hover:text-amber-800 transition-colors" />
        </div>
        <span className="text-xs font-bold theme-ink group-hover:text-amber-950 transition-colors">{label}</span>
      </div>
      <ChevronRight size={14} className="text-[var(--brand-muted)] group-hover:translate-x-0.5 transition-transform" />
    </div>
  );

  if (href) return <Link href={href} className="block">{content}</Link>;
  return <div onClick={onClick} className="block">{content}</div>;
}
