import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function SectionHeading({
  title,
  eyebrow,
  description,
  className,
  actions,
}: HTMLAttributes<HTMLDivElement> & {
  title: string;
  eyebrow?: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className={cn('flex items-start justify-between gap-4', className)}>
      <div>
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--brand-primary)]">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="font-display text-xl font-bold text-gray-900 mt-2">{title}</h2>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-600">{description}</p>
        ) : null}
      </div>
      {actions}
    </div>
  );
}
