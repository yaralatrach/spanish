import { DailyWords } from "@/app/components/DailyWords";
import { JournalGate } from "@/app/components/JournalGate";
import { PlacementTest } from "@/app/components/PlacementTest";
import { serveWords } from "@/app/lib/actions";
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
    db.from("profile").select("level, placement_completed_at").maybeSingle(),
  ]);

  // The journal gate comes first, every day, before anything else opens.
  if (!session?.journal_submitted_at) return <JournalGate />;

  if (!profile?.placement_completed_at) return <PlacementTest />;

  // Only reached once the gate is written and the level is known, so serving
  // here cannot stamp words on a day she has not actually started.
  const words = await serveWords();

  return <DailyWords words={words} level={profile.level} />;
}
