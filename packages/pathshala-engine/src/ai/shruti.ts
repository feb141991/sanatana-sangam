// ============================================================
// Shruti — Voice recitation upload, scoring, and history
// ============================================================

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  RecordingUploadOptions, RecordingUploadResult,
  RecitationResult, VerseMastery,
  PathshalaEngineConfig,
} from '../types';

export class ShrutiEngine {
  private supabase: SupabaseClient;
  private config:   PathshalaEngineConfig;

  constructor(supabase: SupabaseClient, config: PathshalaEngineConfig) {
    this.supabase = supabase;
    this.config   = config;
  }

  // ── Upload ────────────────────────────────────────────────────────────────

  /**
   * Upload audio to Supabase Storage and create the recording row.
   * Returns the recording_id — pass this to score() to trigger AI scoring.
   *
   * Storage path: {userId}/{chunkId}/{timestamp}.webm
   */
  async upload(userId: string, options: RecordingUploadOptions): Promise<RecordingUploadResult> {
    const timestamp = Date.now();
    const ext       = options.audioBlob.type.includes('mp4') ? 'mp4'
                    : options.audioBlob.type.includes('ogg') ? 'ogg'
                    : 'webm';
    const audioPath = `${userId}/${options.chunkId}/${timestamp}.${ext}`;

    // Upload to Supabase Storage
    const { error: uploadErr } = await this.supabase.storage
      .from('pathshala-recordings')
      .upload(audioPath, options.audioBlob, {
        contentType: options.audioBlob.type || 'audio/webm',
        upsert:      false,
      });

    if (uploadErr) {
      if (this.config.debug) console.error('[Shruti] upload:', uploadErr.message);
      throw new Error(`Audio upload failed: ${uploadErr.message}`);
    }

    // Create recording row (status = 'processing')
    const { data, error: insertErr } = await this.supabase
      .from('pathshala_recordings')
      .insert({
        user_id:       userId,
        chunk_id:      options.chunkId,
        enrollment_id: options.enrollmentId ?? null,
        audio_url:     audioPath,
        audio_bucket:  'pathshala-recordings',
        duration_s:    null,   // optional — can be set by client after MediaRecorder stops
        file_size_bytes: options.audioBlob.size,
        language:      options.language,
        script:        this._scriptForLanguage(options.language),
        expected_text: options.expectedText,
        status:        'processing',
      })
      .select('id')
      .single();

    if (insertErr) {
      if (this.config.debug) console.error('[Shruti] insert recording row:', insertErr.message);
      throw insertErr;
    }

    return { recordingId: data.id, audioPath };
  }

  /**
   * Trigger AI scoring for an uploaded recording.
   * Calls the ai-recitation-score Edge Function.
   * The function downloads the audio, runs Groq Whisper + Gemini, stores the review.
   */
  async score(recordingId: string): Promise<RecitationResult> {
    const { data, error } = await this.supabase.functions.invoke('ai-recitation-score', {
      body: { recording_id: recordingId },
    });

    if (error) {
      if (this.config.debug) console.error('[Shruti] score:', error.message);
      throw error;
    }

    return data as RecitationResult;
  }

  /**
   * Convenience: upload + score in one call.
   * Suitable for short audio (<10s) where you want instant feedback.
   */
  async uploadAndScore(userId: string, options: RecordingUploadOptions): Promise<RecitationResult> {
    const { recordingId } = await this.upload(userId, options);
    return this.score(recordingId);
  }

  // ── History ───────────────────────────────────────────────────────────────

  /** All recordings for a user, most recent first */
  async getRecordings(userId: string, limit = 20): Promise<Array<{
    id:           string;
    chunk_id:     string;
    language:     string;
    status:       string;
    submitted_at: string;
    scored_at:    string | null;
    overall_score: number | null;
  }>> {
    const { data } = await this.supabase
      .from('pathshala_recordings')
      .select(`
        id, chunk_id, language, status, submitted_at, scored_at,
        pathshala_recitation_reviews ( overall_score )
      `)
      .eq('user_id', userId)
      .order('submitted_at', { ascending: false })
      .limit(limit);

    return (data ?? []).map((r: Record<string, unknown>) => ({
      id:            r['id'] as string,
      chunk_id:      r['chunk_id'] as string,
      language:      r['language'] as string,
      status:        r['status'] as string,
      submitted_at:  r['submitted_at'] as string,
      scored_at:     r['scored_at'] as string | null,
      overall_score: (r['pathshala_recitation_reviews'] as Array<{ overall_score: number }>)?.[0]?.overall_score ?? null,
    }));
  }

  /** All reviews for a specific chunk */
  async getReviewsForChunk(userId: string, chunkId: string): Promise<Array<{
    recording_id:  string;
    reviewer_type: string;
    overall_score: number;
    feedback_text: string | null;
    corrections:   unknown[];
    is_certified:  boolean;
    reviewed_at:   string;
  }>> {
    const { data } = await this.supabase
      .from('pathshala_recordings')
      .select('id')
      .eq('user_id', userId)
      .eq('chunk_id', chunkId);

    if (!data || data.length === 0) return [];

    const recordingIds = data.map(r => r.id as string);

    const { data: reviews } = await this.supabase
      .from('pathshala_recitation_reviews')
      .select('recording_id, reviewer_type, overall_score, feedback_text, corrections, is_certified, reviewed_at')
      .in('recording_id', recordingIds)
      .order('reviewed_at', { ascending: false });

    return (reviews ?? []) as Array<{
      recording_id:  string;
      reviewer_type: string;
      overall_score: number;
      feedback_text: string | null;
      corrections:   unknown[];
      is_certified:  boolean;
      reviewed_at:   string;
    }>;
  }

  /** Get verse mastery for a chunk */
  async getMastery(userId: string, chunkId: string): Promise<VerseMastery | null> {
    const { data } = await this.supabase
      .from('pathshala_verse_mastery')
      .select('*')
      .eq('user_id', userId)
      .eq('chunk_id', chunkId)
      .maybeSingle();

    return (data ?? null) as VerseMastery | null;
  }

  /** Recitation stats across all verses */
  async getStats(userId: string): Promise<{
    total_recordings:        number;
    scored_count:            number;
    avg_overall_score:       number | null;
    avg_uccharan:            number | null;
    avg_fluency:             number | null;
    unique_verses_attempted: number;
    certified_count:         number;
    last_reviewed_at:        string | null;
  }> {
    const { data } = await this.supabase
      .from('pathshala_recitation_stats')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    return data ?? {
      total_recordings: 0, scored_count: 0,
      avg_overall_score: null, avg_uccharan: null, avg_fluency: null,
      unique_verses_attempted: 0, certified_count: 0, last_reviewed_at: null,
    };
  }

  // ── Guru review (submit for human review) ────────────────────────────────

  /**
   * Submit a recording for guru review.
   * Updates status to 'pending_guru' — the guardian in the user's kul gets notified.
   */
  async submitForGuruReview(recordingId: string): Promise<void> {
    const { error } = await this.supabase
      .from('pathshala_recordings')
      .update({ status: 'pending_guru' })
      .eq('id', recordingId);

    if (error && this.config.debug) console.error('[Shruti] submitForGuruReview:', error.message);
  }

  /**
   * Guardian posts their review.
   * Only callable by a user with guardian role in the recording user's kul.
   */
  async postGuruReview(
    reviewerId: string,
    recordingId: string,
    review: {
      scores: {
        uccharan?: number; sandhi?: number; visarga?: number;
        laya?: number; svara?: number; fluency?: number; overall: number;
      };
      feedback:    string;
      corrections?: Array<{ word: string; said: string; rule: string; severity: 'critical' | 'moderate' | 'minor' }>;
      isCertified?: boolean;
    }
  ): Promise<void> {
    const { error } = await this.supabase
      .from('pathshala_recitation_reviews')
      .insert({
        recording_id:   recordingId,
        reviewer_id:    reviewerId,
        reviewer_type:  'guru',
        score_uccharan: review.scores.uccharan ?? null,
        score_sandhi:   review.scores.sandhi   ?? null,
        score_visarga:  review.scores.visarga  ?? null,
        score_laya:     review.scores.laya     ?? null,
        score_svara:    review.scores.svara    ?? null,
        score_fluency:  review.scores.fluency  ?? null,
        overall_score:  review.scores.overall,
        feedback_text:  review.feedback,
        corrections:    review.corrections ?? [],
        is_certified:   review.isCertified ?? false,
        reviewed_at:    new Date().toISOString(),
      });

    if (error && this.config.debug) console.error('[Shruti] postGuruReview:', error.message);

    // Update recording status
    await this.supabase
      .from('pathshala_recordings')
      .update({ status: 'guru_reviewed', reviewed_at: new Date().toISOString() })
      .eq('id', recordingId);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private _scriptForLanguage(lang: string): string {
    const scripts: Record<string, string> = {
      sa: 'Devanagari', hi: 'Devanagari', mr: 'Devanagari', awa: 'Devanagari',
      ta: 'Tamil', te: 'Telugu', kn: 'Kannada', ml: 'Malayalam',
      bn: 'Bengali', gu: 'Gujarati', or: 'Odia', pa: 'Gurmukhi',
      en: 'Latin',
    };
    return scripts[lang] ?? 'Devanagari';
  }
}
