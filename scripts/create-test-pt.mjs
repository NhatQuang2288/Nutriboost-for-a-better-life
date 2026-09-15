// One-off dev script to create a pre-confirmed PT test user, bypassing
// Supabase's email-confirmation rate limit during manual verification.
// Not part of the app; safe to delete after Phase 2 is confirmed working.
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1)];
    }),
);

const admin = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
);

const email = process.argv[2] ?? "pt.verify@nutriboost.test";
const password = process.argv[3] ?? "TestPass123!";
const fullName = process.argv[4] ?? "PT Kiểm Thử";

const { data, error } = await admin.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  user_metadata: { role: "pt", full_name: fullName },
});

if (error) {
  console.error("ERROR", error.message);
  process.exit(1);
}

const { error: subError } = await admin.from("subscriptions").insert({
  pt_id: data.user.id,
  tier: "plus",
  max_clients: 5,
});

if (subError) console.error("SUB_ERROR", subError.message);

console.log("Created user:", data.user.id, email);
