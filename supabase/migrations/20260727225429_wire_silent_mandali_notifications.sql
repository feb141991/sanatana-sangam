-- Wires up the four previously-silent-by-design events with notifications:
--   connection_rejected / connection_cancelled -> notify the other party,
--     gated by their wants_community_notifications preference (same flag
--     that already gates connection_request_sent/accepted).
--   user_blocked / content_reported -> notify the ACTOR only (a receipt
--     confirming their own action), never the blocked/reported party --
--     tipping off either would defeat the point of blocking or let someone
--     retaliate/tamper before moderation reviews a report. Actor receipts
--     are unconditional (not gated by the preference), since they confirm
--     the user's own just-taken action rather than someone else's activity.
--   post_reaction_added -> notify the post author, gated by
--     wants_community_notifications, skipping self-reactions and blocked
--     pairs. Keyed per (post_id, reactor) so switching reaction types
--     doesn't spam a second notification (and in fact can't: the
--     AFTER INSERT OR DELETE trigger on post_upvotes doesn't fire on the
--     UPDATE path an upsert-switch takes, so only a genuinely new reaction
--     ever reaches this code -- confirmed via pg_trigger).

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

    IF COALESCE((SELECT wants_community_notifications FROM public.profiles WHERE id = OLD.recipient_id), true)
       AND NOT EXISTS (
         SELECT 1 FROM public.user_blocked_profiles
         WHERE (blocker_id = OLD.recipient_id AND blocked_user_id = OLD.requester_id)
            OR (blocker_id = OLD.requester_id AND blocked_user_id = OLD.recipient_id)
       )
    THEN
      SELECT COALESCE(full_name, username, 'A fellow seeker') INTO requester_name FROM public.profiles WHERE id = OLD.requester_id;
      INSERT INTO public.notifications (user_id, title, body, emoji, type, action_url, notification_key)
      VALUES (OLD.recipient_id, requester_name || ' withdrew their connection request', 'Their request is no longer pending.', '🤝', 'connection_cancelled', '/mandali', 'connection_cancelled:' || OLD.id)
      ON CONFLICT (user_id, notification_key) WHERE notification_key IS NOT NULL DO NOTHING;
    END IF;

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

      IF COALESCE((SELECT wants_community_notifications FROM public.profiles WHERE id = NEW.requester_id), true)
         AND NOT EXISTS (
           SELECT 1 FROM public.user_blocked_profiles
           WHERE (blocker_id = NEW.recipient_id AND blocked_user_id = NEW.requester_id)
              OR (blocker_id = NEW.requester_id AND blocked_user_id = NEW.recipient_id)
         )
      THEN
        SELECT COALESCE(full_name, username, 'A fellow seeker') INTO recipient_name FROM public.profiles WHERE id = NEW.recipient_id;
        INSERT INTO public.notifications (user_id, title, body, emoji, type, action_url, notification_key)
        VALUES (NEW.requester_id, recipient_name || ' declined your connection request', 'You can always try connecting again later.', '🤝', 'connection_rejected', '/mandali', 'connection_rejected:' || NEW.id)
        ON CONFLICT (user_id, notification_key) WHERE notification_key IS NOT NULL DO NOTHING;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_user_block_cascade()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  blocked_name text;
BEGIN
  DELETE FROM public.mandali_connections
  WHERE (requester_id = NEW.blocker_id AND recipient_id = NEW.blocked_user_id)
     OR (requester_id = NEW.blocked_user_id AND recipient_id = NEW.blocker_id);

  PERFORM public.log_user_activity(NEW.blocker_id, NEW.blocked_user_id, 'user_blocked', 'user_blocked_profiles', NEW.id, '{}'::jsonb);

  SELECT COALESCE(full_name, username, 'that user') INTO blocked_name FROM public.profiles WHERE id = NEW.blocked_user_id;
  INSERT INTO public.notifications (user_id, title, body, emoji, type, action_url, notification_key)
  VALUES (NEW.blocker_id, 'You blocked ' || blocked_name, 'You won''t see each other''s posts anymore.', '🚫', 'user_blocked', '/mandali', 'user_blocked:' || NEW.id)
  ON CONFLICT (user_id, notification_key) WHERE notification_key IS NOT NULL DO NOTHING;

  RETURN NEW;
END;
$function$;

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

  INSERT INTO public.notifications (user_id, title, body, emoji, type, action_url, notification_key)
  VALUES (NEW.reported_by, 'Report received', 'Our team will review it shortly. Thank you for helping keep Mandali safe.', '🚩', 'content_reported', '/mandali', 'content_reported:' || NEW.id)
  ON CONFLICT (user_id, notification_key) WHERE notification_key IS NOT NULL DO NOTHING;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.log_post_reaction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  post_author uuid;
  reactor_name text;
  reaction_emoji text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT author_id INTO post_author FROM public.posts WHERE id = NEW.post_id;
    PERFORM public.log_user_activity(NEW.user_id, post_author, 'post_reaction_added', 'post', NEW.post_id, jsonb_build_object('reaction_type', NEW.reaction_type));

    IF post_author IS NOT NULL AND post_author <> NEW.user_id
       AND COALESCE((SELECT wants_community_notifications FROM public.profiles WHERE id = post_author), true)
       AND NOT EXISTS (
         SELECT 1 FROM public.user_blocked_profiles
         WHERE (blocker_id = post_author AND blocked_user_id = NEW.user_id)
            OR (blocker_id = NEW.user_id AND blocked_user_id = post_author)
       )
    THEN
      SELECT COALESCE(full_name, username, 'A fellow seeker') INTO reactor_name FROM public.profiles WHERE id = NEW.user_id;
      reaction_emoji := CASE NEW.reaction_type WHEN 'pranam' THEN '🙏' WHEN 'insightful' THEN '💡' ELSE '❤️' END;
      INSERT INTO public.notifications (user_id, title, body, emoji, type, action_url, notification_key)
      VALUES (post_author, reactor_name || ' reacted to your post', 'Tap to see it.', reaction_emoji, 'post_reaction', '/mandali', 'post_reaction:' || NEW.post_id || ':' || NEW.user_id)
      ON CONFLICT (user_id, notification_key) WHERE notification_key IS NOT NULL DO NOTHING;
    END IF;

    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    SELECT author_id INTO post_author FROM public.posts WHERE id = OLD.post_id;
    PERFORM public.log_user_activity(OLD.user_id, post_author, 'post_reaction_removed', 'post', OLD.post_id, jsonb_build_object('reaction_type', OLD.reaction_type));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$;
