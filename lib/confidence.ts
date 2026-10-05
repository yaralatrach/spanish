export type Outcome = "clean" | "hinted" | "revealed" | "wrong";

/** What a single attempt is worth on its own. */
const WORTH: Record<Outcome, number> = {
  clean: 100,
  hinted: 60,
  revealed: 20,
  wrong: 0,
};

/**
 * How heavily the newest attempt counts. Low enough that one bad evening does
 * not erase a word she has produced cleanly for a week, high enough that
 * repeated failure moves the number within a few sessions.
 */
const WEIGHT = 0.35;

export function nextConfidence(current: number, outcome: Outcome): number {
  return Math.round(current * (1 - WEIGHT) + WORTH[outcome] * WEIGHT);
}

export type Band = { key: string; label: string; tone: string };

/** Four bands, named the way she would describe the word herself. */
export function band(confidence: number): Band {
  if (confidence >= 80) return { key: "dominada", label: "dominada", tone: "verde" };
  if (confidence >= 55) return { key: "asentada", label: "asentándose", tone: "ink-soft" };
  if (confidence >= 25) return { key: "floja", label: "floja", tone: "rubric" };
  return { key: "nueva", label: "sin asentar", tone: "ink-faint" };
}
