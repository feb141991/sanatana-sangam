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
    <div className="relative flex flex-col items-center justify-center p-8 group">
      {/* ── Lamp Base (3D Glassmorphism) ── */}
      <motion.div
        className="relative cursor-pointer"
        whileHover={{ scale: 1.05, rotateY: 10, rotateX: -5 }}
        onClick={handleLight}
        style={{ perspective: '1000px' }}
      >
        {/* The Wick (Batti) */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-3 bg-[#3e2216] rounded-full z-10" />
        
        {/* The Body */}
        <div 
          className="w-24 h-12 rounded-b-full rounded-t-[10%] relative overflow-hidden"
          style={{ 
            background: 'linear-gradient(135deg, rgba(200,146,74,0.4) 0%, rgba(200,146,74,0.1) 100%)',
            border: '1px solid rgba(200,146,74,0.3)',
            backdropFilter: 'blur(10px)',
            boxShadow: isLit ? '0 10px 40px rgba(212,120,20,0.4)' : '0 10px 20px rgba(0,0,0,0.2)'
          }}
        >
          {/* Internal Glow (Oil/Ghee) */}
          <div className="absolute inset-0 bg-amber-500/10" />
        </div>

        {/* ── The Flame ── */}
        <AnimatePresence>
          {isLit && (
            <motion.div
              initial={{ scale: 0, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: -15 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute left-1/2 -translate-x-1/2 -top-12 pointer-events-none"
            >
              {/* Outer Glow */}
              <motion.div 
                className="absolute inset-0 w-12 h-16 rounded-full blur-2xl"
                style={{ background: 'rgba(255, 120, 0, 0.4)' }}
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              
              {/* Main Flame Core */}
              <div className="relative">
                {/* Layer 1: Orange Outer */}
                <motion.div 
                  className="w-8 h-12 bg-orange-500 rounded-full blur-[2px]"
                  style={{ borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%' }}
                  animate={{ 
                    scaleX: [1, 0.9, 1.1, 1],
                    scaleY: [1, 1.1, 0.9, 1],
                    skewX: [0, 2, -2, 0]
                  }}
                  transition={{ duration: 0.6, repeat: Infinity }}
                />
                
                {/* Layer 2: Yellow Inner */}
                <motion.div 
                  className="absolute top-2 left-1/2 -translate-x-1/2 w-4 h-8 bg-amber-300 rounded-full blur-[1px]"
                  animate={{ 
                    scaleX: [1, 1.2, 0.8, 1],
                    scaleY: [1, 0.8, 1.2, 1]
                  }}
                  transition={{ duration: 0.4, repeat: Infinity }}
                />
                
                {/* Layer 3: White Core */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-2 h-4 bg-white rounded-full blur-[0.5px]" />
              </div>

              {/* Heat Distortion (SVG Filter based ripple) */}
              <div className="absolute -inset-4 pointer-events-none">
                <svg width="0" height="0">
                  <filter id="flame-distortion">
                    <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" result="noise" />
                    <feDisplacementMap in="SourceGraphic" in2="noise" scale="5" />
                  </filter>
                </svg>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Call to Action ── */}
      <div className="mt-6 text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: isLit ? '#C8924A' : 'rgba(200,146,74,0.4)' }}>
          {isLit ? 'Sanctuary Lit' : 'Light the Sanctuary'}
        </p>
        <p className="text-[11px] mt-1 opacity-40 max-w-[120px]">
          {isLit ? 'Atmospheric drone active' : 'Tap to begin your ritual'}
        </p>
      </div>

      {!isLit && (
        <motion.div 
          className="absolute -top-2 right-4 text-amber-400"
          animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Sparkles size={12} />
        </motion.div>
      )}
    </div>
  );
}
