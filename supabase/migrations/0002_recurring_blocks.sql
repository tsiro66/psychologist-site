-- Recurring weekly blocks: persist a (weekday, hour) rule indefinitely.
-- Admin toggles hours per weekday; unchecking + submitting removes the row.
-- Run this in the Supabase SQL editor.

create table if not exists public.recurring_blocks (
  id uuid primary key default gen_random_uuid(),
  weekday smallint not null check (weekday between 0 and 6),
  hour text not null,
  created_at timestamptz not null default now(),
  unique (weekday, hour)
);

create index if not exists recurring_blocks_weekday_idx
  on public.recurring_blocks (weekday);