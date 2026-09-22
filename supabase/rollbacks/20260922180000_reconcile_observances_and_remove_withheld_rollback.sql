-- Rollback for 20260922180000_reconcile_observances_and_remove_withheld.sql
begin;

-- Revert 1: Restore Karva Chauth and Ram Navami to published if they were previously published
update public.observance_occurrences
set publication_status = 'published'
where id in ('b14f99cf-4390-45ac-a228-9cf64b7c46c7', '80620335-a61d-47b3-9503-b19579aa8ada');

-- Revert 2: Restore Hartalika Teej to withheld
update public.observance_occurrences
set
  date = '2026-09-02',
  occurrence_date = '2026-09-02',
  manual_date_override = '2026-09-02',
  publication_status = 'withheld_disputed'
where id = '656c0ef7-527f-4eeb-b5fd-dbbb5b4e1868';

-- Revert 3: Re-withhold the 18 restored definitions
update public.observance_occurrences oo
set publication_status = 'withheld_disputed'
from public.observance_definitions od
where oo.definition_id = od.id
  and od.slug in (
    'narasimha-jayanti', 'vat-savitri-amavasya', 'shani-jayanti', 'nag-panchami',
    'yogini-ekadashi', 'vat-savitri-purnima', 'sankashti-chaturthi', 'vinayaka-chaturthi',
    'gupt-navratri-ashadha-begins', 'gupt-navratri-magha-begins', 'chintpurni-mata-chaitra-navratri',
    'chintpurni-mata-sharad-navratri', 'vivah-panchami', 'guru-amar-das-gurpurab',
    'shravan-somvar', 'mangala-gauri-vrat', 'mahalaya-amavasya'
  )
  and oo.year = 2026;

-- Revert 4: Delete the 29 newly inserted 2026 occurrences
delete from public.observance_occurrences oo
using public.observance_definitions od
where oo.definition_id = od.id
  and od.slug in (
    'akshaya-tritiya', 'akshaya-tritiya-jain', 'gudi-padwa', 'ugadi', 'vasant-panchami',
    'hanuman-jayanti', 'jagannath-rath-yatra', 'kartik-purnima', 'kartik-purnima-jain',
    'gita-jayanti', 'vaikunta-ekadashi', 'onam', 'jain-diwali-nirvana-ladnun',
    'jain-new-year-pratipada', 'das-lakshana-dharma-begins', 'guru-har-krishan-gurpurab',
    'guru-ram-das-gurpurab', 'bodhi-day', 'parinirvana-day', 'magha-puja',
    'vesak-buddha-purnima', 'asalha-puja', 'vassa-begins-rains-retreat',
    'ullambana-ancestor-day', 'pavarana-end-of-vassa', 'kathina',
    'sangha-day-loy-krathong', 'losar-tibetan-new-year', 'saphala-ekadashi'
  )
  and oo.year = 2026
  and oo.review_notes like '%council:2026-coverage-completion-v1%';

commit;
