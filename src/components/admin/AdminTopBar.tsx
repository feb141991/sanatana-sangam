"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Menu,
  Search,
  Settings,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { getAdminRouteByPath } from "@/lib/admin-route-registry";

interface Props {
  onOpenMobileMenu: () => void;
  onOpenCommandPalette: () => void;
}

export type AdminSystemStatusState =
  | { status: "loading" }
  | { status: "healthy" }
  | { status: "alerts"; count: number }
  | { status: "degraded"; reason?: string };

export function AdminTopBar({ onOpenMobileMenu, onOpenCommandPalette }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [systemStatus, setSystemStatus] = useState<AdminSystemStatusState>({ status: "loading" });

  const routeMatch = getAdminRouteByPath(pathname);

  const handleLogout = () => {
    document.cookie = "admin_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    router.push("/admin/login");
  };

  useEffect(() => {
    let isMounted = true;
    async function checkAlerts() {
      try {
        const res = await fetch("/api/admin/alerts");
        if (!res.ok) {
          if (isMounted) {
            setSystemStatus({ status: "degraded", reason: `HTTP ${res.status}` });
          }
          return;
        }
        const data = await res.json();
        if (!isMounted) return;

        if (data && Array.isArray(data.alerts)) {
          const urgentAlerts = data.alerts.filter((a: any) => a.id !== "system-ok");
          if (urgentAlerts.length > 0) {
            setSystemStatus({ status: "alerts", count: urgentAlerts.length });
          } else {
            setSystemStatus({ status: "healthy" });
          }
        } else {
          setSystemStatus({ status: "degraded", reason: "Invalid response format" });
        }
      } catch {
        if (isMounted) {
          setSystemStatus({ status: "degraded", reason: "Alerts endpoint unreachable" });
        }
      }
    }
    checkAlerts();
    return () => {
      isMounted = false;
    };
  }, [pathname]);

  return (
    <header className="glass-bar sticky top-0 z-30 h-14 px-4 sm:px-6 flex items-center justify-between font-outfit">
      {/* Left: Mobile Menu Toggle & Dynamic Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
          aria-label="Open mobile navigation menu"
        >
          <Menu size={18} />
        </button>

        {/* Breadcrumb trail */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] truncate">
          <Link
            href="/admin"
            className="hover:text-white transition-colors focus-visible:outline-none focus-visible:underline shrink-0"
          >
            Admin
          </Link>

          {routeMatch && routeMatch.route.id !== "overview" && (
            <>
              <ChevronRight size={12} className="text-white/40 shrink-0" />
              <span className="hidden sm:inline shrink-0">{routeMatch.groupLabel}</span>
              <ChevronRight size={12} className="text-white/40 hidden sm:inline shrink-0" />
              <span className="font-bold text-[var(--text-primary)] truncate">{routeMatch.route.shortTitle}</span>
            </>
          )}

          {(!routeMatch || routeMatch.route.id === "overview") && (
            <>
              <ChevronRight size={12} className="text-white/40 shrink-0" />
              <span className="font-bold text-[var(--text-primary)]">Overview</span>
            </>
          )}
        </nav>
      </div>

      {/* Right: Command Palette, Alerts, Settings & Logout */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Global Command Palette Trigger Button */}
        <button
          onClick={onOpenCommandPalette}
          className="glass-tool flex items-center gap-2 px-3 py-1.5 border border-white/20 text-xs text-white/80 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
          title="Search administrative routes (Cmd+K / Ctrl+K)"
          aria-label="Search administrative routes (Cmd+K)"
        >
          <Search size={13} className="text-white/60" />
          <span className="hidden md:inline text-[11px]">Search routes...</span>
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-mono font-bold text-white/70 bg-white/10 rounded border border-white/20">
            ⌘K
          </kbd>
        </button>

        {/* Live Active Alert Badge (Resilient 3-state: loading | healthy | alerts | degraded) */}
        {systemStatus.status === "loading" ? (
          <div
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 text-white/70 border border-white/20 text-[10px] font-medium"
            title="Checking operational system health..."
          >
            <span className="w-1.5 h-1.5 rounded-full bg-white/50" />
            <span>Checking...</span>
          </div>
        ) : systemStatus.status === "alerts" ? (
          <Link
            href="/admin"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-400/20 text-rose-100 border border-rose-300/40 text-[10px] font-bold hover:bg-rose-400/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
            title={`${systemStatus.count} active operational alert${systemStatus.count === 1 ? "" : "s"} need attention`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            <span>{systemStatus.count} Alert{systemStatus.count === 1 ? "" : "s"}</span>
          </Link>
        ) : systemStatus.status === "healthy" ? (
          <div
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-400/15 text-emerald-100 border border-emerald-300/30 text-[10px] font-bold"
            title="All background systems operational"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Systems OK</span>
          </div>
        ) : (
          <Link
            href="/admin/monitoring"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-400/20 text-amber-100 border border-amber-300/40 text-[10px] font-bold hover:bg-amber-400/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
            title="Operational status check degraded or unavailable"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>Status Degraded</span>
          </Link>
        )}

        {/* Settings Link */}
        <Link
          href="/admin/settings"
          className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
          title="Platform Settings"
          aria-label="Platform Settings"
        >
          <Settings size={16} />
        </Link>

        {/* Sign Out Button */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-400/15 text-rose-100 text-xs font-bold hover:bg-rose-500 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
          title="Sign out of Admin Session"
        >
          <LogOut size={13} />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
