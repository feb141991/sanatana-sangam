"use client";

import { useRef, type KeyboardEvent } from "react";
import type { LucideIcon } from "lucide-react";
import { formatTabBadge, nextTabIndex, resolveActiveTabId } from "@/lib/admin-tabs";

export interface AdminTabItem<Id extends string = string> {
  id: Id;
  label: string;
  icon?: LucideIcon;
  /** A count or short word shown after the label. Only pass data that is real. */
  badge?: string | number;
  tone?: "neutral" | "warn" | "danger";
}

interface Props<Id extends string> {
  tabs: ReadonlyArray<AdminTabItem<Id>>;
  activeId: string;
  onChange: (id: Id) => void;
  /** Accessible name of the rail, e.g. "Monitoring sections". */
  label: string;
  className?: string;
  /** Prefix for the tab element ids, so two rails on one page never collide. */
  idPrefix?: string;
}

const BADGE_TONE: Record<NonNullable<AdminTabItem["tone"]>, string> = {
  neutral: "bg-black/5 text-stone-700",
  warn: "bg-amber-100 text-amber-900",
  danger: "bg-rose-100 text-rose-800",
};

/**
 * The one tab rail for the admin: a frosted segmented control with the selected tab raised.
 * Arrow keys, Home and End move between tabs (automatic activation); only the selected tab is
 * a tab stop. A status dot is deliberately not part of it: a tab shows a badge only when the
 * page has a real number to put there.
 */
export function AdminTabs<Id extends string>({
  tabs,
  activeId,
  onChange,
  label,
  className = "",
  idPrefix = "admin-tab",
}: Props<Id>) {
  const buttons = useRef<Array<HTMLButtonElement | null>>([]);
  const current = resolveActiveTabId(tabs, activeId);

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const next = nextTabIndex(index, event.key, tabs.length);
    if (next === null) return;
    event.preventDefault();
    buttons.current[next]?.focus();
    onChange(tabs[next].id);
  };

  return (
    <div role="tablist" aria-label={label} className={`admin-tabs ${className}`.trim()}>
      {tabs.map((tab, index) => {
        const selected = tab.id === current;
        const Icon = tab.icon;
        const badge = formatTabBadge(tab.badge);
        return (
          <button
            key={tab.id}
            ref={(element) => {
              buttons.current[index] = element;
            }}
            type="button"
            role="tab"
            id={`${idPrefix}-${tab.id}`}
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            className="admin-tab"
            onClick={() => onChange(tab.id)}
            onKeyDown={(event) => handleKeyDown(event, index)}
          >
            {Icon ? <Icon size={14} aria-hidden="true" /> : null}
            <span>{tab.label}</span>
            {badge ? (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none ${BADGE_TONE[tab.tone ?? "neutral"]}`}
              >
                {badge}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
