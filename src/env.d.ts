/// <reference types="astro/client" />

type Runtime = import("@astrojs/cloudflare").Runtime<Env>;

interface Env {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  RESEND_API_KEY: string;
  CONTACT_EMAIL: string;
  SESSION: KVNamespace;
}

declare namespace App {
  interface Locals extends Runtime {
    user: import("@supabase/supabase-js").User | null;
  }
}
