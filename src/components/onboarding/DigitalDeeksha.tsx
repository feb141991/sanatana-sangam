import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { ArrowRight, Shield, Sunrise, User } from 'lucide-react';

const steps = [
  {
    title: "The Vision",
    icon: <Sunrise className="w-8 h-8 text-[#C5A059]" />,
    description: "Welcome to Sanatan Sangam. A premium sanctuary for your spiritual journey. Transcend the digital noise and connect with your roots.",
    accent: "from-[#C5A059]/20 to-[#D4784A]/20"
  },
  {
    title: "Sacred Community",
    icon: <User className="w-8 h-8 text-[#C5A059]" />,
    description: "Connect with verified gurus and a global sangha of seekers. Authenticity in every interaction.",
    accent: "from-[#D4784A]/20 to-[#E18C5A]/20"
  },
  {
    title: "Daily Sadhana",
    icon: <Shield className="w-8 h-8 text-[#C5A059]" />,
    description: "Personalized rituals, authentic scriptures, and precise astronomical timings for your spiritual growth.",
    accent: "from-[#E18C5A]/20 to-[#C5A059]/20"
  }
];

export default function DigitalDeeksha({ onComplete }: { onComplete: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#FDFCF8] dark:bg-[#1A1A18]">
      <div className="absolute inset-0 opacity-40 pointer-events-none" 
           style={{ background: 'radial-gradient(circle at 50% 50%, #FFF4E0 0%, transparent 70%)' }} />
      
      <div className="max-w-md w-full relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.05, y: -20 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className={`rounded-[3.5rem] p-10 bg-white/60 dark:bg-black/40 backdrop-blur-2xl border border-[#C5A059]/10 text-center shadow-2xl shadow-[#C5A059]/5`}
          >
            <div className={`w-20 h-20 mx-auto mb-8 rounded-[2rem] bg-gradient-to-br ${steps[currentStep].accent} flex items-center justify-center`}>
              {steps[currentStep].icon}
            </div>
            
            <h2 className="text-3xl font-serif text-[#2A1B0A] dark:text-[#FDFCF8] mb-4">
              {steps[currentStep].title}
            </h2>
            
            <p className="text-sm text-[#8E8E7A] leading-relaxed mb-10 min-h-[80px]">
              {steps[currentStep].description}
            </p>

            <div className="flex flex-col gap-4">
              <button
                onClick={() => {
                  if (currentStep < steps.length - 1) {
                    setCurrentStep(prev => prev + 1);
                  } else {
                    onComplete();
                  }
                }}
                className="w-full py-4 rounded-full bg-[#C5A059] text-white font-bold uppercase tracking-[0.2em] shadow-lg shadow-[#C5A059]/20 flex items-center justify-center gap-2 group transition-all hover:bg-[#B48E4A]"
              >
                {currentStep === steps.length - 1 ? "Enter Sanctuary" : "Continue"}
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
              
              <div className="flex justify-center gap-2">
                {steps.map((_, i) => (
                  <div 
                    key={i} 
                    className={`h-1 rounded-full transition-all duration-500 ${i === currentStep ? 'w-8 bg-[#C5A059]' : 'w-2 bg-[#C5A059]/20'}`}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
