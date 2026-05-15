'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { FamilyMember } from '../types';

export function KulVanshForm({ onClose, onSave, members, editMember }: { onClose: () => void; onSave: (data: any) => void; members: FamilyMember[]; editMember?: FamilyMember | null }) {
  const [form, setForm] = useState(editMember ? { ...editMember } : {
    name: '',
    role: '',
    generation: 4,
    birth_year: null as number | null,
    is_alive: true,
    parent_id: null as string | null,
    notes: '',
  });

  return (
    <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg bg-[var(--surface-soft)] rounded-[2.5rem] p-8 space-y-6 shadow-2xl border border-white/10 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold theme-ink premium-serif">{editMember ? 'Edit Lineage' : 'Add to Lineage'}</h2>
          <button onClick={onClose} className="p-1 theme-muted hover:theme-ink"><X size={20} /></button>
        </div>

        <div className="space-y-4">
           <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <label className="text-[10px] uppercase font-bold theme-muted ml-1">Full Name</label>
                <input
                  autoFocus
                  placeholder="e.g. Pt. Ram Sharma"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 outline-none focus:border-[var(--brand-primary)]/40 theme-ink"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold theme-muted ml-1">Relationship Role</label>
                <input
                  placeholder="e.g. Great Grandfather"
                  value={form.role ?? ''}
                  onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 outline-none focus:border-[var(--brand-primary)]/40 theme-ink"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold theme-muted ml-1">Generation</label>
                <select
                  value={form.generation ?? 4}
                  onChange={e => setForm(f => ({ ...f, generation: parseInt(e.target.value) }))}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 outline-none focus:border-[var(--brand-primary)]/40 theme-ink text-sm"
                >
                  <option value={1}>Gen 1 — Great Grandparents</option>
                  <option value={2}>Gen 2 — Grandparents</option>
                  <option value={3}>Gen 3 — Parents</option>
                  <option value={4}>Gen 4 — Current</option>
                  <option value={5}>Gen 5 — Children</option>
                </select>
              </div>
           </div>

           <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold theme-muted ml-1">Birth Year</label>
                <input
                  type="number"
                  placeholder="e.g. 1945"
                  value={form.birth_year ?? ''}
                  onChange={e => setForm(f => ({ ...f, birth_year: e.target.value ? parseInt(e.target.value) : null }))}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 outline-none focus:border-[var(--brand-primary)]/40 theme-ink"
                />
              </div>
              <div className="flex items-center gap-3 pt-6 px-1">
                <input
                  type="checkbox"
                  checked={form.is_alive}
                  onChange={e => setForm(f => ({ ...f, is_alive: e.target.checked }))}
                  className="w-5 h-5 accent-[var(--brand-primary)]"
                />
                <span className="text-sm font-bold theme-ink">Currently Living</span>
              </div>
           </div>

           <div className="space-y-1.5">
             <label className="text-[10px] uppercase font-bold theme-muted ml-1">Link to Parent</label>
             <select
               value={form.parent_id ?? ''}
               onChange={e => setForm(f => ({ ...f, parent_id: e.target.value || null }))}
               className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 outline-none focus:border-[var(--brand-primary)]/40 theme-ink text-sm"
             >
               <option value="">No parent linked (Root)</option>
               {members.map(m => (
                 <option key={m.id} value={m.id}>{m.name} {m.role ? `(${m.role})` : ''}</option>
               ))}
             </select>
           </div>
        </div>

        <button
          onClick={() => onSave(form)}
          className="w-full py-4 rounded-2xl text-white font-bold shadow-xl transition-all"
          style={{ background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-primary-strong))' }}
        >
          {editMember ? 'Update Vansh 🙏' : 'Add to Vansh 🙏'}
        </button>
      </motion.div>
    </div>
  );
}
