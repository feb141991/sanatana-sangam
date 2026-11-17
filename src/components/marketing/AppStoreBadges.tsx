import Image from "next/image";
import { OFFICIAL_STORE_LINKS } from "@/config/official-links";

type AppStoreBadgesProps = {
  size?: "sm" | "md";
  showIos?: boolean;
  className?: string;
};

export function AppStoreBadges({
  size = "md",
  showIos = true,
  className = "",
}: AppStoreBadgesProps) {
  const heightClass = size === "sm" ? "h-11" : "h-[52px]";

  return (
    <div className={`flex flex-wrap items-center gap-3 ${className}`}>
      <a
        href={OFFICIAL_STORE_LINKS.googlePlay}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Get Shoonaya on Google Play"
        className="inline-flex min-h-11 items-center rounded-lg transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] focus-visible:ring-offset-2"
      >
        <Image
          src="/badges/google-play-badge.svg"
          alt="Get it on Google Play"
          width={180}
          height={54}
          unoptimized
          className={`${heightClass} w-auto block`}
        />
      </a>

      {showIos && (
        <div
          role="status"
          aria-label="iOS App Store coming soon"
          className={`inline-flex ${heightClass} min-h-11 items-center gap-2.5 rounded-lg border border-[var(--card-border)] bg-[var(--surface-soft)] px-4 text-[var(--text-muted-warm)] select-none`}
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="size-5 shrink-0 fill-current opacity-75"
          >
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.33c.64-.78 1.08-1.86.96-2.94-.93.04-2.06.62-2.72 1.4-.58.68-1.1 1.79-.96 2.84 1.04.08 2.08-.52 2.72-1.3" />
          </svg>
          <div className="leading-tight text-left">
            <span className="block text-[9px] font-semibold uppercase tracking-[0.12em] text-[var(--text-dim)]">
              iOS App Store
            </span>
            <span className="block text-xs font-semibold text-[var(--text-cream)]">
              Coming Soon
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
