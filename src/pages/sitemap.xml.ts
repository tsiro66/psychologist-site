import type { APIRoute } from "astro";

const SITE = "https://katerinakritikou.gr";

const routes = [
  "/",
  "/about",
  "/services",
  "/faq",
  "/booking",
  "/contact",
];

export const prerender = true;

export const GET: APIRoute = async () => {
  const lastmod = new Date().toISOString();
  const urls = routes
    .map(
      (r) => `  <url>
    <loc>${SITE}${r === "/" ? "" : r}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${r === "/" ? "weekly" : "monthly"}</changefreq>
    <priority>${r === "/" ? "1.0" : "0.8"}</priority>
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
