'use client';

import { motion } from 'framer-motion';
import { Plus, Calendar, Bell, Clock, ChevronRight } from 'lucide-react';
import { KulEvent, MemberRow } from '../types';
import { daysUntilNextOccurrence } from '../utils';

export function KulEvents({
  events,
  members,
  myRole,
  onAdd,
  onDelete,
}: {
  events: KulEvent[];
  members: MemberRow[];
  myRole: 'guardian' | 'sadhak';
  onAdd: () => void;
  onDelete: (id: string) => void;
}) {
  const sortedEvents = [...events]
    .map(e => ({ ...e, daysUntil: daysUntilNextOccurrence(e.event_date) }))
    .sort((a, b) => a.daysUntil - b.daysUntil);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold theme-ink premium-serif">Family Dates</h2>
          <p className="text-xs theme-muted mt-0.5">Important milestones and observances.</p>
        </div>
        {myRole === 'guardian' && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onAdd}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-bold shadow-lg"
            style={{ background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-primary-strong))', color: 'white' }}
          >
            <Plus size={16} />
            Add Event
          </motion.button>
        )}
      </div>

      <div className="space-y-4">
        {sortedEvents.length === 0 ? (
          <div className="text-center py-16 glass-panel rounded-[2.5rem] border border-dashed border-black/5">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4 text-2xl">📅</div>
            <p className="text-sm theme-muted">No upcoming events found.</p>
          </div>
        ) : (
          sortedEvents.map((event) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative group glass-panel rounded-[2rem] p-5 flex items-center gap-5 border border-white/5 hover:border-white/10 transition-all shadow-sm overflow-hidden"
            >
              {/* Progress Bar for upcoming */}
              <div className="absolute bottom-0 left-0 h-1 bg-[var(--brand-primary)]/20" style={{ width: `${Math.max(0, 100 - (event.daysUntil / 365) * 100)}%` }} />

              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col items-center justify-center border border-white/40 shadow-inner flex-shrink-0">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--brand-primary)]">
                  {new Date(event.event_date).toLocaleString('default', { month: 'short' })}
                </p>
                <p className="text-2xl font-bold theme-ink leading-none">
                  {new Date(event.event_date).getDate()}
                </p>
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-bold theme-ink leading-tight premium-serif">{event.title}</h3>
                <div className="flex items-center gap-3 mt-1.5">
                   <div className="flex items-center gap-1 text-[10px] theme-muted font-semibold">
                      <Bell size={10} className="text-[var(--brand-primary)]" />
                      <span>{event.daysUntil === 0 ? 'TODAY' : `In ${event.daysUntil} days`}</span>
                   </div>
                   {event.recurring && (
                     <div className="flex items-center gap-1 text-[10px] theme-muted font-semibold">
                        <Clock size={10} />
                        <span>Annual</span>
                     </div>
                   )}
                </div>
                {event.description && (
                  <p className="text-[11px] theme-muted mt-2 line-clamp-1 italic">&ldquo;{event.description}&rdquo;</p>
                )}
              </div>

              <ChevronRight size={16} className="theme-dim group-hover:translate-x-1 transition-transform opacity-40" />
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
