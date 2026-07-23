alter table public.inventory_items
  alter column source_completion_id drop not null;

alter table public.inventory_items
  add column if not exists source_guild_quest_id text,
  add column if not exists source_guild_period_key date;

create table public.guild_quest_definitions (
  id text primary key,
  kind text not null check (kind in ('side', 'main')),
  title text not null,
  description text not null,
  icon text not null,
  metric text not null,
  target integer not null check (target > 0),
  secondary_target integer check (secondary_target is null or secondary_target > 0),
  reward_coins integer not null check (reward_coins >= 0),
  reward_xp integer not null check (reward_xp >= 0),
  item_rarity_floor text not null check (item_rarity_floor in ('rare', 'epic')),
  active boolean not null default true
);

insert into public.guild_quest_definitions (
  id, kind, title, description, icon, metric, target, secondary_target,
  reward_coins, reward_xp, item_rarity_floor
)
values
  ('steady-trail', 'side', 'Steady Trail', 'Complete the same habit on five different days.', 'footsteps-outline', 'same-habit-days', 5, null, 45, 40, 'rare'),
  ('four-corners', 'side', 'Four Corners', 'Complete each of the four habits at least once.', 'compass-outline', 'unique-habits', 4, null, 50, 45, 'rare'),
  ('double-step', 'side', 'Double Step', 'Complete two different habits on the same day.', 'shuffle-outline', 'multi-habit-days', 1, null, 35, 30, 'rare'),
  ('pathfinder', 'side', 'Pathfinder', 'Complete three Daily Quests this week.', 'map-outline', 'daily-completions', 3, null, 45, 40, 'rare'),
  ('timed-and-one-time', 'side', 'Timed & One-Time', 'Complete two timed and two one-time Daily Quests.', 'timer-outline', 'timed-and-one-time', 2, 2, 60, 55, 'rare'),
  ('daily-rhythm', 'side', 'Daily Rhythm', 'Complete a Daily Quest on five different days.', 'calendar-outline', 'distinct-completion-days', 5, null, 40, 35, 'rare'),
  ('twin-trails', 'side', 'Twin Trails', 'Complete two different habits on at least two days each.', 'git-compare-outline', 'two-habits-two-days', 2, null, 55, 50, 'rare'),
  ('chapter-touch', 'side', 'Chapter Touch', 'Advance one chapter by completing three nodes.', 'flag-outline', 'chapter-nodes', 3, null, 60, 55, 'rare'),
  ('chapter-hero', 'main', 'Chapter Hero', 'Claim one chapter reward this month.', 'trophy-outline', 'chapter-reward-claimed', 1, null, 175, 160, 'epic'),
  ('habit-constellation', 'main', 'Habit Constellation', 'Complete each habit three times this month.', 'sparkles-outline', 'habit-completions-each', 3, null, 200, 180, 'epic'),
  ('long-trail', 'main', 'Long Trail', 'Complete Daily Quests on twenty different days.', 'trail-sign-outline', 'distinct-completion-days', 20, null, 220, 200, 'epic'),
  ('streak-keeper', 'main', 'Streak Keeper', 'Reach a ten-day streak with any habit.', 'flame-outline', 'max-habit-streak', 10, null, 190, 170, 'epic'),
  ('relic-collector', 'main', 'Relic Collector', 'Complete twelve Daily Quests this month.', 'albums-outline', 'daily-completions', 12, null, 210, 190, 'epic')
on conflict (id) do update set
  kind = excluded.kind,
  title = excluded.title,
  description = excluded.description,
  icon = excluded.icon,
  metric = excluded.metric,
  target = excluded.target,
  secondary_target = excluded.secondary_target,
  reward_coins = excluded.reward_coins,
  reward_xp = excluded.reward_xp,
  item_rarity_floor = excluded.item_rarity_floor,
  active = true;

create table public.guild_quest_boards (
  user_id uuid primary key references auth.users (id) on delete cascade,
  side_period_key date not null,
  side_candidate_ids text[] not null default '{}',
  side_locked_ids text[] not null default '{}',
  side_reward_previews jsonb not null default '{}'::jsonb,
  main_period_key date not null,
  main_candidate_ids text[] not null default '{}',
  main_locked_ids text[] not null default '{}',
  main_reward_previews jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table public.guild_quest_claims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  quest_kind text not null check (quest_kind in ('side', 'main')),
  period_key date not null,
  quest_id text not null references public.guild_quest_definitions (id) on delete restrict,
  claimed_at timestamptz not null default now(),
  reward_coins integer not null check (reward_coins >= 0),
  reward_xp integer not null check (reward_xp >= 0),
  inventory_item_id uuid references public.inventory_items (id) on delete set null,
  unique (user_id, quest_kind, period_key, quest_id)
);

create index guild_quest_claims_user_period_idx
on public.guild_quest_claims (user_id, period_key desc);

create or replace function loro_private.guild_period_key(
  target_user_id uuid,
  target_kind text,
  target_time timestamptz default now()
)
returns date
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when target_kind = 'side' then
      (loro_private.local_date(target_user_id, target_time) - extract(dow from loro_private.local_date(target_user_id, target_time))::integer)
    else
      date_trunc('month', loro_private.local_date(target_user_id, target_time)::timestamp)::date
  end;
$$;

create or replace function loro_private.guild_candidate_ids(
  target_kind text,
  target_period_key date
)
returns text[]
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(array_agg(ranked.id order by ranked.rank), '{}')
  from (
    select definition.id,
      row_number() over (order by md5(target_period_key::text || ':' || definition.id)) as rank
    from public.guild_quest_definitions definition
    where definition.kind = target_kind
      and definition.active
  ) ranked
  where ranked.rank <= case when target_kind = 'side' then 5 else 3 end;
$$;

create or replace function loro_private.guild_quest_board_json(target_user_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  side_key date := loro_private.guild_period_key(target_user_id, 'side');
  main_key date := loro_private.guild_period_key(target_user_id, 'main');
  board public.guild_quest_boards%rowtype;
  side_candidates text[] := loro_private.guild_candidate_ids('side', side_key);
  main_candidates text[] := loro_private.guild_candidate_ids('main', main_key);
  side_locked text[] := '{}';
  main_locked text[] := '{}';
  stored_side_reward_previews jsonb := '{}'::jsonb;
  stored_main_reward_previews jsonb := '{}'::jsonb;
  side_claimed text[] := '{}';
  main_claimed text[] := '{}';
begin
  select * into board
  from public.guild_quest_boards
  where user_id = target_user_id;

  if found and board.side_period_key = side_key and board.main_period_key = main_key then
    side_candidates := board.side_candidate_ids;
    main_candidates := board.main_candidate_ids;
    side_locked := board.side_locked_ids;
    main_locked := board.main_locked_ids;
    side_reward_previews := board.side_reward_previews;
    main_reward_previews := board.main_reward_previews;
  end if;

  select coalesce(array_agg(claim.quest_id order by claim.claimed_at), '{}')
  into side_claimed
  from public.guild_quest_claims claim
  where claim.user_id = target_user_id
    and claim.quest_kind = 'side'
    and claim.period_key = side_key;

  select coalesce(array_agg(claim.quest_id order by claim.claimed_at), '{}')
  into main_claimed
  from public.guild_quest_claims claim
  where claim.user_id = target_user_id
    and claim.quest_kind = 'main'
    and claim.period_key = main_key;

  return jsonb_build_object(
    'side', jsonb_build_object(
      'periodKey', side_key,
      'candidateIds', to_jsonb(side_candidates),
      'lockedIds', to_jsonb(side_locked),
      'claimedIds', to_jsonb(side_claimed),
      'rewardPreviews', side_reward_previews
    ),
    'main', jsonb_build_object(
      'periodKey', main_key,
      'candidateIds', to_jsonb(main_candidates),
      'lockedIds', to_jsonb(main_locked),
      'claimedIds', to_jsonb(main_claimed),
      'rewardPreviews', main_reward_previews
    )
  );
end;
$$;

create or replace function loro_private.guild_quest_progress(
  target_user_id uuid,
  quest_id text,
  period_start date,
  period_end date
)
returns integer
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  definition public.guild_quest_definitions%rowtype;
  result integer := 0;
begin
  select * into definition from public.guild_quest_definitions where id = quest_id and active;
  if not found then return 0; end if;

  case definition.metric
    when 'same-habit-days' then
      select coalesce(max(counted), 0) into result
      from (
        select count(distinct completion.completed_on)::integer as counted
        from public.quest_completions completion
        where completion.user_id = target_user_id
          and completion.completed_on >= period_start
          and completion.completed_on < period_end
        group by completion.habit_id
      ) values_by_habit;
    when 'unique-habits' then
      select count(distinct completion.habit_id)::integer into result
      from public.quest_completions completion
      where completion.user_id = target_user_id
        and completion.completed_on >= period_start
        and completion.completed_on < period_end;
    when 'multi-habit-days' then
      select count(*)::integer into result
      from (
        select completion.completed_on
        from public.quest_completions completion
        where completion.user_id = target_user_id
          and completion.completed_on >= period_start
          and completion.completed_on < period_end
        group by completion.completed_on
        having count(distinct completion.habit_id) >= 2
      ) qualifying_days;
    when 'daily-completions' then
      select count(*)::integer into result
      from public.quest_completions completion
      where completion.user_id = target_user_id
        and completion.completed_on >= period_start
        and completion.completed_on < period_end;
    when 'timed-and-one-time' then
      select least(
        count(*) filter (where node.quest_type = 'timed'),
        count(*) filter (where node.quest_type = 'one-time')
      )::integer into result
      from public.quest_completions completion
      join public.quest_nodes node on node.id = completion.node_id
      where completion.user_id = target_user_id
        and completion.completed_on >= period_start
        and completion.completed_on < period_end;
    when 'distinct-completion-days' then
      select count(distinct completion.completed_on)::integer into result
      from public.quest_completions completion
      where completion.user_id = target_user_id
        and completion.completed_on >= period_start
        and completion.completed_on < period_end;
    when 'two-habits-two-days' then
      select count(*)::integer into result
      from (
        select completion.habit_id
        from public.quest_completions completion
        where completion.user_id = target_user_id
          and completion.completed_on >= period_start
          and completion.completed_on < period_end
        group by completion.habit_id
        having count(distinct completion.completed_on) >= 2
      ) qualifying_habits;
    when 'chapter-nodes' then
      select coalesce(max(counted), 0) into result
      from (
        select count(*)::integer as counted
        from public.quest_completions completion
        where completion.user_id = target_user_id
          and completion.completed_on >= period_start
          and completion.completed_on < period_end
        group by completion.chapter_id
      ) chapter_counts;
    when 'chapter-reward-claimed' then
      select count(*)::integer into result
      from public.chapter_reward_claims claim
      join public.user_settings settings on settings.user_id = target_user_id
      where claim.user_id = target_user_id
        and (claim.claimed_at at time zone settings.time_zone)::date >= period_start
        and (claim.claimed_at at time zone settings.time_zone)::date < period_end;
    when 'habit-completions-each' then
      select coalesce(min(counted), 0) into result
      from (
        select habit.id,
          count(completion.id)::integer as counted
        from public.habit_definitions habit
        left join public.quest_completions completion
          on completion.habit_id = habit.id
         and completion.user_id = target_user_id
         and completion.completed_on >= period_start
         and completion.completed_on < period_end
        group by habit.id
      ) habit_counts;
    when 'max-habit-streak' then
      with dates as (
        select distinct completion.habit_id, completion.completed_on
        from public.quest_completions completion
        where completion.user_id = target_user_id
          and completion.completed_on >= period_start
          and completion.completed_on < period_end
      ), numbered as (
        select dates.*,
          dates.completed_on - row_number() over (partition by dates.habit_id order by dates.completed_on)::integer as group_key
        from dates
      ), runs as (
        select habit_id, group_key, count(*)::integer as length
        from numbered
        group by habit_id, group_key
      )
      select coalesce(max(length), 0) into result from runs;
  end case;

  return result;
end;
$$;

create or replace function loro_private.inventory_item_json(target_item public.inventory_items)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'id', target_item.id,
    'itemDefinitionId', definition.id,
    'name', definition.name,
    'setId', equipment_set.id,
    'setName', equipment_set.name,
    'slotId', definition.slot_id,
    'rarity', target_item.rarity,
    'stats', target_item.stats,
    'acquiredAt', target_item.acquired_at,
    'sourceHabitId', completion.habit_id,
    'sourceNodeId', completion.node_id,
    'sourceDateKey', coalesce(
      completion.completed_on,
      target_item.source_guild_period_key,
      (target_item.acquired_at at time zone 'UTC')::date
    ),
    'sourceGuildQuestId', target_item.source_guild_quest_id,
    'sourceGuildPeriodKey', target_item.source_guild_period_key
  )
  from public.equipment_items definition
  join public.equipment_sets equipment_set on equipment_set.id = definition.set_id
  left join public.quest_completions completion on completion.id = target_item.source_completion_id
  where definition.id = target_item.equipment_item_id;
$$;

alter function loro_private.build_game_snapshot(uuid)
  rename to build_game_snapshot_without_guild_quests;

create or replace function loro_private.build_game_snapshot(target_user_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_set(
    loro_private.build_game_snapshot_without_guild_quests(target_user_id),
    '{guildQuestBoard}',
    loro_private.guild_quest_board_json(target_user_id)
  );
$$;

alter function loro_private.build_game_snapshot(uuid)
  owner to postgres;

create or replace function public.accept_guild_quest(
  p_quest_kind text,
  p_quest_id text,
  p_reward_preview jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := loro_private.require_user();
  current_side_key date := loro_private.guild_period_key(current_user_id, 'side');
  current_main_key date := loro_private.guild_period_key(current_user_id, 'main');
  side_candidates text[] := loro_private.guild_candidate_ids('side', current_side_key);
  main_candidates text[] := loro_private.guild_candidate_ids('main', current_main_key);
  board public.guild_quest_boards%rowtype;
  side_locked text[] := '{}';
  main_locked text[] := '{}';
  side_reward_previews jsonb := '{}'::jsonb;
  main_reward_previews jsonb := '{}'::jsonb;
  preview_item_definition_id text;
  preview_rarity text;
  preview_equipment public.equipment_items%rowtype;
begin
  if p_quest_kind not in ('side', 'main') then
    raise exception using errcode = 'P0001', message = 'Quest type is invalid.', detail = 'GUILD_QUEST_INVALID_SELECTION';
  end if;
  if p_quest_id is null or p_quest_id = '' then
    raise exception using errcode = 'P0001', message = 'That Guild Quest is invalid.', detail = 'GUILD_QUEST_INVALID_SELECTION';
  end if;
  if p_reward_preview is null or jsonb_typeof(p_reward_preview) <> 'object' then
    raise exception using errcode = 'P0001', message = 'Guild Quest rewards are unavailable.', detail = 'GUILD_QUEST_INVALID_SELECTION';
  end if;
  preview_item_definition_id := p_reward_preview ->> 'itemDefinitionId';
  preview_rarity := p_reward_preview ->> 'rarity';
  select * into preview_equipment
  from public.equipment_items
  where id = preview_item_definition_id;
  if not found
    or (p_quest_kind = 'side' and preview_rarity not in ('rare', 'epic', 'legendary'))
    or (p_quest_kind = 'main' and preview_rarity not in ('epic', 'legendary')) then
    raise exception using errcode = 'P0001', message = 'Guild Quest rewards are invalid.', detail = 'GUILD_QUEST_INVALID_SELECTION';
  end if;

  select * into board from public.guild_quest_boards where user_id = current_user_id for update;
  if not found or board.side_period_key <> current_side_key or board.main_period_key <> current_main_key then
    insert into public.guild_quest_boards (
      user_id, side_period_key, side_candidate_ids, side_locked_ids,
      side_reward_previews, main_period_key, main_candidate_ids, main_locked_ids,
      main_reward_previews
    ) values (
      current_user_id, current_side_key, side_candidates, '{}',
      '{}', current_main_key, main_candidates, '{}', '{}'
    )
    on conflict (user_id) do update set
      side_period_key = excluded.side_period_key,
      side_candidate_ids = excluded.side_candidate_ids,
      side_locked_ids = '{}',
      side_reward_previews = '{}',
      main_period_key = excluded.main_period_key,
      main_candidate_ids = excluded.main_candidate_ids,
      main_locked_ids = '{}',
      main_reward_previews = '{}',
      updated_at = now();
    side_locked := '{}';
    main_locked := '{}';
    stored_side_reward_previews := '{}'::jsonb;
    stored_main_reward_previews := '{}'::jsonb;
  else
    side_locked := board.side_locked_ids;
    main_locked := board.main_locked_ids;
    stored_side_reward_previews := board.side_reward_previews;
    stored_main_reward_previews := board.main_reward_previews;
  end if;

  if p_quest_kind = 'side' then
    if not (p_quest_id = any(side_candidates)) then
      raise exception using errcode = 'P0001', message = 'That Side Quest is not on this board.', detail = 'GUILD_QUEST_INVALID_SELECTION';
    end if;
    if p_quest_id = any(side_locked) or cardinality(side_locked) >= 3 then
      raise exception using errcode = 'P0001', message = 'The Side Quest acceptance limit has been reached.', detail = 'GUILD_QUEST_INVALID_SELECTION';
    end if;
    side_locked := array_append(side_locked, p_quest_id);
    update public.guild_quest_boards
    set side_locked_ids = side_locked,
        side_reward_previews = stored_side_reward_previews || jsonb_build_object(p_quest_id, p_reward_preview),
        updated_at = now()
    where user_id = current_user_id;
  else
    if not (p_quest_id = any(main_candidates)) then
      raise exception using errcode = 'P0001', message = 'That Main Quest is not on this board.', detail = 'GUILD_QUEST_INVALID_SELECTION';
    end if;
    if p_quest_id = any(main_locked) or cardinality(main_locked) >= 1 then
      raise exception using errcode = 'P0001', message = 'The Main Quest has already been accepted.', detail = 'GUILD_QUEST_INVALID_SELECTION';
    end if;
    main_locked := array_append(main_locked, p_quest_id);
    update public.guild_quest_boards
    set main_locked_ids = main_locked,
        main_reward_previews = stored_main_reward_previews || jsonb_build_object(p_quest_id, p_reward_preview),
        updated_at = now()
    where user_id = current_user_id;
  end if;

  return loro_private.build_game_response(
    current_user_id,
    jsonb_build_object('kind', 'guild-quest-accepted', 'questKind', p_quest_kind, 'questId', p_quest_id)
  );
end;
$$;

create or replace function public.claim_guild_quest_reward(
  p_quest_kind text,
  p_quest_id text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := loro_private.require_user();
  action_time timestamptz := now();
  current_date_key date := loro_private.local_date(current_user_id, action_time);
  period_start date := loro_private.guild_period_key(current_user_id, p_quest_kind, action_time);
  period_end date := case when p_quest_kind = 'side' then period_start + 7 else (period_start + interval '1 month')::date end;
  definition public.guild_quest_definitions%rowtype;
  board public.guild_quest_boards%rowtype;
  existing_claim public.guild_quest_claims%rowtype;
  player public.profiles%rowtype;
  progress integer;
  secondary_progress integer := 0;
  item public.inventory_items%rowtype;
  equipment public.equipment_items%rowtype;
  selected_rarity text;
  reward_preview jsonb;
  preview_item_definition_id text;
  primary_bonus integer;
  secondary_bonus integer;
  rolled_stats jsonb;
  player_level integer;
  player_xp integer;
  player_xp_target integer;
begin
  if p_quest_kind not in ('side', 'main') then
    raise exception using errcode = 'P0001', message = 'Quest type is invalid.', detail = 'GUILD_QUEST_NOT_READY';
  end if;

  select * into definition
  from public.guild_quest_definitions
  where id = p_quest_id and kind = p_quest_kind and active;
  if not found then
    raise exception using errcode = 'P0001', message = 'That Guild Quest is not available.', detail = 'GUILD_QUEST_NOT_READY';
  end if;

  select * into board from public.guild_quest_boards where user_id = current_user_id for update;
  if not found or board.side_period_key <> loro_private.guild_period_key(current_user_id, 'side', action_time)
    or board.main_period_key <> loro_private.guild_period_key(current_user_id, 'main', action_time) then
    raise exception using errcode = 'P0001', message = 'This Guild Quest board has refreshed.', detail = 'GUILD_QUEST_NOT_READY';
  end if;
  if (p_quest_kind = 'side' and not (p_quest_id = any(board.side_locked_ids))
      or p_quest_kind = 'main' and not (p_quest_id = any(board.main_locked_ids))) then
    raise exception using errcode = 'P0001', message = 'That Guild Quest is not locked.', detail = 'GUILD_QUEST_NOT_READY';
  end if;

  select * into existing_claim
  from public.guild_quest_claims
  where user_id = current_user_id
    and quest_kind = p_quest_kind
    and period_key = period_start
    and quest_id = p_quest_id;
  if found then
    select * into item from public.inventory_items where id = existing_claim.inventory_item_id;
    return loro_private.build_game_response(
      current_user_id,
      jsonb_build_object(
        'kind', 'guild-quest-reward-claimed',
        'questKind', p_quest_kind,
        'questId', p_quest_id,
        'coinReward', existing_claim.reward_coins,
        'xpReward', existing_claim.reward_xp,
        'lootItem', case when item.id is null then null else loro_private.inventory_item_json(item) end,
        'alreadyClaimed', true
      )
    );
  end if;

  progress := loro_private.guild_quest_progress(current_user_id, p_quest_id, period_start, period_end);
  if definition.metric = 'timed-and-one-time' then
    select count(*) filter (where node.quest_type = 'timed')::integer,
      count(*) filter (where node.quest_type = 'one-time')::integer
    into progress, secondary_progress
    from public.quest_completions completion
    join public.quest_nodes node on node.id = completion.node_id
    where completion.user_id = current_user_id
      and completion.completed_on >= period_start
      and completion.completed_on < period_end;
  end if;
  if progress < definition.target or secondary_progress < coalesce(definition.secondary_target, 0) then
    raise exception using errcode = 'P0001', message = 'Complete this Guild Quest before claiming its reward.', detail = 'GUILD_QUEST_NOT_READY';
  end if;

  reward_preview := case when p_quest_kind = 'side'
    then board.side_reward_previews -> p_quest_id
    else board.main_reward_previews -> p_quest_id
  end;
  preview_item_definition_id := reward_preview ->> 'itemDefinitionId';
  selected_rarity := reward_preview ->> 'rarity';
  if reward_preview is null
    or preview_item_definition_id is null
    or selected_rarity is null
    or (definition.item_rarity_floor = 'epic' and selected_rarity not in ('epic', 'legendary'))
    or (definition.item_rarity_floor = 'rare' and selected_rarity not in ('rare', 'epic', 'legendary')) then
    raise exception using errcode = 'P0001', message = 'Guild Quest reward preview is unavailable.', detail = 'GUILD_QUEST_NOT_READY';
  end if;

  select * into player from public.profiles where id = current_user_id for update;
  if not found then
    raise exception using errcode = 'P0001', message = 'Player profile not found.', detail = 'PROFILE_NOT_FOUND';
  end if;

  select equipment_item.* into equipment
  from public.equipment_items equipment_item
  where equipment_item.id = preview_item_definition_id;
  if not found then raise exception 'No equipment items are available for Guild rewards.'; end if;
  primary_bonus := case selected_rarity when 'rare' then 2 when 'epic' then 3 else 4 end;
  secondary_bonus := case selected_rarity when 'rare' then 1 when 'epic' then 2 else 3 end;
  rolled_stats := jsonb_build_object(equipment.primary_stat, primary_bonus);
  if secondary_bonus > 0 then
    rolled_stats := rolled_stats || jsonb_build_object(equipment.secondary_stat, secondary_bonus);
  end if;

  insert into public.inventory_items (
    user_id, equipment_item_id, rarity, stats, acquired_at,
    source_completion_id, source_guild_quest_id, source_guild_period_key
  ) values (
    current_user_id, equipment.id, selected_rarity, rolled_stats, action_time,
    null, p_quest_id, period_start
  ) returning * into item;

  player_level := player.level;
  player_xp := player.xp + definition.reward_xp;
  player_xp_target := player.xp_to_next_level;
  while player_xp >= player_xp_target loop
    player_xp := player_xp - player_xp_target;
    player_level := player_level + 1;
    player_xp_target := round(player_xp_target * 1.25);
  end loop;

  update public.profiles
  set level = player_level,
      xp = player_xp,
      xp_to_next_level = player_xp_target,
      coins = coins + definition.reward_coins,
      updated_at = action_time
  where id = current_user_id;

  insert into public.guild_quest_claims (
    user_id, quest_kind, period_key, quest_id, claimed_at,
    reward_coins, reward_xp, inventory_item_id
  ) values (
    current_user_id, p_quest_kind, period_start, p_quest_id, action_time,
    definition.reward_coins, definition.reward_xp, item.id
  );

  return loro_private.build_game_response(
    current_user_id,
    jsonb_build_object(
      'kind', 'guild-quest-reward-claimed',
      'questKind', p_quest_kind,
      'questId', p_quest_id,
      'coinReward', definition.reward_coins,
      'xpReward', definition.reward_xp,
      'lootItem', loro_private.inventory_item_json(item),
      'alreadyClaimed', false
    )
  );
end;
$$;

alter table public.guild_quest_definitions enable row level security;
alter table public.guild_quest_boards enable row level security;
alter table public.guild_quest_claims enable row level security;

revoke all on public.guild_quest_definitions, public.guild_quest_boards, public.guild_quest_claims
from anon, authenticated;

revoke execute on function public.accept_guild_quest(text, text, jsonb) from public, anon;
revoke execute on function public.claim_guild_quest_reward(text, text) from public, anon;
grant execute on function public.accept_guild_quest(text, text, jsonb) to authenticated;
grant execute on function public.claim_guild_quest_reward(text, text) to authenticated;
