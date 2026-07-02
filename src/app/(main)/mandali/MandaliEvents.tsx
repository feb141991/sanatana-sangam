'use client';

import { EmptyState } from '@/components/ui';
import { formatRelativeTime } from '@/lib/utils';
import type { EventRsvp, PostWithAuthor } from '@/types/database';

type RsvpStatus = 'going' | 'interested' | 'not_going';

/** Starter content handed to the composer when bootstrapping a first event */
export type EventTemplate = { content: string; eventDate?: string };

/** Next Sunday at the given hour, formatted for a datetime-local input */
function nextSundayAt(hour: number): string {
  const d = new Date();
  const daysUntilSunday = (7 - d.getDay()) % 7 || 7;
  d.setDate(d.getDate() + daysUntilSunday);
  d.setHours(hour, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Templates are factories so date prefills compute at tap time — a module
// constant would freeze "next Sunday" at first load and go stale in
// long-lived PWA sessions.
const EVENT_TEMPLATES: Array<{ icon: string; label: string; template: () => EventTemplate }> = [
  {
    icon: '🪔',
    label: 'Sunday satsang',
    template: () => ({
      content: 'Sunday satsang — bhajan, chai, and a short katha. All traditions and newcomers welcome 🙏',
      eventDate: nextSundayAt(10),
    }),
  },
  {
    icon: '📿',
    label: 'Group japa',
    template: () => ({
      content: 'Group japa circle — chanting together, beginners welcome. Bring your mala 🙏',
    }),
  },
  {
    icon: '🛕',
    label: 'Temple visit',
    template: () => ({
      content: 'Group temple visit — darshan and prasad together. Meet at the entrance 🙏',
    }),
  },
  {
    icon: '🌸',
    label: 'Festival meetup',
    template: () => ({
      content: 'Festival meetup — celebrate together with bhajan, prasad, and good company 🙏',
    }),
  },
];

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

export default function MandaliEvents({ posts, rsvps, userId, onRsvp, onStartEvent }: {
  posts: PostWithAuthor[];
  rsvps: EventRsvp[];
  userId: string;
  onRsvp: (postId: string, status: RsvpStatus) => void;
  /** Opens the composer pre-filled for an event post */
  onStartEvent?: (template: EventTemplate) => void;
}) {
  const events = posts.filter((p) => p.type === 'event');
  if (events.length === 0) {
    return (
      <div className="space-y-3">
        <EmptyState
          icon="📅"
          title="No upcoming events"
          description="A first gathering can be as simple as chai and a short katha. Post it and let your city find you."
          actionLabel={onStartEvent ? 'Start first gathering' : undefined}
          onAction={onStartEvent ? () => onStartEvent({ content: '' }) : undefined}
        />
        {onStartEvent && (
          <div className="space-y-2">
            <p className="text-[11px] text-center theme-dim">or start from a template</p>
            <div className="grid grid-cols-2 gap-2">
              {EVENT_TEMPLATES.map(({ icon, label, template }) => (
                <button
                  key={label}
                  onClick={() => onStartEvent(template())}
                  className="flex items-center gap-2.5 rounded-2xl px-4 py-3.5 min-h-[44px] text-left text-sm theme-ink transition hover:bg-[var(--surface-soft)]"
                  style={{ border: '1px solid var(--card-border)', background: 'var(--card-bg)' }}
                >
                  <span className="text-lg flex-shrink-0">{icon}</span>
                  <span className="font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
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
