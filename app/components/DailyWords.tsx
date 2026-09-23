"use client";

import { useState } from "react";

import { Completar, Producir, Reconocer } from "@/app/components/Passes";
import { PassShell, Primary } from "@/app/components/PassShell";
import { WordCard } from "@/app/components/WordCard";
import { completeDay, setPassIndex } from "@/app/lib/actions";
import type { PracticeWord } from "@/lib/practice";

const TASKS = [
  "Escribe la definición en inglés.",
  "Explícala en español.",
  "Úsala en una frase.",
  "Haz una foto de la hoja para cerrar el día.",
];

const TOTAL_PASSES = 5;

export function DailyWords({
  words,
  level,
  alreadyDone,
  initialPass,
  initiallyNew,
}: {
  words: PracticeWord[];
  level: string | null;
  alreadyDone: boolean;
  initialPass: number;
  initiallyNew: number[];
}) {
  const [pass, setPass] = useState(initialPass);
  const [decided, setDecided] = useState<Set<number>>(
    () => new Set(initiallyNew),
  );
  const [seen, setSeen] = useState<Set<number>>(() => new Set(initiallyNew));
  const [done, setDone] = useState(alreadyDone);
  const [closing, setClosing] = useState(false);

  // Only what she said she did not know gets practised. Knowing seven of ten
  // means practising three, which is the point of the sweep and the journal
  // evidence as well.
  const unknown = words.filter((w) => decided.has(w.id));

  function go(next: number) {
    setPass(next);
    void setPassIndex(next);
    if (typeof window !== "undefined") window.scrollTo({ top: 0 });
  }

  /** Skips forward over any pass with nothing eligible in it. */
  function advanceFrom(current: number) {
    let next = current + 1;
    while (next < TOTAL_PASSES - 1 && eligible(next).length === 0) next += 1;
    go(next);
  }

  function eligible(index: number): PracticeWord[] {
    if (index === 1) return unknown.filter((w) => w.definition_es);
    if (index === 2) return unknown.filter((w) => w.cloze);
    if (index === 3) return unknown;
    return [];
  }

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

  if (pass === 1) {
    return (
      <Reconocer
        words={eligible(1)}
        batch={words}
        position={1}
        total={TOTAL_PASSES}
        onDone={() => advanceFrom(1)}
      />
    );
  }

  if (pass === 2) {
    return (
      <Completar
        words={eligible(2)}
        position={2}
        total={TOTAL_PASSES}
        onDone={() => advanceFrom(2)}
      />
    );
  }

  if (pass === 3) {
    return (
      <Producir
        words={eligible(3)}
        position={3}
        total={TOTAL_PASSES}
        onDone={() => advanceFrom(3)}
      />
    );
  }

  if (pass === 4) {
    return (
      <PassShell
        label="en papel"
        title="Cuatro tareas por palabra"
        note="Lejos de la pantalla, a mano. La escritura es la mitad del método."
        position={4}
        total={TOTAL_PASSES}
      >
        <ol className="flex flex-col gap-3">
          {TASKS.map((task, i) => (
            <li key={task} className="flex gap-4 font-body text-[1.125rem]">
              <span className="label mt-1.5 shrink-0 tabular-nums">{i + 1}</span>
              <span>{task}</span>
            </li>
          ))}
        </ol>

        <p className="mt-6 font-body text-[0.9375rem] italic text-ink-faint">
          La subida de la foto todavía no está hecha, así que por ahora el día
          se cierra a mano.
        </p>

        <div className="mt-10">
          <Primary
            disabled={closing}
            onClick={() => {
              setClosing(true);
              void completeDay().then((r) => {
                if (r.ok) setDone(true);
                else setClosing(false);
              });
            }}
          >
            {closing ? "Cerrando…" : "Terminar el día"}
          </Primary>
        </div>
      </PassShell>
    );
  }

  // Pass 0: read the entries and say, for each, whether it is already known.
  const allSeen = seen.size === words.length;

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
          Lee cada entrada y di si ya la conoces. Las que marques como nuevas se
          practican a continuación.
        </p>

        <div className="mt-6 flex items-center gap-3">
          <div className="flex gap-1.5">
            {words.map((word) => (
              <span
                key={word.id}
                className={`h-1 w-6 rounded-full transition-colors duration-500 ${
                  seen.has(word.id) ? "bg-rubric" : "bg-rule"
                }`}
              />
            ))}
          </div>
          <span className="label tabular-nums">
            {seen.size}/{words.length}
          </span>
        </div>
      </header>

      <div className="mt-12 flex flex-col gap-8">
        {words.map((word, i) => (
          <WordCard
            key={word.id}
            word={word}
            index={i}
            onDecided={(id, known) => {
              setSeen((prev) => new Set(prev).add(id));
              setDecided((prev) => {
                const next = new Set(prev);
                if (known) next.delete(id);
                else next.add(id);
                return next;
              });
            }}
          />
        ))}
      </div>

      <div className="mt-14 border-t border-rule pt-8">
        <Primary disabled={!allSeen} onClick={() => advanceFrom(0)}>
          {unknown.length > 0
            ? `Practicar ${unknown.length}`
            : "Continuar"}
        </Primary>
        {!allSeen && (
          <p className="mt-3 font-body text-[0.875rem] italic text-ink-faint">
            Marca las {words.length - seen.size} que quedan para continuar.
          </p>
        )}
      </div>
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
