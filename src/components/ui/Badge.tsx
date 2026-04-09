import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type BadgeTone = 'accent' | 'soft' | 'plain';

const TONES: Record<BadgeTone, string> = {
  accent: 'bg-[var(--brand-primary-soft)] text-[color:var(--brand-primary-strong)] border border-[color:var(--brand-primary-soft)]',
  soft: 'bg-white/75 text-gray-600 border border-white/80',
  plain: 'bg-transparent text-gray-600 border border-[color:var(--brand-primary-soft)]',
};

export function Badge({
  className,
  tone = 'soft',
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold',
        TONES[tone],
        className
      )}
      {...props}
    />
  );
}
