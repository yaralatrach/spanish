// Session boundaries are Madrid-local, not UTC: a journal written at 00:30 in
// Madrid belongs to that day, and one written at 23:50 belongs to the day
// that is ending, which UTC would get wrong for half the year.
const MADRID = "Europe/Madrid";

/** Today in Europe/Madrid as an ISO date string (YYYY-MM-DD). */
export function todayInMadrid(now: Date = new Date()): string {
  // en-CA formats as YYYY-MM-DD, which is what Postgres `date` expects.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: MADRID,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}
