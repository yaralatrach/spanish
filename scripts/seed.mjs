// Loads data/words.json into Supabase. Run once, after the migration:
//
//   npm run seed
//
// Reads .env.local itself rather than relying on the shell, because exporting
// variables differs between bash and PowerShell and this only has to work.
// Idempotent: re-running it leaves the same rows, so a partial run is safe to
// repeat. words.id is pinned to rank so word_forms can reference it.

import { readFileSync, existsSync } from "node:fs";

/** Minimal .env reader: KEY=value, ignoring blanks, comments and quotes. */
function readEnvFile(path) {
  const values = {};
  if (!existsSync(path)) return values;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 1) continue;
    const value = trimmed.slice(eq + 1).trim();
    values[trimmed.slice(0, eq).trim()] = value.replace(/^["']|["']$/g, "");
  }
  return values;
}

const fileEnv = readEnvFile(new URL("../.env.local", import.meta.url));
const url = process.env.SUPABASE_URL || fileEnv.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || fileEnv.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error(
    "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.\n" +
      "Copy .env.example to .env.local and fill both in, then run: npm run seed",
  );
  process.exit(1);
}

const words = JSON.parse(readFileSync(new URL("../data/words.json", import.meta.url)));

async function insert(table, rows, resolution) {
  const res = await fetch(`${url.replace(/\/$/, "")}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: `return=minimal,resolution=${resolution}`,
    },
    body: JSON.stringify(rows),
  });
  if (!res.ok) {
    throw new Error(`${table} ${res.status}: ${(await res.text()).slice(0, 400)}`);
  }
}

async function inBatches(table, rows, size, resolution = "ignore-duplicates") {
  for (let i = 0; i < rows.length; i += size) {
    await insert(table, rows.slice(i, i + size), resolution);
    process.stdout.write(`  ${table}: ${Math.min(i + size, rows.length)}/${rows.length}\r`);
  }
  process.stdout.write("\n");
}

const wordRows = words.map((w) => ({
  id: w.rank,
  rank: w.rank,
  lemma: w.lemma,
  pos: w.pos,
  conjugations: w.conjugations ?? [],
  family: w.family ?? [],
  participle_of: w.participleOf ?? null,
}));

/**
 * Strips the five vowel accents and the diaeresis, leaving ñ alone: it is its
 * own letter, not an accented n, and folding it would collide año with ano.
 * Must stay in step with foldAccents() in app/lib/actions.ts and the
 * translate() in the migration.
 */
const fold = (form) =>
  form.replace(/[áéíóúü]/g, (c) => ({ á: "a", é: "e", í: "i", ó: "o", ú: "u", ü: "u" })[c] ?? c);

const formRows = [];
for (const w of words) {
  for (const form of w.forms) {
    formRows.push({ form, form_folded: fold(form), word_id: w.rank });
  }
}

// merge-duplicates so re-running picks up regenerated conjugations rather
// than silently skipping rows that already exist.
await inBatches("words", wordRows, 1000, "merge-duplicates");
await inBatches("word_forms", formRows, 2000);

console.log(`Seeded ${wordRows.length} lemmas and ${formRows.length} forms.`);
