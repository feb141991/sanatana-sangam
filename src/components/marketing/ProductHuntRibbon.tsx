"use client";

import { useState, useEffect } from "react";
import { Sparkles, X, ArrowRight } from "lucide-react";

export function ProductHuntRibbon() {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      const isDismissed = sessionStorage.getItem("ph_ribbon_dismissed_v1");
      if (!isDismissed) {
        setDismissed(false);
      }
    } catch {
      setDismissed(false);
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem("ph_ribbon_dismissed_v1", "true");
    } catch {
      // Ignore storage errors
    }
  };

  if (dismissed) return null;

  return (
    <div
      role="banner"
      aria-label="Product Hunt announcement"
      className="relative z-50 flex items-center justify-between gap-3 px-4 py-2 text-xs sm:text-sm font-medium border-b border-[rgba(255,97,84,0.3)] shadow-sm"
      style={{
        background: "linear-gradient(90deg, #1A1A1A 0%, #2A1F18 50%, #1A1A1A 100%)",
        color: "#F5F5F5",
      }}
    >
      <div className="mx-auto flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center">
        <span className="inline-flex items-center gap-1 rounded-full bg-[#FF6154]/20 text-[#FF6154] px-2 py-0.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider border border-[#FF6154]/40">
          <Sparkles className="size-3 text-[#FF6154]" />
          Product Hunt
        </span>
        <span className="text-stone-200">
          Shoonaya is featured today! Explore our launch &amp; join the conversation:
        </span>
        <a
          href="https://www.producthunt.com/products/shoonaya?embed=true&utm_source=embed&utm_medium=post_embed"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-semibold text-amber-300 hover:text-white underline underline-offset-2 transition-colors ml-1"
        >
          Check it out
          <ArrowRight className="size-3.5" />
        </a>
      </div>

      <button
        onClick={handleDismiss}
        aria-label="Dismiss banner"
        className="shrink-0 rounded-md p-1 text-stone-400 hover:text-white hover:bg-white/10 transition"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
