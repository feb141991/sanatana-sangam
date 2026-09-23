-- Close cross-voter visibility for poll choices and make the active post
-- reaction notification trigger use the established devotional emoji mapping.
--
-- The active trigger is trg_log_post_reaction -> log_post_reaction(). The
-- older handle_post_upvote_activity() function is not attached to a trigger,
-- so changing it would not affect live reactions.
--
-- Rollback guidance: do not restore post_poll_votes_select USING (true), as
-- that re-exposes each user's choice to every authenticated user. If a client
-- needs aggregate results, use post_poll_options.vote_count. The function
-- mapping can be reverted only if product explicitly chooses generic hearts.

begin;

drop policy if exists "post_poll_votes_select" on public.post_poll_votes;
create policy "post_poll_votes_select"
  on public.post_poll_votes
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create or replace function public.log_post_reaction()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  post_author uuid;
  reactor_name text;
  reaction_emoji text;
begin
  if tg_op = 'INSERT' then
    select author_id into post_author from public.posts where id = new.post_id;
    perform public.log_user_activity(
      new.user_id,
      post_author,
      'post_reaction_added',
      'post',
      new.post_id,
      jsonb_build_object('reaction_type', new.reaction_type)
    );

    if post_author is not null and post_author <> new.user_id
       and coalesce((select wants_community_notifications from public.profiles where id = post_author), true)
       and not exists (
         select 1 from public.user_blocked_profiles
         where (blocker_id = post_author and blocked_user_id = new.user_id)
            or (blocker_id = new.user_id and blocked_user_id = post_author)
       )
    then
      select coalesce(full_name, username, 'A fellow seeker')
      into reactor_name
      from public.profiles
      where id = new.user_id;

      reaction_emoji := case new.reaction_type
        when 'pranam' then '🙏'
        when 'love' then '❤️'
        when 'insightful' then '💡'
        when 'bhakti' then '🪷'
        when 'jnana' then '🪔'
        when 'chardi_kala' then '🌸'
        when 'shanti' then '🕊️'
        else '❤️'
      end;

      insert into public.notifications
        (user_id, title, body, emoji, type, action_url, notification_key)
      values (
        post_author,
        reactor_name || ' reacted to your post',
        'Tap to see it.',
        reaction_emoji,
        'post_reaction',
        '/mandali',
        'post_reaction:' || new.post_id || ':' || new.user_id
      )
      on conflict (user_id, notification_key)
        where notification_key is not null do nothing;
    end if;

    return new;
  elsif tg_op = 'DELETE' then
    select author_id into post_author from public.posts where id = old.post_id;
    perform public.log_user_activity(
      old.user_id,
      post_author,
      'post_reaction_removed',
      'post',
      old.post_id,
      jsonb_build_object('reaction_type', old.reaction_type)
    );
    return old;
  end if;

  return null;
end;
$function$;

commit;
