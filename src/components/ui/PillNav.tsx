'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function PillNav<T extends string>({
  value,
  items,
  onChange,
}: {
  value: T;
  items: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  const reduced = useReducedMotion();

  return (
    <div
      className="flex rounded-[24px] border bg-white p-1"
      style={{ borderColor: 'rgba(0,0,0,0.15)' }}
    >
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            onClick={() => onChange(item.value)}
            className={cn(
              'relative flex-1 rounded-[20px] px-3 py-2 text-[13px] font-medium transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
              active ? 'text-[color:var(--saffron-800)]' : 'text-[color:var(--text-secondary)]'
            )}
          >
            {active ? (
              <motion.span
                layoutId="pill-nav-active"
                className="absolute inset-0 rounded-[20px] bg-[color:var(--saffron-50)]"
                transition={reduced ? { duration: 0 } : { duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              />
            ) : null}
            <span className="relative z-10">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
