-- Make waitlist registration and its first-party confirmation email one
-- transaction. Repeated submissions repair a missing/dead welcome job without
-- touching accepted, pending, processing, or suppressed messages.
BEGIN;

CREATE OR REPLACE FUNCTION public.register_waitlist_with_welcome(
  p_email text,
  p_tradition text,
  p_name text,
  p_source text,
  p_timezone text,
  p_referred_by_number integer,
  p_referral_source text,
  p_email_payload jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_email text := lower(btrim(p_email));
  v_row public.waitlist%ROWTYPE;
  v_existing boolean := false;
  v_outbox_status text;
BEGIN
  IF p_email IS NULL OR length(v_email) < 6 OR length(v_email) > 254 THEN
    RAISE EXCEPTION 'invalid waitlist email';
  END IF;
  IF p_tradition IS NOT NULL AND p_tradition NOT IN ('hindu', 'sikh', 'buddhist', 'jain') THEN
    RAISE EXCEPTION 'invalid waitlist tradition';
  END IF;
  IF jsonb_typeof(p_email_payload) IS DISTINCT FROM 'object'
     OR nullif(p_email_payload ->> 'subject', '') IS NULL
     OR nullif(p_email_payload ->> 'html', '') IS NULL THEN
    RAISE EXCEPTION 'invalid welcome email payload';
  END IF;

  -- Serialize same-email signups, including callers racing the unique index.
  PERFORM pg_advisory_xact_lock(hashtextextended(v_email, 0));

  SELECT * INTO v_row
    FROM public.waitlist
   WHERE lower(email) = v_email
   ORDER BY created_at ASC NULLS LAST, id ASC
   LIMIT 1
   FOR UPDATE;
  v_existing := FOUND;

  IF v_existing THEN
    UPDATE public.waitlist
       SET tradition = coalesce(p_tradition, tradition),
           name = coalesce(p_name, name),
           source = coalesce(p_source, source),
           timezone = coalesce(p_timezone, timezone),
           referred_by_number = coalesce(p_referred_by_number, referred_by_number),
           referral_source = coalesce(p_referral_source, referral_source)
     WHERE id = v_row.id
     RETURNING * INTO v_row;
  ELSE
    INSERT INTO public.waitlist (
      email, tradition, name, source, timezone, referred_by_number, referral_source
    ) VALUES (
      v_email, p_tradition, p_name, coalesce(p_source, 'landing'), p_timezone,
      p_referred_by_number, p_referral_source
    )
    RETURNING * INTO v_row;
  END IF;

  IF v_row.email_sent IS NOT TRUE THEN
    INSERT INTO public.email_outbox AS current_outbox (
      idempotency_key, recipient_email, template_key, email_class, payload, priority
    ) VALUES (
      'waitlist-welcome:' || v_row.id::text,
      v_email,
      'waitlist_welcome',
      'transactional',
      p_email_payload || jsonb_build_object('waitlistId', v_row.id),
      40
    )
    ON CONFLICT (idempotency_key) DO UPDATE
       SET recipient_email = excluded.recipient_email,
           payload = excluded.payload,
           status = 'pending',
           attempt_count = 0,
           available_at = now(),
           locked_by = NULL,
           locked_until = NULL,
           last_error_code = NULL,
           updated_at = now()
     WHERE current_outbox.status = 'dead'
       AND current_outbox.last_error_code IS DISTINCT FROM 'idempotency_window_expired'
       AND current_outbox.provider_message_id IS NULL;
  END IF;

  SELECT status INTO v_outbox_status
    FROM public.email_outbox
   WHERE idempotency_key = 'waitlist-welcome:' || v_row.id::text;

  -- Repair the legacy denormalized flag when the outbox already proves that
  -- the provider accepted this message.
  IF v_outbox_status = 'sent' AND v_row.email_sent IS NOT TRUE THEN
    UPDATE public.waitlist SET email_sent = true WHERE id = v_row.id RETURNING * INTO v_row;
  END IF;

  RETURN jsonb_build_object(
    'id', v_row.id,
    'email', v_email,
    'name', v_row.name,
    'tradition', v_row.tradition,
    'founding_number', v_row.founding_number,
    'email_sent', v_row.email_sent,
    'already_registered', v_existing
  );
END;
$$;

REVOKE ALL ON FUNCTION public.register_waitlist_with_welcome(text, text, text, text, text, integer, text, jsonb)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.register_waitlist_with_welcome(text, text, text, text, text, integer, text, jsonb)
  TO service_role;

COMMIT;
