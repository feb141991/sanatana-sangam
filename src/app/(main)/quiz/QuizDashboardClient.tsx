'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, Flame, Target, Calendar, 
  ChevronRight, CheckCircle2, XCircle, 
  Sparkles, History, GraduationCap
} from 'lucide-react';
import { getTraditionMeta } from '@/lib/tradition-config';

interface QuizResponse {
  id: string;
  date: string;
  question: string;
  chosen_index: number;
  correct_index: number;
  is_correct: boolean;
  tradition: string;
}

interface Props {
  userId: string;
  userName: string;
  tradition: string;
  initialHistory: QuizResponse[];
}

export default function QuizDashboardClient({ userName, tradition, initialHistory }: Props) {
  const meta = getTraditionMeta(tradition);
  const [history] = useState<QuizResponse[]>(initialHistory);

  // Stats calculation
  const stats = useMemo(() => {
    const total = history.length;
    const correct = history.filter(h => h.is_correct).length;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
    
    // Calculate current streak
    let streak = 0;
    const sorted = [...history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    for (let i = 0; i < sorted.length; i++) {
      if (sorted[i].is_correct) {
        streak++;
      } else {
        break;
      }
    }

    return { total, correct, accuracy, streak };
  }, [history]);

  const glassStyle = {
    background: 'rgba(255, 255, 255, 0.03)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
  };

  return (
    <div className="min-h-screen bg-[#0c0c0a] text-[color:var(--brand-ink)] p-4 pb-24 md:p-8">
      {/* Header */}
      <header className="mb-8">
        <Link href="/home" className="inline-flex items-center gap-2 text-xs text-[color:var(--brand-muted)] mb-4 hover:text-[color:var(--brand-ink)] transition">
          <ChevronRight size={14} className="rotate-180" /> Back to Home
        </Link>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Quiz Mastery</h1>
        <p className="text-[color:var(--brand-muted)] text-sm">
          Deepening your knowledge of the {tradition} tradition, one day at a time.
        </p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Current Streak', value: stats.streak, icon: Flame, color: '#ff7043' },
          { label: 'Accuracy', value: `${stats.accuracy}%`, icon: Target, color: meta.accentColour },
          { label: 'Total Answered', value: stats.total, icon: Trophy, color: '#ffca28' },
          { label: 'Tradition Rank', value: 'Seeker', icon: GraduationCap, color: '#7e57c2' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-5 rounded-2xl"
            style={glassStyle}
          >
            <div className="flex items-center justify-between mb-2">
              <stat.icon size={20} style={{ color: stat.color }} />
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: stat.color }} />
            </div>
            <p className="text-2xl font-bold mb-0.5">{stat.value}</p>
            <p className="text-[10px] uppercase tracking-widest text-[color:var(--brand-muted)] font-bold">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* History List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between mb-4 px-2">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <History size={18} className="text-[color:var(--brand-muted)]" />
              Learning History
            </h2>
          </div>

          <AnimatePresence mode="popLayout">
            {history.length === 0 ? (
              <div className="text-center py-20 bg-white/2 rounded-3xl border border-dashed border-white/10">
                <p className="text-[color:var(--brand-muted)] text-sm italic">
                  No quiz responses yet. Start your daily spark on the home screen!
                </p>
              </div>
            ) : (
              history.map((item, idx) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="p-5 rounded-2xl group transition-all hover:bg-white/5"
                  style={glassStyle}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--brand-muted)]">
                          {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <div className="h-1 w-1 rounded-full bg-white/20" />
                        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: meta.accentColour }}>
                          {item.tradition}
                        </span>
                      </div>
                      <h3 className="text-sm font-medium leading-relaxed mb-3 pr-4">
                        {item.question}
                      </h3>
                      <div className="flex items-center gap-4">
                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          item.is_correct ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                          {item.is_correct ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                          {item.is_correct ? 'Correct' : 'Incorrect'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="hidden sm:block text-right">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-[color:var(--brand-muted)] mb-1">Status</p>
                      <div className={`text-xs font-bold ${item.is_correct ? 'text-green-400' : 'text-red-400'}`}>
                        {item.is_correct ? '+10 Karma' : '0 Karma'}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar / Upgrades */}
        <div className="space-y-6">
          {/* Practice Mode Promo */}
          <div className="p-6 rounded-[2rem] relative overflow-hidden group"
            style={{ 
              background: `linear-gradient(135deg, ${meta.accentColour}22 0%, rgba(0,0,0,0.4) 100%)`,
              border: `1px solid ${meta.accentColour}33`
            }}
          >
            <div className="relative z-10">
              <div className="bg-white/10 w-max p-2 rounded-xl mb-4">
                <Sparkles size={24} style={{ color: meta.accentColour }} />
              </div>
              <h3 className="text-xl font-bold mb-2">Practice Mode</h3>
              <p className="text-xs text-[color:var(--brand-muted)] leading-relaxed mb-6">
                Don't wait for the daily spark. Unlock 10 fresh AI questions whenever you want to test your knowledge.
              </p>
              <button 
                className="w-full py-3 rounded-xl font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{ background: meta.accentColour, color: '#1c1c1a' }}
              >
                Go Pro for Unlimited Quiz
              </button>
            </div>
            
            {/* Glow effect */}
            <div className="absolute -bottom-12 -right-12 w-32 h-32 blur-[60px] rounded-full opacity-30 group-hover:opacity-50 transition-opacity"
              style={{ background: meta.accentColour }}
            />
          </div>

          {/* Calendar View */}
          <div className="p-6 rounded-[2rem]" style={glassStyle}>
            <h3 className="text-sm font-bold flex items-center gap-2 mb-4">
              <Calendar size={16} className="text-[color:var(--brand-muted)]" />
              Consistency
            </h3>
            <div className="grid grid-cols-7 gap-1.5">
              {Array.from({ length: 28 }).map((_, i) => (
                <div 
                  key={i} 
                  className={`aspect-square rounded-[4px] border ${
                    i % 3 === 0 ? 'bg-green-500/20 border-green-500/30' : 'bg-white/5 border-white/5'
                  }`} 
                />
              ))}
            </div>
            <p className="text-[10px] text-[color:var(--brand-muted)] mt-4 leading-relaxed">
              Answer the daily question to keep your learning consistency high.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
