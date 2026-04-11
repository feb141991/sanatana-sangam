import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function MobileList({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-[1.7rem] border border-white/8 bg-white/[0.03]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function MobileListItem({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div
      className={cn(
        'border-b border-white/6 px-4 py-3 last:border-b-0 sm:px-5 sm:py-4',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
