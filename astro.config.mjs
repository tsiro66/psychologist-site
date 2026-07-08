// @ts-check
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, fontProviders } from "astro/config";

import cloudflare from "@astrojs/cloudflare";

import svelte from "@astrojs/svelte";

// https://astro.build/config
export default defineConfig({
  site: "https://katerinakritikou.gr",
  vite: {
    plugins: [tailwindcss()],
  },

  fonts: [
    {
      provider: fontProviders.google(),
      name: "Google Sans",
      cssVariable: "--font-google",
      fallbacks: ["sans-serif"],
      subsets: ["greek", "latin"],
      styles: ["normal"],
    },
    {
      provider: fontProviders.google(),
      name: "Source Serif 4",
      cssVariable: "--font-source-serif",
      fallbacks: ["sans-serif"],
      subsets: ["greek", "latin"],
      styles: ["normal"],
    },
  ],

  adapter: cloudflare(),
  integrations: [svelte()],
});