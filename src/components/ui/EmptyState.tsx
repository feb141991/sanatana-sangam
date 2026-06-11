import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function EmptyState({
  title,
  description,
  icon,
  className,
  actionLabel,
  onAction,
}: HTMLAttributes<HTMLDivElement> & {
  title: string;
  description: string;
  icon?: string;
  /** Optional primary action rendered below the description */
  actionLabel?: string;
  onAction?: () => void;
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
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 px-5 py-2.5 min-h-[44px] rounded-xl text-sm font-semibold text-white hover:opacity-90 transition"
          style={{ background: 'linear-gradient(135deg, var(--brand-primary-strong), var(--brand-primary))' }}
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
