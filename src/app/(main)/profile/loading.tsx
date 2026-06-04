export default function Loading() {
  return (
    <div className="min-h-screen pt-4 pb-28 px-3 max-w-2xl mx-auto">
      {/* Avatar skeleton */}
      <div className="flex flex-col items-center mb-6">
        <div className="w-20 h-20 rounded-full mb-3 animate-pulse"
          style={{ background: 'rgba(200,146,74,0.12)' }} />
        <div className="h-5 w-32 rounded-lg mb-2 animate-pulse"
          style={{ background: 'rgba(200,146,74,0.10)' }} />
        <div className="h-4 w-24 rounded-lg animate-pulse"
          style={{ background: 'rgba(200,146,74,0.07)' }} />
      </div>
      {/* Row skeletons */}
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="h-16 rounded-2xl mb-3 animate-pulse"
          style={{ background: 'rgba(200,146,74,0.07)' }} />
      ))}
    </div>
  );
}
