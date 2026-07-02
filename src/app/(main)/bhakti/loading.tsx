export default function Loading() {
  return (
    <div className="min-h-screen pt-4 pb-28 px-3 max-w-2xl mx-auto">
      {/* Header skeleton */}
      <div className="h-8 w-36 rounded-xl mb-6 animate-pulse"
        style={{ background: 'rgba(200,146,74,0.10)' }} />
      {/* 2-column grid of 6 card skeletons */}
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="h-32 rounded-2xl animate-pulse"
            style={{ background: 'rgba(200,146,74,0.07)' }} />
        ))}
      </div>
    </div>
  );
}
