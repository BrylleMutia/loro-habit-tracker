create extension if not exists pgcrypto with schema extensions;

create schema if not exists loro_private;
revoke all on schema loro_private from public, anon, authenticated;

create type public.quest_tracking_type as enum ('timed', 'one-time');
create type public.activity_type as enum ('daily-quest', 'chapter-reward', 'daily-check-in');

create table public.habit_definitions (
  id text primary key,
  label text not null,
  icon text not null,
  daily_prompt text not null,
  sort_order smallint not null unique check (sort_order > 0)
);

create table public.chapters (
  id text primary key,
  habit_id text not null references public.habit_definitions (id) on delete cascade,
  title text not null,
  description text not null,
  sort_order smallint not null check (sort_order > 0),
  reward_coins integer not null check (reward_coins >= 0),
  reward_xp integer not null check (reward_xp >= 0),
  unique (habit_id, sort_order)
);

create table public.quest_nodes (
  id text primary key,
  chapter_id text not null references public.chapters (id) on delete cascade,
  day smallint not null check (day between 1 and 7),
  title text not null,
  summary text not null,
  icon text not null,
  quest_type public.quest_tracking_type not null,
  energy_cost integer not null check (energy_cost >= 0),
  reward_coins integer not null check (reward_coins >= 0),
  reward_xp integer not null check (reward_xp >= 0),
  target_duration_seconds integer,
  target_quantity integer,
  target_unit text,
  unique (chapter_id, day),
  constraint quest_nodes_tracking_fields_check check (
    (
      quest_type = 'timed'
      and target_duration_seconds is not null
      and target_duration_seconds > 0
      and target_quantity is null
      and target_unit is null
    )
    or
    (
      quest_type = 'one-time'
      and target_duration_seconds is null
      and target_quantity is not null
      and target_quantity > 0
      and target_unit is not null
      and length(trim(target_unit)) > 0
    )
  )
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default 'Adventurer' check (length(trim(display_name)) between 1 and 40),
  joined_at timestamptz not null default now(),
  avatar_class_id text not null default 'warrior' check (avatar_class_id in ('druid', 'mercenary', 'ranger', 'warrior', 'wizard')),
  avatar_variant text not null default 'default' check (avatar_variant in ('default', 'alternate')),
  level integer not null default 1 check (level >= 1),
  xp integer not null default 0 check (xp >= 0),
  xp_to_next_level integer not null default 100 check (xp_to_next_level > 0),
  coins integer not null default 0 check (coins >= 0),
  energy_current integer not null default 10 check (energy_current >= 0),
  energy_max integer not null default 10 check (energy_max > 0 and energy_current <= energy_max),
  last_energy_refill_at timestamptz,
  daily_streak integer not null default 0 check (daily_streak >= 0),
  longest_streak integer not null default 0 check (longest_streak >= 0),
  last_streak_on date,
  streak_shields integer not null default 0 check (streak_shields >= 0),
  updated_at timestamptz not null default now()
);

create table public.habit_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  habit_id text not null references public.habit_definitions (id) on delete cascade,
  level integer not null default 1 check (level >= 1),
  xp integer not null default 0 check (xp >= 0),
  streak integer not null default 0 check (streak >= 0),
  last_completed_on date,
  updated_at timestamptz not null default now(),
  primary key (user_id, habit_id)
);

create table public.active_timed_quests (
  user_id uuid not null references auth.users (id) on delete cascade,
  habit_id text not null references public.habit_definitions (id) on delete cascade,
  chapter_id text not null references public.chapters (id) on delete cascade,
  node_id text not null references public.quest_nodes (id) on delete cascade,
  started_on date not null,
  started_at timestamptz not null,
  primary key (user_id, habit_id),
  unique (user_id, node_id)
);

create table public.quest_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  habit_id text not null references public.habit_definitions (id) on delete cascade,
  chapter_id text not null references public.chapters (id) on delete cascade,
  node_id text not null references public.quest_nodes (id) on delete cascade,
  completed_on date not null,
  completed_at timestamptz not null,
  reward_coins integer not null check (reward_coins >= 0),
  reward_xp integer not null check (reward_xp >= 0),
  unique (user_id, habit_id, completed_on),
  unique (user_id, node_id)
);

create table public.chapter_reward_claims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  habit_id text not null references public.habit_definitions (id) on delete cascade,
  chapter_id text not null references public.chapters (id) on delete cascade,
  claimed_at timestamptz not null,
  reward_coins integer not null check (reward_coins >= 0),
  reward_xp integer not null check (reward_xp >= 0),
  unique (user_id, chapter_id)
);

create table public.daily_check_ins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  claimed_on date not null,
  claimed_at timestamptz not null,
  reward_coins integer not null check (reward_coins >= 0),
  reward_energy integer not null check (reward_energy >= 0),
  unique (user_id, claimed_on)
);

create table public.user_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  daily_reminder_enabled boolean not null default true,
  daily_reminder_time time not null default '19:00',
  sound_enabled boolean not null default true,
  haptics_enabled boolean not null default true,
  time_zone text not null default 'UTC',
  updated_at timestamptz not null default now()
);

create table public.user_inventory (
  user_id uuid not null references auth.users (id) on delete cascade,
  item_id text not null,
  owned_at timestamptz not null default now(),
  equipped_slot smallint check (equipped_slot between 0 and 7),
  primary key (user_id, item_id),
  unique (user_id, equipped_slot)
);

create table public.active_buffs (
  user_id uuid not null references auth.users (id) on delete cascade,
  buff_id text not null,
  label text not null,
  expires_at timestamptz not null,
  primary key (user_id, buff_id)
);

create table public.activity_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  activity_type public.activity_type not null,
  habit_id text references public.habit_definitions (id) on delete set null,
  chapter_id text references public.chapters (id) on delete set null,
  node_id text references public.quest_nodes (id) on delete set null,
  occurred_at timestamptz not null,
  coins_earned integer not null default 0 check (coins_earned >= 0),
  xp_earned integer not null default 0 check (xp_earned >= 0)
);

create index habit_progress_user_id_idx on public.habit_progress (user_id);
create index active_timed_quests_user_id_idx on public.active_timed_quests (user_id);
create index quest_completions_user_date_idx on public.quest_completions (user_id, completed_on desc);
create index chapter_reward_claims_user_id_idx on public.chapter_reward_claims (user_id);
create index daily_check_ins_user_date_idx on public.daily_check_ins (user_id, claimed_on desc);
create index user_inventory_user_id_idx on public.user_inventory (user_id);
create index active_buffs_user_id_idx on public.active_buffs (user_id);
create index activity_log_user_time_idx on public.activity_log (user_id, occurred_at desc);

insert into public.habit_definitions (id, label, icon, daily_prompt, sort_order)
values
  ('exercise', 'Exercise', 'barbell-outline', 'Let''s move, build strength, and earn today''s win!', 1),
  ('reading', 'Reading', 'book-outline', 'Let''s turn a few pages and uncover something new!', 2),
  ('water', 'Water', 'water-outline', 'Lory says: time to refill and keep your energy flowing!', 3),
  ('sleep', 'Sleep', 'moon-outline', 'Let''s prepare a calm landing for tomorrow''s adventure.', 4);

insert into public.chapters (
  id,
  habit_id,
  title,
  description,
  sort_order,
  reward_coins,
  reward_xp
)
values
  ('exercise-trailhead-training', 'exercise', 'Trailhead Training', 'Build a safe and repeatable movement routine.', 1, 75, 100),
  ('exercise-rising-ridge', 'exercise', 'Rising Ridge', 'Add more challenge while protecting consistency.', 2, 100, 140),
  ('reading-pagefinder-path', 'reading', 'Pagefinder Path', 'Create a comfortable daily reading rhythm.', 1, 75, 100),
  ('reading-deep-reading-grove', 'reading', 'Deep Reading Grove', 'Read longer and capture the ideas worth keeping.', 2, 100, 140),
  ('water-hydration-springs', 'water', 'Hydration Springs', 'Spread hydration checkpoints across the whole day.', 1, 75, 100),
  ('water-river-route', 'water', 'River Route', 'Protect the habit during busier daily routines.', 2, 100, 140),
  ('sleep-moonlit-camp', 'sleep', 'Moonlit Camp', 'Build a calm wind-down sequence before bed.', 1, 75, 100),
  ('sleep-dreamer-ridge', 'sleep', 'Dreamer Ridge', 'Strengthen timing and reflect on sleep quality.', 2, 100, 140);

with chapter_blueprints as (
  select *
  from (
    values
      ('exercise', 'trailhead-training', 1, 15, array['Foundation Circuit', 'Mobility Trail', 'Core Camp', 'Recovery Walk', 'Strength Summit', 'Cardio Crossing', 'Trailhead Challenge']::text[]),
      ('exercise', 'rising-ridge', 2, 20, array['Upper-Body Ascent', 'Lower-Body Trek', 'Balance Bridge', 'Active Recovery', 'Power Climb', 'Endurance Route', 'Ridge Challenge']::text[]),
      ('reading', 'pagefinder-path', 1, 10, array['Open the Map', 'Quiet Corner', 'Ten-Minute Trek', 'Character Camp', 'Idea Lookout', 'Focus Forest', 'Chapter Challenge']::text[]),
      ('reading', 'deep-reading-grove', 2, 15, array['Longer Trail', 'Theme Tracker', 'Question Clearing', 'Distraction Detour', 'Insight Grove', 'Memory Marker', 'Grove Challenge']::text[]),
      ('water', 'hydration-springs', 1, 8, array['First Refill', 'Morning Springs', 'Steady Stream', 'Midweek Reservoir', 'Refill Rhythm', 'Clear Current', 'Springs Challenge']::text[]),
      ('water', 'river-route', 2, 8, array['Early Current', 'Bottle Ready', 'Meal-Time Refill', 'Afternoon Crossing', 'Traveling Stream', 'Evening Current', 'River Challenge']::text[]),
      ('sleep', 'moonlit-camp', 1, 1, array['Set Up Camp', 'Dim the Lanterns', 'Quiet Trail', 'Midweek Reset', 'Gentle Landing', 'Dream Prep', 'Moonlit Challenge']::text[]),
      ('sleep', 'dreamer-ridge', 2, 1, array['Bedtime Marker', 'Screen-Free Ridge', 'Quiet Mind', 'Rest Checkpoint', 'Tomorrow Prep', 'Dream Journal', 'Ridge Challenge']::text[])
  ) as blueprints(habit_id, chapter_slug, chapter_order, primary_target, node_titles)
)
insert into public.quest_nodes (
  id,
  chapter_id,
  day,
  title,
  summary,
  icon,
  quest_type,
  energy_cost,
  reward_coins,
  reward_xp,
  target_duration_seconds,
  target_quantity,
  target_unit
)
select
  blueprint.habit_id || '-' || blueprint.chapter_slug || '-day-' || node.day_number,
  blueprint.habit_id || '-' || blueprint.chapter_slug,
  node.day_number::smallint,
  node.title,
  case blueprint.habit_id
    when 'exercise' then 'Complete a ' || blueprint.primary_target || '-minute ' || lower(node.title) || ' movement session.'
    when 'reading' then 'Read with focus for ' || blueprint.primary_target || ' minutes.'
    when 'water' then 'Drink ' || blueprint.primary_target || ' glasses of water across your day.'
    else 'Complete your wind-down routine and head to bed on time.'
  end,
  case blueprint.habit_id
    when 'exercise' then 'barbell-outline'
    when 'reading' then 'book-outline'
    when 'water' then 'water-outline'
    else 'moon-outline'
  end,
  case when blueprint.habit_id in ('exercise', 'reading') then 'timed' else 'one-time' end::public.quest_tracking_type,
  case when blueprint.habit_id in ('exercise', 'reading') then 1 else 0 end,
  case blueprint.habit_id
    when 'exercise' then 18 + blueprint.chapter_order * 2
    when 'reading' then 16 + blueprint.chapter_order * 2
    when 'water' then 12 + blueprint.chapter_order * 2
    else 14 + blueprint.chapter_order * 2
  end,
  case blueprint.habit_id
    when 'exercise' then 28 + blueprint.chapter_order * 4
    when 'reading' then 26 + blueprint.chapter_order * 4
    when 'water' then 20 + blueprint.chapter_order * 3
    else 24 + blueprint.chapter_order * 3
  end,
  case when blueprint.habit_id in ('exercise', 'reading') then blueprint.primary_target * 60 end,
  case when blueprint.habit_id in ('water', 'sleep') then blueprint.primary_target end,
  case blueprint.habit_id when 'water' then 'glasses' when 'sleep' then 'routine' end
from chapter_blueprints blueprint
cross join lateral unnest(blueprint.node_titles) with ordinality as node(title, day_number);

create or replace function loro_private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_time_zone text := coalesce(new.raw_user_meta_data ->> 'time_zone', 'UTC');
  safe_time_zone text;
  display_name text := left(trim(coalesce(new.raw_user_meta_data ->> 'display_name', 'Adventurer')), 40);
begin
  select name
  into safe_time_zone
  from pg_catalog.pg_timezone_names
  where name = requested_time_zone
  limit 1;

  if display_name = '' then
    display_name := 'Adventurer';
  end if;

  insert into public.profiles (id, display_name, joined_at)
  values (new.id, display_name, coalesce(new.created_at, now()));

  insert into public.user_settings (user_id, time_zone)
  values (new.id, coalesce(safe_time_zone, 'UTC'));

  insert into public.habit_progress (user_id, habit_id)
  select new.id, habit.id
  from public.habit_definitions habit;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function loro_private.handle_new_user();

alter table public.habit_definitions enable row level security;
alter table public.chapters enable row level security;
alter table public.quest_nodes enable row level security;
alter table public.profiles enable row level security;
alter table public.habit_progress enable row level security;
alter table public.active_timed_quests enable row level security;
alter table public.quest_completions enable row level security;
alter table public.chapter_reward_claims enable row level security;
alter table public.daily_check_ins enable row level security;
alter table public.user_settings enable row level security;
alter table public.user_inventory enable row level security;
alter table public.active_buffs enable row level security;
alter table public.activity_log enable row level security;

create policy "authenticated users can read habit catalog"
on public.habit_definitions for select to authenticated using (true);
create policy "authenticated users can read chapter catalog"
on public.chapters for select to authenticated using (true);
create policy "authenticated users can read quest catalog"
on public.quest_nodes for select to authenticated using (true);

create policy "users can read their profile"
on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "users can read their habit progress"
on public.habit_progress for select to authenticated using ((select auth.uid()) = user_id);
create policy "users can read their active quests"
on public.active_timed_quests for select to authenticated using ((select auth.uid()) = user_id);
create policy "users can read their quest completions"
on public.quest_completions for select to authenticated using ((select auth.uid()) = user_id);
create policy "users can read their chapter claims"
on public.chapter_reward_claims for select to authenticated using ((select auth.uid()) = user_id);
create policy "users can read their check ins"
on public.daily_check_ins for select to authenticated using ((select auth.uid()) = user_id);
create policy "users can read their settings"
on public.user_settings for select to authenticated using ((select auth.uid()) = user_id);
create policy "users can read their inventory"
on public.user_inventory for select to authenticated using ((select auth.uid()) = user_id);
create policy "users can read their buffs"
on public.active_buffs for select to authenticated using ((select auth.uid()) = user_id);
create policy "users can read their activity"
on public.activity_log for select to authenticated using ((select auth.uid()) = user_id);

revoke all on all tables in schema public from anon, authenticated;
grant select on public.habit_definitions, public.chapters, public.quest_nodes to authenticated;
grant select on public.profiles, public.habit_progress, public.active_timed_quests,
  public.quest_completions, public.chapter_reward_claims, public.daily_check_ins,
  public.user_settings, public.user_inventory, public.active_buffs, public.activity_log
to authenticated;

alter default privileges in schema public revoke execute on functions from public, anon, authenticated;
revoke execute on all functions in schema public from public, anon, authenticated;
