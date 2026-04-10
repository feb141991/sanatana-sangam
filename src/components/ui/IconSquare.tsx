import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export default function IconSquare({
  children,
  circle = false,
  className,
}: {
  children: ReactNode;
  circle?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center bg-[color:var(--saffron-50)] text-[color:var(--saffron-800)]',
        circle ? 'rounded-full' : 'rounded-[8px]',
        className
      )}
    >
      {children}
    </span>
  );
}
