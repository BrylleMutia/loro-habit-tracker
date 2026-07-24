alter table public.lory_daily_briefings
  add column if not exists refresh_count integer not null default 0;

alter table public.lory_daily_briefings
  drop constraint if exists lory_daily_briefings_refresh_count_check;

alter table public.lory_daily_briefings
  add constraint lory_daily_briefings_refresh_count_check check (refresh_count between 0 and 2);

alter table public.lory_daily_briefings
  drop constraint if exists lory_daily_briefings_message_check;

alter table public.lory_daily_briefings
  add constraint lory_daily_briefings_message_check check (
    (status = 'ready' and message is not null and char_length(btrim(message)) between 1 and 128)
    or (status in ('generating', 'failed') and message is null)
  );
