import type { APIRoute } from "astro";
import type { AstroCookies } from "astro";
import { getSupabaseAdmin, getSupabaseServer } from "../../../lib/supabase";
import { hours as ALLOWED_HOURS } from "../../../lib/booking-utils.js";

export const prerender = false;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const HOURS_SET = new Set(ALLOWED_HOURS);

async function requireAdmin(
  cookies: AstroCookies,
  request: Request,
): Promise<Response | null> {
  const supabase = getSupabaseServer(cookies, request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response(
      JSON.stringify({ error: "Μη εξουσιοδοτημένη πρόσβαση" }),
      { status: 401 },
    );
  }
  return null;
}

function validateHours(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  const ok = value.every((h) => typeof h === "string" && HOURS_SET.has(h));
  if (!ok) return null;
  return value as string[];
}

export const GET: APIRoute = async ({ url, cookies, request }) => {
  const authError = await requireAdmin(cookies, request);
  if (authError) return authError;

  const weekdayParam = url.searchParams.get("weekday");
  const dateParam = url.searchParams.get("date");

  if (weekdayParam !== null) {
    const weekday = Number(weekdayParam);
    if (!Number.isInteger(weekday) || weekday < -1 || weekday > 6) {
      return new Response(JSON.stringify({ error: "Μη έγκυρη ημέρα" }), {
        status: 400,
      });
    }
    if (weekday === -1) {
      const { data, error } = await getSupabaseAdmin()
        .from("recurring_blocks")
        .select("weekday,hour");
      if (error) {
        console.error("[bulk-block GET all]", error);
        return new Response(JSON.stringify({ error: "Αποτυχία φόρτωσης", detail: error.message }), {
          status: 500,
        });
      }
      // Hours blocked on ALL weekdays (intersection)
      const byDay = new Map<number, Set<string>>();
      for (const r of data ?? []) {
        if (!byDay.has(r.weekday)) byDay.set(r.weekday, new Set());
        byDay.get(r.weekday)!.add(r.hour);
      }
      let intersection: Set<string> | null = null;
      for (let d = 0; d <= 6; d++) {
        const set = byDay.get(d) ?? new Set<string>();
        if (intersection === null) {
          intersection = new Set(set);
        } else {
          const next = new Set<string>();
          for (const h of intersection) if (set.has(h)) next.add(h);
          intersection = next;
        }
      }
      return new Response(
        JSON.stringify({ hours: [...(intersection ?? new Set<string>())] }),
        { status: 200 },
      );
    }
    const { data, error } = await getSupabaseAdmin()
      .from("recurring_blocks")
      .select("hour")
      .eq("weekday", weekday);
    if (error) {
      console.error("[bulk-block GET weekday]", error);
      return new Response(JSON.stringify({ error: "Αποτυχία φόρτωσης", detail: error.message }), {
        status: 500,
      });
    }
    return new Response(
      JSON.stringify({ hours: (data ?? []).map((r) => r.hour) }),
      { status: 200 },
    );
  }

  if (dateParam !== null) {
    if (!DATE_RE.test(dateParam)) {
      return new Response(JSON.stringify({ error: "Μη έγκυρη ημερομηνία" }), {
        status: 400,
      });
    }
    const [
      { data: dateRows, error: dateErr },
      { data: recRows, error: recErr },
    ] = await Promise.all([
      getSupabaseAdmin()
        .from("blocked_slots")
        .select("hour")
        .eq("date", dateParam),
      getSupabaseAdmin()
        .from("recurring_blocks")
        .select("hour")
        .eq("weekday", new Date(dateParam + "T00:00:00").getDay()),
    ]);
    if (dateErr || recErr) {
      return new Response(JSON.stringify({ error: "Αποτυχία φόρτωσης" }), {
        status: 500,
      });
    }
    const set = new Set<string>();
    for (const r of dateRows ?? []) set.add(r.hour);
    for (const r of recRows ?? []) set.add(r.hour);
    return new Response(JSON.stringify({ hours: [...set] }), { status: 200 });
  }

  return new Response(JSON.stringify({ error: "Δώσε weekday ή date" }), {
    status: 400,
  });
};

export const POST: APIRoute = async ({ request, cookies }) => {
  const authError = await requireAdmin(cookies, request);
  if (authError) return authError;

  let body: {
    date?: unknown;
    weekday?: unknown;
    hours?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Μη έγκυρο αίτημα" }), {
      status: 400,
    });
  }

  const hours = validateHours(body.hours);
  if (!hours) {
    return new Response(JSON.stringify({ error: "Μη έγκυρες ώρες" }), {
      status: 400,
    });
  }

  const desired = new Set(hours);

  if (typeof body.date === "string" && DATE_RE.test(body.date)) {
    const date = body.date;

    const { data: existing, error: fetchErr } = await getSupabaseAdmin()
      .from("blocked_slots")
      .select("id,hour")
      .eq("date", date);
    if (fetchErr) {
      return new Response(JSON.stringify({ error: "Αποτυχία ενημέρωσης" }), {
        status: 500,
      });
    }

    const toDelete = (existing ?? [])
      .filter((r) => !desired.has(r.hour))
      .map((r) => r.id);
    const currentHours = new Set((existing ?? []).map((r) => r.hour));
    const toInsert = [...desired]
      .filter((h) => !currentHours.has(h))
      .map((h) => ({ date, hour: h }));

    if (toDelete.length > 0) {
      const { error: delErr } = await getSupabaseAdmin()
        .from("blocked_slots")
        .delete()
        .in("id", toDelete);
      if (delErr) {
        return new Response(JSON.stringify({ error: "Αποτυχία ενημέρωσης" }), {
          status: 500,
        });
      }
    }
    if (toInsert.length > 0) {
      const { error: insErr } = await getSupabaseAdmin()
        .from("blocked_slots")
        .insert(toInsert);
      if (insErr) {
        return new Response(JSON.stringify({ error: "Αποτυχία ενημέρωσης" }), {
          status: 500,
        });
      }
    }

    return new Response(
      JSON.stringify({ success: true, blocked: desired.size, date }),
      { status: 200 },
    );
  }

  if (
    typeof body.weekday === "number" &&
    Number.isInteger(body.weekday) &&
    body.weekday >= -1 &&
    body.weekday <= 6
  ) {
    const weekday = body.weekday;

    if (weekday === -1) {
      // Apply the same desired hour set to every weekday 0..6.
      const { data: existingAll, error: fetchAllErr } = await getSupabaseAdmin()
        .from("recurring_blocks")
        .select("id,weekday,hour");
      if (fetchAllErr) {
        return new Response(JSON.stringify({ error: "Αποτυχία ενημέρωσης" }), {
          status: 500,
        });
      }
      const rows = (existingAll ?? []).filter((r) => r.hour !== null) as { id: string; weekday: number; hour: string }[];
      const toDelete = rows
        .filter((r) => !desired.has(r.hour))
        .map((r) => r.id);
      const existingByKey = new Set(rows.map((r) => `${r.weekday}|${r.hour}`));
      const toInsert: { weekday: number; hour: string }[] = [];
      for (let d = 0; d <= 6; d++) {
        for (const h of desired) {
          if (!existingByKey.has(`${d}|${h}`)) toInsert.push({ weekday: d, hour: h });
        }
      }

      if (toDelete.length > 0) {
        const { error: delErr } = await getSupabaseAdmin()
          .from("recurring_blocks")
          .delete()
          .in("id", toDelete);
        if (delErr) {
          return new Response(JSON.stringify({ error: "Αποτυχία ενημέρωσης" }), {
            status: 500,
          });
        }
      }
      if (toInsert.length > 0) {
        const { error: insErr } = await getSupabaseAdmin()
          .from("recurring_blocks")
          .insert(toInsert);
        if (insErr) {
          return new Response(JSON.stringify({ error: "Αποτυχία ενημέρωσης" }), {
            status: 500,
          });
        }
      }
      return new Response(
        JSON.stringify({ success: true, blocked: desired.size, weekday: -1 }),
        { status: 200 },
      );
    }

    const { data: existing, error: fetchErr } = await getSupabaseAdmin()
      .from("recurring_blocks")
      .select("id,hour")
      .eq("weekday", weekday);
    if (fetchErr) {
      return new Response(JSON.stringify({ error: "Αποτυχία ενημέρωσης" }), {
        status: 500,
      });
    }

    const toDelete = (existing ?? [])
      .filter((r) => !desired.has(r.hour))
      .map((r) => r.id);
    const currentHours = new Set((existing ?? []).map((r) => r.hour));
    const toInsert = [...desired]
      .filter((h) => !currentHours.has(h))
      .map((h) => ({ weekday, hour: h }));

    if (toDelete.length > 0) {
      const { error: delErr } = await getSupabaseAdmin()
        .from("recurring_blocks")
        .delete()
        .in("id", toDelete);
      if (delErr) {
        return new Response(JSON.stringify({ error: "Αποτυχία ενημέρωσης" }), {
          status: 500,
        });
      }
    }
    if (toInsert.length > 0) {
      const { error: insErr } = await getSupabaseAdmin()
        .from("recurring_blocks")
        .insert(toInsert);
      if (insErr) {
        return new Response(JSON.stringify({ error: "Αποτυχία ενημέρωσης" }), {
          status: 500,
        });
      }
    }

    return new Response(
      JSON.stringify({ success: true, blocked: desired.size, weekday }),
      { status: 200 },
    );
  }

  return new Response(
    JSON.stringify({ error: "Δώσε date ή weekday" }),
    { status: 400 },
  );
};