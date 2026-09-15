import { defineConfig } from "vitest/config";
import { loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// RLS tests (tests/unit/rls.test.ts) talk to the real Supabase project and
// need the same vars Next.js reads from .env.local — Vitest doesn't load
// those into process.env on its own, so do it explicitly here.
const env = loadEnv("", import.meta.dirname, "");
for (const [key, value] of Object.entries(env)) {
  process.env[key] ??= value;
}

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "."),
    },
  },
  test: {
    environment: "jsdom",
    include: ["tests/unit/**/*.test.ts", "tests/unit/**/*.test.tsx"],
    testTimeout: 20000,
  },
});
