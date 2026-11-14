"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_NAV_GROUPS, type AdminRouteItem } from "@/lib/admin-route-registry";
import { AdminIcon } from "./AdminIcon";

interface Props {
  onItemClick?: () => void;
  className?: string;
}

const FOCUS_RING = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300";

/** The admin navigation, as a frosted dark rail: brand, then the groups of the route registry. */
export function AdminSidebarRail({ onItemClick, className = "" }: Props) {
  const pathname = usePathname();

  const isItemActive = (item: AdminRouteItem) => {
    if (!pathname) return false;
    if (item.exact) {
      return pathname === item.path;
    }
    return pathname === item.path || pathname.startsWith(`${item.path}/`);
  };

  return (
    <aside
      aria-label="Admin Navigation Sidebar"
      className={`glass-rail admin-dark w-64 flex flex-col h-full font-outfit select-none ${className}`}
    >
      {/* Brand Header */}
      <div className="h-14 px-5 border-b border-white/10 flex items-center justify-between shrink-0">
        <Link href="/admin" onClick={onItemClick} className={`flex items-center gap-2.5 rounded-lg ${FOCUS_RING}`}>
          <div className="w-7 h-7 rounded-lg bg-white/90 text-stone-900 flex items-center justify-center font-serif text-xs font-bold shadow-sm" aria-hidden="true">
            ☸
          </div>
          <div>
            <span className="text-base font-serif font-bold text-[var(--text-primary)] tracking-wide block leading-none">Shoonaya</span>
            <span className="glass-mono text-[9px] text-[var(--text-secondary)] block mt-1">Operations Console</span>
          </div>
        </Link>
      </div>

      {/* Navigation Groups List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {ADMIN_NAV_GROUPS.map((group) => (
          <div key={group.id} className="space-y-1">
            {group.id !== "overview" && (
              <div className="glass-mono px-3 pb-1 text-[10px] text-[var(--text-secondary)]">{group.label}</div>
            )}

            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = isItemActive(item);
                return (
                  <Link
                    key={item.id}
                    href={item.path}
                    onClick={onItemClick}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${FOCUS_RING} ${
                      active
                        ? "bg-white/[0.16] text-white font-bold shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]"
                        : "text-white/75 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`p-1.5 rounded-lg shrink-0 ${active ? "text-white" : "text-white/60"}`}>
                        <AdminIcon name={item.iconName} size={15} />
                      </div>
                      <span className="truncate">{item.shortTitle}</span>
                    </div>

                    {item.badge && (
                      <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase bg-white/15 text-white shrink-0">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
