'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  MapPin, Plus, Search, Users, 
  Settings, Globe, Shield, ArrowUpRight 
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function TirthaManagement() {
  const [mandalis, setMandalis] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMandalis() {
      try {
        const res = await fetch('/api/admin/mandalis');
        const data = await res.json();
        setMandalis(data || []);
      } catch (err) {
        toast.error('Failed to load mandalis');
      } finally {
        setLoading(false);
      }
    }
    fetchMandalis();
  }, []);

  return (
    <div className="min-h-screen bg-[var(--divine-bg)] pb-24 font-outfit">
      <div className="sticky top-0 z-50 bg-[var(--divine-bg)]/80 backdrop-blur-xl border-b border-[rgba(200,146,74,0.15)] px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
              <MapPin size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold font-serif theme-ink">Mandali Registry</h1>
              <p className="text-[10px] text-[var(--brand-muted)] uppercase tracking-[0.2em] font-bold">Community Governance</p>
            </div>
          </div>
          <button className="bg-purple-500 text-white px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 shadow-lg shadow-purple-500/20">
            <Plus size={16} /> New Mandali
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10">
        {loading ? (
          <div className="flex justify-center py-24">
            <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {mandalis.map((mandali) => (
              <motion.div
                key={mandali.id}
                className="glass-panel rounded-3xl p-6 border border-black/5 hover:border-purple-500/30 transition-all flex items-start justify-between"
              >
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-bold theme-ink">{mandali.name}</h3>
                    <p className="text-xs text-purple-500 font-bold uppercase tracking-widest mt-1">{mandali.city}, {mandali.country}</p>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-xs theme-dim">
                      <Users size={14} className="text-purple-500" />
                      <span className="font-bold">{mandali.member_count || 0} Members</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs theme-dim">
                      <Globe size={14} className="text-blue-500" />
                      <span className="font-bold">{mandali.radius_km}km Radius</span>
                    </div>
                  </div>

                  <p className="text-sm theme-dim line-clamp-2 max-w-md">
                    {mandali.description || 'A sacred spiritual community hub for local seekers to share their journey and grow together.'}
                  </p>
                </div>

                <div className="flex flex-col items-end justify-between h-full">
                  <div className="px-3 py-1 rounded-full bg-green-500/10 text-green-600 text-[8px] font-bold uppercase tracking-widest border border-green-500/20">
                    Active Hub
                  </div>
                  <button className="p-3 rounded-2xl bg-black/5 text-[var(--brand-muted)] hover:bg-purple-500/10 hover:text-purple-500 transition-all">
                    <Settings size={20} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
