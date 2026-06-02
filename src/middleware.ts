import { defineMiddleware } from "astro:middleware";
import { getSupabaseServer } from "./lib/supabase";

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  if (pathname.startsWith("/admin")) {
    let user = null;
    try {
      const supabase = getSupabaseServer(
        context.locals.runtime.env,
        context.cookies,
        context.request,
      );
      const { data } = await supabase.auth.getUser();
      user = data?.user ?? null;
    } catch {
      user = null;
    }
    context.locals.user = user;

    if (pathname !== "/admin/login" && !user) {
      return context.redirect("/admin/login");
    }
  }

  return next();
});
