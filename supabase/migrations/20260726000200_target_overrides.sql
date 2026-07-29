-- Migration: Habit target overrides
-- Adds per-habit target duration/count overrides so players can customize
-- quest targets (e.g. Exercise 30min instead of 15min).
-- Stores overrides on user_settings and uses them in quest completion checks.

begin;

-- 1. Add target_overrides column to user_settings
alter table public.user_settings
  add column if not exists target_overrides jsonb not null default '{}'::jsonb;

-- 2. Layer target overrides onto the fully-composed snapshot. Renaming the
-- current function avoids recursive self-calls while preserving all fields
-- added by equipment, Guild, and passive-energy migrations.
alter function loro_private.build_game_snapshot(uuid)
  rename to build_game_snapshot_without_target_overrides;

create function loro_private.build_game_snapshot(target_user_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_set(
    loro_private.build_game_snapshot_without_target_overrides(target_user_id),
    '{targetOverrides}',
    coalesce(settings.target_overrides, '{}'::jsonb)
  )
  from public.user_settings settings
  where settings.user_id = target_user_id;
$$;

-- 3. Update complete_daily_quest: use target overrides for timed quest timer check
create or replace function public.complete_daily_quest(p_habit_id text)
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
  user_settings public.user_settings%rowtype;
  progress public.habit_progress%rowtype;
  active_node public.quest_nodes%rowtype;
  active_timer public.active_timed_quests%rowtype;
  existing_completion public.quest_completions%rowtype;
  completion_energy_cost integer := 0;
  effective_duration_seconds integer;
  override_minutes integer;
  next_habit_streak integer;
  next_daily_streak integer;
  habit_level integer;
  habit_xp integer;
  habit_xp_target integer;
  player_level integer;
  player_xp integer;
  player_xp_target integer;
begin
  select * into player
  from public.profiles
  where id = current_user_id
  for update;

  if not found then
    raise exception using errcode = 'P0001', message = 'Player profile not found.', detail = 'PROFILE_NOT_FOUND';
  end if;

  select * into user_settings
  from public.user_settings
  where user_id = current_user_id;

  select * into progress
  from public.habit_progress
  where user_id = current_user_id and habit_id = p_habit_id
  for update;

  if not found then
    raise exception using errcode = 'P0001', message = 'Habit not found.', detail = 'INVALID_HABIT';
  end if;

  current_date_key := loro_private.local_date(current_user_id, action_time);

  select * into existing_completion
  from public.quest_completions
  where user_id = current_user_id
    and habit_id = p_habit_id
    and completed_on = current_date_key;

  if found then
    return loro_private.build_game_response(
      current_user_id,
      jsonb_build_object(
        'kind', 'quest-completed',
        'habitId', p_habit_id,
        'nodeId', existing_completion.node_id,
        'sectionId', existing_completion.chapter_id,
        'coinReward', existing_completion.reward_coins,
        'xpReward', existing_completion.reward_xp,
        'streak', progress.streak,
        'alreadyCompleted', true
      )
    );
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

  if active_node.quest_type = 'timed' then
    select * into active_timer
    from public.active_timed_quests
    where user_id = current_user_id
      and habit_id = p_habit_id
      and node_id = active_node.id
      and started_on = current_date_key
    for update;

    if not found then
      raise exception using errcode = 'P0001', message = 'Start the timer before completing this quest.', detail = 'TIMER_NOT_STARTED';
    end if;

    effective_duration_seconds := active_node.target_duration_seconds;
    if user_settings.target_overrides ? p_habit_id then
      override_minutes := (user_settings.target_overrides ->> p_habit_id)::integer;
      if override_minutes >= 5 then
        effective_duration_seconds := override_minutes * 60;
      end if;
    end if;

    if action_time < active_timer.started_at + effective_duration_seconds * interval '1 second' then
      raise exception using errcode = 'P0001', message = 'Keep going until the timer reaches its target.', detail = 'TIMER_NOT_FINISHED';
    end if;
  else
    completion_energy_cost := active_node.energy_cost;

    if player.energy_current < completion_energy_cost then
      raise exception using errcode = 'P0001', message = 'You need more energy to complete this quest.', detail = 'INSUFFICIENT_ENERGY';
    end if;
  end if;

  next_habit_streak := loro_private.next_streak(progress.streak, progress.last_completed_on, current_date_key);
  next_daily_streak := loro_private.next_streak(player.daily_streak, player.last_streak_on, current_date_key);

  habit_level := progress.level;
  habit_xp := progress.xp + active_node.reward_xp;
  habit_xp_target := habit_level * 100;

  while habit_xp >= habit_xp_target loop
    habit_xp := habit_xp - habit_xp_target;
    habit_level := habit_level + 1;
    habit_xp_target := habit_level * 100;
  end loop;

  player_level := player.level;
  player_xp := player.xp + active_node.reward_xp;
  player_xp_target := player.xp_to_next_level;

  while player_xp >= player_xp_target loop
    player_xp := player_xp - player_xp_target;
    player_level := player_level + 1;
    player_xp_target := round(player_xp_target * 1.25);
  end loop;

  insert into public.quest_completions (
    user_id,
    habit_id,
    chapter_id,
    node_id,
    completed_on,
    completed_at,
    reward_coins,
    reward_xp
  ) values (
    current_user_id,
    p_habit_id,
    active_node.chapter_id,
    active_node.id,
    current_date_key,
    action_time,
    active_node.reward_coins,
    active_node.reward_xp
  );

  delete from public.active_timed_quests
  where user_id = current_user_id and habit_id = p_habit_id;

  update public.habit_progress
  set level = habit_level,
      xp = habit_xp,
      streak = next_habit_streak,
      last_completed_on = current_date_key,
      updated_at = action_time
  where user_id = current_user_id and habit_id = p_habit_id;

  update public.profiles
  set level = player_level,
      xp = player_xp,
      xp_to_next_level = player_xp_target,
      coins = coins + active_node.reward_coins,
      energy_current = energy_current - completion_energy_cost,
      last_energy_refill_at = action_time,
      daily_streak = next_daily_streak,
      longest_streak = greatest(longest_streak, next_daily_streak),
      last_streak_on = current_date_key,
      updated_at = action_time
  where id = current_user_id;

  insert into public.activity_log (
    user_id,
    activity_type,
    habit_id,
    chapter_id,
    node_id,
    occurred_at,
    coins_earned,
    xp_earned
  ) values (
    current_user_id,
    'daily-quest',
    p_habit_id,
    active_node.chapter_id,
    active_node.id,
    action_time,
    active_node.reward_coins,
    active_node.reward_xp
  );

  return loro_private.build_game_response(
    current_user_id,
    jsonb_build_object(
      'kind', 'quest-completed',
      'habitId', p_habit_id,
      'nodeId', active_node.id,
      'sectionId', active_node.chapter_id,
      'coinReward', active_node.reward_coins,
      'xpReward', active_node.reward_xp,
      'streak', next_habit_streak,
      'alreadyCompleted', false
    )
  );
end;
$$;

-- 4. Update update_settings: handle targetOverrides
create or replace function public.update_settings(p_settings jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := loro_private.require_user();
  current_settings public.user_settings%rowtype;
  requested_time_zone text;
  safe_time_zone text;
begin
  select * into current_settings
  from public.user_settings
  where user_id = current_user_id
  for update;

  if not found then
    raise exception using errcode = 'P0001', message = 'Settings not found.', detail = 'SETTINGS_NOT_FOUND';
  end if;

  safe_time_zone := current_settings.time_zone;
  if p_settings ? 'timeZone' then
    requested_time_zone := p_settings ->> 'timeZone';
    select name into safe_time_zone
    from pg_catalog.pg_timezone_names
    where name = requested_time_zone
    limit 1;

    if not found then
      raise exception using errcode = 'P0001', message = 'Time zone is not supported.', detail = 'INVALID_TIME_ZONE';
    end if;
  end if;

  update public.user_settings
  set daily_reminder_enabled = case
        when p_settings ? 'dailyReminderEnabled' then (p_settings ->> 'dailyReminderEnabled')::boolean
        else current_settings.daily_reminder_enabled
      end,
      daily_reminder_time = case
        when p_settings ? 'dailyReminderTime' then (p_settings ->> 'dailyReminderTime')::time
        else current_settings.daily_reminder_time
      end,
      sound_enabled = case
        when p_settings ? 'soundEnabled' then (p_settings ->> 'soundEnabled')::boolean
        else current_settings.sound_enabled
      end,
      haptics_enabled = case
        when p_settings ? 'hapticsEnabled' then (p_settings ->> 'hapticsEnabled')::boolean
        else current_settings.haptics_enabled
      end,
      time_zone = safe_time_zone,
      target_overrides = case
        when p_settings ? 'targetOverrides' then p_settings -> 'targetOverrides'
        else current_settings.target_overrides
      end,
      updated_at = now()
  where user_id = current_user_id;

  return loro_private.build_game_response(
    current_user_id,
    jsonb_build_object('kind', 'settings-updated')
  );
end;
$$;

commit;
