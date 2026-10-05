import prompts from "@/data/prompts.json";

export type Prompt = { theme: string; prompt: string };

export const PROMPTS = prompts as Prompt[];

/**
 * The day's prompt, chosen by the date rather than at random, so a refresh
 * does not swap the question out from under a half-written entry.
 *
 * The list is walked in order and stepped by a stride that is coprime with its
 * length, so consecutive days are never from the same theme while every prompt
 * still comes up exactly once per cycle.
 */
const STRIDE = 7;

export function promptForDay(day: string, offset = 0): Prompt {
  const index = dayNumber(day) + offset;
  return PROMPTS[((index * STRIDE) % PROMPTS.length + PROMPTS.length) % PROMPTS.length];
}

/** Days since an arbitrary fixed point, from the YYYY-MM-DD string. */
function dayNumber(day: string): number {
  return Math.floor(Date.parse(`${day}T00:00:00Z`) / 86_400_000);
}
