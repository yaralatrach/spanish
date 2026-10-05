import { DailyWords } from "@/app/components/DailyWords";
import { JournalGate } from "@/app/components/JournalGate";
import { JournalReview } from "@/app/components/JournalReview";
import { PlacementTest } from "@/app/components/PlacementTest";
import { Repaso } from "@/app/components/Repaso";
import { SweepMode } from "@/app/components/SweepMode";
import { dueWords, serveWords, sweepBatch } from "@/app/lib/actions";
import { buildCloze } from "@/lib/cloze";
import type { PracticeWord } from "@/lib/practice";
import { db } from "@/lib/supabase";
import { todayInMadrid } from "@/lib/today";

// Every decision on this page depends on today's data. Without this the route
// prerenders at build time and the gate freezes at whatever was true then.
export const dynamic = "force-dynamic";

export default async function Home() {
  const day = todayInMadrid();

  const [{ data: session }, { data: profile }] = await Promise.all([
    db
      .from("sessions")
      .select(
        "journal_submitted_at, completed_at, pass_index, review_seen_at, repaso_done_at, prompt_offset",
      )
      .eq("day", day)
      .maybeSingle(),
    db
      .from("profile")
      .select("level, placement_completed_at, sweep_completed_at, sweep_position")
      .maybeSingle(),
  ]);

  // The journal gate comes first, every day, before anything else opens.
  if (!session?.journal_submitted_at) {
    return <JournalGate day={day} initialOffset={session?.prompt_offset ?? 0} />;
  }

  // Then what she just wrote, corrected. A step of the day in its own right,
  // not a prop of the words screen: the rest of the day is sequenced behind
  // it, so it has to mark itself done even when there is no key to call.
  if (!session.review_seen_at) return <JournalReview />;

  if (!profile?.placement_completed_at) return <PlacementTest />;

  // The sweep runs once, between placement and the first daily session, so the
  // daily ten do not start at rank 1 for someone who placed well above it.
  if (!profile.sweep_completed_at) {
    const batch = await sweepBatch(profile.sweep_position ?? 0);
    const { count } = await db
      .from("words")
      .select("id", { count: "exact", head: true });
    return <SweepMode initialWords={batch} total={count ?? 0} />;
  }

  // Review comes before the day's new words: what is already half-known is
  // worth more than what is not known at all.
  if (!session.repaso_done_at) {
    const due = await dueWords();
    if (due.length > 0) return <Repaso words={due} />;
  }

  // Only reached once the gate is written and the level is known, so serving
  // here cannot stamp words on a day she has not actually started.
  const words = await serveWords();
  const ids = words.map((w) => w.id);

  // The gapped sentence and the resume state are both built here rather than in
  // the browser: the forms table is server-side, and a refresh mid-session has
  // to land back where it left off.
  const [{ data: forms }, { data: progress }] = await Promise.all([
    db.from("word_forms").select("word_id, form").in("word_id", ids),
    db
      .from("word_progress")
      .select("word_id, status, confidence")
      .in("word_id", ids),
  ]);

  const formsByWord = new Map<number, string[]>();
  for (const row of forms ?? []) {
    const key = row.word_id as number;
    formsByWord.set(key, [...(formsByWord.get(key) ?? []), row.form as string]);
  }

  const confidenceByWord = new Map(
    (progress ?? []).map((p) => [p.word_id as number, (p.confidence as number) ?? 0]),
  );

  const practice: PracticeWord[] = words.map((word) => ({
    ...word,
    confidence: confidenceByWord.get(word.id) ?? 0,
    cloze: word.example_es
      ? buildCloze(word.example_es, formsByWord.get(word.id) ?? [word.lemma])
      : null,
  }));

  return (
    <DailyWords
      words={practice}
      level={profile.level}
      alreadyDone={Boolean(session.completed_at)}
      initialPass={session.pass_index ?? 0}
      initiallyNew={(progress ?? [])
        .filter((p) => p.status === "learning")
        .map((p) => p.word_id as number)}
    />
  );
}
