-- Persist the ordered enabled-habit selection through the existing settings
-- mutation. This is a forward migration so applied environments receive the
-- preference controls without rewriting an earlier RPC.

begin;

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
  requested_target_overrides jsonb;
  requested_enabled_habit_ids text[];
  requested_enabled_count integer;
  distinct_enabled_count integer;
  valid_enabled_count integer;
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

  if p_settings ? 'targetOverrides' then
    requested_target_overrides := loro_private.validate_habit_target_overrides(
      p_settings -> 'targetOverrides'
    );
  end if;

  if p_settings ? 'enabledHabitIds' then
    if jsonb_typeof(p_settings -> 'enabledHabitIds') is distinct from 'array' then
      raise exception using errcode = 'P0001', message = 'Enabled habits are invalid.', detail = 'INVALID_HABIT';
    end if;

    requested_enabled_habit_ids := array(
      select selected.habit_id
      from jsonb_array_elements_text(p_settings -> 'enabledHabitIds')
        with ordinality as selected(habit_id, ordinal)
      order by selected.ordinal
    );
    requested_enabled_count := coalesce(array_length(requested_enabled_habit_ids, 1), 0);
    distinct_enabled_count := coalesce(
      (select count(distinct value) from unnest(requested_enabled_habit_ids) as values(value)),
      0
    );

    if requested_enabled_count = 0 or requested_enabled_count <> distinct_enabled_count then
      raise exception using errcode = 'P0001', message = 'Keep at least one unique habit selected.', detail = 'INVALID_HABIT';
    end if;

    select count(*) into valid_enabled_count
    from public.habit_definitions habit
    where habit.id = any(requested_enabled_habit_ids);

    if valid_enabled_count <> requested_enabled_count then
      raise exception using errcode = 'P0001', message = 'One or more selected habits are unavailable.', detail = 'INVALID_HABIT';
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
      target_overrides = case
        when p_settings ? 'targetOverrides' then requested_target_overrides
        else current_settings.target_overrides
      end,
      updated_at = now()
  where user_id = current_user_id;

  if p_settings ? 'enabledHabitIds' then
    delete from public.user_habit_preferences
    where user_id = current_user_id;

    insert into public.user_habit_preferences (user_id, habit_id, enabled, sort_order)
    select current_user_id, habit_id, true, ordinal::smallint
    from unnest(requested_enabled_habit_ids) with ordinality as selected(habit_id, ordinal);
  end if;

  return loro_private.build_game_response(
    current_user_id,
    jsonb_build_object('kind', 'settings-updated')
  );
end;
$$;

alter function public.update_settings(jsonb) owner to postgres;
revoke execute on function public.update_settings(jsonb) from public, anon;
grant execute on function public.update_settings(jsonb) to authenticated;

commit;
