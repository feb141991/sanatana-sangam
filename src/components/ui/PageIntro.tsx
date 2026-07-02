'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export interface IntroStep {
  title: string;
  body: string;
  emoji?: string;
}

interface PageIntroProps {
  pageKey: string;
  steps: IntroStep[];
  tradition?: string;
}

export default function PageIntro({ pageKey, steps, tradition }: PageIntroProps) {
  const [visible, setVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [showReopenBtn, setShowReopenBtn] = useState(false);

  useEffect(() => {
    try {
      const seen = localStorage.getItem(`shoonaya-intro-seen-${pageKey}`);
      if (seen !== 'true') {
        setVisible(true);
      }
      const dismissedAt = localStorage.getItem(`shoonaya-intro-dismissed-at-${pageKey}`);
      if (dismissedAt) {
        const sevenDays = 7 * 24 * 60 * 60 * 1000;
        if (Date.now() - parseInt(dismissedAt) < sevenDays) {
          setShowReopenBtn(true);
        }
      }
    } catch (e) {
      // Fail silently (e.g. private/incognito mode)
    }
  }, [pageKey]);

  function dismiss() {
    try {
      localStorage.setItem(`shoonaya-intro-seen-${pageKey}`, 'true');
      localStorage.setItem(`shoonaya-intro-dismissed-at-${pageKey}`, Date.now().toString());
    } catch (e) {
      // Fail silently
    }
    setDismissed(true);
    setVisible(false);
    setTimeout(() => setShowReopenBtn(true), 600);
  }

  function reopen() {
    setCurrentStep(0);
    setDismissed(false);
    setVisible(true);
    setShowReopenBtn(false);
  }

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      dismiss();
    }
  };

  if (steps.length === 0) return null;

  const step = steps[currentStep];

  return (
    <>
      <AnimatePresence>
        {!dismissed && visible && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0, transition: { delay: 0.6 } }}
            exit={{ opacity: 0, y: 16 }}
            className="fixed bottom-24 left-4 right-4 z-50 pointer-events-auto max-w-md md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-full"
          >
            <div className="bg-[#1A1A1B] border border-[#C5A059]/25 rounded-2xl p-4 shadow-2xl shadow-black/60 flex flex-col gap-2">
              {/* Row 1: emoji + title + X close button */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  {step.emoji && (
                    <span className="text-[24px] leading-none select-none">
                      {step.emoji}
                    </span>
                  )}
                  <h3 className="font-semibold text-[15px] text-white/90 leading-tight">
                    {step.title}
                  </h3>
                </div>
                <button
                  onClick={dismiss}
                  className="text-white/40 hover:text-white/80 active:scale-90 transition-all p-1 -mr-1 -mt-1"
                  aria-label="Close intro"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Row 2: body text */}
              <div className="text-[13px] text-white/55 leading-relaxed mt-0.5">
                {step.body}
              </div>

              {/* Row 3 (if multi-step): step dots + "Next →" button */}
              {steps.length > 1 && (
                <div className="flex items-center justify-between mt-2 pt-1">
                  {/* Step dots */}
                  <div className="flex gap-1">
                    {steps.map((_, idx) => (
                      <div
                        key={idx}
                        className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${
                          currentStep === idx ? 'bg-[#C5A059]' : 'bg-white/20'
                        }`}
                      />
                    ))}
                  </div>

                  {/* "Next →" button */}
                  <button
                    onClick={handleNext}
                    className="text-[12px] font-semibold text-[#C5A059] hover:text-[#e4be72] active:scale-95 transition-all"
                  >
                    {currentStep === steps.length - 1 ? 'Got it ✓' : 'Next →'}
                  </button>
                </div>
              )}

              {/* Row 4 (always): "Skip intro" text button */}
              <div className="flex justify-end mt-1">
                <button
                  onClick={dismiss}
                  className="text-[11px] text-white/25 hover:text-white/50 active:scale-95 transition-colors font-medium"
                >
                  Skip intro
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {showReopenBtn && !visible && (
        <AnimatePresence>
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={reopen}
            className="fixed bottom-28 right-4 z-50 w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold border shadow-lg"
            style={{
              background: 'rgba(26,26,27,0.92)',
              borderColor: 'rgba(197,160,89,0.35)',
              color: 'rgba(197,160,89,0.80)',
              backdropFilter: 'blur(8px)',
            }}
            aria-label="Re-open page intro"
          >
            ?
          </motion.button>
        </AnimatePresence>
      )}
    </>
  );
}
