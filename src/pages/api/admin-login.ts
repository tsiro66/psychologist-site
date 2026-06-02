import type { APIRoute } from "astro";
import { getSupabaseServer } from "../../lib/supabase";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies, locals }) => {
  const { email, password } = await request.json();

  const supabase = getSupabaseServer(locals.runtime.env, cookies, request);
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return new Response(
      JSON.stringify({ error: "Λάθος email ή κωδικός" }),
      { status: 401 },
    );
  }

  return new Response(JSON.stringify({ success: true }), { status: 200 });
};
