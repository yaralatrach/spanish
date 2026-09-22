import { JournalGate } from "@/app/components/JournalGate";
import { PlacementTest } from "@/app/components/PlacementTest";
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

  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-2xl font-semibold">Diario guardado</h1>
      <p className="text-neutral-600">
        Nivel actual: <strong>{profile.level}</strong>
      </p>
      <p className="text-sm text-neutral-500">
        Las palabras del día todavía no están listas.
      </p>
    </div>
  );
}
