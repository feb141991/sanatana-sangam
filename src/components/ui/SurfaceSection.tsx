import type { HTMLAttributes, ReactNode } from 'react';
import { Card } from './Card';
import { cn } from '@/lib/utils';

export function SurfaceSection({
  title,
  eyebrow,
  description,
  actions,
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  title: string;
  eyebrow?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card className={cn('space-y-4 rounded-2xl p-4', className)} {...props}>
      <div className="flex items-start justify-between gap-4">
        <div>
          {eyebrow ? <p className="type-card-label">{eyebrow}</p> : null}
          <h2 className="type-card-heading mt-1">{title}</h2>
          {description ? <p className="type-body mt-1">{description}</p> : null}
        </div>
        {actions}
      </div>
      {children}
    </Card>
  );
}
