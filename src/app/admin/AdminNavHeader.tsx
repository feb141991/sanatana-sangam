"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, Activity, Calendar, Users, Bell, Shield,
  Sparkles, Layers, Send, ChevronRight, RefreshCw, AlertCircle
} from "lucide-react";

const NAV_LINKS = [
  { href: "/admin", label: "Command Center", icon: Home },
  { href: "/admin/crons", label: "Cron Telemetry", icon: Activity },
  { href: "/admin/observance-content", label: "Observance Studio", icon: Sparkles },
  { href: "/admin/users", label: "Seekers", icon: Users },
  { href: "/admin/monitoring", label: "Operational Monitoring", icon: Bell },
  { href: "/admin/calendar-governance", label: "Calendar Governance", icon: Calendar },
  { href: "/admin/moderation", label: "Moderation", icon: Shield },
  { href: "/admin/notifications", label: "Notification Studio", icon: Bell },
  { href: "/admin/broadcast", label: "Broadcast", icon: Send },
];

export default function AdminNavHeader() {
  const pathname = usePathname();

  // Hide on login page
  if (pathname === "/admin/login") return null;

  return (
    <header className="sticky top-0 z-50 bg-[var(--divine-bg,#FAF6EF)]/95 backdrop-blur-xl border-b border-[rgba(197,160,89,0.2)] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14 gap-4">
          {/* Brand & Home Button */}
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/admin"
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-900 text-white font-bold text-xs hover:bg-amber-800 transition-all shadow-sm"
              title="Return to Command Center Home"
            >
              <Home size={14} className="text-amber-300" />
              <span>Command Center</span>
            </Link>

            <span className="text-gray-300 hidden sm:inline">|</span>

            <span className="text-xs font-serif font-bold text-gray-800 hidden md:inline">
              Shoonaya Ops
            </span>
          </div>

          {/* Quick Sub-Navigation Pills */}
          <nav className="flex items-center gap-1 overflow-x-auto py-1 scrollbar-none max-w-full">
            {NAV_LINKS.slice(1).map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || (link.href !== "/admin" && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={"flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all " + (
                    isActive
                      ? "bg-amber-500/15 text-amber-900 border border-amber-500/30"
                      : "text-gray-600 hover:text-gray-900 hover:bg-black/5"
                  )}
                >
                  <Icon size={13} className={isActive ? "text-amber-700" : "text-gray-400"} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
