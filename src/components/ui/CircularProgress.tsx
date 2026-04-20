'use client';

import { motion } from 'framer-motion';

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
 * Shared circular SVG progress ring used across the app.
 * The SVG is rotated -90° so the ring starts at the top.
 */
export default function CircularProgress({
  pct,
  accent = '#d4a818',
  size = 56,
  strokeWidth = 5,
  label,
}: CircularProgressProps) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(Math.max(pct, 0), 100) / 100);

  return (
    <div className="relative flex-shrink-0 inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="-rotate-90 absolute inset-0"
        style={{ overflow: 'visible' }}
      >
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.10)"
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={accent}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </svg>
      {label !== undefined && (
        <div className="relative z-10 flex items-center justify-center">
          {label}
        </div>
      )}
    </div>
  );
}
