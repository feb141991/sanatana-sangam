export default function Loading() {
  return (
    <div className="min-h-screen pt-4 pb-28 px-3 max-w-2xl mx-auto">
      {/* Banner skeleton */}
      <div className="h-32 rounded-2xl mb-5 animate-pulse"
        style={{ background: 'rgba(200,146,74,0.10)' }} />
      {/* Header skeleton */}
      <div className="h-7 w-36 rounded-xl mb-4 animate-pulse"
        style={{ background: 'rgba(200,146,74,0.08)' }} />
      {/* Member row skeletons */}
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="h-16 rounded-2xl mb-3 animate-pulse"
          style={{ background: 'rgba(200,146,74,0.07)' }} />
      ))}
    </div>
  );
}
