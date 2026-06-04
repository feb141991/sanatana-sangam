export function Shimmer({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-2xl ${className}`}
      style={{ background: 'rgba(200,146,74,0.08)' }}
    />
  );
}
