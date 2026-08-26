"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { 
  BarChart3, PieChart, TrendingUp, Download,
  ArrowLeft, Calendar, Filter, FileText,
  Users, ShieldAlert, Heart, Activity,
  ChevronRight, ArrowUpRight, ArrowDownRight,
  Clock, Globe, RefreshCw, AlertCircle, Sparkles, CheckCircle
} from "lucide-react";
import Link from "next/link";

function ReportCenterContent() {
  const searchParams = useSearchParams();
  const [timeframe, setTimeframe] = useState("7d");
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "overview");
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/reports");
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error("Failed to fetch report stats", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const triggerExport = (type: string) => {
    window.open(`/api/admin/reports/export?type=${type}`, "_blank");
  };

  const totalSeekers = stats?.overview?.totalSeekers || 0;
  const onboardedSeekers = stats?.overview?.onboardedSeekers || 0;
  const activeStreak = stats?.overview?.activeStreakSeekers || 0;
  const completionPct = totalSeekers > 0 ? Math.round((onboardedSeekers / totalSeekers) * 100) : 0;

  return (
    <div className="min-h-screen bg-[var(--divine-bg)] pb-24 font-outfit">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[var(--divine-bg)]/80 backdrop-blur-xl border-b border-[rgba(197,160,89,0.15)] px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="p-2 rounded-xl hover:bg-black/5 text-[var(--brand-muted)] transition-all">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-xl font-bold font-serif theme-ink">Business Intelligence & Analytics</h1>
              <p className="text-[10px] text-[var(--brand-muted)] uppercase tracking-[0.2em] font-bold">Standard Platform Telemetry</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-black/5 p-1 rounded-xl">
              {["overview", "content", "finance", "lifecycle", "export"].map((tab) => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                    activeTab === tab 
                      ? "bg-white text-[var(--premium-gold)] shadow-sm" 
                      : "text-[var(--brand-muted)] hover:text-black"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <button 
              onClick={() => triggerExport("seekers")}
              className="bg-[var(--premium-gold)] text-white px-5 py-2 rounded-full text-xs font-bold flex items-center gap-2 shadow-lg shadow-[var(--premium-gold)]/20 hover:opacity-90 transition-all"
            >
              <Download size={15} /> Export CSV
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">
        
        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <>
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <GrowthCard 
                href="/admin/users"
                label="Total Registered Seekers" 
                value={totalSeekers.toLocaleString()} 
                trend="Live DB" 
                up={true} 
                icon={Users} 
                color="blue" 
              />
              <GrowthCard 
                href="/admin/users"
                label="Active Streak Seekers" 
                value={activeStreak.toLocaleString()} 
                trend="Active" 
                up={true} 
                icon={Activity} 
                color="emerald" 
              />
              <GrowthCard 
                href="/admin/users"
                label="Retention Rate" 
                value={stats?.overview?.retentionRate || "0%"} 
                trend="Calculated" 
                up={true} 
                icon={Heart} 
                color="amber" 
              />
              <GrowthCard 
                href="/admin/calendar-governance"
                label="Open Integrity Issues" 
                value={stats?.governance?.openIntegrityFindings ?? 0} 
                trend={stats?.governance?.openIntegrityFindings > 0 ? "Needs Action" : "Clean"} 
                up={stats?.governance?.openIntegrityFindings === 0} 
                icon={ShieldAlert} 
                color="rose" 
              />
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8 space-y-6">
                <div className="glass-panel rounded-[2.5rem] border border-black/5 p-8 bg-white/40">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold theme-ink">Recent System & Cron Execution Logs</h3>
                    <button onClick={fetchStats} className="text-xs text-[var(--premium-gold)] font-bold flex items-center gap-1 hover:underline">
                      <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Refresh
                    </button>
                  </div>
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
                    <ReportButton label="Calendar Governance Audit" onClick={() => setActiveTab("governance")} />
                    <ReportButton label="Content Usage & Sadhana" onClick={() => setActiveTab("content")} />
                    <ReportButton label="Seeker Lifecycle & Traditions" onClick={() => setActiveTab("lifecycle")} />
                    <ReportButton label="Subscription & Early Access Health" onClick={() => setActiveTab("finance")} />
                    <ReportButton label="Platform Data Extraction" onClick={() => setActiveTab("export")} />
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* GOVERNANCE TAB */}
        {activeTab === "governance" && (
          <div className="space-y-8">
            <section className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <GrowthCard 
                href="/admin/calendar-governance"
                label="Golden Fixtures Total" 
                value={stats?.governance?.goldenFixturesTotal ?? 0} 
                trend="Configured" 
                up={true} 
                icon={FileText} 
                color="blue" 
              />
              <GrowthCard 
                href="/admin/calendar-governance"
                label="Sourced & Verified" 
                value={stats?.governance?.realFixtures ?? 0} 
                trend="Tier 1-4" 
                up={true} 
                icon={TrendingUp} 
                color="emerald" 
              />
              <GrowthCard 
                href="/admin/calendar-governance"
                label="Approved Fixtures" 
                value={stats?.governance?.approvedFixtures ?? 0} 
                trend="Signed Off" 
                up={true} 
                icon={Heart} 
                color="amber" 
              />
            </section>

            <div className="glass-panel rounded-[3rem] border border-black/5 p-10 bg-white/40">
              <h3 className="text-xl font-bold theme-ink mb-8">Governance Status & Integrity</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <ReportList 
                  title="Golden Fixture Health" 
                  items={[
                    { label: "Total Golden Fixtures", val: stats?.governance?.goldenFixturesTotal ?? 0, href: "/admin/calendar-governance" },
                    { label: "Real Sourced Fixtures", val: stats?.governance?.realFixtures ?? 0, href: "/admin/calendar-governance" },
                    { label: "Council Approved Fixtures", val: stats?.governance?.approvedFixtures ?? 0, href: "/admin/calendar-governance" },
                    { label: "Open Integrity Findings", val: stats?.governance?.openIntegrityFindings ?? 0, href: "/admin/calendar-governance" },
                  ]} 
                />
                <ReportList 
                  title="Biographies & Moderation" 
                  items={[
                    { label: "Pending Dharm Veer Reviews", val: stats?.governance?.pendingDharmVeerReviews ?? 0, href: "/admin/dharm-veer-review" },
                    { label: "Total Moderation Reports", val: stats?.moderation?.totalReports ?? 0, href: "/admin/moderation" },
                    { label: "Pending Moderation Reports", val: stats?.moderation?.pendingReports ?? 0, href: "/admin/moderation" },
                    { label: "Resolved Moderation Reports", val: stats?.moderation?.resolvedReports ?? 0, href: "/admin/moderation" },
                  ]} 
                />
              </div>
            </div>
          </div>
        )}

        {/* CONTENT & SADHANA TAB */}
        {activeTab === "content" && (
          <div className="space-y-8">
            <section className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <GrowthCard 
                href="/admin/users"
                label="Active Sadhana Users" 
                value={activeStreak.toLocaleString()} 
                trend="Real-time" 
                up={true} 
                icon={Clock} 
                color="amber" 
              />
              <GrowthCard 
                href="/admin/users"
                label="Total Registered Seekers" 
                value={totalSeekers.toLocaleString()} 
                trend="Live DB" 
                up={true} 
                icon={Globe} 
                color="blue" 
              />
              <GrowthCard 
                href="/admin/users"
                label="Onboarding Completion" 
                value={`${completionPct}%`} 
                trend={`${onboardedSeekers} onboarded`} 
                up={true} 
                icon={Heart} 
                color="rose" 
              />
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <ReportList title="Most Engaging Kathas & Content" items={stats?.content?.topContent || []} />
              <ReportList title="Sadhana Practice Activity" items={stats?.content?.sadhanaSessions || []} />
            </div>
          </div>
        )}

        {/* FINANCE / SUBSCRIPTION HEALTH TAB */}
        {activeTab === "finance" && (
          <div className="space-y-8">
            <section className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <GrowthCard 
                href="/admin/users"
                label="Monthly Recurring Revenue" 
                value="₹0 (Free Launch)" 
                trend="Early Access" 
                up={true} 
                icon={TrendingUp} 
                color="emerald" 
              />
              <GrowthCard 
                href="/admin/users"
                label="Subscription Renewals" 
                value={stats?.finance?.activeProSeekers ?? 0} 
                trend="Active Pro" 
                up={true} 
                icon={RefreshCw} 
                color="blue" 
              />
              <GrowthCard 
                href="/admin/users"
                label="Churn Rate" 
                value="0.0%" 
                trend="100% Retained" 
                up={true} 
                icon={CheckCircle} 
                color="emerald" 
              />
            </section>

            <div className="glass-panel rounded-[3rem] border border-black/5 p-10 bg-white/40">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-bold theme-ink">Subscription Health & Entitlements</h3>
                  <p className="text-xs text-[var(--brand-muted)]">Live seeker entitlement telemetry across Early Access and Free tiers</p>
                </div>
                <button 
                  onClick={() => triggerExport("subscriptions")}
                  className="px-4 py-2 rounded-xl bg-black/5 hover:bg-black/10 text-xs font-bold theme-ink flex items-center gap-1.5 transition-all"
                >
                  <Download size={14} /> Export Subscriptions CSV
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <ReportList 
                  title="Subscription Health" 
                  items={stats?.finance?.subscriptionItems || []} 
                />
                <ReportList 
                  title="Renewals Due (Next 7 Days)" 
                  items={stats?.finance?.renewalsList || []} 
                />
              </div>
            </div>
          </div>
        )}

        {/* LIFECYCLE & TRADITION DISTRIBUTION TAB */}
        {activeTab === "lifecycle" && (
          <div className="space-y-8">
            <section className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <GrowthCard 
                href="/admin/users"
                label="Total Onboarded" 
                value={onboardedSeekers.toLocaleString()} 
                trend={`${completionPct}% of total`} 
                up={true} 
                icon={Users} 
                color="emerald" 
              />
              <GrowthCard 
                href="/admin/users"
                label="Streak Active Seekers" 
                value={activeStreak.toLocaleString()} 
                trend="Daily Sadhana" 
                up={true} 
                icon={RefreshCw} 
                color="blue" 
              />
              <GrowthCard 
                href="/admin/users"
                label="Banned Accounts" 
                value={(stats?.overview?.bannedSeekers ?? 0).toLocaleString()} 
                trend="Moderated" 
                up={stats?.overview?.bannedSeekers === 0} 
                icon={AlertCircle} 
                color="rose" 
              />
            </section>

            <div className="glass-panel rounded-[3rem] border border-black/5 p-10 bg-white/40">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-bold theme-ink">Tradition Distribution (Real Data)</h3>
                  <p className="text-xs text-[var(--brand-muted)]">Click on any tradition to view its seekers in the directory</p>
                </div>
                <Link 
                  href="/admin/users" 
                  className="text-xs font-bold text-[var(--premium-gold)] hover:underline"
                >
                  View Seeker Directory →
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {(stats?.traditions || []).map((t: any, i: number) => (
                  <Link 
                    key={i} 
                    href="/admin/users"
                    className="flex items-center justify-between p-5 rounded-2xl bg-black/5 hover:bg-amber-500/10 hover:border-[var(--premium-gold)]/40 border border-transparent transition-all cursor-pointer group"
                  >
                    <div>
                      <span className="font-bold theme-ink capitalize block text-sm group-hover:text-[var(--premium-gold)] transition-colors">
                        {t.label}
                      </span>
                      <span className="text-[10px] text-[var(--brand-muted)]">Active Tradition</span>
                    </div>
                    <span className="text-sm font-bold text-[var(--premium-gold)] bg-white/80 px-3 py-1 rounded-xl shadow-sm">
                      {t.val}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* DATA EXTRACTION / EXPORT TAB */}
        {activeTab === "export" && (
          <div className="space-y-8">
            <div className="glass-panel rounded-[3rem] border border-black/5 p-10 bg-white/40">
              <div className="mb-8">
                <h3 className="text-xl font-bold theme-ink">Platform Data Extraction</h3>
                <p className="text-xs text-[var(--brand-muted)]">Export verified telemetry and user audit datasets directly to CSV format</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <ExportCard 
                    title="Seeker Registry" 
                    desc="Full list of registered users with tradition, location, streak, onboarding, and auth status." 
                    onExport={() => triggerExport("seekers")}
                  />
                  <ExportCard 
                    title="Financial & Entitlements Audit" 
                    desc="Pro entitlement grants, Early Access records, and membership duration." 
                    onExport={() => triggerExport("subscriptions")}
                  />
                </div>
                <div className="space-y-6">
                  <ExportCard 
                    title="Sadhana & Practice Engagement" 
                    desc="Aggregated Mantra Japa sessions, daily check-ins, and ritual timestamps." 
                    onExport={() => triggerExport("sadhana")}
                  />
                  <ExportCard 
                    title="Content & Moderation Reports" 
                    desc="Historical moderation actions, flagged content records, and review resolutions." 
                    onExport={() => triggerExport("moderation")}
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
    <div className="p-6 rounded-[2rem] bg-black/5 border border-black/5 hover:border-[var(--premium-gold)]/30 transition-all flex items-center justify-between gap-4 group">
      <div>
        <h4 className="text-sm font-bold theme-ink">{title}</h4>
        <p className="text-[10px] text-[var(--brand-muted)] mt-1">{desc}</p>
      </div>
      <button 
        onClick={onExport}
        className="px-4 py-2 rounded-xl bg-white text-[10px] font-bold text-[var(--premium-gold)] uppercase tracking-widest shadow-sm hover:bg-[var(--premium-gold)] hover:text-white transition-all whitespace-nowrap flex items-center gap-1.5"
      >
        <Download size={13} /> Download CSV
      </button>
    </div>
  );
}

function GrowthCard({ label, value, trend, up, icon: Icon, color, href }: any) {
  const colorMap: Record<string, string> = {
    blue: "text-blue-600 bg-blue-50/70 border-blue-100",
    emerald: "text-emerald-600 bg-emerald-50/70 border-emerald-100",
    amber: "text-amber-600 bg-amber-50/70 border-amber-100",
    rose: "text-rose-600 bg-rose-50/70 border-rose-100",
  };

  const CardWrapper = href ? Link : "div";

  return (
    <CardWrapper 
      href={href || "#"} 
      className={`p-6 rounded-[2.5rem] border transition-all block ${colorMap[color] || "bg-white/40 border-black/5"} hover:shadow-md hover:scale-[1.01]`}
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--brand-muted)]">{label}</span>
        <div className="w-8 h-8 rounded-xl bg-white/80 flex items-center justify-center shadow-sm">
          <Icon size={16} />
        </div>
      </div>
      <div className="flex items-baseline justify-between">
        <h3 className="text-2xl font-bold font-serif theme-ink">{value}</h3>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/90 shadow-sm text-gray-700">
          {trend}
        </span>
      </div>
    </CardWrapper>
  );
}

function ReportList({ title, items }: { title: string; items: { label: string; val: any; href?: string }[] }) {
  return (
    <div className="space-y-4">
      <h4 className="text-sm font-bold uppercase tracking-widest text-[var(--brand-muted)]">{title}</h4>
      <div className="space-y-2">
        {items.map((item, idx) => {
          const Content = (
            <div className="flex items-center justify-between p-4 rounded-2xl bg-black/5 hover:bg-black/10 transition-colors">
              <span className="text-xs font-semibold theme-ink">{item.label}</span>
              <span className="text-xs font-bold text-[var(--premium-gold)]">{item.val}</span>
            </div>
          );

          if (item.href) {
            return (
              <Link key={idx} href={item.href} className="block">
                {Content}
              </Link>
            );
          }

          return <div key={idx}>{Content}</div>;
        })}
      </div>
    </div>
  );
}

function ReportButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="w-full p-4 rounded-2xl bg-white/80 hover:bg-white text-left flex items-center justify-between text-xs font-bold theme-ink transition-all shadow-sm group"
    >
      <span>{label}</span>
      <ChevronRight size={14} className="text-[var(--brand-muted)] group-hover:translate-x-1 transition-transform" />
    </button>
  );
}

function CronLogList({ logs }: { logs: any[] }) {
  if (!logs || logs.length === 0) {
    return <div className="text-center text-xs text-[var(--brand-muted)] py-8">No recent cron logs available.</div>;
  }

  return (
    <div className="space-y-2">
      {logs.map((log: any, i: number) => (
        <div key={log.id || i} className="p-3 rounded-xl bg-black/5 flex items-center justify-between text-xs">
          <div>
            <span className="font-bold theme-ink">{log.job_name || log.task || "System Cron"}</span>
            <span className="text-[10px] text-[var(--brand-muted)] ml-2">{new Date(log.created_at).toLocaleTimeString()}</span>
          </div>
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
            log.status === "success" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
          }`}>
            {log.status || "Completed"}
          </span>
        </div>
      ))}
    </div>
  );
}
