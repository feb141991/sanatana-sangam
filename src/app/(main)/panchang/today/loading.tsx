'use client';

export default function PanchangDetailLoading() {
  return (
    <div className="min-h-screen p-4 space-y-6" style={{ backgroundColor: 'var(--premium-ivory)' }}>
      {/* Header simulation */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl animate-pulse bg-[rgba(200,146,74,0.08)] border border-[rgba(200,160,110,0.15)]" />
        <div className="h-10 w-44 rounded-xl animate-pulse bg-[rgba(200,146,74,0.08)] border border-[rgba(200,160,110,0.15)]" />
      </div>

      {/* Paksha banner */}
      <div className="h-16 rounded-2xl animate-pulse bg-[rgba(200,146,74,0.08)] border border-[rgba(200,160,110,0.15)]" />

      {/* Calendar strip card */}
      <div className="h-44 rounded-2xl animate-pulse bg-[rgba(200,146,74,0.08)] border border-[rgba(200,160,110,0.15)]" />

      {/* Grid details list */}
      <div className="space-y-3">
        <div className="h-12 rounded-xl animate-pulse bg-[rgba(200,146,74,0.08)] border border-[rgba(200,160,110,0.15)]" />
        <div className="h-12 rounded-xl animate-pulse bg-[rgba(200,146,74,0.08)] border border-[rgba(200,160,110,0.15)]" />
        <div className="h-12 rounded-xl animate-pulse bg-[rgba(200,146,74,0.08)] border border-[rgba(200,160,110,0.15)]" />
      </div>
    </div>
  );
}
