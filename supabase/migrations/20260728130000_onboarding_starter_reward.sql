-- Add the bounded introductory quest reward without rewriting the applied
-- onboarding persistence migration. The reward is fixed server-side and is
-- never accepted from the client payload.

begin;

alter table public.guest_onboarding_imports
  add column reward_coins integer not null default 0 check (reward_coins >= 0),
  add column reward_xp integer not null default 0 check (reward_xp >= 0),
  add column reward_shields integer not null default 0 check (reward_shields >= 0);

alter function public.complete_guest_onboarding(uuid, text, jsonb, text, boolean)
  rename to complete_guest_onboarding_base;

alter function public.complete_guest_onboarding_base(uuid, text, jsonb, text, boolean) owner to postgres;
revoke execute on function public.complete_guest_onboarding_base(uuid, text, jsonb, text, boolean)
  from public, anon, authenticated;

create function public.complete_guest_onboarding(
  p_import_id uuid,
  p_source text,
  p_habit_ids jsonb,
  p_first_habit_id text,
  p_skipped_for_now boolean,
  p_onboarding_quest_completed boolean
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := loro_private.require_user();
  stored_import public.guest_onboarding_imports%rowtype;
  base_result jsonb;
  fixed_reward_coins constant integer := 10;
  fixed_reward_xp constant integer := 10;
  fixed_reward_shields constant integer := 1;
  player_level integer;
  player_xp integer;
  player_xp_target integer;
begin
  if p_import_id is null then
    raise exception using errcode = 'P0001', message = 'Onboarding import id is required.', detail = 'INVALID_RESPONSE';
  end if;

  if p_source not in ('direct-signup', 'guest-migration') then
    raise exception using errcode = 'P0001', message = 'Onboarding source is invalid.', detail = 'INVALID_RESPONSE';
  end if;

  if not p_onboarding_quest_completed then
    raise exception using errcode = 'P0001', message = 'Complete the introductory quest before importing onboarding progress.', detail = 'INTRO_QUEST_REQUIRED';
  end if;

  -- Serialize imports and the fixed reward against the authenticated profile.
  perform 1 from public.profiles where id = current_user_id for update;
  if not found then
    raise exception using errcode = 'P0001', message = 'Player profile not found.', detail = 'PROFILE_NOT_FOUND';
  end if;

  select * into stored_import
  from public.guest_onboarding_imports
  where user_id = current_user_id and import_id = p_import_id
  for update;

  if found then
    if stored_import.source <> p_source then
      raise exception using errcode = 'P0001', message = 'The onboarding source does not match the original import.', detail = 'INVALID_RESPONSE';
    end if;

    if not stored_import.reward_granted then
      select level, xp, xp_to_next_level
      into player_level, player_xp, player_xp_target
      from public.profiles
      where id = current_user_id;

      player_xp := player_xp + fixed_reward_xp;
      while player_xp >= player_xp_target loop
        player_xp := player_xp - player_xp_target;
        player_level := player_level + 1;
        player_xp_target := round(player_xp_target * 1.25);
      end loop;

      update public.profiles
      set coins = coins + fixed_reward_coins,
          streak_shields = streak_shields + fixed_reward_shields,
          level = player_level,
          xp = player_xp,
          xp_to_next_level = player_xp_target,
          updated_at = now()
      where id = current_user_id;

      update public.guest_onboarding_imports
      set reward_granted = true,
          reward_coins = fixed_reward_coins,
          reward_xp = fixed_reward_xp,
          reward_shields = fixed_reward_shields
      where user_id = current_user_id and import_id = p_import_id;

      stored_import.reward_granted := true;
      stored_import.reward_coins := fixed_reward_coins;
      stored_import.reward_xp := fixed_reward_xp;
      stored_import.reward_shields := fixed_reward_shields;
    end if;

    return jsonb_build_object(
      'kind', 'guest-onboarding-imported',
      'importId', stored_import.import_id,
      'source', stored_import.source,
      'alreadyImported', true,
      'enabledHabitIds', to_jsonb(stored_import.selected_habit_ids),
      'rewardGranted', stored_import.reward_granted,
      'starterReward', jsonb_build_object(
        'coins', stored_import.reward_coins,
        'xp', stored_import.reward_xp,
        'streakShields', stored_import.reward_shields
      )
    );
  end if;

  base_result := public.complete_guest_onboarding_base(
    p_import_id,
    p_source,
    p_habit_ids,
    p_first_habit_id,
    p_skipped_for_now
  );

  select level, xp, xp_to_next_level
  into player_level, player_xp, player_xp_target
  from public.profiles
  where id = current_user_id;

  player_xp := player_xp + fixed_reward_xp;
  while player_xp >= player_xp_target loop
    player_xp := player_xp - player_xp_target;
    player_level := player_level + 1;
    player_xp_target := round(player_xp_target * 1.25);
  end loop;

  update public.profiles
  set coins = coins + fixed_reward_coins,
      streak_shields = streak_shields + fixed_reward_shields,
      level = player_level,
      xp = player_xp,
      xp_to_next_level = player_xp_target,
      updated_at = now()
  where id = current_user_id;

  update public.guest_onboarding_imports
  set reward_granted = true,
      reward_coins = fixed_reward_coins,
      reward_xp = fixed_reward_xp,
      reward_shields = fixed_reward_shields
  where user_id = current_user_id and import_id = p_import_id;

  return base_result || jsonb_build_object(
    'rewardGranted', true,
    'starterReward', jsonb_build_object(
      'coins', fixed_reward_coins,
      'xp', fixed_reward_xp,
      'streakShields', fixed_reward_shields
    )
  );
end;
$$;

alter function public.complete_guest_onboarding(uuid, text, jsonb, text, boolean, boolean) owner to postgres;
revoke execute on function public.complete_guest_onboarding(uuid, text, jsonb, text, boolean, boolean)
  from public, anon;
grant execute on function public.complete_guest_onboarding(uuid, text, jsonb, text, boolean, boolean)
  to authenticated;

-- Preserve the original five-argument RPC for older clients while routing it
-- through the same fixed-reward implementation.
create function public.complete_guest_onboarding(
  p_import_id uuid,
  p_source text,
  p_habit_ids jsonb,
  p_first_habit_id text default null,
  p_skipped_for_now boolean default false
)
returns jsonb
language sql
security definer
set search_path = ''
as $$
  select public.complete_guest_onboarding(
    p_import_id,
    p_source,
    p_habit_ids,
    p_first_habit_id,
    p_skipped_for_now,
    true
  );
$$;

alter function public.complete_guest_onboarding(uuid, text, jsonb, text, boolean) owner to postgres;
revoke execute on function public.complete_guest_onboarding(uuid, text, jsonb, text, boolean)
  from public, anon;
grant execute on function public.complete_guest_onboarding(uuid, text, jsonb, text, boolean)
  to authenticated;

commit;
