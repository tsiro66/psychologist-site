import type { APIRoute } from "astro";
import type { AstroCookies } from "astro";
import { getSupabaseAdmin, getSupabaseServer, type Database } from "../../lib/supabase";

export const prerender = false;

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

export const GET: APIRoute = async ({ url }) => {
  const date = url.searchParams.get("date");

  if (date) {
    const { data, error } = await getSupabaseAdmin()
      .from("bookings")
      .select("hour")
      .eq("date", date);

    if (error) {
      return new Response(JSON.stringify({ error: "Αποτυχία φόρτωσης" }), { status: 500 });
    }

    const bookedHours = (data ?? []).map((b: { hour: string }) => b.hour);
    return new Response(JSON.stringify({ bookedHours }), { status: 200 });
  }

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
  if (name) updates.name = name;
  if (phone) updates.phone = phone;
  if (date) updates.date = date;
  if (hour) updates.hour = hour;

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

  if (!name || !phone || !date || !hour) {
    return new Response(JSON.stringify({ error: "Όλα τα πεδία είναι υποχρεωτικά" }), {
      status: 400,
    });
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

  const { error } = await getSupabaseAdmin().from("bookings").insert({
    name,
    phone,
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
