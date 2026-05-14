'use client';

import { useState, useEffect } from 'react';
import { 
  MapPin, Users, Globe, Plus, 
  Search, ArrowLeft, Filter, 
  MoreVertical, ShieldCheck, Star,
  Compass, ExternalLink, Mail,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';

export default function MandaliRegistry() {
  const [loading, setLoading] = useState(true);
  const [mandalis, setMandalis] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function fetchMandalis() {
      try {
        const res = await fetch('/api/admin/mandalis');
        const data = await res.json();
        setMandalis(data || []);
      } catch (err) {
        console.error('Failed to fetch mandalis');
      } finally {
        setLoading(false);
      }
    }
    fetchMandalis();
  }, []);

  const filtered = mandalis.filter(m => 
    m.name?.toLowerCase().includes(search.toLowerCase()) ||
    m.location?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[var(--divine-bg)] pb-24 font-outfit">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[var(--divine-bg)]/80 backdrop-blur-xl border-b border-[rgba(200,146,74,0.15)] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="p-2 rounded-xl hover:bg-black/5 text-[var(--brand-muted)] transition-all">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-xl font-bold font-serif theme-ink">Mandali Registry</h1>
              <p className="text-[10px] text-[var(--brand-muted)] uppercase tracking-[0.2em] font-bold">Community Chapters</p>
            </div>
          </div>
          <button className="bg-[var(--premium-gold)] text-white px-6 py-2 rounded-full text-xs font-bold flex items-center gap-2 shadow-lg shadow-[var(--premium-gold)]/20">
            <Plus size={16} /> New Mandali
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">
        
        {/* Search & Filter */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--brand-muted)]" size={18} />
            <input 
              type="text" 
              placeholder="Search by name, location or tradition..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/40 border border-black/5 rounded-2xl pl-12 pr-6 py-4 text-sm outline-none focus:border-[var(--premium-gold)] transition-all"
            />
          </div>
          <button className="px-6 py-4 rounded-2xl bg-white border border-black/5 flex items-center gap-2 text-xs font-bold theme-ink hover:bg-black/5 transition-all">
            <Filter size={18} /> Filter Traditions
          </button>
        </div>

        {/* Mandali Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            [...Array(6)].map((_, i) => (
              <div key={i} className="h-64 rounded-3xl bg-black/5 animate-pulse" />
            ))
          ) : filtered.length > 0 ? (
            filtered.map((mandali) => (
              <div key={mandali.id} className="glass-panel rounded-[2.5rem] border border-black/5 p-8 bg-white/40 hover:border-[var(--premium-gold)] transition-all group relative overflow-hidden">
                <div className="flex items-start justify-between mb-6">
                  <div className="p-4 rounded-2xl bg-[var(--premium-gold-soft)] text-[var(--premium-gold)]">
                    <Compass size={24} />
                  </div>
                  <button className="p-2 rounded-xl hover:bg-black/5 text-[var(--brand-muted)]">
                    <MoreVertical size={20} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-bold theme-ink">{mandali.name}</h3>
                    <p className="flex items-center gap-1.5 text-[10px] text-[var(--brand-muted)] uppercase tracking-widest font-bold mt-1">
                      <MapPin size={12} className="text-rose-500" /> {mandali.location}
                    </p>
                  </div>

                  <div className="flex items-center gap-6 py-4 border-y border-black/5">
                    <div className="text-center">
                      <p className="text-sm font-bold theme-ink">{mandali.members_count || 0}</p>
                      <p className="text-[8px] text-[var(--brand-muted)] uppercase tracking-widest font-bold">Seekers</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold theme-ink">{mandali.tradition || 'Global'}</p>
                      <p className="text-[8px] text-[var(--brand-muted)] uppercase tracking-widest font-bold">Tradition</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-green-600">Active</p>
                      <p className="text-[8px] text-[var(--brand-muted)] uppercase tracking-widest font-bold">Status</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex -space-x-2">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-slate-200" />
                      ))}
                    </div>
                    <Link 
                      href={`/admin/tirtha/${mandali.id}`}
                      className="text-[10px] font-bold text-[var(--premium-gold)] uppercase tracking-widest flex items-center gap-1 hover:underline"
                    >
                      Manage Chapter <ChevronRight size={12} />
                    </Link>
                  </div>
                </div>

                {/* Decorative Pattern */}
                <div className="absolute -right-4 -bottom-4 opacity-[0.03] text-[var(--premium-gold)] group-hover:opacity-10 transition-all">
                  <Star size={120} />
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-20 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-black/5 flex items-center justify-center mx-auto text-[var(--brand-muted)]">
                <Compass size={32} />
              </div>
              <p className="text-sm text-[var(--brand-muted)]">No mandalis found matching your search.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
