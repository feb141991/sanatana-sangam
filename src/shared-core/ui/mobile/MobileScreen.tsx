import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function MobileScreen({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div
      className={cn(
        'mx-auto flex w-full max-w-5xl flex-col gap-4 px-3 pb-24 pt-3 sm:px-4 md:gap-5 md:px-6',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
