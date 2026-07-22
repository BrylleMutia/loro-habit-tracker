create table public.equipment_discoveries (
  user_id uuid not null references auth.users (id) on delete cascade,
  equipment_item_id text not null references public.equipment_items (id) on delete restrict,
  first_discovered_at timestamptz not null default now(),
  primary key (user_id, equipment_item_id)
);

create index equipment_discoveries_user_id_idx
on public.equipment_discoveries (user_id);

insert into public.equipment_discoveries (
  user_id,
  equipment_item_id,
  first_discovered_at
)
select
  inventory.user_id,
  inventory.equipment_item_id,
  min(inventory.acquired_at)
from public.inventory_items inventory
group by inventory.user_id, inventory.equipment_item_id
on conflict (user_id, equipment_item_id) do nothing;

alter table public.equipment_discoveries enable row level security;

create policy "users can read their equipment discoveries"
on public.equipment_discoveries
for select
to authenticated
using ((select auth.uid()) = user_id);

revoke all on public.equipment_discoveries from anon, authenticated;
grant select on public.equipment_discoveries to authenticated;

create or replace function loro_private.record_equipment_discovery()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.equipment_discoveries (
    user_id,
    equipment_item_id,
    first_discovered_at
  )
  values (
    new.user_id,
    new.equipment_item_id,
    new.acquired_at
  )
  on conflict (user_id, equipment_item_id) do nothing;

  return new;
end;
$$;

drop trigger if exists record_equipment_discovery_after_inventory_insert
on public.inventory_items;

create trigger record_equipment_discovery_after_inventory_insert
after insert on public.inventory_items
for each row execute function loro_private.record_equipment_discovery();

revoke execute on function loro_private.record_equipment_discovery() from public, anon, authenticated;

create or replace function loro_private.build_game_snapshot(target_user_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with base as (
    select loro_private.build_game_snapshot_without_equipment(target_user_id) as snapshot
  ),
  equipped as (
    select jsonb_set(
      base.snapshot,
      '{profile,equippedItemIds}',
      coalesce((
        select jsonb_agg(coalesce(inventory.id::text, '') order by slot.sort_order)
        from public.equipment_slots slot
        left join public.inventory_items inventory
          on inventory.user_id = target_user_id
         and inventory.equipped_slot = slot.id
      ), '[]'::jsonb)
    ) as snapshot
    from base
  )
  select jsonb_set(
    equipped.snapshot,
    '{inventory}',
    ((equipped.snapshot -> 'inventory') - 'ownedItemIds') || jsonb_build_object(
      'items', coalesce((
        select jsonb_agg(
          loro_private.inventory_item_json(inventory)
          order by inventory.acquired_at, inventory.id
        )
        from public.inventory_items inventory
        where inventory.user_id = target_user_id
      ), '[]'::jsonb),
      'discoveredItemDefinitionIds', coalesce((
        select jsonb_agg(
          discovery.equipment_item_id
          order by discovery.equipment_item_id
        )
        from public.equipment_discoveries discovery
        where discovery.user_id = target_user_id
      ), '[]'::jsonb)
    )
  )
  from equipped;
$$;
