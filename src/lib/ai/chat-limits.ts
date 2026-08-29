// ─── Dharma Mitra daily message limits ─────────────────────────────────────
// Single source of truth consumed by both the chat POST route and the usage
// GET route so the two endpoints can never drift out of sync.

export const FREE_DAILY_LIMIT = 20;
export const PRO_DAILY_LIMIT  = 20;
