'use client';

import { useEngine } from '@/contexts/EngineContext';
import { getTraditionMeta } from '@/lib/tradition-config';
import { motion } from 'framer-motion';
import { ChevronLeft, Heart, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SevaClient({ userId, userName, tradition }: { userId: string; userName: string; tradition: string }) {
  const router = useRouter();
  const meta = getTraditionMeta(tradition);

  return (
    <main className="divine-home-shell pb-28 relative overflow-hidden" style={{ background: `linear-gradient(180deg, ${meta.accentColour}05 0%, transparent 100%)` }}>
      {/* Ambient background effects */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: `radial-gradient(circle at center, ${meta.accentColour}08, transparent 60%)`, filter: 'blur(40px)' }} />
      
      <section className="relative z-10 px-4 pt-6">
        <button onClick={() => router.back()}
          className="w-9 h-9 rounded-full flex items-center justify-center shadow-sm motion-press mb-6"
          style={{ background: `${meta.accentColour}12`, border: `1px solid ${meta.accentColour}25` }}>
          <ChevronLeft size={20} style={{ color: meta.accentColour }} />
        </button>

        <motion.div 
          className="divine-darshan-card overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="divine-card-motif divine-card-motif-large" aria-hidden="true" 
            style={{ background: `radial-gradient(circle at center, ${meta.accentColour}15, transparent 70%)` }} />
          
          <div className="relative z-10 space-y-6 text-center py-8">
            <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center text-4xl mb-4"
              style={{ background: `${meta.accentColour}15`, border: `1px solid ${meta.accentColour}30` }}>
              {meta.symbol}
            </div>
            
            <div className="space-y-2">
              <span className="divine-chip" style={{ background: `${meta.accentColour}20`, color: meta.accentColour }}>Coming Soon</span>
              <h1 className="divine-darshan-title text-3xl">{meta.label} Seva Hub</h1>
            </div>

            <p className="divine-card-copy max-w-sm mx-auto text-lg leading-relaxed">
              We are building a verified portal for temple seva, cow protection (Gau Seva), 
              annadaan, and community support tailored to the {meta.label} tradition.
            </p>

            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="glass-panel p-4 rounded-2xl border border-white/10">
                <Heart size={20} className="mx-auto mb-2" style={{ color: meta.accentColour }} />
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: meta.accentColour }}>Direct Seva</p>
                <p className="text-[10px] theme-dim mt-1">Verified temple links</p>
              </div>
              <div className="glass-panel p-4 rounded-2xl border border-white/10">
                <Sparkles size={20} className="mx-auto mb-2" style={{ color: meta.accentColour }} />
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: meta.accentColour }}>Dharmic Impact</p>
                <p className="text-[10px] theme-dim mt-1">Track your contribution</p>
              </div>
            </div>

            <button 
              onClick={() => router.push('/home')}
              className="divine-seva-cta inline-flex items-center gap-2 px-8 py-3 rounded-full text-white font-bold shadow-lg transition-all hover:scale-105 active:scale-95 mt-8"
              style={{ background: `linear-gradient(135deg, ${meta.accentColour}, ${meta.accentColour}dd)` }}
            >
              Back to Dashboard
            </button>
          </div>
        </motion.div>
      </section>
    </main>
  );
}
