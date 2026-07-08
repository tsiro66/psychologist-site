import type { APIRoute } from "astro";

const SITE = "https://katerinakritikou.gr";

const routes = [
  { path: "/", lastmod: "2025-06-01", changefreq: "weekly", priority: "1.0" },
  { path: "/about", lastmod: "2025-06-01", changefreq: "monthly", priority: "0.8" },
  { path: "/services", lastmod: "2025-06-01", changefreq: "monthly", priority: "0.8" },
  { path: "/faq", lastmod: "2025-06-01", changefreq: "monthly", priority: "0.8" },
  { path: "/booking", lastmod: "2025-06-01", changefreq: "monthly", priority: "0.8" },
  { path: "/contact", lastmod: "2025-06-01", changefreq: "monthly", priority: "0.8" },
  { path: "/privacy", lastmod: "2025-07-01", changefreq: "yearly", priority: "0.3" },
] as const;

export const prerender = true;

export const GET: APIRoute = async () => {
  const urls = routes
    .map(
      (r) => `  <url>
    <loc>${SITE}${r.path === "/" ? "" : r.path}</loc>
    <lastmod>${r.lastmod}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`,
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
};
