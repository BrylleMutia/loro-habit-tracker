begin;

select plan(140);

select has_table('public', 'profiles', 'profiles table exists');
select has_table('public', 'user_habit_preferences', 'user habit preference table exists');
select has_table('public', 'guest_onboarding_imports', 'onboarding import ledger exists');
select has_table('public', 'equipment_slots', 'equipment slot catalog exists');
select has_table('public', 'equipment_sets', 'equipment set catalog exists');
select has_table('public', 'equipment_items', 'equipment item catalog exists');
select has_table('public', 'inventory_items', 'inventory item instances exist');
select has_table('public', 'lory_daily_briefings', 'daily Lory briefing cache exists');
select ok(
  (select relrowsecurity from pg_catalog.pg_class where oid = 'public.lory_daily_briefings'::regclass),
  'daily Lory briefing cache has RLS enabled'
);
select ok(
  not has_table_privilege('authenticated', 'public.lory_daily_briefings', 'SELECT'),
  'authenticated clients cannot read briefing cache rows directly'
);
select ok(
  (select relrowsecurity from pg_catalog.pg_class where oid = 'public.user_habit_preferences'::regclass),
  'habit preferences have RLS enabled'
);
select ok(
  (select relrowsecurity from pg_catalog.pg_class where oid = 'public.guest_onboarding_imports'::regclass),
  'onboarding imports have RLS enabled'
);
select ok(
  has_table_privilege('service_role', 'public.lory_daily_briefings', 'SELECT,INSERT,UPDATE,DELETE'),
  'the server-side briefing function can manage the cache'
);
select has_table('public', 'quest_nodes', 'quest catalog exists');
select has_function('public', 'get_game_snapshot', array[]::text[], 'snapshot RPC exists');
select is((select count(*) from public.habit_definitions), 6::bigint, 'six habits are seeded');
select is((select count(*) from public.chapters), 12::bigint, 'twelve chapters are seeded');
select is((select count(*) from public.quest_nodes), 84::bigint, 'eighty-four quest nodes are seeded');
select is(
  (
    select string_agg(target_key, ',' order by target_key)
    from (
      select distinct
        chapter.habit_id || ':' || node.target_quantity || ':' || node.target_unit as target_key
      from public.chapters chapter
      join public.quest_nodes node on node.chapter_id = chapter.id
      where chapter.habit_id in ('water', 'sleep', 'outdoors')
    ) targets
  ),
  'outdoors:10:minutes,sleep:8:hours,water:6:glasses',
  'one-time habits use their canonical default targets and units'
);
select is((select count(*) from public.equipment_slots), 8::bigint, 'eight equipment slots are seeded');
select is((select count(*) from public.equipment_sets), 3::bigint, 'all equipment sets are seeded');
select is((select count(*) from public.equipment_items), 24::bigint, 'all equipment set pieces are seeded');
select is(
  (select string_agg(label, ',' order by sort_order) from public.equipment_slots),
  'Helmet,Chest,Cape,Gloves,Boots,Weapon,Bag,Buddy',
  'equipment slots retain their canonical profile order'
);
select ok(
  exists (
    select 1
    from pg_catalog.pg_constraint constraint_record
    where constraint_record.conname = 'user_inventory_equipped_slot_catalog_fkey'
      and constraint_record.conrelid = 'public.user_inventory'::regclass
      and constraint_record.contype = 'f'
  ),
  'inventory equipment positions reference the slot catalog'
);

insert into public.chapters (
  id, habit_id, title, description, sort_order, reward_coins, reward_xp
) values (
  'constraint-test-chapter', 'exercise', 'Constraint Test', 'Temporary pgTAP catalog row.', 99, 0, 0
);
select throws_ok(
  $$
    insert into public.quest_nodes (
      id, chapter_id, day, title, summary, icon, quest_type, energy_cost,
      reward_coins, reward_xp, target_quantity, target_unit
    ) values (
      'invalid-timed-node', 'constraint-test-chapter', 1, 'Invalid', 'Invalid',
      'timer-outline', 'timed', 0, 0, 0, 1, 'session'
    )
  $$,
  '23514',
  null,
  'timed nodes require duration fields and reject quantity fields'
);
select throws_ok(
  $$
    insert into public.quest_nodes (
      id, chapter_id, day, title, summary, icon, quest_type, energy_cost,
      reward_coins, reward_xp, target_duration_seconds
    ) values (
      'invalid-one-time-node', 'constraint-test-chapter', 1, 'Invalid', 'Invalid',
      'checkmark-outline', 'one-time', 0, 0, 0, 60
    )
  $$,
  '23514',
  null,
  'one-time nodes require quantity fields and reject duration fields'
);
delete from public.chapters where id = 'constraint-test-chapter';

select ok(
  has_function_privilege('authenticated', 'public.get_game_snapshot()', 'EXECUTE'),
  'authenticated role can execute the snapshot RPC'
);
select ok(
  not has_function_privilege('anon', 'public.get_game_snapshot()', 'EXECUTE'),
  'anonymous role cannot execute the snapshot RPC'
);

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
values
  (
    '00000000-0000-0000-0000-000000000000',
    '11111111-1111-1111-1111-111111111111',
    'authenticated',
    'authenticated',
    'trail.one@example.com',
    extensions.crypt('trail-ready-password', extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"display_name":"Trail One","time_zone":"Asia/Manila","avatar_class_id":"ranger","avatar_variant":"alternate"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '22222222-2222-2222-2222-222222222222',
    'authenticated',
    'authenticated',
    'trail.two@example.com',
    extensions.crypt('trail-ready-password', extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"display_name":"Trail Two","time_zone":"UTC","avatar_class_id":"bard","avatar_variant":"unknown"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '33333333-3333-3333-3333-333333333333',
    'authenticated',
    'authenticated',
    'google.given@example.com',
    extensions.crypt('trail-ready-password', extensions.gen_salt('bf')),
    now(),
    '{"provider":"google","providers":["google"]}',
    '{"given_name":"Google","full_name":"Google Test Person","time_zone":"UTC","avatar_class_id":"wizard","avatar_variant":"default"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '44444444-4444-4444-4444-444444444444',
    'authenticated',
    'authenticated',
    'google.name@example.com',
    extensions.crypt('trail-ready-password', extensions.gen_salt('bf')),
    now(),
    '{"provider":"google","providers":["google"]}',
    '{"name":"Name Fallback Example","time_zone":"UTC"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  );

select throws_ok(
  $$
    insert into public.lory_daily_briefings (
      user_id, date_key, status, message, prompt_version, context_version
    ) values (
      '11111111-1111-1111-1111-111111111111', '2026-07-24', 'ready', repeat('x', 129), 'lory-briefing-v2', '1'
    )
  $$,
  '23514',
  null,
  'briefings reject messages longer than 128 characters'
);
select throws_ok(
  $$
    insert into public.lory_daily_briefings (
      user_id, date_key, status, message, prompt_version, context_version, refresh_count
    ) values (
      '11111111-1111-1111-1111-111111111111', '2026-07-24', 'failed', null, 'lory-briefing-v2', '1', 3
    )
  $$,
  '23514',
  null,
  'briefing refresh count cannot exceed two per day'
);

select is(
  (select display_name from public.profiles where id = '11111111-1111-1111-1111-111111111111'),
  'Trail One',
  'signup trigger provisions profile metadata'
);
select is(
  (select display_name from public.profiles where id = '33333333-3333-3333-3333-333333333333'),
  'Google',
  'signup trigger uses the Google given name when no explicit display name exists'
);
select is(
  (select display_name from public.profiles where id = '44444444-4444-4444-4444-444444444444'),
  'Name',
  'signup trigger falls back to the first word of the provider name'
);
select is(
  (select avatar_class_id from public.profiles where id = '11111111-1111-1111-1111-111111111111'),
  'ranger',
  'signup trigger stores the selected avatar class'
);
select is(
  (select avatar_variant from public.profiles where id = '11111111-1111-1111-1111-111111111111'),
  'alternate',
  'signup trigger stores the selected avatar variant'
);
select ok(
  exists (
    select 1 from public.profiles
    where id = '22222222-2222-2222-2222-222222222222'
      and avatar_class_id = 'warrior'
      and avatar_variant = 'default'
  ),
  'invalid avatar metadata falls back to the guest-safe defaults'
);
select is(
  (select count(*) from public.habit_progress where user_id = '11111111-1111-1111-1111-111111111111'),
  6::bigint,
  'signup trigger provisions all habit progress rows'
);
select ok(
  exists (
    select 1 from public.profiles
    where id = '11111111-1111-1111-1111-111111111111'
      and level = 1 and xp = 0 and coins = 0
      and daily_streak = 0 and energy_current = 10 and energy_max = 10
  ),
  'new player starts with exact default resources'
);
select is(
  (select time_zone from public.user_settings where user_id = '11111111-1111-1111-1111-111111111111'),
  'Asia/Manila',
  'signup trigger stores the IANA time zone from metadata'
);

set local role authenticated;
set local "request.jwt.claims" = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';

select is((select count(*) from public.profiles), 1::bigint, 'RLS exposes the signed-in profile');
select is(
  (select count(*) from public.profiles where id = '22222222-2222-2222-2222-222222222222'),
  0::bigint,
  'RLS hides another player profile'
);
select ok(public.get_game_snapshot() is not null, 'authenticated user can load a game snapshot');
select is(
  public.get_game_snapshot() #>> '{snapshot,profile,avatarClassId}',
  'ranger',
  'the game snapshot exposes the selected signup avatar'
);
select is(
  public.get_game_snapshot() #>> '{snapshot,habits,exercise,sections,0,nodes,0,id}',
  'exercise-trailhead-training-day-1',
  'the first exercise node is the first available quest'
);
select is(
  (public.get_game_snapshot() #>> '{snapshot,inventory,streakShields}')::integer,
  0,
  'the initial snapshot reports the stored zero shield count'
);
select is(
  public.get_game_snapshot() #>> '{snapshot,targetOverrides}',
  '{}',
  'the shield snapshot correction preserves target overrides'
);
select has_function('public', 'complete_guest_onboarding', array['uuid', 'text', 'jsonb', 'text', 'boolean'], 'onboarding import RPC exists');
select has_function('public', 'complete_guest_onboarding', array['uuid', 'text', 'jsonb', 'text', 'boolean', 'boolean'], 'rewarded onboarding import RPC exists');
select ok(
  has_function_privilege('authenticated', 'public.complete_guest_onboarding(uuid,text,jsonb,text,boolean)', 'EXECUTE'),
  'authenticated role can execute onboarding import'
);
select ok(
  has_function_privilege('authenticated', 'public.complete_guest_onboarding(uuid,text,jsonb,text,boolean,boolean)', 'EXECUTE'),
  'authenticated role can execute rewarded onboarding import'
);
select ok(
  not has_function_privilege('anon', 'public.complete_guest_onboarding(uuid,text,jsonb,text,boolean)', 'EXECUTE')
    and not has_function_privilege('anon', 'public.complete_guest_onboarding(uuid,text,jsonb,text,boolean,boolean)', 'EXECUTE'),
  'anonymous role cannot execute onboarding import'
);
select is(
  (public.complete_guest_onboarding(
    '33333333-3333-3333-3333-333333333333',
    'direct-signup',
    '["exercise", "reading"]'::jsonb,
    'reading',
    false
  ) ->> 'alreadyImported')::boolean,
  false,
  'a new onboarding import is accepted once'
);
select is(
  (select count(*) from public.user_habit_preferences where user_id = '11111111-1111-1111-1111-111111111111'),
  2::bigint,
  'onboarding import stores the selected habits only'
);
select is(
  public.get_game_snapshot() #>> '{snapshot,enabledHabitIds,0}',
  'exercise',
  'snapshot exposes the first selected habit in order'
);
select is(
  public.get_game_snapshot() #>> '{snapshot,enabledHabitIds,1}',
  'reading',
  'snapshot exposes the second selected habit in order'
);
select is(
  public.get_game_snapshot() #>> '{snapshot,targetOverrides}',
  '{}',
  'onboarding snapshot composition preserves settings fields'
);
select is(
  jsonb_array_length(public.get_game_snapshot() #> '{snapshot,inventory,items}'),
  0,
  'onboarding snapshot composition preserves inventory fields'
);
select is(
  (public.complete_guest_onboarding(
    '33333333-3333-3333-3333-333333333333',
    'direct-signup',
    '["exercise", "reading"]'::jsonb,
    'reading',
    false
  ) ->> 'alreadyImported')::boolean,
  true,
  'replaying the onboarding import is idempotent'
);
select is(
  (select count(*) from public.guest_onboarding_imports where user_id = '11111111-1111-1111-1111-111111111111'),
  1::bigint,
  'replaying onboarding does not duplicate the import ledger row'
);
select is(
  (select coins from public.profiles where id = '11111111-1111-1111-1111-111111111111'),
  10,
  'onboarding import grants the fixed starter coins once'
);
select is(
  (select xp from public.profiles where id = '11111111-1111-1111-1111-111111111111'),
  10,
  'onboarding import grants the fixed starter XP once'
);
select is(
  (select streak_shields from public.profiles where id = '11111111-1111-1111-1111-111111111111'),
  1,
  'onboarding import grants exactly one starter shield'
);
select is(
  (public.complete_guest_onboarding(
    '33333333-3333-3333-3333-333333333333',
    'direct-signup',
    '["exercise", "reading"]'::jsonb,
    'reading',
    false
  ) -> 'starterReward' ->> 'streakShields')::integer,
  1,
  'duplicate onboarding import reports the original starter reward'
);
select lives_ok(
  $$select public.update_settings('{"enabledHabitIds":["reading","exercise"]}'::jsonb)$$,
  'authenticated users can reorder enabled habits'
);
select is(
  (select string_agg(habit_id, ',' order by sort_order)
   from public.user_habit_preferences
   where user_id = '11111111-1111-1111-1111-111111111111'),
  'reading,exercise',
  'habit preference rows preserve the requested order'
);
select is(
  public.get_game_snapshot() #>> '{snapshot,enabledHabitIds,0}',
  'reading',
  'the snapshot reflects the reordered first habit'
);
select is(
  public.get_game_snapshot() #>> '{snapshot,enabledHabitIds,1}',
  'exercise',
  'the snapshot reflects the reordered second habit'
);
select lives_ok(
  $$select public.update_settings('{"enabledHabitIds":["exercise"]}'::jsonb)$$,
  'authenticated users can uncheck a habit while keeping one enabled'
);
select is(
  jsonb_array_length(public.get_game_snapshot() #> '{snapshot,enabledHabitIds}'),
  1,
  'the snapshot removes an unchecked habit from Home'
);
select throws_like(
  $$select public.update_settings('{"enabledHabitIds":[]}'::jsonb)$$,
  '%at least one%',
  'an empty enabled-habit selection is rejected'
);
select throws_like(
  $$select public.update_settings('{"enabledHabitIds":["not-a-habit"]}'::jsonb)$$,
  '%unavailable%',
  'an unknown enabled habit is rejected'
);
select lives_ok(
  $$select public.update_settings('{"enabledHabitIds":["exercise","reading","journaling","water","sleep","outdoors"]}'::jsonb)$$,
  'the preference fixture restores the full catalog for later tests'
);
reset role;
update public.profiles
set coins = 0,
    xp = 0,
    xp_to_next_level = 100,
    level = 1,
    streak_shields = 0,
    energy_current = 10
where id = '11111111-1111-1111-1111-111111111111';
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
select lives_ok(
  $$select public.update_settings('{"targetOverrides":{"exercise":30}}'::jsonb)$$,
  'authenticated users can save a habit target override'
);
select is(
  (select target_overrides ->> 'exercise' from public.user_settings where user_id = '11111111-1111-1111-1111-111111111111'),
  '30',
  'the target override is persisted in user settings'
);
select is(
  public.get_game_snapshot() #>> '{snapshot,targetOverrides,exercise}',
  '30',
  'the snapshot exposes the saved target override for Home'
);
select throws_like(
  $$select public.update_settings('{"targetOverrides":{"exercise":4}}'::jsonb)$$,
  '%five minutes%',
  'server validation rejects a timed target below the selector minimum'
);
select lives_ok(
  $$select public.update_settings('{"targetOverrides":{}}'::jsonb)$$,
  'resetting target overrides is persisted as an empty map'
);
select ok(
  has_function_privilege('authenticated', 'public.complete_daily_quest(text)', 'EXECUTE'),
  'authenticated role can execute quest completion'
);
select ok(
  has_function_privilege('authenticated', 'public.claim_chapter_reward(text,text)', 'EXECUTE'),
  'authenticated role can execute chapter reward claims'
);
select ok(
  not has_function_privilege('anon', 'public.complete_daily_quest(text)', 'EXECUTE')
    and not has_function_privilege('anon', 'public.claim_chapter_reward(text,text)', 'EXECUTE'),
  'anonymous role cannot execute the authenticated streak RPCs'
);

select lives_ok(
  $$select public.start_daily_quest('exercise')$$,
  'timed quest can start'
);
select is(
  (select energy_current from public.profiles where id = '11111111-1111-1111-1111-111111111111'),
  9,
  'timed quest consumes energy once at start'
);
select lives_ok(
  $$select public.start_daily_quest('exercise')$$,
  'repeating start is idempotent'
);
select is(
  (select energy_current from public.profiles where id = '11111111-1111-1111-1111-111111111111'),
  9,
  'repeating start does not consume more energy'
);
select is(
  public.get_game_snapshot() #>> '{snapshot,habits,exercise,activeTimedQuest,nodeId}',
  'exercise-trailhead-training-day-1',
  'the active timer survives a fresh snapshot load'
);
reset role;
insert into public.active_timed_quests (
  user_id, habit_id, chapter_id, node_id, started_on, started_at
)
select
  '11111111-1111-1111-1111-111111111111',
  'reading',
  node.chapter_id,
  node.id,
  loro_private.local_date('11111111-1111-1111-1111-111111111111', now()) - 1,
  now() - interval '1 day'
from public.quest_nodes node
join public.chapters chapter on chapter.id = node.chapter_id
where chapter.habit_id = 'reading'
order by chapter.sort_order, node.day
limit 1;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';

select lives_ok(
  $$select public.start_daily_quest('reading')$$,
  'a stale timer from a previous local day is replaced instead of colliding with the timer primary key'
);
reset role;
select is(
  (select started_on from public.active_timed_quests
   where user_id = '11111111-1111-1111-1111-111111111111' and habit_id = 'reading'),
  loro_private.local_date('11111111-1111-1111-1111-111111111111', now()),
  'replaced timed quest uses the current player-local date'
);
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
select is(
  (select energy_current from public.profiles where id = '11111111-1111-1111-1111-111111111111'),
  8,
  'replacing a stale timed quest charges energy exactly once'
);
reset role;
delete from public.active_timed_quests
where user_id = '11111111-1111-1111-1111-111111111111'
  and habit_id = 'reading';
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
select throws_like(
  $$select public.complete_daily_quest('exercise')$$,
  '%Keep going until the timer reaches its target.%',
  'timed quest cannot complete before its target'
);

reset role;
update public.active_timed_quests
set started_at = now() - interval '20 minutes'
where user_id = '11111111-1111-1111-1111-111111111111'
  and habit_id = 'exercise';
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';

select lives_ok(
  $$select public.complete_daily_quest('exercise')$$,
  'eligible timed quest completes'
);
select is(
  (select coins from public.profiles where id = '11111111-1111-1111-1111-111111111111'),
  20,
  'exercise reward coins are granted atomically'
);
select is(
  (select xp from public.profiles where id = '11111111-1111-1111-1111-111111111111'),
  32,
  'exercise reward XP is granted atomically'
);
select is(
  (select count(*) from public.inventory_items where user_id = '11111111-1111-1111-1111-111111111111'),
  1::bigint,
  'quest completion atomically grants one equipment item'
);
select ok(
  exists (
    select 1
    from public.inventory_items inventory
    where inventory.user_id = '11111111-1111-1111-1111-111111111111'
      and inventory.rarity in ('common', 'uncommon', 'rare', 'epic', 'legendary')
      and jsonb_typeof(inventory.stats) = 'object'
      and (select count(*) from jsonb_object_keys(inventory.stats)) between 1 and 2
  ),
  'the loot instance stores a supported rarity and one or two stats'
);
select is(
  jsonb_array_length(public.get_game_snapshot() #> '{snapshot,inventory,items}'),
  1,
  'the game snapshot exposes the new loot item'
);
select lives_ok(
  $$select public.complete_daily_quest('exercise')$$,
  'repeating completion is idempotent'
);
select is(
  (select coins from public.profiles where id = '11111111-1111-1111-1111-111111111111'),
  20,
  'repeating completion does not duplicate rewards'
);
select is(
  (select count(*) from public.inventory_items where user_id = '11111111-1111-1111-1111-111111111111'),
  1::bigint,
  'repeating completion does not duplicate loot'
);

reset role;
update public.profiles
set energy_current = 0
where id = '11111111-1111-1111-1111-111111111111';
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';

select lives_ok(
  $$select public.complete_daily_quest('water')$$,
  'Water remains usable at zero energy'
);
select is(
  (select coins from public.profiles where id = '11111111-1111-1111-1111-111111111111'),
  34,
  'Water grants its reward at zero energy'
);
select is(
  (select count(*) from public.inventory_items where user_id = '11111111-1111-1111-1111-111111111111'),
  2::bigint,
  'a second completed habit grants its own loot item'
);
select is(
  (select energy_current from public.profiles where id = '11111111-1111-1111-1111-111111111111'),
  0,
  'free one-time quest does not change zero energy'
);
select is(
  (select daily_streak from public.profiles where id = '11111111-1111-1111-1111-111111111111'),
  1,
  'second completed habit on one day does not increment app streak twice'
);
select lives_ok(
  $$select public.complete_daily_quest('sleep')$$,
  'Sleep remains usable at zero energy'
);
select is(
  (select energy_current from public.profiles where id = '11111111-1111-1111-1111-111111111111'),
  0,
  'Sleep does not consume energy at zero energy'
);

select lives_ok(
  $$select public.claim_daily_check_in()$$,
  'daily check-in can be claimed'
);
select is(
  (select coins from public.profiles where id = '11111111-1111-1111-1111-111111111111'),
  75,
  'daily check-in coins are granted once'
);
select lives_ok(
  $$select public.claim_daily_check_in()$$,
  'repeating daily check-in is idempotent'
);
select is(
  (select coins from public.profiles where id = '11111111-1111-1111-1111-111111111111'),
  75,
  'repeating check-in does not duplicate coins'
);
select is(
  (select count(*) from public.activity_log),
  4::bigint,
  'quest and check-in mutations write the activity log atomically'
);

select throws_ok(
  $$update public.profiles set coins = 999 where id = '11111111-1111-1111-1111-111111111111'$$,
  '42501',
  null,
  'authenticated clients cannot write economy fields directly'
);

reset role;
insert into public.quest_completions (
  user_id,
  habit_id,
  chapter_id,
  node_id,
  completed_on,
  completed_at,
  reward_coins,
  reward_xp
)
select
  '11111111-1111-1111-1111-111111111111',
  'exercise',
  node.chapter_id,
  node.id,
  current_date - node.day::integer,
  now() - node.day::integer * interval '1 day',
  node.reward_coins,
  node.reward_xp
from public.quest_nodes node
where node.chapter_id = 'exercise-trailhead-training'
  and node.day between 2 and 7;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';

select is(
  (public.claim_chapter_reward('exercise', 'exercise-trailhead-training') #>> '{outcome,alreadyClaimed}')::boolean,
  false,
  'node seven unlocks the chapter reward claim'
);
select is(
  (select coins from public.profiles where id = '11111111-1111-1111-1111-111111111111'),
  150,
  'chapter rewards update the economy atomically'
);
select is(
  (select count(*) from public.chapter_reward_claims),
  1::bigint,
  'the chapter reward is recorded once'
);
select is(
  (public.claim_chapter_reward('exercise', 'exercise-trailhead-training') #>> '{outcome,alreadyClaimed}')::boolean,
  true,
  'repeating a chapter claim returns an idempotent outcome'
);
select is(
  (select count(*) from public.chapter_reward_claims),
  1::bigint,
  'repeating a chapter claim does not duplicate its row'
);
select is(
  (select streak_shields from public.profiles where id = '11111111-1111-1111-1111-111111111111'),
  1,
  'a newly accepted chapter claim earns exactly one shield'
);
select is(
  (public.get_game_snapshot() #>> '{snapshot,inventory,streakShields}')::integer,
  1,
  'the snapshot reports the earned profile shield count'
);
select is(
  (select streak_shields from public.profiles where id = '11111111-1111-1111-1111-111111111111'),
  1,
  'repeating a chapter claim does not earn another shield'
);
select is(
  (
    select count(*)
    from public.quest_completions
    where chapter_id = 'exercise-trailhead-training'
  ),
  7::bigint,
  'claiming a chapter never removes completed path data'
);
select is(
  (select count(*) from public.activity_log),
  5::bigint,
  'chapter claims append exactly one activity row'
);

-- Shield recovery fixtures use the player-local date key rather than the
-- database session date so the assertions remain valid across time zones.
reset role;
update public.profiles
set streak_shields = 1,
    daily_streak = 5,
    last_streak_on = loro_private.local_date(id, now()) - 3
where id = '11111111-1111-1111-1111-111111111111';
update public.habit_progress
set streak = 7,
    last_completed_on = loro_private.local_date(user_id, now()) - 3
where user_id = '11111111-1111-1111-1111-111111111111'
  and habit_id = 'outdoors';
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';

select is(
  (public.complete_daily_quest('outdoors') #>> '{outcome,streakShieldConsumed}')::boolean,
  true,
  'a missed-day completion consumes one shield when both streaks are at risk'
);
select is(
  (public.complete_daily_quest('outdoors') #>> '{outcome,remainingStreakShields}')::integer,
  0,
  'the protected completion reports the post-mutation shield count'
);
select is(
  (select streak from public.habit_progress where user_id = '11111111-1111-1111-1111-111111111111' and habit_id = 'outdoors'),
  8,
  'a protected habit streak increments from its stored value'
);
select is(
  (select daily_streak from public.profiles where id = '11111111-1111-1111-1111-111111111111'),
  6,
  'a protected app streak increments from its stored value'
);
select is(
  (public.get_game_snapshot() #>> '{snapshot,inventory,streakShields}')::integer,
  0,
  'the post-protection snapshot reports no remaining shields'
);
select ok(
  jsonb_array_length(public.get_game_snapshot() #> '{snapshot,inventory,items}') >= 4,
  'the post-protection snapshot preserves accumulated loot inventory'
);
select is(
  (select count(*) from public.activity_log),
  6::bigint,
  'the protected completion appends its activity atomically'
);

reset role;
update public.profiles
set streak_shields = 2,
    daily_streak = 5,
    last_streak_on = loro_private.local_date(id, now()) - 1
where id = '11111111-1111-1111-1111-111111111111';
update public.habit_progress
set streak = 4,
    last_completed_on = loro_private.local_date(user_id, now()) - 1
where user_id = '11111111-1111-1111-1111-111111111111'
  and habit_id = 'journaling';
insert into public.active_timed_quests (
  user_id, habit_id, chapter_id, node_id, started_on, started_at
)
select
  '11111111-1111-1111-1111-111111111111',
  'journaling',
  node.chapter_id,
  node.id,
  loro_private.local_date('11111111-1111-1111-1111-111111111111', now()),
  now() - interval '20 minutes'
from public.quest_nodes node
join public.chapters chapter on chapter.id = node.chapter_id
where chapter.habit_id = 'journaling'
order by chapter.sort_order, node.day
limit 1;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';

select is(
  (public.complete_daily_quest('journaling') #>> '{outcome,streakShieldConsumed}')::boolean,
  false,
  'a consecutive-day completion does not consume a shield'
);
select is(
  (public.complete_daily_quest('journaling') #>> '{outcome,remainingStreakShields}')::integer,
  2,
  'a completion with no at-risk streak leaves shields unchanged'
);
select is(
  (public.complete_daily_quest('outdoors') #>> '{outcome,streakShieldConsumed}')::boolean,
  false,
  'a duplicate completion after protection cannot consume another shield'
);
select is(
  (public.complete_daily_quest('outdoors') #>> '{outcome,remainingStreakShields}')::integer,
  2,
  'a duplicate completion reports the current stored shield count'
);

reset role;
update public.profiles
set streak_shields = 0,
    daily_streak = 0,
    last_streak_on = null
where id = '11111111-1111-1111-1111-111111111111';
update public.habit_progress
set streak = 4,
    last_completed_on = loro_private.local_date(user_id, now()) - 3
where user_id = '11111111-1111-1111-1111-111111111111'
  and habit_id = 'reading';
insert into public.active_timed_quests (
  user_id, habit_id, chapter_id, node_id, started_on, started_at
)
select
  '11111111-1111-1111-1111-111111111111',
  'reading',
  node.chapter_id,
  node.id,
  loro_private.local_date('11111111-1111-1111-1111-111111111111', now()),
  now() - interval '20 minutes'
from public.quest_nodes node
join public.chapters chapter on chapter.id = node.chapter_id
where chapter.habit_id = 'reading'
order by chapter.sort_order, node.day
limit 1;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';

select is(
  (public.complete_daily_quest('reading') #>> '{outcome,streakShieldConsumed}')::boolean,
  false,
  'a missed-day completion without shields keeps the ordinary reset behavior'
);
select is(
  (select streak from public.habit_progress where user_id = '11111111-1111-1111-1111-111111111111' and habit_id = 'reading'),
  1,
  'an at-risk habit streak resets to one when no shield is available'
);

reset role;
insert into public.quest_completions (
  user_id,
  habit_id,
  chapter_id,
  node_id,
  completed_on,
  completed_at,
  reward_coins,
  reward_xp
)
select
  '22222222-2222-2222-2222-222222222222',
  'reading',
  node.chapter_id,
  node.id,
  loro_private.local_date('22222222-2222-2222-2222-222222222222', now()) - 3,
  now() - interval '3 days',
  node.reward_coins,
  node.reward_xp
from public.quest_nodes node
where node.id = 'reading-pagefinder-path-day-1';
update public.habit_progress
set streak = 5,
    last_completed_on = loro_private.local_date(user_id, now()) - 3
where user_id = '22222222-2222-2222-2222-222222222222'
  and habit_id = 'reading';
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';

select is(
  (public.get_game_snapshot() #>> '{snapshot,habits,reading,streak}')::integer,
  0,
  'a missed day resets the effective habit streak'
);
select is(
  jsonb_array_length(public.get_game_snapshot() #> '{snapshot,habits,reading,completions}'),
  1,
  'a missed day does not remove path progress'
);

reset role;
update public.profiles
set streak_shields = 1,
    daily_streak = 4,
    last_streak_on = null
where id = '22222222-2222-2222-2222-222222222222';
update public.habit_progress
set streak = 5,
    last_completed_on = null
where user_id = '22222222-2222-2222-2222-222222222222'
  and habit_id = 'reading';
insert into public.active_timed_quests (
  user_id, habit_id, chapter_id, node_id, started_on, started_at
)
select
  '22222222-2222-2222-2222-222222222222',
  'reading',
  node.chapter_id,
  node.id,
  loro_private.local_date('22222222-2222-2222-2222-222222222222', now()),
  now() - interval '20 minutes'
from public.quest_nodes node
join public.chapters chapter on chapter.id = node.chapter_id
where chapter.habit_id = 'reading'
  and node.day = 2
order by chapter.sort_order, node.day
limit 1;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';

select is(
  (public.complete_daily_quest('reading') #>> '{outcome,streakShieldConsumed}')::boolean,
  false,
  'a null prior completion does not consume a shield'
);
select is(
  (public.complete_daily_quest('reading') #>> '{outcome,remainingStreakShields}')::integer,
  1,
  'a null prior completion reports the unchanged shield count on retry'
);
select is(
  (select streak_shields from public.profiles where id = '22222222-2222-2222-2222-222222222222'),
  1,
  'a null prior completion leaves the stored shield count unchanged'
);

reset role;
set local role anon;
set local "request.jwt.claims" = '{"role":"anon"}';
select throws_ok(
  $$select public.get_game_snapshot()$$,
  '42501',
  null,
  'anonymous clients cannot execute the snapshot RPC'
);

select * from finish();
rollback;
