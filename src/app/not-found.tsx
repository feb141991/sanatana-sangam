import Link from 'next/link';
import BrandMark from '@/components/BrandMark';

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
      style={{ background: 'var(--bg-primary, #1A110A)' }}
    >
      {/* Brand mark */}
      <Link href="/" aria-label="Back to Shoonaya home">
        <BrandMark size="lg" className="mb-6" />
      </Link>

      {/* Sacred number */}
      <p
        className="text-8xl font-bold mb-2 select-none"
        style={{
          background: 'linear-gradient(135deg, #f5d070 0%, #C5A059 50%, #8a6520 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          fontFamily: 'var(--font-cormorant, Georgia, serif)',
          lineHeight: 1,
        }}
      >
        404
      </p>

      {/* Tagline */}
      <h1
        className="text-2xl font-semibold mb-3"
        style={{ color: 'var(--text-cream, #ede8de)', fontFamily: 'var(--font-cormorant, Georgia, serif)' }}
      >
        शून्यता — This path leads nowhere
      </h1>
      <p
        className="text-sm max-w-xs mb-8 leading-relaxed"
        style={{ color: 'var(--brand-muted, #b0aa9e)' }}
      >
        The page you seek has dissolved into the void. Perhaps it was moved, renamed, or never existed — much like the ego.
      </p>

      {/* CTA */}
      <Link
        href="/home"
        className="inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-semibold transition-opacity hover:opacity-80"
        style={{
          background: 'linear-gradient(135deg, #C5A059, #8a6520)',
          color: '#1A110A',
        }}
      >
        Return to your sadhana
      </Link>

      {/* Secondary link */}
      <Link
        href="/"
        className="mt-4 text-xs underline underline-offset-4 hover:opacity-70 transition-opacity"
        style={{ color: 'var(--brand-muted, #b0aa9e)' }}
      >
        Or go to the landing page
      </Link>
    </div>
  );
}
