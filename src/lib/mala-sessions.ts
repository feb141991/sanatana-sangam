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
  tradition?: string | null;
  practice_type?: string | null;
  intention?: string | null;
  completion_type?: string | null;
  target_rounds?: number | null;
  completed_rounds?: number | null;
  completed_beads?: number | null;
  mood_before?: string | null;
  mood_after?: string | null;
  ambient_id?: string | null;
  spiritual_time_window?: string | null;
  spiritual_date?: string | null;
  timezone?: string | null;
  haptics_enabled?: boolean | null;
  source_route?: string | null;
  panchang_context?: Record<string, unknown> | null;
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
  tradition?: string | null;
  practice_type?: string | null;
  intention?: string | null;
  completion_type?: string | null;
  target_rounds?: number | null;
  completed_rounds?: number | null;
  completed_beads?: number | null;
  mood_before?: string | null;
  mood_after?: string | null;
  ambient_id?: string | null;
  spiritual_time_window?: string | null;
  spiritual_date?: string | null;
  timezone?: string | null;
  haptics_enabled?: boolean | null;
  source_route?: string | null;
  panchang_context?: Record<string, unknown> | null;
}

export function malaSessionDate(row: MalaSessionRow): string {
  return row.completed_at?.slice(0, 10)
    ?? row.spiritual_date
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

export function malaSessionSpiritualWindow(row: MalaSessionRow): string | null {
  return row.spiritual_time_window ?? null;
}

export function malaSessionCompletionType(row: MalaSessionRow): string | null {
  return row.completion_type ?? null;
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
  tradition?: string | null;
  practiceType?: string | null;
  intention?: string | null;
  completionType?: string | null;
  targetRounds?: number | null;
  completedRounds?: number | null;
  completedBeads?: number | null;
  moodBefore?: string | null;
  moodAfter?: string | null;
  ambientId?: string | null;
  spiritualTimeWindow?: string | null;
  spiritualDate?: string | null;
  timezone?: string | null;
  hapticsEnabled?: boolean | null;
  sourceRoute?: string | null;
  panchangContext?: Record<string, unknown> | null;
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
    tradition: input.tradition ?? null,
    practice_type: input.practiceType ?? 'mala',
    intention: input.intention ?? null,
    completion_type: input.completionType ?? 'completed',
    target_rounds: input.targetRounds ?? null,
    completed_rounds: input.completedRounds ?? rounds,
    completed_beads: input.completedBeads ?? input.count,
    mood_before: input.moodBefore ?? null,
    mood_after: input.moodAfter ?? null,
    ambient_id: input.ambientId ?? null,
    spiritual_time_window: input.spiritualTimeWindow ?? null,
    spiritual_date: input.spiritualDate ?? input.date ?? completedAt.slice(0, 10),
    timezone: input.timezone ?? null,
    haptics_enabled: input.hapticsEnabled ?? true,
    source_route: input.sourceRoute ?? '/bhakti/mala',
    panchang_context: input.panchangContext ?? null,
  };
}
