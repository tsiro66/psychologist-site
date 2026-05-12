import type { APIRoute } from "astro";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  const { password } = await request.json();

  if (!password || password !== import.meta.env.ADMIN_PASSWORD) {
    return new Response(JSON.stringify({ error: "Λάθος κωδικός" }), { status: 401 });
  }

  cookies.set("admin_token", import.meta.env.ADMIN_TOKEN, {
    path: "/",
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return new Response(JSON.stringify({ success: true }), { status: 200 });
};
