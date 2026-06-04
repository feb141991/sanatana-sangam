-- Name: ai_chat_usage; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ai_chat_usage (
    user_id uuid NOT NULL,
    usage_date date NOT NULL,
    message_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.ai_chat_usage OWNER TO postgres;

--
-- Name: birth_profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.birth_profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    owner_id uuid,
    label text DEFAULT 'My Chart'::text NOT NULL,
    full_name text,
    relation text DEFAULT 'self'::text,
    date_of_birth date NOT NULL,
    time_of_birth time without time zone,
    birth_city text,
    birth_country text,
    birth_lat numeric(9,6),
    birth_lng numeric(9,6),
    birth_timezone text,
    rashi text,
    sun_rashi text,
    nakshatra text,
    nakshatra_pada smallint,
    nakshatra_lord text,
    lagna text,
    lagna_deg numeric(6,3),
    ayanamsa numeric(6,4),
    chart_data jsonb,
    current_dasha_planet text,
    current_dasha_end_date date,
    next_dasha_planet text,
    is_primary boolean DEFAULT false,
    is_public boolean DEFAULT false,
    session_token text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT birth_profiles_relation_check CHECK ((relation = ANY (ARRAY['self'::text, 'spouse'::text, 'child'::text, 'parent'::text, 'sibling'::text, 'friend'::text, 'other'::text])))
);


ALTER TABLE public.birth_profiles OWNER TO postgres;

--
-- Name: content_meanings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.content_meanings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    entry_id text NOT NULL,
    language text NOT NULL,
    meaning text NOT NULL,
    source_label text,
    source_meaning_hash text,
    source_status text DEFAULT 'ai_generated'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT content_meanings_language_check CHECK ((language = ANY (ARRAY['hi'::text, 'pa'::text]))),
    CONSTRAINT content_meanings_source_status_check CHECK ((source_status = ANY (ARRAY['ai_generated'::text, 'human_reviewed'::text, 'approved'::text])))
);


ALTER TABLE public.content_meanings OWNER TO postgres;

--
-- Name: content_reports; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.content_reports (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    reported_by uuid NOT NULL,
    content_type text NOT NULL,
    content_id text NOT NULL,
    reason text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    admin_note text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    content_author_id uuid,
    CONSTRAINT content_reports_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'reviewed'::text, 'actioned'::text, 'dismissed'::text])))
);


ALTER TABLE public.content_reports OWNER TO postgres;

--
-- Name: daily_quiz; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.daily_quiz (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tradition text NOT NULL,
    language text DEFAULT 'en'::text NOT NULL,
    date date NOT NULL,
    question text NOT NULL,
    options jsonb NOT NULL,
    answer_index smallint NOT NULL,
    explanation text NOT NULL,
    fact text NOT NULL,
    source text NOT NULL,
    generated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT daily_quiz_answer_index_check CHECK (((answer_index >= 0) AND (answer_index <= 3)))
);


ALTER TABLE public.daily_quiz OWNER TO postgres;

--
-- Name: daily_sadhana; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.daily_sadhana (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    date date NOT NULL,
    japa_done boolean DEFAULT false,
    shloka_done boolean DEFAULT false,
    panchang_viewed boolean DEFAULT false,
    any_practice boolean DEFAULT false,
    streak_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    perfect_day_bonus_given boolean DEFAULT false,
    quiz_done boolean DEFAULT false,
    nitya_done boolean DEFAULT false,
    pathshala_done boolean DEFAULT false,
    dharmveer_done boolean DEFAULT false,
    stotram_done boolean DEFAULT false,
    katha_done boolean DEFAULT false,
    stotram_count integer DEFAULT 0,
    katha_count integer DEFAULT 0
);


ALTER TABLE public.daily_sadhana OWNER TO postgres;

--
-- Name: darshan_preferences; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.darshan_preferences (
    user_id uuid NOT NULL,
    stream_id text NOT NULL,
    is_favourite boolean DEFAULT true NOT NULL,
    notify_morning boolean DEFAULT false NOT NULL,
    notify_evening boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.darshan_preferences OWNER TO postgres;

--
-- Name: device_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.device_tokens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    player_id text NOT NULL,
    platform text DEFAULT 'web'::text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    registered_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.device_tokens OWNER TO postgres;

--
-- Name: devotional_tracks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.devotional_tracks (
    id text NOT NULL,
    title text NOT NULL,
    title_devanagari text,
    type text NOT NULL,
    deity text,
    tradition text DEFAULT 'hindu'::text NOT NULL,
    mood text[],
    audio_url text,
    duration_secs integer,
    creator text,
    license text NOT NULL,
    attribution_text text,
    source_url text,
    verse_count integer,
    language text DEFAULT 'sanskrit'::text,
    is_active boolean DEFAULT false NOT NULL,
    sort_order integer DEFAULT 100,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT devotional_tracks_tradition_check CHECK ((tradition = ANY (ARRAY['hindu'::text, 'sikh'::text, 'buddhist'::text, 'jain'::text, 'all'::text]))),
    CONSTRAINT devotional_tracks_type_check CHECK ((type = ANY (ARRAY['mantra'::text, 'stotram'::text, 'kirtan'::text, 'bhajan'::text, 'dhyana'::text, 'simran'::text])))
);


ALTER TABLE public.devotional_tracks OWNER TO postgres;

--
-- Name: dharm_veer_daily; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.dharm_veer_daily (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tradition text NOT NULL,
    date date NOT NULL,
    slug text NOT NULL,
    name text NOT NULL,
    name_local text,
    era text,
    tagline text NOT NULL,
    journey text NOT NULL,
    journey_local text,
    trial text NOT NULL,
    trial_local text,
    teaching text NOT NULL,
    teaching_local text,
    moral text NOT NULL,
    moral_local text,
    legacy text,
    legacy_local text,
    quote text,
    quote_local text,
    quote_source text,
    tags text[],
    generated_by text DEFAULT 'ai'::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.dharm_veer_daily OWNER TO postgres;

--
-- Name: dharm_veers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.dharm_veers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    slug text NOT NULL,
    name text NOT NULL,
    name_local text,
    tradition text NOT NULL,
    era text,
    tagline text NOT NULL,
    journey text NOT NULL,
    journey_local text,
    trial text NOT NULL,
    trial_local text,
    teaching text NOT NULL,
    teaching_local text,
    moral text NOT NULL,
    moral_local text,
    quote text,
    quote_local text,
    quote_source text,
    tags text[] DEFAULT '{}'::text[],
    day_index integer,
    generated_by text DEFAULT 'ai'::text,
    created_at timestamp with time zone DEFAULT now(),
    legacy text,
    legacy_local text,
    illustration_prompt text,
    CONSTRAINT dharm_veers_tradition_check CHECK ((tradition = ANY (ARRAY['hindu'::text, 'sikh'::text, 'buddhist'::text, 'jain'::text, 'sufi'::text, 'tribal'::text])))
);


ALTER TABLE public.dharm_veers OWNER TO postgres;

--
-- Name: event_rsvps; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.event_rsvps (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    post_id uuid NOT NULL,
    user_id uuid NOT NULL,
    status text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT event_rsvps_status_check CHECK ((status = ANY (ARRAY['going'::text, 'interested'::text, 'not_going'::text])))
);


ALTER TABLE public.event_rsvps OWNER TO postgres;

--
-- Name: festivals; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.festivals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    name text NOT NULL,
    date date NOT NULL,
    emoji text DEFAULT '🪔'::text,
    description text NOT NULL,
    type text DEFAULT 'major'::text,
    year integer DEFAULT EXTRACT(year FROM now()) NOT NULL,
    tradition text,
    is_shared boolean DEFAULT false NOT NULL,
    source_name text,
    source_kind text,
    review_status text,
    reviewed_at timestamp with time zone,
    review_notes text,
    verification_status text,
    verification_confidence text,
    verification_note text,
    suggested_date date,
    verification_run_at timestamp with time zone,
    verification_type text,
    CONSTRAINT festivals_review_status_check CHECK ((review_status = ANY (ARRAY['needs_review'::text, 'reviewed'::text]))),
    CONSTRAINT festivals_source_kind_check CHECK ((source_kind = ANY (ARRAY['curated'::text, 'official'::text, 'partner'::text, 'community_reviewed'::text]))),
    CONSTRAINT festivals_tradition_check CHECK ((tradition = ANY (ARRAY['hindu'::text, 'sikh'::text, 'buddhist'::text, 'jain'::text, 'all'::text]))),
    CONSTRAINT festivals_type_check CHECK ((type = ANY (ARRAY['major'::text, 'vrat'::text, 'regional'::text]))),
    CONSTRAINT festivals_verification_confidence_check CHECK ((verification_confidence = ANY (ARRAY['high'::text, 'medium'::text, 'low'::text]))),
    CONSTRAINT festivals_verification_status_check CHECK ((verification_status = ANY (ARRAY['verified'::text, 'mismatch'::text, 'uncertain'::text, 'not_checked'::text, 'manual_review'::text]))),
    CONSTRAINT festivals_verification_type_check CHECK ((verification_type = ANY (ARRAY['solar_fixed'::text, 'lunar_tithi'::text, 'nakshatra_based'::text, 'regional_calendar'::text, 'historical_commemoration'::text])))
);


ALTER TABLE public.festivals OWNER TO postgres;

--
-- Name: forum_replies; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.forum_replies (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    thread_id uuid NOT NULL,
    author_id uuid NOT NULL,
    body text NOT NULL,
    upvotes integer DEFAULT 0,
    is_accepted boolean DEFAULT false,
    parent_id uuid
);


ALTER TABLE public.forum_replies OWNER TO postgres;

--
-- Name: forum_threads; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.forum_threads (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    author_id uuid NOT NULL,
    category text NOT NULL,
    title text NOT NULL,
    body text NOT NULL,
    upvotes integer DEFAULT 0,
    reply_count integer DEFAULT 0,
    is_answered boolean DEFAULT false,
    is_pinned boolean DEFAULT false,
    tags text[] DEFAULT ARRAY[]::text[],
    sampradaya_filter text
);


ALTER TABLE public.forum_threads OWNER TO postgres;

--
-- Name: guided_path_progress; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.guided_path_progress (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    path_id text NOT NULL,
    status text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    last_interacted_at timestamp with time zone DEFAULT now() NOT NULL,
    completed_at timestamp with time zone,
    current_lesson integer DEFAULT 0 NOT NULL,
    completed_lessons integer[] DEFAULT '{}'::integer[] NOT NULL,
    day_reached integer DEFAULT 1 NOT NULL,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT guided_path_progress_status_check CHECK ((status = ANY (ARRAY['active'::text, 'dismissed'::text, 'completed'::text])))
);


ALTER TABLE public.guided_path_progress OWNER TO postgres;

--
-- Name: COLUMN guided_path_progress.day_reached; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.guided_path_progress.day_reached IS 'Which day of the plan the user has reached (1-indexed). Incremented by the daily cron after each push is sent.';


--
-- Name: COLUMN guided_path_progress.started_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.guided_path_progress.started_at IS 'When the user first started this plan (set on upsert, not updated thereafter).';


--
-- Name: hero_assets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.hero_assets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    label text NOT NULL,
    hero_image text NOT NULL,
    hero_alt text NOT NULL,
    object_position text DEFAULT 'center 24%'::text NOT NULL,
    traditions text[] DEFAULT '{}'::text[] NOT NULL,
    sampradayas text[] DEFAULT '{}'::text[] NOT NULL,
    ishta_devatas text[] DEFAULT '{}'::text[] NOT NULL,
    festival_slugs text[] DEFAULT '{}'::text[] NOT NULL,
    tags text[] DEFAULT '{}'::text[] NOT NULL,
    priority integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    uploaded_by text
);


ALTER TABLE public.hero_assets OWNER TO postgres;

--
-- Name: karma_award_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.karma_award_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    reason text NOT NULL,
    amount integer NOT NULL,
    awarded_date date NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT karma_award_log_amount_check CHECK (((amount > 0) AND (amount <= 100)))
);


ALTER TABLE public.karma_award_log OWNER TO postgres;

--
-- Name: karma_ledger; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.karma_ledger (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    amount integer NOT NULL,
    reason text NOT NULL,
    source_route text,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.karma_ledger OWNER TO postgres;

--
-- Name: kul_events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.kul_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    kul_id uuid NOT NULL,
    title text NOT NULL,
    event_type text DEFAULT 'custom'::text NOT NULL,
    event_date date NOT NULL,
    recurring boolean DEFAULT true NOT NULL,
    description text,
    member_id uuid,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT kul_events_event_type_check CHECK ((event_type = ANY (ARRAY['birthday'::text, 'anniversary'::text, 'death_anniversary'::text, 'puja'::text, 'custom'::text])))
);


ALTER TABLE public.kul_events OWNER TO postgres;

--
-- Name: kul_family_members; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.kul_family_members (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    kul_id uuid NOT NULL,
    name text NOT NULL,
    role text,
    gender text,
    birth_year integer,
    birth_date date,
    death_year integer,
    death_date date,
    marriage_date date,
    parent_id uuid,
    spouse_id uuid,
    linked_user_id uuid,
    notes text,
    photo_url text,
    is_alive boolean DEFAULT true NOT NULL,
    generation integer,
    display_order integer DEFAULT 0,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    birth_place text,
    CONSTRAINT kul_family_members_gender_check CHECK ((gender = ANY (ARRAY['male'::text, 'female'::text, 'other'::text])))
);


ALTER TABLE public.kul_family_members OWNER TO postgres;

--
-- Name: COLUMN kul_family_members.birth_place; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.kul_family_members.birth_place IS 'Place of birth for informative lineage tracking.';


--
-- Name: kul_members; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.kul_members (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    kul_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role text DEFAULT 'sadhak'::text NOT NULL,
    joined_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT kul_members_role_check CHECK ((role = ANY (ARRAY['guardian'::text, 'sadhak'::text])))
);


ALTER TABLE public.kul_members OWNER TO postgres;

--
-- Name: mala_sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.mala_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    mantra text NOT NULL,
    chant_source text,
    count integer DEFAULT 0 NOT NULL,
    target_count integer,
    duration_seconds integer DEFAULT 0,
    notes text,
    share_scope text DEFAULT 'private'::text NOT NULL,
    completed_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    date text,
    rounds integer DEFAULT 0,
    bead_count integer DEFAULT 0,
    mantra_id text,
    duration_secs integer DEFAULT 0,
    mala_id text,
    background_scene text,
    tradition text,
    practice_type text DEFAULT 'mala'::text,
    intention text,
    completion_type text DEFAULT 'completed'::text,
    target_rounds integer,
    completed_rounds integer,
    ambient_id text,
    spiritual_time_window text,
    timezone text,
    source_route text,
    panchang_context jsonb,
    mood_before text,
    mood_after text,
    completed_beads integer,
    spiritual_date date,
    haptics_enabled boolean DEFAULT true,
    CONSTRAINT mala_sessions_bead_count_check CHECK ((bead_count >= 0)),
    CONSTRAINT mala_sessions_completed_beads_check CHECK (((completed_beads IS NULL) OR (completed_beads >= 0))),
    CONSTRAINT mala_sessions_count_check CHECK ((count >= 0)),
    CONSTRAINT mala_sessions_duration_seconds_check CHECK ((duration_seconds >= 0)),
    CONSTRAINT mala_sessions_duration_secs_check CHECK ((duration_secs >= 0)),
    CONSTRAINT mala_sessions_rounds_check CHECK ((rounds >= 0)),
    CONSTRAINT mala_sessions_share_scope_check CHECK ((share_scope = ANY (ARRAY['private'::text, 'kul'::text, 'public'::text])))
);


ALTER TABLE public.mala_sessions OWNER TO postgres;

--
-- Name: user_practice; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_practice (
    user_id uuid NOT NULL,
    preferred_time text DEFAULT 'irregular'::text,
    avg_session_duration_s integer DEFAULT 0,
    consistency_score double precision DEFAULT 0,
    current_streak integer DEFAULT 0,
    longest_streak integer DEFAULT 0,
    primary_path text DEFAULT 'bhakti'::text,
    preferred_deity text DEFAULT 'general'::text,
    tradition text DEFAULT 'general'::text,
    content_depth text DEFAULT 'beginner'::text,
    language_pref text[] DEFAULT ARRAY['english'::text],
    favorite_texts text[] DEFAULT ARRAY[]::text[],
    most_active_day text DEFAULT 'unknown'::text,
    skip_pattern jsonb DEFAULT '{}'::jsonb,
    re_engagement_style text DEFAULT 'unknown'::text,
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.user_practice OWNER TO postgres;

--
-- Name: kul_member_profiles; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.kul_member_profiles WITH (security_invoker='true') AS
 SELECT km.kul_id,
    km.user_id,
    km.role,
    km.joined_at,
    up.tradition,
    up.preferred_deity,
    up.primary_path,
    up.content_depth,
    up.current_streak,
    up.consistency_score,
    up.preferred_time,
    up.avg_session_duration_s,
    up.favorite_texts,
    up.re_engagement_style,
    COALESCE(recent.session_count, (0)::bigint) AS sessions_last_7d,
    COALESCE(recent.total_japa, (0)::bigint) AS japa_last_7d,
    recent.last_mantra
   FROM ((public.kul_members km
     LEFT JOIN public.user_practice up ON ((up.user_id = km.user_id)))
     LEFT JOIN LATERAL ( SELECT count(*) AS session_count,
            sum(ms.count) AS total_japa,
            max(ms.mantra) AS last_mantra
           FROM public.mala_sessions ms
          WHERE ((ms.user_id = km.user_id) AND (ms.completed_at >= (now() - '7 days'::interval)))) recent ON (true));


ALTER VIEW public.kul_member_profiles OWNER TO postgres;

--
-- Name: kul_messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.kul_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    kul_id uuid NOT NULL,
    sender_id uuid NOT NULL,
    content text NOT NULL,
    reaction text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.kul_messages OWNER TO postgres;

--
-- Name: kul_tasks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.kul_tasks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    kul_id uuid NOT NULL,
    assigned_by uuid NOT NULL,
    assigned_to uuid NOT NULL,
    title text NOT NULL,
    description text,
    task_type text DEFAULT 'read'::text NOT NULL,
    content_ref text,
    due_date date,
    completed boolean DEFAULT false NOT NULL,
    completed_at timestamp with time zone,
    score integer,
    guardian_note text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT kul_tasks_task_type_check CHECK ((task_type = ANY (ARRAY['read'::text, 'recite'::text, 'practice'::text, 'memorise'::text])))
);


ALTER TABLE public.kul_tasks OWNER TO postgres;

--
-- Name: kul_pending_tasks; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.kul_pending_tasks WITH (security_invoker='true') AS
 SELECT id,
    kul_id,
    assigned_to,
    assigned_by,
    title,
    task_type,
    content_ref,
    due_date,
    score,
    completed,
    guardian_note,
    created_at,
        CASE
            WHEN ((due_date < CURRENT_DATE) AND (NOT completed)) THEN 'overdue'::text
            WHEN (due_date = CURRENT_DATE) THEN 'due_today'::text
            ELSE 'upcoming'::text
        END AS urgency
   FROM public.kul_tasks kt
  WHERE (completed = false);


ALTER VIEW public.kul_pending_tasks OWNER TO postgres;

--
-- Name: kul_practice_today; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.kul_practice_today WITH (security_invoker='true') AS
 SELECT km.kul_id,
    km.user_id,
    km.role,
    COALESCE(sum(ms.count), (0)::bigint) AS japa_count_today,
    count(ms.id) AS sessions_today,
    (count(ms.id) > 0) AS practiced_today
   FROM (public.kul_members km
     LEFT JOIN public.mala_sessions ms ON (((ms.user_id = km.user_id) AND ((ms.completed_at)::date = CURRENT_DATE))))
  GROUP BY km.kul_id, km.user_id, km.role;


ALTER VIEW public.kul_practice_today OWNER TO postgres;

--
-- Name: kuls; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.kuls (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    invite_code text NOT NULL,
    created_by uuid NOT NULL,
    avatar_emoji text DEFAULT '🏡'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    cover_url text,
    is_pro boolean DEFAULT false,
    pro_activated_at timestamp with time zone,
    pro_expires_at timestamp with time zone,
    pro_admin_id uuid
);


ALTER TABLE public.kuls OWNER TO postgres;

--
-- Name: kul_weekly_stats; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.kul_weekly_stats WITH (security_invoker='true') AS
 SELECT km.kul_id,
    k.name AS kul_name,
    k.avatar_emoji,
    count(DISTINCT km.user_id) AS total_members,
    count(DISTINCT ms.user_id) AS active_members_7d,
    COALESCE(sum(ms.count), (0)::bigint) AS total_japa_7d,
    (COALESCE(avg(ms.duration_seconds), (0)::numeric))::integer AS avg_session_duration_s,
    max(up.current_streak) AS top_streak,
    max(up.consistency_score) AS top_consistency
   FROM (((public.kul_members km
     JOIN public.kuls k ON ((k.id = km.kul_id)))
     LEFT JOIN public.mala_sessions ms ON (((ms.user_id = km.user_id) AND (ms.completed_at >= (now() - '7 days'::interval)))))
     LEFT JOIN public.user_practice up ON ((up.user_id = km.user_id)))
  GROUP BY km.kul_id, k.name, k.avatar_emoji;


ALTER VIEW public.kul_weekly_stats OWNER TO postgres;

--
-- Name: live_darshans; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.live_darshans (
    id text NOT NULL,
    title text NOT NULL,
    location text NOT NULL,
    schedule text NOT NULL,
    category text NOT NULL,
    tradition text NOT NULL,
    youtube_channel_id text,
    current_video_id text,
    is_active boolean DEFAULT true,
    last_synced_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.live_darshans OWNER TO postgres;

--
-- Name: mandalis; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.mandalis (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    name text NOT NULL,
    city text NOT NULL,
    country text NOT NULL,
    latitude double precision NOT NULL,
    longitude double precision NOT NULL,
    radius_km double precision DEFAULT 10,
    member_count integer DEFAULT 0,
    description text
);


ALTER TABLE public.mandalis OWNER TO postgres;

--
-- Name: mantras; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.mantras (
    id text NOT NULL,
    name text NOT NULL,
    sanskrit text DEFAULT ''::text NOT NULL,
    transliteration text NOT NULL,
    meaning text NOT NULL,
    deity text NOT NULL,
    tradition text NOT NULL,
    beads_per_round integer DEFAULT 108 NOT NULL,
    description text NOT NULL,
    japa_instructions text NOT NULL,
    tags text[] DEFAULT '{}'::text[] NOT NULL,
    recommended_rounds integer DEFAULT 4 NOT NULL,
    level text DEFAULT 'beginner'::text NOT NULL,
    audio_url text,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.mantras OWNER TO postgres;

--
-- Name: message_threads; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.message_threads (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    subtitle text,
    kind text NOT NULL,
    context_label text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT message_threads_kind_check CHECK ((kind = ANY (ARRAY['kul'::text, 'mandali'::text, 'direct'::text])))
);


ALTER TABLE public.message_threads OWNER TO postgres;

--
-- Name: monitoring_events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.monitoring_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "timestamp" timestamp with time zone DEFAULT now() NOT NULL,
    severity text NOT NULL,
    domain text NOT NULL,
    route text,
    provider text,
    model text,
    fallback_used boolean,
    latency_ms integer,
    error_code text,
    error_message text,
    request_id text,
    trace_id text,
    context jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT monitoring_events_domain_check CHECK ((domain = ANY (ARRAY['app'::text, 'ai'::text, 'tts'::text, 'translation'::text, 'auth'::text, 'notifications'::text, 'cron'::text, 'storage'::text]))),
    CONSTRAINT monitoring_events_severity_check CHECK ((severity = ANY (ARRAY['P0'::text, 'P1'::text, 'P2'::text, 'P3'::text])))
);


ALTER TABLE public.monitoring_events OWNER TO postgres;

--
-- Name: nitya_karma_streaks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.nitya_karma_streaks (
    user_id uuid NOT NULL,
    current_streak integer DEFAULT 0,
    longest_streak integer DEFAULT 0,
    last_full_date date,
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.nitya_karma_streaks OWNER TO postgres;

--
-- Name: notification_schedule; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notification_schedule (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title text NOT NULL,
    body text NOT NULL,
    send_at timestamp with time zone NOT NULL,
    notification_type text DEFAULT 'generic'::text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    sent_at timestamp with time zone,
    error text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT notification_schedule_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'sent'::text, 'failed'::text, 'cancelled'::text])))
);


ALTER TABLE public.notification_schedule OWNER TO postgres;

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_id uuid NOT NULL,
    title text NOT NULL,
    body text NOT NULL,
    emoji text DEFAULT '🔔'::text,
    type text DEFAULT 'general'::text,
    read boolean DEFAULT false,
    action_url text,
    notification_key text,
    local_date date,
    sent_timezone text
);

ALTER TABLE ONLY public.notifications REPLICA IDENTITY FULL;


ALTER TABLE public.notifications OWNER TO postgres;

--
-- Name: sadhana_events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sadhana_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    event_type text NOT NULL,
    event_data jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.sadhana_events OWNER TO postgres;

--
-- Name: nudge_effectiveness; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.nudge_effectiveness WITH (security_invoker='true') AS
 SELECT user_id,
    (event_data ->> 'nudge_style'::text) AS style,
    count(*) FILTER (WHERE (event_type = 'streak_recovered'::text)) AS recoveries,
    count(*) FILTER (WHERE (event_type = 'notification_dismissed'::text)) AS dismissals,
    round((((count(*) FILTER (WHERE (event_type = 'streak_recovered'::text)))::numeric / (NULLIF(count(*), 0))::numeric) * (100)::numeric), 1) AS recovery_rate_pct
   FROM public.sadhana_events
  WHERE ((event_type = ANY (ARRAY['streak_recovered'::text, 'notification_dismissed'::text])) AND ((event_data ->> 'nudge_style'::text) IS NOT NULL))
  GROUP BY user_id, (event_data ->> 'nudge_style'::text);


ALTER VIEW public.nudge_effectiveness OWNER TO postgres;

--
-- Name: observance_definitions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.observance_definitions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    slug text NOT NULL,
    display_name text NOT NULL,
    kind text,
    tradition text,
    calendar_rule_type text,
    verification_type text,
    route_kind text,
    route_slug text,
    region text,
    active boolean DEFAULT true NOT NULL,
    emoji text DEFAULT '🪔'::text,
    description text,
    is_shared boolean DEFAULT false NOT NULL,
    guarantee_level text DEFAULT 'manual_review_required'::text NOT NULL,
    CONSTRAINT observance_definitions_guarantee_level_check CHECK ((guarantee_level = ANY (ARRAY['canonical_engine'::text, 'manual_review_required'::text, 'multi_valid_dates'::text, 'unsupported_rule'::text]))),
    CONSTRAINT observance_definitions_kind_check CHECK ((kind = ANY (ARRAY['major'::text, 'vrat'::text, 'regional'::text]))),
    CONSTRAINT observance_definitions_tradition_check CHECK ((tradition = ANY (ARRAY['hindu'::text, 'sikh'::text, 'buddhist'::text, 'jain'::text, 'all'::text]))),
    CONSTRAINT observance_definitions_verification_type_check CHECK ((verification_type = ANY (ARRAY['solar_fixed'::text, 'lunar_tithi'::text, 'nakshatra_based'::text, 'regional_calendar'::text, 'historical_commemoration'::text])))
);


ALTER TABLE public.observance_definitions OWNER TO postgres;

--
-- Name: observance_occurrences; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.observance_occurrences (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    definition_id uuid NOT NULL,
    year integer NOT NULL,
    date date NOT NULL,
    calculation_version text DEFAULT '1.0.0'::text NOT NULL,
    calculated_by text DEFAULT 'system'::text NOT NULL,
    verification_status text,
    verification_note text,
    suggested_date date,
    review_status text,
    source_provenance jsonb DEFAULT '{}'::jsonb NOT NULL,
    verification_confidence text,
    verification_run_at timestamp with time zone,
    reviewed_at timestamp with time zone,
    review_notes text,
    manual_date_override date,
    manual_override_reason text,
    locked_for_regeneration boolean DEFAULT false NOT NULL,
    final_date_source text DEFAULT 'legacy_seed'::text NOT NULL,
    audit_status text DEFAULT 'not_run'::text NOT NULL,
    audit_failure_reason text,
    audit_retry_count integer DEFAULT 0 NOT NULL,
    last_audited_at timestamp with time zone,
    CONSTRAINT observance_occurrences_audit_status_check CHECK ((audit_status = ANY (ARRAY['not_run'::text, 'completed'::text, 'failed'::text, 'skipped'::text]))),
    CONSTRAINT observance_occurrences_final_date_source_check CHECK ((final_date_source = ANY (ARRAY['legacy_seed'::text, 'manual_override'::text, 'calculation_engine'::text, 'calculation_engine_reviewed'::text, 'fallback'::text]))),
    CONSTRAINT observance_occurrences_review_status_check CHECK ((review_status = ANY (ARRAY['needs_review'::text, 'reviewed'::text]))),
    CONSTRAINT observance_occurrences_verification_confidence_check CHECK ((verification_confidence = ANY (ARRAY['high'::text, 'medium'::text, 'low'::text]))),
    CONSTRAINT observance_occurrences_verification_status_check CHECK ((verification_status = ANY (ARRAY['verified'::text, 'mismatch'::text, 'uncertain'::text, 'not_checked'::text, 'manual_review'::text])))
);


ALTER TABLE public.observance_occurrences OWNER TO postgres;

--
-- Name: pathshala_badges; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pathshala_badges (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    slug text NOT NULL,
    title text NOT NULL,
    emoji text DEFAULT '🏅'::text NOT NULL,
    description text NOT NULL,
    category text DEFAULT 'learning'::text NOT NULL,
    criteria jsonb DEFAULT '{}'::jsonb NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    CONSTRAINT pathshala_badges_category_check CHECK ((category = ANY (ARRAY['learning'::text, 'recitation'::text, 'community'::text, 'streak'::text, 'mastery'::text])))
);


ALTER TABLE public.pathshala_badges OWNER TO postgres;

--
-- Name: pathshala_circle_members; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pathshala_circle_members (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    circle_id uuid NOT NULL,
    user_id uuid NOT NULL,
    joined_at timestamp with time zone DEFAULT now() NOT NULL,
    current_position integer DEFAULT 1 NOT NULL,
    last_activity_at timestamp with time zone
);


ALTER TABLE public.pathshala_circle_members OWNER TO postgres;

--
-- Name: pathshala_paths; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pathshala_paths (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    slug text NOT NULL,
    title text NOT NULL,
    subtitle text,
    description text,
    language text DEFAULT 'sa'::text NOT NULL,
    tradition text,
    difficulty text DEFAULT 'beginner'::text NOT NULL,
    text_category text DEFAULT 'smriti'::text NOT NULL,
    total_chunks integer DEFAULT 0 NOT NULL,
    estimated_weeks integer DEFAULT 4 NOT NULL,
    cover_emoji text DEFAULT '📖'::text,
    cover_color text DEFAULT '#FF6B35'::text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT pathshala_paths_difficulty_check CHECK ((difficulty = ANY (ARRAY['beginner'::text, 'intermediate'::text, 'advanced'::text])))
);


ALTER TABLE public.pathshala_paths OWNER TO postgres;

--
-- Name: TABLE pathshala_paths; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.pathshala_paths IS 'Curriculum path definitions — seeded, not user-created. One row per course.';


--
-- Name: pathshala_study_circles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pathshala_study_circles (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    kul_id uuid NOT NULL,
    path_id uuid NOT NULL,
    created_by uuid NOT NULL,
    title text,
    description text,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    target_completion_date date,
    chunks_per_week integer DEFAULT 7 NOT NULL,
    is_active boolean DEFAULT true NOT NULL
);


ALTER TABLE public.pathshala_study_circles OWNER TO postgres;

--
-- Name: pathshala_circle_leaderboard; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.pathshala_circle_leaderboard WITH (security_invoker='true') AS
 SELECT cm.circle_id,
    sc_circle.kul_id,
    sc_circle.path_id,
    p.title AS path_title,
    p.total_chunks,
    cm.user_id,
    cm.current_position,
    cm.last_activity_at,
    round((((cm.current_position)::numeric / (NULLIF(p.total_chunks, 0))::numeric) * (100)::numeric), 1) AS pct_complete,
    rank() OVER (PARTITION BY cm.circle_id ORDER BY cm.current_position DESC) AS rank
   FROM ((public.pathshala_circle_members cm
     JOIN public.pathshala_study_circles sc_circle ON ((sc_circle.id = cm.circle_id)))
     JOIN public.pathshala_paths p ON ((p.id = sc_circle.path_id)));


ALTER VIEW public.pathshala_circle_leaderboard OWNER TO postgres;

--
-- Name: pathshala_enrollments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pathshala_enrollments (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    path_id uuid NOT NULL,
    enrolled_at timestamp with time zone DEFAULT now() NOT NULL,
    current_position integer DEFAULT 1 NOT NULL,
    completed_at timestamp with time zone,
    paused boolean DEFAULT false NOT NULL,
    language_pref text DEFAULT 'en'::text NOT NULL,
    daily_target_chunks integer DEFAULT 1 NOT NULL,
    last_activity_at timestamp with time zone
);


ALTER TABLE public.pathshala_enrollments OWNER TO postgres;

--
-- Name: pathshala_path_chunks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pathshala_path_chunks (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    path_id uuid NOT NULL,
    chunk_id uuid NOT NULL,
    "position" integer NOT NULL,
    week_number integer DEFAULT 1 NOT NULL,
    day_number integer DEFAULT 1 NOT NULL,
    is_optional boolean DEFAULT false NOT NULL
);


ALTER TABLE public.pathshala_path_chunks OWNER TO postgres;

--
-- Name: pathshala_progress; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pathshala_progress (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    chunk_id uuid NOT NULL,
    path_id uuid,
    enrollment_id uuid,
    read_at timestamp with time zone DEFAULT now() NOT NULL,
    read_count integer DEFAULT 1 NOT NULL,
    comprehension_score integer,
    memorization_level integer DEFAULT 0 NOT NULL,
    recitation_score numeric(3,1),
    notes text,
    CONSTRAINT pathshala_progress_comprehension_score_check CHECK (((comprehension_score >= 1) AND (comprehension_score <= 5))),
    CONSTRAINT pathshala_progress_memorization_level_check CHECK (((memorization_level >= 0) AND (memorization_level <= 5))),
    CONSTRAINT pathshala_progress_recitation_score_check CHECK (((recitation_score >= (0)::numeric) AND (recitation_score <= (5)::numeric)))
);


ALTER TABLE public.pathshala_progress OWNER TO postgres;

--
-- Name: pathshala_recitation_reviews; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pathshala_recitation_reviews (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    recording_id uuid NOT NULL,
    reviewer_id uuid,
    reviewer_type text DEFAULT 'ai'::text NOT NULL,
    score_uccharan numeric(3,1),
    score_sandhi numeric(3,1),
    score_visarga numeric(3,1),
    score_laya numeric(3,1),
    score_svara numeric(3,1),
    score_fluency numeric(3,1),
    overall_score numeric(3,1) NOT NULL,
    feedback_text text,
    corrections jsonb DEFAULT '[]'::jsonb,
    is_certified boolean DEFAULT false NOT NULL,
    reviewed_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT pathshala_recitation_reviews_overall_score_check CHECK (((overall_score >= (1)::numeric) AND (overall_score <= (5)::numeric))),
    CONSTRAINT pathshala_recitation_reviews_reviewer_type_check CHECK ((reviewer_type = ANY (ARRAY['ai'::text, 'guru'::text, 'peer'::text]))),
    CONSTRAINT pathshala_recitation_reviews_score_fluency_check CHECK (((score_fluency >= (1)::numeric) AND (score_fluency <= (5)::numeric))),
    CONSTRAINT pathshala_recitation_reviews_score_laya_check CHECK (((score_laya >= (1)::numeric) AND (score_laya <= (5)::numeric))),
    CONSTRAINT pathshala_recitation_reviews_score_sandhi_check CHECK (((score_sandhi >= (1)::numeric) AND (score_sandhi <= (5)::numeric))),
    CONSTRAINT pathshala_recitation_reviews_score_svara_check CHECK (((score_svara >= (1)::numeric) AND (score_svara <= (5)::numeric))),
    CONSTRAINT pathshala_recitation_reviews_score_uccharan_check CHECK (((score_uccharan >= (1)::numeric) AND (score_uccharan <= (5)::numeric))),
    CONSTRAINT pathshala_recitation_reviews_score_visarga_check CHECK (((score_visarga >= (1)::numeric) AND (score_visarga <= (5)::numeric)))
);


ALTER TABLE public.pathshala_recitation_reviews OWNER TO postgres;

--
-- Name: pathshala_recordings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pathshala_recordings (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    chunk_id uuid NOT NULL,
    enrollment_id uuid,
    audio_url text NOT NULL,
    audio_bucket text DEFAULT 'pathshala-recordings'::text NOT NULL,
    duration_s numeric(6,1),
    file_size_bytes integer,
    language text DEFAULT 'sa'::text NOT NULL,
    script text DEFAULT 'Devanagari'::text NOT NULL,
    transcript text,
    expected_text text NOT NULL,
    status text DEFAULT 'processing'::text NOT NULL,
    error_message text,
    submitted_at timestamp with time zone DEFAULT now() NOT NULL,
    scored_at timestamp with time zone,
    reviewed_at timestamp with time zone,
    CONSTRAINT pathshala_recordings_status_check CHECK ((status = ANY (ARRAY['processing'::text, 'scored'::text, 'pending_guru'::text, 'guru_reviewed'::text, 'error'::text])))
);


ALTER TABLE public.pathshala_recordings OWNER TO postgres;

--
-- Name: pathshala_recitation_stats; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.pathshala_recitation_stats WITH (security_invoker='true') AS
 SELECT r.user_id,
    count(*) AS total_recordings,
    count(*) FILTER (WHERE (r.status = 'scored'::text)) AS scored_count,
    round(avg(rr.overall_score), 2) AS avg_overall_score,
    round(avg(rr.score_uccharan), 2) AS avg_uccharan,
    round(avg(rr.score_fluency), 2) AS avg_fluency,
    count(DISTINCT r.chunk_id) AS unique_verses_attempted,
    count(*) FILTER (WHERE (rr.is_certified = true)) AS certified_count,
    max(rr.reviewed_at) AS last_reviewed_at
   FROM (public.pathshala_recordings r
     LEFT JOIN public.pathshala_recitation_reviews rr ON (((rr.recording_id = r.id) AND (rr.reviewer_type = 'ai'::text))))
  GROUP BY r.user_id;


ALTER VIEW public.pathshala_recitation_stats OWNER TO postgres;

--
-- Name: pathshala_verse_mastery; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pathshala_verse_mastery (
    user_id uuid NOT NULL,
    chunk_id uuid NOT NULL,
    best_ai_score numeric(3,1),
    best_guru_score numeric(3,1),
    attempt_count integer DEFAULT 0 NOT NULL,
    last_attempt_at timestamp with time zone,
    certified boolean DEFAULT false NOT NULL,
    certified_by uuid,
    certified_at timestamp with time zone,
    memorization_sm2 integer DEFAULT 0 NOT NULL,
    comprehension integer DEFAULT 0 NOT NULL,
    is_fully_mastered boolean GENERATED ALWAYS AS ((certified AND (memorization_sm2 >= 3) AND (comprehension >= 4))) STORED,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.pathshala_verse_mastery OWNER TO postgres;

--
-- Name: scripture_chunks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.scripture_chunks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    text_id text NOT NULL,
    chapter integer NOT NULL,
    verse integer NOT NULL,
    sanskrit text NOT NULL,
    transliteration text,
    translation text NOT NULL,
    word_by_word jsonb,
    commentary text,
    tags text[] DEFAULT ARRAY[]::text[],
    embedding public.vector(384),
    created_at timestamp with time zone DEFAULT now(),
    search_vector tsvector GENERATED ALWAYS AS (to_tsvector('english'::regconfig, COALESCE(translation, ''::text))) STORED,
    language text DEFAULT 'sa'::text,
    script text DEFAULT 'Devanagari'::text,
    tradition_region text,
    text_category text DEFAULT 'shruti'::text
);


ALTER TABLE public.scripture_chunks OWNER TO postgres;

--
-- Name: COLUMN scripture_chunks.transliteration; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.scripture_chunks.transliteration IS 'IAST romanisation for Sanskrit; helpful for non-script readers and STT comparison';


--
-- Name: COLUMN scripture_chunks.language; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.scripture_chunks.language IS 'ISO 639-1/3 language code: sa=Sanskrit, hi=Hindi, ta=Tamil, bn=Bengali, te=Telugu, kn=Kannada, ml=Malayalam, mr=Marathi, gu=Gujarati, or=Odia, awa=Awadhi, en=English';


--
-- Name: COLUMN scripture_chunks.script; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.scripture_chunks.script IS 'Writing system: Devanagari, Tamil, Bengali, Telugu, Kannada, Malayalam, Gujarati, Odia, IAST, Latin';


--
-- Name: COLUMN scripture_chunks.tradition_region; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.scripture_chunks.tradition_region IS 'Geographic tradition: north | south | east | west | pan (pan-India)';


--
-- Name: COLUMN scripture_chunks.text_category; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.scripture_chunks.text_category IS 'Canonical text classification for corpus browsing';


--
-- Name: pathshala_today_lessons; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.pathshala_today_lessons WITH (security_invoker='true') AS
 SELECT e.user_id,
    e.id AS enrollment_id,
    e.path_id,
    p.title AS path_title,
    p.cover_emoji,
    e.current_position,
    pc.chunk_id,
    pc.week_number,
    pc.day_number,
    sc.text_id,
    sc.chapter,
    sc.verse,
    sc.sanskrit AS original_text,
    sc.translation AS default_translation,
    sc.language,
    sc.script,
    sc.transliteration,
    COALESCE(pr.read_count, 0) AS times_read,
    COALESCE(pr.recitation_score, (0)::numeric) AS best_recitation,
    vm.certified
   FROM (((((public.pathshala_enrollments e
     JOIN public.pathshala_paths p ON ((p.id = e.path_id)))
     JOIN public.pathshala_path_chunks pc ON (((pc.path_id = e.path_id) AND (pc."position" = e.current_position))))
     JOIN public.scripture_chunks sc ON ((sc.id = pc.chunk_id)))
     LEFT JOIN public.pathshala_progress pr ON (((pr.user_id = e.user_id) AND (pr.chunk_id = pc.chunk_id) AND (pr.path_id = e.path_id))))
     LEFT JOIN public.pathshala_verse_mastery vm ON (((vm.user_id = e.user_id) AND (vm.chunk_id = pc.chunk_id))))
  WHERE ((e.paused = false) AND (e.completed_at IS NULL));


ALTER VIEW public.pathshala_today_lessons OWNER TO postgres;

--
-- Name: pathshala_translations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pathshala_translations (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    chunk_id uuid NOT NULL,
    language text NOT NULL,
    script text NOT NULL,
    translation text NOT NULL,
    transliteration text,
    translator text,
    is_ai_generated boolean DEFAULT false NOT NULL,
    verified boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.pathshala_translations OWNER TO postgres;

--
-- Name: pathshala_user_badges; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pathshala_user_badges (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    badge_id uuid NOT NULL,
    earned_at timestamp with time zone DEFAULT now() NOT NULL,
    context jsonb DEFAULT '{}'::jsonb
);


ALTER TABLE public.pathshala_user_badges OWNER TO postgres;

--
-- Name: pathshala_user_state; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pathshala_user_state (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    tradition text NOT NULL,
    section_id text NOT NULL,
    entry_id text NOT NULL,
    last_opened_at timestamp with time zone DEFAULT now() NOT NULL,
    bookmarked_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT pathshala_user_state_tradition_check CHECK ((tradition = ANY (ARRAY['hindu'::text, 'sikh'::text, 'buddhist'::text, 'jain'::text])))
);


ALTER TABLE public.pathshala_user_state OWNER TO postgres;

--
-- Name: post_comments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.post_comments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    post_id uuid NOT NULL,
    author_id uuid NOT NULL,
    body text NOT NULL,
    parent_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.post_comments OWNER TO postgres;

--
-- Name: post_upvotes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.post_upvotes (
    post_id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.post_upvotes OWNER TO postgres;

--
-- Name: posts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.posts (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    author_id uuid NOT NULL,
    mandali_id uuid,
    content text NOT NULL,
    type text DEFAULT 'update'::text,
    upvotes integer DEFAULT 0,
    comment_count integer DEFAULT 0,
    is_pinned boolean DEFAULT false,
    event_date timestamp with time zone,
    event_location text,
    CONSTRAINT posts_type_check CHECK ((type = ANY (ARRAY['update'::text, 'event'::text, 'question'::text, 'announcement'::text])))
);


ALTER TABLE public.posts OWNER TO postgres;

--
-- Name: profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    full_name text NOT NULL,
    username text NOT NULL,
    avatar_url text,
    bio text,
    city text,
    country text,
    latitude double precision,
    longitude double precision,
    sampradaya text,
    ishta_devata text,
    spiritual_level text DEFAULT 'jigyasu'::text,
    legacy_family_name text,
    gotra text,
    languages text[] DEFAULT ARRAY['en'::text],
    seeking text[] DEFAULT ARRAY[]::text[],
    seva_score integer DEFAULT 0,
    mandali_id uuid,
    kul_devata text,
    home_town text,
    shloka_streak integer DEFAULT 0,
    last_shloka_date date,
    onesignal_player_id text,
    country_code text,
    tradition text,
    custom_greeting text,
    kul_id uuid,
    neighbourhood text,
    looking_for_satsang boolean DEFAULT false NOT NULL,
    location_visible boolean DEFAULT false NOT NULL,
    timezone text,
    wants_festival_reminders boolean DEFAULT true NOT NULL,
    wants_shloka_reminders boolean DEFAULT true NOT NULL,
    wants_community_notifications boolean DEFAULT true NOT NULL,
    wants_family_notifications boolean DEFAULT true NOT NULL,
    notification_quiet_hours_start smallint,
    notification_quiet_hours_end smallint,
    app_language text DEFAULT 'en'::text NOT NULL,
    scripture_script text DEFAULT 'original'::text NOT NULL,
    show_transliteration boolean DEFAULT true NOT NULL,
    meaning_language text DEFAULT 'en'::text NOT NULL,
    is_pro boolean DEFAULT false NOT NULL,
    pro_activated_at timestamp with time zone,
    pro_note text,
    life_stage text,
    gender_context text,
    date_of_birth date,
    life_stage_locked boolean DEFAULT false NOT NULL,
    transliteration_language text DEFAULT 'en'::text NOT NULL,
    is_admin boolean DEFAULT false,
    is_banned boolean DEFAULT false,
    ban_reason text,
    karma_points integer DEFAULT 0 NOT NULL,
    is_founding_member boolean DEFAULT false NOT NULL,
    founding_number integer,
    active_symbol_id text,
    consent_religious_data boolean DEFAULT false NOT NULL,
    consent_updated_at timestamp with time zone,
    cover_url text,
    wants_nitya_reminders boolean DEFAULT true NOT NULL,
    subscription_status text DEFAULT 'free'::text NOT NULL,
    subscription_expires_at timestamp with time zone,
    entitlement_source text,
    entitlement_updated_at timestamp with time zone,
    show_sadhana_highlights boolean DEFAULT false NOT NULL,
    weekly_seva integer DEFAULT 0,
    monthly_seva integer DEFAULT 0,
    streak_freeze_count integer DEFAULT 0,
    last_freeze_used date,
    onboarding_completed boolean DEFAULT false,
    onboarding_goal text,
    japa_reminder_enabled boolean DEFAULT false,
    japa_reminder_time text DEFAULT '07:00'::text,
    marketing_consent boolean DEFAULT false,
    email_newsletter boolean DEFAULT false,
    whatsapp_updates boolean DEFAULT false,
    newsletter_frequency text DEFAULT 'weekly'::text,
    comm_prefs_set boolean DEFAULT false,
    email_festivals boolean DEFAULT true,
    unsubscribe_token text DEFAULT (gen_random_uuid())::text,
    quiz_reminder_enabled boolean DEFAULT false,
    quiz_reminder_time text DEFAULT '08:00'::text,
    nitya_reminder_enabled boolean DEFAULT false,
    nitya_reminder_time text DEFAULT '06:30'::text,
    CONSTRAINT profiles_gender_context_check CHECK ((gender_context = ANY (ARRAY['female'::text, 'general'::text]))),
    CONSTRAINT profiles_life_stage_check CHECK ((life_stage = ANY (ARRAY['brahmacharya'::text, 'grihastha'::text, 'vanaprastha'::text, 'sannyasa'::text]))),
    CONSTRAINT profiles_subscription_status_check CHECK ((subscription_status = ANY (ARRAY['free'::text, 'pro'::text, 'kul_pro'::text, 'grace'::text, 'expired'::text])))
);


ALTER TABLE public.profiles OWNER TO postgres;

--
-- Name: COLUMN profiles.is_pro; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.profiles.is_pro IS 'True when the user has an active Sangam Pro subscription or early access grant.';


--
-- Name: COLUMN profiles.pro_note; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.profiles.pro_note IS 'Free-text note for how Pro was granted (early_access, coupon code, payment reference, etc.)';


--
-- Name: COLUMN profiles.life_stage; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.profiles.life_stage IS 'User''s current Ashrama / life stage. Universal key regardless of tradition.
   brahmacharya = student (0-25), grihastha = householder (25-50),
   vanaprastha = forest dweller / elder (50-75), sannyasa = renunciate (75+).
   NULL means the user has not yet selected a stage (skip Ashrama section).';


--
-- Name: COLUMN profiles.gender_context; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.profiles.gender_context IS 'Practice path preference. female = Stridharma duties; general = default path. NULL = unset.';


--
-- Name: COLUMN profiles.transliteration_language; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.profiles.transliteration_language IS 'Preferred script for transliteration (en for Roman, hi for Devanagari)';


--
-- Name: COLUMN profiles.active_symbol_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.profiles.active_symbol_id IS 'The ID of the sacred symbol (relic) currently active for the user profile.';


--
-- Name: COLUMN profiles.consent_religious_data; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.profiles.consent_religious_data IS 'Explicit consent for processing religious/spiritual data (GDPR Art. 9)';


--
-- Name: COLUMN profiles.subscription_status; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.profiles.subscription_status IS 'Canonical server-side entitlement state. Replaces ad hoc is_pro-only gating for production billing.';


--
-- Name: COLUMN profiles.entitlement_source; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.profiles.entitlement_source IS 'Source of current entitlement truth, e.g. early_access, admin_grant, stripe:webhook, app_store, play_store.';


--
-- Name: COLUMN profiles.show_sadhana_highlights; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.profiles.show_sadhana_highlights IS 'When true, this user''s sadhana highlights (beads, streak, shields) are visible on their public profile.';


--
-- Name: push_subscriptions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.push_subscriptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    endpoint text NOT NULL,
    p256dh text NOT NULL,
    auth text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.push_subscriptions OWNER TO postgres;

--
-- Name: quiz_responses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.quiz_responses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    date date DEFAULT CURRENT_DATE NOT NULL,
    question text NOT NULL,
    chosen_index integer NOT NULL,
    correct_index integer NOT NULL,
    is_correct boolean NOT NULL,
    tradition text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    explanation text,
    daily_quiz_id uuid,
    streak_at_answer smallint
);


ALTER TABLE public.quiz_responses OWNER TO postgres;

--
-- Name: quiz_sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.quiz_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    tradition text NOT NULL,
    topic text NOT NULL,
    difficulty text NOT NULL,
    questions_total integer DEFAULT 5 NOT NULL,
    questions_correct integer DEFAULT 0 NOT NULL,
    karma_earned integer DEFAULT 0 NOT NULL,
    completed_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT quiz_sessions_difficulty_check CHECK ((difficulty = ANY (ARRAY['seeker'::text, 'gyani'::text, 'pandit'::text])))
);


ALTER TABLE public.quiz_sessions OWNER TO postgres;

--
-- Name: reading_progress; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reading_progress (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    text_id text NOT NULL,
    chapter integer NOT NULL,
    verse integer NOT NULL,
    completed boolean DEFAULT false,
    bookmarked boolean DEFAULT false,
    time_spent_s integer DEFAULT 0,
    read_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.reading_progress OWNER TO postgres;

--
-- Name: recommendations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.recommendations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    date date NOT NULL,
    type text NOT NULL,
    content jsonb NOT NULL,
    generated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.recommendations OWNER TO postgres;

--
-- Name: sankalpa; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sankalpa (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    type text NOT NULL,
    description text NOT NULL,
    target_days integer NOT NULL,
    target_count integer,
    mantra_id text,
    text_id text,
    started_at timestamp with time zone DEFAULT now(),
    current_streak integer DEFAULT 0,
    longest_streak integer DEFAULT 0,
    status text DEFAULT 'active'::text,
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.sankalpa OWNER TO postgres;

--
-- Name: sankalpa_checkins; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sankalpa_checkins (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    sankalpa_id uuid NOT NULL,
    checked_date date NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.sankalpa_checkins OWNER TO postgres;

--
-- Name: sankalpa_reflections; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sankalpa_reflections (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    sankalpa_id uuid NOT NULL,
    reflection_type text DEFAULT 'midpoint'::text NOT NULL,
    mood text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT sankalpa_reflections_mood_check CHECK ((mood = ANY (ARRAY['strong'::text, 'struggling'::text, 'grateful'::text])))
);


ALTER TABLE public.sankalpa_reflections OWNER TO postgres;

--
-- Name: sankalpas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sankalpas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    text text NOT NULL,
    tradition text DEFAULT 'hindu'::text NOT NULL,
    related_practice text,
    target_days integer DEFAULT 30 NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    completed_at timestamp with time zone,
    CONSTRAINT sankalpas_status_check CHECK ((status = ANY (ARRAY['active'::text, 'completed'::text, 'abandoned'::text])))
);


ALTER TABLE public.sankalpas OWNER TO postgres;

--
-- Name: sanskars; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sanskars (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    slug text NOT NULL,
    sequence_number integer NOT NULL,
    name text NOT NULL,
    name_sanskrit text,
    name_meaning text,
    life_stage text NOT NULL,
    typical_age text,
    significance text NOT NULL,
    presiding_deity text,
    key_mantras text[],
    samagri text[],
    vidhi_steps jsonb NOT NULL,
    duration_hours double precision,
    priest_required boolean DEFAULT true,
    can_self_perform boolean DEFAULT false,
    notes text,
    CONSTRAINT sanskars_life_stage_check CHECK ((life_stage = ANY (ARRAY['prenatal'::text, 'birth'::text, 'infancy'::text, 'childhood'::text, 'education'::text, 'adulthood'::text, 'marriage'::text, 'elder'::text, 'death'::text])))
);


ALTER TABLE public.sanskars OWNER TO postgres;

--
-- Name: sattvic_sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sattvic_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    mode text NOT NULL,
    duration_secs integer NOT NULL,
    environment text NOT NULL,
    mantra text,
    completed_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT sattvic_sessions_mode_check CHECK ((mode = ANY (ARRAY['breath'::text, 'chant'::text, 'reading'::text, 'silent'::text])))
);


ALTER TABLE public.sattvic_sessions OWNER TO postgres;

--
-- Name: seva_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.seva_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    seva_type text NOT NULL,
    note text,
    logged_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.seva_log OWNER TO postgres;

--
-- Name: seva_task_completions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.seva_task_completions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_id uuid NOT NULL,
    task_key text NOT NULL,
    points integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.seva_task_completions OWNER TO postgres;

--
-- Name: shlokas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.shlokas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    devanagari text NOT NULL,
    translation text,
    sync_metadata jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.shlokas OWNER TO postgres;

--
-- Name: thread_messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.thread_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    thread_id uuid NOT NULL,
    sender_id uuid,
    sender_name text,
    body text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    delivery_state text DEFAULT 'sent'::text NOT NULL
);


ALTER TABLE public.thread_messages OWNER TO postgres;

--
-- Name: thread_participants; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.thread_participants (
    thread_id uuid NOT NULL,
    user_id uuid NOT NULL,
    unread_count integer DEFAULT 0 NOT NULL,
    joined_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.thread_participants OWNER TO postgres;

--
-- Name: thread_reactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.thread_reactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    thread_id uuid NOT NULL,
    user_id uuid NOT NULL,
    reaction_type text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT thread_reactions_reaction_type_check CHECK ((reaction_type = ANY (ARRAY['pranam'::text, 'bhakti'::text, 'prakas'::text])))
);


ALTER TABLE public.thread_reactions OWNER TO postgres;

--
-- Name: thread_reaction_counts; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.thread_reaction_counts AS
 SELECT thread_id,
    reaction_type,
    count(*) AS count
   FROM public.thread_reactions
  GROUP BY thread_id, reaction_type;


ALTER VIEW public.thread_reaction_counts OWNER TO postgres;

--
-- Name: thread_upvotes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.thread_upvotes (
    thread_id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.thread_upvotes OWNER TO postgres;

--
-- Name: tirtha_checkins; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tirtha_checkins (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    place_id text NOT NULL,
    visited_at timestamp with time zone DEFAULT now() NOT NULL,
    privacy text DEFAULT 'private'::text NOT NULL,
    darshan_mood text,
    intention text,
    reflection text,
    companions text,
    family_member_ids uuid[] DEFAULT '{}'::uuid[] NOT NULL,
    pradakshina_count integer DEFAULT 0 NOT NULL,
    seva_note text,
    photo_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT tirtha_checkins_pradakshina_count_check CHECK ((pradakshina_count >= 0)),
    CONSTRAINT tirtha_checkins_privacy_check CHECK ((privacy = ANY (ARRAY['private'::text, 'family'::text, 'mandali'::text, 'public'::text])))
);


ALTER TABLE public.tirtha_checkins OWNER TO postgres;

--
-- Name: tirtha_collections; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tirtha_collections (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    slug text NOT NULL,
    title text NOT NULL,
    description text,
    tradition text DEFAULT 'all'::text NOT NULL,
    season_key text,
    place_ids text[] DEFAULT '{}'::text[] NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.tirtha_collections OWNER TO postgres;

--
-- Name: tirtha_place_media; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tirtha_place_media (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    place_id text NOT NULL,
    user_id uuid,
    media_url text NOT NULL,
    media_type text DEFAULT 'photo'::text NOT NULL,
    license text,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT tirtha_place_media_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])))
);


ALTER TABLE public.tirtha_place_media OWNER TO postgres;

--
-- Name: tirtha_place_notes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tirtha_place_notes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    place_id text NOT NULL,
    user_id uuid,
    note_type text DEFAULT 'practical'::text NOT NULL,
    body text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT tirtha_place_notes_note_type_check CHECK ((note_type = ANY (ARRAY['practical'::text, 'etiquette'::text, 'accessibility'::text, 'parking'::text, 'timing'::text, 'seva'::text, 'correction'::text]))),
    CONSTRAINT tirtha_place_notes_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])))
);


ALTER TABLE public.tirtha_place_notes OWNER TO postgres;

--
-- Name: tirtha_places; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tirtha_places (
    id text NOT NULL,
    source text DEFAULT 'overpass'::text NOT NULL,
    source_id text,
    name text NOT NULL,
    tradition text DEFAULT 'other'::text NOT NULL,
    lat double precision NOT NULL,
    lon double precision NOT NULL,
    address text,
    website text,
    phone text,
    opening_hours text,
    deity text,
    sampradaya text,
    source_confidence text DEFAULT 'community_import'::text NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.tirtha_places OWNER TO postgres;

--
-- Name: tirtha_reports; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tirtha_reports (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    place_id text,
    reason text NOT NULL,
    details text,
    status text DEFAULT 'open'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT tirtha_reports_reason_check CHECK ((reason = ANY (ARRAY['wrong_location'::text, 'closed'::text, 'duplicate'::text, 'tradition_mismatch'::text, 'inappropriate'::text, 'other'::text]))),
    CONSTRAINT tirtha_reports_status_check CHECK ((status = ANY (ARRAY['open'::text, 'reviewing'::text, 'resolved'::text, 'dismissed'::text])))
);


ALTER TABLE public.tirtha_reports OWNER TO postgres;

--
-- Name: tirtha_reviews; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tirtha_reviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_id uuid NOT NULL,
    place_id text NOT NULL,
    place_name text NOT NULL,
    rating integer NOT NULL,
    note text,
    lat double precision,
    lon double precision,
    CONSTRAINT tirtha_reviews_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


ALTER TABLE public.tirtha_reviews OWNER TO postgres;

--
-- Name: tirtha_saves; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tirtha_saves (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    place_id text NOT NULL,
    note text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.tirtha_saves OWNER TO postgres;

--
-- Name: tirtha_visits; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tirtha_visits (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    tirtha_id uuid NOT NULL,
    visited_at date NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.tirtha_visits OWNER TO postgres;

--
-- Name: tirthas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tirthas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    slug text NOT NULL,
    name text NOT NULL,
    name_sanskrit text,
    deity text,
    tradition text,
    tirtha_type text NOT NULL,
    series_name text,
    series_number integer,
    state text,
    country text DEFAULT 'India'::text,
    lat double precision,
    lng double precision,
    elevation_m integer,
    significance text,
    best_months text[],
    darshan_url text,
    tags text[],
    CONSTRAINT tirthas_tirtha_type_check CHECK ((tirtha_type = ANY (ARRAY['char_dham'::text, 'chota_char_dham'::text, 'jyotirlinga'::text, 'shakti_peeth'::text, 'divya_desam'::text, 'pancha_dwaraka'::text, 'kshetra'::text, 'river'::text, 'other'::text]))),
    CONSTRAINT tirthas_tradition_check CHECK ((tradition = ANY (ARRAY['vaishnav'::text, 'shaiv'::text, 'shakta'::text, 'smarta'::text, 'general'::text])))
);


ALTER TABLE public.tirthas OWNER TO postgres;

--
-- Name: user_blocked_profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_blocked_profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    blocker_id uuid NOT NULL,
    blocked_user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT user_blocked_profiles_no_self CHECK ((blocker_id <> blocked_user_id))
);


ALTER TABLE public.user_blocked_profiles OWNER TO postgres;

--
-- Name: user_hidden_content; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_hidden_content (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    content_type text NOT NULL,
    content_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT user_hidden_content_content_type_check CHECK ((content_type = ANY (ARRAY['mandali_post'::text, 'thread'::text, 'reply'::text])))
);


ALTER TABLE public.user_hidden_content OWNER TO postgres;

--
-- Name: user_mood_checkins; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_mood_checkins (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    before_mood text,
    after_mood text,
    completed_at timestamp with time zone,
    source_surface text,
    recommended_action_type text,
    recommended_action_target text,
    clicked_action text,
    completed_action text,
    reflection_note text,
    context_need text,
    context_time text,
    context_type text,
    dismissed boolean DEFAULT false NOT NULL,
    recommendations_shown jsonb,
    skipped_actions jsonb,
    session_status text DEFAULT 'open'::text,
    closed_at timestamp with time zone
);


ALTER TABLE public.user_mood_checkins OWNER TO postgres;

--
-- Name: user_muted_profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_muted_profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    muter_id uuid NOT NULL,
    muted_user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT user_muted_profiles_no_self CHECK ((muter_id <> muted_user_id))
);


ALTER TABLE public.user_muted_profiles OWNER TO postgres;

--
-- Name: user_sanskaras; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_sanskaras (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    sanskara_id text NOT NULL,
    completed_date date,
    notes text,
    performed_by text,
    location text,
    created_at timestamp with time zone DEFAULT now(),
    kul_member_id uuid,
    expected_date date
);


ALTER TABLE public.user_sanskaras OWNER TO postgres;

--
-- Name: user_sanskars; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_sanskars (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    sanskar_id uuid NOT NULL,
    beneficiary_name text,
    beneficiary_dob date,
    status text DEFAULT 'planned'::text,
    scheduled_date date,
    completed_date date,
    priest_name text,
    location text,
    notes text,
    family_members text[],
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT user_sanskars_status_check CHECK ((status = ANY (ARRAY['planned'::text, 'in_progress'::text, 'completed'::text])))
);


ALTER TABLE public.user_sanskars OWNER TO postgres;

--
-- Name: user_tirtha_progress; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.user_tirtha_progress WITH (security_invoker='true') AS
 SELECT p.id AS user_id,
    t.tirtha_type,
    t.series_name,
    count(DISTINCT t.id) AS total_in_series,
    count(DISTINCT tv.tirtha_id) AS visited,
    round((((count(DISTINCT tv.tirtha_id))::numeric / (NULLIF(count(DISTINCT t.id), 0))::numeric) * (100)::numeric), 1) AS pct_complete
   FROM (((public.profiles p
     CROSS JOIN ( SELECT DISTINCT tirthas.tirtha_type,
            tirthas.series_name
           FROM public.tirthas
          WHERE (tirthas.series_name IS NOT NULL)) s)
     JOIN public.tirthas t ON (((t.tirtha_type = s.tirtha_type) AND (t.series_name = s.series_name))))
     LEFT JOIN public.tirtha_visits tv ON (((tv.tirtha_id = t.id) AND (tv.user_id = p.id))))
  GROUP BY p.id, t.tirtha_type, t.series_name;


ALTER VIEW public.user_tirtha_progress OWNER TO postgres;

--
-- Name: user_warnings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_warnings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    admin_name text,
    reason text NOT NULL,
    admin_note text,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.user_warnings OWNER TO postgres;

--
-- Name: waitlist; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.waitlist (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    tradition text,
    name text,
    source text DEFAULT 'landing'::text,
    country_hint text,
    created_at timestamp with time zone DEFAULT now(),
    founding_number integer,
    timezone text,
    email_sent boolean DEFAULT false NOT NULL,
    CONSTRAINT waitlist_tradition_check CHECK ((tradition = ANY (ARRAY['hindu'::text, 'sikh'::text, 'buddhist'::text, 'jain'::text])))
);


ALTER TABLE public.waitlist OWNER TO postgres;

--
-- Name: waitlist_founding_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.waitlist_founding_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.waitlist_founding_seq OWNER TO postgres;

--
-- Name: waitlist_founding_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.waitlist_founding_seq OWNED BY public.waitlist.founding_number;


--
-- Name: yatra_plans; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.yatra_plans (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    tirtha_ids uuid[] NOT NULL,
    status text DEFAULT 'planned'::text,
    target_date date,
    started_at date,
    completed_at date,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT yatra_plans_status_check CHECK ((status = ANY (ARRAY['planned'::text, 'in_progress'::text, 'completed'::text, 'cancelled'::text])))
);


ALTER TABLE public.yatra_plans OWNER TO postgres;

--
-- Name: messages; Type: TABLE; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE TABLE realtime.messages (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
)
PARTITION BY RANGE (inserted_at);


ALTER TABLE realtime.messages OWNER TO supabase_realtime_admin;

--
-- Name: messages_2026_05_30; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

CREATE TABLE realtime.messages_2026_05_30 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


ALTER TABLE realtime.messages_2026_05_30 OWNER TO supabase_admin;

--
-- Name: messages_2026_05_31; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

CREATE TABLE realtime.messages_2026_05_31 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


ALTER TABLE realtime.messages_2026_05_31 OWNER TO supabase_admin;

--
-- Name: messages_2026_06_01; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

CREATE TABLE realtime.messages_2026_06_01 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


ALTER TABLE realtime.messages_2026_06_01 OWNER TO supabase_admin;

--
-- Name: messages_2026_06_02; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

CREATE TABLE realtime.messages_2026_06_02 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


ALTER TABLE realtime.messages_2026_06_02 OWNER TO supabase_admin;

--
-- Name: messages_2026_06_03; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

CREATE TABLE realtime.messages_2026_06_03 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
