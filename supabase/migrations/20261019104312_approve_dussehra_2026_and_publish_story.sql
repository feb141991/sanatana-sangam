-- Founder-directed approval for the mainstream 2026 Vijayadashami date and
-- publication of the source-linked multilingual story card.
-- The Bengal/ Kerala regional observance remains on October 21.
begin;

do $$
declare
  v_definition_id uuid;
  v_story_id uuid;
  v_source_drik uuid;
  v_source_ramayana uuid;
  v_source_devi uuid;
  v_updated jsonb;
  v_regional jsonb;
  v_actor text := 'Founder authorization (Prince Sharma), 2026-10-19';
begin
  select id into strict v_definition_id
  from public.observance_definitions
  where slug = 'dussehra';

  -- Keep the approved Ujjain/mainstream date for other locations, while
  -- retaining the source-backed Bengal/Kerala regional date on Oct 21.
  with targets as materialized (
    select id, to_jsonb(o) as old_row
    from public.observance_occurrences o
    where definition_id = v_definition_id
      and year = 2026
      and publication_status = 'published'
      and date = date '2026-10-21'
      and not (
        (computed_latitude between 21.4 and 27.5 and computed_longitude between 85.5 and 89.9)
        or (computed_latitude between 8.0 and 12.9 and computed_longitude between 74.5 and 77.8)
      )
  ), updated as (
    update public.observance_occurrences o
    set date = date '2026-10-20',
        occurrence_date = date '2026-10-20',
        manual_date_override = date '2026-10-20',
        manual_override_reason = 'Founder-approved mainstream Vijayadashami date from Drik Panchang Ujjain 2026 and Rashtriya Panchang Saka 1948 Index #50; Bengal/Kerala regional observance remains Oct 21.',
        locked_for_regeneration = true,
        final_date_source = 'manual_override',
        review_status = 'reviewed',
        verification_status = 'verified',
        verification_confidence = 'high',
        verification_note = 'Mainstream Vijayadashami 2026: October 20. Drik Panchang Ujjain lists Vijay Muhurat on Oct 20 and separately lists Bengal Vijayadashami on Oct 21. Region-scoped exception retained for Bengal/Kerala.',
        audit_status = 'completed',
        source_provenance = coalesce(o.source_provenance, '{}'::jsonb) || jsonb_build_object(
          'source_kind', 'curated',
          'source_name', 'Drik Panchang Ujjain 2026 / Rashtriya Panchang Saka 1948 Index #50',
          'source_migration', '20261019104312_approve_dussehra_2026_and_publish_story',
          'source_note', 'Mainstream 2026 date approved as Oct 20. Bengal/Kerala regional observance remains Oct 21.'
        ),
        reviewed_at = now(),
        verification_run_at = now(),
        last_audited_at = now(),
        review_notes = 'Date approved by founder request on 2026-10-19. The mainstream date is Oct 20; Bengal/Kerala regional observance is kept distinct on Oct 21.',
        updated_at = now()
    from targets t
    where o.id = t.id
    returning o.id
  )
  select coalesce(jsonb_agg(t.old_row), '[]'::jsonb) into v_updated from targets t;

  if jsonb_array_length(v_updated) = 0 then
    raise exception 'No eligible published Dussehra 2026 rows were found for the Oct 20 approval';
  end if;

  -- Protect the separately sourced Bengal/Kerala date from the new
  -- Aparahna-based mainstream selector.
  with targets as materialized (
    select id, to_jsonb(o) as old_row
    from public.observance_occurrences o
    where definition_id = v_definition_id
      and year = 2026
      and publication_status = 'published'
      and date = date '2026-10-21'
      and (
        (computed_latitude between 21.4 and 27.5 and computed_longitude between 85.5 and 89.9)
        or (computed_latitude between 8.0 and 12.9 and computed_longitude between 74.5 and 77.8)
      )
  ), updated as (
    update public.observance_occurrences o
    set manual_date_override = date '2026-10-21',
        manual_override_reason = 'Founder-ratified Bengal/Kerala Vijayadashami regional date retained from Rashtriya Panchang Saka 1948 Index #51.',
        locked_for_regeneration = true,
        final_date_source = 'manual_override',
        review_status = 'reviewed',
        verification_status = 'verified',
        verification_confidence = 'high',
        verification_note = 'Regional Bengal/Kerala Vijayadashami 2026 date retained as Oct 21 per Rashtriya Panchang Saka 1948 Index #51 and Drik Panchang regional listing.',
        audit_status = 'completed',
        source_provenance = coalesce(o.source_provenance, '{}'::jsonb) || jsonb_build_object(
          'source_kind', 'curated',
          'source_name', 'Rashtriya Panchang Saka 1948 Index #51',
          'source_migration', '20261019104312_approve_dussehra_2026_and_publish_story',
          'source_note', 'Region-scoped Bengal/Kerala Vijayadashami date: 2026-10-21.'
        ),
        reviewed_at = now(),
        verification_run_at = now(),
        last_audited_at = now(),
        review_notes = 'Preserved as the distinct Bengal/Kerala regional Vijayadashami date; not a duplicate of the mainstream Oct 20 observance.',
        updated_at = now()
    from targets t
    where o.id = t.id
    returning o.id
  )
  select coalesce(jsonb_agg(t.old_row), '[]'::jsonb) into v_regional from targets t;

  insert into public.observance_content_audit_log(action, entity_type, entity_id, actor, detail)
  values ('approve_2026_mainstream_date', 'observance_occurrence', v_definition_id::text, v_actor,
    jsonb_build_object('migration', '20261019104312_approve_dussehra_2026_and_publish_story',
      'updated_count', jsonb_array_length(v_updated) + jsonb_array_length(v_regional),
      'mainstream_previous_rows', v_updated, 'regional_previous_rows', v_regional,
      'approved_date', '2026-10-20', 'regional_exception', 'Bengal/Kerala 2026-10-21'));

  insert into public.observance_content_sources(
    definition_id, title, author, source_url, citation, source_tier, rights_status,
    excerpt, language, approved, reviewed_by, reviewed_at
  ) values (
    v_definition_id,
    '2026 Vijayadashami date and puja time for Ujjain',
    'Drik Panchang',
    'https://www.drikpanchang.com/festivals/vijayadashami/vijayadashami-date-time.html?geoname-id=1253914',
    '2026 Vijayadashami for Ujjain; Vijay Muhurat Oct 20; Bengal Vijayadashami separately Oct 21',
    1, 'citation_only',
    'Ujjain: Vijayadashami is October 20, 2026; Bengal Vijayadashami is separately listed on October 21.',
    'en', true, v_actor, now()
  ) on conflict (definition_id, source_url, citation) do update set
    approved = true, reviewed_by = excluded.reviewed_by, reviewed_at = excluded.reviewed_at,
    updated_at = now()
  returning id into v_source_drik;

  insert into public.observance_content_sources(
    definition_id, title, author, source_url, citation, source_tier, rights_status,
    excerpt, language, approved, reviewed_by, reviewed_at
  ) values (
    v_definition_id, 'Valmiki Ramayana, Yuddha Kanda', 'Valmiki',
    'https://sanskritdocuments.org/sites/valmikiramayan/yuddha/sarga108/yuddha_108_prose.htm',
    'Yuddha Kanda, Sargas 107–108: Rama and Ravana’s battle and its conclusion',
    1, 'citation_only',
    'The cited sargas narrate the conclusion of Rama and Ravana’s battle.',
    'en', true, v_actor, now()
  ) on conflict (definition_id, source_url, citation) do update set
    approved = true, reviewed_by = excluded.reviewed_by, reviewed_at = excluded.reviewed_at,
    updated_at = now()
  returning id into v_source_ramayana;

  insert into public.observance_content_sources(
    definition_id, title, author, source_url, citation, source_tier, rights_status,
    excerpt, language, approved, reviewed_by, reviewed_at
  ) values (
    v_definition_id, 'Devi Mahatmya, Chapter 3: Slaying of Mahishasura', 'Markandeya Purana',
    'https://devimahatmyam.aurobharati.in/devimahatmyam/episode-2/chapter-3/',
    'Devi Mahatmya, Chapter 3: Mahishasura Mardini episode',
    1, 'citation_only',
    'The cited chapter narrates Devi’s battle with and victory over Mahishasura.',
    'en', true, v_actor, now()
  ) on conflict (definition_id, source_url, citation) do update set
    approved = true, reviewed_by = excluded.reviewed_by, reviewed_at = excluded.reviewed_at,
    updated_at = now()
  returning id into v_source_devi;

  insert into public.observance_story_versions(
    definition_id, version, status, review_notes, reviewed_by, reviewed_at,
    published_at, generation_metadata
  ) values (
    v_definition_id, 2, 'published',
    'Founder explicitly requested approval of the Oct 20 date and publication of a detailed story card on 2026-10-19. This source-linked copy distinguishes Ramayana and Shakta traditions and labels regional customs; no claim of scholarly review is made.',
    v_actor, now(), now(),
    jsonb_build_object('authoring', 'assistant-authored from cited sources', 'publication_authorization', 'founder request 2026-10-19', 'regional_scope', 'tradition-aware; no universal ritual claim')
  ) on conflict (definition_id, version) do update set
    status = excluded.status, review_notes = excluded.review_notes,
    reviewed_by = excluded.reviewed_by, reviewed_at = excluded.reviewed_at,
    published_at = excluded.published_at, generation_metadata = excluded.generation_metadata,
    updated_at = now()
  returning id into v_story_id;

  insert into public.observance_story_source_links(story_version_id, source_id, supported_sections)
  values
    (v_story_id, v_source_drik, array['date', 'rituals']),
    (v_story_id, v_source_ramayana, array['origin', 'significance']),
    (v_story_id, v_source_devi, array['origin', 'significance'])
  on conflict (story_version_id, source_id) do update
    set supported_sections = excluded.supported_sections;

  insert into public.observance_story_translations(
    story_version_id, language, teaser, origin, significance, rituals,
    verse, personal_practice, review_status, reviewed_by, reviewed_at
  ) values
  (
    v_story_id, 'en',
    'A day of victory remembered through distinct Ramayana and Shakta traditions.',
    'Vijayadashami joins vijaya (victory) with dashami (the tenth lunar day). In Ramayana traditions, it recalls Rama’s victory over Ravana. In Shakta traditions, it belongs to the Navaratri cycle honouring Devi’s victory over Mahishasura. These are related traditions, not a claim that every community tells one identical story.',
    'The observance turns victory into a reflection on how courage can serve dharma. The Valmiki Ramayana’s Yuddha Kanda tells of Rama and Ravana’s final battle; the Devi Mahatmya recounts Devi’s victory over Mahishasura. Communities hold these stories in different ways and follow regional calendars and customs. For Ujjain in 2026, Drik Panchang gives Vijayadashami as October 20, while listing Bengal Vijayadashami separately on October 21.',
    '["Some traditions observe Aparajita Puja or Shami Puja during Aparahna.", "Seema Avalanghana is observed in some regional traditions.", "Durga Visarjan and Sindoor Khela belong to particular Durga Puja traditions.", "Ramlila and Ravana effigy-burning are local community customs; they are not universal requirements."]'::jsonb,
    null,
    'Pause to name one difficulty that calls for courage, one impulse that calls for restraint, and one just action you can take today. Follow the practice of your family and tradition; participation in any ritual is optional.',
    'approved', v_actor, now()
  ),
  (
    v_story_id, 'hi',
    'रामायण और शाक्त परंपराओं में अलग-अलग रूप से स्मरण किया जाने वाला विजय का दिन।',
    'विजयादशमी नाम विजय और दशमी—चंद्र मास के दसवें दिन—से जुड़ा है। रामायण परंपराओं में यह रावण पर श्रीराम की विजय का स्मरण है। शाक्त परंपराओं में यह नवरात्रि के उस क्रम से जुड़ा है जो महिषासुर पर देवी की विजय का सम्मान करता है। ये संबंधित परंपराएँ हैं; इसका अर्थ यह नहीं कि हर समुदाय एक ही कथा सुनाता है।',
    'यह पर्व विजय को धर्म के लिए प्रयुक्त साहस पर चिंतन में बदल देता है। वाल्मीकि रामायण का युद्धकाण्ड श्रीराम और रावण के अंतिम युद्ध का वर्णन करता है; देवीमाहात्म्य महिषासुर पर देवी की विजय का आख्यान प्रस्तुत करता है। समुदाय इन कथाओं और क्षेत्रीय रीति-रिवाजों को अपने-अपने ढंग से निभाते हैं। उज्जैन के लिए 2026 में Drik Panchang विजयादशमी 20 अक्टूबर बताता है और बंगाल की विजयादशमी 21 अक्टूबर अलग से सूचीबद्ध करता है।',
    '["कुछ परंपराओं में अपराह्ण के समय अपराजिता पूजा या शमी पूजा होती है।", "कुछ क्षेत्रीय परंपराओं में सीमोल्लंघन किया जाता है।", "दुर्गा विसर्जन और सिंदूर खेला विशिष्ट दुर्गा पूजा परंपराओं से जुड़े हैं।", "रामलीला और रावण-दहन स्थानीय सामुदायिक आयोजन हैं; ये सभी के लिए अनिवार्य रीति नहीं हैं।"]'::jsonb,
    null,
    'आज एक ऐसी कठिनाई पहचानें जिसमें साहस चाहिए, एक ऐसी प्रतिक्रिया जिसे संयम चाहिए, और एक न्यायपूर्ण कदम जिसे आप उठा सकते हैं। अपनी पारिवारिक और परंपरागत रीति का सम्मान करें; किसी भी अनुष्ठान में भाग लेना वैकल्पिक है।',
    'approved', v_actor, now()
  ),
  (
    v_story_id, 'pa',
    'ਜਿੱਤ ਦਾ ਦਿਨ, ਜਿਸ ਨੂੰ ਰਾਮਾਇਣ ਅਤੇ ਸ਼ਾਕਤ ਪਰੰਪਰਾਵਾਂ ਵੱਖ-ਵੱਖ ਢੰਗ ਨਾਲ ਯਾਦ ਕਰਦੀਆਂ ਹਨ।',
    'ਵਿਜਯਾਦਸ਼ਮੀ ਦਾ ਨਾਮ ਵਿਜੈ ਅਤੇ ਦਸਮੀ—ਚੰਦਰ ਮਹੀਨੇ ਦੇ ਦਸਵੇਂ ਦਿਨ—ਨਾਲ ਜੁੜਿਆ ਹੈ। ਰਾਮਾਇਣ ਦੀਆਂ ਪਰੰਪਰਾਵਾਂ ਵਿੱਚ ਇਹ ਰਾਵਣ ਉੱਤੇ ਸ੍ਰੀ ਰਾਮ ਦੀ ਜਿੱਤ ਨੂੰ ਯਾਦ ਕਰਦਾ ਹੈ। ਸ਼ਾਕਤ ਪਰੰਪਰਾਵਾਂ ਵਿੱਚ ਇਹ ਨਵਰਾਤਰੀ ਦੇ ਉਸ ਕ੍ਰਮ ਨਾਲ ਜੁੜਿਆ ਹੈ ਜੋ ਮਹਿਸ਼ਾਸੁਰ ਉੱਤੇ ਦੇਵੀ ਦੀ ਜਿੱਤ ਦਾ ਸਤਿਕਾਰ ਕਰਦਾ ਹੈ। ਇਹ ਸੰਬੰਧਿਤ ਪਰੰਪਰਾਵਾਂ ਹਨ; ਇਸ ਦਾ ਮਤਲਬ ਨਹੀਂ ਕਿ ਹਰ ਭਾਈਚਾਰਾ ਇੱਕੋ ਕਥਾ ਸੁਣਾਉਂਦਾ ਹੈ।',
    'ਇਹ ਤਿਉਹਾਰ ਜਿੱਤ ਨੂੰ ਧਰਮ ਦੀ ਸੇਵਾ ਵਿੱਚ ਵਰਤੇ ਹੌਸਲੇ ਬਾਰੇ ਸੋਚਣ ਦਾ ਮੌਕਾ ਬਣਾਉਂਦਾ ਹੈ। ਵਾਲਮੀਕੀ ਰਾਮਾਇਣ ਦਾ ਯੁੱਧ ਕਾਂਡ ਸ੍ਰੀ ਰਾਮ ਅਤੇ ਰਾਵਣ ਦੇ ਅੰਤਿਮ ਯੁੱਧ ਦਾ ਵਰਣਨ ਕਰਦਾ ਹੈ; ਦੇਵੀ ਮਹਾਤਮਯ ਮਹਿਸ਼ਾਸੁਰ ਉੱਤੇ ਦੇਵੀ ਦੀ ਜਿੱਤ ਦਾ ਪ੍ਰਸੰਗ ਦੱਸਦਾ ਹੈ। ਭਾਈਚਾਰੇ ਇਨ੍ਹਾਂ ਕਥਾਵਾਂ ਅਤੇ ਖੇਤਰੀ ਰਸਮਾਂ ਨੂੰ ਆਪਣੇ ਢੰਗ ਨਾਲ ਨਿਭਾਉਂਦੇ ਹਨ। ਉੱਜੈਨ ਲਈ 2026 ਵਿੱਚ Drik Panchang ਵਿਜਯਾਦਸ਼ਮੀ 20 ਅਕਤੂਬਰ ਦੱਸਦਾ ਹੈ ਅਤੇ ਬੰਗਾਲ ਦੀ ਵਿਜਯਾਦਸ਼ਮੀ 21 ਅਕਤੂਬਰ ਵੱਖਰੇ ਤੌਰ ਤੇ ਦਰਜ ਕਰਦਾ ਹੈ।',
    '["ਕੁਝ ਪਰੰਪਰਾਵਾਂ ਵਿੱਚ ਅਪਰਾਹਨ ਵੇਲੇ ਅਪਰਾਜਿਤਾ ਪੂਜਾ ਜਾਂ ਸ਼ਮੀ ਪੂਜਾ ਕੀਤੀ ਜਾਂਦੀ ਹੈ।", "ਕੁਝ ਖੇਤਰੀ ਪਰੰਪਰਾਵਾਂ ਵਿੱਚ ਸੀਮੋਲੰਘਨ ਹੁੰਦਾ ਹੈ।", "ਦੁਰਗਾ ਵਿਸਰਜਨ ਅਤੇ ਸਿੰਦੂਰ ਖੇਲਾ ਖ਼ਾਸ ਦੁਰਗਾ ਪੂਜਾ ਪਰੰਪਰਾਵਾਂ ਨਾਲ ਜੁੜੇ ਹਨ।", "ਰਾਮਲੀਲਾ ਅਤੇ ਰਾਵਣ ਦਹਿਨ ਸਥਾਨਕ ਭਾਈਚਾਰਕ ਸਮਾਗਮ ਹਨ; ਇਹ ਸਭ ਲਈ ਲਾਜ਼ਮੀ ਰੀਤਾਂ ਨਹੀਂ ਹਨ।"]'::jsonb,
    null,
    'ਅੱਜ ਇੱਕ ਅਜਿਹੀ ਔਖਾਈ ਪਛਾਣੋ ਜਿਸ ਲਈ ਹੌਸਲਾ ਚਾਹੀਦਾ ਹੈ, ਇੱਕ ਅਜਿਹੀ ਪ੍ਰਤੀਕਿਰਿਆ ਜਿਸ ਲਈ ਸੰਜਮ ਚਾਹੀਦਾ ਹੈ, ਅਤੇ ਇੱਕ ਨਿਆਂਪੂਰਨ ਕਦਮ ਜੋ ਤੁਸੀਂ ਚੁੱਕ ਸਕਦੇ ਹੋ। ਆਪਣੇ ਪਰਿਵਾਰ ਅਤੇ ਪਰੰਪਰਾ ਦੀ ਰੀਤ ਦਾ ਆਦਰ ਕਰੋ; ਕਿਸੇ ਵੀ ਰਸਮ ਵਿੱਚ ਸ਼ਾਮਲ ਹੋਣਾ ਵਿਕਲਪਿਕ ਹੈ।',
    'approved', v_actor, now()
  ) on conflict (story_version_id, language) do update set
    teaser = excluded.teaser, origin = excluded.origin, significance = excluded.significance,
    rituals = excluded.rituals, verse = excluded.verse,
    personal_practice = excluded.personal_practice,
    review_status = excluded.review_status, reviewed_by = excluded.reviewed_by,
    reviewed_at = excluded.reviewed_at, updated_at = now();

  insert into public.observance_share_templates(
    definition_id, story_version_id, version, language, audience, cta, title,
    message, review_status, reviewed_by, reviewed_at
  ) values
    (v_definition_id, v_story_id, 1, 'en', 'neutral', 'Read the story in Shoonaya', 'Vijayadashami · Find your infinite', 'A day of victory remembered through distinct Ramayana and Shakta traditions. Explore its meaning and regional customs in Shoonaya.', 'approved', v_actor, now()),
    (v_definition_id, v_story_id, 1, 'hi', 'neutral', 'Shoonaya में कथा पढ़ें', 'विजयादशमी · अपना अनंत खोजें', 'रामायण और शाक्त परंपराओं में विजय का स्मरण। Shoonaya में इसका अर्थ और क्षेत्रीय रीति-रिवाज जानें।', 'approved', v_actor, now()),
    (v_definition_id, v_story_id, 1, 'pa', 'neutral', 'Shoonaya ਵਿੱਚ ਕਥਾ ਪੜ੍ਹੋ', 'ਵਿਜਯਾਦਸ਼ਮੀ · ਆਪਣਾ ਅਨੰਤ ਲੱਭੋ', 'ਰਾਮਾਇਣ ਅਤੇ ਸ਼ਾਕਤ ਪਰੰਪਰਾਵਾਂ ਵਿੱਚ ਜਿੱਤ ਦਾ ਸਿਮਰਨ। Shoonaya ਵਿੱਚ ਇਸਦਾ ਅਰਥ ਅਤੇ ਖੇਤਰੀ ਰਸਮਾਂ ਜਾਣੋ।', 'approved', v_actor, now())
  on conflict (story_version_id, language, audience) do update set
    cta = excluded.cta, title = excluded.title, message = excluded.message,
    review_status = excluded.review_status, reviewed_by = excluded.reviewed_by,
    reviewed_at = excluded.reviewed_at, updated_at = now();

  if not exists (
    select 1 from public.observance_story_translations
    where story_version_id = v_story_id and review_status = 'approved'
    group by story_version_id having count(distinct language) = 3
  ) then
    raise exception 'Dussehra story is missing an approved en/hi/pa translation';
  end if;
end $$;

commit;
