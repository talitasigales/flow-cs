
create table public.pda_cache (
  endpoint text primary key,
  payload jsonb not null,
  fetched_at timestamptz not null default now()
);
alter table public.pda_cache enable row level security;
create index pda_cache_fetched_at_idx on public.pda_cache (fetched_at);
