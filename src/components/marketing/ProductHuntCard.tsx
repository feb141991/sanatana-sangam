import Image from "next/image";

interface ProductHuntCardProps {
  className?: string;
  theme?: "warm" | "light";
}

export function ProductHuntCard({
  className = "",
  theme = "warm",
}: ProductHuntCardProps) {
  const isWarm = theme === "warm";

  return (
    <div
      className={`relative w-full max-w-[500px] rounded-2xl p-5 transition-all duration-300 card-lift ${
        isWarm
          ? "border border-[var(--card-border)] bg-[var(--surface-soft)] shadow-sm hover:border-[var(--brand-primary)]/40"
          : "border border-stone-200 bg-white shadow-md text-stone-900"
      } ${className}`}
      style={{
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04)",
      }}
    >
      <div className="flex items-center gap-3.5 mb-3.5 text-left">
        <div className="relative size-16 shrink-0 overflow-hidden rounded-xl border border-[var(--card-border)] bg-stone-900 shadow-sm">
          <Image
            alt="Shoonaya"
            src="/icons/icon-192x192.png"
            width={64}
            height={64}
            className="size-full object-cover"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="m-0 text-lg font-bold font-display text-[var(--text-cream)] tracking-tight truncate">
              Shoonaya
            </h3>
            <span className="inline-flex items-center rounded-full bg-[#FF6154]/10 text-[#FF6154] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide border border-[#FF6154]/25">
              Product Hunt
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-[var(--text-muted-warm)] line-clamp-2 leading-relaxed">
            Meditation and spiritual learning for everyday life
          </p>
        </div>
      </div>

      <div className="pt-2.5 border-t border-[var(--card-border)]/60 flex items-center justify-between gap-3">
        <span className="text-[11px] text-[var(--text-dim)] font-medium hidden sm:inline">
          Official Community Launch
        </span>
        <a
          href="https://www.producthunt.com/products/shoonaya?embed=true&utm_source=embed&utm_medium=post_embed"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#FF6154] hover:bg-[#e05347] text-white text-xs sm:text-sm font-semibold rounded-full shadow-sm hover:shadow transition-all duration-200 active:scale-95 ml-auto"
        >
          Check it out on Product Hunt
          <span aria-hidden="true">→</span>
        </a>
      </div>
    </div>
  );
}
