'use client';

/**
 * CircularProgress — thin backward-compat wrapper around RadialRing.
 * New code should import RadialRing directly.
 */

import RadialRing from './RadialRing';
import type { RadialRingProps } from './RadialRing';
import React from 'react';

interface CircularProgressProps {
  /** 0–100 */
  pct: number;
  /** Stroke colour — any CSS colour string */
  accent?: string;
  /** Outer diameter in px (default 56) */
  size?: number;
  /** Track stroke width (default 5) */
  strokeWidth?: number;
  /** Optional label rendered in the centre */
  label?: React.ReactNode;
}

/**
 * @deprecated Import RadialRing from '@/components/ui/RadialRing' instead.
 */
export default function CircularProgress({
  pct,
  accent,
  size = 56,
  strokeWidth = 5,
  label,
}: CircularProgressProps) {
  return (
    <RadialRing
      pct={pct}
      accent={accent}
      size={size}
      strokeWidth={strokeWidth}
      label={label}
    />
  );
}
