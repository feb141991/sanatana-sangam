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

  // ─── THE TREE ARCHITECT (Recursive logic) ───
  // We need to build a true hierarchy where children are nested under parents
  const buildTree = () => {
    const nodesMap: Record<string, FamilyMember> = {};
    familyMembers.forEach(m => nodesMap[m.id] = m);

    // Identify unions and individuals
    const processedIds = new Set<string>();
    const tree: any[] = [];

    // Helper to find children
    const findChildrenOf = (parentId: string | null, spouseId: string | null) => {
      return familyMembers.filter(m => 
        (parentId && m.parent_id === parentId) || 
        (spouseId && m.parent_id === spouseId)
      );
    };

    // First, find 'Roots' (members with no parent_id in our list)
    const roots = familyMembers.filter(m => !m.parent_id || !nodesMap[m.parent_id]);

    roots.forEach(m => {
      if (processedIds.has(m.id)) return;

      const spouse = familyMembers.find(s => s.id === m.spouse_id || m.id === s.spouse_id);
      const children = findChildrenOf(m.id, spouse?.id || null);

      if (spouse) {
        tree.push({ type: 'union', members: [m, spouse], children });
        processedIds.add(m.id);
        processedIds.add(spouse.id);
      } else {
        tree.push({ type: 'individual', members: [m], children });
        processedIds.add(m.id);
      }
    });

    return tree;
  };

  const vanshTree = buildTree();

  return (
    <div className="space-y-16 pb-32 relative min-h-[800px] celestial-tapestry p-4 sm:p-10 rounded-[3.5rem] overflow-hidden">
      <style jsx global>{`
        .celestial-tapestry {
          background: radial-gradient(circle at 50% 0%, #0a0b1a 0%, #020205 100%);
          color: white;
        }
        .shoonaya-glow {
          filter: drop-shadow(0 0 15px rgba(245, 158, 11, 0.2));
        }
      `}</style>

      {/* ─── Celestial Hero ─── */}
      <div className="relative rounded-[3rem] p-12 overflow-hidden border border-white/10 bg-black/40 backdrop-blur-3xl shoonaya-glow">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--brand-primary)] opacity-10 blur-[120px]" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
            className="w-24 h-24 rounded-full flex items-center justify-center text-5xl bg-gradient-to-br from-amber-200/20 to-transparent border border-amber-500/30 shadow-[0_0_30px_rgba(251,191,36,0.2)]"
          >
            🔯
          </motion.div>
          <div className="flex-1 text-center md:text-left space-y-3">
            <h3 className="text-4xl md:text-5xl font-black premium-serif tracking-tight bg-gradient-to-r from-amber-200 via-white to-amber-100 bg-clip-text text-transparent">
              {t('kulVanshTitle')}
            </h3>
            <p className="text-amber-200/60 text-xs font-bold uppercase tracking-[0.5em]">The Eternal Vansh Fractal</p>
            <p className="text-sm text-slate-400 leading-relaxed max-w-2xl italic">
              &ldquo;{t('kulHeritageQuote')}&rdquo;
            </p>
          </div>
          {canManageVansh && (
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              onClick={() => setShowAdd(true)}
              className="px-10 py-5 rounded-full bg-amber-500 text-black font-black text-xs uppercase tracking-widest shadow-[0_10px_40px_rgba(245,158,11,0.4)] transition-all"
            >
              {t('kulAddMember')}
            </motion.button>
          )}
        </div>
      </div>

      {familyMembers.length === 0 && !showAdd && (
        <div className="py-32 text-center">
          <h4 className="text-2xl font-bold text-amber-100/40 premium-serif">{t('kulVanshEmptyTitle')}</h4>
          <button onClick={() => setShowAdd(true)} className="mt-8 px-12 py-4 rounded-full border border-amber-500/30 text-amber-500 font-bold hover:bg-amber-500/10 transition-all">
            {t('kulCreateFirstBranch')}
          </button>
        </div>
      )}

      {/* ─── RECURSIVE FRACTAL RENDER ─── */}
      <div className="vansh-fractal-container flex flex-col items-center">
        {vanshTree.map((root, idx) => (
          <FractalNode 
            key={idx} 
            node={root} 
            allMembers={familyMembers} 
            onDetails={openMemberDetails}
            onEdit={openEdit}
            onDelete={deleteMember}
            canManage={canManageVansh}
          />
        ))}
      </div>
    </div>
  );
}

// ─── RECURSIVE FRACTAL NODE ───
function FractalNode({ node, allMembers, onDetails, onEdit, onDelete, canManage }: { node: any, allMembers: FamilyMember[], onDetails: any, onEdit: any, onDelete: any, canManage: boolean }) {
  const children = allMembers.filter((m: FamilyMember) => 
    node.members.some((parent: any) => m.parent_id === parent.id)
  );

  const processedChildren: any[] = [];
  const processedIds = new Set<string>();

  children.forEach((m: FamilyMember) => {
    if (processedIds.has(m.id)) return;
    const spouse = allMembers.find(s => s.id === m.spouse_id || m.id === s.spouse_id);
    if (spouse) {
      processedChildren.push({ type: 'union', members: [m, spouse] });
      processedIds.add(m.id);
      processedIds.add(spouse.id);
    } else {
      processedChildren.push({ type: 'individual', members: [m] });
      processedIds.add(m.id);
    }
  });

  return (
    <div className="flex flex-col items-center relative py-12">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-12 bg-gradient-to-b from-amber-500/20 to-transparent" />

      <div className="relative z-10">
        {node.type === 'union' ? (
          <div className="flex items-center gap-12 group/union relative">
             <div className="absolute inset-x-[-20px] inset-y-[-10px] rounded-full bg-amber-500/5 blur-2xl opacity-0 group-hover/union:opacity-100 transition-opacity" />
             <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
               <motion.div 
                 animate={{ scale: [1, 1.1, 1] }} 
                 transition={{ duration: 3, repeat: Infinity }}
                 className="w-8 h-8 rounded-full bg-black border border-amber-500/40 flex items-center justify-center text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]"
               >
                 <Heart size={12} fill="currentColor" />
               </motion.div>
             </div>
             {node.members.map((m: any) => (
               <VanshCard 
                 key={m.id} 
                 member={m} 
                 canManage={canManage} 
                 onClick={() => onDetails(m)}
                 onEdit={() => onEdit(m)}
                 onDelete={() => onDelete(m.id, m.name)}
                 delay={0}
               />
             ))}
          </div>
        ) : (
          <VanshCard 
            member={node.members[0]} 
            canManage={canManage} 
            onClick={() => onDetails(node.members[0])}
            onEdit={() => onEdit(node.members[0])}
            onDelete={() => onDelete(node.members[0].id, node.members[0].name)}
            delay={0}
          />
        )}
      </div>

      {processedChildren.length > 0 && (
        <div className="relative mt-12 flex items-start justify-center gap-16 md:gap-32">
          {processedChildren.length > 1 && (
            <div className="absolute top-0 left-[15%] right-[15%] h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
          )}
          {processedChildren.map((childNode, idx) => (
            <FractalNode 
              key={idx} 
              node={childNode} 
              allMembers={allMembers} 
              onDetails={onDetails} 
              onEdit={onEdit} 
              onDelete={onDelete} 
              canManage={canManage}
            />
          ))}
        </div>
      )}
    </div>
  );
}


// ─── REUSABLE VANSH CARD ───
function VanshCard({ member, canManage, onClick, onEdit, onDelete, delay }: { member: FamilyMember, canManage: boolean, onClick: any, onEdit: any, onDelete: any, delay: number }) {
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
