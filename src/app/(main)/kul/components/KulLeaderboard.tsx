'use client';
import { Trophy } from 'lucide-react';
import type { MemberRow } from '../types';

const MEDALS = ['🥇', '🥈', '🥉'];

export function KulLeaderboard({ members, userId }: { members: MemberRow[]; userId: string }) {
  const ranked = [...members]
    .sort((a, b) => {
      const sevaA = a.profiles?.weekly_seva ?? 0;
      const sevaB = b.profiles?.weekly_seva ?? 0;
      return sevaB - sevaA;
    })
    .slice(0, 10);

  if (ranked.length === 0) return null;

  return (
    <section className="rounded-[2rem] border border-[var(--card-border)] bg-[var(--card-bg)]/80 p-4 shadow-sm backdrop-blur-xl">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]">
          <Trophy size={19} />
        </div>
        <div>
          <p className="text-[15px] font-medium theme-ink premium-serif">Weekly Scores</p>
          <p className="text-[11px] theme-muted">Seva points this week</p>
        </div>
      </div>

      <div className="space-y-2">
        {ranked.map((member, index) => {
          const profile = member.profiles;
          const name = profile?.full_name || profile?.username || 'Family';
          const seva = profile?.weekly_seva ?? 0;
          const isMe = member.user_id === userId;
          const medal = MEDALS[index] ?? `${index + 1}`;
          const maxSeva = ranked[0]?.profiles?.weekly_seva ?? 1;

          return (
            <div
              key={member.id}
              className="flex items-center gap-3 rounded-2xl p-3 transition-colors"
              style={{
                background: isMe ? 'rgba(197,160,89,0.08)' : 'var(--surface-soft)',
                border: isMe ? '1px solid rgba(197,160,89,0.25)' : '1px solid transparent',
              }}
            >
              <span className="w-6 text-center text-[14px]">{medal}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[13px] font-medium theme-ink truncate">
                    {name} {isMe && <span className="text-[10px] opacity-50">(you)</span>}
                  </span>
                  <span className="text-[12px] font-bold" style={{ color: 'var(--brand-primary)' }}>
                    {seva}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-[var(--card-border)] overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${maxSeva > 0 ? Math.round((seva / maxSeva) * 100) : 0}%`,
                      background: 'var(--brand-primary)',
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
