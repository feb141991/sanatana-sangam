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

  // ─── SMART GROUPING LOGIC ───
  // Organize members into Unions (Pairs) or Individuals per generation
  const generations = Array.from(new Set(familyMembers.map(m => m.generation || 4))).sort((a, b) => a - b);
  
  const getNodesForGeneration = (gen: number) => {
    const genMembers = familyMembers.filter(m => (m.generation || 4) === gen).sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
    const processedIds = new Set<string>();
    const nodes: Array<{ type: 'individual' | 'union', members: FamilyMember[] }> = [];

    genMembers.forEach(m => {
      if (processedIds.has(m.id)) return;

      // Check if this member has a spouse in the SAME generation
      const spouse = genMembers.find(s => s.id === m.spouse_id || m.id === s.spouse_id);
      
      if (spouse && !processedIds.has(spouse.id)) {
        nodes.push({ type: 'union', members: [m, spouse] });
        processedIds.add(m.id);
        processedIds.add(spouse.id);
      } else {
        nodes.push({ type: 'individual', members: [m] });
        processedIds.add(m.id);
      }
    });

    return nodes;
  };

  return (
    <div className="space-y-16 pb-24 relative">
      {/* ─── Vansh Hero Header ─── */}
      <div className="relative clay-card rounded-[2.5rem] p-10 overflow-hidden text-center sm:text-left">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[var(--brand-primary)] opacity-[0.07] blur-[100px]" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-[var(--brand-earth)] opacity-[0.1] blur-[80px] rounded-full" />
        
        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-8">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-5xl shadow-2xl bg-white/40 border border-white/60 backdrop-blur-md">
            🌳
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-center sm:justify-start gap-3">
              <span className="h-px w-8 bg-[var(--brand-primary)] opacity-30" />
              <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[var(--brand-primary)]">
                {t('kulVanshTitle')}
              </p>
            </div>
            <h3 className="font-display text-3xl sm:text-4xl font-bold theme-ink premium-serif">{t('kulLivingLineage')}</h3>
            <p className="text-sm theme-muted leading-relaxed max-w-xl italic opacity-80 pt-2">
              &ldquo;{t('kulHeritageQuote')}&rdquo;
            </p>
          </div>
          {canManageVansh && (
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 15px 30px rgba(var(--brand-primary-rgb), 0.3)' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAdd(true)}
              className="px-8 py-4 rounded-[1.8rem] flex items-center gap-3 text-white font-bold text-sm shadow-xl transition-all"
              style={{ background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-primary-strong))' }}
            >
              <Plus size={18} strokeWidth={3} />
              {t('kulAddMember')}
            </motion.button>
          )}
        </div>
      </div>

      {familyMembers.length === 0 && !showAdd && (
        <div className="clay-card rounded-[2.5rem] text-center py-24 px-6 border-dashed border-2 border-black/[0.04] bg-white/20">
          <h4 className="text-xl font-bold theme-ink premium-serif">{t('kulVanshEmptyTitle')}</h4>
          <p className="text-sm mt-3 theme-muted max-w-xs mx-auto">{t('kulVanshEmptyDesc')}</p>
          <button 
            onClick={() => setShowAdd(true)}
            className="mt-8 px-10 py-4 rounded-2xl bg-[var(--brand-primary)] text-white font-bold text-sm shadow-lg hover:bg-[var(--brand-primary-strong)] transition-all"
          >
            {t('kulCreateFirstBranch')}
          </button>
        </div>
      )}

      {/* ─── THE CELESTIAL TAPESTRY ─── */}
      <div className="relative flex flex-col items-center gap-24">
        {/* Infinite Lineage Vertical Thread */}
        <div className="absolute inset-y-0 w-px bg-gradient-to-b from-[var(--brand-primary)]/40 via-[var(--brand-primary)]/10 to-transparent left-1/2 -translate-x-1/2 -z-10 opacity-30" />

        {generations.map((gen, idx) => {
          const nodes = getNodesForGeneration(gen);
          return (
            <div key={gen} className="w-full relative">
              {/* Generational Epoch Header */}
              <div className="flex justify-center mb-12 relative z-20">
                <div className="px-6 py-2 rounded-full glass-panel border border-[var(--brand-primary)]/20 shadow-xl bg-white/60 backdrop-blur-xl">
                  <p className="text-[11px] font-black theme-ink uppercase tracking-[0.4em] text-center">
                    {t(`gen${gen}` as any) ?? `Epoch ${gen}`}
                  </p>
                </div>
              </div>

              {/* Generational Nodes Row */}
              <div className="flex flex-wrap justify-center gap-16 sm:gap-24 items-start relative z-10 px-4">
                {nodes.map((node, nIdx) => (
                  <div key={nIdx} className="flex flex-col items-center">
                    {node.type === 'union' ? (
                      <div className="relative flex items-center gap-4 sm:gap-8 group/union">
                        {/* Union Connector Line */}
                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-px bg-gradient-to-r from-transparent via-[var(--brand-primary)] to-transparent opacity-20 -z-10" />
                        
                        {/* Union Heart/Knot Icon */}
                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30">
                          <motion.div 
                            whileHover={{ scale: 1.2, rotate: 360 }}
                            className="w-10 h-10 rounded-full bg-white shadow-xl border border-[var(--brand-primary)]/20 flex items-center justify-center text-pink-500"
                          >
                            <Heart size={16} fill="currentColor" />
                          </motion.div>
                        </div>

                        {/* Husband & Wife Cards */}
                        {node.members.map((m, mIdx) => (
                          <VanshCard 
                            key={m.id} 
                            member={m} 
                            canManage={canManageVansh} 
                            onClick={() => openMemberDetails(m)}
                            onEdit={() => openEdit(m)}
                            onDelete={() => deleteMember(m.id, m.name)}
                            delay={nIdx * 0.1 + mIdx * 0.1}
                          />
                        ))}

                        {/* Visual Threads to Children (Descend from center of union) */}
                        <div className="absolute bottom-[-1rem] left-1/2 -translate-x-1/2 w-px h-24 bg-gradient-to-b from-[var(--brand-primary)]/30 to-transparent -z-10 hidden sm:block" />
                      </div>
                    ) : (
                      <div className="relative">
                        <VanshCard 
                          member={node.members[0]} 
                          canManage={canManageVansh} 
                          onClick={() => openMemberDetails(node.members[0])}
                          onEdit={() => openEdit(node.members[0])}
                          onDelete={() => deleteMember(node.members[0].id, node.members[0].name)}
                          delay={nIdx * 0.1}
                        />
                        {/* Visual Thread to Children */}
                        <div className="absolute bottom-[-1rem] left-1/2 -translate-x-1/2 w-px h-24 bg-gradient-to-b from-[var(--brand-primary)]/30 to-transparent -z-10 hidden sm:block" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── REUSABLE VANSH CARD ───
function VanshCard({ member, canManage, onClick, onEdit, onDelete, delay }: any) {
  const { t } = useLanguage();
  const age = member.birth_date
    ? Math.floor((Date.now() - new Date(member.birth_date).getTime()) / (365.25 * 86400000))
    : member.birth_year ? new Date().getFullYear() - member.birth_year : null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 30 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, type: 'spring', damping: 20 }}
      onClick={onClick}
      className="group relative cursor-pointer"
    >
      {/* Sacred Aura for Individual/Partner */}
      <div className={`absolute inset-[-10px] rounded-[3rem] transition-all duration-700 opacity-0 group-hover:opacity-100 bg-gradient-to-br ${member.gender === 'M' ? 'from-blue-500/10' : 'from-pink-500/10'} to-transparent blur-xl -z-10`} />

      <div className="clay-portrait-card w-[10.5rem] sm:w-[12rem] rounded-[2.8rem] p-5 text-center relative transition-all duration-500 hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] hover:-translate-y-2 bg-white/80 border border-white/60 backdrop-blur-md overflow-hidden ring-1 ring-black/[0.03]">
        {/* Sacred Accent Corner */}
        <div className={`absolute top-0 right-0 w-12 h-12 bg-gradient-to-bl ${member.gender === 'M' ? 'from-blue-500/5' : 'from-pink-500/5'} to-transparent rounded-bl-[2rem]`} />
        
        <FamilyKeepsakeStage member={member} />
        
        <div className="mt-5 space-y-1">
          <p className="text-[15px] font-bold theme-ink leading-tight tracking-tight premium-serif group-hover:text-[var(--brand-primary)] transition-colors">{member.name}</p>
          {member.role && (
            <p className="text-[8px] font-black uppercase tracking-[0.2em] text-[var(--brand-primary)] opacity-60">
              {member.role}
            </p>
          )}
        </div>

        <div className="w-8 h-[1px] mx-auto my-4 bg-gradient-to-r from-transparent via-[var(--brand-primary)]/40 to-transparent" />

        <div className="text-[10px] theme-dim space-y-1.5 leading-relaxed font-medium">
          {member.birth_place && (
            <p className="flex items-center justify-center gap-1 opacity-60 italic">
              <MapPin size={8} /> {member.birth_place}
            </p>
          )}
          {age !== null && (
            <p className={`${member.is_alive ? 'text-[var(--brand-primary)]' : 'text-slate-400'} font-bold`}>
              {member.is_alive 
                ? `${t('kulAge')}: ${age}${t('kulYearsAbbrev')}` 
                : `${t('kulLived')}: ${age}${t('kulYearsAbbrev')} (${member.birth_year ?? '—'}–${member.death_year ?? '—'})`}
            </p>
          )}
          {!member.is_alive && !age && (
            <p className="font-bold opacity-30 uppercase tracking-tighter text-[9px]">{t('kulInEternalMemory')}</p>
          )}
        </div>
        
        {/* Interaction Mini-Panel */}
        {canManage && (
          <div className="mt-4 pt-3 border-t border-black/[0.03] flex items-center justify-center gap-4">
            <button 
              onClick={(e) => { e.stopPropagation(); onEdit(); }} 
              className="p-2 rounded-full hover:bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] transition-all"
            >
              <Pencil size={11} />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(); }} 
              className="p-2 rounded-full hover:bg-red-50 text-red-400 transition-all"
            >
              <X size={11} />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function Pencil({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    </svg>
  );
}
