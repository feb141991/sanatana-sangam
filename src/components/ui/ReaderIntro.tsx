'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun, Type, Share2, ArrowRight, X } from 'lucide-react';
import type { ReadableCapabilities } from '@/lib/readable-content';
import { useThemePreference } from '@/components/providers/ThemeProvider';

interface IntroStep {
  target: string; // CSS selector
  title: string;
  description: string;
  icon: React.ElementType;
  /** When set, this step is only shown if the corresponding capability is true */
  capabilityGate?: keyof ReadableCapabilities;
}

const ALL_STEPS: IntroStep[] = [
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
    icon: Sun, // Using Sun as a placeholder or we can use a custom 'अ' icon
    capabilityGate: 'canToggleLocalLanguage'
  },
  {
    target: '.share-button',
    title: 'Spread the Wisdom',
    description: 'Share these sacred teachings and observances with your Mandali.',
    icon: Share2
  }
];

interface ReaderIntroProps {
  /** When provided, intro steps are filtered by capability flags */
  capabilities?: Partial<ReadableCapabilities>;
}

export function ReaderIntro({ capabilities }: ReaderIntroProps) {
  const { resolvedTheme } = useThemePreference();
  const isDark = resolvedTheme === 'dark';

  // Filter steps: keep steps with no gate, or whose gate is satisfied
  const steps = ALL_STEPS.filter(step => {
    if (!step.capabilityGate) return true;
    // If no capabilities provided, show all steps (backward-compatible)
    if (!capabilities) return true;
    return capabilities[step.capabilityGate] !== false;
  });

  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [targetPos, setTargetPos] = useState({ top: 0, left: 0, width: 0, height: 0 });

  useEffect(() => {
    const seen = localStorage.getItem('shoonaya_reader_intro_seen');
    if (!seen && steps.length > 0) {
      // Delay slightly to ensure layout is ready
      const timer = setTimeout(() => {
        setIsVisible(true);
        updateTargetPosition(0);
      }, 1000);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateTargetPosition = (stepIdx: number) => {
    const s = steps[stepIdx];
    if (!s) return;
    const el = document.querySelector(s.target);
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
    if (currentStep < steps.length - 1) {
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

  if (!isVisible || steps.length === 0) return null;

  const step = steps[currentStep];
  if (!step) return null;
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
          className="absolute pointer-events-auto w-[280px] p-6 rounded-[2rem] shadow-2xl border border-[var(--brand-primary-soft)]"
          style={{
            background: isDark ? '#0E0E0F' : '#ffffff',
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

          <h4 className="text-lg font-bold mb-2" style={{ color: isDark ? '#F0EDE6' : '#1A140E' }}>{step.title}</h4>
          <p className="text-sm leading-relaxed mb-6" style={{ color: isDark ? 'rgba(197,160,89,0.6)' : '#4D4035' }}>
            {step.description}
          </p>

          <div className="flex items-center justify-between">
            <div className="flex gap-1.5">
              {steps.map((_, i) => (
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
              {currentStep === steps.length - 1 ? 'Finish' : 'Next'} <ArrowRight size={14} />
            </button>
          </div>
        </motion.div>

        {/* Pulsing Highlight Border */}
        <motion.div 
          animate={{ outlineWidth: [1, 4, 1], outlineColor: ['rgba(197, 160, 89,0.3)', 'rgba(197, 160, 89,0.8)', 'rgba(197, 160, 89,0.3)'] }}
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
