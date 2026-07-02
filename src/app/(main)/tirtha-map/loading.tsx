// Instant skeleton shown while tirtha-map/page.tsx boots.
// Eliminates the blank-screen FCP gap (was 3.01s).
export default function TirthaLoading() {
  return (
    <div className="relative -mx-3 min-h-[100dvh] px-3 pb-32 pt-3 sm:-mx-4 sm:px-4 animate-pulse">
      <div className="mx-auto max-w-2xl space-y-4">
        {/* Back + title row */}
        <div className="flex items-center justify-between">
          <div className="h-10 w-10 rounded-full bg-[rgba(197,160,89,0.12)]" />
          <div className="h-6 w-32 rounded-full bg-[rgba(197,160,89,0.10)]" />
        </div>
        {/* Hero card skeleton */}
        <div className="h-52 rounded-[2.2rem] bg-[rgba(197,160,89,0.08)]" />
        {/* Filter chips skeleton */}
        <div className="flex gap-2">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="h-8 w-16 rounded-full bg-[rgba(197,160,89,0.08)]" />
          ))}
        </div>
        {/* Temple list skeletons */}
        {[1,2,3].map(i => (
          <div key={i} className="h-28 rounded-[1.75rem] bg-[rgba(197,160,89,0.07)]" />
        ))}
        {/* Map placeholder skeleton */}
        <div className="h-[285px] rounded-[1.75rem] bg-[rgba(197,160,89,0.06)]" />
      </div>
    </div>
  );
}
