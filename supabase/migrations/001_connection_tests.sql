-- Run this once in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/olvlaphuyrgpilzqatsq/sql/new

create table if not exists public.connection_tests (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.connection_tests enable row level security;

-- Admin/secret key bypasses RLS; this allows publishable-key reads if needed later.
create policy "Allow public read for connection_tests"
  on public.connection_tests
  for select
  to anon, authenticated
  using (true);
