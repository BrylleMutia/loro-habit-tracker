create or replace function public.start_daily_quest(p_habit_id text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := loro_private.require_user();
  current_date_key date;
  action_time timestamptz := now();
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
  progress public.habit_progress%rowtype;
  active_node public.quest_nodes%rowtype;
  active_timer public.active_timed_quests%rowtype;
  existing_completion public.quest_completions%rowtype;
  completion_energy_cost integer := 0;
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

    if action_time < active_timer.started_at + active_node.target_duration_seconds * interval '1 second' then
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

create or replace function public.claim_daily_check_in()
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
  existing_check_in public.daily_check_ins%rowtype;
  reward_coins constant integer := 25;
  reward_energy constant integer := 2;
begin
  select * into player from public.profiles where id = current_user_id for update;
  if not found then
    raise exception using errcode = 'P0001', message = 'Player profile not found.', detail = 'PROFILE_NOT_FOUND';
  end if;

  current_date_key := loro_private.local_date(current_user_id, action_time);
  select * into existing_check_in
  from public.daily_check_ins
  where user_id = current_user_id and claimed_on = current_date_key;

  if found then
    return loro_private.build_game_response(
      current_user_id,
      jsonb_build_object(
        'kind', 'daily-check-in-claimed',
        'coinReward', existing_check_in.reward_coins,
        'energyReward', existing_check_in.reward_energy,
        'alreadyClaimed', true
      )
    );
  end if;

  insert into public.daily_check_ins (
    user_id,
    claimed_on,
    claimed_at,
    reward_coins,
    reward_energy
  ) values (
    current_user_id,
    current_date_key,
    action_time,
    reward_coins,
    reward_energy
  );

  update public.profiles
  set coins = coins + reward_coins,
      energy_current = least(energy_max, energy_current + reward_energy),
      last_energy_refill_at = action_time,
      updated_at = action_time
  where id = current_user_id;

  insert into public.activity_log (
    user_id,
    activity_type,
    occurred_at,
    coins_earned,
    xp_earned
  ) values (
    current_user_id,
    'daily-check-in',
    action_time,
    reward_coins,
    0
  );

  return loro_private.build_game_response(
    current_user_id,
    jsonb_build_object(
      'kind', 'daily-check-in-claimed',
      'coinReward', reward_coins,
      'energyReward', reward_energy,
      'alreadyClaimed', false
    )
  );
end;
$$;

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
      updated_at = now()
  where user_id = current_user_id;

  return loro_private.build_game_response(
    current_user_id,
    jsonb_build_object('kind', 'settings-updated')
  );
end;
$$;

create or replace function public.update_profile(p_profile_fields jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := loro_private.require_user();
  current_profile public.profiles%rowtype;
  next_display_name text;
  next_avatar_class_id text;
  next_avatar_variant text;
begin
  select * into current_profile
  from public.profiles
  where id = current_user_id
  for update;

  if not found then
    raise exception using errcode = 'P0001', message = 'Player profile not found.', detail = 'PROFILE_NOT_FOUND';
  end if;

  next_display_name := current_profile.display_name;
  if p_profile_fields ? 'name' then
    next_display_name := left(trim(coalesce(p_profile_fields ->> 'name', '')), 40);
    if next_display_name = '' then
      raise exception using errcode = 'P0001', message = 'Display name cannot be empty.', detail = 'INVALID_DISPLAY_NAME';
    end if;
  end if;

  next_avatar_class_id := coalesce(p_profile_fields ->> 'avatarClassId', current_profile.avatar_class_id);
  if next_avatar_class_id not in ('druid', 'mercenary', 'ranger', 'warrior', 'wizard') then
    raise exception using errcode = 'P0001', message = 'Avatar class is not supported.', detail = 'INVALID_AVATAR_CLASS';
  end if;

  next_avatar_variant := coalesce(p_profile_fields ->> 'avatarVariant', current_profile.avatar_variant);
  if next_avatar_variant not in ('default', 'alternate') then
    raise exception using errcode = 'P0001', message = 'Avatar variant is not supported.', detail = 'INVALID_AVATAR_VARIANT';
  end if;

  update public.profiles
  set display_name = next_display_name,
      avatar_class_id = next_avatar_class_id,
      avatar_variant = next_avatar_variant,
      updated_at = now()
  where id = current_user_id;

  return loro_private.build_game_response(
    current_user_id,
    jsonb_build_object('kind', 'profile-updated')
  );
end;
$$;

revoke execute on function public.start_daily_quest(text) from public, anon;
revoke execute on function public.complete_daily_quest(text) from public, anon;
revoke execute on function public.claim_chapter_reward(text, text) from public, anon;
revoke execute on function public.claim_daily_check_in() from public, anon;
revoke execute on function public.update_settings(jsonb) from public, anon;
revoke execute on function public.update_profile(jsonb) from public, anon;

grant execute on function public.start_daily_quest(text) to authenticated;
grant execute on function public.complete_daily_quest(text) to authenticated;
grant execute on function public.claim_chapter_reward(text, text) to authenticated;
grant execute on function public.claim_daily_check_in() to authenticated;
grant execute on function public.update_settings(jsonb) to authenticated;
grant execute on function public.update_profile(jsonb) to authenticated;
