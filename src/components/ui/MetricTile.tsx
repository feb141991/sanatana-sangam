import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function MetricTile({
  label,
  value,
  hint,
  icon,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div
      className={cn('surface-card rounded-[1.35rem] px-4 py-4', className)}
      {...props}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="type-card-label">{label}</p>
        {icon ? <span className="clay-icon-well">{icon}</span> : null}
      </div>
      <div className="type-metric mt-2">{value}</div>
      {hint ? <p className="type-micro mt-1">{hint}</p> : null}
    </div>
  );
}
