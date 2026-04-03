// @ts-check
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, fontProviders } from "astro/config";

import vercel from "@astrojs/vercel";

// https://astro.build/config
export default defineConfig({
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
      cssVariable: "--font-noto",
      fallbacks: ["sans-serif"],
      subsets: ["greek", "latin"],
      styles: ["normal"],
    },
  ],

  adapter: vercel(),
});
