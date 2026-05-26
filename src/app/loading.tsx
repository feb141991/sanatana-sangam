'use client';

import BrandMark from '@/components/BrandMark';

// Next.js removes this component automatically when the page is ready to render.
// Do NOT add a self-fade timer here — doing so makes the loading UI invisible
// while the page is still streaming, leaving the user on a blank screen.
export default function Loading() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#0E0E0F]">
      <div className="loading-pulse">
        <BrandMark size="lg" />
      </div>
      <div className="mt-4 text-[11px] uppercase tracking-[0.3em] text-[#C5A059]/40">
        Shoonaya
      </div>
    </div>
  );
}
