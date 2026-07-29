-- Validate habit target writes at the same boundary that persists them.
-- Home and More both consume the snapshot value, so malformed overrides must
-- never be accepted into user_settings by a direct RPC caller.
begin;

create or replace function loro_private.validate_habit_target_overrides(
  requested_overrides jsonb
)
returns jsonb
language plpgsql
immutable
security definer
set search_path = ''
as $$
declare
  entry record;
begin
  if requested_overrides is null
     or jsonb_typeof(requested_overrides) <> 'object' then
    raise exception using
      errcode = 'P0001',
      message = 'Habit targets are invalid.',
      detail = 'INVALID_TARGET_OVERRIDES';
  end if;

  for entry in
    select key, value
    from jsonb_each(requested_overrides)
  loop
    if entry.key not in ('exercise', 'reading', 'journaling', 'water', 'sleep', 'outdoors') then
      raise exception using
        errcode = 'P0001',
        message = 'That habit target is not supported.',
        detail = 'INVALID_TARGET_OVERRIDES';
    end if;

    if jsonb_typeof(entry.value) is distinct from 'number'
       or entry.value::numeric <> trunc(entry.value::numeric) then
      raise exception using
        errcode = 'P0001',
        message = 'Habit targets must be whole numbers.',
        detail = 'INVALID_TARGET_OVERRIDES';
    end if;

    if entry.key in ('exercise', 'reading', 'journaling')
       and entry.value::numeric < 5 then
      raise exception using
        errcode = 'P0001',
        message = 'Timed habit targets must be at least five minutes.',
        detail = 'INVALID_TARGET_OVERRIDES';
    end if;

    if entry.key in ('water', 'sleep', 'outdoors')
       and entry.value::numeric < 1 then
      raise exception using
        errcode = 'P0001',
        message = 'One-time habit targets must be at least one unit.',
        detail = 'INVALID_TARGET_OVERRIDES';
    end if;
  end loop;

  return requested_overrides;
end;
$$;

alter function loro_private.validate_habit_target_overrides(jsonb) owner to postgres;
revoke all on function loro_private.validate_habit_target_overrides(jsonb) from public, anon, authenticated;

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
