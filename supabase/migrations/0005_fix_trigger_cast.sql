-- Fix: bookings.date is a `date` column while blocked_slots.date is `text`.
-- Cast new.date to text (YYYY-MM-DD) so the comparison matches.

create or replace function public.check_slot_available()
returns trigger
language plpgsql
as $$
begin
  if exists (
    select 1 from public.blocked_slots b
    where b.date = new.date::text and b.hour = new.hour
  ) then
    raise exception 'Slot is blocked' using errcode = '23514';
  end if;

  if exists (
    select 1 from public.recurring_blocks r
    where r.weekday = extract(dow from new.date)::int
      and r.hour = new.hour
  ) then
    raise exception 'Slot is blocked' using errcode = '23514';
  end if;

  return new;
end;
$$;