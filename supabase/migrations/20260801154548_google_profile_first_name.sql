-- Preserve explicit profile names while giving new OAuth accounts a useful
-- display name from the provider metadata Supabase stores on auth.users.
create or replace function loro_private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_time_zone text := coalesce(new.raw_user_meta_data ->> 'time_zone', 'UTC');
  safe_time_zone text;
  provider_full_name text := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
    ''
  );
  display_name text := left(
    trim(
      coalesce(
        nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
        nullif(trim(new.raw_user_meta_data ->> 'given_name'), ''),
        nullif(trim(new.raw_user_meta_data ->> 'first_name'), ''),
        nullif(split_part(provider_full_name, ' ', 1), ''),
        'Adventurer'
      )
    ),
    40
  );
  avatar_class_id text := lower(trim(coalesce(new.raw_user_meta_data ->> 'avatar_class_id', 'warrior')));
  avatar_variant text := lower(trim(coalesce(new.raw_user_meta_data ->> 'avatar_variant', 'default')));
begin
  select name
  into safe_time_zone
  from pg_catalog.pg_timezone_names
  where name = requested_time_zone
  limit 1;

  if display_name = '' then
    display_name := 'Adventurer';
  end if;

  if avatar_class_id not in ('druid', 'mercenary', 'ranger', 'warrior', 'wizard') then
    avatar_class_id := 'warrior';
  end if;

  if avatar_variant not in ('default', 'alternate') then
    avatar_variant := 'default';
  end if;

  insert into public.profiles (
    id,
    display_name,
    joined_at,
    avatar_class_id,
    avatar_variant
  )
  values (
    new.id,
    display_name,
    coalesce(new.created_at, now()),
    avatar_class_id,
    avatar_variant
  );

  insert into public.user_settings (user_id, time_zone)
  values (new.id, coalesce(safe_time_zone, 'UTC'));

  insert into public.habit_progress (user_id, habit_id)
  select new.id, habit.id
  from public.habit_definitions habit;

  return new;
end;
$$;
