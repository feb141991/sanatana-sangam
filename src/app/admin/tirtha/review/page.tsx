'use client';

import { useState, useEffect } from 'react';
import { 
  ArrowLeft, MapPin, Users, ShieldCheck, AlertTriangle
} from 'lucide-react';
import Link from 'next/link';

type ReviewData = {
  id: string;
  name: string;
  city: string;
  country: string;
  member_count: number;
  true_profile_count: number;
  created_at: string;
  latitude: number | null;
  longitude: number | null;
  canonical_city: string;
  canonical_country: string;
  is_drifted: boolean;
};

export default function MandaliReview() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ReviewData[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/admin/mandalis/review');
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json?.error || 'Failed to fetch review data');
        }
        setData(Array.isArray(json) ? json : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch review data');
        setData([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-[var(--divine-bg)] pb-24 font-outfit">
      <div className="sticky top-0 z-50 bg-[var(--divine-bg)]/80 backdrop-blur-xl border-b border-[rgba(197, 160, 89,0.15)] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/tirtha" className="p-2 rounded-xl hover:bg-black/5 text-[var(--brand-muted)] transition-all">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-xl font-bold font-serif theme-ink">Mandali Review</h1>
              <p className="text-[10px] text-[var(--brand-muted)] uppercase tracking-[0.2em] font-bold">Integrity & Quality Audit</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">
        <div className="glass-panel rounded-[2rem] border border-black/5 overflow-hidden bg-white/40">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-black/5 theme-ink text-xs uppercase tracking-wider font-bold">
                <tr>
                  <th className="px-6 py-4 rounded-tl-[2rem]">Mandali</th>
                  <th className="px-6 py-4">Members</th>
                  <th className="px-6 py-4">Coordinates</th>
                  <th className="px-6 py-4">Location Drift</th>
                  <th className="px-6 py-4 rounded-tr-[2rem]">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-[var(--brand-muted)]">Loading review data...</td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-rose-500">{error}</td>
                  </tr>
                ) : data.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-[var(--brand-muted)]">No mandalis require review right now.</td>
                  </tr>
                ) : (
                  data.map((m) => (
                    <tr key={m.id} className="hover:bg-black/5 transition-all theme-ink">
                      <td className="px-6 py-4">
                        <p className="font-bold">{m.name}</p>
                        <p className="text-xs text-[var(--brand-muted)] mt-1">{m.id.split('-')[0]}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Users size={14} className="text-[var(--brand-muted)]" />
                          <span className={m.member_count <= 1 ? 'text-amber-600 font-bold' : ''}>
                            {m.member_count} 
                            {m.member_count !== m.true_profile_count && (
                              <span className="text-rose-500 ml-1" title={`Profiles table has ${m.true_profile_count}`}>
                                (True: {m.true_profile_count})
                              </span>
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <MapPin size={14} className="text-[var(--brand-muted)]" />
                          {m.latitude === 0 || m.latitude == null ? (
                            <span className="text-rose-500 font-bold flex items-center gap-1">
                              <AlertTriangle size={12} /> Missing (0,0)
                            </span>
                          ) : (
                            <span className="text-xs">{m.latitude?.toFixed(4)}, {m.longitude?.toFixed(4)}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {m.is_drifted ? (
                          <div className="space-y-1">
                            <p className="text-rose-500 font-bold text-xs flex items-center gap-1">
                              <AlertTriangle size={12} /> Stored: {m.city}, {m.country}
                            </p>
                            <p className="text-[var(--brand-muted)] text-xs">
                              Resolved: {m.canonical_city}, {m.canonical_country}
                            </p>
                          </div>
                        ) : (
                          <p className="text-emerald-600 font-bold flex items-center gap-1 text-xs">
                            <ShieldCheck size={12} /> Aligned
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-[var(--brand-muted)] text-xs">
                        {new Date(m.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
