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
  const buildTree = () => {
    const nodesMap: Record<string, FamilyMember> = {};
    familyMembers.forEach(m => nodesMap[m.id] = m);

    const processedIds = new Set<string>();
    const tree: any[] = [];

    const findChildrenOf = (parentId: string | null, spouseId: string | null) => {
      return familyMembers.filter(m => 
        (parentId && m.parent_id === parentId) || 
        (spouseId && m.parent_id === spouseId)
      );
    };

    // Correctly identify 'Roots' (members with no parent_id in our list)
    const roots = familyMembers.filter(m => !m.parent_id || !nodesMap[m.parent_id]);

    roots.forEach(m => {
      if (processedIds.has(m.id)) return;
      const spouse = familyMembers.find(s => s.id === m.spouse_id || m.id === s.spouse_id);
      if (spouse) {
        tree.push({ type: 'union', members: [m, spouse] });
        processedIds.add(m.id);
        processedIds.add(spouse.id);
      } else {
        tree.push({ type: 'individual', members: [m] });
        processedIds.add(m.id);
      }
    });

    return tree;
  };

  const vanshTree = buildTree();

  return (
    <div className="space-y-16 pb-32 relative min-h-[900px] celestial-akasha rounded-[3.5rem] p-6 sm:p-12 overflow-hidden border border-white/5">
      <style jsx global>{`
        .celestial-akasha {
          background: radial-gradient(circle at 50% -20%, #1a1b3a 0%, #05050a 100%);
          position: relative;
        }
        .celestial-akasha::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: radial-gradient(white 1px, transparent 1px);
          background-size: 100px 100px;
          opacity: 0.05;
          pointer-events: none;
        }
        .etheric-path {
          stroke: rgba(251, 191, 36, 0.15);
          stroke-width: 1.5;
          fill: none;
          stroke-dasharray: 6 12;
          animation: ether-flow 30s linear infinite;
        }
        @keyframes ether-flow {
          from { stroke-dashoffset: 200; }
          to { stroke-dashoffset: 0; }
        }
        .orb-glow {
          box-shadow: 0 0 30px rgba(var(--brand-primary-rgb), 0.15);
        }
      `}</style>

      {/* ─── Celestial Hero Header ─── */}
      <div className="relative rounded-[2.5rem] p-10 overflow-hidden border border-white/10 bg-black/40 backdrop-blur-2xl orb-glow">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[var(--brand-primary)] opacity-[0.08] blur-[100px]" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
            className="w-20 h-20 rounded-full flex items-center justify-center text-4xl bg-gradient-to-br from-amber-200/20 to-transparent border border-amber-500/30"
          >
            🔯
          </motion.div>
          <div className="flex-1 space-y-2 text-center md:text-left">
            <p className="text-[10px] font-black uppercase tracking-[0.6em] text-amber-500/60">
              {t('kulVanshTitle')}
            </p>
            <h3 className="font-display text-3xl md:text-5xl font-bold text-white premium-serif tracking-tight">
              {t('kulLivingLineage')}
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed max-w-xl italic opacity-70">
              &ldquo;{t('kulHeritageQuote')}&rdquo;
            </p>
          </div>
          {canManageVansh && (
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              onClick={() => setShowAdd(true)}
              className="px-10 py-5 rounded-full bg-amber-500 text-black font-black text-xs uppercase tracking-widest shadow-2xl shadow-amber-500/20"
            >
              <Plus size={18} strokeWidth={3} className="inline mr-2" />
              {t('kulAddMember')}
            </motion.button>
          )}
        </div>
      </div>

      {familyMembers.length === 0 && !showAdd && (
        <div className="py-40 text-center relative z-10">
          <h4 className="text-2xl font-bold text-white/30 premium-serif">{t('kulVanshEmptyTitle')}</h4>
          <button onClick={() => setShowAdd(true)} className="mt-8 px-12 py-4 rounded-full border border-amber-500/30 text-amber-500 font-bold hover:bg-amber-500/10 transition-all">
            {t('kulCreateFirstBranch')}
          </button>
        </div>
      )}

      {/* ─── RECURSIVE FRACTAL ENGINE ─── */}
      <div className="flex flex-col items-center gap-24 relative">
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

// ─── THE FRACTAL NODE (Recursive Lineage) ───
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
    <div className="flex flex-col items-center relative py-12 w-full">
      {/* ── Etheric Connection Line (Parent to Children) ── */}
      {processedChildren.length > 0 && (
        <svg className="absolute bottom-0 left-0 w-full h-24 -z-10 pointer-events-none" style={{ top: '100%' }}>
          <path className="etheric-path" d={`M 50% 0 L 50% 100%`} />
        </svg>
      )}

      {/* ── The Core Dharma Node ── */}
      <div className="relative z-20">
        {node.type === 'union' ? (
          <div className="flex items-center gap-12 sm:gap-20 group/union relative dharma-cluster">
             {/* Sacred Union Heart */}
             <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30">
               <motion.div 
                 animate={{ scale: [1, 1.2, 1] }} 
                 transition={{ duration: 4, repeat: Infinity }}
                 className="w-10 h-10 rounded-full bg-black border border-amber-500/40 flex items-center justify-center text-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.4)]"
               >
                 <Heart size={14} fill="currentColor" />
               </motion.div>
             </div>
             
             {/* Union Aura */}
             <div className="absolute inset-x-[-30px] inset-y-[-10px] rounded-[3.5rem] bg-amber-500/[0.03] border border-amber-500/10 blur-[2px] -z-10 opacity-0 group-hover/union:opacity-100 transition-all duration-700" />

             {node.members.map((m: FamilyMember) => (
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

      {/* ── Fractal Branches (Children) ── */}
      {processedChildren.length > 0 && (
        <div className="relative mt-24 flex items-start justify-center gap-16 md:gap-32 w-full">
           {/* Horizontal Branching Thread */}
           {processedChildren.length > 1 && (
             <div className="absolute top-0 left-[20%] right-[20%] h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
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

// ─── THE CELESTIAL ORB (Vansh Card) ───
function VanshCard({ member, canManage, onClick, onEdit, onDelete, delay }: { member: FamilyMember, canManage: boolean, onClick: any, onEdit: any, onDelete: any, delay: number }) {
  const { t } = useLanguage();
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -8 }}
      onClick={onClick}
      className="group relative cursor-pointer z-20"
    >
      {/* Celestial Halo */}
      <div className={`absolute inset-[-12px] rounded-[3.2rem] opacity-0 group-hover:opacity-100 transition-all duration-1000 bg-gradient-to-br ${member.gender === 'M' ? 'from-blue-500/20' : 'from-pink-500/20'} to-transparent blur-2xl -z-10`} />

      <div className="relative w-[11rem] sm:w-[13rem] rounded-[3rem] p-6 text-center border border-white/10 bg-white/5 backdrop-blur-3xl shadow-2xl transition-all duration-500 hover:border-amber-500/40 hover:bg-white/10 overflow-hidden ring-1 ring-white/5">
        <FamilyKeepsakeStage member={member} />
        
        <div className="mt-5 space-y-1">
          <p className="text-[16px] font-bold text-white premium-serif tracking-tight leading-tight group-hover:text-amber-200 transition-colors">{member.name}</p>
          <p className="text-[8px] font-black uppercase tracking-[0.3em] text-amber-500/60">{member.role || (member.gender === 'M' ? 'Purusha' : 'Prakriti')}</p>
        </div>

        {/* Interaction Panel */}
        {canManage && (
          <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={(e) => { e.stopPropagation(); onEdit(); }} 
              className="w-8 h-8 rounded-full bg-black/40 text-white/60 hover:text-amber-500 border border-white/5 flex items-center justify-center transition-all"
            >
              <Pencil size={12} />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(); }} 
              className="w-8 h-8 rounded-full bg-black/40 text-white/60 hover:text-red-500 border border-white/5 flex items-center justify-center transition-all"
            >
              <X size={12} />
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
