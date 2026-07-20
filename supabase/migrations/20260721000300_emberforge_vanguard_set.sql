insert into public.equipment_sets (id, name, description)
values (
  'emberforge-vanguard',
  'Emberforge Vanguard Set',
  'A bold warrior set representing effort, momentum, and determination.'
);

insert into public.equipment_items (
  id, set_id, slot_id, name, asset_key, primary_stat, secondary_stat
)
values
  ('emberforge-vanguard-helmet', 'emberforge-vanguard', 'helmet', 'Embercrest Helm', 'emberforge-vanguard-helmet', 'defense', 'strength'),
  ('emberforge-vanguard-chest', 'emberforge-vanguard', 'chest', 'Vanguard Plate', 'emberforge-vanguard-chest', 'defense', 'vitality'),
  ('emberforge-vanguard-cape', 'emberforge-vanguard', 'cape', 'Scarlet Forge Cape', 'emberforge-vanguard-cape', 'agility', 'vitality'),
  ('emberforge-vanguard-gloves', 'emberforge-vanguard', 'gloves', 'Emberguard Gauntlets', 'emberforge-vanguard-gloves', 'strength', 'defense'),
  ('emberforge-vanguard-boots', 'emberforge-vanguard', 'boots', 'Forgemarch Boots', 'emberforge-vanguard-boots', 'vitality', 'agility'),
  ('emberforge-vanguard-weapon', 'emberforge-vanguard', 'weapon', 'Emberforge Hammer', 'emberforge-vanguard-weapon', 'strength', 'intelligence'),
  ('emberforge-vanguard-bag', 'emberforge-vanguard', 'bag', 'Vanguard Field Pack', 'emberforge-vanguard-bag', 'vitality', 'luck'),
  ('emberforge-vanguard-buddy', 'emberforge-vanguard', 'buddy', 'Emberling Squire', 'emberforge-vanguard-buddy', 'luck', 'intelligence');
