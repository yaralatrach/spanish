"use client";

import { useState } from "react";

import { WordCard } from "@/app/components/WordCard";
import { completeDay } from "@/app/lib/actions";
import type { CurriculumWord } from "@/lib/words";

const TASKS = [
  "Escribe la definición en inglés.",
  "Explícala en español.",
  "Úsala en una frase.",
  "Haz una foto de la hoja para cerrar el día.",
];

export function DailyWords({
  words,
  level,
  alreadyDone,
}: {
  words: CurriculumWord[];
  level: string | null;
  alreadyDone: boolean;
}) {
  const [decided, setDecided] = useState<Set<number>>(new Set());
  const [done, setDone] = useState(alreadyDone);
  const [closing, setClosing] = useState(false);

  if (words.length === 0) {
    return (
      <Closing
        title="Has terminado la lista"
        note="No quedan palabras nuevas por introducir."
      />
    );
  }

  if (done) {
    return (
      <Closing
        title="Día cerrado"
        note="Vuelve mañana. Las palabras de hoy entran en el repaso."
      />
    );
  }

  const remaining = words.length - decided.size;

  return (
    <div>
      <header className="rise">
        <p className="label">
          {new Intl.DateTimeFormat("es-ES", {
            weekday: "long",
            day: "numeric",
            month: "long",
            timeZone: "Europe/Madrid",
          }).format(new Date())}
          {level && ` · nivel ${level}`}
        </p>
        <h1 className="mt-2 font-display text-[2.5rem] leading-[1.05] tracking-tight sm:text-[3.25rem]">
          Palabras de hoy
        </h1>
        <p className="mt-3 font-body text-[1.0625rem] leading-relaxed text-ink-soft">
          Marca cada palabra según la conozcas o no. Lo que marques como nueva
          entra en el repaso.
        </p>

        {/* Progress reads as a row of marks rather than a bar: ten things to
            get through, and you can see which ones are left. */}
        <div className="mt-6 flex items-center gap-3">
          <div className="flex gap-1.5">
            {words.map((word) => (
              <span
                key={word.id}
                className={`h-1 w-6 rounded-full transition-colors duration-500 ${
                  decided.has(word.id) ? "bg-rubric" : "bg-rule"
                }`}
              />
            ))}
          </div>
          <span className="label tabular-nums">
            {decided.size}/{words.length}
          </span>
        </div>
      </header>

      <div className="mt-12 flex flex-col gap-8">
        {words.map((word, i) => (
          <WordCard
            key={word.id}
            word={word}
            index={i}
            onDecided={(id) =>
              setDecided((prev) => new Set(prev).add(id))
            }
          />
        ))}
      </div>

      <section className="mt-14 border-t border-rule pt-8">
        <p className="label">en papel</p>
        <h2 className="mt-2 font-display text-2xl tracking-tight">
          Cuatro tareas por palabra
        </h2>
        <ol className="mt-4 flex flex-col gap-2">
          {TASKS.map((task, i) => (
            <li key={task} className="flex gap-3 font-body text-[1.0625rem]">
              <span className="label mt-1 shrink-0 tabular-nums">{i + 1}</span>
              <span>{task}</span>
            </li>
          ))}
        </ol>
        <p className="mt-3 font-body text-[0.875rem] italic text-ink-faint">
          La subida de la foto todavía no está hecha.
        </p>

        <button
          type="button"
          disabled={closing}
          onClick={() => {
            setClosing(true);
            void completeDay().then((r) => {
              if (r.ok) setDone(true);
              else setClosing(false);
            });
          }}
          className="mt-8 min-h-12 w-full rounded-sm bg-ink px-6 font-body text-[1.0625rem] text-paper transition-opacity hover:opacity-90 disabled:opacity-40 sm:w-auto"
        >
          {closing ? "Cerrando…" : "Terminar el día"}
        </button>

        {remaining > 0 && (
          <p className="mt-3 font-body text-[0.875rem] italic text-ink-faint">
            Te quedan {remaining}{" "}
            {remaining === 1 ? "palabra" : "palabras"} por marcar.
          </p>
        )}
      </section>
    </div>
  );
}

function Closing({ title, note }: { title: string; note: string }) {
  return (
    <div className="rise flex min-h-[60dvh] flex-col justify-center">
      <h1 className="font-display text-[2.5rem] leading-[1.05] tracking-tight sm:text-[3.25rem]">
        {title}
      </h1>
      <p className="mt-4 font-body text-[1.0625rem] leading-relaxed text-ink-soft">
        {note}
      </p>
    </div>
  );
}
