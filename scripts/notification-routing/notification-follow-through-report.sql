-- Follow-through report: after we SENT a push of a type, did the person do the matching practice that same local day?
-- Read-only. Needs no new consent and no tap data: it joins our own send log to the practice record the app already keeps
-- (daily_sadhana flags, completed mood check-ins). Output is aggregate only: no user id, no notification id.
-- Types with fewer than :min_accounts accounts sent to are hidden (default 5; see docs/notifications/NOTIFICATION_TAP_TRACKING.md section 5).
--
-- HOW TO READ IT (state these whenever a number is quoted):
--  * Correlation, not effect. A person who gets a Japa push and then does Japa may have done it anyway. The comparison column is the
--    same accounts on window days where no push of that type was sent; the gap is a description, not proof the push worked.
--  * "Same local day" uses the profile timezone and the day's flag, not the minute; it cannot say the push came first.
--  * Only pushes with status 'sent' are counted; a sent push is not proof it was shown (README: section 6 of AGENTS.md).
--  * At about 24 reachable accounts a rate is a description. Quote the account count next to every rate.
-- Usage: psql -v days=14 -v min_accounts=5 -f notification-follow-through-report.sql
\set days 14
\set min_accounts 5
with params as (select :days::int as days, :min_accounts::int as min_accounts),
map(push_type, outcome) as (values
  ('japa','japa_done'), ('quiz','quiz_done'), ('shloka','shloka_done'), ('nitya','nitya_done'),
  ('mood_checkin','mood_done'), ('mood','mood_done'), ('sattvic_reminder','any_practice')),
sends as (
  select distinct d.user_id, m.push_type, m.outcome,
         (d.created_at at time zone coalesce(nullif(p.timezone, ''), 'UTC'))::date as local_day
  from public.notification_deliveries d
  join map m on m.push_type = d.type
  join public.profiles p on p.id = d.user_id
  cross join params
  where d.channel = 'push' and d.status = 'sent' and coalesce(d.dry_run, false) = false
    and d.created_at >= now() - make_interval(days => params.days)
),
accounts as (select distinct user_id, push_type, outcome from sends),
days as (
  select a.user_id, a.push_type, a.outcome, g::date as local_day
  from accounts a cross join params
  cross join generate_series((now() - make_interval(days => params.days))::date, (now() - interval '1 day')::date, interval '1 day') g
),
done as (
  select dd.user_id, dd.push_type, dd.local_day,
         (s.user_id is not null) as sent_that_day,
         case dd.outcome
           when 'japa_done' then coalesce(ds.japa_done, false)
           when 'quiz_done' then coalesce(ds.quiz_done, false)
           when 'shloka_done' then coalesce(ds.shloka_done, false)
           when 'nitya_done' then coalesce(ds.nitya_done, false)
           when 'any_practice' then coalesce(ds.any_practice, false)
           when 'mood_done' then exists (
             select 1 from public.user_mood_checkins c join public.profiles p2 on p2.id = c.user_id
             where c.user_id = dd.user_id and c.completed_at is not null
               and (c.completed_at at time zone coalesce(nullif(p2.timezone, ''), 'UTC'))::date = dd.local_day)
         end as did_it
  from days dd
  left join sends s on s.user_id = dd.user_id and s.push_type = dd.push_type and s.local_day = dd.local_day
  left join public.daily_sadhana ds on ds.user_id = dd.user_id and ds.date = dd.local_day
)
select push_type,
       count(distinct user_id) as accounts,
       count(*) filter (where sent_that_day) as push_days,
       round(100.0 * count(*) filter (where sent_that_day and did_it) / nullif(count(*) filter (where sent_that_day), 0), 1) as pct_did_it_on_push_days,
       count(*) filter (where not sent_that_day) as no_push_days,
       round(100.0 * count(*) filter (where not sent_that_day and did_it) / nullif(count(*) filter (where not sent_that_day), 0), 1) as pct_did_it_on_other_days
from done cross join params
group by push_type, params.min_accounts
having count(distinct user_id) >= params.min_accounts
order by push_type;
