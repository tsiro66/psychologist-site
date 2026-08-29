// Supabase keep-alive ping for the free tier.
//
// Free-tier Supabase projects are paused after 7 days without database
// activity. This worker fetches the site's public availability endpoint
// (`GET /api/booking?date=...`) once a day; the main site worker holds the
// Supabase credentials and executes real queries against `bookings`,
// `blocked_slots` and `recurring_blocks`, which counts as database activity
// and keeps the Supabase project awake. No secrets needed here.
//
// Invoked daily by a Cloudflare Cron Trigger (see wrangler.toml). The
// `fetch` handler exists only so the ping can be tested manually via the
// worker's URL — it also doubles as an end-to-end check of the booking
// chain (site -> worker -> Supabase).

interface Env {
  SITE_URL: string;
}

interface ScheduledEventInfo {
  cron: string;
  scheduledTime: number;
}

interface ExecutionContextLike {
  waitUntil(promise: Promise<unknown>): void;
}

const SITE_URL_DEFAULT = "https://katerinakritikou.gr";

export default {
  async scheduled(_event: ScheduledEventInfo, env: Env, ctx: ExecutionContextLike): Promise<void> {
    ctx.waitUntil(pingBookingApi(env));
  },

  async fetch(_request: Request, env: Env): Promise<Response> {
    try {
      await pingBookingApi(env);
      return new Response("Booking API ping OK — Supabase is awake\n");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return new Response(`Booking API ping failed: ${message}\n`, { status: 500 });
    }
  },
};

async function pingBookingApi(env: Env): Promise<void> {
  const siteUrl = (env.SITE_URL || SITE_URL_DEFAULT).replace(/\/$/, "");
  // Any valid date works for the ping — today's UTC date is fine.
  const today = new Date().toISOString().slice(0, 10);
  const url = `${siteUrl}/api/booking?date=${today}`;

  const response = await fetch(url, {
    headers: { "User-Agent": "supabase-keepalive/1.0" },
  });

  if (!response.ok) {
    throw new Error(`Booking API responded with HTTP ${response.status}: ${await response.text()}`);
  }

  const body = (await response.json()) as { bookedHours?: unknown };
  if (!Array.isArray(body.bookedHours)) {
    throw new Error(`Unexpected Booking API response: ${JSON.stringify(body).slice(0, 200)}`);
  }

  console.log(`Keep-alive ping OK: ${url} (${body.bookedHours.length} booked hours)`);
}
