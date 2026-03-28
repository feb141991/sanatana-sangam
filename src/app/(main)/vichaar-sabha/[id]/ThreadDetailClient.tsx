'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { ArrowLeft, ArrowUp, CheckCircle, Send } from 'lucide-react';
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
  const [replies,    setReplies]   = useState(initialReplies);
  const [replyBody,  setReplyBody] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const cat = FORUM_CATEGORIES.find((c) => c.value === thread.category);
  const author = thread.profiles;

  async function submitReply() {
    if (!replyBody.trim()) return;
    setSubmitting(true);
    const { data, error } = await supabase
      .from('forum_replies')
      .insert({ thread_id: thread.id, author_id: userId, body: replyBody.trim() })
      .select('*, profiles(full_name, username, avatar_url, sampradaya, spiritual_level)')
      .single();
    if (error) { toast.error(error.message); }
    else {
      setReplies([...replies, data as ReplyWithAuthor]);
      setReplyBody('');
      toast.success('Reply posted! 🙏');
    }
    setSubmitting(false);
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
          <span className="text-xs bg-orange-50 text-orange-700 border border-orange-200 px-2 py-0.5 rounded-full font-medium">
            {cat?.emoji} {cat?.label}
          </span>
          {thread.is_answered && (
            <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
              <CheckCircle size={10} /> Answered
            </span>
          )}
        </div>

        <h1 className="font-display font-bold text-xl text-gray-900">{thread.title}</h1>
        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{thread.body}</p>

        {thread.tags.length > 0 && (
          <div className="flex gap-1.5 flex-wrap">
            {thread.tags.map((tag) => (
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
          <span>{formatRelativeTime(thread.created_at)}</span>
        </div>
      </div>

      {/* Replies */}
      <div className="space-y-3">
        <h2 className="font-semibold text-gray-800 text-sm px-1">
          {replies.length} {replies.length === 1 ? 'Reply' : 'Replies'}
        </h2>

        {replies.map((reply) => (
          <ReplyCard key={reply.id} reply={reply} isOwn={reply.author_id === userId} />
        ))}
      </div>

      {/* Reply composer */}
      <div className="bg-white rounded-2xl border border-orange-100 p-4 shadow-card space-y-3 sticky bottom-20">
        <textarea
          placeholder="Share your wisdom or perspective… 🙏"
          value={replyBody}
          onChange={(e) => setReplyBody(e.target.value)}
          rows={3}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-400 outline-none resize-none text-sm"
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
    </div>
  );
}

function ReplyCard({ reply, isOwn }: { reply: ReplyWithAuthor; isOwn: boolean }) {
  const author   = reply.profiles;
  const initials = getInitials(author?.full_name ?? 'S');
  const level    = SPIRITUAL_LEVELS.find((l) => l.value === author?.spiritual_level);

  return (
    <div className={`bg-white rounded-2xl border shadow-card p-4 space-y-2 ${
      reply.is_accepted ? 'border-green-300 bg-green-50/30' : 'border-gray-100'
    }`}>
      {reply.is_accepted && (
        <div className="flex items-center gap-1.5 text-xs text-green-700 font-semibold">
          <CheckCircle size={13} className="fill-green-100" /> Accepted Answer
        </div>
      )}
      <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">{reply.body}</p>
      <div className="flex items-center gap-2 pt-1 text-xs text-gray-400">
        <div className="w-6 h-6 rounded-full bg-gradient-sacred flex items-center justify-center text-white text-[10px] font-bold">
          {initials}
        </div>
        <span className="font-medium text-gray-600">{author?.full_name}</span>
        {level && <span className="text-orange-500">· {level.label}</span>}
        <span className="text-gray-300">·</span>
        <span>{formatRelativeTime(reply.created_at)}</span>
        {isOwn && <span className="ml-1 bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full">You</span>}
      </div>
    </div>
  );
}
