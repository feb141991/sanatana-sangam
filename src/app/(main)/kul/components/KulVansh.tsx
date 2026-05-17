'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  CalendarDays,
  ChevronLeft,
  Crown,
  Edit3,
  Heart,
  Lock,
  MapPin,
  MoreVertical,
  Network,
  Orbit,
  Plus,
  ScrollText,
  Sparkles,
  Trash2,
  TreePine,
} from 'lucide-react';
import PremiumActivateModal from '@/components/premium/PremiumActivateModal';
import { usePremium } from '@/hooks/usePremium';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { FamilyMember, MemberRow } from '../types';

type VanshView = 'lineage' | 'mandala' | 'timeline' | 'constellation' | 'scroll' | 'courtyard';

type TreeNode = {
  member: FamilyMember;
  spouse: FamilyMember | null;
  children: TreeNode[];
  generation: number;
};

const VIEW_OPTIONS: Array<{
  key: VanshView;
  label: string;
  description: string;
  icon: typeof TreePine;
  pro: boolean;
}> = [
  { key: 'lineage', label: 'Lineage tree', description: 'Clear parent-child structure', icon: TreePine, pro: false },
  { key: 'mandala', label: 'Kul mandala', description: 'Radial family rings', icon: Orbit, pro: true },
  { key: 'timeline', label: 'Living timeline', description: 'Generations across time', icon: CalendarDays, pro: true },
  { key: 'constellation', label: 'Constellation', description: 'Interactive family clusters', icon: Network, pro: true },
  { key: 'scroll', label: 'Ancestral scroll', description: 'Archive-style family record', icon: ScrollText, pro: true },
  { key: 'courtyard', label: 'Temple courtyard', description: 'Sacred family gathering view', icon: Crown, pro: true },
];

export function KulVansh({
  members,
  familyMembers,
  canManageVansh,
  openMemberDetails: _openMemberDetails,
  openEdit,
  deleteMember,
  showAdd,
  setShowAdd,
  onBack,
}: {
  members: MemberRow[];
  familyMembers: FamilyMember[];
  canManageVansh: boolean;
  openMemberDetails: (m: FamilyMember) => void;
  openEdit: (m: FamilyMember) => void;
  deleteMember: (id: string, name: string) => void;
  showAdd: boolean;
  setShowAdd: (show: boolean) => void;
  onBack?: () => void;
}) {
  const { t } = useLanguage();
  const isPro = usePremium();
  const [activeView, setActiveView] = useState<VanshView>('lineage');
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  const [showProModal, setShowProModal] = useState(false);

  const graph = useMemo(() => buildFamilyGraph(familyMembers), [familyMembers]);
  const activeMeta = VIEW_OPTIONS.find((option) => option.key === activeView) ?? VIEW_OPTIONS[0];
  const isLocked = activeMeta.pro && !isPro;

  function selectView(view: VanshView) {
    const meta = VIEW_OPTIONS.find((option) => option.key === view);
    if (meta?.pro && !isPro) {
      setActiveView(view);
      setShowProModal(true);
      return;
    }
    setActiveView(view);
  }

  return (
    <div className="relative min-h-[calc(100svh-120px)] overflow-hidden bg-[var(--surface-base)] pb-28">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(201,163,91,0.055)_1px,transparent_1px),linear-gradient(90deg,rgba(201,163,91,0.055)_1px,transparent_1px)] bg-[length:34px_34px]" />
      <div className="absolute -right-28 top-10 h-72 w-72 rounded-full bg-[var(--brand-primary-soft)]/48 blur-3xl" />
      <div className="absolute -left-24 bottom-20 h-64 w-64 rounded-full bg-[var(--brand-primary-soft)]/36 blur-3xl" />

      <div className="relative z-10 space-y-4 px-1 pt-2 sm:px-2">
        <header className="space-y-4">
          <div className="grid min-h-12 grid-cols-[44px_1fr_44px] items-center gap-2">
            <button
              type="button"
              onClick={onBack}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--surface-raised)]/76 theme-ink shadow-sm backdrop-blur-md"
              aria-label="Back to Kul hub"
            >
              <ChevronLeft size={22} />
            </button>
            <div className="min-w-0 text-center">
              <p className="truncate text-xl font-medium leading-tight theme-ink premium-serif">Kul Vriksha</p>
              <p className="mt-0.5 text-xs theme-muted">{familyMembers.length} members preserved</p>
            </div>
            <button
              type="button"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--surface-raised)]/70 theme-muted shadow-sm backdrop-blur-md"
              aria-label="Kul Vriksha options"
            >
              <MoreVertical size={20} />
            </button>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {VIEW_OPTIONS.map((option) => {
              const Icon = option.icon;
              const active = activeView === option.key;
              const locked = option.pro && !isPro;
              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => selectView(option.key)}
                  className={`flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-left transition ${
                    active
                      ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)] text-white shadow-sm'
                      : 'border-[var(--card-border)] bg-[var(--surface-raised)]/62 theme-muted backdrop-blur-md hover:border-[var(--brand-primary)]'
                  }`}
                >
                  <Icon size={16} className={active ? 'text-white' : 'theme-muted'} />
                  <span className="min-w-0 whitespace-nowrap">
                    <span className="flex items-center gap-1.5 text-sm font-medium">
                      {option.label}
                      {locked && <Lock size={12} />}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </header>

        {familyMembers.length === 0 && !showAdd ? (
          <EmptyVanshState canManageVansh={canManageVansh} onAdd={() => setShowAdd(true)} />
        ) : (
          <section className="relative overflow-hidden">
            <ViewHeader activeMeta={activeMeta} memberCount={familyMembers.length} isLocked={isLocked} />

            <div className="mt-3">
              {activeView === 'lineage' && (
                <LineageTree
                  roots={graph.roots}
                  allMembers={familyMembers}
                  canManage={canManageVansh}
                  onSelect={setSelectedMember}
                  onEdit={openEdit}
                  onDelete={deleteMember}
                />
              )}
              {activeView === 'mandala' && (
                <LockedShell locked={isLocked} onUnlock={() => setShowProModal(true)}>
                  <MandalaView members={graph.sortedMembers} onSelect={setSelectedMember} />
                </LockedShell>
              )}
              {activeView === 'timeline' && (
                <LockedShell locked={isLocked} onUnlock={() => setShowProModal(true)}>
                  <TimelineView generations={graph.generations} onSelect={setSelectedMember} />
                </LockedShell>
              )}
              {activeView === 'constellation' && (
                <LockedShell locked={isLocked} onUnlock={() => setShowProModal(true)}>
                  <ConstellationView members={graph.sortedMembers} onSelect={setSelectedMember} />
                </LockedShell>
              )}
              {activeView === 'scroll' && (
                <LockedShell locked={isLocked} onUnlock={() => setShowProModal(true)}>
                  <AncestralScrollView generations={graph.generations} onSelect={setSelectedMember} />
                </LockedShell>
              )}
              {activeView === 'courtyard' && (
                <LockedShell locked={isLocked} onUnlock={() => setShowProModal(true)}>
                  <TempleCourtyardView members={graph.sortedMembers} onSelect={setSelectedMember} />
                </LockedShell>
              )}
            </div>
          </section>
        )}
      </div>

      {canManageVansh && familyMembers.length > 0 && (
        <motion.button
          whileTap={{ scale: 0.94 }}
          onClick={() => setShowAdd(true)}
          className="fixed bottom-28 left-1/2 z-30 flex h-16 w-16 -translate-x-1/2 items-center justify-center rounded-full bg-[var(--brand-primary)] text-white shadow-[0_18px_46px_rgba(216,138,28,0.34)]"
          aria-label={t('kulAddMember')}
        >
          <Plus size={30} />
        </motion.button>
      )}

      {selectedMember && (
        <FamilyMemberSheet
          member={selectedMember}
          canManage={canManageVansh}
          linkedProfile={members.find((member) => member.user_id === selectedMember.linked_user_id) ?? null}
          onClose={() => setSelectedMember(null)}
          onEdit={() => {
            openEdit(selectedMember);
            setSelectedMember(null);
          }}
          onDelete={() => {
            deleteMember(selectedMember.id, selectedMember.name);
            setSelectedMember(null);
          }}
        />
      )}

      <PremiumActivateModal open={showProModal} onClose={() => setShowProModal(false)} />
    </div>
  );
}

function buildFamilyGraph(members: FamilyMember[]) {
  const sortedMembers = [...members].sort(compareMembers);
  const byId = new Map(sortedMembers.map((member) => [member.id, member]));
  const pairedSpouses = new Set<string>();

  function toNode(member: FamilyMember, visited = new Set<string>()): TreeNode {
    visited.add(member.id);
    const spouse = member.spouse_id ? byId.get(member.spouse_id) ?? null : sortedMembers.find((item) => item.spouse_id === member.id) ?? null;
    if (spouse) pairedSpouses.add(spouse.id);

    const children = sortedMembers
      .filter((candidate) => candidate.parent_id === member.id || (spouse && candidate.parent_id === spouse.id))
      .filter((candidate) => !visited.has(candidate.id))
      .map((child) => toNode(child, new Set(visited)));

    return {
      member,
      spouse,
      children,
      generation: inferGeneration(member),
    };
  }

  const roots = sortedMembers
    .filter((member) => !member.parent_id || !byId.has(member.parent_id))
    .filter((member) => !pairedSpouses.has(member.id))
    .map((member) => toNode(member));

  const generations = new Map<number, FamilyMember[]>();
  sortedMembers.forEach((member) => {
    const generation = inferGeneration(member);
    generations.set(generation, [...(generations.get(generation) ?? []), member]);
  });

  return {
    roots,
    sortedMembers,
    generations: [...generations.entries()].sort(([a], [b]) => a - b),
  };
}

function compareMembers(a: FamilyMember, b: FamilyMember) {
  return inferGeneration(a) - inferGeneration(b)
    || (a.display_order ?? 0) - (b.display_order ?? 0)
    || (a.birth_year ?? 9999) - (b.birth_year ?? 9999)
    || a.name.localeCompare(b.name);
}

function inferGeneration(member: FamilyMember) {
  return member.generation ?? (member.parent_id ? 4 : 1);
}

function ViewHeader({
  activeMeta,
  memberCount,
  isLocked,
}: {
  activeMeta: (typeof VIEW_OPTIONS)[number];
  memberCount: number;
  isLocked: boolean;
}) {
  const Icon = activeMeta.icon;
  return (
    <div className="flex items-center justify-between gap-3 px-3">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--brand-primary-soft)] text-[var(--brand-primary)]">
          <Icon size={18} />
        </div>
        <div>
          <h3 className="text-xl font-medium theme-ink premium-serif">{activeMeta.label}</h3>
          <p className="text-xs theme-muted">{memberCount} family members preserved</p>
        </div>
      </div>
      {isLocked && (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--brand-primary)] bg-[var(--brand-primary-soft)] px-3 py-1.5 text-xs font-medium text-[var(--brand-primary-strong)]">
          <Lock size={12} />
          Pro
        </span>
      )}
    </div>
  );
}

function EmptyVanshState({ canManageVansh, onAdd }: { canManageVansh: boolean; onAdd: () => void }) {
  const { t } = useLanguage();
  return (
    <div className="mx-2 mt-4 rounded-[2rem] border border-dashed border-[var(--brand-primary-soft)] bg-[var(--surface-raised)]/62 px-5 py-10 text-center backdrop-blur-md">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--brand-primary-soft)] text-[var(--brand-primary)]">
        <TreePine size={30} />
      </div>
      <h3 className="mt-5 text-2xl font-medium theme-ink premium-serif">{t('kulVanshEmptyTitle')}</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed theme-muted">Add the first person and the Kul Vriksha will form from here.</p>
      {canManageVansh && (
        <button onClick={onAdd} className="mt-6 rounded-full bg-[var(--brand-primary)] px-6 py-3 text-sm font-medium text-white shadow-[0_14px_34px_rgba(216,138,28,0.26)]">
          {t('kulCreateFirstBranch')}
        </button>
      )}
    </div>
  );
}

function LineageTree({
  roots,
  allMembers,
  canManage,
  onSelect,
  onEdit,
  onDelete,
}: {
  roots: TreeNode[];
  allMembers: FamilyMember[];
  canManage: boolean;
  onSelect: (member: FamilyMember) => void;
  onEdit: (member: FamilyMember) => void;
  onDelete: (id: string, name: string) => void;
}) {
  if (!roots.length && allMembers.length) {
    return (
      <div className="overflow-x-auto pb-6">
        <div className="flex min-w-max items-start justify-center gap-4 px-2">
          {allMembers.map((member) => (
            <MemberNodeCard key={member.id} member={member} canManage={canManage} onSelect={onSelect} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[590px] overflow-x-auto rounded-[2.5rem] bg-[radial-gradient(circle_at_50%_10%,rgba(250,238,218,0.72),transparent_28%),linear-gradient(180deg,rgba(255,253,249,0.38),rgba(255,253,249,0.08))] py-8 pb-12 backdrop-blur-[2px]">
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute -left-8 top-20 h-28 w-28 rounded-full border border-[var(--brand-primary-soft)]" />
        <div className="absolute -right-10 top-36 h-32 w-32 rounded-full border border-[var(--brand-primary-soft)]" />
        <div className="absolute left-1/2 top-0 h-[520px] w-[520px] -translate-x-1/2 rounded-full border border-[var(--brand-primary-soft)]/70" />
      </div>
      <div className="relative flex min-w-max flex-col items-center gap-10 px-8">
        {roots.map((root) => (
          <TreeBranch key={root.member.id} node={root} canManage={canManage} onSelect={onSelect} onEdit={onEdit} onDelete={onDelete} />
        ))}
      </div>
    </div>
  );
}

function TreeBranch({
  node,
  canManage,
  onSelect,
  onEdit,
  onDelete,
}: {
  node: TreeNode;
  canManage: boolean;
  onSelect: (member: FamilyMember) => void;
  onEdit: (member: FamilyMember) => void;
  onDelete: (id: string, name: string) => void;
}) {
  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center gap-3">
        <MemberNodeCard member={node.member} canManage={canManage} onSelect={onSelect} onEdit={onEdit} onDelete={onDelete} />
        {node.spouse && (
          <>
            <Heart size={16} className="text-[var(--brand-primary)]" fill="currentColor" />
            <MemberNodeCard member={node.spouse} canManage={canManage} onSelect={onSelect} onEdit={onEdit} onDelete={onDelete} />
          </>
        )}
      </div>

      {node.children.length > 0 && (
        <>
          <div className="h-8 w-px bg-[var(--brand-primary)]/24" />
          <div className="h-px w-full min-w-40 bg-[var(--brand-primary)]/18" />
          <div className="flex items-start gap-6 pt-8">
            {node.children.map((child) => (
              <TreeBranch key={child.member.id} node={child} canManage={canManage} onSelect={onSelect} onEdit={onEdit} onDelete={onDelete} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function MemberNodeCard({
  member,
  canManage,
  onSelect,
  onEdit,
  onDelete,
}: {
  member: FamilyMember;
  canManage: boolean;
  onSelect: (member: FamilyMember) => void;
  onEdit: (member: FamilyMember) => void;
  onDelete: (id: string, name: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      className="group relative w-[132px] text-center"
    >
      <button type="button" onClick={() => onSelect(member)} className="block w-full">
        <MemberAvatar member={member} size="lg" />
        <p className="mt-3 truncate text-lg font-medium theme-ink premium-serif">{member.name}</p>
        <p className="mt-1 truncate text-xs theme-muted">{member.role || relationFallback(member)}</p>
        <div className="mx-auto mt-2 flex w-fit items-center justify-center gap-1.5 rounded-full border border-[var(--card-border)] bg-[var(--surface-raised)]/70 px-2.5 py-1 text-[11px] theme-muted backdrop-blur-md">
          {member.linked_user_id && <span className="h-2 w-2 rounded-full bg-[var(--brand-primary)]" />}
          <span>{member.birth_year || member.birth_date ? birthLabel(member) : member.is_alive ? 'Living' : 'Remembered'}</span>
        </div>
      </button>

      {canManage && (
        <div className="absolute -right-2 -top-2 flex gap-1 opacity-0 transition group-hover:opacity-100">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onEdit(member);
            }}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--card-border)] bg-[var(--surface-raised)] text-[var(--brand-primary)] shadow-sm"
            aria-label={`Edit ${member.name}`}
          >
            <Edit3 size={13} />
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onDelete(member.id, member.name);
            }}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-600 shadow-sm dark:border-red-500/20 dark:bg-red-500/10"
            aria-label={`Remove ${member.name}`}
          >
            <Trash2 size={13} />
          </button>
        </div>
      )}
    </motion.div>
  );
}

function MandalaView({ members, onSelect }: { members: FamilyMember[]; onSelect: (member: FamilyMember) => void }) {
  const visibleMembers = members.slice(0, 22);
  const innerCount = Math.min(visibleMembers.length, 8);
  return (
    <div className="relative mx-auto h-[520px] max-w-[520px] overflow-hidden">
      <div className="absolute inset-8 rounded-full border border-[var(--brand-primary-soft)]" />
      <div className="absolute inset-20 rounded-full border border-dashed border-[var(--brand-primary-soft)]" />
      <div className="absolute inset-32 rounded-full border border-[var(--brand-primary-soft)] opacity-70" />
      <div className="absolute left-1/2 top-1/2 h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[var(--brand-primary)] bg-[var(--brand-primary-soft)] text-center shadow-[0_18px_50px_rgba(216,138,28,0.16)]">
        <div className="flex h-full flex-col items-center justify-center">
          <Sparkles size={22} className="text-[var(--brand-primary)]" />
          <p className="mt-2 text-2xl font-medium theme-ink premium-serif">Kul</p>
          <p className="text-xs theme-muted">{members.length} souls</p>
        </div>
      </div>
      <div className="absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,transparent_46%,var(--brand-primary-soft)_47%,transparent_48%)] opacity-70" />
      {visibleMembers.map((member, index) => {
        const innerRing = index < innerCount;
        const count = innerRing ? innerCount : Math.max(visibleMembers.length - innerCount, 1);
        const ringIndex = innerRing ? index : index - innerCount;
        const radius = innerRing ? 126 : 202;
        const angle = (ringIndex / count) * Math.PI * 2 - Math.PI / 2 + (innerRing ? 0 : Math.PI / count);
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        return (
          <button
            key={member.id}
            type="button"
            onClick={() => onSelect(member)}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{ transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))` }}
            aria-label={member.name}
          >
            <MemberAvatar member={member} size={innerRing ? 'sm' : 'xs'} />
            <span className="mt-1 block max-w-20 truncate text-[11px] font-medium theme-ink">{member.name}</span>
          </button>
        );
      })}
    </div>
  );
}

function TimelineView({
  generations,
  onSelect,
}: {
  generations: Array<[number, FamilyMember[]]>;
  onSelect: (member: FamilyMember) => void;
}) {
  return (
    <div className="overflow-x-auto py-8 pb-10">
      <div className="relative flex min-w-max items-stretch gap-8 px-5">
        <div className="absolute left-8 right-8 top-12 h-px bg-[var(--brand-primary)]/24" />
        {generations.map(([generation, members]) => (
          <div key={generation} className="relative w-64 pt-8">
            <div className="absolute left-0 top-0 h-6 w-6 rounded-full border-4 border-[var(--surface-base)] bg-[var(--brand-primary)] shadow-sm" />
            <p className="text-sm font-medium text-[var(--brand-primary)]">Generation {generation}</p>
            <div className="mt-4 space-y-3">
              {members.map((member) => (
                <button key={member.id} type="button" onClick={() => onSelect(member)} className="flex w-full items-center gap-3 rounded-2xl bg-[var(--surface-raised)]/76 p-3 text-left shadow-sm backdrop-blur-md">
                  <MemberAvatar member={member} size="xs" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium theme-ink">{member.name}</span>
                    <span className="block truncate text-xs theme-muted">{birthLabel(member) || member.role || 'Family member'}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ConstellationView({ members, onSelect }: { members: FamilyMember[]; onSelect: (member: FamilyMember) => void }) {
  const visibleMembers = members.slice(0, 18);
  const positions = visibleMembers.map((member, index) => {
    const angle = (index / Math.max(visibleMembers.length, 1)) * Math.PI * 2 - Math.PI / 2;
    const ring = index % 3;
    const radiusX = ring === 0 ? 22 : ring === 1 ? 33 : 41;
    const radiusY = ring === 0 ? 18 : ring === 1 ? 27 : 34;
    return {
      member,
      x: 50 + Math.cos(angle) * radiusX + ((index % 2) * 2 - 1) * 2.5,
      y: 50 + Math.sin(angle) * radiusY + ((index % 3) - 1) * 2.2,
    };
  });
  const positionById = new Map(positions.map((point) => [point.member.id, point]));
  const relationLines = positions
    .map((point, index) => {
      const parent = point.member.parent_id ? positionById.get(point.member.parent_id) : null;
      const spouse = point.member.spouse_id ? positionById.get(point.member.spouse_id) : null;
      return {
        from: parent ?? spouse ?? positions[Math.max(index - 1, 0)],
        to: point,
      };
    })
    .filter((line) => line.from && line.from.member.id !== line.to.member.id);
  const starPoints = Array.from({ length: 72 }).map((_, index) => ({
    x: 4 + ((index * 29) % 92),
    y: 5 + ((index * 47) % 88),
    size: index % 9 === 0 ? 2.5 : index % 4 === 0 ? 1.8 : 1,
    opacity: 0.18 + (index % 5) * 0.1,
  }));

  return (
    <div className="relative h-[560px] overflow-hidden rounded-[2.75rem] bg-[#16130f] text-white shadow-[inset_0_0_80px_rgba(216,138,28,0.12)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_46%,rgba(250,199,117,0.22),transparent_25%),radial-gradient(circle_at_20%_20%,rgba(255,253,249,0.10),transparent_26%),radial-gradient(circle_at_82%_78%,rgba(216,138,28,0.16),transparent_30%)]" />
      <motion.div
        aria-hidden="true"
        className="absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#FAC775]/20"
        animate={{ rotate: 360 }}
        transition={{ duration: 80, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        aria-hidden="true"
        className="absolute left-1/2 top-1/2 h-[310px] w-[310px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-[#FAC775]/18"
        animate={{ rotate: -360 }}
        transition={{ duration: 70, repeat: Infinity, ease: 'linear' }}
      />
      <div className="absolute inset-0">
        {starPoints.map((star, index) => (
          <motion.span
            key={index}
            className="absolute rounded-full bg-[#FAEEDA]"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: star.size,
              height: star.size,
              opacity: star.opacity,
            }}
            animate={{ opacity: [star.opacity, Math.min(star.opacity + 0.42, 0.86), star.opacity], scale: [1, 1.45, 1] }}
            transition={{ duration: 2.6 + (index % 6) * 0.28, repeat: Infinity, delay: (index % 10) * 0.16 }}
          />
        ))}
      </div>
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="kul-constellation-line" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FAEEDA" stopOpacity="0.14" />
            <stop offset="50%" stopColor="#FAC775" stopOpacity="0.74" />
            <stop offset="100%" stopColor="#EF9F27" stopOpacity="0.18" />
          </linearGradient>
          <filter id="kul-constellation-glow">
            <feGaussianBlur stdDeviation="0.9" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {relationLines.map((line) => {
          return (
            <path
              key={`${line.from.member.id}-${line.to.member.id}`}
              d={`M ${line.from.x} ${line.from.y} Q ${(line.from.x + line.to.x) / 2} ${(line.from.y + line.to.y) / 2 - 8} ${line.to.x} ${line.to.y}`}
              vectorEffect="non-scaling-stroke"
              pathLength={100}
              transform="scale(1)"
              stroke="url(#kul-constellation-line)"
              filter="url(#kul-constellation-glow)"
              strokeWidth="1.15"
              fill="none"
            />
          );
        })}
        {positions.map((point) => (
          <circle key={`halo-${point.member.id}`} cx={point.x} cy={point.y} r="2.2" fill="#FAC775" opacity="0.18" />
        ))}
      </svg>
      <div className="absolute left-1/2 top-1/2 flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[#FAC775]/35 bg-[#FAEEDA]/10 backdrop-blur-md">
        <div className="h-14 w-14 rounded-full border border-[#FAC775]/40 bg-[#FAC775]/15" />
        <Sparkles size={18} className="absolute text-[#FAC775]" />
      </div>
      {positions.map(({ member, x, y }) => (
        <motion.button
          key={member.id}
          type="button"
          onClick={() => onSelect(member)}
          className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full text-center"
          style={{ left: `${x}%`, top: `${y}%` }}
          initial={{ opacity: 0, scale: 0.78 }}
          animate={{ opacity: 1, scale: 1 }}
          whileTap={{ scale: 0.94 }}
          transition={{ duration: 0.45 }}
        >
          <span className="block rounded-full border border-[#FAC775]/38 bg-[#FAEEDA]/12 p-1 shadow-[0_0_30px_rgba(250,199,117,0.18)] backdrop-blur-md">
            <MemberAvatar member={member} size="sm" />
          </span>
          <span className="mt-1 block max-w-24 truncate rounded-full border border-[#FAC775]/20 bg-[#16130f]/62 px-2 py-0.5 text-xs font-medium text-[#FAEEDA] backdrop-blur-md">{member.name}</span>
        </motion.button>
      ))}
      <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-[#FAC775]/70">Kul constellation</p>
          <p className="mt-1 max-w-56 text-sm leading-relaxed text-[#FAEEDA]/72">Tap any star to open the family profile.</p>
        </div>
        <span className="rounded-full border border-[#FAC775]/24 bg-[#FAEEDA]/10 px-3 py-1 text-xs text-[#FAEEDA]/78 backdrop-blur-md">{visibleMembers.length} stars</span>
      </div>
    </div>
  );
}

function AncestralScrollView({
  generations,
  onSelect,
}: {
  generations: Array<[number, FamilyMember[]]>;
  onSelect: (member: FamilyMember) => void;
}) {
  return (
    <div className="relative overflow-hidden rounded-[2.75rem] bg-[#efe4d3] p-4 shadow-[inset_0_0_90px_rgba(62,42,31,0.10)] dark:bg-[#2a2720]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_10%,rgba(255,253,249,0.72),transparent_24%),radial-gradient(circle_at_88%_80%,rgba(216,138,28,0.16),transparent_28%)]" />
      <div className="absolute left-6 top-5 h-[calc(100%-40px)] w-5 rounded-full bg-[linear-gradient(90deg,#8b6238,#c9a35b,#8b6238)] shadow-[0_8px_20px_rgba(62,42,31,0.20)]" />
      <div className="absolute right-6 top-5 h-[calc(100%-40px)] w-5 rounded-full bg-[linear-gradient(90deg,#8b6238,#c9a35b,#8b6238)] shadow-[0_8px_20px_rgba(62,42,31,0.20)]" />
      <div className="absolute inset-x-14 top-5 bottom-5 rounded-[2rem] border border-[#c9a35b]/24 bg-[#fffdf9]/56 dark:bg-[#333330]/64" />
      <div className="absolute inset-x-20 top-8 bottom-8 border-x border-dashed border-[#c9a35b]/32" />
      <div className="relative mx-9 space-y-6 px-2 py-6">
        <div className="mx-auto flex w-fit items-center gap-3 rounded-full border border-[#c9a35b]/30 bg-[#FAEEDA]/78 px-4 py-2 text-[#854F0B]">
          <ScrollText size={16} />
          <span className="text-xs font-medium tracking-[0.22em]">Family record</span>
        </div>
        {generations.map(([generation, members]) => (
          <motion.section
            key={generation}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.45 }}
          >
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-[#c9a35b]/34" />
              <p className="rounded-full bg-[#FAEEDA]/72 px-3 py-1 text-sm font-medium text-[#854F0B]">Generation {generation}</p>
              <div className="h-px flex-1 bg-[#c9a35b]/34" />
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {members.map((member) => (
                <button key={member.id} type="button" onClick={() => onSelect(member)} className="group flex items-center gap-3 rounded-[1.35rem] border border-[#c9a35b]/20 bg-[#fffdf9]/76 p-3 text-left shadow-[0_10px_30px_rgba(62,42,31,0.06)] backdrop-blur-md transition hover:-translate-y-0.5 dark:bg-[#333330]/74">
                  <MemberAvatar member={member} size="xs" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-lg font-medium text-[#3E2A1F] premium-serif dark:text-[#f0ede6]">{member.name}</span>
                    <span className="mt-0.5 block truncate text-sm text-[#6C4B35] dark:text-[#b5b0a5]">{[member.role, birthLabel(member), member.birth_place].filter(Boolean).join(' · ') || 'Family record'}</span>
                  </span>
                  <span className="h-8 w-8 rounded-full border border-[#c9a35b]/24 bg-[#FAEEDA]/70 transition group-hover:bg-[#FAC775]/40" />
                </button>
              ))}
            </div>
          </motion.section>
        ))}
      </div>
    </div>
  );
}

function TempleCourtyardView({ members, onSelect }: { members: FamilyMember[]; onSelect: (member: FamilyMember) => void }) {
  return (
    <div className="relative mx-auto h-[560px] max-w-[560px] overflow-hidden rounded-[2.75rem] bg-[radial-gradient(circle_at_50%_18%,rgba(250,199,117,0.24),transparent_26%),linear-gradient(180deg,rgba(250,246,239,0.96),rgba(239,228,211,0.50))] dark:bg-[linear-gradient(180deg,#2a2720,#1c1c1a)]">
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-[radial-gradient(ellipse_at_50%_0%,rgba(216,138,28,0.20),transparent_55%)]" />
      <div className="absolute left-1/2 top-10 h-20 w-72 -translate-x-1/2 rounded-t-[5rem] border border-[#C9A35B]/30 bg-[#FAEEDA]/58" />
      <div className="absolute left-1/2 top-24 h-20 w-80 -translate-x-1/2 rounded-t-[3rem] border border-[#C9A35B]/28 bg-[#FFFDF9]/62 dark:bg-[#333330]/68" />
      <div className="absolute left-1/2 top-[76px] h-14 w-14 -translate-x-1/2 rotate-45 border-l border-t border-[#C9A35B]/36 bg-[#FAEEDA]/70" />
      {[0, 1, 2, 3].map((step) => (
        <div
          key={step}
          className="absolute left-1/2 h-4 -translate-x-1/2 rounded-full border border-[#C9A35B]/24 bg-[#FFFDF9]/52 dark:bg-[#333330]/52"
          style={{ top: `${178 + step * 18}px`, width: `${240 + step * 42}px` }}
        />
      ))}
      <motion.div
        aria-hidden="true"
        className="absolute left-1/2 top-[184px] h-[300px] w-[420px] -translate-x-1/2 rounded-[50%] border border-dashed border-[#C9A35B]/30"
        animate={{ rotate: 360 }}
        transition={{ duration: 90, repeat: Infinity, ease: 'linear' }}
      />
      <div className="absolute left-1/2 top-24 h-28 w-28 -translate-x-1/2 rounded-full border border-[#C9A35B]/42 bg-[#FFFDF9]/78 text-center shadow-[0_16px_44px_rgba(62,42,31,0.12)] backdrop-blur-md dark:bg-[#333330]/82">
        <div className="flex h-full flex-col items-center justify-center">
          <Sparkles size={18} className="text-[var(--brand-primary)]" />
          <p className="text-sm font-medium theme-ink">Kul</p>
        </div>
      </div>
      {[22, 78].map((left, index) => (
        <motion.div
          key={left}
          className="absolute top-[230px] h-10 w-10 rounded-full border border-[#C9A35B]/24 bg-[#FAEEDA]/72 shadow-[0_10px_30px_rgba(216,138,28,0.12)]"
          style={{ left: `${left}%` }}
          animate={{ opacity: [0.6, 1, 0.6], scale: [1, 1.08, 1] }}
          transition={{ duration: 3.4, repeat: Infinity, delay: index * 0.8 }}
        >
          <span className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#D88A1C]" />
        </motion.div>
      ))}
      {members.slice(0, 14).map((member, index) => {
        const angle = (index / Math.max(members.slice(0, 14).length, 1)) * Math.PI * 2 + Math.PI / 2;
        const ring = index % 2;
        const left = 50 + Math.cos(angle) * (ring ? 35 : 24);
        const top = 66 + Math.sin(angle) * (ring ? 20 : 14);
        return (
          <motion.button
            key={member.id}
            type="button"
            onClick={() => onSelect(member)}
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#C9A35B]/24 bg-[#FFFDF9]/60 p-1 shadow-[0_10px_32px_rgba(62,42,31,0.10)] backdrop-blur-md dark:bg-[#333330]/68"
            style={{ left: `${left}%`, top: `${top}%` }}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            whileTap={{ scale: 0.94 }}
            transition={{ duration: 0.4, delay: index * 0.035 }}
          >
            <MemberAvatar member={member} size="sm" />
          </motion.button>
        );
      })}
      <div className="absolute bottom-5 left-1/2 w-[86%] -translate-x-1/2 rounded-[2rem] border border-[#C9A35B]/22 bg-[#FFFDF9]/58 p-4 text-center backdrop-blur-md dark:bg-[#333330]/64">
        <p className="text-xs uppercase tracking-[0.28em] text-[#C9A35B]">Temple courtyard</p>
        <p className="mt-1 text-sm text-[#6C4B35] dark:text-[#b5b0a5]">Family members gather around the Kul sanctum. Tap a person to open their profile.</p>
      </div>
    </div>
  );
}

function LockedShell({ locked, onUnlock, children }: { locked: boolean; onUnlock: () => void; children: React.ReactNode }) {
  return (
    <div className="relative">
      <div className={locked ? 'pointer-events-none select-none blur-[2px]' : ''}>{children}</div>
      {locked && (
        <div className="absolute inset-0 flex items-center justify-center rounded-[2rem] bg-[var(--surface-base)]/62 p-6 backdrop-blur-sm">
          <div className="max-w-xs rounded-[2rem] border border-[var(--brand-primary)] bg-[var(--surface-raised)] p-5 text-center shadow-sm">
            <Lock className="mx-auto text-[var(--brand-primary)]" size={24} />
            <p className="mt-3 text-lg font-medium theme-ink premium-serif">Pro Kul view</p>
            <p className="mt-1 text-sm theme-muted">Unlock premium ways to experience the same family graph.</p>
            <button onClick={onUnlock} className="mt-4 rounded-full bg-[var(--brand-primary)] px-5 py-3 text-sm font-medium text-white">
              Unlock Pro
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MemberAvatar({ member, size }: { member: FamilyMember; size: 'xs' | 'sm' | 'lg' }) {
  const sizeClass = {
    xs: 'h-10 w-10',
    sm: 'h-14 w-14',
    lg: 'h-16 w-16',
  }[size];
  const initial = member.name.trim()[0]?.toUpperCase() ?? 'S';

  return (
    <span className={`relative mx-auto flex ${sizeClass} items-center justify-center overflow-hidden rounded-full border-2 border-[var(--brand-primary-soft)] bg-[var(--brand-primary-soft)] text-base font-medium text-[var(--brand-primary-strong)]`}>
      {member.photo_url ? (
        <Image src={member.photo_url} alt={member.name} fill sizes="72px" className="object-cover" />
      ) : (
        initial
      )}
    </span>
  );
}

function FamilyMemberSheet({
  member,
  canManage,
  linkedProfile,
  onClose,
  onEdit,
  onDelete,
}: {
  member: FamilyMember;
  canManage: boolean;
  linkedProfile: MemberRow | null;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const location = [member.birth_place, linkedProfile?.profiles?.city, linkedProfile?.profiles?.country].filter(Boolean).join(', ');
  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/45 px-4 pb-6 pt-20 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-md rounded-[2rem] border border-[var(--card-border)] bg-[var(--surface-raised)] p-5 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <MemberAvatar member={member} size="lg" />
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-2xl font-medium theme-ink premium-serif">{member.name}</h3>
            <p className="mt-1 text-sm theme-muted">{member.role || relationFallback(member)}</p>
            {member.linked_user_id && <p className="mt-1 text-xs font-medium text-[var(--brand-primary)]">On Shoonaya</p>}
          </div>
          <button onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--card-bg-soft)] theme-muted">
            <span className="sr-only">Close</span>
            x
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <InfoTile label="Born" value={birthLabel(member) || 'Not added'} />
          <InfoTile label="Generation" value={`Generation ${inferGeneration(member)}`} />
          <InfoTile label="Status" value={member.is_alive ? 'Living' : 'Remembered'} />
          <InfoTile label="Linked" value={member.linked_user_id ? 'Profile connected' : 'Invite pending'} />
        </div>

        {location && (
          <div className="mt-4 flex items-center gap-2 rounded-2xl bg-[var(--card-bg-soft)] p-3 text-sm theme-muted">
            <MapPin size={15} className="text-[var(--brand-primary)]" />
            {location}
          </div>
        )}

        {member.notes && <p className="mt-4 rounded-2xl bg-[var(--card-bg-soft)] p-4 text-sm leading-relaxed theme-ink">{member.notes}</p>}

        {canManage && (
          <div className="mt-5 grid grid-cols-2 gap-3">
            <button onClick={onEdit} className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg-soft)] py-3 text-sm font-medium theme-ink">
              Edit
            </button>
            <button onClick={onDelete} className="rounded-2xl border border-red-200 bg-red-50 py-3 text-sm font-medium text-red-600 dark:border-red-500/20 dark:bg-red-500/10">
              Remove
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[var(--card-bg-soft)] p-3">
      <p className="text-xs theme-muted">{label}</p>
      <p className="mt-1 text-sm font-medium theme-ink">{value}</p>
    </div>
  );
}

function birthLabel(member: FamilyMember) {
  if (member.birth_date) return new Date(member.birth_date).getFullYear().toString();
  if (member.birth_year) return member.birth_year.toString();
  return '';
}

function relationFallback(member: FamilyMember) {
  if (!member.is_alive) return 'Ancestor';
  if (member.gender === 'male') return 'Family elder';
  if (member.gender === 'female') return 'Family elder';
  return 'Family member';
}
