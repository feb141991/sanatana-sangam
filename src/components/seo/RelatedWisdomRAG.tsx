import Link from 'next/link';
import {
  BookOpen,
  Calendar,
  Compass,
  FileText,
  Flame,
  MessageCircleQuestion,
  Music,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import type { RelatedWisdomPayload, RelatedWisdomLink } from '@/lib/seo/related-wisdom';

interface RelatedWisdomRAGProps {
  payload: RelatedWisdomPayload;
  className?: string;
}

function getCategoryIcon(category: RelatedWisdomLink['category']) {
  switch (category) {
    case 'katha':
      return BookOpen;
    case 'vrat':
      return Flame;
    case 'stotram':
      return Music;
    case 'journal':
      return FileText;
    case 'panchang':
      return Calendar;
    case 'tradition':
      return Compass;
    default:
      return Sparkles;
  }
}

function getCategoryStyles(category: RelatedWisdomLink['category']) {
  switch (category) {
    case 'katha':
      return {
        badgeBg: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
        iconColor: 'text-amber-600 dark:text-amber-400',
      };
    case 'vrat':
      return {
        badgeBg: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20',
        iconColor: 'text-orange-600 dark:text-orange-400',
      };
    case 'stotram':
      return {
        badgeBg: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
        iconColor: 'text-emerald-600 dark:text-emerald-400',
      };
    case 'journal':
      return {
        badgeBg: 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20',
        iconColor: 'text-sky-600 dark:text-sky-400',
      };
    case 'panchang':
      return {
        badgeBg: 'bg-amber-600/10 text-amber-800 dark:text-amber-300 border-amber-600/25',
        iconColor: 'text-amber-700 dark:text-amber-300',
      };
    default:
      return {
        badgeBg: 'bg-stone-500/10 text-stone-700 dark:text-stone-400 border-stone-500/20',
        iconColor: 'text-stone-600 dark:text-stone-400',
      };
  }
}

export function RelatedWisdomRAG({ payload, className = '' }: RelatedWisdomRAGProps) {
  const { heading, description, links, aiPrompts } = payload;

  if (!links || links.length === 0) return null;

  return (
    <section
      aria-label="Connected wisdom and related practice"
      className={`mt-12 rounded-3xl border border-[var(--card-border)] bg-[var(--surface-soft)] p-6 sm:p-8 lg:p-10 shadow-sm transition-all ${className}`}
    >
      {/* ── Section Header ────────────────────────────────────────────── */}
      <div className="max-w-2xl">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40 mb-2.5">
          <Sparkles className="size-3 text-amber-600 dark:text-amber-400" />
          Pramana Knowledge Mesh
        </div>
        <h2 className="text-xl sm:text-2xl font-display font-semibold text-[var(--text-cream)] tracking-tight">
          {heading}
        </h2>
        <p className="mt-1.5 text-xs sm:text-sm text-[var(--text-muted-warm)] leading-relaxed">
          {description}
        </p>
      </div>

      {/* ── Contextual Link Grid ──────────────────────────────────────── */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
        {links.map((item) => {
          const Icon = getCategoryIcon(item.category);
          const styles = getCategoryStyles(item.category);

          return (
            <Link
              key={item.url}
              href={item.url}
              className="group relative flex flex-col justify-between rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4 sm:p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--brand-primary)]/40 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="flex size-7 items-center justify-center rounded-lg bg-[var(--surface-soft)] border border-[var(--card-border)]">
                      <Icon className={`size-3.5 ${styles.iconColor}`} />
                    </span>
                    {item.badge && (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide border ${styles.badgeBg}`}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <ArrowRight className="size-3.5 text-[var(--text-dim)] group-hover:text-[var(--brand-primary-strong)] group-hover:translate-x-0.5 transition-all duration-200" />
                </div>

                <h3 className="text-sm font-semibold text-[var(--text-cream)] group-hover:text-[var(--brand-primary-strong)] transition-colors line-clamp-1">
                  {item.title}
                </h3>
                <p className="mt-1 text-xs text-[var(--text-muted-warm)] line-clamp-2 leading-relaxed">
                  {item.description}
                </p>
              </div>

              {item.subtitle && (
                <div className="mt-3 pt-2 border-t border-[var(--card-border)]/50 text-[10px] font-medium text-[var(--text-dim)] uppercase tracking-wider">
                  {item.subtitle}
                </div>
              )}
            </Link>
          );
        })}
      </div>

      {/* ── Ask Dharma Mitra 1-Click Discovery Prompts ─────────────────── */}
      {aiPrompts && aiPrompts.length > 0 && (
        <div className="mt-8 pt-6 border-t border-[var(--card-border)]/70">
          <div className="flex items-center gap-2 mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-dim)]">
            <MessageCircleQuestion className="size-3.5 text-[var(--brand-primary-strong)]" />
            <span>Inquire with Dharma Mitra</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {aiPrompts.map((prompt) => (
              <Link
                key={prompt}
                href={`/ai-chat?q=${encodeURIComponent(prompt)}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[var(--card-border)] bg-[var(--card-bg)] text-xs text-[var(--text-muted-warm)] hover:text-[var(--text-cream)] hover:border-[var(--brand-primary)]/50 hover:bg-[var(--surface-soft)] transition-all duration-200 shadow-2xs group"
              >
                <Sparkles className="size-3 text-amber-500/70 group-hover:text-amber-500 transition-colors shrink-0" />
                <span>{prompt}</span>
                <span className="text-[var(--text-dim)] group-hover:translate-x-0.5 transition-transform">→</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
