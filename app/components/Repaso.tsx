"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { PassShell, Primary } from "@/app/components/PassShell";
import { Completar, Producir, Reconocer } from "@/app/components/Passes";
import { Traducir } from "@/app/components/Traducir";
import { finishRepaso } from "@/app/lib/actions";
import { exerciseFor, type DueWord, type Exercise } from "@/lib/repaso";

// Groups run easiest first, matching the ladder, so a session warms up
// instead of opening on free recall.
const ORDER: Exercise[] = ["reconocer", "completar", "traducir", "producir"];

/**
 * Review, before the day's new words. Words are grouped by the exercise their
 * rung calls for and each group run together, so the session keeps the
 * interleaving that the introduction passes use rather than jumping exercise
 * type on every single word.
 */
export function Repaso({ words }: { words: DueWord[] }) {
  // Finishing re-renders the page, which then moves on to the day's new words.
  // No callback crosses the server boundary.
  const router = useRouter();
  const groups = ORDER.map((exercise) => ({
    exercise,
    words: words.filter((w) => exerciseFor(w) === exercise),
  })).filter((g) => g.words.length > 0);

  const [phase, setPhase] = useState(0);

  function done() {
    void finishRepaso().then(() => router.refresh());
  }

  function advance() {
    if (phase + 1 < groups.length) {
      setPhase(phase + 1);
      if (typeof window !== "undefined") window.scrollTo({ top: 0 });
    } else {
      done();
    }
  }

  if (groups.length === 0) return <Empty />;

  const group = groups[phase];
  const total = groups.length;

  const body =
    group.exercise === "completar" ? (
      <Completar
        words={group.words}
        batch={words}
        position={phase}
        total={total}
        onDone={advance}
      />
    ) : group.exercise === "reconocer" ? (
      <Reconocer
        words={group.words}
        batch={words}
        position={phase}
        total={total}
        onDone={advance}
      />
    ) : group.exercise === "traducir" ? (
      <TraducirGroup
        words={group.words}
        position={phase}
        total={total}
        onDone={advance}
      />
    ) : (
      <Producir
        words={group.words}
        position={phase}
        total={total}
        onDone={advance}
      />
    );

  return (
    <>
      {body}

      {/* Review sits in front of the day's new words, so without a way out it
          becomes a gate that can never be cleared: a backlog of twenty means
          never reaching the new words at all. What is left stays due. */}
      <div className="mt-14 flex flex-wrap items-baseline justify-between gap-3 border-t border-rule pt-6">
        <p className="font-body text-[0.875rem] italic text-ink-faint">
          Te quedan {words.length}{" "}
          {words.length === 1 ? "palabra" : "palabras"} de repaso. Lo que no
          hagas sigue pendiente.
        </p>
        <button
          type="button"
          onClick={done}
          className="py-2 font-body text-[0.9375rem] italic text-ink-soft underline decoration-rule underline-offset-4 transition-colors hover:text-rubric"
        >
          dejar el repaso por hoy
        </button>
      </div>
    </>
  );
}

function TraducirGroup({
  words,
  position,
  total,
  onDone,
}: {
  words: DueWord[];
  position: number;
  total: number;
  onDone: () => void;
}) {
  const [i, setI] = useState(0);

  return (
    <PassShell
      label="repaso · traducir"
      title="¿Cómo se dice?"
      note="Sin nada en español delante. Cualquier forma de la palabra vale."
      position={position}
      total={total}
    >
      <p className="label tabular-nums">
        {i + 1} de {words.length}
      </p>
      <div className="mt-4">
        <Traducir
          key={words[i].id}
          word={words[i]}
          onDone={() => (i + 1 < words.length ? setI(i + 1) : onDone())}
        />
      </div>
    </PassShell>
  );
}

function Empty() {
  const router = useRouter();
  return (
    <div className="rise">
      <p className="label">repaso</p>
      <h1 className="mt-2 font-display text-[2.25rem] leading-[1.05] tracking-tight sm:text-[2.75rem]">
        Nada que repasar
      </h1>
      <p className="mt-3 font-body text-[1.0625rem] leading-relaxed text-ink-soft">
        No hay palabras pendientes. Directa a las de hoy.
      </p>
      <div className="mt-10">
        <Primary onClick={() => void finishRepaso().then(() => router.refresh())}>
          Continuar
        </Primary>
      </div>
    </div>
  );
}
