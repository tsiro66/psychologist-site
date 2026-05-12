import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware((context, next) => {
  const { pathname } = context.url;

  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const token = context.cookies.get("admin_token")?.value;
    const expected = import.meta.env.ADMIN_TOKEN;

    if (!token || token !== expected) {
      return context.redirect("/admin/login");
    }
  }

  return next();
});
