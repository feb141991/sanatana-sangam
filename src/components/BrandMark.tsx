import { cn } from '@/lib/utils';

type BrandMarkProps = {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
};

const sizeMap = {
  sm: 32,
  md: 40,
  lg: 56,
} as const;

const radiusMap = {
  sm: 14,
  md: 18,
  lg: 22,
} as const;

/**
 * Shankha (sacred conch) brand mark.
 * The shankha is one of the four attributes of Vishnu and is used
 * at the opening of puja across all Sanatana dharmic traditions.
 */
export default function BrandMark({ className, size = 'md' }: BrandMarkProps) {
  const px = sizeMap[size];
  const rx = radiusMap[size];

  return (
    <span
      aria-hidden="true"
      className={cn(
        'brand-mark-pulse relative inline-flex items-center justify-center overflow-hidden border border-white/50 shadow-[0_8px_24px_rgba(108,56,36,0.28),inset_0_1px_0_rgba(255,255,255,0.22)]',
        className,
      )}
      style={{
        width:  px,
        height: px,
        borderRadius: rx,
        background: 'linear-gradient(145deg, rgba(34,22,8,0.96), rgba(68,40,12,0.92))',
        flexShrink: 0,
      }}
    >
      {/* Shankha SVG — hand-tuned to sit centred at each size */}
      <svg
        viewBox="0 0 24 24"
        width={px * 0.62}
        height={px * 0.62}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ filter: 'drop-shadow(0 0 3px rgba(212,168,24,0.55))' }}
      >
        {/* Conch body */}
        <path
          d="M12 3C9.2 3 7 5.0 7 7.5c0 1.4.6 2.7 1.6 3.6L7.5 13H9l.5-1.5c.8.3 1.6.5 2.5.5s1.7-.2 2.5-.5L15 13h1.5l-1.1-1.9C16.4 10.2 17 8.9 17 7.5 17 5.0 14.8 3 12 3z"
          fill="url(#sg)"
          opacity="0.95"
        />
        {/* Conch tip / spire */}
        <path
          d="M12 3 C13.5 3 15 4 15.5 5.2 C14.5 4.5 13.3 4.1 12 4.1 C10.7 4.1 9.5 4.5 8.5 5.2 C9 4 10.5 3 12 3Z"
          fill="#fff8e1"
          opacity="0.6"
        />
        {/* Handle / stem */}
        <path
          d="M10.2 13 L10 17 Q10 19 12 19 Q14 19 14 17 L13.8 13"
          stroke="url(#sg)"
          strokeWidth="1.6"
          strokeLinecap="round"
          fill="none"
          opacity="0.9"
        />
        {/* Mouth rim */}
        <ellipse cx="12" cy="13" rx="2.5" ry="0.8"
          fill="url(#sg)" opacity="0.7" />
        {/* Spiral lines on body */}
        <path
          d="M9 8.5 Q11 7.5 14.5 9"
          stroke="#fce38a"
          strokeWidth="0.7"
          strokeLinecap="round"
          fill="none"
          opacity="0.55"
        />
        <path
          d="M9.5 10 Q11.5 9.2 14 10.5"
          stroke="#fce38a"
          strokeWidth="0.55"
          strokeLinecap="round"
          fill="none"
          opacity="0.4"
        />
        {/* Glow dot at tip */}
        <circle cx="12" cy="3.4" r="0.7" fill="#fff8e1" opacity="0.7" />
        <defs>
          <linearGradient id="sg" x1="7" y1="3" x2="17" y2="19" gradientUnits="userSpaceOnUse">
            <stop offset="0%"  stopColor="#f0c040" />
            <stop offset="55%" stopColor="#d4a818" />
            <stop offset="100%" stopColor="#a07010" />
          </linearGradient>
        </defs>
      </svg>
    </span>
  );
}
