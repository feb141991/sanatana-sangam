import { cn } from '@/lib/utils';

/**
 * Spinner — lightweight inline loading indicator.
 *
 * Uses the sacred-pulse animation (gentle opacity breathe) instead of a
 * mechanical spin. Tradition-neutral; for tradition-aware states use
 * <SacredLoader variant="inline" tradition={…} /> instead.
 */
export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-block animate-sacred-pulse select-none leading-none',
        className
      )}
      style={{ color: 'var(--brand-primary)', fontSize: '1.1em' }}
      aria-hidden="true"
      role="status"
    >
      ✶
    </span>
  );
}
