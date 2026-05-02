'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { X, Share2, Download, Maximize2, Volume2, VolumeX, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { Darshan } from '@/lib/darshan-registry';

interface DarshanOverlayProps {
  darshans: Darshan[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function DarshanOverlay({ darshans, initialIndex, isOpen, onClose }: DarshanOverlayProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isCleanView, setIsCleanView] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [portalTarget, setPortalTarget] = useState<Element | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const darshan = darshans[currentIndex];

  // Drag constraints and transforms
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0]);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex, isOpen]);

  useEffect(() => {
    setPortalTarget(document.body);
  }, []);

  useEffect(() => {
    if (isOpen && !isMuted) {
      audioRef.current?.play().catch(() => {
        // Autoplay might be blocked
        setIsMuted(true);
      });
    } else {
      audioRef.current?.pause();
    }
  }, [isOpen, currentIndex, isMuted]);

  const handleDragEnd = (_: any, info: any) => {
    if (info.offset.x > 100) {
      // Swipe Right
      setCurrentIndex((prev) => (prev > 0 ? prev - 1 : darshans.length - 1));
    } else if (info.offset.x < -100) {
      // Swipe Left
      setCurrentIndex((prev) => (prev < darshans.length - 1 ? prev + 1 : 0));
    }
  };

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

  if (!isOpen || !portalTarget) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center overflow-hidden touch-none"
        >
          {/* Background Image (blurred or static) */}
          <div className="absolute inset-0 opacity-30 blur-2xl scale-110 pointer-events-none">
            <Image src={darshan.imageUrl} alt="" fill className="object-cover" />
          </div>

          {/* Swipeable Card Container */}
          <div className="relative w-full max-w-[90%] aspect-[9/16] max-h-[85vh] flex items-center justify-center">
            <motion.div
              key={darshan.id}
              style={{ x, rotate, opacity }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              onDragEnd={handleDragEnd}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className="relative w-full h-full rounded-[2.5rem] overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.5)] cursor-grab active:cursor-grabbing border border-white/10"
            >
              {/* Immersive Image with Ken Burns Effect */}
              <motion.div
                animate={{ scale: [1, 1.05, 1.02] }}
                transition={{ duration: 20, repeat: Infinity, repeatType: 'reverse' }}
                className="absolute inset-0 w-full h-full"
              >
                <Image src={darshan.imageUrl} alt={darshan.deity} fill className="object-cover" priority />
              </motion.div>

              {/* Gradient Overlays */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/80 pointer-events-none" />

              {/* Card Header (Internal) */}
              {!isCleanView && (
                <div className="absolute top-0 inset-x-0 p-8 flex items-start justify-between z-10">
                  <div>
                    <span className="text-[10px] font-bold text-white/60 uppercase tracking-[0.2em] mb-1 block">
                      Divine Blessing
                    </span>
                    <h2 className="text-white text-2xl font-serif font-medium">{darshan.deity}</h2>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); onClose(); }}
                    className="p-2.5 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 text-white motion-press"
                  >
                    <X size={20} />
                  </button>
                </div>
              )}

              {/* Card Footer (Internal) - Fixed for screenshot */}
              {!isCleanView && (
                <div className="absolute bottom-0 inset-x-0 p-8 pt-16 z-10">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent -z-10" />
                  
                  <div className="flex flex-col items-center text-center">
                    <p className="text-white font-serif text-xl md:text-2xl leading-relaxed mb-4 italic px-4">
                      &ldquo;{darshan.blessing}&rdquo;
                    </p>
                    
                    {darshan.mantra && (
                      <div className="flex flex-col items-center gap-1.5">
                        <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">
                          Sacred Mantra
                        </span>
                        <p className="text-[#C8924A] font-medium tracking-wide text-sm">
                          {darshan.mantra}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>

            {/* Navigation Indicators */}
            {!isCleanView && (
              <>
                <div className="absolute -left-12 top-1/2 -translate-y-1/2 hidden md:block opacity-30">
                  <ChevronLeft size={40} className="text-white" />
                </div>
                <div className="absolute -right-12 top-1/2 -translate-y-1/2 hidden md:block opacity-30">
                  <ChevronRight size={40} className="text-white" />
                </div>
              </>
            )}
          </div>

          {/* External Action Bar */}
          <AnimatePresence>
            {!isCleanView && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 20, opacity: 0 }}
                className="mt-8 flex items-center gap-6 z-20"
              >
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-4 rounded-full bg-white/10 backdrop-blur-xl border border-white/10 text-white motion-press"
                >
                  {isMuted ? <VolumeX size={22} /> : <Volume2 size={22} />}
                </button>
                <button
                  onClick={handleShare}
                  className="p-4 rounded-full bg-white/10 backdrop-blur-xl border border-white/10 text-white motion-press"
                >
                  <Share2 size={22} />
                </button>
                <button
                  onClick={handleDownload}
                  className="p-4 rounded-full bg-white/10 backdrop-blur-xl border border-white/10 text-white motion-press"
                >
                  <Download size={22} />
                </button>
                <button
                  onClick={() => setIsCleanView(true)}
                  className="p-4 rounded-full bg-white/10 backdrop-blur-xl border border-white/10 text-white motion-press"
                  title="Wallpaper Mode"
                >
                  <Maximize2 size={22} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Swipe Indicator */}
          {!isCleanView && (
            <div className="mt-4 text-white/30 text-[10px] font-medium tracking-[0.3em] uppercase">
              Swipe to rotate
            </div>
          )}

          {/* Hidden Audio Element */}
          <audio 
            ref={audioRef} 
            src={darshan.tradition === 'sikh' ? '/sounds/shabad_loop.mp3' : '/sounds/temple_bell.mp3'} 
            loop 
          />

          {/* Tap to exit clean view */}
          {isCleanView && (
            <div 
              className="absolute inset-0 z-[110] cursor-pointer"
              onClick={() => setIsCleanView(false)}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>,
    portalTarget
  );
}
