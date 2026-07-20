create table public.equipment_sets (
  id text primary key,
  name text not null unique,
  description text not null
);

create table public.equipment_items (
  id text primary key,
  set_id text not null references public.equipment_sets (id) on delete restrict,
  slot_id text not null references public.equipment_slots (id) on delete restrict,
  name text not null,
  asset_key text not null unique,
  primary_stat text not null check (
    primary_stat in ('strength', 'agility', 'intelligence', 'defense', 'vitality', 'luck')
  ),
  secondary_stat text not null check (
    secondary_stat in ('strength', 'agility', 'intelligence', 'defense', 'vitality', 'luck')
  ),
  unique (set_id, slot_id)
);

create table public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  equipment_item_id text not null references public.equipment_items (id) on delete restrict,
  rarity text not null check (rarity in ('common', 'uncommon', 'rare', 'epic', 'legendary')),
  stats jsonb not null check (jsonb_typeof(stats) = 'object'),
  acquired_at timestamptz not null default now(),
  source_completion_id uuid not null unique references public.quest_completions (id) on delete cascade,
  equipped_slot text references public.equipment_slots (id) on delete restrict
);

create index inventory_items_user_id_acquired_at_idx
on public.inventory_items (user_id, acquired_at desc);

create unique index inventory_items_user_equipped_slot_unique
on public.inventory_items (user_id, equipped_slot)
where equipped_slot is not null;

insert into public.equipment_sets (id, name, description)
values (
  'verdant-wayfinder',
  'Verdant Wayfinder Set',
  'A practical explorer set for players beginning their adventure.'
);

insert into public.equipment_items (
  id, set_id, slot_id, name, asset_key, primary_stat, secondary_stat
)
values
  ('verdant-wayfinder-helmet', 'verdant-wayfinder', 'helmet', 'Wayfinder Cap', 'verdant-wayfinder-helmet', 'intelligence', 'luck'),
  ('verdant-wayfinder-chest', 'verdant-wayfinder', 'chest', 'Trailbound Tunic', 'verdant-wayfinder-chest', 'defense', 'vitality'),
  ('verdant-wayfinder-cape', 'verdant-wayfinder', 'cape', 'Verdant Travel Cape', 'verdant-wayfinder-cape', 'agility', 'luck'),
  ('verdant-wayfinder-gloves', 'verdant-wayfinder', 'gloves', 'Wayfinder Gloves', 'verdant-wayfinder-gloves', 'strength', 'agility'),
  ('verdant-wayfinder-boots', 'verdant-wayfinder', 'boots', 'Trailwalker Boots', 'verdant-wayfinder-boots', 'agility', 'vitality'),
  ('verdant-wayfinder-weapon', 'verdant-wayfinder', 'weapon', 'Compass Staff', 'verdant-wayfinder-weapon', 'strength', 'intelligence'),
  ('verdant-wayfinder-bag', 'verdant-wayfinder', 'bag', 'Wayfinder Pack', 'verdant-wayfinder-bag', 'vitality', 'luck'),
  ('verdant-wayfinder-buddy', 'verdant-wayfinder', 'buddy', 'Compass Wisp', 'verdant-wayfinder-buddy', 'intelligence', 'luck');

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
    'sourceDateKey', completion.completed_on
  )
  from public.equipment_items definition
  join public.equipment_sets equipment_set on equipment_set.id = definition.set_id
  join public.quest_completions completion on completion.id = target_item.source_completion_id
  where definition.id = target_item.equipment_item_id;
$$;

create or replace function loro_private.grant_quest_loot()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  definition public.equipment_items%rowtype;
  rarity_roll double precision := random() * 100;
  selected_rarity text;
  primary_bonus integer;
  secondary_bonus integer;
  rolled_stats jsonb;
begin
  select item.*
  into definition
  from public.equipment_items item
  order by random()
  limit 1;

  if not found then
    raise exception 'No equipment items are available for loot drops.';
  end if;

  if rarity_roll < 50 then
    selected_rarity := 'common';
    primary_bonus := 1;
    secondary_bonus := 0;
  elsif rarity_roll < 78 then
    selected_rarity := 'uncommon';
    primary_bonus := 1;
    secondary_bonus := 1;
  elsif rarity_roll < 93 then
    selected_rarity := 'rare';
    primary_bonus := 2;
    secondary_bonus := 1;
  elsif rarity_roll < 98 then
    selected_rarity := 'epic';
    primary_bonus := 3;
    secondary_bonus := 2;
  else
    selected_rarity := 'legendary';
    primary_bonus := 4;
    secondary_bonus := 3;
  end if;

  rolled_stats := jsonb_build_object(definition.primary_stat, primary_bonus);
  if secondary_bonus > 0 then
    rolled_stats := rolled_stats || jsonb_build_object(definition.secondary_stat, secondary_bonus);
  end if;

  insert into public.inventory_items (
    user_id,
    equipment_item_id,
    rarity,
    stats,
    acquired_at,
    source_completion_id
  )
  values (
    new.user_id,
    definition.id,
    selected_rarity,
    rolled_stats,
    new.completed_at,
    new.id
  );

  return new;
end;
$$;

drop trigger if exists grant_quest_loot_after_completion on public.quest_completions;
create trigger grant_quest_loot_after_completion
after insert on public.quest_completions
for each row execute function loro_private.grant_quest_loot();

alter function loro_private.build_game_snapshot(uuid)
rename to build_game_snapshot_without_equipment;

create function loro_private.build_game_snapshot(target_user_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with base as (
    select loro_private.build_game_snapshot_without_equipment(target_user_id) as snapshot
  )
  select jsonb_set(
    base.snapshot,
    '{inventory}',
    ((base.snapshot -> 'inventory') - 'ownedItemIds') || jsonb_build_object(
      'items', coalesce((
        select jsonb_agg(
          loro_private.inventory_item_json(inventory)
          order by inventory.acquired_at, inventory.id
        )
        from public.inventory_items inventory
        where inventory.user_id = target_user_id
      ), '[]'::jsonb)
    )
  )
  from base;
$$;

create or replace function loro_private.build_game_response(
  target_user_id uuid,
  action_outcome jsonb
)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'snapshot', loro_private.build_game_snapshot(target_user_id),
    'outcome', action_outcome,
    'serverNow', now(),
    'localDateKey', loro_private.local_date(target_user_id)
  );
$$;

alter table public.equipment_sets enable row level security;
alter table public.equipment_items enable row level security;
alter table public.inventory_items enable row level security;

create policy "authenticated users can read equipment sets"
on public.equipment_sets for select to authenticated using (true);

create policy "authenticated users can read equipment items"
on public.equipment_items for select to authenticated using (true);

create policy "users can read their item instances"
on public.inventory_items for select to authenticated using ((select auth.uid()) = user_id);

revoke all on public.equipment_sets, public.equipment_items, public.inventory_items
from anon, authenticated;

grant select on public.equipment_sets, public.equipment_items, public.inventory_items
to authenticated;

revoke execute on function loro_private.inventory_item_json(public.inventory_items)
from public, anon, authenticated;

revoke execute on function loro_private.grant_quest_loot()
from public, anon, authenticated;
