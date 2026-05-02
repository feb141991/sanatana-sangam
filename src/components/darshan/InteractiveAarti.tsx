'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { X, Flame, Bell, Droplets, Wind, Flower2 } from 'lucide-react';
import { hapticLight, hapticSuccess } from '@/lib/platform';

interface DarshanCard {
  id: string;
  tradition: string;
  title: string;
  symbol: string;
  blessing: string;
}

interface InteractiveAartiProps {
  card: DarshanCard;
  onClose: () => void;
}

interface Particle {
  id: string;
  x: number;
  y: number;
  type: string;
  color: string;
}

const TOOL_CONFIG: Record<string, { id: string; label: string; icon: React.ReactNode; type: string; color: string }> = {
  deepak: { id: 'deepak', label: 'Aarti', icon: <Flame size={20} />, type: 'flame', color: '#F59E0B' },
  ghanti: { id: 'ghanti', label: 'Ghanti', icon: <Bell size={20} />, type: 'sparkle', color: '#FCD34D' },
  dhoop: { id: 'dhoop', label: 'Dhoop', icon: <Wind size={20} />, type: 'smoke', color: '#E5E7EB' },
  jal: { id: 'jal', label: 'Jal', icon: <Droplets size={20} />, type: 'water', color: '#60A5FA' },
  pushpa: { id: 'pushpa', label: 'Pushpa', icon: <Flower2 size={20} />, type: 'flower', color: '#F472B6' },
  whisk: { id: 'whisk', label: 'Chaur', icon: <Wind size={20} />, type: 'sparkle', color: '#FFFFFF' },
  bowl: { id: 'bowl', label: 'Singing Bowl', icon: <Bell size={20} />, type: 'sparkle', color: '#D97706' },
  butterlamp: { id: 'butterlamp', label: 'Light', icon: <Flame size={20} />, type: 'flame', color: '#FDE68A' },
  lotus: { id: 'lotus', label: 'Lotus', icon: <Flower2 size={20} />, type: 'flower', color: '#F472B6' },
};

function getToolsForTradition(tradition: string) {
  const t = tradition.toLowerCase();
  if (t === 'sikh') return ['whisk', 'pushpa'];
  if (t === 'buddhist') return ['bowl', 'butterlamp', 'lotus'];
  if (t === 'jain') return ['deepak', 'dhoop', 'pushpa'];
  return ['deepak', 'ghanti', 'dhoop', 'jal', 'pushpa']; // Default Hindu
}

export default function InteractiveAarti({ card, onClose }: InteractiveAartiProps) {
  const tools = getToolsForTradition(card.tradition).map(id => TOOL_CONFIG[id]);
  const [activeToolId, setActiveToolId] = useState<string | null>(tools[0]?.id || null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const activeTool = tools.find(t => t.id === activeToolId);
  const containerRef = useRef<HTMLDivElement>(null);
  const bellControls = useAnimation();
  
  // Clean up particles
  useEffect(() => {
    const interval = setInterval(() => {
      setParticles(prev => {
        // Keep only newest particles to avoid DOM bloat
        if (prev.length > 40) return prev.slice(prev.length - 40);
        return prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const spawnParticle = useCallback((x: number, y: number, type: string, color: string, count = 1) => {
    const newParticles: Particle[] = Array.from({ length: count }).map((_, i) => ({
      id: `${Date.now()}-${Math.random()}-${i}`,
      x: x + (Math.random() * 40 - 20),
      y: y + (Math.random() * 40 - 20),
      type,
      color,
    }));
    setParticles(prev => [...prev, ...newParticles].slice(-60)); // Keep max 60 active
  }, []);

  // Interaction Handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    if (!activeTool) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    triggerToolAction(activeTool, x, y);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    // Only trail if it's deepak (drag)
    if (activeTool?.type !== 'flame') return;
    if (e.buttons !== 1) return; // Only if mouse/touch is down

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Throttled spawn
    if (Math.random() > 0.4) {
      spawnParticle(x, y, activeTool.type, activeTool.color);
    }
  };

  const triggerToolAction = (tool: typeof TOOL_CONFIG[string], x: number, y: number) => {
    hapticLight();
    
    if (tool.id === 'ghanti' || tool.id === 'bowl') {
      // Ring bell animation
      bellControls.start({
        rotate: [0, -25, 20, -15, 10, 0],
        transition: { duration: 0.8, ease: "easeInOut" }
      });
      // Spawn sparkles around center
      spawnParticle(window.innerWidth / 2, window.innerHeight / 2, 'sparkle', tool.color, 8);
    } else if (tool.type === 'flower') {
      // Shower from top
      spawnParticle(window.innerWidth / 2, 0, 'flower', tool.color, 5);
      hapticSuccess();
    } else if (tool.type === 'smoke') {
      // Spawn smoke at touch point
      spawnParticle(x, y, 'smoke', tool.color, 3);
    } else if (tool.type === 'water') {
      // Splash water
      spawnParticle(x, y, 'water', tool.color, 8);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-black text-white flex flex-col items-center justify-center overflow-hidden touch-none"
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
    >
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-gradient-to-t from-[var(--divine-saffron)]/20 via-black to-black opacity-60" />
      <div className="absolute inset-0 radial-vignette opacity-80" style={{ background: 'radial-gradient(circle at 50% 40%, transparent 20%, black 80%)' }} />

      {/* Close Button */}
      <button 
        onClick={onClose}
        className="absolute top-8 right-6 z-50 p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white"
      >
        <X size={24} />
      </button>

      {/* Central Deity Symbol */}
      <motion.div 
        className="relative z-10 flex flex-col items-center pointer-events-none"
        animate={{ scale: [1, 1.02, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="text-[160px] font-serif text-[#C9A35B] drop-shadow-[0_0_40px_rgba(201,163,91,0.5)]">
          {card.symbol}
        </div>
        <div className="mt-4 text-white/50 text-xs tracking-[0.3em] uppercase font-semibold">
          Offering to {card.title}
        </div>
      </motion.div>

      {/* Particle Layer */}
      <div className="absolute inset-0 pointer-events-none z-20">
        <AnimatePresence>
          {particles.map(p => {
            if (p.type === 'flame') {
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0.8, scale: 0.5, x: p.x, y: p.y }}
                  animate={{ opacity: 0, scale: 2, y: p.y - 100 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="absolute w-8 h-8 rounded-full"
                  style={{ background: `radial-gradient(circle, ${p.color} 0%, transparent 70%)` }}
                />
              );
            }
            if (p.type === 'smoke') {
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0.6, scale: 1, x: p.x, y: p.y }}
                  animate={{ opacity: 0, scale: 4, y: p.y - 300, x: p.x + (Math.random() * 100 - 50) }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 4, ease: "easeOut" }}
                  className="absolute w-12 h-12 rounded-full blur-xl"
                  style={{ background: `radial-gradient(circle, ${p.color}40 0%, transparent 70%)` }}
                />
              );
            }
            if (p.type === 'water') {
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0.8, scale: 1, x: p.x, y: p.y }}
                  animate={{ opacity: 0, scale: 0.5, y: p.y + 150, x: p.x + (Math.random() * 60 - 30) }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8, ease: "easeIn" }}
                  className="absolute w-3 h-3 rounded-full blur-[1px]"
                  style={{ background: p.color, boxShadow: `0 0 10px ${p.color}` }}
                />
              );
            }
            if (p.type === 'flower') {
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, scale: 0.5, x: p.x + (Math.random() * 200 - 100), y: p.y }}
                  animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.8], y: window.innerHeight, rotate: Math.random() * 360 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 3 + Math.random() * 2, ease: "linear" }}
                  className="absolute text-2xl drop-shadow-lg"
                >
                  {card.tradition.toLowerCase() === 'buddhist' ? '🪷' : '🌺'}
                </motion.div>
              );
            }
            if (p.type === 'sparkle') {
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 1, scale: 0, x: p.x, y: p.y }}
                  animate={{ opacity: 0, scale: [0, 2, 0], y: p.y - (Math.random() * 100 + 50), x: p.x + (Math.random() * 100 - 50) }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="absolute text-xl"
                  style={{ color: p.color }}
                >
                  ✨
                </motion.div>
              );
            }
            return null;
          })}
        </AnimatePresence>
      </div>

      {/* Aarti Instructions */}
      <motion.div 
        className="absolute bottom-40 text-center z-30 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <p className="text-white/60 text-sm italic px-8">
          {activeTool?.type === 'flame' && "Drag around the screen to offer Aarti"}
          {activeTool?.type === 'sparkle' && "Tap anywhere to ring the bell"}
          {activeTool?.type === 'smoke' && "Tap to offer Dhoop"}
          {activeTool?.type === 'water' && "Tap to sprinkle sacred Jal"}
          {activeTool?.type === 'flower' && "Tap to shower flowers"}
        </p>
      </motion.div>

      {/* Puja Thali Toolbar */}
      <motion.div 
        className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-black/90 to-transparent z-40 flex items-end justify-center pb-8"
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 200, delay: 0.2 }}
      >
        <div className="flex items-center gap-2 md:gap-4 px-6 py-4 rounded-[2rem] bg-white/5 backdrop-blur-xl border border-white/10 shadow-[0_0_30px_rgba(201,163,91,0.15)]">
          {tools.map(tool => {
            const isActive = activeToolId === tool.id;
            return (
              <motion.button
                key={tool.id}
                onClick={(e) => {
                  e.stopPropagation(); // Don't trigger canvas tap
                  setActiveToolId(tool.id);
                  hapticLight();
                }}
                className={`relative flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all ${
                  isActive ? 'bg-white/10' : 'opacity-60 hover:opacity-100'
                }`}
                animate={tool.id === 'ghanti' || tool.id === 'bowl' ? bellControls : {}}
              >
                {isActive && (
                  <motion.div 
                    layoutId="activeToolIndicator"
                    className="absolute inset-0 rounded-2xl border border-white/20 bg-white/5"
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <div className="relative z-10" style={{ color: isActive ? tool.color : '#A1A1AA' }}>
                  {tool.icon}
                </div>
                <span className={`text-[10px] font-medium relative z-10 ${isActive ? 'text-white' : 'text-zinc-400'}`}>
                  {tool.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}
