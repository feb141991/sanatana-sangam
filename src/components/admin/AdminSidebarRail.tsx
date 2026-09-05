"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_NAV_GROUPS, type AdminRouteItem } from "@/lib/admin-route-registry";
import { AdminIcon } from "./AdminIcon";

interface Props {
  onItemClick?: () => void;
  className?: string;
}

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
      className={`w-64 bg-[var(--divine-bg,#FAF6EF)] border-r border-[rgba(197,160,89,0.2)] flex flex-col h-full font-outfit select-none ${className}`}
    >
      {/* Brand Header */}
      <div className="h-14 px-5 border-b border-[rgba(197,160,89,0.2)] flex items-center justify-between shrink-0 bg-white/40">
        <Link
          href="/admin"
          onClick={onItemClick}
          className="flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded-lg"
        >
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-amber-800 to-stone-900 text-amber-200 flex items-center justify-center font-serif text-xs shadow-xs font-bold">
            ☸
          </div>
          <div>
            <span className="text-xs font-serif font-bold text-gray-900 tracking-wide block leading-none">
              Shoonaya Admin
            </span>
            <span className="text-[9px] uppercase tracking-widest text-amber-800/70 font-bold block mt-0.5">
              Operations Console
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation Groups List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin scrollbar-thumb-gray-200">
        {ADMIN_NAV_GROUPS.map((group) => (
          <div key={group.id} className="space-y-1">
            {group.id !== "overview" && (
              <div className="px-3 pb-1 text-[10px] uppercase font-bold text-amber-950/60 tracking-wider">
                {group.label}
              </div>
            )}

            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = isItemActive(item);
                return (
                  <Link
                    key={item.id}
                    href={item.path}
                    onClick={onItemClick}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                      active
                        ? "bg-amber-500/15 text-amber-950 font-bold shadow-xs border border-amber-500/30"
                        : "text-gray-700 hover:text-gray-950 hover:bg-black/5"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`p-1.5 rounded-lg shrink-0 transition-colors ${
                          active ? "bg-amber-500/20 text-amber-900" : "text-gray-400 group-hover:text-gray-600"
                        }`}
                      >
                        <AdminIcon name={item.iconName} size={15} />
                      </div>
                      <span className="truncate">{item.shortTitle}</span>
                    </div>

                    {item.badge && (
                      <span className="px-1.5 py-0.2 rounded text-[8px] font-bold uppercase bg-purple-100 text-purple-800 shrink-0">
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

      {/* Sidebar Footer */}
      <div className="p-3 border-t border-[rgba(197,160,89,0.2)] text-[10px] text-gray-500 bg-white/20 shrink-0">
        <div className="flex items-center justify-between px-2">
          <span>Engine v2.4</span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Operational</span>
          </span>
        </div>
      </div>
    </aside>
  );
}
