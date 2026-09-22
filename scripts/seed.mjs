// Loads data/words.json into Supabase. Run once, after the migration.
//
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed.mjs
//
// Idempotent: re-running it leaves the same rows, so a partial run is safe to
// repeat. words.id is pinned to rank so word_forms can reference it.

import { readFileSync } from "node:fs";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY. See .env.example.");
  process.exit(1);
}

const words = JSON.parse(readFileSync(new URL("../data/words.json", import.meta.url)));

async function insert(table, rows) {
  const res = await fetch(`${url.replace(/\/$/, "")}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal,resolution=ignore-duplicates",
    },
    body: JSON.stringify(rows),
  });
  if (!res.ok) {
    throw new Error(`${table} ${res.status}: ${(await res.text()).slice(0, 400)}`);
  }
}

async function inBatches(table, rows, size) {
  for (let i = 0; i < rows.length; i += size) {
    await insert(table, rows.slice(i, i + size));
    process.stdout.write(`  ${table}: ${Math.min(i + size, rows.length)}/${rows.length}\r`);
  }
  process.stdout.write("\n");
}

const wordRows = words.map((w) => ({
  id: w.rank,
  rank: w.rank,
  lemma: w.lemma,
  pos: w.pos,
}));

const formRows = [];
for (const w of words) for (const form of w.forms) formRows.push({ form, word_id: w.rank });

await inBatches("words", wordRows, 1000);
await inBatches("word_forms", formRows, 2000);

console.log(`Seeded ${wordRows.length} lemmas and ${formRows.length} forms.`);
console.log("Now run, once, in the SQL editor:");
console.log("  select setval(pg_get_serial_sequence('words','id'), (select max(id) from words));");
