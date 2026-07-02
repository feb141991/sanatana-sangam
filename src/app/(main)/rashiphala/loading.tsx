'use client';

export default function RashiphalaLoading() {
  return (
    <div className="min-h-screen p-4 space-y-6" style={{ backgroundColor: 'var(--premium-ivory)' }}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl animate-pulse bg-[rgba(200,146,74,0.08)] border border-[rgba(200,160,110,0.15)]" />
        <div className="h-10 w-36 rounded-xl animate-pulse bg-[rgba(200,146,74,0.08)] border border-[rgba(200,160,110,0.15)]" />
      </div>

      {/* Rashi selector row */}
      <div className="flex gap-2 overflow-hidden">
        <div className="h-16 w-16 rounded-2xl animate-pulse bg-[rgba(200,146,74,0.08)] border border-[rgba(200,160,110,0.15)] flex-shrink-0" />
        <div className="h-16 w-16 rounded-2xl animate-pulse bg-[rgba(200,146,74,0.08)] border border-[rgba(200,160,110,0.15)] flex-shrink-0" />
        <div className="h-16 w-16 rounded-2xl animate-pulse bg-[rgba(200,146,74,0.08)] border border-[rgba(200,160,110,0.15)] flex-shrink-0" />
        <div className="h-16 w-16 rounded-2xl animate-pulse bg-[rgba(200,146,74,0.08)] border border-[rgba(200,160,110,0.15)] flex-shrink-0" />
      </div>

      {/* Main card */}
      <div className="h-48 rounded-2xl animate-pulse bg-[rgba(200,146,74,0.08)] border border-[rgba(200,160,110,0.15)]" />

      {/* Grid highlights */}
      <div className="space-y-3">
        <div className="h-20 rounded-2xl animate-pulse bg-[rgba(200,146,74,0.08)] border border-[rgba(200,160,110,0.15)]" />
        <div className="h-20 rounded-2xl animate-pulse bg-[rgba(200,146,74,0.08)] border border-[rgba(200,160,110,0.15)]" />
      </div>
    </div>
  );
}
