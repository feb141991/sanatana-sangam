import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type CardTone = 'panel' | 'strong' | 'soft';

const TONES: Record<CardTone, string> = {
  panel: 'glass-panel',
  strong: 'glass-panel-strong',
  soft: 'bg-white/80 border border-[color:var(--brand-primary-soft)]',
};

export function Card({
  className,
  tone = 'panel',
  ...props
}: HTMLAttributes<HTMLDivElement> & { tone?: CardTone }) {
  return (
    <div
      className={cn(
        'rounded-[1.8rem] px-5 py-5 shadow-card',
        TONES[tone],
        className
      )}
      {...props}
    />
  );
}
