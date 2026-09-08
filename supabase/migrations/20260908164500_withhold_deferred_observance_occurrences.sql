-- Withhold app-facing occurrence rows for rules that are still launch_status: deferred.
--
-- This removes ambiguity from Home/Sacred Days/calendar/notification surfaces
-- without deleting canonical rule definitions or historical audit material.
-- Deferred rules remain in rules.json as roadmap/governance candidates, but any
-- previously materialized legacy rows are no longer publication_status='published'.

with deferred_slugs(slug) as (
  values
    ('akshaya-tritiya'),
    ('akshaya-tritiya-jain'),
    ('asalha-puja'),
    ('bodhi-day'),
    ('chaitra-navratri-begins'),
    ('chhath-puja'),
    ('chintpurni-mata-chaitra-navratri'),
    ('chintpurni-mata-sharad-navratri'),
    ('das-lakshana-dharma-begins'),
    ('gita-jayanti'),
    ('gudi-padwa'),
    ('gupt-navratri-ashadha-begins'),
    ('gupt-navratri-magha-begins'),
    ('guru-amar-das-gurpurab'),
    ('guru-har-krishan-gurpurab'),
    ('guru-ram-das-gurpurab'),
    ('hanuman-jayanti'),
    ('hartalika-teej'),
    ('jagannath-rath-yatra'),
    ('jain-diwali-nirvana-ladnun'),
    ('jain-new-year-pratipada'),
    ('kartik-purnima'),
    ('kartik-purnima-jain'),
    ('kathina'),
    ('losar-tibetan-new-year'),
    ('magha-puja'),
    ('mahalaya-amavasya'),
    ('mangala-gauri-vrat'),
    ('nag-panchami'),
    ('narasimha-jayanti'),
    ('onam'),
    ('parinirvana-day'),
    ('pavarana-end-of-vassa'),
    ('sangha-day-loy-krathong'),
    ('sankashti-chaturthi'),
    ('shani-jayanti'),
    ('shravan-somvar'),
    ('ugadi'),
    ('ullambana-ancestor-day'),
    ('vaikunta-ekadashi'),
    ('vasant-panchami'),
    ('vassa-begins-rains-retreat'),
    ('vat-savitri-amavasya'),
    ('vat-savitri-purnima'),
    ('vesak-buddha-purnima'),
    ('vinayaka-chaturthi'),
    ('vivah-panchami'),
    ('yogini-ekadashi')
)
update public.observance_occurrences oo
set
  publication_status = 'withheld_disputed',
  audit_status = 'completed',
  audit_failure_reason = 'Rule is launch_status: deferred in canonical rules.json; withholding from app-facing surfaces until reviewed for launch.',
  review_status = case when oo.review_status = 'reviewed' then oo.review_status else 'needs_review' end,
  verification_status = case when oo.verification_status = 'verified' then oo.verification_status else 'not_checked' end,
  review_notes = concat_ws(E'\n', nullif(oo.review_notes, ''), 'Withheld by 20260908164500_withhold_deferred_observance_occurrences: deferred canonical rule should not appear in app.'),
  updated_at = now()
from public.observance_definitions od
join deferred_slugs ds on ds.slug = od.slug
where oo.definition_id = od.id
  and oo.publication_status = 'published';
