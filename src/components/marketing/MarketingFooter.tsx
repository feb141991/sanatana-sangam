import Link from "next/link";

import BrandMark from "@/components/BrandMark";

const footerGroups = [
  {
    title: "Discover",
    links: [
      { href: "/features", label: "Features" },
      { href: "/traditions", label: "Traditions" },
      { href: "/community", label: "Community" },
    ],
  },
  {
    title: "Shoonaya",
    links: [
      { href: "/about", label: "About" },
      { href: "/sources", label: "Sources" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Trust",
    links: [
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
      { href: "/guidelines", label: "Guidelines" },
    ],
  },
] as const;

export function MarketingFooter() {
  return (
    <footer className="border-t border-[var(--card-border)] bg-[var(--surface-soft)]">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:px-10">
        <div>
          <Link
            href="/"
            aria-label="Shoonaya home"
            className="inline-flex min-h-11 items-center gap-3 text-[var(--text-cream)]"
          >
            <BrandMark size="sm" />
            <span className="font-display text-2xl font-semibold">
              Shoonaya
            </span>
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-7 text-[var(--text-muted-warm)]">
            A modern dharmic companion for daily practice, sacred time,
            scripture, family and community across living traditions.
          </p>
          <Link
            href="/beta/android"
            className="mt-6 inline-flex min-h-11 items-center rounded-full bg-[var(--brand-primary)] px-5 text-sm font-semibold text-[var(--surface-base)]"
          >
            Join the Android beta
          </Link>
        </div>

        {footerGroups.map((group) => (
          <div key={group.title}>
            <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-dim)]">
              {group.title}
            </h2>
            <ul className="mt-4 space-y-2">
              {group.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="inline-flex min-h-11 items-center text-sm text-[var(--text-muted-warm)] transition-colors hover:text-[var(--text-cream)]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-[var(--card-border)] px-5 py-5 text-center text-xs text-[var(--text-dim)]">
        © {new Date().getFullYear()} Shoonaya. Ancient foundation, modern
        doorway.
      </div>
    </footer>
  );
}
