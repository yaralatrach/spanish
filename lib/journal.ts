/** The daily journal gate does not open below this length. */
export const MIN_JOURNAL_CHARS = 100;

export type ActionResult = { ok: true } | { ok: false; error: string };
