'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun, Type, Share2, ArrowRight, X } from 'lucide-react';

interface IntroStep {
  target: string; // CSS selector
  title: string;
  description: string;
  icon: React.ElementType;
}

const STEPS: IntroStep[] = [
  {
    target: '.theme-toggle',
    title: 'Reading Mode',
    description: 'Switch between Light, Dark, and Sepia themes for a comfortable meditative experience.',
    icon: Moon
  },
  {
    target: '.font-toggle',
    title: 'Text Scale',
    description: 'Adjust the font size to your preference for effortless reading.',
    icon: Type
  },
  {
    target: '.lang-toggle',
    title: 'Deep Localization',
    description: 'Toggle between English and your local tradition\'s language (Hindi/Punjabi).',
    icon: Sun // Using Sun as a placeholder or we can use a custom 'अ' icon
  },
  {
    target: '.share-button',
    title: 'Spread the Wisdom',
    description: 'Share these sacred teachings and observances with your Mandali.',
    icon: Share2
  }
];

export function ReaderIntro() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [targetPos, setTargetPos] = useState({ top: 0, left: 0, width: 0, height: 0 });

  useEffect(() => {
    const seen = localStorage.getItem('shoonaya_reader_intro_seen');
    if (!seen) {
      // Delay slightly to ensure layout is ready
      const timer = setTimeout(() => {
        setIsVisible(true);
        updateTargetPosition(0);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const updateTargetPosition = (stepIdx: number) => {
    const selector = STEPS[stepIdx].target;
    const el = document.querySelector(selector);
    if (el) {
      const rect = el.getBoundingClientRect();
      setTargetPos({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height
      });
    }
  };

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      const nextIdx = currentStep + 1;
      setCurrentStep(nextIdx);
      updateTargetPosition(nextIdx);
    } else {
      closeIntro();
    }
  };

  const closeIntro = () => {
    setIsVisible(false);
    localStorage.setItem('shoonaya_reader_intro_seen', 'true');
  };

  if (!isVisible) return null;

  const step = STEPS[currentStep];
  const Icon = step.icon;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] pointer-events-none">
        {/* Backdrop with Hole */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 pointer-events-auto"
          style={{
            clipPath: `polygon(
              0% 0%, 
              0% 100%, 
              ${targetPos.left}px 100%, 
              ${targetPos.left}px ${targetPos.top}px, 
              ${targetPos.left + targetPos.width}px ${targetPos.top}px, 
              ${targetPos.left + targetPos.width}px ${targetPos.top + targetPos.height}px, 
              ${targetPos.left}px ${targetPos.top + targetPos.height}px, 
              ${targetPos.left}px 100%, 
              100% 100%, 
              100% 0%
            )`
          }}
          onClick={nextStep}
        />

        {/* Content Card */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="absolute pointer-events-auto w-[280px] p-6 rounded-[2rem] bg-white shadow-2xl border border-[var(--brand-primary-soft)]"
          style={{
            top: targetPos.top > window.innerHeight / 2 ? targetPos.top - 200 : targetPos.top + targetPos.height + 20,
            left: Math.min(Math.max(20, targetPos.left - 120), window.innerWidth - 300)
          }}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 rounded-2xl bg-[var(--brand-primary-soft)] text-[var(--brand-primary)]">
              <Icon size={20} />
            </div>
            <button onClick={closeIntro} className="p-2 opacity-30 hover:opacity-100 transition">
              <X size={16} />
            </button>
          </div>

          <h4 className="text-lg font-bold text-[#1A140E] mb-2">{step.title}</h4>
          <p className="text-sm text-[#4D4035] leading-relaxed mb-6">
            {step.description}
          </p>

          <div className="flex items-center justify-between">
            <div className="flex gap-1.5">
              {STEPS.map((_, i) => (
                <div 
                  key={i} 
                  className={`h-1 rounded-full transition-all ${i === currentStep ? 'w-4 bg-[var(--brand-primary)]' : 'w-1 bg-[var(--brand-primary-soft)]'}`} 
                />
              ))}
            </div>
            <button 
              onClick={nextStep}
              className="flex items-center gap-2 text-sm font-bold text-[var(--brand-primary)]"
            >
              {currentStep === STEPS.length - 1 ? 'Finish' : 'Next'} <ArrowRight size={14} />
            </button>
          </div>
        </motion.div>

        {/* Pulsing Highlight Border */}
        <motion.div 
          animate={{ outlineWidth: [1, 4, 1], outlineColor: ['rgba(200,146,74,0.3)', 'rgba(200,146,74,0.8)', 'rgba(200,146,74,0.3)'] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute rounded-full pointer-events-none"
          style={{
            top: targetPos.top - 4,
            left: targetPos.left - 4,
            width: targetPos.width + 8,
            height: targetPos.height + 8,
            outlineStyle: 'solid'
          }}
        />
      </div>
    </AnimatePresence>
  );
}
