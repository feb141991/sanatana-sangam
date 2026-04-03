'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { ArrowLeft, CheckCircle, Send } from 'lucide-react';
import ContentSafetyMenu from '@/components/safety/ContentSafetyMenu';
import { createClient } from '@/lib/supabase';
import { formatRelativeTime, getInitials, FORUM_CATEGORIES, SPIRITUAL_LEVELS } from '@/lib/utils';
import type { ThreadWithAuthor, ForumReply, Profile } from '@/types/database';

type ReplyWithAuthor = ForumReply & {
  profiles: Pick<Profile, 'full_name' | 'username' | 'avatar_url' | 'sampradaya' | 'spiritual_level'>;
};

export default function ThreadDetailClient({
  thread,
  replies: initialReplies,
  userId,
}: {
  thread:  ThreadWithAuthor;
  replies: ReplyWithAuthor[];
  userId:  string;
}) {
  const router   = useRouter();
  const supabase = createClient();
  const isGuest = !userId;
  const [threadState] = useState(thread);
  const [replies,     setReplies]   = useState(initialReplies);
  const [replyBody,   setReplyBody] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const cat = FORUM_CATEGORIES.find((c) => c.value === threadState.category);
  const author = threadState.profiles;

  async function submitReply() {
    if (!replyBody.trim()) return;
    setSubmitting(true);
    const { data, error } = await supabase
      .from('forum_replies')
      .insert({ thread_id: threadState.id, author_id: userId, body: replyBody.trim() })
      .select('*, profiles!forum_replies_author_id_fkey(full_name, username, avatar_url, sampradaya, spiritual_level)')
      .single();
    if (error) { toast.error(error.message); }
    else {
      setReplies((current) => [...current, data as ReplyWithAuthor]);
      setReplyBody('');
      toast.success('Reply posted! 🙏');
    }
    setSubmitting(false);
  }

  function leaveThreadView() {
    router.replace('/vichaar-sabha');
    router.refresh();
  }

  function hideReply(replyId: string) {
    setReplies((current) => current.filter((reply) => reply.id !== replyId));
  }

  function hideReplyAuthor(authorId: string) {
    if (authorId === threadState.author_id) {
      leaveThreadView();
      return;
    }

    setReplies((current) => current.filter((reply) => reply.author_id !== authorId));
  }

  return (
    <div className="space-y-4 fade-in pb-4">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition"
      >
        <ArrowLeft size={15} /> Vichaar Sabha
      </button>

      {/* Thread */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-0.5 rounded-full font-medium border" style={{ background: 'var(--brand-primary-soft)', color: 'var(--brand-primary)', borderColor: 'rgba(123, 26, 26, 0.16)' }}>
            {cat?.emoji} {cat?.label}
          </span>
          {threadState.is_answered && (
            <span className="text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 border" style={{ background: '#fbf4e8', color: '#8c5a1f', borderColor: '#ead5ad' }}>
              <CheckCircle size={10} /> Answered
            </span>
          )}
        </div>

        <div className="flex items-start justify-between gap-3">
          <h1 className="font-display font-bold text-xl text-gray-900">{threadState.title}</h1>
          <ContentSafetyMenu
            userId={userId}
            authorId={threadState.author_id}
            contentId={threadState.id}
            contentType="thread"
            onHideContent={leaveThreadView}
            onHideAuthor={leaveThreadView}
          />
        </div>
        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{threadState.body}</p>

        {threadState.tags.length > 0 && (
          <div className="flex gap-1.5 flex-wrap">
            {threadState.tags.map((tag) => (
              <span key={tag} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">#{tag}</span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 pt-2 border-t border-gray-50 text-sm text-gray-500">
          <div className="w-7 h-7 rounded-full bg-gradient-sacred flex items-center justify-center text-white text-xs font-bold">
            {getInitials(author?.full_name ?? 'S')}
          </div>
          <span className="font-medium text-gray-700">{author?.full_name}</span>
          <span className="text-gray-300">·</span>
          <span>{formatRelativeTime(threadState.created_at)}</span>
        </div>
      </div>

      {/* Replies */}
      <div className="space-y-3">
        <h2 className="font-semibold text-gray-800 text-sm px-1">
          {replies.length} {replies.length === 1 ? 'Reply' : 'Replies'}
        </h2>

        {replies.map((reply) => (
          <ReplyCard
            key={reply.id}
            reply={reply}
            userId={userId}
            isOwn={reply.author_id === userId}
            onHideContent={hideReply}
            onHideAuthor={hideReplyAuthor}
          />
        ))}
      </div>

      {isGuest ? (
        <div className="glass-panel rounded-[1.6rem] p-4 sm:p-5 space-y-3 sm:sticky sm:bottom-20">
          <div>
            <p className="text-sm font-semibold text-gray-900">Join to continue the conversation</p>
            <p className="text-sm text-gray-600 leading-relaxed mt-1">
              Guests can read threads and replies. Join free to ask follow-up questions, reply, and upvote helpful answers.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/signup" className="glass-button-primary inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-white">
              Join free
            </Link>
            <Link href="/login" className="glass-button-secondary inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-[#7B1A1A]">
              Sign in
            </Link>
          </div>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl border border-white/70 p-4 shadow-card space-y-3 sm:sticky sm:bottom-20">
          <textarea
            placeholder="Share your wisdom or perspective… 🙏"
            value={replyBody}
            onChange={(e) => setReplyBody(e.target.value)}
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[color:var(--brand-primary)] outline-none resize-none text-sm"
          />
          <div className="flex justify-end">
            <button
              onClick={submitReply}
              disabled={submitting || !replyBody.trim()}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-sacred text-white text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition"
            >
              <Send size={14} />
              {submitting ? 'Posting…' : 'Reply'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ReplyCard({
  reply,
  userId,
  isOwn,
  onHideContent,
  onHideAuthor,
}: {
  reply: ReplyWithAuthor;
  userId: string;
  isOwn: boolean;
  onHideContent: (replyId: string) => void;
  onHideAuthor: (authorId: string) => void;
}) {
  const author   = reply.profiles;
  const initials = getInitials(author?.full_name ?? 'S');
  const level    = SPIRITUAL_LEVELS.find((l) => l.value === author?.spiritual_level);

  return (
    <div className={`bg-white rounded-2xl border shadow-card p-4 space-y-2 ${
      reply.is_accepted ? 'border-[#ead5ad]' : 'border-gray-100'
    }`}>
      {reply.is_accepted && (
        <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: '#8c5a1f' }}>
          <CheckCircle size={13} /> Accepted Answer
        </div>
      )}
      <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">{reply.body}</p>
      <div className="flex items-start justify-between gap-3 pt-1 text-xs text-gray-400">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-full bg-gradient-sacred flex items-center justify-center text-white text-[10px] font-bold">
            {initials}
          </div>
          <span className="font-medium text-gray-600 truncate">{author?.full_name}</span>
          {level && <span style={{ color: 'var(--brand-primary)' }}>· {level.label}</span>}
          <span className="text-gray-300">·</span>
          <span>{formatRelativeTime(reply.created_at)}</span>
          {isOwn && <span className="ml-1 bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full">You</span>}
        </div>
        <ContentSafetyMenu
          userId={userId}
          authorId={reply.author_id}
          contentId={reply.id}
          contentType="reply"
          onHideContent={onHideContent}
          onHideAuthor={onHideAuthor}
        />
      </div>
    </div>
  );
}
