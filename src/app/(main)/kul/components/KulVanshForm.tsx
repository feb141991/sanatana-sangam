'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Users, MapPin, Calendar, Info, Baby } from 'lucide-react';
import { FamilyMember } from '../types';

const EXTENDED_ROLES = [
  { group: 'Direct', roles: ['Self', 'Spouse', 'Son', 'Daughter', 'Brother', 'Sister'] },
  { group: 'Parents', roles: ['Father', 'Mother', 'Grandfather', 'Grandmother', 'Great Grandfather', 'Great Grandmother'] },
  { group: 'Paternal Extended', roles: ['Tau Ji (Elder Uncle)', 'Tai Ji (Elder Aunt)', 'Chacha Ji (Uncle)', 'Chachi Ji (Aunt)', 'Bhua Ji (Aunt)', 'Phupha Ji (Uncle)'] },
  { group: 'Maternal Extended', roles: ['Mama Ji (Uncle)', 'Mami Ji (Aunt)', 'Mausi Ji (Aunt)', 'Mausa Ji (Uncle)'] },
];

export function KulVanshForm({ onClose, onSave, members, editMember }: { onClose: () => void; onSave: (data: any) => void; members: FamilyMember[]; editMember?: FamilyMember | null }) {
  const [form, setForm] = useState(editMember ? { ...editMember } : {
    name: '',
    role: '',
    gender: 'male' as 'male' | 'female' | 'other',
    generation: 4,
    birth_year: null as number | null,
    birth_date: null as string | null,
    birth_place: '',
    is_alive: true,
    parent_id: null as string | null,
    spouse_id: null as string | null,
    notes: '',
  });

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4" onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl bg-[#1c1c1a] rounded-[3rem] p-10 space-y-8 shadow-[0_32px_64px_rgba(0,0,0,0.5)] border border-[#C5A059]/20 max-h-[85vh] overflow-y-auto premium-scrollbar relative"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-[#F2EAD6] premium-serif">
              {editMember ? 'Refine Lineage' : 'Add to Vansh'}
            </h2>
            <p className="text-[10px] text-[#C5A059] font-black uppercase tracking-[0.3em] opacity-70">
              Building the eternal family tree
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-[#F2EAD6]/40 hover:bg-white/10 hover:text-[#F2EAD6] transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-8">
          {/* Identity Section */}
          <section className="space-y-5">
            <div className="flex items-center gap-2 mb-2">
              <Users size={14} className="text-[#C5A059]" />
              <span className="text-[10px] uppercase font-black tracking-widest text-[#C5A059]">Basic Identity</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-[#F2EAD6]/40 ml-1">Full Name</label>
                <input
                  autoFocus
                  placeholder="e.g. Pt. Ram Sharma"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 outline-none focus:border-[#C5A059]/40 text-[#F2EAD6] text-sm transition-all shadow-inner"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-[#F2EAD6]/40 ml-1">Relationship</label>
                <div className="relative">
                  <select
                    value={form.role ?? ''}
                    onChange={e => {
                      const newRole = e.target.value;
                      let newGender = form.gender;
                      if (['Mother', 'Grandmother', 'Great Grandmother', 'Aunt', 'Sister', 'Daughter', 'Tai Ji', 'Bhua Ji', 'Mami Ji', 'Mausi Ji'].some(r => newRole.includes(r))) newGender = 'female';
                      if (['Father', 'Grandfather', 'Great Grandfather', 'Uncle', 'Brother', 'Son', 'Tau Ji', 'Chacha Ji', 'Mama Ji', 'Mausa Ji'].some(r => newRole.includes(r))) newGender = 'male';
                      setForm({ ...form, role: newRole, gender: (newGender || 'male') as 'male' | 'female' | 'other' });
                    }}
                    className="w-full px-5 py-4 rounded-2xl bg-[#252522] border border-white/10 outline-none focus:border-[#C5A059]/40 text-[#F2EAD6] text-sm appearance-none shadow-inner"
                  >
                    <option value="">Select Role...</option>
                    {EXTENDED_ROLES.map(group => (
                      <optgroup key={group.group} label={group.group}>
                        {group.roles.map(r => <option key={r} value={r}>{r}</option>)}
                      </optgroup>
                    ))}
                    <option value="Custom">Other...</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Gender Toggle */}
            <div className="flex items-center gap-3 p-1">
              <span className="text-[10px] uppercase font-bold text-[#F2EAD6]/40 mr-2">Gender:</span>
              {(['male', 'female'] as const).map(g => (
                <button
                  key={g}
                  onClick={() => setForm(f => ({ ...f, gender: g }))}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                    form.gender === g ? 'bg-[#C5A059] text-black border-[#C5A059] shadow-lg shadow-[#C5A059]/20' : 'bg-white/5 border-white/10 text-[#F2EAD6]/30'
                  }`}
                >
                  {g === 'male' ? 'Shiva (M)' : 'Shakti (F)'}
                </button>
              ))}
            </div>
          </section>

          {/* Time & Place */}
          <section className="space-y-5">
            <div className="flex items-center gap-2 mb-2">
              <MapPin size={14} className="text-[#C5A059]" />
              <span className="text-[10px] uppercase font-black tracking-widest text-[#C5A059]">Origin & Life</span>
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-[#F2EAD6]/40 ml-1">Birth Date (Optional)</label>
                <input
                  type="date"
                  value={form.birth_date ?? ''}
                  onChange={e => setForm(f => ({ ...f, birth_date: e.target.value || null, birth_year: e.target.value ? new Date(e.target.value).getFullYear() : f.birth_year }))}
                  className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 outline-none focus:border-[#C5A059]/40 text-[#F2EAD6] text-sm shadow-inner"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-[#F2EAD6]/40 ml-1">Birth Year</label>
                <input
                  type="number"
                  placeholder="e.g. 1945"
                  value={form.birth_year ?? ''}
                  onChange={e => setForm(f => ({ ...f, birth_year: e.target.value ? parseInt(e.target.value) : null }))}
                  className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 outline-none focus:border-[#C5A059]/40 text-[#F2EAD6] text-sm shadow-inner"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-[#F2EAD6]/40 ml-1">Birth Place / Original Village</label>
              <input
                placeholder="e.g. Mathura, UP"
                value={form.birth_place ?? ''}
                onChange={e => setForm(f => ({ ...f, birth_place: e.target.value }))}
                className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 outline-none focus:border-[#C5A059]/40 text-[#F2EAD6] text-sm shadow-inner"
              />
              <p className="text-[9px] text-[#C5A059]/60 font-medium ml-1 flex items-center gap-1">
                <Info size={10} /> Helps in tracking roots across generations.
              </p>
            </div>

            <div className="flex items-center gap-4 p-5 rounded-3xl bg-[#C5A059]/5 border border-[#C5A059]/10">
               <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${form.is_alive ? 'bg-green-500/20 text-green-500' : 'bg-white/10 text-[#F2EAD6]/30'}`}>
                 <Baby size={20} />
               </div>
               <div className="flex-1">
                 <p className="text-[11px] font-bold text-[#F2EAD6]">Currently Living</p>
                 <p className="text-[9px] text-[#F2EAD6]/40 uppercase tracking-widest mt-0.5">Toggle status of this relative</p>
               </div>
               <button 
                 onClick={() => setForm(f => ({ ...f, is_alive: !f.is_alive }))}
                 className={`w-12 h-6 rounded-full relative transition-all duration-300 ${form.is_alive ? 'bg-green-500' : 'bg-white/10'}`}
               >
                 <motion.div 
                   animate={{ x: form.is_alive ? 26 : 4 }}
                   className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-lg"
                 />
               </button>
            </div>
          </section>

          {/* Lineage Section */}
          <section className="space-y-5">
            <div className="flex items-center gap-2 mb-2">
              <Heart size={14} className="text-[#C5A059]" />
              <span className="text-[10px] uppercase font-black tracking-widest text-[#C5A059]">Ancestral Links</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-[#F2EAD6]/40 ml-1 flex items-center justify-between">
                  Link to Parent
                  <span className="text-[8px] opacity-40">Direct Line</span>
                </label>
                <select
                  value={form.parent_id ?? ''}
                  onChange={e => setForm(f => ({ ...f, parent_id: e.target.value || null }))}
                  className="w-full px-5 py-4 rounded-2xl bg-[#252522] border border-white/10 outline-none focus:border-[#C5A059]/40 text-[#F2EAD6] text-sm appearance-none shadow-inner"
                >
                  <option value="">No parent linked (Root)</option>
                  {members.filter(m => m.id !== editMember?.id).map(m => (
                    <option key={m.id} value={m.id}>{m.name} {m.role ? `(${m.role})` : ''}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-[#F2EAD6]/40 ml-1 flex items-center justify-between">
                  Link to Spouse
                  <span className="text-[8px] opacity-40">Extended Family</span>
                </label>
                <select
                  value={form.spouse_id ?? ''}
                  onChange={e => setForm(f => ({ ...f, spouse_id: e.target.value || null }))}
                  className="w-full px-5 py-4 rounded-2xl bg-[#252522] border border-white/10 outline-none focus:border-[#C5A059]/40 text-[#F2EAD6] text-sm appearance-none shadow-inner"
                >
                  <option value="">No spouse linked</option>
                  {members.filter(m => m.id !== editMember?.id && m.gender !== form.gender).map(m => (
                    <option key={m.id} value={m.id}>{m.name} {m.role ? `(${m.role})` : ''}</option>
                  ))}
                </select>
              </div>
            </div>
          </section>
        </div>

        <div className="pt-4 sticky bottom-0 bg-[#1c1c1a]/80 backdrop-blur-md -mx-1">
          <button
            onClick={() => onSave(form)}
            disabled={!form.name || !form.role}
            className="w-full py-5 rounded-[2rem] text-black font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl transition-all active:scale-95 disabled:opacity-30 disabled:grayscale"
            style={{ background: 'linear-gradient(135deg, #C5A059, #d4ae6a)' }}
          >
            {editMember ? 'Update Vansh 🙏' : 'Enter into Vansh 🙏'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
