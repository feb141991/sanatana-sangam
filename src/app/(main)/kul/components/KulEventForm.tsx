'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

export function KulEventForm({ onClose, onSave }: { onClose: () => void; onSave: (data: any) => void }) {
  const [form, setForm] = useState({
    title: '',
    event_date: '',
    recurring: true,
    description: '',
  });

  return (
    <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-[var(--surface-soft)] rounded-[2.5rem] p-8 space-y-6 shadow-2xl border border-white/10"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold theme-ink premium-serif">Add Kul Event</h2>
          <button onClick={onClose} className="p-1 theme-muted theme-muted hover:theme-ink"><X size={20} /></button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold theme-muted ml-1">Event Title</label>
            <input
              autoFocus
              placeholder="e.g. Annual Kul Puja"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 outline-none focus:border-[var(--brand-primary)]/40 theme-ink"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
             <div className="space-y-1.5">
               <label className="text-[10px] uppercase font-bold theme-muted ml-1">Date</label>
               <input
                 type="date"
                 value={form.event_date}
                 onChange={e => setForm(f => ({ ...f, event_date: e.target.value }))}
                 className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 outline-none focus:border-[var(--brand-primary)]/40 theme-ink text-sm"
               />
             </div>
             <div className="flex items-center gap-2 px-3 pt-6">
                <input
                  type="checkbox"
                  checked={form.recurring}
                  onChange={e => setForm(f => ({ ...f, recurring: e.target.checked }))}
                  className="w-4 h-4 accent-[var(--brand-primary)]"
                />
                <span className="text-xs font-bold theme-ink">Annual</span>
             </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold theme-muted ml-1">Notes</label>
            <textarea
              placeholder="Notes or rituals…"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 outline-none focus:border-[var(--brand-primary)]/40 theme-ink resize-none"
              rows={2}
            />
          </div>
        </div>

        <button
          onClick={() => onSave(form)}
          className="w-full py-4 rounded-2xl text-white font-bold transition-all"
          style={{ background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-primary-strong))' }}
        >
          Add to Calendar 🙏
        </button>
      </motion.div>
    </div>
  );
}
