"use client";

import { useMemo, useState } from "react";
import type { JournalSectionTable as JournalSectionTableData } from "@/config/journal";

export function JournalSectionTable({ table }: { table: JournalSectionTableData }) {
  const [selectedFilter, setSelectedFilter] = useState<string>("All");

  const filterValues = useMemo(() => {
    if (table.filterColumnIndex === undefined) return [];
    const idx = table.filterColumnIndex;
    const unique = new Set<string>();
    for (const row of table.rows) {
      const cell = row[idx]?.trim();
      if (cell) unique.add(cell);
    }
    return unique.size > 1 ? ["All", ...Array.from(unique)] : [];
  }, [table.filterColumnIndex, table.rows]);

  const visibleRows = useMemo(() => {
    if (selectedFilter === "All" || table.filterColumnIndex === undefined) {
      return table.rows;
    }
    const idx = table.filterColumnIndex;
    return table.rows.filter((row) => row[idx]?.trim() === selectedFilter);
  }, [selectedFilter, table.filterColumnIndex, table.rows]);

  return (
    <div className="my-6 space-y-3">
      {filterValues.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter table rows">
          {filterValues.map((val) => {
            const active = selectedFilter === val;
            return (
              <button
                key={val}
                type="button"
                onClick={() => setSelectedFilter(val)}
                aria-pressed={active}
                className={`min-h-9 rounded-full border px-3.5 py-1 text-xs font-semibold transition-colors ${
                  active
                    ? "border-[var(--brand-primary)] bg-[var(--brand-primary-soft)] text-[var(--brand-primary-strong)]"
                    : "border-[var(--card-border)] bg-[var(--surface-soft)] text-[var(--text-muted-warm)] hover:border-[var(--brand-primary)]/40 hover:text-[var(--text-cream)]"
                }`}
              >
                {val}
              </button>
            );
          })}
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] shadow-[var(--shadow-soft)]">
        <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
          {table.caption && <caption className="sr-only">{table.caption}</caption>}
          <thead>
            <tr className="border-b border-[var(--card-border)] bg-[var(--surface-soft)]">
              {table.columns.map((col, idx) => (
                <th
                  key={idx}
                  scope="col"
                  className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-[var(--text-dim)]"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--card-border)]/50">
            {visibleRows.map((row, rIdx) => (
              <tr key={rIdx} className="transition-colors hover:bg-[var(--surface-soft)]/60">
                {row.map((cell, cIdx) => (
                  <td
                    key={cIdx}
                    className={`px-4 py-3 align-top leading-snug ${
                      cIdx === 0
                        ? "whitespace-nowrap font-semibold text-[var(--text-cream)]"
                        : cIdx === 1
                          ? "font-medium text-[var(--brand-primary-strong)]"
                          : "text-[var(--text-muted-warm)]"
                    }`}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
