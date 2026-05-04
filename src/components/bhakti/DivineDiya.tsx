'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useZenithSensory } from '@/contexts/ZenithSensoryContext';
import { Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

interface DivineDiyaProps {
  isLitInitial?: boolean;
  onLight?: () => void;
}

export default function DivineDiya({ isLitInitial = false, onLight }: DivineDiyaProps) {
  const [isLit, setIsLit] = useState(isLitInitial);
  const { playHaptic, setTheme } = useZenithSensory();

  const handleLight = () => {
    if (isLit) return;
    setIsLit(true);
    playHaptic('heavy');
    // Change sensory theme to 'home' (temple ambiance) when lit
    setTheme('home');
    toast.success('Jyoti Prachalit 🙏', {
      icon: '🪔',
      style: { background: '#2e1710', color: '#f5dfa0' }
    });
    if (onLight) onLight();
  };

  return (
    <div className="relative flex flex-col items-center justify-center group">
      {/* ── Lamp Base (3D Glassmorphism) ── */}
      <motion.div
        className="relative cursor-pointer"
        whileHover={{ scale: 1.02 }}
        onClick={handleLight}
        style={{ perspective: '1000px' }}
      >
        {/* The Wick (Batti) */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1.5px] h-3 bg-[#2A1D0E] rounded-full z-10 opacity-60" />
        
        {/* The Body - More Minimalist & Elegant */}
        <div 
          className="w-20 h-10 rounded-b-full rounded-t-[15%] relative overflow-hidden"
          style={{ 
            background: 'linear-gradient(135deg, rgba(197,160,89,0.15) 0%, rgba(197,160,89,0.05) 100%)',
            border: '1px solid rgba(197,160,89,0.2)',
            backdropFilter: 'blur(12px)',
            boxShadow: isLit ? '0 15px 45px rgba(197,160,89,0.2)' : '0 10px 30px rgba(0,0,0,0.1)'
          }}
        >
          {/* Internal Glow (Oil/Ghee) */}
          <div className="absolute inset-0 bg-amber-500/5" />
        </div>

        {/* ── The Flame - Refined & Subtle ── */}
        <AnimatePresence>
          {isLit && (
            <motion.div
              initial={{ scale: 0, opacity: 0, y: 5 }}
              animate={{ scale: 1, opacity: 1, y: -12 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute left-1/2 -translate-x-1/2 -top-10 pointer-events-none"
            >
              {/* Refined Flame Core */}
              <div className="relative">
                {/* Layer 1: Sacred Gold Outer */}
                <motion.div 
                  className="w-6 h-10 bg-[#C5A059] rounded-full blur-[2px] opacity-80"
                  style={{ borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%' }}
                  animate={{ 
                    scaleX: [1, 0.95, 1.05, 1],
                    scaleY: [1, 1.05, 0.95, 1],
                  }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                />
                
                {/* Layer 2: White Core */}
                <motion.div 
                  className="absolute top-2 left-1/2 -translate-x-1/2 w-2 h-5 bg-white rounded-full blur-[1px] opacity-90"
                  animate={{ 
                    scaleX: [1, 1.1, 0.9, 1],
                    scaleY: [1, 0.9, 1.1, 1]
                  }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Call to Action - Subtle ── */}
      <div className="mt-5 text-center">
        <p className="text-[9px] font-bold uppercase tracking-[0.3em]" style={{ color: isLit ? '#C5A059' : 'rgba(197,160,89,0.4)' }}>
          {isLit ? 'Sanctuary Lit' : 'Invoke Light'}
        </p>
      </div>
    </div>
  );
}
