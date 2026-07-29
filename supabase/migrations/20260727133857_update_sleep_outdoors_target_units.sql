-- Keep authored one-time quest units consistent with the client catalog.
-- This forward-only data migration updates existing databases; fresh resets
-- still run it after the original quest catalog migrations.
update public.quest_nodes as node
set target_unit = case chapter.habit_id
  when 'sleep' then 'hours'
  when 'outdoors' then 'minutes'
end
from public.chapters as chapter
where chapter.id = node.chapter_id
  and chapter.habit_id in ('sleep', 'outdoors')
  and node.quest_type = 'one-time';
