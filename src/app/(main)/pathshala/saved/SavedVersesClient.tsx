'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { ChevronLeft, Bookmark, BookOpen } from 'lucide-react';
import { getTraditionMeta } from '@/lib/tradition-config';
import type { PathshalaStudySummary } from '@/lib/pathshala-state';

interface Props {
  saved: PathshalaStudySummary[];
  tradition: string;
}

const TRADITION_MARK: Record<string, string> = {
  hindu: 'ॐ', sikh: 'ੴ', buddhist: '☸', jain: '☮', other: '✦',
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export default function SavedVersesClient({ saved, tradition }: Props) {
  const router = useRouter();
  const reduced = useReducedMotion();
  const meta = getTraditionMeta(tradition);

  const itemVariants = {
    hidden:  { opacity: 0, y: reduced ? 0 : 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.22 } },
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--page-bg, #F5EFE6)' }}>
      {/* ── Header ─────────────────────────────────────────────────────────────── */}
      <div
        className="sticky top-0 z-20 px-4 pt-safe-top pb-3 pt-3"
        style={{ background: 'var(--page-bg, #F5EFE6)', borderBottom: `1px solid ${meta.accentColour}18` }}
      >
        <div className="flex items-center gap-3">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => router.back()}
            className="w-9 h-9 rounded-full flex items-center justify-center border"
            style={{ background: 'var(--card-bg, #fff)', borderColor: 'var(--card-border, #e5ddd0)' }}
          >
            <ChevronLeft size={18} style={{ color: meta.accentColour }} />
          </motion.button>

          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em]" style={{ color: meta.accentColour }}>
              Pathshala
            </p>
            <h1 className="text-base font-bold leading-tight truncate" style={{ color: 'var(--brand-ink, #2d1f0e)', fontFamily: 'var(--font-serif)' }}>
              Saved Verses
            </h1>
          </div>

          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border"
            style={{ background: `${meta.accentColour}14`, borderColor: `${meta.accentColour}28` }}
          >
            <Bookmark size={11} fill={meta.accentColour} style={{ color: meta.accentColour }} />
            <span className="text-[10px] font-bold" style={{ color: meta.accentColour }}>{saved.length}</span>
          </div>
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────────────────────────────── */}
      <div className="px-4 py-6 max-w-lg mx-auto">
        {saved.length === 0 ? (
          /* Empty state */
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center justify-center text-center py-20 gap-4"
          >
            <span className="text-5xl opacity-30">{TRADITION_MARK[tradition] ?? '✦'}</span>
            <div>
              <p className="font-semibold text-base mb-1" style={{ color: 'var(--brand-ink)' }}>
                No saved verses yet
              </p>
              <p className="text-sm leading-relaxed max-w-[220px] mx-auto" style={{ color: 'var(--brand-muted)' }}>
                Tap the bookmark icon while reading a verse to save it here.
              </p>
            </div>
            <Link
              href="/pathshala"
              className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-[#1c1c1a]"
              style={{ background: meta.accentColour }}
            >
              <BookOpen size={14} /> Open Pathshala
            </Link>
          </motion.div>
        ) : (
          <motion.div
            variants={{ visible: { transition: { staggerChildren: 0.04 } } }}
            initial="hidden"
            animate="visible"
            className="space-y-3"
          >
            {saved.map((item) => (
              <motion.div key={`${item.sectionId}:${item.entryId}`} variants={itemVariants}>
                <Link href={item.href} className="block">
                  <motion.div
                    whileTap={{ scale: 0.975 }}
                    className="rounded-2xl p-4 border flex items-start gap-3"
                    style={{
                      background: 'var(--card-bg, #fff)',
                      borderColor: 'var(--card-border, #e5ddd0)',
                    }}
                  >
                    {/* Tradition mark */}
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-base font-bold"
                      style={{ background: `${meta.accentColour}18`, color: meta.accentColour, fontFamily: 'var(--font-deva, serif)' }}
                    >
                      {TRADITION_MARK[item.tradition] ?? '✦'}
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold leading-snug truncate" style={{ color: 'var(--brand-ink)' }}>
                        {item.title}
                      </p>
                      <p className="text-[11px] mt-0.5 truncate" style={{ color: meta.accentColour }}>
                        {item.source}
                      </p>
                      <p className="text-[10px] mt-1" style={{ color: 'var(--brand-muted)' }}>
                        {item.sectionTitle} · saved {timeAgo(item.bookmarkedAt!)}
                      </p>
                    </div>

                    {/* Filled bookmark indicator */}
                    <Bookmark size={14} fill={meta.accentColour} style={{ color: meta.accentColour, flexShrink: 0, marginTop: 2 }} />
                  </motion.div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
