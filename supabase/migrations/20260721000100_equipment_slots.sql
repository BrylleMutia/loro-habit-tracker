create table public.equipment_slots (
  id text primary key check (
    id in ('helmet', 'chest', 'cape', 'gloves', 'boots', 'weapon', 'bag', 'buddy')
  ),
  label text not null unique check (length(trim(label)) between 1 and 24),
  icon text not null check (length(trim(icon)) > 0),
  sort_order smallint not null unique check (sort_order between 0 and 7)
);

insert into public.equipment_slots (id, label, icon, sort_order)
values
  ('helmet', 'Helmet', 'shield-half-outline', 0),
  ('chest', 'Chest', 'body-outline', 1),
  ('cape', 'Cape', 'layers-outline', 2),
  ('gloves', 'Gloves', 'hand-left-outline', 3),
  ('boots', 'Boots', 'footsteps-outline', 4),
  ('weapon', 'Weapon', 'hammer-outline', 5),
  ('bag', 'Bag', 'bag-outline', 6),
  ('buddy', 'Buddy', 'paw-outline', 7);

alter table public.user_inventory
add constraint user_inventory_equipped_slot_catalog_fkey
foreign key (equipped_slot)
references public.equipment_slots (sort_order)
on update restrict
on delete restrict;

alter table public.equipment_slots enable row level security;

create policy "authenticated users can read equipment slot catalog"
on public.equipment_slots for select to authenticated using (true);

revoke all on public.equipment_slots from anon, authenticated;
grant select on public.equipment_slots to authenticated;
