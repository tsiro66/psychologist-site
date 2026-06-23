import type { APIRoute } from "astro";
import { getSupabaseServer } from "../../lib/supabase";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  let email: string, password: string;
  try {
    ({ email, password } = await request.json());
  } catch {
    return new Response(
      JSON.stringify({ error: "Μη έγκυρο αίτημα" }),
      { status: 400 },
    );
  }

  const supabase = getSupabaseServer(cookies, request);
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
