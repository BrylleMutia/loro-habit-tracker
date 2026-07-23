-- Add the new habits to the shared catalog. Existing progress, rewards, claims,
-- inventory, and activity history remain untouched.
update public.habit_definitions
set sort_order = sort_order + 10
where id in ('water', 'sleep');

update public.habit_definitions
set sort_order = case id
  when 'water' then 4
  when 'sleep' then 5
end
where id in ('water', 'sleep');

insert into public.habit_definitions (id, label, icon, daily_prompt, sort_order)
values
  (
    'journaling',
    'Journaling',
    'create-outline',
    'Take a quiet moment to capture a thought from today''s trail.',
    3
  ),
  (
    'outdoors',
    'Outdoors',
    'leaf-outline',
    'Step outside, breathe deeply, and discover a little more of your world!',
    6
  )
on conflict (id) do update
set label = excluded.label,
    icon = excluded.icon,
    daily_prompt = excluded.daily_prompt,
    sort_order = excluded.sort_order;

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
  (
    'journaling-quiet-pages',
    'journaling',
    'Quiet Pages',
    'Build a small daily reflection practice.',
    1,
    75,
    100
  ),
  (
    'journaling-storykeeper-ridge',
    'journaling',
    'Storykeeper Ridge',
    'Turn reflection into a steady self-awareness ritual.',
    2,
    100,
    140
  ),
  (
    'outdoors-sunlit-trail',
    'outdoors',
    'Sunlit Trail',
    'Create a simple daily ritual for time outside.',
    1,
    75,
    100
  ),
  (
    'outdoors-wildway-pass',
    'outdoors',
    'Wildway Pass',
    'Keep your outdoor rhythm alive through changing days.',
    2,
    100,
    140
  )
on conflict (id) do update
set habit_id = excluded.habit_id,
    title = excluded.title,
    description = excluded.description,
    sort_order = excluded.sort_order,
    reward_coins = excluded.reward_coins,
    reward_xp = excluded.reward_xp;

with chapter_blueprints as (
  select *
  from (
    values
      (
        'journaling',
        'quiet-pages',
        1,
        5,
        array[
          'First Entry',
          'Thought Trail',
          'Gratitude Grove',
          'Prompt Path',
          'Clarity Camp',
          'Pattern Pass',
          'Quiet Pages Challenge'
        ]::text[]
      ),
      (
        'journaling',
        'storykeeper-ridge',
        2,
        5,
        array[
          'Morning Pages',
          'Mood Marker',
          'Lesson Lookout',
          'Release Route',
          'Intentions Camp',
          'Reflection Ridge',
          'Storykeeper Challenge'
        ]::text[]
      ),
      (
        'outdoors',
        'sunlit-trail',
        1,
        1,
        array[
          'Step Outside',
          'Fresh-Air Crossing',
          'Greenway Pause',
          'Sky Checkpoint',
          'Garden Gate',
          'Open-Air Lookout',
          'Sunlit Trail Challenge'
        ]::text[]
      ),
      (
        'outdoors',
        'wildway-pass',
        2,
        1,
        array[
          'Morning Meadow',
          'Weather Watch',
          'Parkway Trek',
          'Horizon Pause',
          'Trailside Reset',
          'Wildway Lookout',
          'Pass Challenge'
        ]::text[]
      )
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
    when 'journaling' then 'Journal with focus for ' || blueprint.primary_target || ' minutes.'
    else 'Spend time outdoors today.'
  end,
  case blueprint.habit_id
    when 'journaling' then 'create-outline'
    else 'leaf-outline'
  end,
  case when blueprint.habit_id = 'journaling' then 'timed' else 'one-time' end::public.quest_tracking_type,
  case when blueprint.habit_id = 'journaling' then 1 else 0 end,
  case when blueprint.habit_id = 'journaling'
    then 15 + blueprint.chapter_order * 2
    else 13 + blueprint.chapter_order * 2
  end,
  case when blueprint.habit_id = 'journaling'
    then 25 + blueprint.chapter_order * 4
    else 22 + blueprint.chapter_order * 3
  end,
  case when blueprint.habit_id = 'journaling' then blueprint.primary_target * 60 end,
  case when blueprint.habit_id = 'outdoors' then blueprint.primary_target end,
  case when blueprint.habit_id = 'outdoors' then 'outdoor visit' end
from chapter_blueprints blueprint
cross join lateral unnest(blueprint.node_titles) with ordinality as node(title, day_number)
on conflict (id) do update
set chapter_id = excluded.chapter_id,
    day = excluded.day,
    title = excluded.title,
    summary = excluded.summary,
    icon = excluded.icon,
    quest_type = excluded.quest_type,
    energy_cost = excluded.energy_cost,
    reward_coins = excluded.reward_coins,
    reward_xp = excluded.reward_xp,
    target_duration_seconds = excluded.target_duration_seconds,
    target_quantity = excluded.target_quantity,
    target_unit = excluded.target_unit;

-- Existing profiles need progress rows so the generic snapshot builder includes
-- the new habits immediately after the catalog migration.
insert into public.habit_progress (user_id, habit_id)
select profile.id, habit.id
from public.profiles profile
cross join public.habit_definitions habit
where habit.id in ('journaling', 'outdoors')
on conflict (user_id, habit_id) do nothing;
