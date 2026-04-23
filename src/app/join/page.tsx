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
        <h1 className="font-display text-3xl font-bold text-[color:var(--text-cream)] mb-3">
          Join Sanatana Sangam
        </h1>
        <p className="text-sm text-[color:var(--brand-muted)] leading-relaxed mb-6">
          A friend has invited you to explore community, scriptures, bhakti, and local sangam.
        </p>

        <div className="hidden sm:flex flex-wrap justify-center gap-2 mb-6">
          {['Invitation-led', 'Guest access available', 'Join free'].map((item) => (
            <span
              key={item}
              className="rounded-full border  px-3 py-1 text-xs font-medium text-[color:var(--text-muted-warm)]"
            >
              {item}
            </span>
          ))}
        </div>

        <div className="hidden sm:grid gap-3 mb-6">
          {[
            {
              eyebrow: 'Join',
              title: 'Enter with a real invitation',
              description: 'Your invite code carries you into signup without making the first step feel cold or generic.',
            },
            {
              eyebrow: 'Explore first',
              title: 'You can still look around gently',
              description: 'If you are not ready yet, the app still offers guest access before you create an account.',
            },
          ].map((item) => (
            <div key={item.title} className="glass-panel rounded-[1.35rem] px-4 py-4 text-left">
              <p className="text-[10px] uppercase tracking-[0.18em] font-semibold text-[#7B1A1A]">{item.eyebrow}</p>
              <p className="font-semibold text-[color:var(--text-cream)] mt-2">{item.title}</p>
              <p className="text-sm text-[color:var(--brand-muted)] mt-2 leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>

        {ref && (
          <div className="glass-panel rounded-2xl px-4 py-3 mb-6">
            <p className="text-xs text-[color:var(--brand-muted)] mb-1">Invite code</p>
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
          <Link
            href="/guest"
            className="glass-button-secondary block w-full rounded-2xl px-5 py-3 text-sm font-semibold text-[color:var(--brand-muted)]"
          >
            Explore as guest first
          </Link>
        </div>
      </div>
    </main>
  );
}
