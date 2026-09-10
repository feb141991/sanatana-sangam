"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Menu, Moon, Sun, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type HTMLAttributes, type ReactNode } from "react";

import BrandMark from "@/components/BrandMark";
import { useThemePreference } from "@/components/providers/ThemeProvider";
import { cn } from "@/lib/utils";

type NotchNavItem = {
  href: string;
  label: string;
};

type NotchNavbarProps = HTMLAttributes<HTMLElement> & {
  logo?: ReactNode;
  items: readonly NotchNavItem[];
  cta: NotchNavItem;
  showThemeToggle?: boolean;
};

function ThemeToggle() {
  const { resolvedTheme, setPreference } = useThemePreference();
  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setPreference(isDark ? "light" : "dark")}
      className="flex size-11 items-center justify-center rounded-full text-[var(--text-muted-warm)] transition-colors hover:bg-[var(--brand-primary-soft)] hover:text-[var(--text-cream)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]"
      aria-label={`Use ${isDark ? "light" : "dark"} theme`}
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  );
}

export function NotchNavbar({
  className,
  logo,
  items,
  cta,
  showThemeToggle = false,
  ...props
}: NotchNavbarProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 flex h-20 items-start px-3 md:px-6",
          className,
        )}
        {...props}
      >
        <div className="mx-auto flex h-16 w-full max-w-[90rem] items-center rounded-b-[2rem] border-x border-b border-[var(--card-border)] bg-[var(--surface-raised)]/95 px-4 shadow-[var(--shadow-soft)] backdrop-blur-xl md:px-6">
          <Link
            href="/"
            className="flex min-h-11 shrink-0 items-center gap-2 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]"
            aria-label="Shoonaya home"
          >
            {logo ?? <BrandMark size="sm" />}
            <span className="hidden font-display text-xl font-semibold tracking-tight text-[var(--text-cream)] sm:inline">
              Shoonaya
            </span>
          </Link>

          <nav
            className="mx-auto hidden items-center gap-1 lg:flex"
            aria-label="Primary navigation"
          >
            {items.map((item) => {
              const targetPath = item.href.split("#")[0];
              const isCurrent =
                targetPath === "/"
                  ? pathname === "/"
                  : pathname.startsWith(targetPath);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isCurrent ? "page" : undefined}
                  className={cn(
                    "flex min-h-11 items-center rounded-full px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]",
                    isCurrent
                      ? "bg-[var(--brand-primary-soft)] text-[var(--text-cream)]"
                      : "text-[var(--text-muted-warm)] hover:text-[var(--text-cream)]",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            {showThemeToggle && <ThemeToggle />}
            <Link
              href={cta.href}
              className="hidden min-h-11 items-center gap-2 rounded-full bg-[var(--brand-primary)] px-5 text-sm font-semibold text-[var(--surface-base)] shadow-sm transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] focus-visible:ring-offset-2 sm:flex"
            >
              {cta.label}
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </Link>
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((open) => !open)}
              className="flex size-11 items-center justify-center rounded-full text-[var(--text-cream)] transition-colors hover:bg-[var(--brand-primary-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] lg:hidden"
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              aria-controls="notch-navbar-mobile-menu"
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? (
                <X className="size-5" />
              ) : (
                <Menu className="size-5" />
              )}
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            id="notch-navbar-mobile-menu"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-3 top-[4.75rem] z-40 rounded-3xl border border-[var(--card-border)] bg-[var(--surface-raised)] p-3 shadow-[var(--shadow-strong)] lg:hidden"
          >
            <nav className="flex flex-col" aria-label="Mobile navigation">
              {items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex min-h-12 items-center rounded-2xl px-4 font-medium text-[var(--text-cream)] transition-colors hover:bg-[var(--brand-primary-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href={cta.href}
                className="mt-2 flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[var(--brand-primary)] px-4 font-semibold text-[var(--surface-base)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {cta.label}
                <ArrowUpRight className="size-4" aria-hidden="true" />
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export type { NotchNavbarProps, NotchNavItem };
