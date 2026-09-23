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
      <div className="rise flex min-h-[60dvh] flex-col justify-center">
        <h1 className="font-display text-[2.5rem] leading-[1.05] tracking-tight sm:text-[3.25rem]">
          Barrido terminado
        </h1>
        <p className="mt-4 font-body text-[1.0625rem] leading-relaxed text-ink-soft">
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
    <div className="flex flex-col gap-8">
      <header className="rise">
        <p className="label">solo la primera vez</p>
        <h1 className="mt-2 font-display text-[2.5rem] leading-[1.05] tracking-tight sm:text-[3.25rem]">
          Barrido inicial
        </h1>
        <p className="mt-3 font-body text-[1.0625rem] leading-relaxed text-ink-soft">
          Toca solo las que <em>no</em> sepas. El resto se dan por conocidas.
          Así el estudio diario no empieza por palabras que ya dominas.
        </p>
        <p className="label mt-5 tabular-nums">
          nº {words[0].rank}–{lastRank} de {total} · {cleared} conocidas ·{" "}
          {unknown.size} en esta tanda
        </p>
      </header>

      <div className="flex flex-wrap gap-2 border-t border-rule pt-8">
        {words.map((word) => {
          const flagged = unknown.has(word.id);
          return (
            <button
              key={word.id}
              type="button"
              onClick={() => toggle(word.id)}
              title={POS_LABEL[word.pos] ?? word.pos}
              className={`min-h-11 rounded-sm border px-3.5 font-body text-[1rem] transition-colors ${
                flagged
                  ? "border-rubric bg-rubric text-paper"
                  : "border-rule text-ink-soft hover:border-ink-faint"
              }`}
            >
              {word.lemma}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-5 border-t border-rule pt-6">
        <button
          type="button"
          onClick={advance}
          disabled={pending}
          className="min-h-12 w-full rounded-sm bg-ink px-6 font-body text-[1.0625rem] text-paper transition-opacity hover:opacity-90 disabled:opacity-40 sm:w-auto"
        >
          {pending ? "Guardando…" : "Siguientes 100"}
        </button>
        <button
          type="button"
          onClick={stop}
          disabled={pending}
          className="py-2 font-body text-[0.9375rem] italic text-ink-soft underline decoration-rule underline-offset-4 transition-colors hover:text-rubric"
        >
          Ya empiezan a costarme — terminar aquí
        </button>
      </div>

      {error && (
        <p className="font-body text-[0.9375rem] italic text-rubric">{error}</p>
      )}
    </div>
  );
}
