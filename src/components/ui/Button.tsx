import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'glass-button-primary text-white border border-white/20 hover:brightness-[1.02] active:translate-y-px',
  secondary:
    'glass-button-secondary text-[color:var(--brand-primary-strong)] hover:bg-white',
  ghost:
    'border border-[color:var(--brand-primary-soft)] bg-white/70 text-[color:var(--brand-primary-strong)] hover:bg-white',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'min-h-9 px-3.5 text-sm rounded-xl',
  md: 'min-h-11 px-4 text-sm rounded-2xl',
  lg: 'min-h-12 px-5 text-base rounded-[1.25rem]',
};

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand-primary)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60',
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      {...props}
    />
  );
}
