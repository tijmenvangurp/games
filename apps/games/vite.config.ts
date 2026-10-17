import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { aliases } from "../../tools/aliases.ts";

export default defineConfig({
  root: import.meta.dirname,
  server: {
    host: "127.0.0.1",
    port: 5180,
  },
  preview: {
    host: "127.0.0.1",
    port: 4173,
  },
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: aliases,
  },
});
