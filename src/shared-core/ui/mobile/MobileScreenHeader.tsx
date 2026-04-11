import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function MobileScreenHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex items-start justify-between gap-4 px-1', className)}>
      <div className="min-w-0">
        {eyebrow ? <p className="type-card-label">{eyebrow}</p> : null}
        <h1 className="type-screen-title mt-1">{title}</h1>
        {description ? <p className="type-body mt-2 max-w-2xl">{description}</p> : null}
      </div>
      {actions ? <div className="flex-shrink-0">{actions}</div> : null}
    </div>
  );
}
