-- Feature #4: authenticated streak-shield parity.
-- This is a forward migration. It deliberately wraps the current snapshot
-- composition and replaces only the shield count, so already-applied
-- environments receive the correction without changing stored counts.

begin;

-- Keep the private streak rule identical to the guest repository. A streak is
-- at risk only when it is non-zero and a stored prior date is more than one
-- local day behind. A null prior date represents no established streak and
-- must not consume a shield.
create or replace function loro_private.streak_would_reset(
  stored_streak integer,
  last_date date,
  current_date_key date
)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select stored_streak > 0
    and last_date is not null
    and current_date_key - last_date > 1;
$$;

-- Correct the final composed snapshot without discarding equipment, Guild,
-- passive-energy, target-override, settings, activity, or inventory fields.
alter function loro_private.build_game_snapshot(uuid)
  rename to build_game_snapshot_without_streak_shields;

create function loro_private.build_game_snapshot(target_user_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_set(
    loro_private.build_game_snapshot_without_streak_shields(target_user_id),
    '{inventory,streakShields}',
    to_jsonb(profile.streak_shields)
  )
  from public.profiles profile
  where profile.id = target_user_id;
$$;

alter function loro_private.build_game_snapshot(uuid) owner to postgres;

-- Chapter completion earns exactly one shield only after a new claim is
-- accepted. The profile and habit rows remain locked for idempotency.
create or replace function public.claim_chapter_reward(p_habit_id text, p_chapter_id text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := loro_private.require_user();
  action_time timestamptz := now();
  player public.profiles%rowtype;
  progress public.habit_progress%rowtype;
  target_chapter public.chapters%rowtype;
  existing_claim public.chapter_reward_claims%rowtype;
  node_count integer;
  completed_count integer;
  habit_level integer;
  habit_xp integer;
  habit_xp_target integer;
  player_level integer;
  player_xp integer;
  player_xp_target integer;
begin
  select * into player from public.profiles where id = current_user_id for update;
  if not found then
    raise exception using errcode = 'P0001', message = 'Player profile not found.', detail = 'PROFILE_NOT_FOUND';
  end if;

  select * into progress
  from public.habit_progress
  where user_id = current_user_id and habit_id = p_habit_id
  for update;
  if not found then
    raise exception using errcode = 'P0001', message = 'Habit not found.', detail = 'INVALID_HABIT';
  end if;

  select * into target_chapter
  from public.chapters
  where id = p_chapter_id and habit_id = p_habit_id;
  if not found then
    raise exception using errcode = 'P0001', message = 'Chapter not found.', detail = 'INVALID_CHAPTER';
  end if;

  select * into existing_claim
  from public.chapter_reward_claims
  where user_id = current_user_id and chapter_id = p_chapter_id;

  if found then
    return loro_private.build_game_response(
      current_user_id,
      jsonb_build_object(
        'kind', 'chapter-reward-claimed',
        'habitId', p_habit_id,
        'sectionId', p_chapter_id,
        'coinReward', existing_claim.reward_coins,
        'xpReward', existing_claim.reward_xp,
        'alreadyClaimed', true
      )
    );
  end if;

  select count(*) into node_count from public.quest_nodes where chapter_id = p_chapter_id;
  select count(*) into completed_count
  from public.quest_completions
  where user_id = current_user_id and chapter_id = p_chapter_id;

  if completed_count <> node_count or node_count = 0 then
    raise exception using errcode = 'P0001', message = 'Complete every chapter quest before claiming this reward.', detail = 'CHAPTER_INCOMPLETE';
  end if;

  habit_level := progress.level;
  habit_xp := progress.xp + target_chapter.reward_xp;
  habit_xp_target := habit_level * 100;
  while habit_xp >= habit_xp_target loop
    habit_xp := habit_xp - habit_xp_target;
    habit_level := habit_level + 1;
    habit_xp_target := habit_level * 100;
  end loop;

  player_level := player.level;
  player_xp := player.xp + target_chapter.reward_xp;
  player_xp_target := player.xp_to_next_level;
  while player_xp >= player_xp_target loop
    player_xp := player_xp - player_xp_target;
    player_level := player_level + 1;
    player_xp_target := round(player_xp_target * 1.25);
  end loop;

  insert into public.chapter_reward_claims (
    user_id,
    habit_id,
    chapter_id,
    claimed_at,
    reward_coins,
    reward_xp
  ) values (
    current_user_id,
    p_habit_id,
    p_chapter_id,
    action_time,
    target_chapter.reward_coins,
    target_chapter.reward_xp
  );

  update public.habit_progress
  set level = habit_level, xp = habit_xp, updated_at = action_time
  where user_id = current_user_id and habit_id = p_habit_id;

  update public.profiles
  set level = player_level,
      xp = player_xp,
      xp_to_next_level = player_xp_target,
      coins = coins + target_chapter.reward_coins,
      streak_shields = streak_shields + 1,
      updated_at = action_time
  where id = current_user_id;

  insert into public.activity_log (
    user_id,
    activity_type,
    habit_id,
    chapter_id,
    occurred_at,
    coins_earned,
    xp_earned
  ) values (
    current_user_id,
    'chapter-reward',
    p_habit_id,
    p_chapter_id,
    action_time,
    target_chapter.reward_coins,
    target_chapter.reward_xp
  );

  return loro_private.build_game_response(
    current_user_id,
    jsonb_build_object(
      'kind', 'chapter-reward-claimed',
      'habitId', p_habit_id,
      'sectionId', p_chapter_id,
      'coinReward', target_chapter.reward_coins,
      'xpReward', target_chapter.reward_xp,
      'alreadyClaimed', false
    )
  );
end;
$$;

alter function public.claim_chapter_reward(text, text) owner to postgres;
revoke execute on function public.claim_chapter_reward(text, text) from public, anon;
grant execute on function public.claim_chapter_reward(text, text) to authenticated;

-- Quest completion retains target overrides, passive-energy bookkeeping,
-- timed validation, one-time zero-energy behavior, loot, activity, rewards,
-- and duplicate completion semantics while adding atomic shield recovery.
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
  habit_streak_would_reset boolean;
  daily_streak_would_reset boolean;
  streak_shield_consumed boolean := false;
  remaining_streak_shields integer;
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
        'streakShieldConsumed', false,
        'remainingStreakShields', player.streak_shields,
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
  habit_streak_would_reset := loro_private.streak_would_reset(progress.streak, progress.last_completed_on, current_date_key);
  daily_streak_would_reset := loro_private.streak_would_reset(player.daily_streak, player.last_streak_on, current_date_key);
  streak_shield_consumed := player.streak_shields > 0
    and (habit_streak_would_reset or daily_streak_would_reset);

  if streak_shield_consumed then
    if habit_streak_would_reset then
      next_habit_streak := progress.streak + 1;
    end if;
    if daily_streak_would_reset then
      next_daily_streak := player.daily_streak + 1;
    end if;
  end if;

  remaining_streak_shields := player.streak_shields - case when streak_shield_consumed then 1 else 0 end;

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
      streak_shields = remaining_streak_shields,
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
      'streakShieldConsumed', streak_shield_consumed,
      'remainingStreakShields', remaining_streak_shields,
      'alreadyCompleted', false
    )
  );
end;
$$;

alter function public.complete_daily_quest(text) owner to postgres;
revoke execute on function public.complete_daily_quest(text) from public, anon;
grant execute on function public.complete_daily_quest(text) to authenticated;

commit;
