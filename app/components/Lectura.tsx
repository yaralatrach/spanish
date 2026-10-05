"use client";

import { useEffect, useState } from "react";

import { PassShell, Primary } from "@/app/components/PassShell";
import { markTokenUnknown, recordAttempt } from "@/app/lib/actions";
import { dailyPassage } from "@/app/lib/review";

/**
 * The day's words in connected prose. Every word is clickable: tapping one
 * marks it unknown and schedules it, which is the reading half of the
 * evidence rule — writing a word counts for, clicking one counts against.
 */
export function Lectura({
  lemmas,
  onDone,
  position,
  total,
}: {
  lemmas: string[];
  onDone: () => void;
  position: number;
  total: number;
}) {
  const [passage, setPassage] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [marked, setMarked] = useState<Set<string>>(new Set());
  const [misses, setMisses] = useState<Set<string>>(new Set());

  // Generated when this pass is reached, not on the day's first load: the
  // passage is only needed here, and it is cached after the first time.
  useEffect(() => {
    let live = true;
    dailyPassage(lemmas)
      .then((text) => {
        if (!live) return;
        if (text) setPassage(text);
        else {
          setFailed(true);
          onDone();
        }
      })
      .catch(() => {
        if (!live) return;
        setFailed(true);
        onDone();
      });
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (failed) return null;

  if (!passage) {
    return (
      <PassShell
        label="lectura"
        title="Escribiendo el texto…"
        position={position}
        total={total}
      >
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-1 w-10 animate-pulse rounded-full bg-rule"
              style={{ animationDelay: `${i * 160}ms` }}
            />
          ))}
        </div>
      </PassShell>
    );
  }

  // Split so punctuation and spacing survive: only the word runs are tappable.
  const pieces = passage.split(/([\p{L}\p{M}]+)/u);

  function tap(token: string) {
    const key = token.toLowerCase();
    if (marked.has(key) || misses.has(key)) return;
    setMarked((prev) => new Set(prev).add(key));
    void markTokenUnknown(token).then((result) => {
      const lemma = result?.lemma ?? null;
      if (result) void recordAttempt(result.wordId, "lectura", "revealed");
      if (!lemma) {
        // Not a curriculum word, so there is nothing to schedule. Say so
        // rather than leaving a mark that did nothing.
        setMarked((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
        setMisses((prev) => new Set(prev).add(key));
      }
    });
  }

  return (
    <PassShell
      label="lectura"
      title="Léelo entero"
      note="Toca cualquier palabra que no conozcas. Las que toques entran en el repaso."
      position={position}
      total={total}
    >
      <p className="font-body text-[1.1875rem] leading-[1.9]">
        {pieces.map((piece, i) => {
          if (!/^[\p{L}\p{M}]+$/u.test(piece)) return <span key={i}>{piece}</span>;
          const key = piece.toLowerCase();
          const isMarked = marked.has(key);
          const isMiss = misses.has(key);
          return (
            <button
              key={i}
              type="button"
              onClick={() => tap(piece)}
              className={`rounded-sm transition-colors ${
                isMarked
                  ? "bg-rubric-wash text-rubric underline decoration-rubric decoration-2 underline-offset-4"
                  : isMiss
                    ? "text-ink-faint"
                    : "hover:bg-paper-sunk"
              }`}
            >
              {piece}
            </button>
          );
        })}
      </p>

      <p className="mt-6 font-body text-[0.875rem] italic text-ink-faint">
        {marked.size === 0
          ? "Si las conoces todas, continúa sin tocar nada."
          : `${marked.size} ${marked.size === 1 ? "palabra marcada" : "palabras marcadas"}.`}
        {misses.size > 0 &&
          " Alguna de las que has tocado no está en la lista, así que no se programa."}
      </p>

      <div className="mt-10">
        <Primary onClick={onDone}>Continuar</Primary>
      </div>
    </PassShell>
  );
}
