'use client';

import { motion } from 'framer-motion';
import { ChevronRight, Info } from 'lucide-react';

const SANSKARAS = [
  { id: 'garbhadhana', name: 'Garbhadhana', description: 'Conception — The sacred rite of bringing life.', status: 'upcoming' },
  { id: 'pumsavana', name: 'Pumsavana', description: 'Quickening of the fetus — To ensure the health of the unborn.', status: 'upcoming' },
  { id: 'simantonnayana', name: 'Simantonnayana', description: 'Parting the hair — Protecting the mother and child.', status: 'upcoming' },
  { id: 'jatakarma', name: 'Jatakarma', description: 'Birth rites — Welcoming the newcomer to the lineage.', status: 'upcoming' },
  { id: 'namakarana', name: 'Namakarana', description: 'Naming ceremony — Assigning the sacred identity.', status: 'upcoming' },
  { id: 'nishkramana', name: 'Nishkramana', description: 'First outing — The child meets the sun and world.', status: 'upcoming' },
  { id: 'annaprashana', name: 'Annaprashana', description: 'First solid food — Feeding the divine fire within.', status: 'upcoming' },
  { id: 'chudakarana', name: 'Chudakarana', description: 'Tonsure — The first hair cut, a sign of purity.', status: 'upcoming' },
  { id: 'karnavedha', name: 'Karnavedha', description: 'Ear piercing — Opening the gates of wisdom.', status: 'upcoming' },
  { id: 'vidyarambha', name: 'Vidyarambha', description: 'Beginning of knowledge — The first lesson.', status: 'upcoming' },
  { id: 'upanayana', name: 'Upanayana', description: 'Sacred thread — Entry into the world of study.', status: 'upcoming' },
  { id: 'vedarambha', name: 'Vedarambha', description: 'Beginning of Vedas — The deeper dive into dharma.', status: 'upcoming' },
  { id: 'keshanta', name: 'Keshanta', description: 'First shave — Transition into youth.', status: 'upcoming' },
  { id: 'samavartana', name: 'Samavartana', description: 'Graduation — Returning from the guru after study.', status: 'upcoming' },
  { id: 'vivaha', name: 'Vivaha', description: 'Marriage — Entry into the householder stage.', status: 'upcoming' },
  { id: 'antyesti', name: 'Antyesti', description: 'Funeral rites — The final sacrifice to the fire.', status: 'upcoming' },
];

export function KulSanskara() {
  return (
    <div className="space-y-8">
      <div className="relative clay-card rounded-[2.5rem] p-8 overflow-hidden bg-gradient-to-br from-orange-50 to-orange-100/50">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-400 opacity-10 blur-[80px]" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-inner bg-white/40 border border-white/60">
              🪬
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-orange-800/60">
                Shodasha Sanskaras
              </p>
              <h3 className="font-display text-2xl font-bold theme-ink mt-1 premium-serif">The 16 Sacred Rites</h3>
            </div>
          </div>
          
          <p className="text-sm theme-muted leading-relaxed max-w-xl italic">
            &ldquo;From conception to liberation, the Sanskaras are the sacred transitions that refine the human soul and align it with Dharma.&rdquo;
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {SANSKARAS.map((s, idx) => (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.05 }}
            className="group glass-panel rounded-[2rem] p-5 flex items-center gap-5 border border-white/5 hover:border-white/10 transition-all shadow-sm"
          >
             <div className="w-10 h-10 rounded-xl bg-orange-100/50 flex items-center justify-center text-orange-800 font-bold text-sm shadow-inner flex-shrink-0">
               {idx + 1}
             </div>
             
             <div className="flex-1 min-w-0">
               <h4 className="font-bold theme-ink premium-serif">{s.name}</h4>
               <p className="text-[11px] theme-muted mt-1 leading-relaxed line-clamp-1">
                 {s.description}
               </p>
             </div>

             <div className="p-2 rounded-full hover:bg-black/5 transition-colors text-orange-800/40 hover:text-orange-800 cursor-help">
               <Info size={16} />
             </div>
          </motion.div>
        ))}
      </div>
      
      <div className="p-8 text-center glass-panel rounded-[2.5rem] border border-dashed border-black/5">
         <p className="text-xs theme-muted italic">Tracking feature for family Sanskaras coming soon in the next update.</p>
      </div>
    </div>
  );
}
