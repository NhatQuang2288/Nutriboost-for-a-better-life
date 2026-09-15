// Seeds supabase `foods` table from data/foods/*.csv using the service-role
// key. Idempotent: clears existing rows sourced from these CSV files first,
// so re-running after editing the CSV doesn't create duplicates.
import { createClient } from "@supabase/supabase-js";
import { readFileSync, readdirSync } from "fs";
import path from "path";

const envPath = path.resolve(".env.local");
const env = Object.fromEntries(
  readFileSync(envPath, "utf8")
    .split("\n")
    .filter((l) => l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1)];
    }),
);

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

function parseCsv(content) {
  const [headerLine, ...lines] = content.trim().split("\n");
  const headers = headerLine.split(",");
  return lines.map((line) => {
    const values = line.split(",");
    return Object.fromEntries(headers.map((h, i) => [h, values[i]]));
  });
}

const foodsDir = path.resolve("data/foods");
const csvFiles = readdirSync(foodsDir).filter((f) => f.endsWith(".csv"));

let rows = [];
for (const file of csvFiles) {
  const content = readFileSync(path.join(foodsDir, file), "utf8");
  rows.push(...parseCsv(content));
}

const records = rows.map((r) => ({
  name_vi: r.name_vi,
  unit: r.unit,
  calo_per_unit: Number(r.calo_per_unit),
  protein_g: Number(r.protein_g),
  carb_g: Number(r.carb_g),
  fat_g: Number(r.fat_g),
  category: r.category,
  source: r.source,
}));

console.log(`Parsed ${records.length} foods from ${csvFiles.length} CSV file(s).`);

const { error: deleteError } = await admin.from("foods").delete().not("id", "is", null);
if (deleteError) {
  console.error("Failed to clear existing foods:", deleteError.message);
  process.exit(1);
}

const BATCH_SIZE = 100;
for (let i = 0; i < records.length; i += BATCH_SIZE) {
  const batch = records.slice(i, i + BATCH_SIZE);
  const { error } = await admin.from("foods").insert(batch);
  if (error) {
    console.error(`Failed to insert batch starting at row ${i}:`, error.message);
    process.exit(1);
  }
  console.log(`Inserted rows ${i + 1}-${i + batch.length}`);
}

console.log("Done seeding foods.");
