import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function EmptyState({
  title,
  description,
  icon,
  className,
}: HTMLAttributes<HTMLDivElement> & {
  title: string;
  description: string;
  icon?: string;
}) {
  return (
    <div
      className={cn(
        'surface-soft-card rounded-[1.6rem] px-5 py-6 text-center',
        className
      )}
    >
      {icon ? <div className="text-2xl">{icon}</div> : null}
      <h3 className="mt-2 font-display text-lg font-bold theme-ink">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed theme-muted">{description}</p>
    </div>
  );
}
