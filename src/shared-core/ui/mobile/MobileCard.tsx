import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function MobileCard({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div
      className={cn(
        'glass-panel rounded-[1.6rem] px-4 py-4 sm:rounded-[1.8rem] sm:px-5 sm:py-5',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
