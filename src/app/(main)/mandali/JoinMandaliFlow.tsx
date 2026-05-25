import { useState } from 'react';
import { createClient } from '@/lib/supabase';
import toast from 'react-hot-toast';

type Props = { userId: string };

export default function JoinMandaliFlow({ userId }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [joiningId, setJoiningId] = useState<string | null>(null);

  async function searchMandalis() {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('mandalis')
        .select('id, name, city, member_count')
        .ilike('city', `%${query.trim()}%`)
        .limit(10);
      if (error) throw error;
      setResults(data ?? []);
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to search mandalis');
    } finally {
      setLoading(false);
    }
  }

  async function joinMandali(mandaliId: string) {
    setJoiningId(mandaliId);
    try {
      const res = await fetch('/api/mandali/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mandali_id: mandaliId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Join failed');
      toast.success('Joined mandali!');
      // Simple reload to refresh data
      window.location.reload();
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to join mandali');
    } finally {
      setJoiningId(null);
    }
  }

  return (
    <div className="glass-panel rounded-2xl border border-white/10 p-5 max-w-sm mx-auto space-y-4" style={{ background: 'var(--brand-primary-soft)' }}>
      <h2 className="font-display font-bold text-lg" style={{ color: 'var(--text-cream)' }}>You haven't joined a Mandali yet</h2>
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Find your city"
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="flex-1 surface-input pl-3 pr-2 py-2 rounded-xl outline-none"
        />
        <button
          onClick={searchMandalis}
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-brand-primary text-white font-semibold"
        >
          {loading ? 'Searching…' : 'Search'}
        </button>
      </div>
      {results.length > 0 && (
        <ul className="space-y-2">
          {results.map(m => (
            <li key={m.id} className="flex justify-between items-center">
              <span>{m.city} ({m.member_count})</span>
              <button
                onClick={() => joinMandali(m.id)}
                disabled={joiningId === m.id}
                className="px-3 py-1 rounded bg-brand-primary text-white text-sm"
              >
                {joiningId === m.id ? 'Joining…' : 'Join'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
