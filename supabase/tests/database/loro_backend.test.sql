begin;

select plan(69);

select has_table('public', 'profiles', 'profiles table exists');
select has_table('public', 'equipment_slots', 'equipment slot catalog exists');
select has_table('public', 'equipment_sets', 'equipment set catalog exists');
select has_table('public', 'equipment_items', 'equipment item catalog exists');
select has_table('public', 'inventory_items', 'inventory item instances exist');
select has_table('public', 'quest_nodes', 'quest catalog exists');
select has_function('public', 'get_game_snapshot', array[]::text[], 'snapshot RPC exists');
select is((select count(*) from public.habit_definitions), 4::bigint, 'four habits are seeded');
select is((select count(*) from public.chapters), 8::bigint, 'eight chapters are seeded');
select is((select count(*) from public.quest_nodes), 56::bigint, 'fifty-six quest nodes are seeded');
select is((select count(*) from public.equipment_slots), 8::bigint, 'eight equipment slots are seeded');
select is((select count(*) from public.equipment_sets), 2::bigint, 'both equipment sets are seeded');
select is((select count(*) from public.equipment_items), 16::bigint, 'all equipment set pieces are seeded');
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
  );

select is(
  (select display_name from public.profiles where id = '11111111-1111-1111-1111-111111111111'),
  'Trail One',
  'signup trigger provisions profile metadata'
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
  4::bigint,
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
      and jsonb_object_length(inventory.stats) between 1 and 2
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
  current_date - 3,
  now() - interval '3 days',
  node.reward_coins,
  node.reward_xp
from public.quest_nodes node
where node.id = 'reading-pagefinder-path-day-1';
update public.habit_progress
set streak = 5,
    last_completed_on = current_date - 3
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
