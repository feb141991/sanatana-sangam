'use client';

import type { CSSProperties, ReactNode } from 'react';

type SacredGlowIconVariant = 'soft' | 'active' | 'milestone';

interface SacredGlowIconProps {
  children: ReactNode;
  color?: string;
  size?: number;
  variant?: SacredGlowIconVariant;
  animated?: boolean;
  className?: string;
  style?: CSSProperties;
  'aria-hidden'?: boolean;
}

export default function SacredGlowIcon({
  children,
  color = 'var(--brand-primary)',
  size = 28,
  variant = 'soft',
  animated = false,
  className = '',
  style,
  'aria-hidden': ariaHidden = true,
}: SacredGlowIconProps) {
  return (
    <span
      aria-hidden={ariaHidden}
      className={[
        'sacred-glow-icon',
        `sacred-glow-icon--${variant}`,
        animated ? 'sacred-glow-icon--animated' : '',
        className,
      ].filter(Boolean).join(' ')}
      style={{
        '--sacred-glow-color': color,
        '--sacred-glow-size': `${size}px`,
        ...style,
      } as CSSProperties}
    >
      <span className="sacred-glow-icon__content">{children}</span>
    </span>
  );
}
