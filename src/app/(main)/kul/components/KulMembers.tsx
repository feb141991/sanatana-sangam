'use client';

import { motion } from 'framer-motion';
import { UserPlus, Crown, Mail } from 'lucide-react';
import { MemberRow } from '../types';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export function KulMembers({
  members,
  myRole,
  onInvite,
  onMemberClick,
}: {
  members: MemberRow[];
  myRole: 'guardian' | 'sadhak';
  onInvite: () => void;
  onMemberClick: (member: MemberRow) => void;
}) {
  const { t } = useLanguage();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold theme-ink premium-serif">{t('kulCareCircle')}</h2>
          <p className="text-xs theme-muted mt-0.5">{t('kulCareCircleDesc')}</p>
        </div>
        {myRole === 'guardian' && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onInvite}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-bold shadow-lg"
            style={{ background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-primary-strong))', color: 'white' }}
          >
            <UserPlus size={16} />
            {t('join')}
          </motion.button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {members.map((member) => {
          const profile = member.profiles;
          const name = profile?.full_name || profile?.username || t('kulFamilyMemberDefault');
          return (
            <motion.div
              key={member.id}
              whileHover={{ y: -2 }}
              onClick={() => onMemberClick(member)}
              className="group glass-panel rounded-[2rem] p-4 flex items-center gap-4 border border-white/5 hover:border-white/10 cursor-pointer transition-all shadow-sm"
            >
              <div className="relative">
                <Avatar name={name} url={profile?.avatar_url} size={12} />
                {member.role === 'guardian' && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-yellow-400 flex items-center justify-center text-[10px] shadow-sm border border-white/20">
                    <Crown size={10} className="text-yellow-900" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-bold theme-ink truncate">{name}</h3>
                <p className="text-[10px] uppercase tracking-widest theme-muted font-semibold mt-0.5">
                  {member.role}
                </p>
              </div>

              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 border border-white/5 text-[color:var(--brand-muted)] opacity-0 group-hover:opacity-100 transition-opacity">
                <ChevronRight size={14} />
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function Avatar({ name, url, size }: { name: string; url: string | null | undefined; size: number }) {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div 
      className="rounded-2xl overflow-hidden flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 border border-white/20 shadow-inner"
      style={{ width: size * 4, height: size * 4 }}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={name} className="w-full h-full object-cover" />
      ) : (
        <span className="text-slate-500 font-bold tracking-tight" style={{ fontSize: size * 1.5 }}>{initials}</span>
      )}
    </div>
  );
}

function ChevronRight({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}
