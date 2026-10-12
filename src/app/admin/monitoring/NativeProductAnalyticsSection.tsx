"use client";

import { useCallback, useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';

type Row = { event_name: string; event_date: string; opted_in_accounts: number };

export default function NativeProductAnalyticsSection() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/native-product-analytics?days=28', { cache: 'no-store' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Could not load product analytics.');
      setRows(Array.isArray(payload.rows) ? payload.rows : []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load product analytics.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  return (
    <section className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-bold text-sm text-gray-900">Native Product Measurement</h3>
          <p className="mt-1 max-w-3xl text-xs leading-5 text-gray-500">
            Daily account counts from explicitly opted-in users. Cells below 20 accounts are suppressed;
            no user-level records, routes, content, mood, tradition, or location are shown here.
          </p>
        </div>
        <button onClick={() => void refresh()} disabled={loading} aria-label="Refresh product analytics"
          className="rounded-lg border px-3 py-2 text-xs font-semibold text-gray-700 disabled:opacity-50">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {error ? <p role="alert" className="text-sm text-red-700">{error}</p> : null}
      {!error && !loading && rows.length === 0 ? (
        <p className="rounded-xl bg-gray-50 p-4 text-sm text-gray-600">
          No reportable cohort yet. Counts are hidden until an event/day reaches 20 opted-in accounts.
        </p>
      ) : null}
      {rows.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b text-xs uppercase tracking-wide text-gray-500">
              <tr><th className="py-2 pr-4">UTC day</th><th className="py-2 pr-4">Event</th><th className="py-2 text-right">Accounts</th></tr>
            </thead>
            <tbody>
              {rows.map((row) => <tr key={`${row.event_date}:${row.event_name}`} className="border-b last:border-0">
                <td className="py-2 pr-4 tabular-nums">{row.event_date}</td>
                <td className="py-2 pr-4 font-mono text-xs">{row.event_name}</td>
                <td className="py-2 text-right tabular-nums">{row.opted_in_accounts}</td>
              </tr>)}
            </tbody>
          </table>
        </div>
      ) : null}
      <p className="text-[11px] text-gray-400">28-day window · 90-day retention · account-linked opt-in data · small cohorts suppressed</p>
    </section>
  );
}
