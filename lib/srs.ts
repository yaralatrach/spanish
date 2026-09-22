// Review ladder. A correct review advances one step; a lapse drops back to the
// start, because a word you have just failed is not a word you know.
const LADDER_MINUTES = [
  25,          // same session, after the new-word introduction
  60 * 24,     // next day
  60 * 24 * 3,
  60 * 24 * 7,
  60 * 24 * 14,
  60 * 24 * 30,
] as const;

export const LAST_STEP = LADDER_MINUTES.length - 1;

/** When a word at `step` should next come up for review. */
export function dueAfter(step: number, from: Date = new Date()): Date {
  const clamped = Math.min(Math.max(step, 0), LAST_STEP);
  return new Date(from.getTime() + LADDER_MINUTES[clamped] * 60_000);
}

/** Advance past the end of the ladder and the word is considered known. */
export function isGraduated(step: number): boolean {
  return step > LAST_STEP;
}
