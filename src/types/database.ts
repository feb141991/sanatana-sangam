export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      client_error_events: {
        Row: {
          id: string;
          incident_id: string;
          fingerprint: string;
          source: 'react_root' | 'react_home' | 'window_error' | 'unhandled_rejection' | 'qa_probe';
          error_name: string;
          error_message: string;
          stack: string | null;
          component_stack: string | null;
          route: string;
          browser_family: string;
          os_family: string;
          client_release_sha: string;
          client_deployment_url: string | null;
          server_release_sha: string;
          server_deployment_url: string | null;
          service_worker_controller: string | null;
          online: boolean | null;
          anonymous_session_hash: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          incident_id: string;
          fingerprint: string;
          source: 'react_root' | 'react_home' | 'window_error' | 'unhandled_rejection' | 'qa_probe';
          error_name: string;
          error_message: string;
          stack?: string | null;
          component_stack?: string | null;
          route: string;
          browser_family: string;
          os_family: string;
          client_release_sha: string;
          client_deployment_url?: string | null;
          server_release_sha: string;
          server_deployment_url?: string | null;
          service_worker_controller?: string | null;
          online?: boolean | null;
          anonymous_session_hash?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['client_error_events']['Insert']>;
      };
      calendar_integrity_findings: {
        Row: {
          id: string;
          slug: string;
          display_name: string;
          year: number;
          stored_date: string | null;
          engine_date: string | null;
          candidate_dates: string[] | null;
          issue_type: 'engine_curated_mismatch' | 'missing_external_source' | 'multiple_candidates_needs_review' | 'unreviewed_or_not_verified';
          reason: string;
          engine_version: string;
          detected_at: string;
          last_seen_at: string;
          is_open: boolean;
          resolved_at: string | null;
        };
        Insert: {
          id?: string;
          slug: string;
          display_name: string;
          year: number;
          stored_date?: string | null;
          engine_date?: string | null;
          candidate_dates?: string[] | null;
          issue_type: 'engine_curated_mismatch' | 'missing_external_source' | 'multiple_candidates_needs_review' | 'unreviewed_or_not_verified';
          reason: string;
          engine_version: string;
          detected_at?: string;
          last_seen_at?: string;
          is_open?: boolean;
          resolved_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['calendar_integrity_findings']['Insert']>;
      };
      calendar_profiles: {
        Row: {
          slug: string;
          display_name: string;
          effective_from: string | null;
          region: string;
          month_system: 'amanta' | 'purnimanta' | 'solar' | null;
          solar_month_rule: 'sunset_rule' | 'aparahna_rule' | 'midnight_rule' | 'same_day_rule' | null;
          era: 'vikram_north' | 'vikram_gujarat' | 'shaka' | 'kollam' | 'bengali_san' | 'bikram_sambat' | 'nanakshahi' | null;
          ayanamsha: string;
          sunrise_rule: string;
          month_name_locale: string;
          version: string;
          scholarly_status: string;
          review_notes: string | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          citation: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          slug: string;
          display_name: string;
          effective_from?: string | null;
          region: string;
          month_system?: 'amanta' | 'purnimanta' | 'solar' | null;
          solar_month_rule?: 'sunset_rule' | 'aparahna_rule' | 'midnight_rule' | 'same_day_rule' | null;
          era?: 'vikram_north' | 'vikram_gujarat' | 'shaka' | 'kollam' | 'bengali_san' | 'bikram_sambat' | 'nanakshahi' | null;
          ayanamsha?: string;
          sunrise_rule?: string;
          month_name_locale: string;
          version?: string;
          scholarly_status?: string;
          review_notes?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          citation: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['calendar_profiles']['Insert']>;
      };
      tradition_profiles: {
        Row: {
          slug: string;
          display_name: string;
          effective_from: string | null;
          ekadashi_method: 'smarta' | 'vaishnava_suddha';
          janmashtami_method: 'smarta_nishita' | 'vaishnava_rohini';
          shivaratri_method: 'nishita';
          paran_rule: 'standard' | 'vaishnava_strict';
          version: string;
          scholarly_status: string;
          review_notes: string | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          slug: string;
          display_name: string;
          effective_from?: string | null;
          ekadashi_method: 'smarta' | 'vaishnava_suddha';
          janmashtami_method: 'smarta_nishita' | 'vaishnava_rohini';
          shivaratri_method: 'nishita';
          paran_rule: 'standard' | 'vaishnava_strict';
          version?: string;
          scholarly_status?: string;
          review_notes?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['tradition_profiles']['Insert']>;
      };
      golden_fixtures: {
        Row: {
          approved: boolean;
          case_id: string;
          created_at: string;
          effective_from: string | null;
          expected: Json | null;
          festival_id: string;
          location: Json;
          profile: Json;
          reasoning: string;
          review_notes: string | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          source: Json;
          tolerance: Json;
          updated_at: string;
          year: number;
        };
        Insert: {
          approved?: boolean;
          case_id: string;
          created_at?: string;
          effective_from?: string | null;
          expected?: Json | null;
          festival_id: string;
          location: Json;
          profile: Json;
          reasoning: string;
          review_notes?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          source: Json;
          tolerance: Json;
          updated_at?: string;
          year: number;
        };
        Update: Partial<Database['public']['Tables']['golden_fixtures']['Insert']>;
      };
      profiles: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          full_name: string;
          username: string;
          avatar_url: string | null;
          bio: string | null;
          city: string | null;
          country: string | null;
          latitude: number | null;
          longitude: number | null;
          sampradaya: string | null;
          ishta_devata: string | null;
          spiritual_level: string | null;
          legacy_family_name: string | null;
          consent_religious_data: boolean;
          consent_updated_at: string | null;
          gotra: string | null;
          kul_devata: string | null;
          home_town: string | null;
          home_latitude: number | null;
          home_longitude: number | null;
          home_city: string | null;
          home_country: string | null;
          home_timezone: string | null;
          observance_location_source: 'manual' | 'device' | 'unset' | null;
          calendar_profile: string | null;
          calendar_scope: 'major_only' | 'all_observances' | null;
          calendar_language: string | null;

          shloka_streak: number;
          last_shloka_date: string | null;
          languages: string[];
          seeking: string[];
          seva_score: number;
          weekly_seva: number;
          monthly_seva: number;
          streak_freeze_count: number;
          last_freeze_used: string | null;
          active_symbol_id: string | null;
          onboarding_completed: boolean;
          onboarding_goal: string | null;
          mandali_id: string | null;
          onesignal_player_id: string | null;
          country_code: string | null;
          timezone: string | null;
          tradition: string | null;
          custom_greeting: string | null;
          app_language: string;
          transliteration_language: string;
          scripture_script: string;
          show_transliteration: boolean;
          meaning_language: string;
          wants_festival_reminders: boolean;
          wants_shloka_reminders: boolean;
          wants_nitya_reminders: boolean;
          wants_community_notifications: boolean;
          wants_family_notifications: boolean;
          notification_quiet_hours_start: number | null;
          notification_quiet_hours_end: number | null;
          is_admin: boolean;
          is_pro: boolean;
          subscription_status: 'free' | 'pro' | 'kul_pro' | 'grace' | 'expired';
          subscription_expires_at: string | null;
          entitlement_source: string | null;
          entitlement_updated_at: string | null;
          life_stage: string | null;
          life_stage_locked: boolean;
          gender_context: string | null;
          date_of_birth: string | null;
          is_banned: boolean;
          ban_reason: string | null;
          japa_reminder_enabled?: boolean;
          japa_reminder_time?: string;
          quiz_reminder_enabled?: boolean;
          quiz_reminder_time?: string;
          nitya_reminder_enabled?: boolean;
          nitya_reminder_time?: string;
          // Account-deletion cool-off (supabase/migrations/20260711000000_account_deletion_cooloff.sql).
          // Server-managed: only written by src/app/api/user/delete/{request,cancel}/route.ts
          // via getApiUser's RLS-scoped client -- never by a direct client-side
          // profiles.update() (see SERVER_MANAGED_COLUMNS in src/lib/api/profile.ts).
          is_deleting: boolean;
          deletion_requested_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at' | 'seva_score' | 'weekly_seva' | 'monthly_seva' | 'streak_freeze_count' | 'last_freeze_used'>;
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      public_profiles: {
        Row: {
          id: string;
          username: string;
          avatar_url: string | null;
          bio: string | null;
          seva_score: number;
          weekly_seva: number;
          monthly_seva: number;
          active_symbol_id: string | null;
          updated_at: string;
        };
        Insert: Database['public']['Tables']['public_profiles']['Row'];
        Update: Partial<Database['public']['Tables']['public_profiles']['Insert']>;
      };
      legal_acceptances: {
        Row: {
          id: string;
          user_id: string;
          document: 'terms' | 'privacy';
          version: string;
          accepted_at: string;
          surface: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          document: 'terms' | 'privacy';
          version: string;
          accepted_at?: string;
          surface: string;
        };
        Update: Partial<Database['public']['Tables']['legal_acceptances']['Insert']>;
      };
      mandalis: {
        Row: {
          id: string;
          created_at: string;
          name: string;
          city: string;
          country: string;
          latitude: number;
          longitude: number;
          radius_km: number;
          member_count: number;
          description: string | null;
        };
        Insert: Omit<Database['public']['Tables']['mandalis']['Row'], 'created_at' | 'member_count'>;
        Update: Partial<Database['public']['Tables']['mandalis']['Insert']>;
      };
      posts: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          author_id: string;
          mandali_id: string | null;
          content: string;
          type: 'update' | 'event' | 'question' | 'announcement';
          upvotes: number;
          comment_count: number;
          is_pinned: boolean;
          event_date: string | null;
          event_location: string | null;
        };
        Insert: Omit<Database['public']['Tables']['posts']['Row'], 'created_at' | 'updated_at' | 'upvotes' | 'comment_count'>;
        Update: Partial<Database['public']['Tables']['posts']['Insert']>;
      };
      post_comments: {
        Row: {
          id: string;
          post_id: string;
          author_id: string;
          body: string;
          parent_id: string | null;
          created_at: string;
          updated_at?: string | null;
          deleted_at?: string | null;
          upvotes: number;
        };
        Insert: Omit<Database['public']['Tables']['post_comments']['Row'], 'id' | 'created_at' | 'upvotes'>;
        Update: Partial<Database['public']['Tables']['post_comments']['Insert']>;
      };
      event_rsvps: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          status: 'going' | 'interested' | 'not_going';
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['event_rsvps']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['event_rsvps']['Insert']>;
      };
      mala_sessions: {
        Row: {
          id: string;
          user_id: string;
          mantra: string;
          chant_source: string | null;
          count: number;
          target_count: number | null;
          duration_seconds: number;
          notes: string | null;
          share_scope: 'private' | 'kul' | 'public';
          completed_at: string;
          created_at: string;
          date: string | null;
          rounds: number | null;
          bead_count: number | null;
          mantra_id: string | null;
          duration_secs: number | null;
          mala_id: string | null;
          background_scene: string | null;
          tradition: string | null;
          practice_type: string | null;
          intention: string | null;
          completion_type: string | null;
          target_rounds: number | null;
          completed_rounds: number | null;
          ambient_id: string | null;
          spiritual_time_window: string | null;
          timezone: string | null;
          source_route: string | null;
          panchang_context: Record<string, unknown> | null;
        };
        Insert: Omit<Database['public']['Tables']['mala_sessions']['Row'], 'id' | 'created_at' | 'completed_at' | 'tradition' | 'practice_type' | 'intention' | 'completion_type' | 'target_rounds' | 'completed_rounds' | 'ambient_id' | 'spiritual_time_window' | 'timezone' | 'source_route' | 'panchang_context'> & {
          completed_at?: string;
          created_at?: string;
          tradition?: string | null;
          practice_type?: string | null;
          intention?: string | null;
          completion_type?: string | null;
          target_rounds?: number | null;
          completed_rounds?: number | null;
          ambient_id?: string | null;
          spiritual_time_window?: string | null;
          timezone?: string | null;
          source_route?: string | null;
          panchang_context?: Record<string, unknown> | null;
        };
        Update: Partial<Database['public']['Tables']['mala_sessions']['Insert']>;
      };
      user_custom_japa_mantras: {
        Row: {
          user_id: string;
          label: string;
          mantra_text: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['user_custom_japa_mantras']['Row'], 'created_at' | 'updated_at'> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['user_custom_japa_mantras']['Insert']>;
      };
      forum_threads: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          author_id: string;
          category: string;
          title: string;
          body: string;
          upvotes: number;
          reply_count: number;
          is_answered: boolean;
          is_pinned: boolean;
          tags: string[];
          sampradaya_filter: string | null;
        };
        Insert: Omit<Database['public']['Tables']['forum_threads']['Row'], 'created_at' | 'updated_at' | 'upvotes' | 'reply_count' | 'is_answered'>;
        Update: Partial<Database['public']['Tables']['forum_threads']['Insert']>;
      };
      forum_replies: {
        Row: {
          id: string;
          created_at: string;
          thread_id: string;
          author_id: string;
          body: string;
          upvotes: number;
          is_accepted: boolean;
          parent_id: string | null;
        };
        Insert: Omit<Database['public']['Tables']['forum_replies']['Row'], 'created_at' | 'upvotes' | 'is_accepted'>;
        Update: Partial<Database['public']['Tables']['forum_replies']['Insert']>;
      };
      post_upvotes: {
        Row: { post_id: string; user_id: string; created_at: string };
        Insert: Omit<Database['public']['Tables']['post_upvotes']['Row'], 'created_at'>;
        Update: never;
      };
      comment_upvotes: {
        Row: { comment_id: string; user_id: string; created_at: string };
        Insert: Omit<Database['public']['Tables']['comment_upvotes']['Row'], 'created_at'>;
        Update: never;
      };
      thread_upvotes: {
        Row: { thread_id: string; user_id: string; created_at: string };
        Insert: Omit<Database['public']['Tables']['thread_upvotes']['Row'], 'created_at'>;
        Update: never;
      };
      content_reports: {
        Row: {
          id: string;
          reported_by: string;
          content_author_id: string;
          content_type: string;
          content_id: string;
          reason: string;
          status: 'pending' | 'reviewed' | 'actioned' | 'dismissed';
          admin_note: string | null;
          created_at: string;
          // metadata stores AI-report context (ai_response, user_prompt, model, etc.).
          // content_author_id is passed as '' for AI reports — no real author UUID exists.
          metadata: Record<string, unknown> | null;
        };
        Insert: {
          reported_by: string;
          content_author_id: string;
          content_type: string;
          content_id: string;
          reason: string;
          status?: 'pending' | 'reviewed' | 'actioned' | 'dismissed';
          admin_note?: string | null;
          metadata?: Record<string, unknown> | null;
        };
        Update: {
          reported_by?: string;
          content_author_id?: string;
          content_type?: string;
          content_id?: string;
          reason?: string;
          status?: 'pending' | 'reviewed' | 'actioned' | 'dismissed';
          admin_note?: string | null;
          metadata?: Record<string, unknown> | null;
        };
        Relationships: [];
      };
      user_blocked_profiles: {
        Row: {
          id: string;
          blocker_id: string;
          blocked_user_id: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['user_blocked_profiles']['Row'], 'id' | 'created_at'>;
        Update: never;
      };
      user_muted_profiles: {
        Row: {
          id: string;
          muter_id: string;
          muted_user_id: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['user_muted_profiles']['Row'], 'id' | 'created_at'>;
        Update: never;
      };
      user_hidden_content: {
        Row: {
          id: string;
          user_id: string;
          content_type: 'mandali_post' | 'thread' | 'reply';
          content_id: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['user_hidden_content']['Row'], 'id' | 'created_at'>;
        Update: never;
      };
      notifications: {
        Row: {
          id: string;
          created_at: string;
          user_id: string;
          title: string;
          body: string;
          emoji: string;
          type: 'festival' | 'mandali' | 'streak' | 'seva' | 'general' | 'nitya';
          read: boolean;
          action_url: string | null;
          notification_key: string | null;
          local_date: string | null;
          sent_timezone: string | null;
        };
        Insert: Omit<Database['public']['Tables']['notifications']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>;
      };
      festivals: {
        Row: {
          id: string;
          created_at: string;
          name: string;
          date: string;
          emoji: string | null;
          description: string;
          type: 'major' | 'vrat' | 'regional';
          year: number;
          tradition: 'hindu' | 'sikh' | 'buddhist' | 'jain' | 'all' | null;
          is_shared: boolean;
          source_name: string | null;
          source_kind: 'curated' | 'official' | 'partner' | 'community_reviewed' | null;
          review_status: 'needs_review' | 'reviewed' | null;
          reviewed_at: string | null;
          review_notes: string | null;
          verification_status: 'verified' | 'mismatch' | 'uncertain' | 'not_checked' | 'manual_review' | null;
          verification_confidence: 'high' | 'medium' | 'low' | null;
          verification_note: string | null;
          suggested_date: string | null;
          verification_run_at: string | null;
          verification_type: 'solar_fixed' | 'lunar_tithi' | 'nakshatra_based' | 'regional_calendar' | 'historical_commemoration' | null;
        };
        Insert: Omit<Database['public']['Tables']['festivals']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['festivals']['Insert']>;
      };
      observance_definitions: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          slug: string;
          display_name: string;
          kind: 'major' | 'vrat' | 'regional' | null;
          tradition: 'hindu' | 'sikh' | 'buddhist' | 'jain' | 'all' | null;
          calendar_rule_type: string | null;
          verification_type: 'solar_fixed' | 'lunar_tithi' | 'nakshatra_based' | 'regional_calendar' | 'historical_commemoration' | null;
          route_kind: string | null;
          route_slug: string | null;
          region: string | null;
          active: boolean;
          emoji: string | null;
          description: string | null;
          is_shared: boolean;
        };
        Insert: Omit<Database['public']['Tables']['observance_definitions']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['observance_definitions']['Insert']>;
      };
      observance_occurrences: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          definition_id: string;
          year: number;
          date: string;
          calculation_version: string;
          calculated_by: string;
          manual_date_override: string | null;
          manual_override_reason: string | null;
          locked_for_regeneration: boolean;
          final_date_source: 'legacy_seed' | 'manual_override' | 'calculation_engine' | 'calculation_engine_reviewed' | 'fallback';
          audit_status: 'not_run' | 'completed' | 'failed' | 'skipped';
          audit_failure_reason: string | null;
          audit_retry_count: number;
          last_audited_at: string | null;
          verification_status: 'verified' | 'mismatch' | 'uncertain' | 'not_checked' | 'manual_review' | null;
          verification_note: string | null;
          suggested_date: string | null;
          review_status: 'needs_review' | 'reviewed' | null;
          source_provenance: Json;
          verification_confidence: 'high' | 'medium' | 'low' | null;
          verification_run_at: string | null;
          reviewed_at: string | null;
          review_notes: string | null;
          calendar_profile: string | null;
          spiritual_tradition: string | null;
          variant_key: string | null;
          is_primary_variant: boolean | null;
          rule_version: string | null;
          astronomy_version: string | null;
          day_boundary_version: string | null;
          reasons: Json | null;
          source_refs: Json | null;
          diagnostics: Json | null;
          computed_latitude: number | null;
          computed_longitude: number | null;
          computed_timezone: string | null;
          /** Instance discriminator (D15 amendment). Mirrors date column value.
           *  NOT NULL — populated on insert and backfilled by migration.
           *  Part of unique constraint: (definition_id, year, calendar_profile, occurrence_date, variant_key). */
          occurrence_date: string;
          /** Stable identity for one observance INSTANCE, written by the materialiser.
           *  NULL on legacy rows (pre-contract). Never inferred at read time. */
          series_instance_key: string | null;
          /** FK to observance_materialisation_batches. NULL for legacy/pre-contract rows. */
          batch_id: string | null;
        };
        Insert: Omit<Database['public']['Tables']['observance_occurrences']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['observance_occurrences']['Insert']>;
      };
      observance_materialisation_batches: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          definition_id: string;
          year: number;
          calendar_profile: string;
          spiritual_tradition: string | null;
          variant_key: string | null;
          computed_latitude: number;
          computed_longitude: number;
          computed_timezone: string;
          expected_row_count: number;
          produced_row_count: number;
          engine_version: string;
          rule_version: string;
          astronomy_version: string | null;
          status: 'complete' | 'partial' | 'failed' | 'retired';
          failure_reason: string | null;
          completed_at: string | null;
          retired_at: string | null;
          retirement_reason: string | null;
        };
        Insert: Omit<Database['public']['Tables']['observance_materialisation_batches']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['observance_materialisation_batches']['Insert']>;
      };
      observance_review_queue: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          definition_id: string;
          year: number;
          calendar_profile: string;
          location_label: string;
          computed_latitude: number;
          computed_longitude: number;
          computed_timezone: string;
          ambiguity_type: 'no_qualified_date' | 'multiple_qualified_dates' | 'vrddhi_tithi' | 'disputed_ratification' | 'engine_error';
          spiritual_tradition: string | null;
          variant_key: string;
          reasoning: string;
          candidate_dates: Json;
          evaluator_details: Json;
          source_refs: Json;
          review_status: 'pending_review' | 'approved' | 'rejected';
          reviewed_by: string | null;
          reviewed_at: string | null;
          review_notes: string | null;
        };
        Insert: Omit<Database['public']['Tables']['observance_review_queue']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['observance_review_queue']['Insert']>;
      };
      guided_path_progress: {
        Row: {
          id: string;
          user_id: string;
          path_id: string;
          status: 'active' | 'dismissed' | 'completed';
          created_at: string;
          updated_at: string;
          last_interacted_at: string;
          completed_at: string | null;
          current_lesson: number;
          completed_lessons: number[];
        };
        Insert: Omit<Database['public']['Tables']['guided_path_progress']['Row'], 'id' | 'created_at' | 'updated_at' | 'last_interacted_at' | 'completed_at' | 'current_lesson' | 'completed_lessons'> & {
          last_interacted_at?: string;
          completed_at?: string | null;
          current_lesson?: number;
          completed_lessons?: number[];
        };
        Update: Partial<Database['public']['Tables']['guided_path_progress']['Insert']>;
      };
      pathshala_user_state: {
        Row: {
          id: string;
          user_id: string;
          tradition: 'hindu' | 'sikh' | 'buddhist' | 'jain';
          section_id: string;
          entry_id: string;
          last_opened_at: string;
          bookmarked_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['pathshala_user_state']['Row'], 'id' | 'created_at' | 'updated_at' | 'last_opened_at'> & {
          last_opened_at?: string;
          bookmarked_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['pathshala_user_state']['Insert']>;
      };
      user_warnings: {
        Row: {
          id: string;
          user_id: string;
          admin_name: string | null;
          reason: string;
          admin_note: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['user_warnings']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['user_warnings']['Insert']>;
      };
      cron_logs: {
        Row: {
          id: string;
          job_name: string;
          status: string;
          message: string | null;
          execution_time: number | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['cron_logs']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['cron_logs']['Insert']>;
      };
      kuls: {
        Row: {
          id: string;
          name: string;
          invite_code: string;
          created_by: string;
          avatar_emoji: string;
          created_at: string;
          updated_at: string;
          cover_url: string | null;
        };
        Insert: Omit<Database['public']['Tables']['kuls']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['kuls']['Insert']>;
      };
      kul_members: {
        Row: {
          id: string;
          kul_id: string;
          user_id: string;
          role: 'guardian' | 'sadhak';
          joined_at: string;
        };
        Insert: Omit<Database['public']['Tables']['kul_members']['Row'], 'id' | 'joined_at'>;
        Update: Partial<Database['public']['Tables']['kul_members']['Insert']>;
      };
      nitya_karma_logs: {
        Row: {
          id: string;
          user_id: string;
          task_id: string;
          completed_at: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['nitya_karma_logs']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['nitya_karma_logs']['Insert']>;
      };
      user_mood_checkins: {
        Row: {
          id: string;
          user_id: string;
          created_at: string;
          before_mood: string | null;
          source_surface: string | null;
          context_need: string | null;
          context_time: string | null;
          context_type: string | null;
          recommended_action_type: string | null;
          recommended_action_target: string | null;
          clicked_action: string | null;
          completed_action: string | null;
          after_mood: string | null;
          reflection_note: string | null;
          dismissed: boolean;
          completed_at: string | null;
          recommendations_shown: Json | null;
          skipped_actions: Json | null;
          session_status: string | null;
          closed_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['user_mood_checkins']['Row'], 'id' | 'created_at' | 'dismissed'> & {
          dismissed?: boolean;
        };
        Update: Partial<Database['public']['Tables']['user_mood_checkins']['Insert']>;
      };
      dharm_veers: {
        Row: {
          id: string;
          slug: string;
          name: string;
          name_local: string | null;
          tradition: 'hindu' | 'sikh' | 'buddhist' | 'jain' | 'sufi' | 'tribal';
          era: string | null;
          tagline: string;
          journey: string;
          journey_local: string | null;
          trial: string;
          trial_local: string | null;
          teaching: string;
          teaching_local: string | null;
          moral: string;
          moral_local: string | null;
          quote: string | null;
          quote_local: string | null;
          quote_source: string | null;
          tags: string[] | null;
          day_index: number | null;
          generated_by: string | null;
          created_at: string | null;
          legacy: string | null;
          legacy_local: string | null;
          illustration_prompt: string | null;
          // Added by supabase/migrations/20260724163000_dharm_veer_source_backed_review.sql
          // for the auto-sourcing agent -- see src/lib/dharm-veer-generation.ts,
          // src/lib/dharm-veer-db.ts, src/app/api/cron/generate-dharm-veer,
          // src/app/api/admin/dharm-veer-review.
          source_backed: boolean;
          review_status: 'approved' | 'pending_review' | 'rejected';
          source_citations: Json;
          reviewed_by: string | null;
          reviewed_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['dharm_veers']['Row'], 'id' | 'created_at' | 'source_backed' | 'review_status' | 'source_citations' | 'reviewed_by' | 'reviewed_at'> & {
          source_backed?: boolean;
          review_status?: 'approved' | 'pending_review' | 'rejected';
          source_citations?: Json;
        };
        Update: Partial<Database['public']['Tables']['dharm_veers']['Row']>;
      };
      vrat_observations: {
        Row: {
          id: string;
          created_at: string;
          user_id: string;
          occurrence_id: string;
          definition_id: string;
          vrat_id: string;
          vrat_name: string | null;
          occurrence_date: string;
          calendar_profile: string | null;
          tradition: string | null;
          sampradaya: string | null;
          variant_key: string | null;
          timezone: string;
          karma_awarded: number;
          observed_at: string;
        };
        Insert: Omit<Database['public']['Tables']['vrat_observations']['Row'], 'id' | 'created_at' | 'observed_at'> & {
          id?: string;
          created_at?: string;
          observed_at?: string;
        };
        Update: Partial<Database['public']['Tables']['vrat_observations']['Insert']>;
      };
      push_token_events: {
        Row: {
          id: string;
          user_id: string | null;
          token: string;
          event_type: 'registered' | 'pruned_device_not_registered' | 'pruned_other';
          reason: string | null;
          source: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          token: string;
          event_type: 'registered' | 'pruned_device_not_registered' | 'pruned_other';
          reason?: string | null;
          source: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['push_token_events']['Insert']>;
      };
      notification_dispatch_events: {
        Row: {
          id: string;
          user_id: string | null;
          notification_key: string | null;
          notification_type: string | null;
          decision: 'sent' | 'skipped' | 'failed';
          reason: string | null;
          provider: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          notification_key?: string | null;
          notification_type?: string | null;
          decision: 'sent' | 'skipped' | 'failed';
          reason?: string | null;
          provider?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['notification_dispatch_events']['Insert']>;
      };
      dharm_veer_generation_log: {
        Row: {
          slug: string;
          status: 'no_source_found' | 'generated_pending_review' | 'generated_approved';
          attempted_at: string;
          notes: string | null;
        };
        Insert: Omit<Database['public']['Tables']['dharm_veer_generation_log']['Row'], 'attempted_at'> & {
          attempted_at?: string;
        };
        Update: Partial<Database['public']['Tables']['dharm_veer_generation_log']['Row']>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

// Convenience types
export type Profile        = Database['public']['Tables']['profiles']['Row'];
export type Mandali        = Database['public']['Tables']['mandalis']['Row'];
export type Post           = Database['public']['Tables']['posts']['Row'];
export type ForumThread    = Database['public']['Tables']['forum_threads']['Row'];
export type ForumReply     = Database['public']['Tables']['forum_replies']['Row'];

export type Notification    = Database['public']['Tables']['notifications']['Row'];
export type ContentReport   = Database['public']['Tables']['content_reports']['Row'];
export type PathshalaUserState = Database['public']['Tables']['pathshala_user_state']['Row'];
export type PostComment = Database['public']['Tables']['post_comments']['Row'];
export type EventRsvp = Database['public']['Tables']['event_rsvps']['Row'];
export type MalaSession = Database['public']['Tables']['mala_sessions']['Row'];
export type CronLog = Database['public']['Tables']['cron_logs']['Row'];
export type PostWithAuthor = Post & { profiles: Pick<Profile, 'full_name' | 'username' | 'avatar_url' | 'sampradaya' | 'spiritual_level'> };
export type ThreadWithAuthor = ForumThread & {
  profiles: Pick<Profile, 'full_name' | 'username' | 'avatar_url' | 'sampradaya' | 'active_symbol_id'>;
  reactions?: Record<string, number>;
};
export type PostCommentWithAuthor = PostComment & { profiles: Pick<Profile, 'full_name' | 'username' | 'avatar_url'> };

export type ObservanceDefinition = Database['public']['Tables']['observance_definitions']['Row'];
export type DharmVeerRow = Database['public']['Tables']['dharm_veers']['Row'];
export type DharmVeerGenerationLogRow = Database['public']['Tables']['dharm_veer_generation_log']['Row'];
export type ObservanceOccurrence = Database['public']['Tables']['observance_occurrences']['Row'];
export type ObservanceReviewQueue = Database['public']['Tables']['observance_review_queue']['Row'];
export type CalendarProfile = Database['public']['Tables']['calendar_profiles']['Row'];
export type TraditionProfile = Database['public']['Tables']['tradition_profiles']['Row'];
export type CalendarIntegrityFinding = Database['public']['Tables']['calendar_integrity_findings']['Row'];
export type ObservanceMaterialisationBatch = Database['public']['Tables']['observance_materialisation_batches']['Row'];
export type VratObservation = Database['public']['Tables']['vrat_observations']['Row'];

export type PushTokenEvent = Database['public']['Tables']['push_token_events']['Row'];
export type NotificationDispatchEvent = Database['public']['Tables']['notification_dispatch_events']['Row'];
