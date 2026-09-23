import type { Cloze } from "@/lib/cloze";
import type { CurriculumWord } from "@/lib/words";

/** A curriculum word with its gapped example precomputed on the server. */
export type PracticeWord = CurriculumWord & { cloze: Cloze };

export const PASSES = [
  { key: "leer", label: "leer", title: "Palabras de hoy" },
  { key: "reconocer", label: "reconocer", title: "¿Qué palabra es?" },
  { key: "completar", label: "completar", title: "Completa la frase" },
  { key: "producir", label: "producir", title: "Escribe tu propia frase" },
  { key: "papel", label: "en papel", title: "Cuatro tareas por palabra" },
] as const;

/** Distractors come from the day's own batch: same frequency band, so they are
 *  plausibly confusable, and no extra content has to be written. */
export function optionsFor(
  word: PracticeWord,
  batch: PracticeWord[],
  count = 4,
): string[] {
  const others = batch
    .filter((w) => w.id !== word.id)
    .map((w) => w.lemma)
    .sort(() => Math.random() - 0.5)
    .slice(0, count - 1);

  return [word.lemma, ...others].sort(() => Math.random() - 0.5);
}
