'use client';

import { EmptyState } from '@/components/ui';
import { formatRelativeTime } from '@/lib/utils';
import type { EventRsvp, PostWithAuthor } from '@/types/database';

type RsvpStatus = 'going' | 'interested' | 'not_going';

function EventRsvpBar({
  postId,
  rsvps,
  userId,
  onRsvp,
}: {
  postId: string;
  rsvps: EventRsvp[];
  userId: string;
  onRsvp: (postId: string, status: RsvpStatus) => void;
}) {
  const counts = {
    going: rsvps.filter((item) => item.status === 'going').length,
    interested: rsvps.filter((item) => item.status === 'interested').length,
    not_going: rsvps.filter((item) => item.status === 'not_going').length,
  };
  const myStatus = rsvps.find((item) => item.user_id === userId)?.status ?? null;

  return (
    <div className="mt-3 space-y-2">
      <div className="flex flex-wrap gap-2">
        {[
          { value: 'going', label: 'Going', count: counts.going },
          { value: 'interested', label: 'Interested', count: counts.interested },
          { value: 'not_going', label: "Can't make it", count: counts.not_going },
        ].map((item) => (
          <button
            key={item.value}
            onClick={() => onRsvp(postId, item.value as RsvpStatus)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              myStatus === item.value
                ? 'text-white'
                : 'border border-[rgba(200,127,146,0.25)] bg-[var(--surface-soft)] text-[color:var(--brand-muted)]'
            }`}
            style={myStatus === item.value ? { background: 'linear-gradient(135deg, var(--brand-primary-strong), var(--brand-primary))' } : undefined}
          >
            {item.label}
            {item.count > 0 ? ` · ${item.count}` : ''}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function MandaliEvents({ posts, rsvps, userId, onRsvp }: { posts: PostWithAuthor[]; rsvps: EventRsvp[]; userId: string; onRsvp: (postId: string, status: RsvpStatus) => void; }) {
  const events = posts.filter((p) => p.type === 'event');
  if (events.length === 0) {
    return (
      <EmptyState
        icon="📅"
        title="No upcoming events"
        description="Create the first Mandali event to gather people around a real local moment."
      />
    );
  }

  return (
    <div className="space-y-3">
      {events.map((post) => (
        <div key={post.id} className="glass-panel rounded-2xl border p-4" style={{ borderColor: 'var(--card-border)' }}>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--surface-soft)] flex items-center justify-center text-xl flex-shrink-0">🎉</div>
            <div className="flex-1">
              <p className="text-sm font-medium text-[color:var(--brand-ink)] leading-snug">{post.content}</p>
              {post.event_date && (
                <p className="text-xs text-[color:var(--brand-primary-strong)] mt-1 font-medium">
                  📅 {new Date(post.event_date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
              {post.event_location && (
                <p className="text-xs text-[color:var(--brand-muted)] mt-0.5">📍 {post.event_location}</p>
              )}
              <p className="text-xs text-[color:var(--brand-muted)] mt-1">
                {post.profiles?.full_name ?? post.profiles?.username} · {formatRelativeTime(post.created_at)}
              </p>
              <EventRsvpBar
                postId={post.id}
                rsvps={rsvps.filter((item) => item.post_id === post.id)}
                userId={userId}
                onRsvp={onRsvp}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
