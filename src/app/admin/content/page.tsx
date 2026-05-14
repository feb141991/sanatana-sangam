'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, Plus, Search, Filter, 
  Edit2, Trash2, CheckCircle, AlertCircle 
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function FestivalManagement() {
  const [festivals, setFestivals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    async function fetchFestivals() {
      try {
        // We'll use the existing supabase client for now if RLS allows reading festivals
        // or create an API route. Let's create an API route for consistency.
        const res = await fetch('/api/admin/festivals');
        const data = await res.json();
        setFestivals(data || []);
      } catch (err) {
        toast.error('Failed to load festivals');
      } finally {
        setLoading(false);
      }
    }
    fetchFestivals();
  }, []);

  return (
    <div className="min-h-screen bg-[var(--divine-bg)] pb-24 font-outfit">
      <div className="sticky top-0 z-50 bg-[var(--divine-bg)]/80 backdrop-blur-xl border-b border-[rgba(200,146,74,0.15)] px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <Calendar size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold font-serif theme-ink">Festival Calendar</h1>
              <p className="text-[10px] text-[var(--brand-muted)] uppercase tracking-[0.2em] font-bold">Global Content Management</p>
            </div>
          </div>
          <button className="bg-emerald-500 text-white px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20">
            <Plus size={16} /> Add Festival
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10">
        {loading ? (
          <div className="flex justify-center py-24">
            <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {festivals.map((fest) => (
              <motion.div
                key={fest.id}
                className="glass-panel rounded-3xl p-6 border border-black/5 hover:border-emerald-500/30 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="text-3xl">{fest.emoji || '🕉️'}</div>
                  <span className={`text-[8px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${fest.type === 'major' ? 'bg-amber-500/10 text-amber-600' : 'bg-blue-500/10 text-blue-600'}`}>
                    {fest.type}
                  </span>
                </div>
                <h3 className="text-lg font-bold theme-ink">{fest.name}</h3>
                <p className="text-xs text-[var(--brand-muted)] mt-1">{new Date(fest.date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                <p className="text-sm theme-dim mt-3 line-clamp-2">{fest.description}</p>
                
                <div className="mt-6 pt-6 border-t border-black/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button className="p-2 rounded-xl bg-black/5 text-[var(--brand-muted)] hover:text-emerald-500 transition-colors">
                      <Edit2 size={16} />
                    </button>
                    <button className="p-2 rounded-xl bg-black/5 text-[var(--brand-muted)] hover:text-red-500 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-1">
                    <CheckCircle size={12} /> Verified
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
