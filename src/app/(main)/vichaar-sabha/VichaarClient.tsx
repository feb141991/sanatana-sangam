'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Plus, MessageSquare, ArrowUp, CheckCircle, X } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { formatRelativeTime, getInitials, FORUM_CATEGORIES } from '@/lib/utils';
import type { ThreadWithAuthor } from '@/types/database';

export default function VichaarClient({
  threads: initialThreads,
  userId,
}: {
  threads: ThreadWithAuthor[];
  userId: string;
}) {
  const isGuest = !userId;
  const supabase = createClient();
  const [threads,     setThreads]     = useState(initialThreads);
  const [activeTab,   setActiveTab]   = useState('all');
  const [showCompose, setShowCompose] = useState(false);
  const [submitting,  setSubmitting]  = useState(false);
  const [upvoted,     setUpvoted]     = useState<Set<string>>(new Set());

  const [form, setForm] = useState({
    title:    '',
    body:     '',
    category: 'prashnottari',
    tags:     '',
  });

  const filtered = activeTab === 'all'
    ? threads
    : threads.filter((t) => t.category === activeTab);

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
      .select('*, profiles(full_name, username, avatar_url, sampradaya)')
      .single();

    if (error) { toast.error(error.message); }
    else {
      setThreads([data as ThreadWithAuthor, ...threads]);
      setForm({ title: '', body: '', category: 'prashnottari', tags: '' });
      setShowCompose(false);
      toast.success('Thread posted! 🙏');
    }
    setSubmitting(false);
  }

  async function toggleUpvote(threadId: string) {
    if (upvoted.has(threadId)) {
      await supabase.from('thread_upvotes').delete().match({ thread_id: threadId, user_id: userId });
      setUpvoted((s) => { const n = new Set(s); n.delete(threadId); return n; });
      setThreads((ts) => ts.map((t) => t.id === threadId ? { ...t, upvotes: t.upvotes - 1 } : t));
    } else {
      await supabase.from('thread_upvotes').insert({ thread_id: threadId, user_id: userId });
      setUpvoted((s) => new Set([...s, threadId]));
      setThreads((ts) => ts.map((t) => t.id === threadId ? { ...t, upvotes: t.upvotes + 1 } : t));
    }
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

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        <button
          onClick={() => setActiveTab('all')}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition ${
            activeTab === 'all'
              ? 'bg-orange-100 text-orange-700 border border-orange-300'
              : 'bg-white text-gray-500 border border-gray-200 hover:border-orange-200'
          }`}
        >
          🕉️ All
        </button>
        {FORUM_CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setActiveTab(cat.value)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition ${
              activeTab === cat.value
                ? 'bg-orange-100 text-orange-700 border border-orange-300'
                : 'bg-white text-gray-500 border border-gray-200 hover:border-orange-200'
            }`}
          >
            {cat.emoji} {cat.label}
          </button>
        ))}
      </div>

      {/* Compose Modal */}
      {showCompose && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end justify-center p-4 sm:items-center">
          <div className="bg-white rounded-2xl w-full max-w-lg p-5 space-y-4 fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-semibold text-lg">Start a Thread</h2>
              <button onClick={() => setShowCompose(false)} className="p-1 text-gray-400 hover:text-gray-700">
                <X size={18} />
              </button>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <div className="grid grid-cols-2 gap-2">
                {FORUM_CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setForm({ ...form, category: cat.value })}
                    className={`text-left px-3 py-2 rounded-xl border text-xs transition ${
                      form.category === cat.value
                        ? 'border-orange-400 bg-orange-50 text-orange-700 font-medium'
                        : 'border-gray-200 text-gray-600 hover:border-orange-200'
                    }`}
                  >
                    <span className="font-medium">{cat.emoji} {cat.label}</span>
                    <span className="block text-gray-400 mt-0.5 leading-tight">{cat.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
              <input
                type="text"
                placeholder="e.g. What is the significance of Ekadashi fasting?"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-400 outline-none text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Body</label>
              <textarea
                placeholder="Share your thoughts, question, or insight…"
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                rows={5}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-400 outline-none resize-none text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Tags (optional, comma separated)</label>
              <input
                type="text"
                placeholder="e.g. ekadashi, vrat, vishnu"
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-400 outline-none text-sm"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCompose(false)}
                className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl text-sm hover:border-gray-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={submitThread}
                disabled={submitting}
                className="flex-1 py-3 bg-gradient-sacred text-white font-semibold rounded-xl text-sm hover:opacity-90 disabled:opacity-50 transition"
              >
                {submitting ? 'Posting…' : 'Post Thread 🙏'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Threads */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">📜</div>
          <p className="font-medium">No threads yet in this category</p>
          <p className="text-sm mt-1">Be the first to start a vichaar</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((thread) => (
            <ThreadCard
              key={thread.id}
              thread={thread}
              isUpvoted={upvoted.has(thread.id)}
              onUpvote={() => toggleUpvote(thread.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ThreadCard({
  thread,
  isUpvoted,
  onUpvote,
}: {
  thread: ThreadWithAuthor;
  isUpvoted: boolean;
  onUpvote: () => void;
}) {
  const cat     = FORUM_CATEGORIES.find((c) => c.value === thread.category);
  const author  = thread.profiles;
  const initials = getInitials(author?.full_name ?? 'S');

  return (
    <Link href={`/vichaar-sabha/${thread.id}`}>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-4 space-y-3 card-hover cursor-pointer">
        {/* Category + answered badge */}
        <div className="flex items-center gap-2">
          <span className="text-xs bg-orange-50 text-orange-700 border border-orange-200 px-2 py-0.5 rounded-full font-medium">
            {cat?.emoji} {cat?.label}
          </span>
          {thread.is_answered && (
            <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
              <CheckCircle size={10} /> Answered
            </span>
          )}
          {thread.is_pinned && (
            <span className="text-xs bg-yellow-50 text-yellow-700 border border-yellow-200 px-2 py-0.5 rounded-full font-medium">
              📌 Pinned
            </span>
          )}
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
            <span className="text-xs text-gray-400">{formatRelativeTime(thread.created_at)}</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <button
              onClick={(e) => { e.preventDefault(); onUpvote(); }}
              className={`flex items-center gap-1 transition ${isUpvoted ? 'text-orange-600 font-medium' : 'hover:text-orange-500'}`}
            >
              <ArrowUp size={13} className={isUpvoted ? 'text-orange-500' : ''} />
              {thread.upvotes}
            </button>
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
