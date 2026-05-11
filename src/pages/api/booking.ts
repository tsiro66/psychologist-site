import type { APIRoute } from "astro";
import { getSupabase } from "../../lib/supabase";

export const prerender = false;

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
