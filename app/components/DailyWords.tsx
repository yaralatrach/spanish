import { WordCard } from "@/app/components/WordCard";
import type { CurriculumWord } from "@/lib/words";

export function DailyWords({
  words,
  level,
}: {
  words: CurriculumWord[];
  level: string | null;
}) {
  if (words.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        <h1 className="text-2xl font-semibold">Has terminado la lista</h1>
        <p className="text-neutral-600">
          No quedan palabras nuevas por introducir.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold">Palabras de hoy</h1>
        <p className="mt-1 text-sm text-neutral-600">
          {words.length} palabras · nivel {level ?? "—"}. Marca las que ya
          conozcas; las demás entran en repaso.
        </p>
      </header>

      <div className="flex flex-col gap-4">
        {words.map((word) => (
          <WordCard key={word.id} word={word} />
        ))}
      </div>

      <section className="rounded-xl border border-neutral-200 bg-neutral-50 p-5">
        <h2 className="font-semibold">En papel</h2>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-neutral-700">
          <li>Escribe la definición en inglés.</li>
          <li>Explícala en español.</li>
          <li>Úsala en una frase.</li>
          <li>Haz una foto de la hoja para cerrar el día.</li>
        </ol>
        <p className="mt-3 text-xs text-neutral-500">
          La subida de la foto todavía no está hecha.
        </p>
      </section>
    </div>
  );
}
