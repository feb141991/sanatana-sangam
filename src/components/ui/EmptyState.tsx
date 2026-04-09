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
        'rounded-[1.6rem] border border-[color:var(--brand-primary-soft)] bg-white/78 px-5 py-6 text-center',
        className
      )}
    >
      {icon ? <div className="text-2xl">{icon}</div> : null}
      <h3 className="mt-2 font-display text-lg font-bold text-gray-900">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-gray-600">{description}</p>
    </div>
  );
}
