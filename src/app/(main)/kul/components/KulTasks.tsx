'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, CheckSquare, Clock, User, ChevronRight, Sparkles } from 'lucide-react';
import { TaskRow, MemberRow } from '../types';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export function KulTasks({
  tasks,
  members,
  myRole,
  userId,
  onComplete,
  onAdd,
  onDelete,
}: {
  tasks: TaskRow[];
  members: MemberRow[];
  myRole: 'guardian' | 'sadhak';
  userId: string;
  onComplete: (taskId: string) => void;
  onAdd: (task: any) => void;
  onDelete: (taskId: string) => void;
}) {
  const { t } = useLanguage();
  const [filter, setFilter] = useState<'pending' | 'completed'>('pending');
  
  const filteredTasks = tasks.filter(t => filter === 'pending' ? !t.completed : t.completed);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 15, scale: 0.98 },
    show: { opacity: 1, y: 0, scale: 1 }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h2 className="text-xl font-bold theme-ink premium-serif">{t('kulTasksTitle')}</h2>
          <p className="text-xs theme-muted mt-0.5">{t('kulTasksDesc')}</p>
        </motion.div>
        {myRole === 'guardian' && (
          <motion.button
            whileHover={{ scale: 1.02, boxShadow: '0 10px 25px rgba(var(--brand-primary-rgb), 0.3)' }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onAdd(null)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold shadow-lg transition-all"
            style={{ background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-primary-strong))', color: 'white' }}
          >
            <Plus size={16} strokeWidth={3} />
            {t('kulAddTask')}
          </motion.button>
        )}
      </div>

      <div className="flex gap-2 p-1.5 rounded-2xl bg-black/5 w-fit backdrop-blur-sm border border-black/5">
        {(['pending', 'completed'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
              filter === f 
                ? 'bg-white shadow-md theme-ink scale-105' 
                : 'theme-muted hover:theme-ink hover:bg-white/40'
            }`}
          >
            {f === 'pending' ? t('kulPending') : t('kulCompleted')}
          </button>
        ))}
      </div>

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-4"
      >
        <AnimatePresence mode="popLayout">
          {filteredTasks.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center py-16 glass-panel rounded-[2.5rem] border border-dashed border-black/10 bg-white/5"
            >
              <div className="w-16 h-16 rounded-full bg-slate-100/50 flex items-center justify-center mx-auto mb-4 text-2xl shadow-inner">✨</div>
              <p className="text-sm theme-muted font-medium">{t('kulNoTasksFound')}</p>
            </motion.div>
          ) : (
            filteredTasks.map((task) => (
              <motion.div
                key={task.id}
                variants={item}
                layout
                className={`group relative overflow-hidden rounded-[2rem] p-5 flex gap-5 transition-all border ${
                  task.completed 
                    ? 'bg-green-50/30 border-green-100/20 opacity-70' 
                    : 'glass-panel border-white/5 hover:border-white/20 hover:shadow-xl hover:-translate-y-0.5'
                }`}
              >
                {/* Visual Accent */}
                {!task.completed && (
                  <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[var(--brand-primary)] to-transparent opacity-40" />
                )}

                <button
                  disabled={task.completed}
                  onClick={() => onComplete(task.id)}
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 transition-all shadow-sm ${
                    task.completed 
                      ? 'bg-green-500 text-white shadow-green-200' 
                      : 'bg-white/10 border border-white/10 group-hover:border-[var(--brand-primary)]/40 group-hover:bg-[var(--brand-primary)]/5'
                  }`}
                >
                  {task.completed ? <Sparkles size={24} /> : '📋'}
                </button>

                <div className="flex-1 min-w-0 py-1">
                  <h3 className={`text-base font-bold theme-ink leading-snug premium-serif ${task.completed ? 'line-through opacity-60' : ''}`}>
                    {task.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3">
                    <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-black/5 border border-black/5 text-[10px] font-bold theme-muted uppercase tracking-wider">
                      <User size={12} className="text-[var(--brand-primary)]" />
                      <span>{task.assigned_to_profile?.full_name || t('kulAssignedToAll')}</span>
                    </div>
                    {task.due_date && (
                      <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-black/5 border border-black/5 text-[10px] font-bold theme-muted uppercase tracking-wider">
                        <Clock size={12} />
                        <span>{new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col justify-center">
                  {myRole === 'guardian' ? (
                    <motion.button
                      whileHover={{ scale: 1.1, color: '#ef4444' }}
                      onClick={() => onDelete(task.id)}
                      className="p-2 text-slate-300 transition-colors"
                    >
                      <X size={18} strokeWidth={2.5} />
                    </motion.button>
                  ) : (
                    <ChevronRight size={18} className="theme-dim opacity-20 group-hover:opacity-100 transition-opacity" />
                  )}
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
