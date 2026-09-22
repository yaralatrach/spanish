"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/supabase";
import { MIN_JOURNAL_CHARS, type ActionResult } from "@/lib/journal";
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

  const { data: matches, error } = await db
    .from("word_forms")
    .select("word_id")
    .in("form", tokens);

  if (error || !matches || matches.length === 0) return;

  const wordIds = [...new Set(matches.map((m) => m.word_id as number))];
  const now = new Date().toISOString();

  await db.from("word_progress").upsert(
    wordIds.map((word_id) => ({
      word_id,
      status: "known",
      known_source: "free_writing",
      first_known_at: now,
      updated_at: now,
    })),
    { onConflict: "word_id" },
  );
}

/** Lowercase word tokens, accents preserved (canto and cantó are different). */
function tokenize(text: string): string[] {
  const matched = text.toLowerCase().match(/[\p{L}\p{M}]+/gu);
  return matched ? [...new Set(matched)] : [];
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
