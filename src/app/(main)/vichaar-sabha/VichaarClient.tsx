'use client';

import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import { Plus, MessageSquare, ArrowUp, CheckCircle, Search, X } from 'lucide-react';
import ContentSafetyMenu from '@/components/safety/ContentSafetyMenu';
import { createClient } from '@/lib/supabase';
import { formatRelativeTime, getInitials, FORUM_CATEGORIES } from '@/lib/utils';
import type { ThreadWithAuthor } from '@/types/database';

type FeedFilter = 'active' | 'recent' | 'popular' | 'unanswered' | 'quality';

const FEED_FILTERS: Array<{ value: FeedFilter; label: string; desc: string }> = [
  { value: 'active',    label: 'Active',      desc: 'Recently updated threads' },
  { value: 'recent',    label: 'Recent',      desc: 'Newest threads first' },
  { value: 'popular',   label: 'Popular',     desc: 'Most upvoted discussions' },
  { value: 'quality',   label: '⭐ Quality',   desc: 'Well-developed threads with context and replies' },
  { value: 'unanswered',label: 'Unanswered',  desc: 'Questions waiting for a response' },
];

/** Map tradition → most-relevant default Vichaar category tab */
const TRADITION_DEFAULT_TAB: Record<string, string> = {
  hindu:    'sampradaya',
  sikh:     'sikh_vichar',
  buddhist: 'bauddh_darshan',
  jain:     'jain_darshan',
};

/** Quality threshold — body length + must have at least 1 upvote or 1 reply */
const QUALITY_MIN_BODY = 120;

function normalizeText(value: string) {
  return value.toLowerCase().trim();
}

function getThreadSearchHaystack(thread: ThreadWithAuthor) {
  const category = FORUM_CATEGORIES.find((item) => item.value === thread.category);
  return normalizeText([
    thread.title,
    thread.body,
    thread.tags.join(' '),
    category?.label ?? '',
  ].join(' '));
}

export default function VichaarClient({
  threads: initialThreads,
  userId,
  userTradition,
  embedded = false,
}: {
  threads: ThreadWithAuthor[];
  userId: string;
  userTradition?: string | null;
  /** When true, strips the page header/hero and renders inline inside Mandali */
  embedded?: boolean;
}) {
  const isGuest = !userId;
  const supabase = useMemo(() => createClient(), []);
  const [threads,     setThreads]     = useState(initialThreads);
  // Smart default: if the user has a tradition with a matching category that has threads, use it
  const defaultTab = useMemo(() => {
    if (!userTradition) return 'all';
    const tradTab = TRADITION_DEFAULT_TAB[userTradition];
    if (!tradTab) return 'all';
    const hasThreadsInTab = initialThreads.some((t) => t.category === tradTab);
    return hasThreadsInTab ? tradTab : 'all';
  }, [userTradition, initialThreads]);
  const [activeTab,   setActiveTab]   = useState(defaultTab);
  const [feedFilter,  setFeedFilter]  = useState<FeedFilter>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCompose, setShowCompose] = useState(false);
  const [submitting,  setSubmitting]  = useState(false);
  const [upvoted,     setUpvoted]     = useState<Set<string>>(new Set());
  const deferredSearch = useDeferredValue(searchQuery);

  const [form, setForm] = useState({
    title:    '',
    body:     '',
    category: 'prashnottari',
    tags:     '',
  });

  useEffect(() => {
    if (!userId || threads.length === 0) return;

    let cancelled = false;
    const threadIds = threads.map((thread) => thread.id);

    supabase
      .from('thread_upvotes')
      .select('thread_id')
      .eq('user_id', userId)
      .in('thread_id', threadIds)
      .then(({ data, error }) => {
        if (cancelled || error) return;
        setUpvoted(new Set((data ?? []).map((row) => row.thread_id)));
      });

    return () => {
      cancelled = true;
    };
  }, [supabase, threads, userId]);

  const visibleThreads = useMemo(() => {
    const query = normalizeText(deferredSearch);

    let next = activeTab === 'all'
      ? [...threads]
      : threads.filter((thread) => thread.category === activeTab);

    if (query) {
      next = next.filter((thread) => getThreadSearchHaystack(thread).includes(query));
    }

    // Quality filter: threads with a substantive body AND engagement (upvote or reply)
    if (feedFilter === 'quality') {
      next = next.filter((thread) =>
        thread.body.length >= QUALITY_MIN_BODY &&
        (thread.upvotes > 0 || thread.reply_count > 0)
      );
    }

    // Unanswered filter: only zero-reply threads
    if (feedFilter === 'unanswered') {
      next = next.filter((thread) => thread.reply_count === 0);
    }

    next.sort((a, b) => {
      if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;

      if (feedFilter === 'popular' || feedFilter === 'quality') {
        // Quality: sort by reply_count + upvotes combined engagement
        const engagementA = a.upvotes + a.reply_count * 2;
        const engagementB = b.upvotes + b.reply_count * 2;
        if (engagementB !== engagementA) return engagementB - engagementA;
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      }

      if (feedFilter === 'unanswered') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }

      if (feedFilter === 'recent') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }

      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });

    return next;
  }, [activeTab, deferredSearch, feedFilter, threads]);

  const matchingTitleThreads = useMemo(() => {
    const titleQuery = normalizeText(form.title);
    if (titleQuery.length < 4) return [];

    const queryWords = titleQuery.split(/\s+/).filter((word) => word.length >= 3);
    if (queryWords.length === 0) return [];

    return threads
      .filter((thread) => {
        const haystack = getThreadSearchHaystack(thread);
        return queryWords.every((word) => haystack.includes(word));
      })
      .slice(0, 3);
  }, [form.title, threads]);

  const visibleUnansweredCount = visibleThreads.filter((thread) => thread.reply_count === 0).length;
  const qualityCount = threads.filter((thread) =>
    (activeTab === 'all' || thread.category === activeTab) &&
    thread.body.length >= QUALITY_MIN_BODY &&
    (thread.upvotes > 0 || thread.reply_count > 0)
  ).length;
  const primaryVichaarAction =
    visibleUnansweredCount > 0
      ? {
          eyebrow: 'Open questions',
          title: 'Answer something still waiting',
          description: `${visibleUnansweredCount} thread${visibleUnansweredCount === 1 ? '' : 's'} in your current view still need a response.`,
          onClick: () => setFeedFilter('unanswered'),
          icon: <CheckCircle size={16} className="text-[color:var(--brand-muted)]" />,
        }
      : visibleThreads.length > 0
        ? {
            eyebrow: 'Active wisdom',
            title: 'Read the most active thread',
            description: 'Begin with the conversation already carrying momentum, then add your reflection when it helps.',
            onClick: () => setFeedFilter('active'),
            icon: <MessageSquare size={16} className="text-[color:var(--brand-muted)]" />,
          }
        : {
            eyebrow: 'Begin gently',
            title: isGuest ? 'Browse before joining' : 'Start a thoughtful thread',
            description: isGuest
              ? 'Read a little first, see how questions are framed, and join when you’re ready to contribute.'
              : 'Ask one clear question or share one focused reflection instead of posting too broadly.',
            onClick: () => (isGuest ? null : setShowCompose(true)),
            icon: isGuest ? <Search size={16} className="text-[color:var(--brand-muted)]" /> : <Plus size={16} className="text-[color:var(--brand-muted)]" />,
          };

  async function submitThread() {
    if (!form.title.trim() || !form.body.trim()) {
      toast.error('Please add a title and body'); return;
    }

    setSubmitting(true);
    const { data, error } = await supabase
      .from('forum_threads')
      .insert({
        author_id: userId,
        category:  form.category,
        title:     form.title.trim(),
        body:      form.body.trim(),
        tags:      form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      })
      .select('*, profiles!forum_threads_author_id_fkey(full_name, username, avatar_url, sampradaya)')
      .single();

    if (error) { toast.error(error.message); }
    else {
      setThreads((prev) => [data as ThreadWithAuthor, ...prev]);
      setForm({ title: '', body: '', category: 'prashnottari', tags: '' });
      setSearchQuery('');
      setFeedFilter('recent');
      setActiveTab((data as ThreadWithAuthor).category);
      setShowCompose(false);
      toast.success('Thread posted! 🙏');
    }
    setSubmitting(false);
  }

  async function toggleUpvote(threadId: string) {
    if (upvoted.has(threadId)) {
      const { error } = await supabase.from('thread_upvotes').delete().match({ thread_id: threadId, user_id: userId });
      if (error) {
        toast.error(error.message);
        return;
      }
      setUpvoted((s) => { const n = new Set(s); n.delete(threadId); return n; });
      setThreads((ts) => ts.map((t) => t.id === threadId ? { ...t, upvotes: t.upvotes - 1 } : t));
    } else {
      const { error } = await supabase.from('thread_upvotes').insert({ thread_id: threadId, user_id: userId });
      if (error) {
        toast.error(error.message);
        return;
      }
      setUpvoted((s) => new Set([...s, threadId]));
      setThreads((ts) => ts.map((t) => t.id === threadId ? { ...t, upvotes: t.upvotes + 1 } : t));
    }
  }

  function hideThreadFromView(threadId: string) {
    setThreads((current) => current.filter((thread) => thread.id !== threadId));
  }

  function hideAuthorFromView(authorId: string) {
    setThreads((current) => current.filter((thread) => thread.author_id !== authorId));
  }

  return (
    <div className={embedded ? 'space-y-3' : 'space-y-4 fade-in'}>

      {/* ── Full header — only when standalone page ── */}
      {!embedded && (
        <div className="glass-panel rounded-[1.8rem] px-5 py-5 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--brand-primary)]">
                Wisdom space
              </p>
              <h1 className="font-display font-bold text-xl text-[color:var(--text-cream)] mt-1">Vichaar Sabha</h1>
              <p className="text-sm text-[color:var(--brand-muted)] mt-2 leading-relaxed max-w-2xl">
                Ask, reflect, and explore dharma together. The goal here is thoughtful clarity, not fast feed posting.
              </p>
            </div>
            {isGuest ? (
              <Link
                href="/signup"
                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-sacred text-white text-sm font-semibold rounded-full shadow-sacred hover:opacity-90 transition flex-shrink-0"
              >
                Join to Post
              </Link>
            ) : (
              <button
                onClick={() => setShowCompose(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-sacred text-white text-sm font-semibold rounded-full shadow-sacred hover:opacity-90 transition flex-shrink-0"
              >
                <Plus size={15} />
                <span>New Thread</span>
              </button>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-[1.25fr_0.95fr]">
            <button
              type="button"
              onClick={primaryVichaarAction.onClick}
              disabled={isGuest && visibleThreads.length === 0}
              className="clay-card rounded-[1.6rem] p-4 text-left disabled:opacity-80"
            >
              <p className="text-[10px] uppercase tracking-[0.18em] font-semibold text-[color:var(--brand-primary)]">{primaryVichaarAction.eyebrow}</p>
              <div className="flex items-start justify-between gap-3 mt-3">
                <div>
                  <p className="text-sm font-semibold text-[color:var(--text-cream)]">{primaryVichaarAction.title}</p>
                  <p className="text-sm text-[color:var(--brand-muted)] mt-2 leading-relaxed">{primaryVichaarAction.description}</p>
                </div>
                <div className="clay-icon-well flex-shrink-0">{primaryVichaarAction.icon}</div>
              </div>
            </button>

            <div className="glass-panel rounded-[1.6rem] p-4">
              <p className="text-[10px] uppercase tracking-[0.18em] font-semibold text-[color:var(--text-dim)]">Sabha pulse</p>
              <div className="grid grid-cols-3 gap-2 mt-3">
                {[
                  { label: 'Visible', value: visibleThreads.length },
                  { label: 'Quality', value: qualityCount },
                  { label: 'No reply', value: visibleUnansweredCount },
                ].map((item) => (
                  <div key={item.label} className="rounded-[1.05rem] surface-raised border border-black/5 dark:border-white/10 px-3 py-3 text-center">
                    <p className="font-display font-bold text-xl" style={{ color: 'var(--brand-primary-strong)' }}>{item.value}</p>
                    <p className="text-[10px] uppercase tracking-[0.16em] text-[color:var(--text-dim)] font-semibold mt-1">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Compact compose bar — only when embedded and signed-in ── */}
      {embedded && !isGuest && (
        <button
          onClick={() => setShowCompose(true)}
          className="w-full flex items-center gap-3 rounded-2xl border border-dashed px-4 py-3 text-sm text-[color:var(--brand-muted)] transition hover:bg-black/5 dark:hover:bg-white/[0.04]"
          style={{ borderColor: 'rgba(200,146,74,0.30)' }}
        >
          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--brand-primary-soft)' }}>
            <Plus size={15} style={{ color: 'var(--brand-primary-strong)' }} />
          </div>
          <span>Start a Sabha thread…</span>
          <span className="ml-auto text-xs" style={{ color: 'var(--brand-primary)' }}>
            {visibleThreads.length} threads
          </span>
        </button>
      )}

      {/* ── Guest banner — standalone page only ── */}
      {!embedded && isGuest && (
        <div className="glass-panel rounded-[1.6rem] px-4 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-[color:var(--text-cream)]">You&apos;re browsing in guest mode</p>
            <p className="text-sm text-[color:var(--brand-muted)] leading-relaxed">
              Read threads and replies freely. Join when you&apos;re ready to post, reply, and upvote.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/signup" className="glass-button-primary px-4 py-2 rounded-full text-sm font-semibold text-white">
              Join free
            </Link>
            <Link href="/tirtha-map" className="glass-button-secondary px-4 py-2 rounded-full text-sm font-semibold text-[#7B1A1A]">
              Open Tirtha Map
            </Link>
          </div>
        </div>
      )}

      {/* ── Search + filters — card when standalone, inline when embedded ── */}
      {!embedded ? (
        <div className="glass-panel rounded-[1.6rem] px-4 py-4 space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-[color:var(--text-cream)]">Structured for discovery, not noise</p>
              <p className="text-sm text-[color:var(--brand-muted)] leading-relaxed">
                Browse by category, search existing threads, and surface unanswered questions before starting a new one.
              </p>
            </div>
            <div className="flex gap-3 text-xs text-[color:var(--brand-muted)]">
              <span>{visibleThreads.length} visible</span>
              <span>{visibleUnansweredCount} unanswered</span>
            </div>
          </div>
          <SearchAndFilters
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            feedFilter={feedFilter}
            setFeedFilter={setFeedFilter}
          />
        </div>
      ) : (
        <SearchAndFilters
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          feedFilter={feedFilter}
          setFeedFilter={setFeedFilter}
          compact
        />
      )}

      {/* Tradition-aware default tab hint */}
      {defaultTab !== 'all' && activeTab === defaultTab && (
        <div className="glass-panel rounded-[1.2rem] px-4 py-2 flex items-center gap-2 text-xs text-[color:var(--brand-muted)]">
          <span>🎯</span>
          <span>Showing your tradition&apos;s room by default. Tap <strong>All topics</strong> to see everything.</span>
        </div>
      )}

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        <button
          onClick={() => setActiveTab('all')}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition ${
            activeTab === 'all'
              ? 'text-[#7B1A1A] border'
              : 'border border-white/10 text-[color:var(--brand-muted)] hover:border-[rgba(200,146,74,0.25)] hover:text-[color:var(--brand-ink)]'
          }`}
          style={activeTab === 'all'
            ? { background: 'var(--brand-primary-soft)', borderColor: 'rgba(123, 26, 26, 0.16)' }
            : undefined}
        >
          All topics
        </button>
        {FORUM_CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setActiveTab(cat.value)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition ${
              activeTab === cat.value
                ? 'text-[#7B1A1A] border'
                : 'border border-white/10 text-[color:var(--brand-muted)] hover:border-[rgba(200,146,74,0.25)] hover:text-[color:var(--brand-ink)]'
            }`}
            style={activeTab === cat.value
              ? { background: 'var(--brand-primary-soft)', borderColor: 'rgba(123, 26, 26, 0.16)' }
              : undefined}
          >
            {cat.emoji} {cat.label}
          </button>
        ))}
      </div>

      <ComposeThreadModal
        open={showCompose}
        form={form}
        onClose={() => setShowCompose(false)}
        onChange={setForm}
        onSubmit={submitThread}
        submitting={submitting}
        suggestedThreads={matchingTitleThreads}
      />

      {/* Threads */}
      {visibleThreads.length === 0 ? (
        <div className="text-center py-16 text-[color:var(--text-dim)]">
          <div className="text-4xl mb-3">📜</div>
          <p className="font-medium">
            {searchQuery ? 'No matching threads found' : 'No threads yet in this view'}
          </p>
          <p className="text-sm mt-1">
            {searchQuery ? 'Try a broader search or another category' : 'Be the first to start a thoughtful vichaar'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visibleThreads.map((thread) => (
            <ThreadCard
              key={thread.id}
              thread={thread}
              viewerId={userId}
              isGuest={isGuest}
              isUpvoted={upvoted.has(thread.id)}
              onUpvote={() => toggleUpvote(thread.id)}
              onHideContent={hideThreadFromView}
              onHideAuthor={hideAuthorFromView}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Shared search + filter chips ──────────────────────────────────
function SearchAndFilters({
  searchQuery,
  setSearchQuery,
  feedFilter,
  setFeedFilter,
  compact = false,
}: {
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  feedFilter: FeedFilter;
  setFeedFilter: (v: FeedFilter) => void;
  compact?: boolean;
}) {
  return (
    <div className="space-y-2">
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--text-dim)]" />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search threads, tags, or themes…"
          className={`w-full rounded-xl pl-10 pr-4 text-sm outline-none focus:border-[color:var(--brand-primary)] ${
            compact ? 'py-2.5 glass-input' : 'py-3 glass-input'
          }`}
        />
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {FEED_FILTERS.map((filter) => {
          const isActive = feedFilter === filter.value;
          const isQuality = filter.value === 'quality';
          return (
            <button
              key={filter.value}
              onClick={() => setFeedFilter(filter.value)}
              title={filter.desc}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition ${
                isActive
                  ? isQuality
                    ? 'bg-amber-600 text-white'
                    : 'bg-[#7B1A1A] text-white'
                  : isQuality
                    ? 'bg-[rgba(200,146,74,0.08)] text-[color:var(--brand-primary)] border border-[rgba(200,146,74,0.2)] hover:border-[rgba(200,146,74,0.35)]'
                    : 'border border-white/10 text-[color:var(--brand-muted)] hover:border-[rgba(200,146,74,0.25)] hover:text-[color:var(--brand-ink)]'
              }`}
            >
              {filter.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ComposeThreadModal({
  open,
  form,
  onClose,
  onChange,
  onSubmit,
  submitting,
  suggestedThreads,
}: {
  open: boolean;
  form: {
    title: string;
    body: string;
    category: string;
    tags: string;
  };
  onClose: () => void;
  onChange: React.Dispatch<React.SetStateAction<{
    title: string;
    body: string;
    category: string;
    tags: string;
  }>>;
  onSubmit: () => void;
  submitting: boolean;
  suggestedThreads: ThreadWithAuthor[];
}) {
  const [mounted, setMounted] = useState(false);
  const selectedCategory = FORUM_CATEGORIES.find((cat) => cat.value === form.category);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleEscape);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleEscape);
    };
  }, [onClose, open]);

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[80] bg-black/45 backdrop-blur-[2px] overflow-y-auto" onClick={onClose}>
      <div className="min-h-full flex items-end justify-center p-3 sm:items-center sm:p-6">
        <div
          role="dialog"
          aria-modal="true"
          className="glass-panel-strong w-full max-w-2xl rounded-[1.75rem] sm:rounded-[2rem] overflow-hidden"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="max-h-[calc(100dvh-1.5rem)] overflow-y-auto">
            <div className="sticky top-0 z-10 bg-white/85 backdrop-blur px-5 py-4 border-b border-white/60 flex items-center justify-between">
              <div>
                <h2 className="font-display font-semibold text-lg text-[color:var(--text-cream)]">Start a Thread</h2>
                <p className="text-xs text-[color:var(--brand-muted)] mt-0.5">Ask clearly, add context, and help the right people find your question.</p>
              </div>
              <button onClick={onClose} className="p-2 text-[color:var(--text-dim)] hover:text-[color:var(--text-muted-warm)] rounded-full hover:bg-[rgba(200,146,74,0.08)] transition">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="glass-panel rounded-2xl px-4 py-3 text-sm text-[color:var(--brand-muted)]">
                <p className="font-medium text-[color:var(--text-cream)]">Before you post</p>
                <p className="mt-1 leading-6">
                  Use a specific title, mention your context, and note what you already know or have tried. If a similar thread exists, continuing it keeps answers easier to find later.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-[color:var(--text-muted-warm)] mb-2">Category</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {FORUM_CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => onChange((prev) => ({ ...prev, category: cat.value }))}
                      className={`text-left px-3 py-3 rounded-xl border text-xs transition ${
                        form.category === cat.value
                          ? 'text-[#7B1A1A] font-medium'
                          : 'border-[rgba(200,146,74,0.2)] text-[color:var(--brand-muted)] hover:border-[rgba(123,26,26,0.18)]'
                      }`}
                      style={form.category === cat.value
                        ? { borderColor: 'rgba(123, 26, 26, 0.2)', background: 'var(--brand-primary-soft)' }
                        : undefined}
                    >
                      <span className="font-medium">{cat.emoji} {cat.label}</span>
                      <span className="block text-[color:var(--text-dim)] mt-0.5 leading-tight">{cat.desc}</span>
                    </button>
                  ))}
                </div>
                {selectedCategory && (
                  <p className="text-xs text-[color:var(--text-dim)] mt-2">
                    Posting in <span className="font-medium text-[color:var(--brand-muted)]">{selectedCategory.label}</span> helps route the thread to the right readers.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[color:var(--text-muted-warm)] mb-1.5">Title</label>
                <input
                  type="text"
                  placeholder="e.g. How should I understand Ekadashi fasting if I am just starting?"
                  value={form.title}
                  onChange={(event) => onChange((prev) => ({ ...prev, title: event.target.value }))}
                  className="glass-input w-full px-4 py-3 rounded-xl outline-none text-sm focus:border-[color:var(--brand-primary)]"
                />
                {suggestedThreads.length > 0 && (
                  <div className="glass-panel rounded-2xl mt-3 px-4 py-3">
                    <p className="text-xs font-semibold text-[color:var(--text-muted-warm)] mb-2">Possible existing threads</p>
                    <div className="space-y-2">
                      {suggestedThreads.map((thread) => (
                        <Link
                          key={thread.id}
                          href={`/vichaar-sabha/${thread.id}`}
                          className="block text-sm text-[#7B1A1A] hover:underline"
                          onClick={onClose}
                        >
                          {thread.title}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[color:var(--text-muted-warm)] mb-1.5">Body</label>
                <textarea
                  placeholder="Share the question, a little context, and what kind of guidance you are looking for…"
                  value={form.body}
                  onChange={(event) => onChange((prev) => ({ ...prev, body: event.target.value }))}
                  rows={7}
                  className="glass-input w-full px-4 py-3 rounded-xl outline-none resize-none text-sm focus:border-[color:var(--brand-primary)]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[color:var(--text-muted-warm)] mb-1.5">Tags (optional, comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. ekadashi, vrat, beginner"
                  value={form.tags}
                  onChange={(event) => onChange((prev) => ({ ...prev, tags: event.target.value }))}
                  className="glass-input w-full px-4 py-3 rounded-xl outline-none text-sm focus:border-[color:var(--brand-primary)]"
                />
                <p className="text-xs text-[color:var(--text-dim)] mt-1.5">
                  Use tags for specific themes. Categories should stay broad; tags can be more detailed.
                </p>
              </div>
            </div>

            <div className="sticky bottom-0 px-5 py-4 border-t flex flex-col-reverse gap-3 sm:flex-row" style={{ background: 'var(--surface-raised)', borderColor: 'rgba(200,146,74,0.12)' }}>
              <button
                onClick={onClose}
                className="flex-1 py-3 border border-[rgba(200,146,74,0.2)] text-[color:var(--brand-muted)] rounded-xl text-sm hover:border-[rgba(200,146,74,0.35)] transition"
              >
                Cancel
              </button>
              <button
                onClick={onSubmit}
                disabled={submitting}
                className="flex-1 py-3 bg-gradient-sacred text-white font-semibold rounded-xl text-sm hover:opacity-90 disabled:opacity-50 transition"
              >
                {submitting ? 'Posting…' : 'Post Thread 🙏'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

function ThreadCard({
  thread,
  viewerId,
  isGuest,
  isUpvoted,
  onUpvote,
  onHideContent,
  onHideAuthor,
}: {
  thread: ThreadWithAuthor;
  viewerId: string;
  isGuest: boolean;
  isUpvoted: boolean;
  onUpvote: () => void;
  onHideContent: (threadId: string) => void;
  onHideAuthor: (authorId: string) => void;
}) {
  const cat     = FORUM_CATEGORIES.find((c) => c.value === thread.category);
  const author  = thread.profiles;
  const initials = getInitials(author?.full_name ?? 'S');
  const activityTime = thread.reply_count > 0 ? thread.updated_at : thread.created_at;

  return (
    <Link href={`/vichaar-sabha/${thread.id}`}>
      <div className="rounded-2xl border p-4 space-y-3 card-hover cursor-pointer motion-lift surface-soft-card" style={{ borderColor: 'rgba(200, 146, 74, 0.12)' }}>
        {/* Category + answered badge */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs px-2 py-0.5 rounded-full font-medium border" style={{ background: 'var(--brand-primary-soft)', color: 'var(--brand-primary)', borderColor: 'rgba(123, 26, 26, 0.16)' }}>
              {cat?.emoji} {cat?.label}
            </span>
            {thread.reply_count === 0 && !thread.is_answered && (
              <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-medium">
                Unanswered
              </span>
            )}
            {thread.is_answered && (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 border" style={{ background: '#fbf4e8', color: '#8c5a1f', borderColor: '#ead5ad' }}>
                <CheckCircle size={10} /> Answered
              </span>
            )}
            {thread.is_pinned && (
              <span className="text-xs bg-yellow-50 text-yellow-700 border border-yellow-200 px-2 py-0.5 rounded-full font-medium">
                📌 Pinned
              </span>
            )}
          </div>
          <ContentSafetyMenu
            userId={viewerId}
            authorId={thread.author_id}
            contentId={thread.id}
            contentType="thread"
            onHideContent={onHideContent}
            onHideAuthor={onHideAuthor}
          />
        </div>

        {/* Title */}
        <h3 className="font-semibold text-[color:var(--text-cream)] leading-snug">{thread.title}</h3>

        {/* Preview */}
        <p className="text-sm text-[color:var(--brand-muted)] line-clamp-2 leading-relaxed">{thread.body}</p>

        {/* Tags */}
        {thread.tags.length > 0 && (
          <div className="flex gap-1.5 flex-wrap">
            {thread.tags.slice(0, 4).map((tag) => (
              <span key={tag} className="text-xs bg-gray-100 text-[color:var(--brand-muted)] px-2 py-0.5 rounded-full">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-1 border-t border-gray-50">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-sacred flex items-center justify-center text-white text-[10px] font-bold">
              {initials}
            </div>
            <span className="text-xs text-[color:var(--brand-muted)]">{author?.full_name}</span>
            <span className="text-gray-300">·</span>
            <span className="text-xs text-[color:var(--text-dim)]">{formatRelativeTime(activityTime)}</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-[color:var(--text-dim)]">
            {isGuest ? (
              <span className="flex items-center gap-1">
                <ArrowUp size={13} />
                {thread.upvotes}
              </span>
            ) : (
              <button
                onClick={(e) => { e.preventDefault(); onUpvote(); }}
                className={`flex items-center gap-1 transition ${isUpvoted ? 'font-medium' : 'hover:text-[#7B1A1A]'}`}
                style={isUpvoted ? { color: 'var(--brand-primary)' } : undefined}
              >
                <ArrowUp size={13} className={isUpvoted ? 'text-[#7B1A1A]' : ''} />
                {thread.upvotes}
              </button>
            )}
            <span className="flex items-center gap-1">
              <MessageSquare size={12} />
              {thread.reply_count}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
