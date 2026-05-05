export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
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
          kul: string | null;
          gotra: string | null;
          kul_devata: string | null;
          home_town: string | null;
          shloka_streak: number;
          last_shloka_date: string | null;
          languages: string[];
          seeking: string[];
          seva_score: number;
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
          wants_community_notifications: boolean;
          wants_family_notifications: boolean;
          notification_quiet_hours_start: number | null;
          notification_quiet_hours_end: number | null;
          is_admin: boolean;
          is_pro: boolean;
          life_stage: string | null;
          life_stage_locked: boolean;
          gender_context: string | null;
          date_of_birth: string | null;
          is_banned: boolean;
          ban_reason: string | null;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at' | 'seva_score'>;
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
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
        };
        Insert: Omit<Database['public']['Tables']['post_comments']['Row'], 'id' | 'created_at'>;
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
        };
        Insert: Omit<Database['public']['Tables']['mala_sessions']['Row'], 'id' | 'created_at' | 'completed_at'> & {
          completed_at?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['mala_sessions']['Insert']>;
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
        };
        Insert: Omit<Database['public']['Tables']['content_reports']['Row'], 'id' | 'created_at' | 'status' | 'admin_note'> & {
          status?: Database['public']['Tables']['content_reports']['Row']['status'];
          admin_note?: string | null;
        };
        Update: Partial<Database['public']['Tables']['content_reports']['Insert']>;
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
        };
        Insert: Omit<Database['public']['Tables']['festivals']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['festivals']['Insert']>;
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
          admin_id: string | null;
          reason: string;
          admin_note: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['user_warnings']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['user_warnings']['Insert']>;
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
export type PostWithAuthor = Post & { profiles: Pick<Profile, 'full_name' | 'username' | 'avatar_url' | 'sampradaya' | 'spiritual_level'> };
export type ThreadWithAuthor = ForumThread & { profiles: Pick<Profile, 'full_name' | 'username' | 'avatar_url' | 'sampradaya'> };
export type PostCommentWithAuthor = PostComment & { profiles: Pick<Profile, 'full_name' | 'username' | 'avatar_url'> };
