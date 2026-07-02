'use client';

export default function PanchangHubLoading() {
  return (
    <div className="min-h-screen p-4 space-y-6" style={{ backgroundColor: 'var(--premium-ivory)' }}>
      {/* Sticky top bar simulation */}
      <div className="h-14 rounded-xl animate-pulse bg-[rgba(200,146,74,0.08)] border border-[rgba(200,160,110,0.15)]" />
      
      {/* 3 stacked cards */}
      <div className="space-y-4 max-w-lg mx-auto">
        <div className="h-32 rounded-2xl animate-pulse bg-[rgba(200,146,74,0.08)] border border-[rgba(200,160,110,0.15)]" />
        <div className="h-32 rounded-2xl animate-pulse bg-[rgba(200,146,74,0.08)] border border-[rgba(200,160,110,0.15)]" />
        <div className="h-32 rounded-2xl animate-pulse bg-[rgba(200,146,74,0.08)] border border-[rgba(200,160,110,0.15)]" />
      </div>

      {/* Facts strip */}
      <div className="flex gap-2 max-w-lg mx-auto overflow-hidden">
        <div className="h-8 w-24 rounded-full animate-pulse bg-[rgba(200,146,74,0.08)] border border-[rgba(200,160,110,0.15)]" />
        <div className="h-8 w-28 rounded-full animate-pulse bg-[rgba(200,146,74,0.08)] border border-[rgba(200,160,110,0.15)]" />
        <div className="h-8 w-24 rounded-full animate-pulse bg-[rgba(200,146,74,0.08)] border border-[rgba(200,160,110,0.15)]" />
      </div>
    </div>
  );
}
