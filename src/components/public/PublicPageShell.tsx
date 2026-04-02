import Link from 'next/link';
import type { ReactNode } from 'react';
import BrandMark from '@/components/BrandMark';

type PublicPageShellProps = {
  eyebrow: string;
  title: string;
  intro: string;
  children: ReactNode;
  asideTitle?: string;
  asideBody?: string;
};

const footerLinks = [
  { href: '/about', label: 'About' },
  { href: '/privacy', label: 'Privacy' },
  { href: '/terms', label: 'Terms' },
  { href: '/guidelines', label: 'Guidelines' },
  { href: '/contact', label: 'Contact' },
];

export default function PublicPageShell({
  eyebrow,
  title,
  intro,
  children,
  asideTitle = 'Launch Trust Layer',
  asideBody = 'These pages define how Sanatana Sangam handles privacy, conduct, safety, and support as the product moves toward public launch.',
}: PublicPageShellProps) {
  return (
    <main className="min-h-screen px-4 py-6 md:py-10">
      <div className="max-w-6xl mx-auto space-y-6">
        <nav className="glass-panel-strong rounded-[1.85rem] px-4 py-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <Link href="/" className="flex items-center gap-2 text-gray-900">
            <BrandMark size="sm" />
            <span className="font-display font-bold text-lg">
              Sanatana <span className="text-gradient">Sangam</span>
            </span>
          </Link>
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
            {footerLinks.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-gray-900 transition-colors">
                {link.label}
              </Link>
            ))}
            <Link href="/signup" className="glass-button-primary px-4 py-2 rounded-full text-white font-semibold">
              Join Free
            </Link>
          </div>
        </nav>

        <section className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
          <article className="glass-panel-strong rounded-[2rem] p-6 md:p-8">
            <p className="text-xs uppercase tracking-[0.24em] text-[#7B1A1A]/75 mb-4">{eyebrow}</p>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-4">
              {title}
            </h1>
            <p className="text-gray-600 leading-relaxed max-w-3xl">{intro}</p>

            <div className="mt-8 space-y-6 text-sm leading-7 text-gray-700">
              {children}
            </div>
          </article>

          <aside className="space-y-4">
            <div className="glass-panel rounded-[1.75rem] p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-[#7B1A1A]/70 mb-2">Why This Matters</p>
              <h2 className="font-display text-2xl font-bold text-gray-900 mb-3">{asideTitle}</h2>
              <p className="text-sm text-gray-600 leading-relaxed">{asideBody}</p>
            </div>

            <div className="glass-panel rounded-[1.75rem] p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-[#7B1A1A]/70 mb-3">Quick Links</p>
              <div className="flex flex-col gap-2">
                <Link href="/signup" className="glass-button-primary rounded-2xl px-4 py-3 text-white text-sm font-semibold text-center">
                  Create Your Account
                </Link>
                <Link href="/vichaar-sabha" className="glass-button-secondary rounded-2xl px-4 py-3 text-[#7B1A1A] text-sm font-semibold text-center">
                  Explore as Guest
                </Link>
                <Link href="/contact" className="glass-button-secondary rounded-2xl px-4 py-3 text-[#7B1A1A] text-sm font-semibold text-center">
                  Contact Support
                </Link>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
