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
          tradition: string | null;
          custom_greeting: string | null;
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
      notifications: {
        Row: {
          id: string;
          created_at: string;
          user_id: string;
          title: string;
          body: string;
          emoji: string;
          type: 'festival' | 'mandali' | 'streak' | 'seva' | 'general';
          read: boolean;
          action_url: string | null;
        };
        Insert: Omit<Database['public']['Tables']['notifications']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>;
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
export type PostWithAuthor = Post & { profiles: Pick<Profile, 'full_name' | 'username' | 'avatar_url' | 'sampradaya' | 'spiritual_level'> };
export type ThreadWithAuthor = ForumThread & { profiles: Pick<Profile, 'full_name' | 'username' | 'avatar_url' | 'sampradaya'> };
