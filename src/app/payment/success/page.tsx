import { CheckCircle } from 'lucide-react';
import Redirect from './Redirect';

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: Promise<{ sub?: string; plan?: string }>;
}

export default async function PaymentSuccessPage({ searchParams }: Props) {
  const { sub, plan } = await searchParams;
  const isKul = plan === 'kul';

  return (
    <div className="min-h-screen bg-[#FAF6EF] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Checkmark */}
        <div className="flex justify-center">
          <CheckCircle size={64} className="text-[#C5A059]" strokeWidth={1.5} />
        </div>

        {/* Heading */}
        <h1
          className="text-3xl font-bold text-[#1A140E]"
          style={{ fontFamily: 'Georgia, serif' }}
        >
          {isKul ? 'Kul Pro activated' : 'Welcome to Shoonaya Zenith'}
        </h1>

        {/* Body */}
        <p className="text-[#854F0B] text-base leading-relaxed">
          {isKul
            ? 'Your Kul and all its members now have full access. It may take a few seconds to reflect across the app.'
            : 'Your Zenith entitlements are now live. It may take a few seconds to reflect across the app.'}
        </p>

        {/* Sub ID (small) */}
        {sub && (
          <p className="text-xs text-[#1A140E]/30 font-mono">{sub}</p>
        )}

        {/* CTA */}
        <a
          href="/home"
          className="inline-block bg-[#C5A059] text-white px-8 py-3 rounded-2xl font-bold text-sm tracking-wide hover:opacity-90 transition"
        >
          Go to Home
        </a>

        {/* Auto-redirect */}
        <p className="text-xs text-[#1A140E]/40">Redirecting automatically in 3 seconds…</p>
        <Redirect sub={sub ?? ''} />
      </div>
    </div>
  );
}
