'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { MemberRow } from '../types';

export function KulTaskForm({ onClose, onSave, members }: { onClose: () => void; onSave: (task: any) => void; members: MemberRow[] }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    task_type: 'read',
    assigned_to: '',
    due_date: '',
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
          <h2 className="text-xl font-bold theme-ink premium-serif">Assign Task</h2>
          <button onClick={onClose} className="p-1 theme-muted hover:theme-ink"><X size={20} /></button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold theme-muted ml-1">Task Title</label>
            <input
              autoFocus
              placeholder="e.g. Read Bhagavad Gita Ch 1"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 outline-none focus:border-[var(--brand-primary)]/40 theme-ink"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold theme-muted ml-1">Description</label>
            <textarea
              placeholder="Details or instructions…"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 outline-none focus:border-[var(--brand-primary)]/40 theme-ink resize-none"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
             <div className="space-y-1.5">
               <label className="text-[10px] uppercase font-bold theme-muted ml-1">Assigned To</label>
               <select
                 value={form.assigned_to}
                 onChange={e => setForm(f => ({ ...f, assigned_to: e.target.value }))}
                 className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 outline-none focus:border-[var(--brand-primary)]/40 theme-ink text-sm"
               >
                 <option value="">All Members</option>
                 {members.map(m => (
                   <option key={m.user_id} value={m.user_id}>{m.profiles?.full_name || m.profiles?.username}</option>
                 ))}
               </select>
             </div>
             <div className="space-y-1.5">
               <label className="text-[10px] uppercase font-bold theme-muted ml-1">Due Date</label>
               <input
                 type="date"
                 value={form.due_date}
                 onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
                 className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 outline-none focus:border-[var(--brand-primary)]/40 theme-ink text-sm"
               />
             </div>
          </div>
        </div>

        <button
          onClick={() => onSave(form)}
          className="w-full py-4 rounded-2xl text-white font-bold transition-all"
          style={{ background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-primary-strong))' }}
        >
          Assign to Kul 🙏
        </button>
      </motion.div>
    </div>
  );
}
