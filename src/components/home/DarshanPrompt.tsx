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
          initial={{ y: 50, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 50, opacity: 0, scale: 0.9 }}
          className="fixed bottom-24 left-4 right-4 z-[90] md:left-auto md:right-8 md:w-80"
        >
          <div className="relative group overflow-hidden rounded-3xl bg-white shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-white/20">
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
                  <Sparkles size={12} className="text-[#C8924A]" />
                  <span className="text-[10px] font-bold text-[#C8924A] uppercase tracking-wider">Daily Darshan</span>
                </div>
                <h3 className="text-[#2A1B0A] font-serif font-bold text-sm truncate">
                  Blessings from {darshan.deity}
                </h3>
                <p className="text-[#2A1B0A]/50 text-[11px] font-medium">Accept today&apos;s grace</p>
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
