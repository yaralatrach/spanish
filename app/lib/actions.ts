"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/supabase";
import { MIN_JOURNAL_CHARS, type ActionResult } from "@/lib/journal";
import { dueAfter } from "@/lib/srs";
import { NEW_WORDS_PER_DAY } from "@/lib/curriculum";
import type { CurriculumWord } from "@/lib/words";
import { todayInMadrid } from "@/lib/today";
import {
  PLACEMENT_QUESTIONS,
  scoreLevel,
  type LevelBand,
} from "@/lib/placementQuestions";

/**
 * The daily gate. Nothing else in the app opens until this is written, so it
 * is deliberately the only way to create the day's session row.
 */
export async function submitJournal(text: string): Promise<ActionResult> {
  const entry = text.trim();
  if (entry.length < MIN_JOURNAL_CHARS) {
    return {
      ok: false,
      error: `Escribe al menos ${MIN_JOURNAL_CHARS} caracteres (llevas ${entry.length}).`,
    };
  }

  const day = todayInMadrid();
  const { error } = await db.from("sessions").upsert(
    {
      day,
      journal_text: entry,
      journal_submitted_at: new Date().toISOString(),
    },
    { onConflict: "day" },
  );

  if (error) return { ok: false, error: error.message };

  await recordFreeWritingEvidence(entry);
  revalidatePath("/");
  return { ok: true };
}

/**
 * Any curriculum word she uses unprompted in her own writing counts as known.
 * That is stronger evidence than clicking "I know this" on a word the app just
 * put in front of her, so it overrides an earlier "unknown" click rather than
 * queueing for review.
 *
 * Matching is a lookup against the precomputed word_forms table: no runtime
 * NLP, and a form outside the curriculum simply finds nothing.
 */
async function recordFreeWritingEvidence(text: string): Promise<void> {
  const tokens = tokenize(text);
  if (tokens.length === 0) return;

  // Exact first, so an accent she did type still distinguishes the word.
  const { data: exact, error } = await db
    .from("word_forms")
    .select("form, word_id")
    .in("form", tokens);

  if (error) return;

  const wordIds = new Set((exact ?? []).map((m) => m.word_id as number));

  // Only tokens that matched nothing fall back to accent-insensitive matching.
  // Typing "reunion" for "reunión" is a spelling slip, not evidence she does
  // not know the word, and on real input that slip is the commonest miss.
  const matchedForms = new Set((exact ?? []).map((m) => m.form as string));
  const unmatched = tokens.filter((t) => !matchedForms.has(t));

  if (unmatched.length > 0) {
    const { data: folded } = await db
      .from("word_forms")
      .select("word_id")
      .in("form_folded", unmatched.map(foldAccents));
    for (const row of folded ?? []) wordIds.add(row.word_id as number);
  }

  if (wordIds.size === 0) return;
  const now = new Date().toISOString();

  await db.from("word_progress").upsert(
    [...wordIds].map((word_id) => ({
      word_id,
      status: "known",
      known_source: "free_writing",
      first_known_at: now,
      updated_at: now,
    })),
    { onConflict: "word_id" },
  );
}

/** Lowercase word tokens, accents preserved: exact matching runs on these. */
function tokenize(text: string): string[] {
  const matched = text.toLowerCase().match(/[\p{L}\p{M}]+/gu);
  return matched ? [...new Set(matched)] : [];
}

/**
 * Strips the five vowel accents and the diaeresis. ñ is left alone: it is its
 * own letter rather than an accented n, and folding it would collide año with
 * ano. Must stay in step with the SQL translate() in the migration.
 */
function foldAccents(form: string): string {
  return form.replace(
    /[áéíóúü]/g,
    (c) => ({ á: "a", é: "e", í: "i", ó: "o", ú: "u", ü: "u" })[c] ?? c,
  );
}

export async function submitPlacement(
  answers: Record<string, string>,
): Promise<ActionResult> {
  const correctByBand: Record<LevelBand, number> = {
    A1: 0,
    A2: 0,
    B1: 0,
    B2: 0,
  };

  const rows = PLACEMENT_QUESTIONS.map((question) => {
    const answer = answers[question.id] ?? "";
    const correct = answer === question.answer;
    if (correct) correctByBand[question.band] += 1;
    return {
      question_id: question.id,
      answer,
      correct,
      level_band: question.band,
    };
  });

  const { error: responsesError } = await db
    .from("placement_responses")
    .insert(rows);
  if (responsesError) return { ok: false, error: responsesError.message };

  const { error: profileError } = await db.from("profile").upsert(
    {
      id: true,
      level: scoreLevel(correctByBand),
      placement_completed_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );
  if (profileError) return { ok: false, error: profileError.message };

  revalidatePath("/");
  return { ok: true };
}

/**
 * The day's new words. Picking and stamping happens in one statement inside
 * Postgres, so refreshing mid-introduction re-shows the same words rather than
 * handing out a second batch.
 */
export async function serveWords(): Promise<CurriculumWord[]> {
  const { data, error } = await db.rpc("serve_daily_words", {
    p_day: todayInMadrid(),
    p_count: NEW_WORDS_PER_DAY,
  });
  if (error) throw new Error(error.message);
  return (data ?? []) as CurriculumWord[];
}

/**
 * A click is weaker evidence than production: she is being asked about a word
 * the app just put in front of her. So it records the click, but never
 * overwrites a word already established through free writing.
 */
export async function markWord(
  wordId: number,
  known: boolean,
): Promise<ActionResult> {
  const now = new Date().toISOString();

  const { data: existing } = await db
    .from("word_progress")
    .select("known_source")
    .eq("word_id", wordId)
    .maybeSingle();

  if (existing?.known_source === "free_writing") return { ok: true };

  const { error } = await db.from("word_progress").upsert(
    {
      word_id: wordId,
      status: known ? "known" : "learning",
      known_source: known ? "click" : null,
      first_known_at: known ? now : null,
      due_at: known ? null : dueAfter(0).toISOString(),
      srs_step: 0,
      updated_at: now,
    },
    { onConflict: "word_id" },
  );

  if (error) return { ok: false, error: error.message };
  revalidatePath("/");
  return { ok: true };
}

/** Family members below the cutoff have no words row, so they record here. */
export async function markDerived(
  lemma: string,
  rootWordId: number,
  known: boolean,
): Promise<ActionResult> {
  const { error } = await db.from("derived_progress").upsert(
    {
      lemma,
      root_word_id: rootWordId,
      status: known ? "known" : "unknown",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "lemma" },
  );
  if (error) return { ok: false, error: error.message };
  revalidatePath("/");
  return { ok: true };
}

export const SWEEP_BATCH = 100;

/** The next batch of never-assessed words, in frequency order. */
export async function sweepBatch(afterRank: number): Promise<CurriculumWord[]> {
  const { data, error } = await db.rpc("sweep_batch", {
    p_after_rank: afterRank,
    p_count: SWEEP_BATCH,
  });
  if (error) throw new Error(error.message);
  return (data ?? []) as CurriculumWord[];
}

/**
 * Records a whole sweep batch at once. Unknown words enter review at the first
 * rung; known ones are settled. A word she has already produced in her own
 * writing is left alone, since that is the stronger evidence.
 */
export async function submitSweep(
  unknownIds: number[],
  allIds: number[],
  lastRank: number,
): Promise<ActionResult> {
  const now = new Date().toISOString();
  const unknown = new Set(unknownIds);

  const { data: produced } = await db
    .from("word_progress")
    .select("word_id")
    .eq("known_source", "free_writing")
    .in("word_id", allIds);

  const settled = new Set((produced ?? []).map((r) => r.word_id as number));
  const rows = allIds
    .filter((id) => !settled.has(id))
    .map((id) => ({
      word_id: id,
      status: unknown.has(id) ? "learning" : "known",
      known_source: unknown.has(id) ? null : "click",
      first_known_at: unknown.has(id) ? null : now,
      due_at: unknown.has(id) ? dueAfter(0).toISOString() : null,
      srs_step: 0,
      updated_at: now,
    }));

  if (rows.length > 0) {
    const { error } = await db
      .from("word_progress")
      .upsert(rows, { onConflict: "word_id" });
    if (error) return { ok: false, error: error.message };
  }

  const { error: profileError } = await db
    .from("profile")
    .upsert({ id: true, sweep_position: lastRank }, { onConflict: "id" });
  if (profileError) return { ok: false, error: profileError.message };

  revalidatePath("/");
  return { ok: true };
}

/** Ends the sweep, so the daily loop takes over from the next visit. */
export async function finishSweep(): Promise<ActionResult> {
  const { error } = await db
    .from("profile")
    .upsert(
      { id: true, sweep_completed_at: new Date().toISOString() },
      { onConflict: "id" },
    );
  if (error) return { ok: false, error: error.message };
  revalidatePath("/");
  return { ok: true };
}
