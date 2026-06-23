import type { APIRoute } from "astro";
import type { AstroCookies } from "astro";
import { getSupabaseAdmin, getSupabaseServer, type Database } from "../../lib/supabase";
import { hours } from "../../lib/booking-utils.js";

export const prerender = false;

const ALLOWED_HOURS = new Set(hours);
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const PHONE_RE = /^\d{10}$/;

function validateBooking(input: { name?: unknown; phone?: unknown; date?: unknown; hour?: unknown }): string | null {
  const { name, phone, date, hour } = input;
  if (typeof name !== "string" || !name.trim() || name.length > 100) return "Μη έγκυρο όνομα";
  if (typeof phone !== "string" || !PHONE_RE.test(phone.trim())) return "Μη έγκυρο τηλέφωνο";
  if (typeof date !== "string" || !DATE_RE.test(date)) return "Μη έγκυρη ημερομηνία";
  if (typeof hour !== "string" || !ALLOWED_HOURS.has(hour)) return "Μη έγκυρη ώρα";
  return null;
}

async function requireAdmin(cookies: AstroCookies, request: Request): Promise<Response | null> {
  const supabase = getSupabaseServer(cookies, request);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return new Response(
      JSON.stringify({ error: "Μη εξουσιοδοτημένη πρόσβαση" }),
      { status: 401 },
    );
  }
  return null;
}

export const GET: APIRoute = async ({ url, request, cookies }) => {
  const date = url.searchParams.get("date");

  if (date) {
    if (!DATE_RE.test(date)) {
      return new Response(JSON.stringify({ error: "Μη έγκυρη ημερομηνία" }), { status: 400 });
    }
    const { data, error } = await getSupabaseAdmin()
      .from("bookings")
      .select("hour")
      .eq("date", date);

    if (error) {
      return new Response(JSON.stringify({ error: "Αποτυχία φόρτωσης" }), { status: 500 });
    }

    const bookedSet = new Set((data ?? []).map((b: { hour: string }) => b.hour));

    const weekday = new Date(date + "T00:00:00").getDay();

    const [
      { data: blocked, error: blockedErr },
      { data: recurring, error: recErr },
    ] = await Promise.all([
      getSupabaseAdmin()
        .from("blocked_slots")
        .select("hour")
        .eq("date", date),
      getSupabaseAdmin()
        .from("recurring_blocks")
        .select("hour")
        .eq("weekday", weekday),
    ]);

    if (!blockedErr && blocked) {
      for (const b of blocked) bookedSet.add(b.hour);
    }
    if (!recErr && recurring) {
      for (const r of recurring) bookedSet.add(r.hour);
    }

    return new Response(JSON.stringify({ bookedHours: [...bookedSet] }), { status: 200 });
  }

  const authError = await requireAdmin(cookies, request);
  if (authError) return authError;

  const filter = url.searchParams.get("filter") || "all";
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "50", 10), 200);
  const offset = parseInt(url.searchParams.get("offset") || "0", 10);
  const today = new Date().toISOString().split("T")[0];

  let query = getSupabaseAdmin()
    .from("bookings")
    .select("*", { count: "exact" });

  if (filter === "upcoming") {
    query = query.gte("date", today);
  } else if (filter === "past") {
    query = query.lt("date", today);
  }

  const ascending = filter !== "past";
  query = query
    .order("date", { ascending })
    .order("hour", { ascending })
    .range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    return new Response(JSON.stringify({ error: "Αποτυχία φόρτωσης" }), { status: 500 });
  }

  return new Response(JSON.stringify({ data, total: count ?? 0 }), { status: 200 });
};

export const DELETE: APIRoute = async ({ request, cookies }) => {
  const authError = await requireAdmin(cookies, request);
  if (authError) return authError;

  const { id } = await request.json();

  if (!id) {
    return new Response(JSON.stringify({ error: "ID απαιτείται" }), { status: 400 });
  }

  const { error } = await getSupabaseAdmin().from("bookings").delete().eq("id", id);

  if (error) {
    return new Response(JSON.stringify({ error: "Αποτυχία διαγραφής" }), { status: 500 });
  }

  return new Response(JSON.stringify({ success: true }), { status: 200 });
};

export const PATCH: APIRoute = async ({ request, cookies }) => {
  const authError = await requireAdmin(cookies, request);
  if (authError) return authError;

  const { id, name, phone, date, hour } = await request.json();

  if (!id) {
    return new Response(JSON.stringify({ error: "ID απαιτείται" }), { status: 400 });
  }

  const updates: Database["public"]["Tables"]["bookings"]["Update"] = {};
  if (name !== undefined) {
    if (typeof name !== "string" || !name.trim() || name.length > 100) {
      return new Response(JSON.stringify({ error: "Μη έγκυρο όνομα" }), { status: 400 });
    }
    updates.name = name.trim();
  }
  if (phone !== undefined) {
    if (typeof phone !== "string" || !PHONE_RE.test(phone.trim())) {
      return new Response(JSON.stringify({ error: "Μη έγκυρο τηλέφωνο" }), { status: 400 });
    }
    updates.phone = phone.trim();
  }
  if (date !== undefined) {
    if (typeof date !== "string" || !DATE_RE.test(date)) {
      return new Response(JSON.stringify({ error: "Μη έγκυρη ημερομηνία" }), { status: 400 });
    }
    updates.date = date;
  }
  if (hour !== undefined) {
    if (typeof hour !== "string" || !ALLOWED_HOURS.has(hour)) {
      return new Response(JSON.stringify({ error: "Μη έγκυρη ώρα" }), { status: 400 });
    }
    updates.hour = hour;
  }

  if (date || hour) {
    const { data: current } = await getSupabaseAdmin()
      .from("bookings")
      .select("date, hour")
      .eq("id", id)
      .single();

    const checkDate = date || current?.date;
    const checkHour = hour || current?.hour;

    const { data: conflict } = await getSupabaseAdmin()
      .from("bookings")
      .select("id")
      .eq("date", checkDate)
      .eq("hour", checkHour)
      .neq("id", id)
      .limit(1);

    if (conflict && conflict.length > 0) {
      return new Response(
        JSON.stringify({ error: "Η ώρα αυτή είναι ήδη κρατημένη." }),
        { status: 409 }
      );
    }
  }

  const { error } = await getSupabaseAdmin().from("bookings").update(updates).eq("id", id);

  if (error) {
    return new Response(JSON.stringify({ error: "Αποτυχία ενημέρωσης" }), { status: 500 });
  }

  return new Response(JSON.stringify({ success: true }), { status: 200 });
};

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();
  const { name, phone, date, hour } = body;

  const invalid = validateBooking({ name, phone, date, hour });
  if (invalid) {
    return new Response(JSON.stringify({ error: invalid }), { status: 400 });
  }

  const { data: existing } = await getSupabaseAdmin()
    .from("bookings")
    .select("id")
    .eq("date", date)
    .eq("hour", hour)
    .limit(1);

  if (existing && existing.length > 0) {
    return new Response(
      JSON.stringify({ error: "Η ώρα αυτή είναι ήδη κρατημένη. Επίλεξε άλλη ώρα." }),
      { status: 409 }
    );
  }

  const weekday = new Date(date + "T00:00:00").getDay();
  const [
    { data: blocked, error: blockedErr },
    { data: recurring, error: recErr },
  ] = await Promise.all([
    getSupabaseAdmin().from("blocked_slots").select("hour").eq("date", date).limit(1),
    getSupabaseAdmin().from("recurring_blocks").select("hour").eq("weekday", weekday).limit(1),
  ]);

  const isBlocked =
    (blocked && blocked.some((b) => b.hour === hour)) ||
    (recurring && recurring.some((r) => r.hour === hour));

  if (isBlocked) {
    return new Response(
      JSON.stringify({ error: "Η ώρα αυτή δεν είναι διαθέσιμη. Επίλεξε άλλη ώρα." }),
      { status: 409 }
    );
  }

  const { error } = await getSupabaseAdmin().from("bookings").insert({
    name: (name as string).trim(),
    phone: (phone as string).trim(),
    date,
    hour,
  });

  if (error) {
    return new Response(JSON.stringify({ error: "Κάτι πήγε στραβά. Δοκίμασε ξανά." }), {
      status: 500,
    });
  }

  return new Response(JSON.stringify({ success: true }), { status: 200 });
};
