'use client';

import Image from 'next/image';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { EmptyState } from '@/components/ui';
import { createClient } from '@/lib/supabase';
import { getInitials, ISHTA_DEVATAS } from '@/lib/utils';
import type { Profile } from '@/types/database';

type MemberRow = Pick<Profile, 'id' | 'full_name' | 'username' | 'avatar_url' | 'sampradaya' | 'ishta_devata' | 'spiritual_level' | 'city' | 'country' | 'seva_score'>;

export default function MandaliMembers({ members, userId }: { members: MemberRow[]; userId: string }) {
  const supabase = createClient();
  const [reportingId, setReportingId] = useState<string | null>(null);

  async function reportMember(memberId: string) {
    setReportingId(memberId);
    const { error } = await supabase.from('content_reports').insert({
      reported_by: userId,
      content_type: 'user_profile',
      content_id: memberId,
      reason: 'inappropriate_behaviour',
    });
    setReportingId(null);
    if (error) { toast.error('Could not submit report'); return; }
    toast.success('Report submitted for review 🙏');
  }

  if (members.length === 0) {
    return (
      <EmptyState
        icon="👥"
        title="No members yet"
        description="Your local Mandali has not surfaced any members here yet."
      />
    );
  }

  return (
    <div className="space-y-2">
      {members.map((m, idx) => {
        const devata = ISHTA_DEVATAS.find((d) => d.value === m.ishta_devata);
        const isMe = m.id === userId;
        return (
          <div key={m.id}
            className="glass-panel rounded-2xl border p-3 flex items-center gap-3"
            style={{ borderColor: isMe ? 'rgba(200, 127, 146, 0.32)' : 'var(--card-bg)' }}>
            <div className="w-5 text-center text-xs font-bold theme-dim">
              {idx + 1}
            </div>
            <div className="relative w-10 h-10 rounded-full flex items-center justify-center text-[var(--divine-text)] dark:text-white text-sm font-bold flex-shrink-0 overflow-hidden"
              style={{ background: isMe ? 'linear-gradient(135deg, var(--brand-primary-strong), var(--brand-primary))' : 'linear-gradient(135deg, var(--brand-primary), var(--brand-accent))' }}>
              {m.avatar_url
                ? <Image src={m.avatar_url} alt="" fill sizes="40px" className="object-cover" />
                : getInitials(m.full_name || m.username || '?')
              }
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="font-semibold text-[color:var(--brand-ink)] text-sm truncate">
                  {m.full_name || m.username}
                  {isMe && <span className="ml-1 text-[10px] font-medium" style={{ color: 'var(--brand-primary-strong)' }}>(you)</span>}
                </p>
                {m.country && m.country !== 'India' && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full theme-dim"
                    style={{ background: 'rgba(128,128,128,0.08)', fontSize: '10px' }}>
                    🌍 {m.country}
                  </span>
                )}
              </div>
              <p className="text-xs text-[color:var(--brand-muted)] truncate">
                {devata?.emoji} {devata?.label ?? 'Sanatani'} · {m.city ?? m.spiritual_level ?? 'Seeker'}
              </p>
            </div>
            <div className="text-right mr-1">
              <div className="font-bold text-sm" style={{ color: 'var(--brand-primary-strong)' }}>{m.seva_score ?? 0}</div>
              <div className="text-[10px] text-[color:var(--brand-muted)]">seva</div>
            </div>
            {!isMe && (
              <button
                onClick={() => reportMember(m.id)}
                disabled={reportingId === m.id}
                className="w-7 h-7 rounded-full flex items-center justify-center text-[color:var(--brand-muted)] hover:text-red-400 hover:bg-red-500/10 transition disabled:opacity-40"
                title="Report this member"
              >
                {reportingId === m.id
                  ? <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin block" />
                  : <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
                }
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
