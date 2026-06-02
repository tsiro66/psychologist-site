import type { APIRoute } from "astro";
import { getSupabaseServer } from "../../lib/supabase";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  const supabase = getSupabaseServer(cookies, request);
  await supabase.auth.signOut();

  return new Response(JSON.stringify({ success: true }), { status: 200 });
};
