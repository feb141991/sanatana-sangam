export default function Loading() {
  return (
    <div className="min-h-screen pt-4 pb-28 px-3 max-w-2xl mx-auto">
      {/* Header skeleton */}
      <div className="h-8 w-44 rounded-xl mb-6 animate-pulse"
        style={{ background: 'rgba(200,146,74,0.10)' }} />
      {/* 5 equal card skeletons */}
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="h-24 rounded-2xl mb-3 animate-pulse"
          style={{ background: 'rgba(200,146,74,0.07)' }} />
      ))}
    </div>
  );
}
