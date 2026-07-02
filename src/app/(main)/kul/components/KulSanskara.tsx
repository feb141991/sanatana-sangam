'use client';

import { motion } from 'framer-motion';
import { ChevronRight, Info } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export function KulSanskara() {
  const { t } = useLanguage();
  
  const SANSKARAS = [
    { id: 's1', name: t('s1'), description: t('s1d') },
    { id: 's2', name: t('s2'), description: t('s2d') },
    { id: 's3', name: t('s3'), description: t('s3d') },
    { id: 's4', name: t('s4'), description: t('s4d') },
    { id: 's5', name: t('s5'), description: t('s5d') },
    { id: 's6', name: t('s6'), description: t('s6d') },
    { id: 's7', name: t('s7'), description: t('s7d') },
    { id: 's8', name: t('s8'), description: t('s8d') },
    { id: 's9', name: t('s9'), description: t('s9d') },
    { id: 's10', name: t('s10'), description: t('s10d') },
    { id: 's11', name: t('s11'), description: t('s11d') },
    { id: 's12', name: t('s12'), description: t('s12d') },
    { id: 's13', name: t('s13'), description: t('s13d') },
    { id: 's14', name: t('s14'), description: t('s14d') },
    { id: 's15', name: t('s15'), description: t('s15d') },
    { id: 's16', name: t('s16'), description: t('s16d') },
  ];

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
                {t('kulSanskaraSubtitle')}
              </p>
              <h3 className="font-display text-2xl font-bold theme-ink mt-1 premium-serif">{t('kulSanskaraTitle')}</h3>
            </div>
          </div>
          
          <p className="text-sm theme-muted leading-relaxed max-w-xl italic">
            &ldquo;{t('kulSanskaraQuote')}&rdquo;
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
         <p className="text-xs theme-muted italic">{t('kulComingSoon')}</p>
      </div>
    </div>
  );
}
