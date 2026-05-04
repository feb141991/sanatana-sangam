'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useZenithSensory } from '@/contexts/ZenithSensoryContext';
import { ChevronRight, Sparkles, Wind, Sun, Moon } from 'lucide-react';

interface DeekshaStep {
  id: string;
  title: string;
  subtitle: string;
  options?: { id: string; label: string; icon: React.ReactNode }[];
}

const STEPS: DeekshaStep[] = [
  {
    id: 'intention',
    title: 'Sankalpa',
    subtitle: 'What is your primary intention for this journey?',
    options: [
      { id: 'peace', label: 'Shanti (Peace)', icon: <Wind size={20} /> },
      { id: 'knowledge', label: 'Jnana (Knowledge)', icon: <Sun size={20} /> },
      { id: 'devotion', label: 'Bhakti (Devotion)', icon: <Sparkles size={20} /> },
      { id: 'prosperity', label: 'Lakshmi (Prosperity)', icon: <Moon size={20} /> },
    ]
  },
  {
    id: 'tradition',
    title: 'Lineage',
    subtitle: 'Which spiritual path resonates with your soul?',
    options: [
      { id: 'shaiva', label: 'Shaiva', icon: '🔱' },
      { id: 'vaishnava', label: 'Vaishnava', icon: '🪷' },
      { id: 'shakta', label: 'Shakta', icon: '⚔️' },
      { id: 'universal', label: 'Universal', icon: '🕉️' },
    ]
  },
  {
    id: 'initiation',
    title: 'Deeksha',
    subtitle: 'Tap the center to ignite your inner flame.',
  }
];

export default function DigitalDeeksha({ onComplete }: { onComplete: (data: any) => void }) {
  const [currentStepIdx, setStepIdx] = useState(-1); // -1 is the "Arrival" screen
  const [selections, setSelections] = useState<Record<string, string>>({});
  const { playHaptic } = useZenithSensory();

  const currentStep = STEPS[currentStepIdx];

  const handleNext = () => {
    playHaptic('medium');
    if (currentStepIdx < STEPS.length - 1) {
      setStepIdx(currentStepIdx + 1);
    } else {
      onComplete(selections);
    }
  };

  const handleSelect = (optionId: string) => {
    playHaptic('light');
    setSelections(prev => ({ ...prev, [currentStep.id]: optionId }));
    setTimeout(handleNext, 600);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#0A0A0A] text-white overflow-hidden flex flex-col items-center justify-center">
      <AnimatePresence mode="wait">
        {currentStepIdx === -1 ? (
          <motion.div 
            key="arrival"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="text-center px-8"
          >
            <motion.div 
              animate={{ 
                scale: [1, 1.1, 1],
                opacity: [0.3, 0.6, 0.3]
              }}
              transition={{ duration: 4, repeat: Infinity }}
              className="w-32 h-32 bg-[#C5A059] rounded-full blur-3xl absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20"
            />
            <h1 className="text-4xl font-serif mb-4 tracking-tight" style={{ color: '#FDFCF8' }}>Digital Deeksha</h1>
            <p className="text-sm opacity-50 uppercase tracking-[0.4em] mb-12">The Initiation Begins</p>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setStepIdx(0)}
              className="px-12 py-4 rounded-full border border-[#C5A059]/30 text-[#C5A059] font-bold uppercase tracking-widest text-[10px] backdrop-blur-md"
            >
              Enter the Sanctuary
            </motion.button>
          </motion.div>
        ) : (
          <motion.div 
            key={currentStep.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full max-w-md px-8 text-center"
          >
            <p className="text-[10px] uppercase tracking-[0.4em] mb-2" style={{ color: '#C5A059' }}>{currentStep.title}</p>
            <h2 className="text-2xl font-serif mb-12" style={{ color: '#FDFCF8' }}>{currentStep.subtitle}</h2>
            
            <div className="grid grid-cols-1 gap-4">
              {currentStep.options?.map(opt => (
                <motion.button
                  key={opt.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSelect(opt.id)}
                  className="w-full p-6 rounded-[2rem] border transition-all flex items-center justify-between group"
                  style={{ 
                    background: selections[currentStep.id] === opt.id ? 'rgba(197,160,89,0.1)' : 'rgba(255,255,255,0.02)',
                    borderColor: selections[currentStep.id] === opt.id ? '#C5A059' : 'rgba(255,255,255,0.08)'
                  }}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-xl group-hover:scale-110 transition-transform">{opt.icon}</span>
                    <span className="text-sm font-medium">{opt.label}</span>
                  </div>
                  <ChevronRight size={16} className="opacity-20 group-hover:opacity-100 transition-opacity" />
                </motion.button>
              ))}
            </div>
            
            {currentStep.id === 'initiation' && (
              <div className="mt-12 flex flex-col items-center">
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleSelect('ignited')}
                  className="w-32 h-32 rounded-full border-2 border-[#C5A059]/40 flex items-center justify-center cursor-pointer relative"
                >
                  <div className="absolute inset-0 bg-[#C5A059]/10 rounded-full blur-xl" />
                  <Sparkles size={32} className="text-[#C5A059]" />
                </motion.div>
                <p className="text-[10px] uppercase tracking-widest mt-6 opacity-40">The spark of awareness</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress Indicator */}
      <div className="fixed bottom-12 left-0 right-0 flex justify-center gap-2">
        {[-1, ...STEPS].map((_, i) => (
          <div 
            key={i} 
            className="h-1 rounded-full transition-all duration-500"
            style={{ 
              width: currentStepIdx === i - 1 ? '24px' : '4px',
              background: currentStepIdx >= i - 1 ? '#C5A059' : 'rgba(255,255,255,0.1)'
            }}
          />
        ))}
      </div>
    </div>
  );
}
