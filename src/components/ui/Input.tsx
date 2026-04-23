import type { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'glass-input min-h-11 w-full rounded-2xl px-4 text-sm text-[color:var(--text-cream)] placeholder:text-[color:var(--text-dim)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand-primary)]',
        className
      )}
      {...props}
    />
  );
}
