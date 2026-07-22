alter table public.profiles
add column set_collection_order text[] not null default '{}';

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
  next_set_collection_order text[];
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

  next_set_collection_order := current_profile.set_collection_order;
  if p_profile_fields ? 'setCollectionOrder' then
    if jsonb_typeof(p_profile_fields -> 'setCollectionOrder') <> 'array' then
      raise exception using errcode = 'P0001', message = 'Set collection order is invalid.', detail = 'INVALID_SET_ORDER';
    end if;

    if exists (
      select 1
      from jsonb_array_elements_text(p_profile_fields -> 'setCollectionOrder') as requested(set_id)
      where requested.set_id is null
         or not exists (
           select 1
           from public.equipment_sets set_definition
           where set_definition.id = requested.set_id
         )
    ) then
      raise exception using errcode = 'P0001', message = 'Set collection order is invalid.', detail = 'INVALID_SET_ORDER';
    end if;

    if exists (
      select requested.set_id
      from jsonb_array_elements_text(p_profile_fields -> 'setCollectionOrder') as requested(set_id)
      group by requested.set_id
      having count(*) > 1
    ) then
      raise exception using errcode = 'P0001', message = 'Set collection order is invalid.', detail = 'INVALID_SET_ORDER';
    end if;

    select coalesce(array_agg(candidate.set_id order by candidate.position), '{}'::text[])
    into next_set_collection_order
    from (
      select requested.set_id, requested.position
      from jsonb_array_elements_text(p_profile_fields -> 'setCollectionOrder')
        with ordinality as requested(set_id, position)
      union all
      select set_definition.id,
        1000000 + row_number() over (order by set_definition.id)
      from public.equipment_sets set_definition
      where not exists (
        select 1
        from jsonb_array_elements_text(p_profile_fields -> 'setCollectionOrder') as requested(set_id)
        where requested.set_id = set_definition.id
      )
    ) candidate;
  end if;

  update public.profiles
  set display_name = next_display_name,
      avatar_class_id = next_avatar_class_id,
      avatar_variant = next_avatar_variant,
      set_collection_order = next_set_collection_order,
      updated_at = now()
  where id = current_user_id;

  return loro_private.build_game_response(
    current_user_id,
    jsonb_build_object('kind', 'profile-updated')
  );
end;
$$;

create or replace function loro_private.build_game_snapshot(target_user_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with base as (
    select jsonb_set(
      loro_private.build_game_snapshot_without_equipment(target_user_id),
      '{profile,setCollectionOrder}',
      coalesce((
        select to_jsonb(profile.set_collection_order)
        from public.profiles profile
        where profile.id = target_user_id
      ), '[]'::jsonb)
    ) as snapshot
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
