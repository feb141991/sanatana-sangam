import 'server-only';

import { createClient } from '@supabase/supabase-js';

export type MandaliAdminTables = {
  mandali_prompts: {
    Row: {
      id: string;
      text_en: string;
      text_hi: string | null;
      text_pa: string | null;
      tradition: string | null;
      active: boolean;
      created_at: string;
      updated_at: string;
      observance_tag: string | null;
    };
    Insert: {
      id?: string;
      text_en: string;
      text_hi?: string | null;
      text_pa?: string | null;
      tradition?: string | null;
      active?: boolean;
      created_at?: string;
      updated_at?: string;
      observance_tag?: string | null;
    };
    Update: Partial<MandaliAdminTables['mandali_prompts']['Insert']>;
    Relationships: [];
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
      client_operation_id: string | null;
      mandali_prompt_id: string | null;
      mandali_prompt_date: string | null;
    };
    Insert: {
      id?: string;
      created_at?: string;
      updated_at?: string;
      author_id: string;
      mandali_id?: string | null;
      content: string;
      type?: 'update' | 'event' | 'question' | 'announcement';
      upvotes?: number;
      comment_count?: number;
      is_pinned?: boolean;
      event_date?: string | null;
      event_location?: string | null;
      client_operation_id?: string | null;
      mandali_prompt_id?: string | null;
      mandali_prompt_date?: string | null;
    };
    Update: Partial<MandaliAdminTables['posts']['Insert']>;
    Relationships: [];
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
      is_highlighted: boolean;
      highlight_label: string | null;
      highlighted_at: string | null;
      highlighted_by: string | null;
    };
    Insert: {
      id?: string;
      post_id: string;
      author_id: string;
      body: string;
      parent_id?: string | null;
      created_at?: string;
      updated_at?: string | null;
      deleted_at?: string | null;
      upvotes?: number;
      is_highlighted?: boolean;
      highlight_label?: string | null;
      highlighted_at?: string | null;
      highlighted_by?: string | null;
    };
    Update: Partial<MandaliAdminTables['post_comments']['Insert']>;
    Relationships: [];
  };
  post_polls: {
    Row: {
      id: string;
      post_id: string;
      question: string;
      created_at: string;
    };
    Insert: {
      id?: string;
      post_id: string;
      question: string;
      created_at?: string;
    };
    Update: Partial<MandaliAdminTables['post_polls']['Insert']>;
    Relationships: [];
  };
  post_poll_options: {
    Row: {
      id: string;
      poll_id: string;
      text_en: string;
      text_hi: string | null;
      text_pa: string | null;
      order_index: number;
      vote_count: number;
    };
    Insert: {
      id?: string;
      poll_id: string;
      text_en: string;
      text_hi?: string | null;
      text_pa?: string | null;
      order_index?: number;
      vote_count?: number;
    };
    Update: Partial<MandaliAdminTables['post_poll_options']['Insert']>;
    Relationships: [];
  };
  post_poll_votes: {
    Row: {
      id: string;
      poll_id: string;
      option_id: string;
      user_id: string;
      created_at: string;
    };
    Insert: {
      id?: string;
      poll_id: string;
      option_id: string;
      user_id: string;
      created_at?: string;
    };
    Update: Partial<MandaliAdminTables['post_poll_votes']['Insert']>;
    Relationships: [];
  };
};

export type MandaliPromptDatabase = {
  public: {
    Tables: MandaliAdminTables;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

/**
 * Narrow typed client for Mandali community, prompt, poll, and comment tables.
 * Bypasses full Database inference drift so prompt, poll, and highlight writes
 * stay strictly typed without falling back to `any`.
 */
export function createMandaliPromptAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error('Supabase admin environment variables are not configured');
  }

  return createClient<MandaliPromptDatabase>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
