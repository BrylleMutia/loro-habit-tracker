create table if not exists public.lory_daily_briefings (
  user_id uuid not null references auth.users(id) on delete cascade,
  date_key date not null,
  status text not null default 'generating'
    check (status in ('generating', 'ready', 'failed')),
  refresh_count integer not null default 0
    check (refresh_count between 0 and 2),
  message text,
  model text not null default 'deepseek-v4-flash',
  prompt_version text not null,
  context_version text not null,
  context_hash text,
  generation_token uuid,
  lease_expires_at timestamptz,
  generated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, date_key),
  constraint lory_daily_briefings_message_check check (
    (status = 'ready' and message is not null and char_length(btrim(message)) between 1 and 128)
    or (status in ('generating', 'failed') and message is null)
  )
);

alter table public.lory_daily_briefings enable row level security;

revoke all on table public.lory_daily_briefings from public, anon, authenticated;
grant select, insert, update, delete on table public.lory_daily_briefings to service_role;

create index if not exists lory_daily_briefings_lease_idx
  on public.lory_daily_briefings (lease_expires_at)
  where status = 'generating';
