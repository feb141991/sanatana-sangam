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
          <p className="type-card-label">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="type-card-heading mt-2">{title}</h2>
        {description ? (
          <p className="type-body mt-2 max-w-2xl">{description}</p>
        ) : null}
      </div>
      {actions}
    </div>
  );
}
