-- Migration: Add keyset pagination index for mandali posts
-- Enables efficient (mandali_id, created_at DESC, id DESC) keyset paging without sequential table scans.

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_mandali_keyset
  ON public.posts (mandali_id, created_at DESC, id DESC);
