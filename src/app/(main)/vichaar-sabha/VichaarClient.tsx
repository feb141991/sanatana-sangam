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

type FeedFilter = 'active' | 'recent' | 'popular' | 'unanswered';

const FEED_FILTERS: Array<{ value: FeedFilter; label: string }> = [
  { value: 'active', label: 'Active' },
  { value: 'recent', label: 'Recent' },
  { value: 'popular', label: 'Popular' },
  { value: 'unanswered', label: 'Unanswered' },
];

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
}: {
  threads: ThreadWithAuthor[];
  userId: string;
}) {
  const isGuest = !userId;
  const supabase = useMemo(() => createClient(), []);
  const [threads,     setThreads]     = useState(initialThreads);
  const [activeTab,   setActiveTab]   = useState('all');
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

    next.sort((a, b) => {
      if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;

      if (feedFilter === 'popular') {
        if (b.upvotes !== a.upvotes) return b.upvotes - a.upvotes;
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      }

      if (feedFilter === 'unanswered') {
        const unansweredA = a.reply_count === 0 ? 1 : 0;
        const unansweredB = b.reply_count === 0 ? 1 : 0;
        if (unansweredB !== unansweredA) return unansweredB - unansweredA;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }

      if (feedFilter === 'recent') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }

      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });

    if (feedFilter === 'unanswered') {
      next = next.filter((thread) => thread.reply_count === 0);
    }

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
    <div className="space-y-4 fade-in">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-xl text-gray-900">Vichaar Sabha</h1>
          <p className="text-sm text-gray-500">Ask, share, and explore dharma together</p>
        </div>
        {isGuest ? (
          <Link
            href="/signup"
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-sacred text-white text-sm font-semibold rounded-full shadow-sacred hover:opacity-90 transition"
          >
            Join to Post
          </Link>
        ) : (
          <button
            onClick={() => setShowCompose(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-sacred text-white text-sm font-semibold rounded-full shadow-sacred hover:opacity-90 transition"
          >
            <Plus size={15} />
            <span>New Thread</span>
          </button>
        )}
      </div>

      {isGuest && (
        <div className="glass-panel rounded-[1.6rem] px-4 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-gray-900">You&apos;re browsing in guest mode</p>
            <p className="text-sm text-gray-600 leading-relaxed">
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

      <div className="glass-panel rounded-[1.6rem] px-4 py-4 space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-900">Structured for discovery, not noise</p>
            <p className="text-sm text-gray-600 leading-relaxed">
              Browse by category, search existing threads, and surface unanswered questions before starting a new one.
            </p>
          </div>
          <div className="flex gap-3 text-xs text-gray-500">
            <span>{visibleThreads.length} visible</span>
            <span>{visibleUnansweredCount} unanswered</span>
          </div>
        </div>

        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search threads, tags, or themes"
            className="glass-input w-full rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-[color:var(--brand-primary)]"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {FEED_FILTERS.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setFeedFilter(filter.value)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition ${
                feedFilter === filter.value
                  ? 'bg-[#7B1A1A] text-white'
                  : 'bg-white text-gray-500 border border-gray-200 hover:border-[rgba(123,26,26,0.18)]'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        <button
          onClick={() => setActiveTab('all')}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition ${
            activeTab === 'all'
              ? 'text-[#7B1A1A] border'
              : 'bg-white text-gray-500 border border-gray-200 hover:border-[rgba(123,26,26,0.18)]'
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
                : 'bg-white text-gray-500 border border-gray-200 hover:border-[rgba(123,26,26,0.18)]'
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
        <div className="text-center py-16 text-gray-400">
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
                <h2 className="font-display font-semibold text-lg text-gray-900">Start a Thread</h2>
                <p className="text-xs text-gray-500 mt-0.5">Ask clearly, add context, and help the right people find your question.</p>
              </div>
              <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-700 rounded-full hover:bg-white/70 transition">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="glass-panel rounded-2xl px-4 py-3 text-sm text-gray-600">
                <p className="font-medium text-gray-800">Before you post</p>
                <p className="mt-1 leading-6">
                  Use a specific title, mention your context, and note what you already know or have tried. If a similar thread exists, continuing it keeps answers easier to find later.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {FORUM_CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => onChange((prev) => ({ ...prev, category: cat.value }))}
                      className={`text-left px-3 py-3 rounded-xl border text-xs transition ${
                        form.category === cat.value
                          ? 'text-[#7B1A1A] font-medium'
                          : 'border-gray-200 text-gray-600 hover:border-[rgba(123,26,26,0.18)]'
                      }`}
                      style={form.category === cat.value
                        ? { borderColor: 'rgba(123, 26, 26, 0.2)', background: 'var(--brand-primary-soft)' }
                        : undefined}
                    >
                      <span className="font-medium">{cat.emoji} {cat.label}</span>
                      <span className="block text-gray-400 mt-0.5 leading-tight">{cat.desc}</span>
                    </button>
                  ))}
                </div>
                {selectedCategory && (
                  <p className="text-xs text-gray-400 mt-2">
                    Posting in <span className="font-medium text-gray-600">{selectedCategory.label}</span> helps route the thread to the right readers.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
                <input
                  type="text"
                  placeholder="e.g. How should I understand Ekadashi fasting if I am just starting?"
                  value={form.title}
                  onChange={(event) => onChange((prev) => ({ ...prev, title: event.target.value }))}
                  className="glass-input w-full px-4 py-3 rounded-xl outline-none text-sm focus:border-[color:var(--brand-primary)]"
                />
                {suggestedThreads.length > 0 && (
                  <div className="glass-panel rounded-2xl mt-3 px-4 py-3">
                    <p className="text-xs font-semibold text-gray-700 mb-2">Possible existing threads</p>
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
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Body</label>
                <textarea
                  placeholder="Share the question, a little context, and what kind of guidance you are looking for…"
                  value={form.body}
                  onChange={(event) => onChange((prev) => ({ ...prev, body: event.target.value }))}
                  rows={7}
                  className="glass-input w-full px-4 py-3 rounded-xl outline-none resize-none text-sm focus:border-[color:var(--brand-primary)]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Tags (optional, comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. ekadashi, vrat, beginner"
                  value={form.tags}
                  onChange={(event) => onChange((prev) => ({ ...prev, tags: event.target.value }))}
                  className="glass-input w-full px-4 py-3 rounded-xl outline-none text-sm focus:border-[color:var(--brand-primary)]"
                />
                <p className="text-xs text-gray-400 mt-1.5">
                  Use tags for specific themes. Categories should stay broad; tags can be more detailed.
                </p>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white/90 backdrop-blur px-5 py-4 border-t border-white/60 flex flex-col-reverse gap-3 sm:flex-row">
              <button
                onClick={onClose}
                className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl text-sm hover:border-gray-300 transition"
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
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-4 space-y-3 card-hover cursor-pointer">
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
        <h3 className="font-semibold text-gray-900 leading-snug">{thread.title}</h3>

        {/* Preview */}
        <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">{thread.body}</p>

        {/* Tags */}
        {thread.tags.length > 0 && (
          <div className="flex gap-1.5 flex-wrap">
            {thread.tags.slice(0, 4).map((tag) => (
              <span key={tag} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
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
            <span className="text-xs text-gray-500">{author?.full_name}</span>
            <span className="text-gray-300">·</span>
            <span className="text-xs text-gray-400">{formatRelativeTime(activityTime)}</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-400">
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
