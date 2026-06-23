-- Bulk-block feature: table of admin-blocked appointment slots.
-- Run this in the Supabase SQL editor.

create table if not exists public.blocked_slots (
  id uuid primary key default gen_random_uuid(),
  date text not null,
  hour text not null,
  created_at timestamptz not null default now(),
  unique (date, hour)
);

-- Speed up per-date lookups performed by the public booking calendar.
create index if not exists blocked_slots_date_idx
  on public.blocked_slots (date);