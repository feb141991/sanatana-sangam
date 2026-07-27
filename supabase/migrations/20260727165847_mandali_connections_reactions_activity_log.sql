-- 1. Connections table (request / accept / reject between two seekers, app-wide,
-- not scoped to a single Mandali -- Seekers Near You already crosses Mandali
-- boundaries, so connections should too).
CREATE TABLE public.mandali_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT mandali_connections_no_self CHECK (requester_id <> recipient_id),
  CONSTRAINT mandali_connections_unique_pair UNIQUE (requester_id, recipient_id)
);

CREATE INDEX idx_mandali_connections_recipient ON public.mandali_connections(recipient_id, status);
CREATE INDEX idx_mandali_connections_requester ON public.mandali_connections(requester_id, status);

ALTER TABLE public.mandali_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view their connections"
  ON public.mandali_connections FOR SELECT
  TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can send connection requests"
  ON public.mandali_connections FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Recipient can respond to a pending request"
  ON public.mandali_connections FOR UPDATE
  TO authenticated
  USING (auth.uid() = recipient_id AND status = 'pending')
  WITH CHECK (auth.uid() = recipient_id AND status IN ('accepted','rejected'));

CREATE POLICY "Requester can cancel own pending request"
  ON public.mandali_connections FOR DELETE
  TO authenticated
  USING (auth.uid() = requester_id AND status = 'pending');

-- 2. Reactions -- extend post_upvotes with a devotional reaction set instead
-- of a plain boolean like. Existing rows backfill to 'love' via the column
-- default (no separate UPDATE needed).
ALTER TABLE public.post_upvotes
  ADD COLUMN reaction_type text NOT NULL DEFAULT 'love'
  CHECK (reaction_type IN ('pranam','love','insightful'));

-- 3. Activity log -- id is the tracker ID referenced everywhere else.
-- Admin-only readable: no RLS policies at all (service-role bypasses RLS
-- for the existing admin panel, same pattern as the rest of that backend);
-- authenticated/anon get zero access.
CREATE TABLE public.user_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  target_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text,
  entity_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_activity_log_actor ON public.user_activity_log(actor_id, created_at DESC);
CREATE INDEX idx_user_activity_log_target ON public.user_activity_log(target_id, created_at DESC);

ALTER TABLE public.user_activity_log ENABLE ROW LEVEL SECURITY;

-- 4. Shared logging helper, reused by every trigger below.
CREATE OR REPLACE FUNCTION public.log_user_activity(
  p_actor_id uuid, p_target_id uuid, p_action text, p_entity_type text, p_entity_id uuid, p_metadata jsonb DEFAULT '{}'::jsonb
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.user_activity_log (actor_id, target_id, action, entity_type, entity_id, metadata)
  VALUES (p_actor_id, p_target_id, p_action, p_entity_type, p_entity_id, p_metadata);
END;
$function$;

-- 5. Connection request lifecycle: log every state change, notify on send
-- and on accept (not on reject -- keep it low-key), respecting the
-- recipient's notification preference and any block/mute between the two.
CREATE OR REPLACE FUNCTION public.handle_mandali_connection_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  requester_name text;
  recipient_name text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.log_user_activity(OLD.requester_id, OLD.recipient_id, 'connection_cancelled', 'mandali_connection', OLD.id, '{}'::jsonb);
    RETURN OLD;
  END IF;

  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_user_activity(NEW.requester_id, NEW.recipient_id, 'connection_request_sent', 'mandali_connection', NEW.id, '{}'::jsonb);

    IF COALESCE((SELECT wants_community_notifications FROM public.profiles WHERE id = NEW.recipient_id), true)
       AND NOT EXISTS (
         SELECT 1 FROM public.user_blocked_profiles
         WHERE (blocker_id = NEW.recipient_id AND blocked_user_id = NEW.requester_id)
            OR (blocker_id = NEW.requester_id AND blocked_user_id = NEW.recipient_id)
       )
    THEN
      SELECT COALESCE(full_name, username, 'A fellow seeker') INTO requester_name FROM public.profiles WHERE id = NEW.requester_id;
      INSERT INTO public.notifications (user_id, title, body, emoji, type, action_url, notification_key)
      VALUES (NEW.recipient_id, requester_name || ' wants to connect', 'Tap to view their request.', '🤝', 'connection_request', '/mandali', 'connection_request:' || NEW.id)
      ON CONFLICT (user_id, notification_key) WHERE notification_key IS NOT NULL DO NOTHING;
    END IF;

    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'accepted' THEN
      PERFORM public.log_user_activity(NEW.recipient_id, NEW.requester_id, 'connection_accepted', 'mandali_connection', NEW.id, '{}'::jsonb);

      IF COALESCE((SELECT wants_community_notifications FROM public.profiles WHERE id = NEW.requester_id), true) THEN
        SELECT COALESCE(full_name, username, 'A fellow seeker') INTO recipient_name FROM public.profiles WHERE id = NEW.recipient_id;
        INSERT INTO public.notifications (user_id, title, body, emoji, type, action_url, notification_key)
        VALUES (NEW.requester_id, recipient_name || ' accepted your connection request', 'You''re now connected.', '🤝', 'connection_accepted', '/mandali', 'connection_accepted:' || NEW.id)
        ON CONFLICT (user_id, notification_key) WHERE notification_key IS NOT NULL DO NOTHING;
      END IF;
    ELSIF NEW.status = 'rejected' THEN
      PERFORM public.log_user_activity(NEW.recipient_id, NEW.requester_id, 'connection_rejected', 'mandali_connection', NEW.id, '{}'::jsonb);
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

CREATE TRIGGER trg_mandali_connection_change
AFTER INSERT OR UPDATE OR DELETE ON public.mandali_connections
FOR EACH ROW
EXECUTE FUNCTION public.handle_mandali_connection_change();

-- 6. Blocking cascades: auto-cancel any pending/accepted connection between
-- the two people (either direction) so a block stays meaningful, and log
-- the block itself.
CREATE OR REPLACE FUNCTION public.handle_user_block_cascade()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  DELETE FROM public.mandali_connections
  WHERE (requester_id = NEW.blocker_id AND recipient_id = NEW.blocked_user_id)
     OR (requester_id = NEW.blocked_user_id AND recipient_id = NEW.blocker_id);

  PERFORM public.log_user_activity(NEW.blocker_id, NEW.blocked_user_id, 'user_blocked', 'user_blocked_profiles', NEW.id, '{}'::jsonb);

  RETURN NEW;
END;
$function$;

CREATE TRIGGER trg_user_block_cascade
AFTER INSERT ON public.user_blocked_profiles
FOR EACH ROW
EXECUTE FUNCTION public.handle_user_block_cascade();

-- 7. Log content/member reports (content_id is stored as text on that table
-- since it covers heterogeneous content types -- kept in metadata rather
-- than cast into the uuid entity_id column to avoid a bad-cast failure).
CREATE OR REPLACE FUNCTION public.log_content_report()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.log_user_activity(
    NEW.reported_by, NEW.content_author_id, 'content_reported', NEW.content_type, NULL,
    jsonb_build_object('content_id', NEW.content_id, 'reason', NEW.reason)
  );
  RETURN NEW;
END;
$function$;

CREATE TRIGGER trg_log_content_report
AFTER INSERT ON public.content_reports
FOR EACH ROW
EXECUTE FUNCTION public.log_content_report();

-- 8. Log reactions (add/remove) -- volume will be the highest of any of
-- these, but the ask was explicitly "all the actions", so include it.
CREATE OR REPLACE FUNCTION public.log_post_reaction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  post_author uuid;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT author_id INTO post_author FROM public.posts WHERE id = NEW.post_id;
    PERFORM public.log_user_activity(NEW.user_id, post_author, 'post_reaction_added', 'post', NEW.post_id, jsonb_build_object('reaction_type', NEW.reaction_type));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    SELECT author_id INTO post_author FROM public.posts WHERE id = OLD.post_id;
    PERFORM public.log_user_activity(OLD.user_id, post_author, 'post_reaction_removed', 'post', OLD.post_id, jsonb_build_object('reaction_type', OLD.reaction_type));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$;

CREATE TRIGGER trg_log_post_reaction
AFTER INSERT OR DELETE ON public.post_upvotes
FOR EACH ROW
EXECUTE FUNCTION public.log_post_reaction();
