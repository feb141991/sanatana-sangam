import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export default function Chip({
  children,
  variant = 'saffron',
  className,
}: {
  children: ReactNode;
  variant?: 'saffron' | 'outline';
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-[24px] px-[10px] py-[3px] text-[11px] font-medium',
        variant === 'saffron'
          ? 'bg-[color:var(--saffron-50)] text-[color:var(--saffron-800)]'
          : 'border text-[color:var(--text-secondary)]',
        className
      )}
      style={variant === 'outline' ? { borderColor: 'rgba(0,0,0,0.15)' } : undefined}
    >
      {children}
    </span>
  );
}
