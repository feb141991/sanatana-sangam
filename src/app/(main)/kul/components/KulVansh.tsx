'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  CalendarDays,
  Crown,
  Edit3,
  GitBranch,
  Heart,
  Lock,
  MapPin,
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
    <div className="relative min-h-[760px] overflow-hidden rounded-[2rem] border border-[var(--card-border)] bg-[var(--surface-base)] pb-28">
      <div className="absolute inset-x-0 top-0 h-72 bg-[var(--brand-primary-soft)] opacity-70 blur-3xl" />

      <div className="relative z-10 space-y-6 p-4 sm:p-6">
        <header className="rounded-[2rem] border border-[var(--card-border)] bg-[var(--card-bg)]/90 p-5 shadow-sm backdrop-blur-xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-medium text-[var(--brand-primary)]">{t('kulVanshTitle')}</p>
              <h2 className="mt-1 text-3xl font-medium leading-tight theme-ink premium-serif">{t('kulLivingLineage')}</h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed theme-muted">
                Build one family graph, then view it as a tree, mandala, timeline, constellation, scroll, or courtyard.
              </p>
            </div>

            {canManageVansh && (
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => setShowAdd(true)}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[var(--brand-primary)] px-5 text-sm font-medium text-white shadow-sm"
              >
                <Plus size={17} />
                {t('kulAddMember')}
              </motion.button>
            )}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {VIEW_OPTIONS.map((option) => {
              const Icon = option.icon;
              const active = activeView === option.key;
              const locked = option.pro && !isPro;
              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => selectView(option.key)}
                  className={`flex min-h-16 items-center gap-3 rounded-2xl border px-3 text-left transition ${
                    active
                      ? 'border-[var(--brand-primary)] bg-[var(--brand-primary-soft)] text-[var(--brand-primary-strong)] shadow-sm'
                      : 'border-[var(--card-border)] bg-[var(--card-bg-soft)] theme-muted hover:border-[var(--brand-primary)]'
                  }`}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--surface-raised)]">
                    <Icon size={17} className={active ? 'text-[var(--brand-primary)]' : 'theme-muted'} />
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-1.5 text-sm font-medium">
                      {option.label}
                      {locked && <Lock size={12} />}
                    </span>
                    <span className="block truncate text-xs theme-muted">{option.description}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </header>

        {familyMembers.length === 0 && !showAdd ? (
          <EmptyVanshState canManageVansh={canManageVansh} onAdd={() => setShowAdd(true)} />
        ) : (
          <section className="relative overflow-hidden rounded-[2rem] border border-[var(--card-border)] bg-[var(--card-bg)]/86 p-4 shadow-sm backdrop-blur-xl sm:p-6">
            <ViewHeader activeMeta={activeMeta} memberCount={familyMembers.length} isLocked={isLocked} />

            <div className="mt-6">
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
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--brand-primary-soft)] text-[var(--brand-primary)]">
          <Icon size={20} />
        </div>
        <div>
          <h3 className="text-xl font-medium theme-ink premium-serif">{activeMeta.label}</h3>
          <p className="text-sm theme-muted">{memberCount} family members preserved</p>
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
    <div className="rounded-[2rem] border border-dashed border-[var(--card-border)] bg-[var(--card-bg)]/80 px-6 py-16 text-center">
      <TreePine className="mx-auto text-[var(--brand-primary)]" size={36} />
      <h3 className="mt-5 text-2xl font-medium theme-ink premium-serif">{t('kulVanshEmptyTitle')}</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed theme-muted">
        Start with yourself or an elder, then connect parents, spouses, children, and memories.
      </p>
      {canManageVansh && (
        <button onClick={onAdd} className="mt-6 rounded-full bg-[var(--brand-primary)] px-6 py-3 text-sm font-medium text-white">
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
    <div className="overflow-x-auto pb-6">
      <div className="flex min-w-max flex-col items-center gap-10 px-4">
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
          <div className="h-8 w-px bg-[var(--brand-primary-soft)]" />
          <div className="h-px w-full min-w-40 bg-[var(--brand-primary-soft)]" />
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
      className="group relative w-[154px] rounded-[1.5rem] border border-[var(--card-border)] bg-[var(--surface-raised)] p-3 text-center shadow-sm"
    >
      <button type="button" onClick={() => onSelect(member)} className="block w-full">
        <MemberAvatar member={member} size="lg" />
        <p className="mt-3 truncate text-base font-medium theme-ink premium-serif">{member.name}</p>
        <p className="mt-1 truncate text-xs theme-muted">{member.role || relationFallback(member)}</p>
        <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] theme-muted">
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
  const radius = 138;
  return (
    <div className="relative mx-auto h-[430px] max-w-[430px] overflow-hidden rounded-[2rem] border border-[var(--card-border)] bg-[var(--surface-base)]">
      <div className="absolute left-1/2 top-1/2 h-36 w-36 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[var(--brand-primary)] bg-[var(--brand-primary-soft)] text-center">
        <div className="flex h-full flex-col items-center justify-center">
          <Sparkles size={22} className="text-[var(--brand-primary)]" />
          <p className="mt-2 text-2xl font-medium theme-ink premium-serif">Kul</p>
          <p className="text-xs theme-muted">{members.length} souls</p>
        </div>
      </div>
      <div className="absolute left-1/2 top-1/2 h-[320px] w-[320px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-[var(--brand-primary-soft)]" />
      {members.slice(0, 18).map((member, index) => {
        const angle = (index / Math.max(members.slice(0, 18).length, 1)) * Math.PI * 2 - Math.PI / 2;
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
            <MemberAvatar member={member} size="sm" />
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
    <div className="overflow-x-auto pb-4">
      <div className="flex min-w-max items-stretch gap-4">
        {generations.map(([generation, members]) => (
          <div key={generation} className="w-64 rounded-[1.5rem] border border-[var(--card-border)] bg-[var(--surface-raised)] p-4">
            <p className="text-sm font-medium text-[var(--brand-primary)]">Generation {generation}</p>
            <div className="mt-4 space-y-3">
              {members.map((member) => (
                <button key={member.id} type="button" onClick={() => onSelect(member)} className="flex w-full items-center gap-3 rounded-2xl bg-[var(--card-bg-soft)] p-3 text-left">
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
  const positions = members.map((member, index) => ({
    member,
    x: 12 + ((index * 31) % 74),
    y: 14 + ((index * 47) % 70),
  }));

  return (
    <div className="relative h-[440px] overflow-hidden rounded-[2rem] border border-[var(--card-border)] bg-[var(--surface-base)]">
      <svg className="absolute inset-0 h-full w-full" aria-hidden="true">
        {positions.slice(1).map((point, index) => {
          const previous = positions[index];
          return (
            <line
              key={`${point.member.id}-${previous.member.id}`}
              x1={`${previous.x}%`}
              y1={`${previous.y}%`}
              x2={`${point.x}%`}
              y2={`${point.y}%`}
              stroke="var(--brand-primary)"
              strokeOpacity="0.2"
              strokeWidth="1"
            />
          );
        })}
      </svg>
      {positions.map(({ member, x, y }) => (
        <button
          key={member.id}
          type="button"
          onClick={() => onSelect(member)}
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${x}%`, top: `${y}%` }}
        >
          <MemberAvatar member={member} size="sm" />
          <span className="mt-1 block max-w-20 truncate text-xs font-medium theme-ink">{member.name}</span>
        </button>
      ))}
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
    <div className="rounded-[2rem] border border-[var(--card-border)] bg-[var(--surface-raised)] p-5">
      <div className="space-y-5">
        {generations.map(([generation, members]) => (
          <section key={generation}>
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-[var(--card-border)]" />
              <p className="text-sm font-medium text-[var(--brand-primary)]">Generation {generation}</p>
              <div className="h-px flex-1 bg-[var(--card-border)]" />
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {members.map((member) => (
                <button key={member.id} type="button" onClick={() => onSelect(member)} className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg-soft)] p-4 text-left">
                  <p className="text-lg font-medium theme-ink premium-serif">{member.name}</p>
                  <p className="mt-1 text-sm theme-muted">{[member.role, birthLabel(member), member.birth_place].filter(Boolean).join(' · ') || 'Family record'}</p>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function TempleCourtyardView({ members, onSelect }: { members: FamilyMember[]; onSelect: (member: FamilyMember) => void }) {
  return (
    <div className="relative mx-auto h-[460px] max-w-[460px] overflow-hidden rounded-[2rem] border border-[var(--card-border)] bg-[var(--surface-base)]">
      <div className="absolute inset-x-16 top-8 h-24 rounded-t-[3rem] border border-[var(--brand-primary-soft)] bg-[var(--brand-primary-soft)]" />
      <div className="absolute left-1/2 top-20 h-24 w-24 -translate-x-1/2 rounded-full border border-[var(--brand-primary)] bg-[var(--surface-raised)] text-center">
        <div className="flex h-full flex-col items-center justify-center">
          <Sparkles size={18} className="text-[var(--brand-primary)]" />
          <p className="text-sm font-medium theme-ink">Kul</p>
        </div>
      </div>
      <div className="absolute inset-x-10 bottom-10 top-28 rounded-[3rem] border border-dashed border-[var(--brand-primary-soft)]" />
      {members.slice(0, 14).map((member, index) => {
        const column = index % 4;
        const row = Math.floor(index / 4);
        const left = 18 + column * 21;
        const top = 36 + row * 16;
        return (
          <button
            key={member.id}
            type="button"
            onClick={() => onSelect(member)}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${left}%`, top: `${top}%` }}
          >
            <MemberAvatar member={member} size="sm" />
          </button>
        );
      })}
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
