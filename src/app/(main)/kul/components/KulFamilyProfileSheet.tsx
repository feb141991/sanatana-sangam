'use client';

import Image from 'next/image';
import { X } from 'lucide-react';
import { MemberRow } from '../types';

const TRADITION_EMOJI: Record<string, string> = {
  hindu: '🕉️', sikh: '☬', buddhist: '☸️', jain: '🤲', other: '✨',
};

export function KulFamilyProfileSheet({
  member,
  onClose,
}: {
  member: MemberRow;
  onClose: () => void;
}) {
  const profile = member.profiles;
  const name = profile?.full_name || profile?.username || 'Family member';
  const location = [profile?.city, profile?.country].filter(Boolean).join(', ');
  const detailRows = [
    profile?.tradition ? { label: 'Tradition', value: `${TRADITION_EMOJI[profile.tradition] ?? '🙏'} ${profile.tradition}` } : null,
    profile?.sampradaya ? { label: 'Sampradaya', value: profile.sampradaya } : null,
    profile?.spiritual_level ? { label: 'Level', value: profile.spiritual_level } : null,
    profile?.home_town ? { label: 'Home Town', value: profile.home_town } : null,
    profile?.gotra ? { label: 'Gotra', value: profile.gotra } : null,
    profile?.kul_devata ? { label: 'Kul Devata', value: profile.kul_devata } : null,
  ].filter(Boolean) as Array<{ label: string; value: string }>;

  return (
    <div className="fixed inset-0 z-[110] bg-black/45 backdrop-blur-sm px-4 pb-6 pt-24 sm:py-6 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="w-full max-w-md max-h-[calc(100vh-7rem)] sm:max-h-[85vh] overflow-y-auto clay-card rounded-[2.5rem] p-6 space-y-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-4 min-w-0">
             <div className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-slate-100 to-slate-200 border border-[#C5A059]/15 shadow-inner flex items-center justify-center">
                {profile?.avatar_url ? (
                   <Image width={120} height={120} src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                   <span className="text-xl font-bold text-slate-400">{(profile?.full_name || profile?.username || '?')[0].toUpperCase()}</span>
                )}
             </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold theme-ink truncate">{name}</h2>
              <p className="text-[10px] font-bold theme-muted uppercase tracking-widest mt-1">
                {member.role === 'guardian' ? 'Kul Guardian' : 'Kul Member'}
                {profile?.username ? ` · @${profile.username}` : ''}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-11 h-11 rounded-full glass-panel border border-[#C5A059]/15 flex items-center justify-center theme-muted hover:theme-ink transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="glass-panel rounded-[2rem] p-5 space-y-4 border border-[#C5A059]/15 bg-[var(--surface-soft)]">
          {location ? (
            <div className="flex items-center gap-2 text-sm theme-ink">
              <span className="text-base">📍</span>
              <span className="font-medium">{location}</span>
            </div>
          ) : null}
          <div className="flex items-center gap-2 text-sm theme-ink">
            <span className="text-base">🔥</span>
            <span className="font-medium">{profile?.shloka_streak ?? 0} day shloka streak</span>
          </div>
          {profile?.bio ? (
            <p className="text-sm theme-ink leading-relaxed italic">&ldquo;{profile.bio}&rdquo;</p>
          ) : (
            <p className="text-xs theme-muted">This family member has not added a bio yet.</p>
          )}
        </div>

        {detailRows.length > 0 && (
          <div className="glass-panel rounded-[2rem] border border-[#C5A059]/15 p-5 bg-[var(--surface-soft)]">
            <div className="grid grid-cols-2 gap-y-5 gap-x-4">
              {detailRows.map((row) => (
                <div key={row.label} className="min-w-0">
                  <p className="text-[9px] uppercase tracking-[0.2em] theme-muted font-bold mb-1">{row.label}</p>
                  <p className="text-xs font-bold theme-ink truncate">{row.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
