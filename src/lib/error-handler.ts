/**
 * Humanizes database and network errors into user-friendly messages.
 *
 * Priority order:
 *  1. Kul-specific membership exceptions (RAISE EXCEPTION from RPCs)
 *  2. Common PostgREST / Supabase error patterns
 *  3. Network-level failures
 *  4. Raw message fallback
 */
export function formatError(error: any): string {
  if (!error) return 'An unexpected error occurred.';

  const message: string = (error.message ?? error.details ?? String(error));

  // ── Kul membership exceptions (thrown by create_kul / join_kul RPCs) ─────
  if (message.includes('already in a Kul') || message.includes('already in a kul')) {
    return 'You are already part of a Kul. Leave your current Kul first.';
  }
  if (message.includes('Leave it first')) {
    return 'You are already part of a Kul. Leave your current Kul first.';
  }
  if (message.includes('already a member of this Kul') || message.includes('already a member of this kul')) {
    return 'You are already a member of this Kul.';
  }
  if (message.includes('Kul not found') || message.includes('kul not found')) {
    return 'Kul not found. Double-check the invite code and try again.';
  }
  if (message.includes('not in a Kul') || message.includes('not in a kul')) {
    return 'You are not currently in a Kul.';
  }
  if (message.includes('Invite code already taken')) {
    return 'That invite code is taken. Please try a different one.';
  }

  // ── Duplicate-key violations (includes kul_members UNIQUE constraint) ────
  if (message.includes('duplicate key') || error.code === '23505') {
    // kul_members has a UNIQUE(kul_id, user_id) constraint
    if (message.includes('kul_members')) {
      return 'You are already a member of this Kul.';
    }
    if (message.includes('invite_code') || message.includes('idx_kuls_invite')) {
      return 'That invite code is already in use. Please try a different one.';
    }
    return 'This record already exists.';
  }

  // ── Standard Supabase / PostgREST errors ─────────────────────────────────
  if (message.includes('column') && message.includes('not found')) {
    return 'System sync in progress. Please refresh in a moment 🙏';
  }

  if (message.includes('JWT')) {
    return 'Your session has expired. Please log in again.';
  }

  if (
    message.toLowerCase().includes('network') ||
    message.toLowerCase().includes('fetch') ||
    message.toLowerCase().includes('failed to fetch')
  ) {
    return 'Connection lost. Check your internet and try again.';
  }

  if (message.includes('policy') || error.code === '42501') {
    return 'You do not have permission to perform this action.';
  }

  // ── Default fallback ──────────────────────────────────────────────────────
  return message;
}
