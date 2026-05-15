'use client';

import { motion } from 'framer-motion';
import { Plus, X, Search, ChevronRight, MapPin, Heart } from 'lucide-react';
import { FamilyMember, MemberRow } from '../types';
import { FamilyKeepsakeStage } from './FamilyKeepsakeStage';
import { useLanguage } from '@/lib/i18n/LanguageContext';


export function KulVansh({
  members,
  familyMembers,
  canManageVansh,
  openMemberDetails,
  openEdit,
  deleteMember,
  showAdd,
  setShowAdd,
}: {
  members: MemberRow[];
  familyMembers: FamilyMember[];
  canManageVansh: boolean;
  openMemberDetails: (m: FamilyMember) => void;
  openEdit: (m: FamilyMember) => void;
  deleteMember: (id: string, name: string) => void;
  showAdd: boolean;
  setShowAdd: (show: boolean) => void;
}) {
  const { t } = useLanguage();
  const generations = Array.from(new Set(familyMembers.map(m => m.generation || 4))).sort((a, b) => a - b);
  const byGen: Record<number, FamilyMember[]> = {};
  generations.forEach(gen => {
    byGen[gen] = familyMembers.filter(m => (m.generation || 4) === gen).sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
  });

  return (
    <div className="space-y-12 pb-20">
      <div className="relative clay-card rounded-[2.5rem] p-8 overflow-hidden">
        {/* Sacred Heritage Background */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--brand-primary)] opacity-[0.05] blur-[80px]" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-[var(--brand-earth)] opacity-[0.08] blur-[60px] rounded-full" />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-inner bg-gradient-to-br from-[var(--brand-primary)]/20 to-[var(--brand-primary)]/5 border border-[var(--brand-primary)]/20">
                🌳
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--brand-primary)]">
                  {t('kulVanshTitle')}
                </p>
                <h3 className="font-display text-2xl font-bold theme-ink mt-1 premium-serif">{t('kulLivingLineage')}</h3>
              </div>
            </div>
            {canManageVansh && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAdd(true)}
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg transition-all"
                style={{ background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-primary-strong))' }}
              >
                <Plus size={20} strokeWidth={3} />
              </motion.button>
            )}
          </div>
          
          <p className="text-sm theme-muted leading-relaxed max-w-xl italic">
            &ldquo;{t('kulHeritageQuote')}&rdquo;
          </p>
        </div>
      </div>

      {familyMembers.length === 0 && !showAdd && (
        <div className="clay-card rounded-[2.5rem] text-center py-24 px-6 border-dashed border-2 border-black/[0.04]">
          <div className="mx-auto max-w-[14rem] mb-8">
            <div className="clay-portrait-stage">
              <div className="clay-memory-orbit scale-125 opacity-40" />
              <div className="clay-memory-medallion w-24 h-24">
                <div className="clay-memory-medallion-inner bg-gradient-to-br from-[#fdfaf5] to-[#f5f0e5] flex items-center justify-center">
                  <span className="font-display text-4xl font-bold text-[var(--brand-primary-strong)]">वं</span>
                </div>
              </div>
            </div>
          </div>
          <h4 className="text-xl font-bold theme-ink premium-serif">{t('kulVanshEmptyTitle')}</h4>
          <p className="text-sm mt-3 theme-muted max-w-xs mx-auto">{t('kulVanshEmptyDesc')}</p>
          <button 
            onClick={() => setShowAdd(true)}
            className="mt-8 px-8 py-3 rounded-2xl bg-[var(--brand-primary)]/10 text-[var(--brand-primary-strong)] font-bold text-sm hover:bg-[var(--brand-primary)]/20 transition-all border border-[var(--brand-primary)]/20"
          >
            {t('kulCreateFirstBranch')}
          </button>
        </div>
      )}

      {/* ── VERTICAL TREE GRID ── */}
      <div className="space-y-16 relative">
        {/* Vertical Connector Line behind everything */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-[var(--brand-primary)]/40 via-[var(--brand-primary)]/10 to-transparent -translate-x-1/2 hidden sm:block" />

        {generations.map((gen, idx) => (
          <div key={gen} className="relative z-10">
            {/* Generation Header */}
            <div className="flex justify-center mb-8">
              <div className="px-5 py-1.5 rounded-full bg-[var(--brand-primary)]/5 border border-[var(--brand-primary)]/10 shadow-sm">
                <p className="text-[10px] font-bold theme-ink uppercase tracking-[0.25em]">
                  {t(`gen${gen}` as any) ?? `Generation ${gen}`}
                </p>
              </div>
            </div>

            {/* Members Grid */}
            <div className="flex flex-wrap justify-center gap-6 sm:gap-10">
              {byGen[gen].map((m, mIdx) => {
                const age = m.birth_date
                  ? Math.floor((Date.now() - new Date(m.birth_date).getTime()) / (365.25 * 86400000))
                  : m.birth_year ? new Date().getFullYear() - m.birth_year : null;
                
                return (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: mIdx * 0.1 }}
                    className="relative"
                  >
                    {/* Visual Connection line to parent (if not first generation) */}
                    {idx > 0 && m.parent_id && (
                       <div className="absolute -top-16 left-1/2 w-px h-16 bg-[var(--brand-primary)]/20 -translate-x-1/2 hidden sm:block" />
                    )}

                    <div
                      onClick={() => openMemberDetails(m)}
                      className="group clay-portrait-card w-[11rem] sm:w-[12rem] rounded-[2.5rem] p-5 text-center relative transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 cursor-pointer bg-gradient-to-b from-[#fdfcf9] to-[#f7f3ed] border border-white/40"
                    >
                      <FamilyKeepsakeStage member={m} />
                      
                      <div className="mt-5 space-y-1.5">
                        <p className="text-sm font-bold theme-ink leading-tight tracking-tight premium-serif">{m.name}</p>
                        {m.role && (
                          <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-[var(--brand-primary)]">
                            {m.role}
                          </p>
                        )}
                      </div>

                      <div className="w-10 h-[1px] mx-auto my-4 bg-gradient-to-r from-transparent via-[var(--brand-primary)]/30 to-transparent" />

                      <div className="text-[10px] theme-dim space-y-1.5 leading-relaxed">
                        {m.birth_place && (
                          <p className="flex items-center justify-center gap-1 font-medium italic opacity-60">
                            <MapPin size={8} /> {m.birth_place}
                          </p>
                        )}
                        {age !== null && (
                          <p className="font-bold text-[var(--brand-primary)]/80">
                            {m.is_alive 
                              ? `${t('kulAge')}: ${age}${t('kulYearsAbbrev')}` 
                              : `${t('kulLived')}: ${age}${t('kulYearsAbbrev')} (${m.birth_year ?? '—'}–${m.death_year ?? '—'})`}
                          </p>
                        )}
                        {!m.is_alive && !age && (
                          <p className="font-bold opacity-40 uppercase tracking-tighter">{t('kulInEternalMemory')}</p>
                        )}
                      </div>
                      
                      {/* Interaction Footer */}
                      <div className="mt-4 pt-3 border-t border-black/[0.03] flex items-center justify-between px-1">
                        <span className="text-[8px] font-bold uppercase tracking-widest opacity-40">#{m.id.slice(0,4)}</span>
                        {canManageVansh && (
                          <div className="flex gap-2">
                            <button onClick={(e) => { e.stopPropagation(); openEdit(m); }} className="p-1 hover:text-[var(--brand-primary)] transition">
                              <Pencil size={12} />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); deleteMember(m.id, m.name); }} className="p-1 hover:text-red-500 transition">
                              <X size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Pencil({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    </svg>
  );
}
