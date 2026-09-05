"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import {
  Home, Activity, Calendar, Users, Bell, Shield,
  Sparkles, Send, Settings, LogOut, AlertTriangle,
  ChevronDown, BookOpen, MapPin, Radio, ShieldCheck,
  Languages, FileText, CheckCircle2, Search, X
} from "lucide-react";

interface NavGroup {
  id: string;
  label: string;
  icon: typeof Sparkles;
  items: {
    href: string;
    label: string;
    desc: string;
    icon: typeof Sparkles;
    badge?: string;
  }[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    id: "canon",
    label: "Dharma & Canon",
    icon: Sparkles,
    items: [
      {
        href: "/admin/observance-content",
        label: "Observance Content Studio",
        desc: "Sacred stories, deity art, and festival drafts",
        icon: BookOpen,
      },
      {
        href: "/admin/calendar-governance",
        label: "Calendar Governance",
        desc: "Golden fixtures, rules & integrity findings",
        icon: Calendar,
      },
      {
        href: "/admin/dharm-veer-review",
        label: "Dharm Veer Review",
        desc: "Biography sourcing verification queue",
        icon: ShieldCheck,
      },
      {
        href: "/admin/hindi-generator",
        label: "Sacred Hindi Generator",
        desc: "Scriptural verse translation tool",
        icon: Languages,
      },
    ],
  },
  {
    id: "community",
    label: "Community & Trust",
    icon: Users,
    items: [
      {
        href: "/admin/users",
        label: "Seeker Directory & Dossiers",
        desc: "End-to-end seeker profiles & lifecycle segments",
        icon: Users,
      },
      {
        href: "/admin/tirtha",
        label: "Mandali & Tirtha Hub",
        desc: "Pilgrimage nodes and devotee chapters",
        icon: MapPin,
      },
      {
        href: "/admin/moderation",
        label: "Trust & Moderation",
        desc: "Flagged reports, AI chat guardrails & DPDP",
        icon: Shield,
      },
    ],
  },
  {
    id: "telemetry",
    label: "Telemetry & Infra",
    icon: Activity,
    items: [
      {
        href: "/admin/crons",
        label: "Cron Telemetry & Automations",
        desc: "35 background routines, logs & test runner",
        icon: Activity,
      },
      {
        href: "/admin/monitoring",
        label: "Operational Sentry & Health",
        desc: "Client crashes, AI circuit breakers & DB pool",
        icon: Radio,
      },
      {
        href: "/admin/reports",
        label: "Executive Analytics & Export",
        desc: "Retention pulse, Japa completions & CSV data",
        icon: FileText,
      },
    ],
  },
  {
    id: "broadcast",
    label: "Communications",
    icon: Bell,
    items: [
      {
        href: "/admin/notifications",
        label: "Notification Studio",
        desc: "Push copy editor & live lockscreen simulator",
        icon: Bell,
        badge: "Interactive",
      },
      {
        href: "/admin/broadcast",
        label: "Global Devotee Broadcast",
        desc: "Instant platform-wide push & SMS broadcasts",
        icon: Send,
      },
    ],
  },
];

export default function AdminNavHeader() {
  const pathname = usePathname();
  const router = useRouter();

  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [activeAlertCount, setActiveAlertCount] = useState<number>(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Hide on login page
  if (pathname === "/admin/login") return null;

  const handleLogout = () => {
    document.cookie = "admin_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    router.push("/admin/login");
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenGroup(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch alert count for live badge
  useEffect(() => {
    async function checkAlerts() {
      try {
        const res = await fetch("/api/admin/alerts");
        const data = await res.json();
        if (data?.alerts) {
          const urgentCount = data.alerts.filter((a: any) => a.id !== "system-ok").length;
          setActiveAlertCount(urgentCount);
        }
      } catch (e) {
        // silent
      }
    }
    checkAlerts();
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 bg-[var(--divine-bg,#FAF6EF)]/95 backdrop-blur-xl border-b border-[rgba(197,160,89,0.2)] shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14 gap-4" ref={dropdownRef}>
          
          {/* Brand & Home Pill */}
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/admin"
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-bold text-xs transition-all shadow-xs ${
                pathname === "/admin"
                  ? "bg-gradient-to-r from-amber-900 to-stone-900 text-white shadow-sm"
                  : "bg-black/5 hover:bg-black/10 text-gray-800"
              }`}
              title="Command Center Home"
            >
              <div className="w-4 h-4 rounded bg-amber-500/30 flex items-center justify-center text-amber-300 font-serif text-[10px]">
                ☸
              </div>
              <span>Command Center</span>
            </Link>

            <span className="text-gray-300 hidden md:inline">|</span>

            <span className="text-xs font-serif font-bold text-gray-800 hidden lg:inline tracking-wide">
              Shoonaya Ops
            </span>
          </div>

          {/* Categorized Menu Groups */}
          <nav className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none max-w-full">
            {NAV_GROUPS.map((group) => {
              const GroupIcon = group.icon;
              const isGroupActive = group.items.some(
                (item) => pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href))
              );
              const isOpen = openGroup === group.id;

              return (
                <div key={group.id} className="relative">
                  <button
                    onClick={() => setOpenGroup(isOpen ? null : group.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                      isGroupActive
                        ? "bg-amber-500/15 text-amber-950 border border-amber-500/30 font-semibold"
                        : "text-gray-600 hover:text-gray-900 hover:bg-black/5"
                    }`}
                  >
                    <GroupIcon size={13} className={isGroupActive ? "text-amber-700" : "text-gray-400"} />
                    <span>{group.label}</span>
                    <ChevronDown size={12} className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                  </button>

                  {/* Dropdown Menu */}
                  {isOpen && (
                    <div className="absolute left-0 mt-2 w-72 bg-white rounded-2xl border border-[rgba(197,160,89,0.3)] shadow-xl p-2 z-50 space-y-1 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-amber-900/60 tracking-wider border-b border-gray-100">
                        {group.label} Operations
                      </div>

                      {group.items.map((item) => {
                        const ItemIcon = item.icon;
                        const isItemActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));

                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setOpenGroup(null)}
                            className={`flex items-start gap-2.5 p-2.5 rounded-xl transition-all ${
                              isItemActive
                                ? "bg-amber-500/10 text-amber-950 font-bold"
                                : "hover:bg-gray-50 text-gray-700"
                            }`}
                          >
                            <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${isItemActive ? "bg-amber-500/20 text-amber-800" : "bg-gray-100 text-gray-500"}`}>
                              <ItemIcon size={14} />
                            </div>
                            <div className="space-y-0.5 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs leading-tight font-bold">{item.label}</span>
                                {item.badge && (
                                  <span className="px-1.5 py-0.2 rounded text-[8px] font-bold bg-purple-100 text-purple-800 uppercase">
                                    {item.badge}
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-gray-500 line-clamp-1 leading-snug">
                                {item.desc}
                              </p>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Right Header Actions: Live Health, Settings & Logout */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Live System Health Pill */}
            {activeAlertCount > 0 ? (
              <Link
                href="/admin"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/15 text-rose-700 border border-rose-500/30 text-[10px] font-bold animate-pulse hover:bg-rose-500/25 transition-all"
                title={`${activeAlertCount} active urgent alerts need attention`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                <span>{activeAlertCount} Alerts</span>
              </Link>
            ) : (
              <div 
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 text-[10px] font-bold"
                title="All background engines and calendar systems healthy"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Systems OK</span>
              </div>
            )}

            <Link
              href="/admin/settings"
              className="p-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-black/5 transition-all"
              title="Platform Settings"
            >
              <Settings size={16} />
            </Link>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-rose-500/10 text-rose-700 text-xs font-bold hover:bg-rose-500 hover:text-white transition-all"
              title="Sign out of Admin Session"
            >
              <LogOut size={13} />
              <span className="hidden md:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
