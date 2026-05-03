'use client';

import React from 'react';
import Image from 'next/image';
import { X, Sparkles, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Darshan } from '@/lib/darshan-registry';

interface DarshanPromptProps {
  darshan: Darshan;
  isVisible: boolean;
  onOpen: () => void;
  onDismiss: () => void;
}

export default function DarshanPrompt({ darshan, isVisible, onOpen, onDismiss }: DarshanPromptProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full"
        >
          <div className="relative group overflow-hidden rounded-3xl bg-[var(--divine-surface)] shadow-sm border border-[var(--divine-border)]">
            {/* Background Blur Image */}
            <div className="absolute inset-0 opacity-10 blur-xl scale-110 pointer-events-none">
              <Image src={darshan.imageUrl} alt="" fill className="object-cover" />
            </div>

            <div className="relative z-10 p-4 flex items-center gap-4">
              {/* Thumbnail */}
              <div className="relative w-16 h-16 rounded-2xl overflow-hidden shadow-lg border-2 border-white">
                <Image src={darshan.imageUrl} alt={darshan.deity} fill className="object-cover" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-red-600">
                    <span className="w-1 h-1 rounded-full bg-white animate-pulse" />
                    <span className="text-[8px] font-black text-white uppercase tracking-widest">Live</span>
                  </span>
                  <span className="text-[10px] font-bold text-[var(--divine-saffron)] uppercase tracking-wider">
                    {darshan.tradition === 'sikh' ? 'Gurdwara' : 'Darshan'}
                  </span>
                </div>
                <h3 className="text-[var(--divine-text)] font-serif font-bold text-sm truncate">
                  {(darshan as any).liveTitle || `Blessings from ${darshan.deity}`}
                </h3>
                <p className="text-[var(--divine-muted)] text-[11px] font-medium truncate">
                  {(darshan as any).liveLocation || "Accept today's grace"}
                </p>
              </div>

              {/* Action */}
              <button
                onClick={onOpen}
                className="w-10 h-10 rounded-full bg-[#2A1B0A] text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform"
              >
                <ChevronRight size={20} />
              </button>

              {/* Dismiss */}
              <button
                onClick={onDismiss}
                className="absolute top-2 right-2 p-1 text-[#2A1B0A]/20 hover:text-[#2A1B0A]/50 transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            {/* Clickable Area */}
            <div 
              className="absolute inset-0 cursor-pointer z-0" 
              onClick={onOpen}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
