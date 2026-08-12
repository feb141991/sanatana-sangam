import Image from 'next/image';
import { cn } from '@/lib/utils';

type BrandMarkProps = {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
};

const sizeMap   = { sm: 32, md: 40, lg: 56 } as const;
const radiusMap = { sm: 12, md: 14, lg: 18 } as const;

/**
 * Shoonaya brand mark — the golden gate/threshold icon (icon-192x192.png,
 * derived from public/icons/shoonaya-mark.png). Matches the mark landing.html's
 * own nav already uses (`.nav-logo-mark` — rounded square, object-cover,
 * matching shadow treatment), so every entry point renders one consistent mark.
 */
export default function BrandMark({ className, size = 'md' }: BrandMarkProps) {
  const px = sizeMap[size];
  const rx = radiusMap[size];

  return (
    <span
      className={cn(
        'relative inline-block overflow-hidden shrink-0',
        'shadow-[0_8px_22px_rgba(15,111,128,0.12)]',
        className,
      )}
      style={{ width: px, height: px, borderRadius: rx }}
    >
      <Image
        src="/icons/icon-192x192.png"
        alt="Shoonaya"
        width={px}
        height={px}
        className="object-cover w-full h-full"
        priority
      />
    </span>
  );
}
