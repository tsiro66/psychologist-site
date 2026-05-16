import { defineMiddleware } from "astro:middleware";
import { getSupabaseServer } from "./lib/supabase";

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  if (pathname.startsWith("/admin")) {
    const supabase = getSupabaseServer(context.cookies, context.request);
    const { data: { user } } = await supabase.auth.getUser();
    context.locals.user = user;

    if (pathname !== "/admin/login" && !user) {
      return context.redirect("/admin/login");
    }
  }

  return next();
});
