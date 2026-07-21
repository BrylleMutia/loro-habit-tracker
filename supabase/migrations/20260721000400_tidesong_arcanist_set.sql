insert into public.equipment_sets (id, name, description)
values (
  'tidesong-arcanist',
  'Tidesong Arcanist Set',
  'A calm magical set inspired by learning, reflection, hydration, and rest.'
);

insert into public.equipment_items (
  id,
  set_id,
  slot_id,
  name,
  asset_key,
  primary_stat,
  secondary_stat
)
values
  (
    'tidesong-arcanist-helmet',
    'tidesong-arcanist',
    'helmet',
    'Moonlit Scholar Hood',
    'tidesong-arcanist-helmet',
    'intelligence',
    'luck'
  ),
  (
    'tidesong-arcanist-chest',
    'tidesong-arcanist',
    'chest',
    'Tidesong Arcanist Robe',
    'tidesong-arcanist-chest',
    'intelligence',
    'vitality'
  ),
  (
    'tidesong-arcanist-cape',
    'tidesong-arcanist',
    'cape',
    'Moonwave Cape',
    'tidesong-arcanist-cape',
    'agility',
    'intelligence'
  ),
  (
    'tidesong-arcanist-gloves',
    'tidesong-arcanist',
    'gloves',
    'Tidesong Rune Gloves',
    'tidesong-arcanist-gloves',
    'intelligence',
    'agility'
  ),
  (
    'tidesong-arcanist-boots',
    'tidesong-arcanist',
    'boots',
    'Moonstep Boots',
    'tidesong-arcanist-boots',
    'agility',
    'vitality'
  ),
  (
    'tidesong-arcanist-weapon',
    'tidesong-arcanist',
    'weapon',
    'Crescent Tide Staff',
    'tidesong-arcanist-weapon',
    'intelligence',
    'luck'
  ),
  (
    'tidesong-arcanist-bag',
    'tidesong-arcanist',
    'bag',
    'Scholar Tide Satchel',
    'tidesong-arcanist-bag',
    'vitality',
    'intelligence'
  ),
  (
    'tidesong-arcanist-buddy',
    'tidesong-arcanist',
    'buddy',
    'Pearlfin Droplet',
    'tidesong-arcanist-buddy',
    'luck',
    'vitality'
  );
