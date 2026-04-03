export type GuidedPathStatus = 'active' | 'dismissed' | 'completed';

export interface GuidedPathProgressRow {
  path_id: string;
  status: GuidedPathStatus;
  completed_at: string | null;
  updated_at: string;
}

export function buildGuidedPathStatusMap(rows: GuidedPathProgressRow[]) {
  return rows.reduce<Record<string, GuidedPathStatus>>((acc, row) => {
    acc[row.path_id] = row.status;
    return acc;
  }, {});
}
