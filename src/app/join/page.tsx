import Link from 'next/link';
import BrandMark from '@/components/BrandMark';

export default async function JoinPage({
  searchParams,
}: {
  searchParams?: Promise<{ ref?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const ref = typeof resolvedSearchParams?.ref === 'string'
    ? resolvedSearchParams.ref.trim().toUpperCase()
    : '';
  const signupHref = ref ? `/signup?ref=${encodeURIComponent(ref)}` : '/signup';

  return (
    <main className="min-h-screen px-4 py-12 flex items-center justify-center">
      <div className="w-full max-w-md glass-panel-strong rounded-[2rem] p-8 text-center">
        <BrandMark size="lg" className="mx-auto mb-4" />
        <p className="text-xs uppercase tracking-[0.24em] text-[#7B1A1A]/70 mb-3">Invitation</p>
        <h1 className="font-display text-3xl font-bold text-gray-900 mb-3">
          Join Sanatana Sangam
        </h1>
        <p className="text-sm text-gray-600 leading-relaxed mb-6">
          A friend has invited you to explore community, scriptures, bhakti, and local sangam.
        </p>

        {ref && (
          <div className="glass-panel rounded-2xl px-4 py-3 mb-6">
            <p className="text-xs text-gray-500 mb-1">Invite code</p>
            <p className="font-display text-2xl font-bold tracking-[0.22em] text-[#7B1A1A]">{ref}</p>
          </div>
        )}

        <div className="space-y-3">
          <Link
            href={signupHref}
            className="glass-button-primary block w-full rounded-2xl px-5 py-3 text-sm font-semibold text-white"
          >
            Continue to Signup
          </Link>
          <Link
            href="/login"
            className="glass-button-secondary block w-full rounded-2xl px-5 py-3 text-sm font-semibold text-[#7B1A1A]"
          >
            I already have an account
          </Link>
        </div>
      </div>
    </main>
  );
}
