-- IKEA-style onboarding/auth persistence.
-- Preferences and onboarding imports are server-owned so account creation cannot
-- manufacture rewards or copy an arbitrary local snapshot.

begin;

create table public.user_habit_preferences (
  user_id uuid not null references auth.users (id) on delete cascade,
  habit_id text not null references public.habit_definitions (id) on delete cascade,
  enabled boolean not null default true,
  sort_order smallint not null check (sort_order > 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, habit_id),
  unique (user_id, sort_order)
);

create index user_habit_preferences_user_order_idx
  on public.user_habit_preferences (user_id, sort_order);

create table public.guest_onboarding_imports (
  user_id uuid not null references auth.users (id) on delete cascade,
  import_id uuid not null,
  source text not null check (source in ('direct-signup', 'guest-migration')),
  selected_habit_ids text[] not null,
  first_habit_id text,
  skipped_for_now boolean not null default false,
  reward_granted boolean not null default false,
  imported_at timestamptz not null default now(),
  primary key (user_id, import_id),
  unique (user_id),
  constraint guest_onboarding_imports_first_habit_check
    check (first_habit_id is null or first_habit_id = any(selected_habit_ids))
);

alter table public.user_habit_preferences enable row level security;
alter table public.guest_onboarding_imports enable row level security;

create policy "users can read their habit preferences"
on public.user_habit_preferences for select to authenticated
using ((select auth.uid()) = user_id);

create policy "users can read their onboarding import"
on public.guest_onboarding_imports for select to authenticated
using ((select auth.uid()) = user_id);

revoke all on public.user_habit_preferences, public.guest_onboarding_imports from anon, authenticated;
grant select on public.user_habit_preferences, public.guest_onboarding_imports to authenticated;

-- Layer enabled habits onto the final composed snapshot while preserving all
-- existing equipment, Guild, passive-energy, target, and inventory fields.
alter function loro_private.build_game_snapshot(uuid)
  rename to build_game_snapshot_without_onboarding;

create function loro_private.build_game_snapshot(target_user_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_set(
    loro_private.build_game_snapshot_without_onboarding(target_user_id),
    '{enabledHabitIds}',
    coalesce(
      (
        select jsonb_agg(preference.habit_id order by preference.sort_order)
        from public.user_habit_preferences preference
        where preference.user_id = target_user_id
          and preference.enabled
      ),
      (
        select jsonb_agg(habit.id order by habit.sort_order)
        from public.habit_definitions habit
      )
    ),
    true
  );
$$;

alter function loro_private.build_game_snapshot(uuid) owner to postgres;
revoke execute on function loro_private.build_game_snapshot(uuid) from public, anon, authenticated;

create or replace function public.complete_guest_onboarding(
  p_import_id uuid,
  p_source text,
  p_habit_ids jsonb,
  p_first_habit_id text default null,
  p_skipped_for_now boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := loro_private.require_user();
  requested_habit_ids text[];
  stored_import public.guest_onboarding_imports%rowtype;
  chosen_first_habit_id text;
  valid_habit_count integer;
  requested_count integer;
  distinct_count integer;
  resolved_source text;
begin
  if p_import_id is null then
    raise exception using errcode = 'P0001', message = 'Onboarding import id is required.', detail = 'INVALID_RESPONSE';
  end if;

  if p_source not in ('direct-signup', 'guest-migration') then
    raise exception using errcode = 'P0001', message = 'Onboarding source is invalid.', detail = 'INVALID_RESPONSE';
  end if;

  -- Serialize imports for an account so retries cannot race the one-import ledger.
  perform 1 from public.profiles where id = current_user_id for update;
  if not found then
    raise exception using errcode = 'P0001', message = 'Player profile not found.', detail = 'PROFILE_NOT_FOUND';
  end if;

  select * into stored_import
  from public.guest_onboarding_imports
  where user_id = current_user_id and import_id = p_import_id
  for update;

  if found then
    return jsonb_build_object(
      'kind', 'guest-onboarding-imported',
      'importId', stored_import.import_id,
      'source', stored_import.source,
      'alreadyImported', true,
      'enabledHabitIds', to_jsonb(stored_import.selected_habit_ids),
      'rewardGranted', stored_import.reward_granted
    );
  end if;

  if exists (
    select 1 from public.guest_onboarding_imports
    where user_id = current_user_id
  ) then
    raise exception using errcode = 'P0001', message = 'This account already has an onboarding import.', detail = 'INVALID_RESPONSE';
  end if;

  if p_skipped_for_now then
    select array_agg(habit.id order by habit.sort_order)
    into requested_habit_ids
    from public.habit_definitions habit;
  else
    if jsonb_typeof(coalesce(p_habit_ids, '[]'::jsonb)) <> 'array' then
      raise exception using errcode = 'P0001', message = 'Onboarding habits are invalid.', detail = 'INVALID_RESPONSE';
    end if;

    requested_habit_ids := array(
      select jsonb_array_elements_text(p_habit_ids)
    );
  end if;

  requested_count := coalesce(array_length(requested_habit_ids, 1), 0);
  distinct_count := coalesce((select count(distinct value) from unnest(requested_habit_ids) as values(value)), 0);

  if requested_count = 0 or requested_count <> distinct_count then
    raise exception using errcode = 'P0001', message = 'Choose at least one unique habit.', detail = 'INVALID_RESPONSE';
  end if;

  select count(*) into valid_habit_count
  from public.habit_definitions habit
  where habit.id = any(requested_habit_ids);

  if valid_habit_count <> requested_count then
    raise exception using errcode = 'P0001', message = 'One or more onboarding habits are unavailable.', detail = 'INVALID_HABIT';
  end if;

  chosen_first_habit_id := coalesce(p_first_habit_id, requested_habit_ids[1]);
  if chosen_first_habit_id <> all(requested_habit_ids) then
    raise exception using errcode = 'P0001', message = 'The first onboarding habit is invalid.', detail = 'INVALID_HABIT';
  end if;

  resolved_source := p_source;

  delete from public.user_habit_preferences
  where user_id = current_user_id;

  insert into public.user_habit_preferences (user_id, habit_id, enabled, sort_order)
  select current_user_id, habit_id, true, ordinal::smallint
  from unnest(requested_habit_ids) with ordinality as selected(habit_id, ordinal);

  insert into public.guest_onboarding_imports (
    user_id,
    import_id,
    source,
    selected_habit_ids,
    first_habit_id,
    skipped_for_now,
    reward_granted
  ) values (
    current_user_id,
    p_import_id,
    resolved_source,
    requested_habit_ids,
    chosen_first_habit_id,
    p_skipped_for_now,
    false
  );

  return jsonb_build_object(
    'kind', 'guest-onboarding-imported',
    'importId', p_import_id,
    'source', resolved_source,
    'alreadyImported', false,
    'enabledHabitIds', to_jsonb(requested_habit_ids),
    'rewardGranted', false
  );
end;
$$;

alter function public.complete_guest_onboarding(uuid, text, jsonb, text, boolean) owner to postgres;
revoke execute on function public.complete_guest_onboarding(uuid, text, jsonb, text, boolean) from public, anon;
grant execute on function public.complete_guest_onboarding(uuid, text, jsonb, text, boolean) to authenticated;

commit;
