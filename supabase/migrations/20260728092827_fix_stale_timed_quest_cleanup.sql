-- Repair the authenticated timed-quest start path after the passive-energy
-- migration began filtering the existing-timer lookup by today's date.
-- The table primary key is (user_id, habit_id), so stale timers must be
-- found and replaced before a new day's timer is inserted.

begin;

create or replace function public.start_daily_quest(p_habit_id text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := loro_private.require_user();
  action_time timestamptz := now();
  current_date_key date;
  player public.profiles%rowtype;
  active_node public.quest_nodes%rowtype;
  existing_quest public.active_timed_quests%rowtype;
  has_existing_quest boolean := false;
begin
  select * into player
  from public.profiles
  where id = current_user_id
  for update;

  if not found then
    raise exception using errcode = 'P0001', message = 'Player profile not found.', detail = 'PROFILE_NOT_FOUND';
  end if;

  perform 1
  from public.habit_progress
  where user_id = current_user_id and habit_id = p_habit_id
  for update;

  if not found then
    raise exception using errcode = 'P0001', message = 'Habit not found.', detail = 'INVALID_HABIT';
  end if;

  current_date_key := loro_private.local_date(current_user_id, action_time);

  if exists (
    select 1
    from public.quest_completions completion
    where completion.user_id = current_user_id
      and completion.habit_id = p_habit_id
      and completion.completed_on = current_date_key
  ) then
    raise exception using errcode = 'P0001', message = 'Today''s quest is already complete.', detail = 'QUEST_ALREADY_COMPLETED';
  end if;

  select node.* into active_node
  from public.quest_nodes node
  join public.chapters chapter on chapter.id = node.chapter_id
  where chapter.habit_id = p_habit_id
    and not exists (
      select 1
      from public.quest_completions completion
      where completion.user_id = current_user_id
        and completion.node_id = node.id
    )
  order by chapter.sort_order, node.day
  limit 1;

  if not found then
    raise exception using errcode = 'P0001', message = 'This adventure path is complete.', detail = 'PATH_COMPLETE';
  end if;

  if active_node.quest_type <> 'timed' then
    raise exception using errcode = 'P0001', message = 'This quest does not use a timer.', detail = 'QUEST_NOT_TIMED';
  end if;

  -- Lock the single timer slot for this user and habit regardless of its
  -- date. A timer from a previous local day is stale, but it still occupies
  -- the (user_id, habit_id) primary-key slot until it is replaced.
  select * into existing_quest
  from public.active_timed_quests
  where user_id = current_user_id and habit_id = p_habit_id
  for update;
  has_existing_quest := found;

  if has_existing_quest
    and existing_quest.node_id = active_node.id
    and existing_quest.started_on = current_date_key
  then
    return loro_private.build_game_response(
      current_user_id,
      jsonb_build_object(
        'kind', 'quest-started',
        'habitId', p_habit_id,
        'nodeId', active_node.id,
        'startedAt', existing_quest.started_at,
        'alreadyStarted', true
      )
    );
  end if;

  if has_existing_quest then
    delete from public.active_timed_quests
    where user_id = current_user_id and habit_id = p_habit_id;
  end if;

  if player.energy_current < active_node.energy_cost then
    raise exception using errcode = 'P0001', message = 'You need more energy to start this quest.', detail = 'INSUFFICIENT_ENERGY';
  end if;

  update public.profiles
  set energy_current = energy_current - active_node.energy_cost,
      last_energy_refill_at = action_time,
      updated_at = action_time
  where id = current_user_id;

  insert into public.active_timed_quests (
    user_id,
    habit_id,
    chapter_id,
    node_id,
    started_on,
    started_at
  ) values (
    current_user_id,
    p_habit_id,
    active_node.chapter_id,
    active_node.id,
    current_date_key,
    action_time
  );

  return loro_private.build_game_response(
    current_user_id,
    jsonb_build_object(
      'kind', 'quest-started',
      'habitId', p_habit_id,
      'nodeId', active_node.id,
      'startedAt', action_time,
      'alreadyStarted', false
    )
  );
end;
$$;

alter function public.start_daily_quest(text) owner to postgres;
revoke execute on function public.start_daily_quest(text) from public, anon;
grant execute on function public.start_daily_quest(text) to authenticated;

commit;
