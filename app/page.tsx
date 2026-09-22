import { DailyWords } from "@/app/components/DailyWords";
import { JournalGate } from "@/app/components/JournalGate";
import { PlacementTest } from "@/app/components/PlacementTest";
import { SweepMode } from "@/app/components/SweepMode";
import { serveWords, sweepBatch } from "@/app/lib/actions";
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
      .select("journal_submitted_at")
      .eq("day", day)
      .maybeSingle(),
    db
      .from("profile")
      .select("level, placement_completed_at, sweep_completed_at, sweep_position")
      .maybeSingle(),
  ]);

  // The journal gate comes first, every day, before anything else opens.
  if (!session?.journal_submitted_at) return <JournalGate />;

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

  // Only reached once the gate is written and the level is known, so serving
  // here cannot stamp words on a day she has not actually started.
  const words = await serveWords();

  return <DailyWords words={words} level={profile.level} />;
}
