"use client";

import {
  useState,
  type ComponentType,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import Link from "next/link";
import {
  Home,
  User,
  Calendar,
  Zap,
  CreditCard,
  Menu,
  X,
  Sun,
  Moon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import BrandMark from "@/components/BrandMark";
import { useThemePreference } from "@/components/providers/ThemeProvider";
import { motion, AnimatePresence } from "framer-motion";

// Helper component for navigation links
const NavLink = ({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: ComponentType<{ className?: string }>;
  label: string;
}) => (
  <Link
    href={href}
    className="group flex min-h-11 items-center gap-1.5 whitespace-nowrap px-1 text-sm font-medium text-[var(--text-muted-warm)] transition-colors hover:text-[var(--text-cream)]"
  >
    <Icon className="w-4 h-4 opacity-70 group-hover:opacity-100" />
    <span>{label}</span>
  </Link>
);

const NotchThemeToggle = () => {
  const { resolvedTheme, setPreference } = useThemePreference();
  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setPreference(isDark ? "light" : "dark")}
      className="flex h-11 w-11 items-center justify-center rounded-full text-[var(--text-muted-warm)] transition-colors hover:bg-[var(--brand-primary-soft)] hover:text-[var(--text-cream)]"
      aria-label="Toggle theme"
    >
      {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );
};

type NotchNavbarProps = HTMLAttributes<HTMLElement> & { logo?: ReactNode };

export function NotchNavbar({ className, logo, ...props }: NotchNavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Navigation items configuration
  const items = {
    left: [
      { label: "Home", href: "#home", icon: Home },
      { label: "About", href: "#about", icon: User },
      { label: "Events", href: "#events", icon: Calendar },
    ],
    right: [
      { label: "Sponsors", href: "#sponsors", icon: Zap },
      { label: "Pricing", href: "#pricing", icon: CreditCard },
    ],
  };

  return (
    <>
      <header
        className={cn("fixed top-0 inset-x-0 z-50 h-16 flex px-0", className)}
        {...props}
      >
        {/* Left Side Bar - Flexible width */}
        <div className="relative z-20 h-10 min-w-0 flex-1 bg-[var(--surface-raised)]">
          <svg
            className="absolute inset-0 w-full h-full"
            preserveAspectRatio="none"
          >
            <line
              x1="0"
              y1="39.5"
              x2="100%"
              y2="39.5"
              stroke="currentColor"
              strokeOpacity={0.05}
              strokeWidth={0.5}
              className="text-[var(--text-cream)]"
            />
            <line
              x1="0"
              y1="36.5"
              x2="100%"
              y2="36.5"
              stroke="currentColor"
              strokeOpacity={0.05}
              strokeWidth={0.5}
              className="text-[var(--text-cream)]"
            />
          </svg>
        </div>

        {/* Responsive Notch Container - 3 Slices */}
        <div className="flex h-16 relative z-10 shrink-0 -ml-px">
          {/* Left Slice (Corner) */}
          <div className="w-[50px] h-full relative shrink-0">
            {/* Glass Background */}
            <div
              className="absolute inset-0 bg-[var(--surface-raised)]"
              style={{ clipPath: "path('M0 0 H50 V64 C25 64 25 40 0 40 Z')" }}
            />
            {/* Outlines */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox="0 0 50 64"
            >
              <path
                d="M0 39.5 C25 39.5 25 63.5 50 63.5"
                fill="none"
                stroke="currentColor"
                strokeOpacity={0.05}
                strokeWidth={0.5}
                className="text-[var(--text-cream)]"
              />
              <path
                d="M0 36.5 C25 36.5 25 60.5 50 60.5"
                fill="none"
                stroke="currentColor"
                strokeOpacity={0.05}
                strokeWidth={0.5}
                className="text-[var(--text-cream)]"
              />
            </svg>
          </div>

          {/* Center Slice (Flexible Content Area) */}
          <div className="flex-1 h-full relative min-w-0 -ml-px">
            {/* Background & Lines Layer */}
            <div className="absolute inset-0 bg-[var(--surface-raised)]">
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                preserveAspectRatio="none"
              >
                <line
                  x1="0"
                  y1="63.5"
                  x2="100%"
                  y2="63.5"
                  stroke="currentColor"
                  strokeOpacity={0.05}
                  strokeWidth={0.5}
                  className="text-[var(--text-cream)]"
                />
                <line
                  x1="0"
                  y1="60.5"
                  x2="100%"
                  y2="60.5"
                  stroke="currentColor"
                  strokeOpacity={0.05}
                  strokeWidth={0.5}
                  className="text-[var(--text-cream)]"
                />
              </svg>
            </div>

            {/* Content Layer */}
            <div className="relative w-full h-full flex items-end justify-between pb-2 px-4 md:px-8">
              {/* Desktop Left Nav */}
              <nav className="hidden md:flex gap-8 mb-1 shrink-0">
                {items.left.map((item) => (
                  <NavLink key={item.label} {...item} />
                ))}
              </nav>

              {/* Mobile Menu Button (Left) */}
              <button
                type="button"
                className="mb-1 flex h-11 w-11 items-center justify-center text-[var(--text-muted-warm)] transition-colors hover:text-[var(--text-cream)] md:hidden"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Toggle menu"
                aria-controls="notch-navbar-mobile-menu"
                aria-expanded={isMobileMenuOpen}
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>

              {/* Logo (Center) */}
              <div className="flex justify-center shrink-0 mx-2 md:mx-4 mt-1">
                {logo || (
                  <Link
                    href="/"
                    className="flex items-center justify-center relative group"
                  >
                    <BrandMark
                      size="sm"
                      className="relative z-10 transition-transform group-hover:scale-105"
                    />
                  </Link>
                )}
              </div>

              {/* Desktop Right Nav */}
              <nav className="hidden md:flex gap-6 items-center shrink-0">
                {items.right.map((item) => (
                  <NavLink key={item.label} {...item} />
                ))}

                <div className="flex shrink-0 items-center gap-4 border-l border-[var(--card-border)] pl-4">
                  <NotchThemeToggle />
                  <Link
                    href="/login"
                    className="flex min-h-11 items-center whitespace-nowrap text-sm font-medium text-[var(--text-muted-warm)] transition-colors hover:text-[var(--text-cream)]"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/signup"
                    className="flex min-h-11 items-center whitespace-nowrap rounded-2xl bg-[var(--brand-primary)] px-3 text-sm font-medium text-[var(--surface-base)] shadow-sm transition-opacity hover:opacity-90"
                  >
                    Sign up
                  </Link>
                </div>
              </nav>

              {/* Mobile Right Actions */}
              <div className="md:hidden flex items-center gap-2 mb-1">
                <NotchThemeToggle />
              </div>
            </div>
          </div>

          {/* Right Slice (Corner) */}
          <div className="w-[50px] h-full relative shrink-0 -ml-px">
            {/* Glass Background */}
            <div
              className="absolute inset-0 bg-[var(--surface-raised)]"
              style={{ clipPath: "path('M0 0 H50 V40 C25 40 25 64 0 64 Z')" }}
            />
            {/* Outlines */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox="0 0 50 64"
            >
              <path
                d="M0 63.5 C25 63.5 25 39.5 50 39.5"
                fill="none"
                stroke="currentColor"
                strokeOpacity={0.05}
                strokeWidth={0.5}
                className="text-[var(--text-cream)]"
              />
              <path
                d="M0 60.5 C25 60.5 25 36.5 50 36.5"
                fill="none"
                stroke="currentColor"
                strokeOpacity={0.05}
                strokeWidth={0.5}
                className="text-[var(--text-cream)]"
              />
            </svg>
          </div>
        </div>

        {/* Right Side Bar - Flexible width */}
        <div className="relative z-20 -ml-px h-10 min-w-0 flex-1 bg-[var(--surface-raised)]">
          <svg
            className="absolute inset-0 w-full h-full"
            preserveAspectRatio="none"
          >
            <line
              x1="0"
              y1="39.5"
              x2="100%"
              y2="39.5"
              stroke="currentColor"
              strokeOpacity={0.05}
              strokeWidth={0.5}
              className="text-[var(--text-cream)]"
            />
            <line
              x1="0"
              y1="36.5"
              x2="100%"
              y2="36.5"
              stroke="currentColor"
              strokeOpacity={0.05}
              strokeWidth={0.5}
              className="text-[var(--text-cream)]"
            />
          </svg>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            id="notch-navbar-mobile-menu"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 top-16 z-40 border-b border-[var(--card-border)] bg-[var(--surface-raised)] p-4 shadow-lg md:hidden"
          >
            <nav className="flex flex-col gap-2">
              {/* Combine all items */}
              {[...items.left, ...items.right].map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex min-h-11 items-center gap-3 rounded-lg p-3 text-[var(--text-cream)] transition-colors hover:bg-[var(--brand-primary-soft)]"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <item.icon className="w-5 h-5 opacity-70" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              ))}
              <div className="my-2 h-px bg-[var(--card-border)]" />
              <div className="flex flex-col gap-2">
                <Link
                  href="/login"
                  className="flex min-h-11 items-center gap-3 rounded-lg p-3 font-medium text-[var(--text-cream)] transition-colors hover:bg-[var(--brand-primary-soft)]"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="mt-2 flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[var(--brand-primary)] p-3 font-medium text-[var(--surface-base)]"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Sign up
                </Link>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
