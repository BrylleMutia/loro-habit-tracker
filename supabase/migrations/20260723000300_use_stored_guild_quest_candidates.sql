begin;

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
  stored_side_reward_previews jsonb := '{}'::jsonb;
  stored_main_reward_previews jsonb := '{}'::jsonb;
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
    side_candidates := board.side_candidate_ids;
    main_candidates := board.main_candidate_ids;
    side_locked := board.side_locked_ids;
    main_locked := board.main_locked_ids;
    stored_side_reward_previews := board.side_reward_previews;
    stored_main_reward_previews := board.main_reward_previews;
  end if;

  if p_quest_kind = 'side' then
    if not (p_quest_id = any(side_candidates)) then
      raise exception using errcode = 'P0001', message = 'That Side Quest is not on this board.', detail = 'GUILD_QUEST_INVALID_SELECTION';
    end if;
    if p_quest_id = any(side_locked) or cardinality(side_locked) >= 2 then
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

commit;
