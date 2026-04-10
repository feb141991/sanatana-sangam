import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export default function Card({
  children,
  className,
  style,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
}) {
  return (
    <div
      {...props}
      className={cn(
        'rounded-[16px] border bg-white px-4 py-4 transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
        className
      )}
      style={{ borderColor: 'rgba(0,0,0,0.15)', ...style }}
    >
      {children}
    </div>
  );
}
