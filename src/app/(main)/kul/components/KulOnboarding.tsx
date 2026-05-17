'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Check } from 'lucide-react';
import SacredIcon, { SacredIconName } from '@/components/ui/SacredIcon';

const STEPS: Array<{
  title: string;
  subtitle: string;
  description: string;
  icon: SacredIconName;
  color: string;
}> = [
  {
    title: 'Welcome to your Kul',
    subtitle: 'Sacred Lineage',
    description: 'This is a private space for your family. Here you can track your lineage, share tasks, and keep the sacred fire of your traditions alive.',
    icon: 'tree',
    color: 'var(--brand-primary)',
  },
  {
    title: 'Track Your Vansh',
    subtitle: 'Family Tree',
    description: 'Build your family tree from the roots up. Connect with your ancestors and preserve their stories for generations to come.',
    icon: 'kul',
    color: '#a07830',
  },
  {
    title: 'Shared Sadhana',
    subtitle: 'Kul Tasks',
    description: 'Assign and complete daily commitments together. Every shared practice strengthens the collective spirit of your family.',
    icon: 'activity',
    color: '#c3522d',
  },
  {
    title: 'Stay Connected',
    subtitle: 'Kul Sabha',
    description: 'A dedicated, distraction-free space for family conversations. No ads, no noise—just pure connection.',
    icon: 'mandali',
    color: '#164d54',
  }
];

export function KulOnboarding({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);

  const next = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
    else onComplete();
  };

  const prev = () => {
    if (step > 0) setStep(step - 1);
  };

  const current = STEPS[step];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md clay-card rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl border border-white/10"
      >
        <div className="relative h-48 flex items-center justify-center overflow-hidden bg-gradient-to-br from-white/5 to-white/0">
           <div 
             className="absolute inset-0 opacity-10 blur-3xl"
             style={{ background: current.color }}
           />
           <AnimatePresence mode="wait">
             <motion.div
               key={step}
               initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
               animate={{ opacity: 1, scale: 1, rotate: 0 }}
               exit={{ opacity: 0, scale: 1.5, rotate: 10 }}
               className="z-10 flex h-24 w-24 items-center justify-center rounded-[2rem] border shadow-lg"
               style={{ background: `${current.color}18`, borderColor: `${current.color}40`, color: current.color }}
             >
               <SacredIcon name={current.icon} size={42} strokeWidth={1.55} />
             </motion.div>
           </AnimatePresence>
           
           <button 
             onClick={onComplete}
             className="absolute top-6 right-6 w-8 h-8 rounded-full bg-black/20 flex items-center justify-center text-white/60 hover:text-white transition-colors"
           >
             <X size={16} />
           </button>
        </div>

        <div className="p-8 space-y-6">
          <div className="space-y-2 text-center">
             <motion.p 
               key={`subtitle-${step}`}
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               className="text-[10px] font-bold uppercase tracking-[0.3em]"
               style={{ color: current.color }}
             >
               {current.subtitle}
             </motion.p>
             <motion.h2 
               key={`title-${step}`}
               initial={{ opacity: 0, y: 5 }}
               animate={{ opacity: 1, y: 0 }}
               className="text-2xl font-bold theme-ink premium-serif"
             >
               {current.title}
             </motion.h2>
             <motion.p 
               key={`desc-${step}`}
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               className="text-sm theme-muted leading-relaxed"
             >
               {current.description}
             </motion.p>
          </div>

          <div className="flex items-center justify-between pt-4">
            <div className="flex gap-1.5">
              {STEPS.map((_, i) => (
                <div 
                  key={i} 
                  className={`h-1 rounded-full transition-all duration-300 ${i === step ? 'w-6' : 'w-2 bg-black/10'}`}
                  style={{ background: i === step ? current.color : undefined }}
                />
              ))}
            </div>

            <div className="flex gap-3">
              {step > 0 && (
                <button 
                  onClick={prev}
                  className="w-10 h-10 rounded-full border border-black/5 flex items-center justify-center theme-muted hover:bg-black/5 transition-all"
                >
                  <ChevronLeft size={18} />
                </button>
              )}
              <button 
                onClick={next}
                className="px-6 py-2 rounded-2xl font-bold text-white shadow-lg transition-all flex items-center gap-2"
                style={{ background: `linear-gradient(135deg, ${current.color}, #000)` }}
              >
                {step === STEPS.length - 1 ? (
                  <>Explore <Check size={16} /></>
                ) : (
                  <>Next <ChevronRight size={16} /></>
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
