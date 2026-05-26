import { cn } from '@/lib/utils';

type BrandMarkProps = {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
};

const sizeMap    = { sm: 32, md: 40, lg: 56 } as const;
const radiusMap  = { sm: 14, md: 18, lg: 22 } as const;

/**
 * Shoonaya brand mark — the lemniscate (∞) with a bindu (·) at the crossing.
 *
 * Symbolism:
 *   ∞  Shunya (शून्य) — void, zero, infinity
 *   ·  Bindu           — the point of pure consciousness within the void
 */
export default function BrandMark({ className, size = 'md' }: BrandMarkProps) {
  const px = sizeMap[size];
  const rx = radiusMap[size];

  return (
    <span
      aria-hidden="true"
      className={cn(
        'brand-mark-pulse relative inline-flex items-center justify-center overflow-hidden',
        'border border-white/20',
        'shadow-[0_8px_24px_rgba(197,160,89,0.18),inset_0_1px_0_rgba(255,255,255,0.10)]',
        className,
      )}
      style={{
        width: px,
        height: px,
        borderRadius: rx,
        background: 'linear-gradient(145deg, rgba(16,10,2,0.98), rgba(46,28,6,0.96))',
        flexShrink: 0,
      }}
    >
      {/*
       * SVG viewBox 32×32. Lemniscate centred at (16,16).
       * Left peak (4,16) · Right peak (28,16).
       *
       * Path: left peak → upper-left curve → centre → lower-right curve →
       *       right peak → upper-right curve → centre → lower-left curve → left peak
       */}
      <svg
        viewBox="0 0 32 32"
        width={px * 0.76}
        height={px * 0.76}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="bm-gold" x1="4" y1="10" x2="28" y2="22" gradientUnits="userSpaceOnUse">
            <stop offset="0%"   stopColor="#f5d070" />
            <stop offset="50%"  stopColor="#C5A059" />
            <stop offset="100%" stopColor="#8a6520" />
          </linearGradient>
          <filter id="bm-glow" x="-25%" y="-25%" width="150%" height="150%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="1" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="bm-bindu-glow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="1.8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Lemniscate — two cubic-bezier loops meeting at the centre crossing */}
        <path
          d="M 4,16 C 4,9 10,9 16,16 C 22,23 28,23 28,16 C 28,9 22,9 16,16 C 10,23 4,23 4,16 Z"
          stroke="url(#bm-gold)"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          filter="url(#bm-glow)"
        />

        {/* Bindu glow halo */}
        <circle cx="16" cy="16" r="3" fill="#C5A059" opacity="0.3" filter="url(#bm-bindu-glow)" />
        {/* Bindu main */}
        <circle cx="16" cy="16" r="2" fill="url(#bm-gold)" />
        {/* Bindu inner highlight — pearl quality */}
        <circle cx="15.2" cy="15.2" r="0.7" fill="#fffde0" opacity="0.8" />
      </svg>
    </span>
  );
}
