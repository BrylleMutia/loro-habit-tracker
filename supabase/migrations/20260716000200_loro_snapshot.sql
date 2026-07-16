create or replace function loro_private.require_user()
returns uuid
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception using
      errcode = 'P0001',
      message = 'You must be signed in to continue.',
      detail = 'UNAUTHENTICATED';
  end if;

  return current_user_id;
end;
$$;

create or replace function loro_private.local_date(
  target_user_id uuid,
  target_time timestamptz default now()
)
returns date
language sql
stable
security definer
set search_path = ''
as $$
  select (target_time at time zone settings.time_zone)::date
  from public.user_settings settings
  where settings.user_id = target_user_id;
$$;

create or replace function loro_private.effective_streak(
  stored_streak integer,
  last_date date,
  current_date_key date
)
returns integer
language sql
immutable
set search_path = ''
as $$
  select case
    when last_date is null then 0
    when current_date_key - last_date between 0 and 1 then stored_streak
    else 0
  end;
$$;

create or replace function loro_private.next_streak(
  stored_streak integer,
  last_date date,
  current_date_key date
)
returns integer
language sql
immutable
set search_path = ''
as $$
  select case
    when last_date = current_date_key then stored_streak
    when last_date = current_date_key - 1 then stored_streak + 1
    else 1
  end;
$$;

create or replace function loro_private.build_game_snapshot(target_user_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'profile', jsonb_build_object(
      'id', profile.id,
      'name', profile.display_name,
      'joinedAt', profile.joined_at,
      'avatarClassId', profile.avatar_class_id,
      'avatarVariant', profile.avatar_variant,
      'level', profile.level,
      'xp', profile.xp,
      'xpToNextLevel', profile.xp_to_next_level,
      'equippedItemIds', coalesce((
        select jsonb_agg(inventory.item_id order by inventory.equipped_slot)
        from public.user_inventory inventory
        where inventory.user_id = target_user_id
          and inventory.equipped_slot is not null
      ), '[]'::jsonb)
    ),
    'habits', coalesce((
      select jsonb_object_agg(
        habit.id,
        jsonb_build_object(
          'id', habit.id,
          'label', habit.label,
          'icon', habit.icon,
          'dailyPrompt', habit.daily_prompt,
          'level', progress.level,
          'xp', progress.xp,
          'streak', loro_private.effective_streak(
            progress.streak,
            progress.last_completed_on,
            loro_private.local_date(target_user_id)
          ),
          'lastCompletedDateKey', progress.last_completed_on,
          'sections', coalesce((
            select jsonb_agg(
              jsonb_build_object(
                'id', chapter.id,
                'title', chapter.title,
                'description', chapter.description,
                'order', chapter.sort_order,
                'reward', jsonb_build_object(
                  'coins', chapter.reward_coins,
                  'xp', chapter.reward_xp
                ),
                'nodes', coalesce((
                  select jsonb_agg(
                    jsonb_build_object(
                      'id', node.id,
                      'day', node.day,
                      'title', node.title,
                      'summary', node.summary,
                      'icon', node.icon,
                      'energyCost', node.energy_cost,
                      'reward', jsonb_build_object(
                        'coins', node.reward_coins,
                        'xp', node.reward_xp
                      )
                    ) || case node.quest_type
                      when 'timed' then jsonb_build_object(
                        'questType', 'timed',
                        'targetDurationSeconds', node.target_duration_seconds
                      )
                      else jsonb_build_object(
                        'questType', 'one-time',
                        'targetQuantity', node.target_quantity,
                        'targetUnit', node.target_unit
                      )
                    end
                    order by node.day
                  )
                  from public.quest_nodes node
                  where node.chapter_id = chapter.id
                ), '[]'::jsonb)
              )
              order by chapter.sort_order
            )
            from public.chapters chapter
            where chapter.habit_id = habit.id
          ), '[]'::jsonb),
          'completions', coalesce((
            select jsonb_agg(
              jsonb_build_object(
                'sectionId', completion.chapter_id,
                'nodeId', completion.node_id,
                'completedOn', completion.completed_on,
                'completedAt', completion.completed_at,
                'reward', jsonb_build_object(
                  'coins', completion.reward_coins,
                  'xp', completion.reward_xp
                )
              )
              order by completion.completed_at
            )
            from public.quest_completions completion
            where completion.user_id = target_user_id
              and completion.habit_id = habit.id
          ), '[]'::jsonb),
          'activeTimedQuest', (
            select jsonb_build_object(
              'sectionId', active_quest.chapter_id,
              'nodeId', active_quest.node_id,
              'startedOn', active_quest.started_on,
              'startedAt', active_quest.started_at
            )
            from public.active_timed_quests active_quest
            where active_quest.user_id = target_user_id
              and active_quest.habit_id = habit.id
          ),
          'claimedChapterRewardIds', coalesce((
            select jsonb_agg(claim.chapter_id order by claim.claimed_at)
            from public.chapter_reward_claims claim
            where claim.user_id = target_user_id
              and claim.habit_id = habit.id
          ), '[]'::jsonb)
        )
        order by habit.sort_order
      )
      from public.habit_definitions habit
      join public.habit_progress progress
        on progress.habit_id = habit.id
       and progress.user_id = target_user_id
    ), '{}'::jsonb),
    'dailyStreak', loro_private.effective_streak(
      profile.daily_streak,
      profile.last_streak_on,
      loro_private.local_date(target_user_id)
    ),
    'longestStreak', profile.longest_streak,
    'lastStreakDateKey', profile.last_streak_on,
    'coins', profile.coins,
    'energy', jsonb_build_object(
      'current', profile.energy_current,
      'max', profile.energy_max,
      'lastRefillAt', profile.last_energy_refill_at
    ),
    'dailyCheckIn', jsonb_build_object(
      'lastClaimedDateKey', (
        select check_in.claimed_on
        from public.daily_check_ins check_in
        where check_in.user_id = target_user_id
        order by check_in.claimed_on desc
        limit 1
      ),
      'lastClaimedAt', (
        select check_in.claimed_at
        from public.daily_check_ins check_in
        where check_in.user_id = target_user_id
        order by check_in.claimed_on desc
        limit 1
      ),
      'rewardCoins', 25,
      'rewardEnergy', 2
    ),
    'inventory', jsonb_build_object(
      'ownedItemIds', coalesce((
        select jsonb_agg(inventory.item_id order by inventory.owned_at)
        from public.user_inventory inventory
        where inventory.user_id = target_user_id
      ), '[]'::jsonb),
      'streakShields', profile.streak_shields,
      'activeBuffs', coalesce((
        select jsonb_agg(
          jsonb_build_object(
            'id', buff.buff_id,
            'label', buff.label,
            'expiresAt', buff.expires_at
          )
          order by buff.expires_at
        )
        from public.active_buffs buff
        where buff.user_id = target_user_id
      ), '[]'::jsonb)
    ),
    'settings', jsonb_build_object(
      'dailyReminderEnabled', settings.daily_reminder_enabled,
      'dailyReminderTime', to_char(settings.daily_reminder_time, 'HH24:MI'),
      'soundEnabled', settings.sound_enabled,
      'hapticsEnabled', settings.haptics_enabled,
      'timeZone', settings.time_zone
    ),
    'activityLog', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', activity.id,
          'type', activity.activity_type,
          'habitId', activity.habit_id,
          'sectionId', activity.chapter_id,
          'nodeId', activity.node_id,
          'occurredAt', activity.occurred_at,
          'coinsEarned', activity.coins_earned,
          'xpEarned', activity.xp_earned
        )
        order by activity.occurred_at desc
      )
      from public.activity_log activity
      where activity.user_id = target_user_id
    ), '[]'::jsonb)
  )
  from public.profiles profile
  join public.user_settings settings on settings.user_id = profile.id
  where profile.id = target_user_id;
$$;

create or replace function loro_private.build_game_response(
  target_user_id uuid,
  action_outcome jsonb
)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'snapshot', loro_private.build_game_snapshot(target_user_id),
    'outcome', action_outcome,
    'serverNow', now(),
    'localDateKey', loro_private.local_date(target_user_id)
  );
$$;

create or replace function public.get_game_snapshot()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := loro_private.require_user();
begin
  return loro_private.build_game_response(
    current_user_id,
    jsonb_build_object('kind', 'snapshot')
  );
end;
$$;

revoke execute on function public.get_game_snapshot() from public, anon;
grant execute on function public.get_game_snapshot() to authenticated;
