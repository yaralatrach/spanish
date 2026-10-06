import type { PracticeWord } from "@/lib/practice";

/** Words come back for review carrying the rung they reached. */
export type DueWord = PracticeWord & { srs_step: number };

export type Exercise = "reconocer" | "completar" | "traducir" | "producir";

/**
 * The ladder, easiest first:
 *
 *   reconocer  pick it out of four, given its Spanish definition
 *   completar  type it into the sentence it came from
 *   traducir   type it from the English alone, no Spanish on screen
 *   producir   use it in a sentence of your own
 *
 * The first version of this had completar at the bottom and reconocer above
 * it, on the reasoning that a whole sentence gives more context to work from.
 * That was wrong: context does not help if the form cannot be retrieved at
 * all, so review opened with free recall on exactly the words she knew least,
 * and she blanked. Recognition is the cheapest retrieval there is and belongs
 * first.
 */
const LADDER: Exercise[] = ["reconocer", "completar", "traducir", "producir"];

/** Whether a word carries what an exercise needs to run at all. */
function possible(word: DueWord, exercise: Exercise): boolean {
  if (exercise === "reconocer") return Boolean(word.definition_es);
  if (exercise === "completar") return Boolean(word.cloze);
  if (exercise === "traducir") return Boolean(word.definition_en);
  return true; // producir needs nothing but the word
}

export function exerciseFor(word: DueWord): Exercise {
  const step = Math.max(0, word.srs_step ?? 0);
  const wanted = Math.min(step, LADDER.length - 1);

  // Step down to the hardest exercise at or below the wanted rung that this
  // word can actually run, rather than jumping to producir and asking for a
  // sentence using a word with no definition to hand.
  for (let i = wanted; i >= 0; i--) {
    if (possible(word, LADDER[i])) return LADDER[i];
  }
  return "producir";
}

/** Review is capped: a backlog should not become a reason to skip the day. */
export const REVIEW_LIMIT = 20;
