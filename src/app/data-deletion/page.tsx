import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Data Deletion Request | Shoonaya',
  description: 'Request deletion of specific data types or your entire Shoonaya account.',
};

export default function DataDeletionPage() {
  return (
    <main className="min-h-screen bg-[#FDF6E3] text-[#1A0F00] flex flex-col justify-between py-12 px-6 md:px-12 font-sans">
      <div className="max-w-2xl mx-auto w-full my-auto space-y-8">
        {/* Header / Title */}
        <header className="border-b border-[#1A0F00]/10 pb-6">
          <Link href="/" className="inline-block text-xs uppercase tracking-widest text-[#7B1A1A] font-bold mb-4 hover:opacity-85 transition-opacity">
            ← Back to Shoonaya
          </Link>
          <h1 
            style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }} 
            className="text-4xl md:text-5xl font-bold tracking-tight text-[#1A0F00]"
          >
            Data Deletion Request
          </h1>
        </header>

        {/* Section 1: Explanation */}
        <section className="space-y-4">
          <p className="text-base md:text-lg leading-relaxed text-[#1A0F00]/80">
            At Shoonaya, we respect your privacy and give you full control over the personal data generated through your spiritual practice. You can request the deletion of specific types of data associated with your account at any time, without having to delete your account entirely.
          </p>
        </section>

        {/* Section 2: List of deleteable data types */}
        <section className="space-y-4 bg-white/40 border border-[#1A0F00]/5 rounded-2xl p-6 shadow-sm">
          <h2 
            style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }} 
            className="text-2xl font-semibold text-[#1A0F00]"
          >
            Granular Data Deletion Options
          </h2>
          <p className="text-sm text-[#1A0F00]/70">
            You may request to permanently remove any or all of the following data types while keeping your user profile active:
          </p>
          <ul className="grid gap-3 text-sm font-medium mt-2">
            {[
              'Profile details and profile photo',
              'Mandali posts and community content',
              'Tirtha check-ins and saved places',
              'Japa session history',
              'Quiz response history',
              'Mood, sankalpa, Pathshala, and other practice history',
              'Location data from profile',
              'Notification tokens and preferences'
            ].map((item, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <span className="text-[#7B1A1A] text-lg select-none leading-none">•</span>
                <span className="text-[#1A0F00]/95">{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Section 3: Instructions */}
        <section className="space-y-4 border-l-2 border-[#7B1A1A] pl-6 py-1">
          <h2 
            style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }} 
            className="text-2xl font-semibold text-[#1A0F00]"
          >
            How to Request Deletion
          </h2>
          <div className="bg-[#7B1A1A]/5 rounded-xl p-5 border border-[#7B1A1A]/10 space-y-3">
            <p className="text-sm leading-relaxed text-[#1A0F00]/85">
              Email <span className="font-bold underline text-[#7B1A1A]">support@sanatansangam.com</span> with subject line:
            </p>
            <div className="bg-white/80 rounded-lg p-4 font-mono text-xs md:text-sm border border-[#1A0F00]/10 text-center select-all">
              DATA DELETION REQUEST — [your registered email]
            </div>
            <p className="text-xs text-[#1A0F00]/60 italic">
              We will process your request within 30 days. Please specify exactly which data types you wish to have removed.
            </p>
          </div>
        </section>

        {/* Section 4: Link to full account deletion */}
        <section className="space-y-3 bg-[#7B1A1A]/5 rounded-2xl p-6 border border-[#7B1A1A]/10">
          <h2 
            style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }} 
            className="text-xl font-semibold text-[#1A0F00]"
          >
            Full Account Deletion
          </h2>
          <p className="text-sm leading-relaxed text-[#1A0F00]/80">
            If you wish to delete your entire Shoonaya account, including your profile, credentials, and associated practice history, you can start a 30-day cancellable cool-off request from Account Settings.
          </p>
          <div className="pt-2">
            <Link 
              href="/settings" 
              className="inline-flex items-center gap-2 bg-[#7B1A1A] hover:bg-[#601414] text-[#FDF6E3] font-semibold text-sm px-5 py-2.5 rounded-xl transition-all shadow-sm"
            >
              Go to Account Settings
            </Link>
            <p className="text-xs text-[#1A0F00]/50 mt-2">
              Account deletion requires you to log in to verify your identity. You may cancel during the 30-day window; after that period, the account may be permanently removed.
            </p>
          </div>
        </section>

        {/* Section 5: Link back to Privacy Policy */}
        <footer className="border-t border-[#1A0F00]/10 pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-[#1A0F00]/50 font-medium">
          <div>
            © {new Date().getFullYear()} Shoonaya. All rights reserved.
          </div>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-[#7B1A1A] transition-colors underline decoration-[#1A0F00]/20 underline-offset-4">
              Privacy Policy
            </Link>
            <span>•</span>
            <Link href="/terms" className="hover:text-[#7B1A1A] transition-colors underline decoration-[#1A0F00]/20 underline-offset-4">
              Terms & Conditions
            </Link>
          </div>
        </footer>
      </div>
    </main>
  );
}
