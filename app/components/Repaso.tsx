"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { PassShell, Primary } from "@/app/components/PassShell";
import { Completar, Producir, Reconocer } from "@/app/components/Passes";
import { Traducir } from "@/app/components/Traducir";
import { finishRepaso } from "@/app/lib/actions";
import { exerciseFor, type DueWord, type Exercise } from "@/lib/repaso";

const ORDER: Exercise[] = ["completar", "reconocer", "traducir", "producir"];

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

  function advance() {
    if (phase + 1 < groups.length) {
      setPhase(phase + 1);
      if (typeof window !== "undefined") window.scrollTo({ top: 0 });
    } else {
      void finishRepaso().then(() => router.refresh());
    }
  }

  if (groups.length === 0) return <Empty />;

  const group = groups[phase];
  const total = groups.length;

  if (group.exercise === "completar") {
    return (
      <Completar
        words={group.words}
        batch={words}
        position={phase}
        total={total}
        onDone={advance}
      />
    );
  }

  if (group.exercise === "reconocer") {
    return (
      <Reconocer
        words={group.words}
        batch={words}
        position={phase}
        total={total}
        onDone={advance}
      />
    );
  }

  if (group.exercise === "traducir") {
    return (
      <TraducirGroup words={group.words} position={phase} total={total} onDone={advance} />
    );
  }

  return (
    <Producir
      words={group.words}
      position={phase}
      total={total}
      onDone={advance}
    />
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
