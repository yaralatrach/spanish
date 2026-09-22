// Emits the curriculum as chunked SQL, so it can be applied through whichever
// path is to hand: psql, the dashboard SQL editor, or the Supabase MCP tools.
//
// Usage: node scripts/seed-sql.mjs data/words.json <out-dir> [rows-per-chunk]

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const [input, outDir, chunkArg] = process.argv.slice(2);
if (!input || !outDir) throw new Error("usage: seed-sql.mjs <words.json> <out-dir> [rows]");
const CHUNK = Number(chunkArg) || 2500;

const quote = (s) => "'" + String(s).replaceAll("'", "''") + "'";

const words = JSON.parse(readFileSync(input, "utf8"));
mkdirSync(outDir, { recursive: true });

const files = [];
function emit(name, sql) {
  const path = join(outDir, name);
  writeFileSync(path, sql);
  files.push(path);
}

// words.id is a bigserial, but the form table needs to reference rows by id,
// so pin id = rank and reset the sequence afterwards. Ranks are unique and
// gapless, which makes them a safe surrogate key here.
for (let i = 0; i < words.length; i += CHUNK) {
  const slice = words.slice(i, i + CHUNK);
  const values = slice
    .map((w) => `(${w.rank},${w.rank},${quote(w.lemma)},${quote(w.pos)})`)
    .join(",\n");
  emit(
    `words_${String(i / CHUNK + 1).padStart(2, "0")}.sql`,
    `insert into words (id, rank, lemma, pos) values\n${values}\non conflict (id) do nothing;\n`,
  );
}

const formRows = [];
for (const w of words) for (const form of w.forms) formRows.push([form, w.rank]);

for (let i = 0; i < formRows.length; i += CHUNK) {
  const slice = formRows.slice(i, i + CHUNK);
  const values = slice.map(([f, id]) => `(${quote(f)},${id})`).join(",\n");
  emit(
    `forms_${String(i / CHUNK + 1).padStart(2, "0")}.sql`,
    `insert into word_forms (form, word_id) values\n${values}\non conflict do nothing;\n`,
  );
}

emit(
  "zz_finalize.sql",
  `select setval(pg_get_serial_sequence('words','id'), (select max(id) from words));\n`,
);

console.log(`${words.length} words, ${formRows.length} forms -> ${files.length} files`);
