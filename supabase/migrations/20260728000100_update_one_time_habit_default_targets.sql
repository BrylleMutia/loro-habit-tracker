begin;

update public.quest_nodes as node
set target_quantity = case chapter.habit_id
  when 'water' then 6
  when 'sleep' then 8
  when 'outdoors' then 10
end
from public.chapters as chapter
where chapter.id = node.chapter_id
  and chapter.habit_id in ('water', 'sleep', 'outdoors')
  and node.quest_type = 'one-time';

commit;
