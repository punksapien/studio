-- Advisory row synchronization from Google Sheets.
-- One source_id represents one permanent spreadsheet row identity.

create table if not exists public.advisories (
  id uuid primary key default gen_random_uuid(),
  source_id text not null unique,
  sheet_name text not null,
  row_number integer,
  status text not null default 'pending' check (status in ('pending', 'pending_reason', 'resolved')),
  advisor text,
  token text,
  entry_date_text text,
  verdict text,
  ops_action text,
  rejection_reason text,
  outcome text,
  payload jsonb not null default '{}'::jsonb,
  first_synced_at timestamptz not null default now(),
  last_synced_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists advisories_status_idx on public.advisories(status);
create index if not exists advisories_advisor_idx on public.advisories(advisor);
create index if not exists advisories_token_idx on public.advisories(token);
create index if not exists advisories_last_synced_at_idx on public.advisories(last_synced_at desc);

create or replace function public.set_advisories_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists advisories_set_updated_at on public.advisories;
create trigger advisories_set_updated_at
before update on public.advisories
for each row
execute function public.set_advisories_updated_at();

alter table public.advisories enable row level security;

-- No anon/authenticated policies are intentionally created.
-- This table is accessed by server-side code using SUPABASE_SERVICE_ROLE_KEY.
comment on table public.advisories is 'Canonical advisory records synchronized from Google Sheets';
