import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import type { AstroCookies } from "astro";

export interface Database {
  public: {
    Tables: {
      bookings: {
        Row: { id: string; name: string; phone: string; date: string; hour: string };
        Insert: { name: string; phone: string; date: string; hour: string };
        Update: { name?: string; phone?: string; date?: string; hour?: string };
        Relationships: [];
      };
    };
    Views: {};
    Functions: {};
  };
}

export function getSupabaseAdmin(env: Env): SupabaseClient<Database> {
  return createClient<Database>(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
}

export function getSupabaseServer(env: Env, cookies: AstroCookies, request: Request) {
  return createServerClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        const cookieHeader = request.headers.get("cookie") ?? "";
        return cookieHeader
          .split(";")
          .filter(Boolean)
          .map((c) => {
            const [name, ...rest] = c.trim().split("=");
            return { name, value: rest.join("=") };
          });
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          cookies.set(name, value, options);
        }
      },
    },
  });
}
