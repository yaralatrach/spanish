import type { PracticeWord } from "@/lib/practice";

/** Words come back for review carrying the rung they reached. */
export type DueWord = PracticeWord & { srs_step: number };

export type Exercise = "completar" | "reconocer" | "traducir" | "producir";

/**
 * Which exercise a word gets, by how far up the ladder it is. Each rung is
 * harder than the one below: retrieve it in context, then from its meaning,
 * then from English with no Spanish to lean on, then unprompted.
 *
 * A rung whose content is missing falls back to producing a sentence, which
 * needs nothing but the word itself and is the hardest of the four anyway.
 */
export function exerciseFor(word: DueWord): Exercise {
  const step = word.srs_step ?? 0;

  if (step <= 0 && word.cloze) return "completar";
  if (step === 1 && word.definition_es) return "reconocer";
  if (step === 2 && word.definition_en) return "traducir";
  if (step === 4 && word.cloze) return "completar";
  return "producir";
}

/** Review is capped: a backlog should not become a reason to skip the day. */
export const REVIEW_LIMIT = 20;
