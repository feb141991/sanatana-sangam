"use client";

import { useState } from "react";
import Image from "next/image";
import { getFestivalEmblem } from "@/lib/festival-emblems";

export interface FestivalEmblemProps {
  slug: string;
  name?: string;
  tradition?: string;
  fallbackEmoji?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const SIZE_MAP = {
  sm: {
    container: "size-9 rounded-xl",
    image: 24,
    glyph: "text-base",
  },
  md: {
    container: "size-12 rounded-2xl",
    image: 32,
    glyph: "text-xl",
  },
  lg: {
    container: "size-16 rounded-[1.25rem]",
    image: 44,
    glyph: "text-2xl",
  },
  xl: {
    container: "size-24 rounded-[2rem]",
    image: 68,
    glyph: "text-4xl",
  },
};

export function FestivalEmblem({
  slug,
  name,
  tradition,
  fallbackEmoji,
  size = "md",
  className = "",
}: FestivalEmblemProps) {
  const [hasError, setHasError] = useState(false);
  const emblem = getFestivalEmblem(slug, tradition);
  const config = SIZE_MAP[size] || SIZE_MAP.md;

  return (
    <div
      className={`relative flex shrink-0 items-center justify-center border border-[var(--brand-primary)]/35 bg-gradient-to-b from-[var(--surface-soft)] to-[var(--card-bg)] shadow-[0_4px_16px_rgba(216,138,28,0.12)] transition-transform duration-300 group-hover:scale-105 ${config.container} ${className}`}
      title={emblem.name || name}
      aria-label={emblem.name || name}
    >
      {/* Subtle warm devotional background aura */}
      <span
        className="pointer-events-none absolute inset-0 rounded-[inherit] bg-[radial-gradient(circle_at_50%_35%,rgba(216,138,28,0.18),transparent_70%)]"
        aria-hidden="true"
      />

      {!hasError ? (
        <Image
          src={emblem.relicSrc}
          alt={emblem.name || name || "Sacred Festival Emblem"}
          width={config.image}
          height={config.image}
          className="relative object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)] transition-transform duration-200"
          onError={() => setHasError(true)}
          priority={size === "xl"}
        />
      ) : (
        <span
          className={`relative font-serif font-bold text-[var(--brand-primary-strong)] drop-shadow-sm select-none ${config.glyph}`}
          aria-hidden="true"
        >
          {emblem.sacredGlyph || fallbackEmoji || "🪔"}
        </span>
      )}
    </div>
  );
}
