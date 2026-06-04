'use client';

export default function KundaliLoading() {
  return (
    <div className="min-h-screen p-4 space-y-6" style={{ backgroundColor: 'var(--premium-ivory)' }}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl animate-pulse bg-[rgba(200,146,74,0.08)] border border-[rgba(200,160,110,0.15)]" />
        <div className="h-10 w-32 rounded-xl animate-pulse bg-[rgba(200,146,74,0.08)] border border-[rgba(200,160,110,0.15)]" />
      </div>

      {/* Main card form */}
      <div className="rounded-2xl p-5 border bg-white border-[rgba(200,160,110,0.15)] space-y-4 shadow-sm">
        <div className="h-12 w-2/3 mx-auto rounded-xl animate-pulse bg-[rgba(200,146,74,0.08)]" />
        <div className="h-10 rounded-xl animate-pulse bg-[rgba(200,146,74,0.08)]" />
        <div className="grid grid-cols-2 gap-2">
          <div className="h-10 rounded-xl animate-pulse bg-[rgba(200,146,74,0.08)]" />
          <div className="h-10 rounded-xl animate-pulse bg-[rgba(200,146,74,0.08)]" />
        </div>
        <div className="h-10 rounded-xl animate-pulse bg-[rgba(200,146,74,0.08)]" />
        <div className="h-12 rounded-xl animate-pulse bg-[rgba(200,146,74,0.08)]" />
      </div>
    </div>
  );
}
