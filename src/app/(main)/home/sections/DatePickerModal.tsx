'use client';

import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronDown, ChevronRight } from 'lucide-react';
import {
  eachDayOfInterval, startOfWeek, startOfMonth, endOfWeek, endOfMonth,
  format as fmtDate, isSameDay, isSameMonth, isToday as isDayToday,
  addMonths, subMonths
} from 'date-fns';

const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

interface DatePickerModalProps {
  selectedDate: Date;
  onSelect: (date: Date) => void;
  onClose: () => void;
}

export function DatePickerModal({ selectedDate, onSelect, onClose }: DatePickerModalProps) {
  const prefersReducedMotion = useReducedMotion();
  const [viewDate, setViewDate] = useState(new Date(selectedDate));
  const [showYearPicker, setShowYearPicker] = useState(false);

  const curYear = new Date().getFullYear();
  const years = Array.from({ length: 12 }, (_, i) => curYear - 4 + i);

  const calDays = eachDayOfInterval({
    start: startOfWeek(startOfMonth(viewDate), { weekStartsOn: 0 }),
    end: endOfWeek(endOfMonth(viewDate), { weekStartsOn: 0 }),
  });

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      onClick={onClose}
      initial={prefersReducedMotion ? undefined : { opacity: 0 }}
      animate={prefersReducedMotion ? undefined : { opacity: 1 }}
      exit={prefersReducedMotion ? undefined : { opacity: 0 }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" />

      <motion.div
        className="relative w-80 rounded-[1.5rem] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
        style={{
          background: 'linear-gradient(160deg, rgba(40, 36, 28, 0.99), rgba(30, 28, 22, 0.99))',
          border: '1px solid rgba(197, 160, 89, 0.18)',
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.44)',
        }}
        initial={prefersReducedMotion ? undefined : { y: 12, opacity: 0, scale: 0.97 }}
        animate={prefersReducedMotion ? undefined : { y: 0, opacity: 1, scale: 1 }}
        exit={prefersReducedMotion ? undefined : { y: 8, opacity: 0, scale: 0.97 }}
        transition={{ duration: 0.28, ease: [0.34, 1.26, 0.64, 1] }}
      >
        {/* Month nav row */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b flex-shrink-0" style={{ borderColor: 'rgba(197, 160, 89, 0.14)' }}>
          <button onClick={() => setViewDate(v => subMonths(v, 1))}
            className="w-8 h-8 rounded-full flex items-center justify-center motion-press border-0 cursor-pointer"
            style={{ background: 'rgba(197, 160, 89, 0.12)' }}>
            <ChevronLeft size={15} style={{ color: 'var(--text-cream)' }} />
          </button>
          <button onClick={() => setShowYearPicker(v => !v)}
            className="flex items-center gap-1 font-semibold text-sm motion-press border-0 bg-transparent cursor-pointer"
            style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-cream)', fontSize: '1rem' }}>
            {fmtDate(viewDate, 'MMMM yyyy')}
            <ChevronDown size={13} style={{ color: 'var(--text-dim)' }} />
          </button>
          <button onClick={() => setViewDate(v => addMonths(v, 1))}
            className="w-8 h-8 rounded-full flex items-center justify-center motion-press border-0 cursor-pointer"
            style={{ background: 'rgba(197, 160, 89, 0.12)' }}>
            <ChevronRight size={15} style={{ color: 'var(--text-cream)' }} />
          </button>
        </div>

        {showYearPicker ? (
          <div className="grid grid-cols-4 gap-2 p-4">
            {years.map(y => (
              <button key={y}
                onClick={() => { setViewDate(d => new Date(y, d.getMonth(), 1)); setShowYearPicker(false); }}
                className="py-2 rounded-xl text-xs font-medium motion-press border-0 cursor-pointer"
                style={y === viewDate.getFullYear()
                  ? { background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-primary-strong))', color: '#1a1610' }
                  : { background: 'rgba(197, 160, 89, 0.08)', color: 'var(--text-muted-warm)' }}>
                {y}
              </button>
            ))}
          </div>
        ) : (
          <div className="px-3 pt-2 pb-4">
            <div className="grid grid-cols-7 mb-1">
              {DAY_LABELS.map(d => (
                <div key={d} className="text-center text-[10px] font-semibold py-1" style={{ color: 'var(--text-dim)' }}>{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-y-0.5">
              {calDays.map(day => {
                const inMonth = isSameMonth(day, viewDate);
                const isSelected = isSameDay(day, selectedDate);
                const isToday = isDayToday(day);
                return (
                  <button key={day.toString()}
                    onClick={() => { onSelect(day); onClose(); }}
                    className="h-8 w-8 mx-auto rounded-full text-xs flex items-center justify-center motion-press border-0 cursor-pointer bg-transparent"
                    style={
                      isSelected ? { background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-primary-strong))', color: '#1a1610', fontWeight: 700 } :
                      isToday ? { border: '1.5px solid var(--brand-primary)', color: 'var(--brand-primary)', fontWeight: 700 } :
                      !inMonth ? { color: 'rgba(176, 170, 158, 0.3)' } :
                                   { color: 'var(--text-muted-warm)' }
                    }>
                    {fmtDate(day, 'd')}
                  </button>
                );
              })}
            </div>
            <div className="mt-3 flex justify-center">
              <button onClick={() => { onSelect(new Date()); onClose(); }}
                className="text-xs px-5 py-1.5 rounded-full border font-medium motion-press cursor-pointer"
                style={{ borderColor: 'rgba(197, 160, 89, 0.20)', color: 'var(--brand-primary)', background: 'rgba(197, 160, 89, 0.08)' }}>
                Today
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
