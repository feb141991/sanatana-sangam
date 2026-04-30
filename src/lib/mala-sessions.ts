// Canonical Mala session adapter.
//
// Product wording can say Japa/Mala, but persistence is intentionally anchored
// on the existing `mala_sessions` table and original Mala fields. Newer columns
// are read only as compatibility aliases while older rows are migrated/backfilled.

export interface MalaSessionRow {
  id?: string;
  user_id?: string;
  mantra?: string | null;
  chant_source?: string | null;
  count?: number | null;
  target_count?: number | null;
  duration_seconds?: number | null;
  notes?: string | null;
  share_scope?: 'private' | 'kul' | 'public' | string | null;
  completed_at?: string | null;
  created_at?: string | null;
  date?: string | null;
  rounds?: number | null;
  bead_count?: number | null;
  mantra_id?: string | null;
  duration_secs?: number | null;
  mala_id?: string | null;
  background_scene?: string | null;
}

export interface MalaSessionInsert {
  user_id: string;
  mantra: string;
  chant_source?: string | null;
  count: number;
  target_count?: number | null;
  duration_seconds: number;
  notes?: string | null;
  share_scope?: 'private' | 'kul' | 'public';
  completed_at?: string;
  date?: string | null;
  rounds?: number | null;
  bead_count?: number | null;
  mantra_id?: string | null;
  duration_secs?: number | null;
  mala_id?: string | null;
  background_scene?: string | null;
}

export function malaSessionDate(row: MalaSessionRow): string {
  return row.completed_at?.slice(0, 10)
    ?? row.date
    ?? row.created_at?.slice(0, 10)
    ?? '';
}

export function malaSessionCreatedAt(row: MalaSessionRow): string {
  return row.created_at ?? row.completed_at ?? '';
}

export function malaSessionBeads(row: MalaSessionRow): number {
  return row.count ?? row.bead_count ?? 0;
}

export function malaSessionRounds(row: MalaSessionRow): number {
  if (row.target_count && row.target_count > 0) {
    return Math.floor(malaSessionBeads(row) / row.target_count);
  }
  if (row.rounds != null) return row.rounds;
  const beads = malaSessionBeads(row);
  return beads > 0 ? Math.floor(beads / 108) : 0;
}

export function malaSessionDurationSeconds(row: MalaSessionRow): number {
  return row.duration_seconds ?? row.duration_secs ?? 0;
}

export function malaSessionMantra(row: MalaSessionRow): string | null {
  return row.mantra ?? row.mantra_id ?? null;
}

export function malaSessionMalaId(row: MalaSessionRow): string | null {
  return row.mala_id ?? null;
}

export function buildMalaSessionInsert(input: {
  userId: string;
  mantra: string;
  count: number;
  durationSeconds: number;
  completedAt?: string;
  date?: string | null;
  malaId?: string | null;
  backgroundScene?: string | null;
  targetCount?: number | null;
  chantSource?: string | null;
  notes?: string | null;
  shareScope?: 'private' | 'kul' | 'public';
}): MalaSessionInsert {
  const completedAt = input.completedAt ?? new Date().toISOString();
  const targetCount = input.targetCount ?? 108;
  const rounds = input.count > 0 ? Math.floor(input.count / targetCount) : 0;

  return {
    user_id: input.userId,
    mantra: input.mantra,
    chant_source: input.chantSource ?? null,
    count: input.count,
    target_count: targetCount,
    duration_seconds: input.durationSeconds,
    notes: input.notes ?? null,
    share_scope: input.shareScope ?? 'private',
    completed_at: completedAt,
    // Compatibility aliases for deployments where v30 columns already exist.
    date: input.date ?? completedAt.slice(0, 10),
    rounds,
    bead_count: input.count,
    mantra_id: input.mantra,
    duration_secs: input.durationSeconds,
    mala_id: input.malaId ?? null,
    background_scene: input.backgroundScene ?? null,
  };
}
