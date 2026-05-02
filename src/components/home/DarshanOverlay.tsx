'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { X, Share2, Download, Maximize2, Minimize2, Music } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Darshan } from '@/lib/darshan-registry';

interface DarshanOverlayProps {
  darshan: Darshan;
  isOpen: boolean;
  onClose: () => void;
  autoOpened?: boolean;
}

export default function DarshanOverlay({ darshan, isOpen, onClose, autoOpened }: DarshanOverlayProps) {
  const [isCleanView, setIsCleanView] = useState(false);

  // Auto-close clean view after 5 seconds or on tap
  useEffect(() => {
    if (isCleanView) {
      const timer = setTimeout(() => setIsCleanView(false), 8000);
      return () => clearTimeout(timer);
    }
  }, [isCleanView]);

  if (!isOpen) return null;

  const handleDownload = async () => {
    try {
      const response = await fetch(darshan.imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${darshan.deity.toLowerCase().replace(/\s+/g, '_')}_darshan.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Daily Darshan: ${darshan.deity}`,
          text: darshan.blessing,
          url: window.location.origin + darshan.imageUrl,
        });
      } catch (err) {
        console.error('Share failed:', err);
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center overflow-hidden"
        >
          {/* Immersive Image with Ken Burns Effect */}
          <motion.div
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ 
              scale: [1.1, 1.0, 1.05],
              opacity: 1 
            }}
            transition={{ 
              scale: { duration: 30, repeat: Infinity, repeatType: 'reverse' },
              opacity: { duration: 0.8 }
            }}
            className="absolute inset-0 w-full h-full"
          >
            <Image
              src={darshan.imageUrl}
              alt={darshan.deity}
              fill
              className="object-cover"
              priority
            />
          </motion.div>

          {/* Deep Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/70 pointer-events-none" />

          {/* Header Actions */}
          <AnimatePresence>
            {!isCleanView && (
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                className="absolute top-0 inset-x-0 p-6 flex items-center justify-between z-20"
              >
                <div className="flex flex-col">
                  {autoOpened && (
                    <span className="text-[10px] font-bold text-white/50 uppercase tracking-[0.2em] mb-1">
                      Today&apos;s Blessing
                    </span>
                  )}
                  <h2 className="text-white text-lg font-serif font-medium">{darshan.deity}</h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white"
                >
                  <X size={20} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Floating Sidebar Actions */}
          <AnimatePresence>
            {!isCleanView && (
              <motion.div
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 20, opacity: 0 }}
                className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-20"
              >
                <button
                  onClick={handleShare}
                  className="p-3 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 text-white shadow-2xl"
                  title="Share"
                >
                  <Share2 size={20} />
                </button>
                <button
                  onClick={handleDownload}
                  className="p-3 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 text-white shadow-2xl"
                  title="Download Wallpaper"
                >
                  <Download size={20} />
                </button>
                <button
                  onClick={() => setIsCleanView(true)}
                  className="p-3 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 text-white shadow-2xl"
                  title="Wallpaper View"
                >
                  <Maximize2 size={20} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bottom Content: Blessing & Mantra */}
          <AnimatePresence>
            {!isCleanView && (
              <motion.div
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 40, opacity: 0 }}
                className="absolute bottom-0 inset-x-0 z-20"
              >
                <div className="p-8 pt-12 text-center relative overflow-hidden rounded-t-[40px]">
                  {/* Cream Readability Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-b from-[#FCF8EE]/90 to-[#F5EBD7] backdrop-blur-xl" />
                  
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="w-12 h-1 bg-black/10 rounded-full mb-6" />
                    
                    <p className="text-[#2A1B0A] font-serif text-xl md:text-2xl leading-relaxed mb-4 px-4">
                      &ldquo;{darshan.blessing}&rdquo;
                    </p>
                    
                    {darshan.mantra && (
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-[10px] font-bold text-[#2A1B0A]/40 uppercase tracking-widest">
                          Mantra
                        </span>
                        <p className="text-[#C8924A] font-medium tracking-wide">
                          {darshan.mantra}
                        </p>
                      </div>
                    )}
                    
                    <button
                      onClick={onClose}
                      className="mt-8 px-8 py-3 bg-[#2A1B0A] text-white rounded-full font-medium text-sm tracking-wide shadow-xl"
                    >
                      Accept Blessings
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tap to exit clean view */}
          {isCleanView && (
            <div 
              className="absolute inset-0 z-[110] cursor-pointer"
              onClick={() => setIsCleanView(false)}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
