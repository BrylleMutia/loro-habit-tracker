begin;

create table public.shop_item_definitions (
  id text primary key check (id in ('streak-shield', 'energy-elixir', 'xp-charm')),
  price_coins integer not null check (price_coins >= 0),
  weekly_limit integer not null check (weekly_limit > 0),
  effect_uses integer not null default 0 check (effect_uses >= 0),
  active boolean not null default true
);

insert into public.shop_item_definitions (id, price_coins, weekly_limit, effect_uses)
values
  ('streak-shield', 200, 3, 1),
  ('energy-elixir', 150, 3, 3),
  ('xp-charm', 150, 3, 3);

create table public.shop_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  shop_item_id text not null references public.shop_item_definitions (id) on delete restrict,
  period_key date not null,
  price_coins integer not null check (price_coins >= 0),
  idempotency_key uuid not null,
  purchased_at timestamptz not null default now(),
  unique (user_id, idempotency_key)
);

create index shop_purchases_user_period_item_idx
on public.shop_purchases (user_id, period_key, shop_item_id, purchased_at desc);

alter table public.active_buffs
  add column remaining_uses integer not null default 0 check (remaining_uses >= 0);

create or replace function loro_private.shop_period_key(
  target_user_id uuid,
  target_time timestamptz default now()
)
returns date
language sql
stable
security definer
set search_path = ''
as $$
  select (
    loro_private.local_date(target_user_id, target_time)
    - extract(dow from loro_private.local_date(target_user_id, target_time))::integer
  );
$$;

create or replace function loro_private.shop_period_expires_at(
  target_user_id uuid,
  target_time timestamptz default now()
)
returns timestamptz
language sql
stable
security definer
set search_path = ''
as $$
  select (
    (loro_private.shop_period_key(target_user_id, target_time) + 7)::timestamp
    at time zone settings.time_zone
  )
  from public.user_settings settings
  where settings.user_id = target_user_id;
$$;

create or replace function loro_private.shop_status_json(target_user_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with current_period as (
    select loro_private.shop_period_key(target_user_id) as period_key
  ),
  item_status as (
    select
      definition.id,
      definition.price_coins,
      definition.weekly_limit,
      count(purchase.id)::integer as purchases_this_period
    from public.shop_item_definitions definition
    cross join current_period
    left join public.shop_purchases purchase
      on purchase.shop_item_id = definition.id
     and purchase.user_id = target_user_id
     and purchase.period_key = current_period.period_key
    where definition.active
    group by definition.id, definition.price_coins, definition.weekly_limit
  )
  select jsonb_build_object(
    'periodKey', current_period.period_key,
    'items', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', item_status.id,
          'priceCoins', item_status.price_coins,
          'purchasesThisPeriod', item_status.purchases_this_period,
          'remainingPurchases', greatest(
            item_status.weekly_limit - item_status.purchases_this_period,
            0
          ),
          'weeklyLimit', item_status.weekly_limit
        )
        order by item_status.id
      )
      from item_status
    ), '[]'::jsonb)
  )
  from current_period;
$$;

alter function loro_private.build_game_snapshot(uuid)
  rename to build_game_snapshot_without_shop;

create function loro_private.build_game_snapshot(target_user_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with base as (
    select loro_private.build_game_snapshot_without_shop(target_user_id) as snapshot
  ),
  active_buffs as (
    select coalesce(jsonb_agg(
      jsonb_build_object(
        'id', buff.buff_id,
        'label', buff.label,
        'expiresAt', buff.expires_at,
        'remainingUses', buff.remaining_uses
      )
      order by buff.expires_at
    ), '[]'::jsonb) as value
    from public.active_buffs buff
    where buff.user_id = target_user_id
      and buff.expires_at > now()
      and (buff.buff_id <> 'xp-charm' or buff.remaining_uses > 0)
  )
  select jsonb_set(
    jsonb_set(base.snapshot, '{inventory,activeBuffs}', active_buffs.value),
    '{shop}',
    loro_private.shop_status_json(target_user_id)
  )
  from base
  cross join active_buffs;
$$;

alter function public.start_daily_quest(text)
  rename to start_daily_quest_without_shop_refill;

revoke execute on function public.start_daily_quest_without_shop_refill(text)
  from public, anon, authenticated;

create function public.start_daily_quest(p_habit_id text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := loro_private.require_user();
  action_time timestamptz := now();
  player public.profiles%rowtype;
  effective_energy integer;
begin
  select * into player
  from public.profiles
  where id = current_user_id
  for update;

  if not found then
    raise exception using errcode = 'P0001', message = 'Player profile not found.', detail = 'PROFILE_NOT_FOUND';
  end if;

  effective_energy := least(
    player.energy_max,
    player.energy_current + case
      when player.last_energy_refill_at is not null
      then floor(extract(epoch from (action_time - player.last_energy_refill_at)) / 1800)::integer
      else 0
    end
  );

  update public.profiles
  set energy_current = effective_energy,
      last_energy_refill_at = action_time,
      updated_at = action_time
  where id = current_user_id;

  return public.start_daily_quest_without_shop_refill(p_habit_id);
end;
$$;

create or replace function public.purchase_shop_item(
  p_shop_item_id text,
  p_idempotency_key uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := loro_private.require_user();
  action_time timestamptz := now();
  current_period_key date;
  definition public.shop_item_definitions%rowtype;
  existing_purchase public.shop_purchases%rowtype;
  player public.profiles%rowtype;
  purchase_count integer;
  effective_energy integer;
  active_xp_uses integer := 0;
  purchase_expiry timestamptz;
begin
  if p_idempotency_key is null then
    raise exception using
      errcode = 'P0001',
      message = 'The shop action could not be identified safely.',
      detail = 'INVALID_SHOP_IDEMPOTENCY_KEY';
  end if;

  select * into player
  from public.profiles
  where id = current_user_id
  for update;

  if not found then
    raise exception using errcode = 'P0001', message = 'Player profile not found.', detail = 'PROFILE_NOT_FOUND';
  end if;

  select * into existing_purchase
  from public.shop_purchases purchase
  where purchase.user_id = current_user_id
    and purchase.idempotency_key = p_idempotency_key
  for update;

  if found then
    if existing_purchase.shop_item_id <> p_shop_item_id then
      raise exception using
        errcode = 'P0001',
        message = 'That shop action is already linked to another item.',
        detail = 'SHOP_IDEMPOTENCY_CONFLICT';
    end if;

    select * into definition
    from public.shop_item_definitions item
    where item.id = existing_purchase.shop_item_id;

    current_period_key := loro_private.shop_period_key(current_user_id, action_time);
    select count(*)::integer into purchase_count
    from public.shop_purchases purchase
    where purchase.user_id = current_user_id
      and purchase.shop_item_id = existing_purchase.shop_item_id
      and purchase.period_key = current_period_key;

    select buff.remaining_uses into active_xp_uses
    from public.active_buffs buff
    where buff.user_id = current_user_id
      and buff.buff_id = 'xp-charm'
      and buff.expires_at > action_time
      and buff.remaining_uses > 0
    limit 1;
    active_xp_uses := coalesce(active_xp_uses, 0);

    return loro_private.build_game_response(
      current_user_id,
      jsonb_build_object(
        'kind', 'shop-purchased',
        'activeXpUses', active_xp_uses,
        'alreadyProcessed', true,
        'itemId', existing_purchase.shop_item_id,
        'priceCoins', existing_purchase.price_coins,
        'purchasesThisPeriod', purchase_count,
        'remainingPurchases', greatest(definition.weekly_limit - purchase_count, 0)
      )
    );
  end if;

  select * into definition
  from public.shop_item_definitions item
  where item.id = p_shop_item_id
    and item.active;

  if not found then
    raise exception using
      errcode = 'P0001',
      message = 'That shop item is no longer available.',
      detail = 'SHOP_ITEM_NOT_FOUND';
  end if;

  current_period_key := loro_private.shop_period_key(current_user_id, action_time);
  select count(*)::integer into purchase_count
  from public.shop_purchases purchase
  where purchase.user_id = current_user_id
    and purchase.shop_item_id = p_shop_item_id
    and purchase.period_key = current_period_key;

  if purchase_count >= definition.weekly_limit then
    raise exception using
      errcode = 'P0001',
      message = 'You have reached this item''s limit for the week.',
      detail = 'SHOP_WEEKLY_LIMIT_REACHED';
  end if;

  if player.coins < definition.price_coins then
    raise exception using
      errcode = 'P0001',
      message = 'You need more coins for that shop item.',
      detail = 'INSUFFICIENT_COINS';
  end if;

  effective_energy := least(
    player.energy_max,
    player.energy_current + case
      when player.last_energy_refill_at is not null
      then floor(extract(epoch from (action_time - player.last_energy_refill_at)) / 1800)::integer
      else 0
    end
  );

  if p_shop_item_id = 'energy-elixir' and effective_energy >= player.energy_max then
    raise exception using
      errcode = 'P0001',
      message = 'Your energy is already full.',
      detail = 'ENERGY_FULL';
  end if;

  update public.profiles
  set coins = coins - definition.price_coins,
      energy_current = case
        when p_shop_item_id = 'energy-elixir'
        then least(energy_max, effective_energy + definition.effect_uses)
        else energy_current
      end,
      last_energy_refill_at = case
        when p_shop_item_id = 'energy-elixir' then action_time
        else last_energy_refill_at
      end,
      streak_shields = streak_shields + case
        when p_shop_item_id = 'streak-shield' then definition.effect_uses
        else 0
      end,
      updated_at = action_time
  where id = current_user_id;

  if p_shop_item_id = 'xp-charm' then
    purchase_expiry := loro_private.shop_period_expires_at(current_user_id, action_time);
    select buff.remaining_uses into active_xp_uses
    from public.active_buffs buff
    where buff.user_id = current_user_id
      and buff.buff_id = 'xp-charm'
      and buff.expires_at > action_time
    for update;
    active_xp_uses := coalesce(active_xp_uses, 0) + definition.effect_uses;

    insert into public.active_buffs (user_id, buff_id, label, expires_at, remaining_uses)
    values (current_user_id, 'xp-charm', 'XP Charm', purchase_expiry, active_xp_uses)
    on conflict (user_id, buff_id) do update
      set label = excluded.label,
          expires_at = excluded.expires_at,
          remaining_uses = excluded.remaining_uses;
  end if;

  insert into public.shop_purchases (
    user_id,
    shop_item_id,
    period_key,
    price_coins,
    idempotency_key,
    purchased_at
  ) values (
    current_user_id,
    p_shop_item_id,
    current_period_key,
    definition.price_coins,
    p_idempotency_key,
    action_time
  );

  if p_shop_item_id <> 'xp-charm' then
    select buff.remaining_uses into active_xp_uses
    from public.active_buffs buff
    where buff.user_id = current_user_id
      and buff.buff_id = 'xp-charm'
      and buff.expires_at > action_time
      and buff.remaining_uses > 0
    limit 1;
    active_xp_uses := coalesce(active_xp_uses, 0);
  end if;

  purchase_count := purchase_count + 1;
  return loro_private.build_game_response(
    current_user_id,
    jsonb_build_object(
      'kind', 'shop-purchased',
      'activeXpUses', active_xp_uses,
      'alreadyProcessed', false,
      'itemId', p_shop_item_id,
      'priceCoins', definition.price_coins,
      'purchasesThisPeriod', purchase_count,
      'remainingPurchases', greatest(definition.weekly_limit - purchase_count, 0)
    )
  );
end;
$$;

alter function public.complete_daily_quest(text)
  rename to complete_daily_quest_without_xp_charm;

revoke execute on function public.complete_daily_quest_without_xp_charm(text)
  from public, anon, authenticated;

create function public.complete_daily_quest(p_habit_id text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := loro_private.require_user();
  action_time timestamptz := now();
  base_response jsonb;
  base_outcome jsonb;
  current_date_key date;
  base_xp integer;
  active_xp_uses integer := 0;
  player public.profiles%rowtype;
  progress public.habit_progress%rowtype;
  effective_energy integer;
  player_level integer;
  player_xp integer;
  player_xp_target integer;
  habit_level integer;
  habit_xp integer;
  habit_xp_target integer;
  activity_id uuid;
begin
  select * into player
  from public.profiles
  where id = current_user_id
  for update;

  if not found then
    raise exception using errcode = 'P0001', message = 'Player profile not found.', detail = 'PROFILE_NOT_FOUND';
  end if;

  effective_energy := least(
    player.energy_max,
    player.energy_current + case
      when player.last_energy_refill_at is not null
      then floor(extract(epoch from (action_time - player.last_energy_refill_at)) / 1800)::integer
      else 0
    end
  );

  update public.profiles
  set energy_current = effective_energy,
      last_energy_refill_at = action_time,
      updated_at = action_time
  where id = current_user_id;

  base_response := public.complete_daily_quest_without_xp_charm(p_habit_id);
  base_outcome := base_response -> 'outcome';

  if coalesce((base_outcome ->> 'alreadyCompleted')::boolean, false) then
    return base_response;
  end if;

  current_date_key := loro_private.local_date(current_user_id, action_time);
  select buff.remaining_uses into active_xp_uses
  from public.active_buffs buff
  where buff.user_id = current_user_id
    and buff.buff_id = 'xp-charm'
    and buff.expires_at > action_time
    and buff.remaining_uses > 0
  for update;

  active_xp_uses := coalesce(active_xp_uses, 0);
  if active_xp_uses <= 0 then
    return base_response;
  end if;

  base_xp := (base_outcome ->> 'xpReward')::integer;

  select * into player
  from public.profiles
  where id = current_user_id
  for update;

  player_level := player.level;
  player_xp := player.xp + base_xp;
  player_xp_target := player.xp_to_next_level;
  while player_xp >= player_xp_target loop
    player_xp := player_xp - player_xp_target;
    player_level := player_level + 1;
    player_xp_target := round(player_xp_target * 1.25);
  end loop;

  select * into progress
  from public.habit_progress
  where user_id = current_user_id and habit_id = p_habit_id
  for update;

  habit_level := progress.level;
  habit_xp := progress.xp + base_xp;
  habit_xp_target := habit_level * 100;
  while habit_xp >= habit_xp_target loop
    habit_xp := habit_xp - habit_xp_target;
    habit_level := habit_level + 1;
    habit_xp_target := habit_level * 100;
  end loop;

  update public.profiles
  set level = player_level,
      xp = player_xp,
      xp_to_next_level = player_xp_target,
      updated_at = action_time
  where id = current_user_id;

  update public.habit_progress
  set level = habit_level,
      xp = habit_xp,
      updated_at = action_time
  where user_id = current_user_id and habit_id = p_habit_id;

  update public.quest_completions
  set reward_xp = reward_xp + base_xp
  where user_id = current_user_id
    and habit_id = p_habit_id
    and node_id = (base_outcome ->> 'nodeId')
    and completed_on = current_date_key;

  select activity.id into activity_id
  from public.activity_log activity
  where activity.user_id = current_user_id
    and activity.activity_type = 'daily-quest'
    and activity.habit_id = p_habit_id
    and activity.node_id = (base_outcome ->> 'nodeId')
  order by activity.occurred_at desc
  limit 1;

  if activity_id is not null then
    update public.activity_log
    set xp_earned = xp_earned + base_xp
    where id = activity_id;
  end if;

  if active_xp_uses = 1 then
    delete from public.active_buffs
    where user_id = current_user_id and buff_id = 'xp-charm';
  else
    update public.active_buffs
    set remaining_uses = active_xp_uses - 1
    where user_id = current_user_id and buff_id = 'xp-charm';
  end if;

  return loro_private.build_game_response(
    current_user_id,
    jsonb_set(
      base_outcome,
      '{xpReward}',
      to_jsonb(base_xp * 2)
    )
  );
end;
$$;

alter function public.purchase_shop_item(text, uuid) owner to postgres;
alter function public.complete_daily_quest(text) owner to postgres;

alter table public.shop_item_definitions enable row level security;
alter table public.shop_purchases enable row level security;

create policy "authenticated users can read shop catalog"
on public.shop_item_definitions for select to authenticated using (active);

create policy "users can read their shop purchases"
on public.shop_purchases for select to authenticated
using ((select auth.uid()) = user_id);

revoke all on public.shop_item_definitions, public.shop_purchases
from anon, authenticated;
grant select on public.shop_item_definitions to authenticated;
grant select on public.shop_purchases to authenticated;

revoke execute on function public.purchase_shop_item(text, uuid)
  from public, anon;
grant execute on function public.purchase_shop_item(text, uuid) to authenticated;

revoke execute on function public.complete_daily_quest(text)
  from public, anon;
grant execute on function public.complete_daily_quest(text) to authenticated;

revoke execute on function public.start_daily_quest(text)
  from public, anon;
grant execute on function public.start_daily_quest(text) to authenticated;

revoke execute on function loro_private.shop_period_key(uuid, timestamptz)
  from public, anon, authenticated;
revoke execute on function loro_private.shop_period_expires_at(uuid, timestamptz)
  from public, anon, authenticated;
revoke execute on function loro_private.shop_status_json(uuid)
  from public, anon, authenticated;
revoke execute on function loro_private.build_game_snapshot(uuid)
  from public, anon, authenticated;

commit;
