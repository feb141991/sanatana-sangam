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

export function AdminTopBar({ onOpenMobileMenu, onOpenCommandPalette }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [activeAlertCount, setActiveAlertCount] = useState<number>(0);

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
        const data = await res.json();
        if (data?.alerts && isMounted) {
          const urgentCount = data.alerts.filter((a: any) => a.id !== "system-ok").length;
          setActiveAlertCount(urgentCount);
        }
      } catch {
        // silent
      }
    }
    checkAlerts();
    return () => {
      isMounted = false;
    };
  }, [pathname]);

  return (
    <header className="sticky top-0 z-30 h-14 bg-[var(--divine-bg,#FAF6EF)]/95 backdrop-blur-xl border-b border-[rgba(197,160,89,0.2)] px-4 sm:px-6 flex items-center justify-between font-outfit shadow-2xs">
      {/* Left: Mobile Menu Toggle & Dynamic Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
          aria-label="Open mobile navigation menu"
        >
          <Menu size={18} />
        </button>

        {/* Breadcrumb trail */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-gray-500 truncate">
          <Link
            href="/admin"
            className="hover:text-amber-900 transition-colors focus-visible:outline-none focus-visible:underline shrink-0"
          >
            Admin
          </Link>

          {routeMatch && routeMatch.route.id !== "overview" && (
            <>
              <ChevronRight size={12} className="text-gray-400 shrink-0" />
              <span className="text-gray-500 hidden sm:inline shrink-0">{routeMatch.groupLabel}</span>
              <ChevronRight size={12} className="text-gray-400 hidden sm:inline shrink-0" />
              <span className="font-bold theme-ink truncate">{routeMatch.route.shortTitle}</span>
            </>
          )}

          {(!routeMatch || routeMatch.route.id === "overview") && (
            <>
              <ChevronRight size={12} className="text-gray-400 shrink-0" />
              <span className="font-bold theme-ink">Overview</span>
            </>
          )}
        </nav>
      </div>

      {/* Right: Command Palette, Alerts, Settings & Logout */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Global Command Palette Trigger Button */}
        <button
          onClick={onOpenCommandPalette}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-black/10 hover:border-amber-500/50 text-xs text-gray-500 hover:text-gray-900 transition-colors shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
          title="Search administrative routes (Cmd+K / Ctrl+K)"
          aria-label="Search administrative routes (Cmd+K)"
        >
          <Search size={13} className="text-gray-400" />
          <span className="hidden md:inline text-[11px]">Search routes...</span>
          <kbd className="hidden sm:inline-block px-1.5 py-0.2 text-[9px] font-mono font-bold text-gray-400 bg-gray-100 rounded border border-gray-200">
            ⌘K
          </kbd>
        </button>

        {/* Live Active Alert Badge (Restrained, no indefinite pulse) */}
        {activeAlertCount > 0 ? (
          <Link
            href="/admin"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/15 text-rose-900 border border-rose-500/30 text-[10px] font-bold hover:bg-rose-500/25 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
            title={`${activeAlertCount} active operational alerts need attention`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
            <span>{activeAlertCount} Alert{activeAlertCount === 1 ? "" : "s"}</span>
          </Link>
        ) : (
          <div
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-800 border border-emerald-500/20 text-[10px] font-bold"
            title="All background systems operational"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Systems OK</span>
          </div>
        )}

        {/* Settings Link */}
        <Link
          href="/admin/settings"
          className="p-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-black/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
          title="Platform Settings"
          aria-label="Platform Settings"
        >
          <Settings size={16} />
        </Link>

        {/* Sign Out Button */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-500/10 text-rose-700 text-xs font-bold hover:bg-rose-500 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
          title="Sign out of Admin Session"
        >
          <LogOut size={13} />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
