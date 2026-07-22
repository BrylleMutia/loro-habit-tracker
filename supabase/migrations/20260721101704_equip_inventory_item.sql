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
      ), '[]'::jsonb)
    )
  )
  from equipped;
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

create or replace function public.equip_inventory_item(p_item_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := loro_private.require_user();
  target_item public.inventory_items%rowtype;
  target_slot text;
begin
  select *
  into target_item
  from public.inventory_items item
  where item.id = p_item_id
    and item.user_id = current_user_id
  for update;

  if not found then
    raise exception using
      errcode = 'P0001',
      message = 'That item is not in your inventory.',
      detail = 'ITEM_NOT_OWNED';
  end if;

  select definition.slot_id
  into target_slot
  from public.equipment_items definition
  where definition.id = target_item.equipment_item_id;

  if target_slot is null then
    raise exception using
      errcode = 'P0001',
      message = 'That equipment slot is not available.',
      detail = 'INVALID_EQUIPMENT_SLOT';
  end if;

  if target_item.equipped_slot = target_slot then
    update public.inventory_items
    set equipped_slot = null
    where id = target_item.id and user_id = current_user_id;
  else
    update public.inventory_items
    set equipped_slot = null
    where user_id = current_user_id and equipped_slot = target_slot;

    update public.inventory_items
    set equipped_slot = target_slot
    where id = target_item.id and user_id = current_user_id;
  end if;

  return loro_private.build_game_response(
    current_user_id,
    jsonb_build_object(
      'kind', 'equipment-updated',
      'itemId', case when target_item.equipped_slot = target_slot then null else target_item.id::text end,
      'slotId', target_slot
    )
  );
end;
$$;

revoke execute on function public.equip_inventory_item(uuid) from public, anon;
grant execute on function public.equip_inventory_item(uuid) to authenticated;
