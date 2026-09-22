"use client";

import { useState, useTransition } from "react";

import { sweepBatch, submitSweep, finishSweep } from "@/app/lib/actions";
import { POS_LABEL, type CurriculumWord } from "@/lib/words";

export function SweepMode({
  initialWords,
  total,
}: {
  initialWords: CurriculumWord[];
  total: number;
}) {
  const [words, setWords] = useState(initialWords);
  // Default is known. At the top of a frequency list almost everything is
  // familiar, so flagging the exceptions is far fewer taps than the reverse.
  const [unknown, setUnknown] = useState<Set<number>>(new Set());
  const [cleared, setCleared] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const lastRank = words.length > 0 ? words[words.length - 1].rank : 0;

  function toggle(id: number) {
    setUnknown((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function advance() {
    setError(null);
    startTransition(async () => {
      const ids = words.map((w) => w.id);
      const result = await submitSweep([...unknown], ids, lastRank);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setCleared((n) => n + ids.length - unknown.size);
      setUnknown(new Set());
      setWords(await sweepBatch(lastRank));
    });
  }

  function stop() {
    startTransition(async () => {
      if (words.length > 0) {
        await submitSweep([...unknown], words.map((w) => w.id), lastRank);
      }
      await finishSweep();
    });
  }

  if (words.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold">Barrido terminado</h1>
        <p className="text-neutral-600">
          Has revisado toda la lista. {cleared} palabras marcadas como conocidas.
        </p>
        <button
          type="button"
          onClick={stop}
          disabled={pending}
          className="self-start rounded-lg bg-neutral-900 px-5 py-2 font-medium text-white disabled:opacity-40"
        >
          Empezar el estudio diario
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-2xl font-semibold">Barrido inicial</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Toca solo las que <strong>no</strong> sepas. El resto se dan por
          conocidas.
        </p>
        <p className="mt-2 text-xs text-neutral-400">
          nº {words[0].rank}–{lastRank} de {total} · {cleared} conocidas ·{" "}
          {unknown.size} marcadas en esta tanda
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {words.map((word) => {
          const flagged = unknown.has(word.id);
          return (
            <button
              key={word.id}
              type="button"
              onClick={() => toggle(word.id)}
              title={POS_LABEL[word.pos] ?? word.pos}
              className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                flagged
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-200 text-neutral-700 hover:border-neutral-400"
              }`}
            >
              {word.lemma}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={advance}
          disabled={pending}
          className="rounded-lg bg-neutral-900 px-5 py-2 font-medium text-white disabled:opacity-40"
        >
          {pending ? "Guardando…" : "Siguientes 100"}
        </button>
        <button
          type="button"
          onClick={stop}
          disabled={pending}
          className="text-sm text-neutral-500 underline underline-offset-2"
        >
          Ya empiezan a costarme — terminar aquí
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
