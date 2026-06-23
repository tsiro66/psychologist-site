import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { env } from "cloudflare:workers";
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
      blocked_slots: {
        Row: { id: string; date: string; hour: string; created_at: string };
        Insert: { date: string; hour: string; created_at?: string };
        Update: { date?: string; hour?: string };
        Relationships: [];
      };
      recurring_blocks: {
        Row: { id: string; weekday: number; hour: string; created_at: string };
        Insert: { weekday: number; hour: string; created_at?: string };
        Update: { weekday?: number; hour?: string };
        Relationships: [];
      };
    };
    Views: {};
    Functions: {};
  };
}

export function getSupabaseAdmin(): SupabaseClient<Database> {
  return createClient<Database>(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
}

export function getSupabaseServer(cookies: AstroCookies, request: Request) {
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
