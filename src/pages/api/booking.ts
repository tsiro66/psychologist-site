import type { APIRoute } from "astro";
import { getSupabase } from "../../lib/supabase";

export const prerender = false;

export const GET: APIRoute = async () => {
  const { data, error } = await getSupabase()
    .from("bookings")
    .select("*")
    .order("date", { ascending: true })
    .order("hour", { ascending: true });

  if (error) {
    return new Response(JSON.stringify({ error: "Αποτυχία φόρτωσης" }), { status: 500 });
  }

  return new Response(JSON.stringify(data), { status: 200 });
};

export const DELETE: APIRoute = async ({ request }) => {
  const { id } = await request.json();

  if (!id) {
    return new Response(JSON.stringify({ error: "ID απαιτείται" }), { status: 400 });
  }

  const { error } = await getSupabase().from("bookings").delete().eq("id", id);

  if (error) {
    return new Response(JSON.stringify({ error: "Αποτυχία διαγραφής" }), { status: 500 });
  }

  return new Response(JSON.stringify({ success: true }), { status: 200 });
};

export const PATCH: APIRoute = async ({ request }) => {
  const { id, name, phone, date, hour } = await request.json();

  if (!id) {
    return new Response(JSON.stringify({ error: "ID απαιτείται" }), { status: 400 });
  }

  const updates: Record<string, string> = {};
  if (name) updates.name = name;
  if (phone) updates.phone = phone;
  if (date) updates.date = date;
  if (hour) updates.hour = hour;

  const { error } = await getSupabase().from("bookings").update(updates).eq("id", id);

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

  const { error } = await getSupabase().from("bookings").insert({
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
