-- Enforce that no booking can occupy a slot the admin has blocked
-- (either as a one-off blocked_slots row or a recurring_blocks rule).
-- This fires BEFORE INSERT or UPDATE OF date,hour, so it closes the
-- race between the application's pre-check and the actual write.
-- Applies to all writes — admin-created bookings included.

create or replace function public.check_slot_available()
returns trigger
language plpgsql
as $$
begin
  if exists (
    select 1 from public.blocked_slots b
    where b.date = new.date and b.hour = new.hour
  ) then
    raise exception 'Slot is blocked' using errcode = '23514';
  end if;

  if exists (
    select 1 from public.recurring_blocks r
    where r.weekday = extract(dow from (new.date)::date)::int
      and r.hour = new.hour
  ) then
    raise exception 'Slot is blocked' using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists bookings_check_slot on public.bookings;

create trigger bookings_check_slot
  before insert or update of date, hour on public.bookings
  for each row
  execute function public.check_slot_available();