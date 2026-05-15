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

    // Identify 'Roots' (members with no parent_id in our list)
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
    <div className="space-y-16 pb-32 relative min-h-[900px] celestial-fractal rounded-[3.5rem] p-6 sm:p-12 overflow-hidden border border-[var(--brand-primary-soft)] transition-all duration-700">
      <style jsx global>{`
        .celestial-fractal {
          background: var(--surface-base);
          background-image: 
            radial-gradient(circle at 50% -20%, var(--brand-primary-soft) 0%, transparent 70%),
            radial-gradient(circle at 100% 100%, var(--brand-primary-soft) 0%, transparent 50%);
          position: relative;
          z-index: 1;
        }
        .celestial-fractal::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: radial-gradient(var(--brand-primary) 1px, transparent 1px);
          background-size: 80px 80px;
          opacity: 0.1;
          pointer-events: none;
          z-index: -1;
        }
        .etheric-thread {
          stroke: var(--brand-primary);
          stroke-width: 1.5;
          fill: none;
          stroke-dasharray: 4 8;
          opacity: 0.3;
          animation: ether-pulse 20s linear infinite;
        }
        @keyframes ether-pulse {
          from { stroke-dashoffset: 100; }
          to { stroke-dashoffset: 0; }
        }
        .celestial-orb {
          border-radius: 50%;
          transition: all 0.6s cubic-bezier(0.22, 1, 0.36, 1);
          border: 1px solid var(--brand-primary-soft);
          background: var(--card-bg);
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
        }
        .celestial-orb:hover {
          border-color: var(--brand-primary);
          transform: translateY(-10px) scale(1.05);
          box-shadow: 0 20px 50px rgba(var(--brand-primary-rgb), 0.2);
        }
        .dharma-node-glow {
          position: absolute;
          inset: -15px;
          border-radius: 50%;
          background: radial-gradient(circle, var(--brand-primary-soft) 0%, transparent 70%);
          opacity: 0;
          transition: opacity 0.5s;
        }
        .celestial-orb:hover .dharma-node-glow {
          opacity: 1;
        }
      `}</style>

      {/* ─── Vriksha Header ─── */}
      <div className="relative rounded-[3rem] p-10 overflow-hidden border border-[var(--brand-primary-soft)] bg-white/[0.02] backdrop-blur-3xl shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[var(--brand-primary)] opacity-[0.05] blur-[100px]" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
            className="w-20 h-20 rounded-full flex items-center justify-center text-4xl bg-[var(--brand-primary-soft)] border border-[var(--brand-primary)]/20"
          >
            🌿
          </motion.div>
          <div className="flex-1 space-y-2 text-center md:text-left">
            <p className="text-[10px] font-black uppercase tracking-[0.6em] text-[var(--brand-primary)] opacity-70">
              {t('kulVanshTitle')}
            </p>
            <h3 className="font-display text-3xl md:text-5xl font-bold theme-ink premium-serif tracking-tight">
              {t('kulLivingLineage')}
            </h3>
            <p className="text-sm theme-muted leading-relaxed max-w-xl italic opacity-70">
              &ldquo;{t('kulHeritageQuote')}&rdquo;
            </p>
          </div>
          {canManageVansh && (
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              onClick={() => setShowAdd(true)}
              className="px-10 py-5 rounded-full bg-[var(--brand-primary)] text-white font-black text-xs uppercase tracking-widest shadow-2xl shadow-[var(--brand-primary-soft)]"
            >
              <Plus size={18} strokeWidth={3} className="inline mr-2" />
              {t('kulAddMember')}
            </motion.button>
          )}
        </div>
      </div>

      {familyMembers.length === 0 && !showAdd && (
        <div className="py-40 text-center relative z-10">
          <h4 className="text-2xl font-bold theme-muted premium-serif opacity-30">{t('kulVanshEmptyTitle')}</h4>
          <button onClick={() => setShowAdd(true)} className="mt-8 px-12 py-4 rounded-full border border-[var(--brand-primary-soft)] text-[var(--brand-primary)] font-bold hover:bg-[var(--brand-primary-soft)] transition-all">
            {t('kulCreateFirstBranch')}
          </button>
        </div>
      )}

      {/* ─── RECURSIVE CELESTIAL ENGINE ─── */}
      <div className="flex flex-col items-center gap-32 relative">
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

// ─── THE CELESTIAL NODE (Recursive Lineage) ───
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
    <div className="flex flex-col items-center relative py-16 w-full">
      {/* ── Connection Thread ── */}
      {processedChildren.length > 0 && (
        <div className="absolute bottom-[-64px] left-1/2 -translate-x-1/2 w-px h-32 bg-gradient-to-b from-[var(--brand-primary)]/40 to-transparent z-0" />
      )}

      {/* ── The Dharma Orb(s) ── */}
      <div className="relative z-20">
        {node.type === 'union' ? (
          <div className="flex items-center gap-16 md:gap-24 relative">
             {/* Sacred Union Symbol */}
             <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30">
               <motion.div 
                 animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }} 
                 transition={{ duration: 4, repeat: Infinity }}
                 className="text-[var(--brand-primary)] drop-shadow-[0_0_10px_rgba(200,146,74,0.5)]"
               >
                 <Heart size={20} fill="currentColor" />
               </motion.div>
             </div>
             
             {node.members.map((m: FamilyMember) => (
               <CelestialOrb 
                 key={m.id} 
                 member={m} 
                 canManage={canManage} 
                 onClick={() => onDetails(m)}
                 onEdit={() => onEdit(m)}
                 onDelete={() => onDelete(m.id, m.name)}
               />
             ))}
          </div>
        ) : (
          <CelestialOrb 
            member={node.members[0]} 
            canManage={canManage} 
            onClick={() => onDetails(node.members[0])}
            onEdit={() => onEdit(node.members[0])}
            onDelete={() => onDelete(node.members[0].id, node.members[0].name)}
          />
        )}
      </div>

      {/* ── Fractal Branches ── */}
      {processedChildren.length > 0 && (
        <div className="relative mt-32 flex items-start justify-center gap-20 md:gap-40 w-full">
           {/* Horizontal connection bar */}
           {processedChildren.length > 1 && (
             <div className="absolute top-0 left-[15%] right-[15%] h-px bg-gradient-to-r from-transparent via-[var(--brand-primary)]/30 to-transparent" />
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

// ─── THE CELESTIAL ORB ───
function CelestialOrb({ member, canManage, onClick, onEdit, onDelete }: { member: FamilyMember, canManage: boolean, onClick: any, onEdit: any, onDelete: any }) {
  const { t } = useLanguage();
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      onClick={onClick}
      className="group relative cursor-pointer z-20"
    >
      <div className="dharma-node-glow" />
      
      <div className="celestial-orb w-[12rem] h-[12rem] sm:w-[14rem] sm:h-[14rem]">
        {/* Profile Image / Keepsake */}
        <div className="w-full h-full p-6 flex flex-col items-center justify-center space-y-2">
          <FamilyKeepsakeStage member={member} />
          
          <div className="space-y-1 text-center">
            <h4 className="text-lg font-bold theme-ink premium-serif leading-tight">{member.name}</h4>
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[var(--brand-primary)] opacity-60">
              {member.role || (member.gender === 'M' ? 'Purusha' : 'Prakriti')}
            </p>
          </div>
        </div>

        {/* Floating Controls */}
        {canManage && (
          <div className="absolute bottom-6 flex gap-3 opacity-0 group-hover:opacity-100 transition-all transform translate-y-4 group-hover:translate-y-0">
            <button 
              onClick={(e) => { e.stopPropagation(); onEdit(); }} 
              className="w-10 h-10 rounded-full bg-[var(--brand-primary)] text-white shadow-lg flex items-center justify-center transition-all hover:scale-110"
            >
              <Pencil size={14} />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(); }} 
              className="w-10 h-10 rounded-full bg-red-500 text-white shadow-lg flex items-center justify-center transition-all hover:scale-110"
            >
              <X size={14} />
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
