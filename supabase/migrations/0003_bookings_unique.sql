-- Ensure no two bookings can occupy the same (date, hour) slot.
-- The application checks for conflicts before insert, but this constraint
-- is the authoritative guard against race conditions / double-booking.
create unique index if not exists bookings_date_hour_uniq
  on public.bookings (date, hour);