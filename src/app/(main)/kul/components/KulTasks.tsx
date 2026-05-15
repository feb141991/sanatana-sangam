'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, CheckSquare, Clock, User, ChevronRight } from 'lucide-react';
import { TaskRow, MemberRow } from '../types';

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
  const [filter, setFilter] = useState<'pending' | 'completed'>('pending');
  
  const filteredTasks = tasks.filter(t => filter === 'pending' ? !t.completed : t.completed);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold theme-ink premium-serif">Kul Tasks</h2>
          <p className="text-xs theme-muted mt-0.5">Shared practices and commitments.</p>
        </div>
        {myRole === 'guardian' && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onAdd(null)}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-bold shadow-lg"
            style={{ background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-primary-strong))', color: 'white' }}
          >
            <Plus size={16} />
            Add Task
          </motion.button>
        )}
      </div>

      <div className="flex gap-2 p-1 rounded-2xl bg-black/5 w-fit">
        {(['pending', 'completed'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${filter === f ? 'bg-white shadow-sm theme-ink' : 'theme-muted hover:theme-ink'}`}
          >
            {f === 'pending' ? 'Pending' : 'Completed'}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filteredTasks.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 glass-panel rounded-[2rem] border border-dashed border-black/5"
            >
              <p className="text-sm theme-muted">No {filter} tasks found.</p>
            </motion.div>
          ) : (
            filteredTasks.map((task) => (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`group relative overflow-hidden rounded-[1.8rem] p-4 flex gap-4 transition-all border ${
                  task.completed ? 'bg-black/5 border-transparent opacity-60' : 'glass-panel border-white/5 hover:border-white/10'
                }`}
              >
                <button
                  disabled={task.completed}
                  onClick={() => onComplete(task.id)}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl flex-shrink-0 transition-all ${
                    task.completed 
                      ? 'bg-green-500/10 text-green-600' 
                      : 'bg-white/10 border border-white/10 hover:border-[var(--brand-primary)]/40 hover:bg-[var(--brand-primary)]/5'
                  }`}
                >
                  {task.completed ? '✓' : '📋'}
                </button>

                <div className="flex-1 min-w-0">
                  <h3 className={`font-bold theme-ink leading-tight ${task.completed ? 'line-through' : ''}`}>
                    {task.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                    <div className="flex items-center gap-1.5 text-[10px] theme-muted">
                      <User size={10} />
                      <span>{task.assigned_to_profile?.full_name || 'Assigned to all'}</span>
                    </div>
                    {task.due_date && (
                      <div className="flex items-center gap-1.5 text-[10px] theme-muted">
                        <Clock size={10} />
                        <span>{new Date(task.due_date).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                {myRole === 'guardian' && (
                  <button
                    onClick={() => onDelete(task.id)}
                    className="opacity-0 group-hover:opacity-100 p-2 text-red-400 hover:text-red-500 transition-opacity"
                  >
                    <X size={16} />
                  </button>
                )}
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
