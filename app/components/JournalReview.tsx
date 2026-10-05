"use client";

import { useEffect, useState, useTransition } from "react";

import { Primary } from "@/app/components/PassShell";
import { dismissReview, reviewJournal } from "@/app/lib/review";
import type { JournalReview as Review } from "@/lib/review";

export function JournalReview({ onDone }: { onDone: () => void }) {
  const [review, setReview] = useState<Review | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "unavailable">(
    "loading",
  );
  const [, startTransition] = useTransition();

  useEffect(() => {
    let live = true;
    reviewJournal()
      .then((result) => {
        if (!live) return;
        if (!result) {
          // No key, or the call failed. The correction is an addition to the
          // day, never a condition of it, so move straight on.
          setState("unavailable");
          onDone();
          return;
        }
        setReview(result);
        setState("ready");
      })
      .catch(() => {
        if (!live) return;
        setState("unavailable");
        onDone();
      });
    return () => {
      live = false;
    };
    // Runs once per mount: the entry is already written and will not change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (state === "loading") {
    return (
      <div className="rise">
        <p className="label">corrigiendo</p>
        <h1 className="mt-2 font-display text-[2.25rem] leading-[1.05] tracking-tight sm:text-[2.75rem]">
          Leyendo lo que has escrito…
        </h1>
        <div className="mt-10 flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-1 w-10 animate-pulse rounded-full bg-rule"
              style={{ animationDelay: `${i * 160}ms` }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (state === "unavailable" || !review) return null;

  const clean = review.corrections.length === 0;

  return (
    <div className="rise">
      <p className="label">tu diario, corregido</p>
      <h1 className="mt-2 font-display text-[2.25rem] leading-[1.05] tracking-tight sm:text-[2.75rem]">
        {clean ? "Sin errores" : `${review.corrections.length} correcciones`}
      </h1>

      <p className="mt-4 border-l-2 border-verde pl-4 font-body text-[1.0625rem] leading-relaxed text-ink-soft">
        {review.praise}
      </p>

      {!clean && (
        <div className="mt-10 flex flex-col gap-6">
          {review.corrections.map((c, i) => (
            <div
              key={`${c.original}-${i}`}
              className="rise border-t border-rule pt-5 first:border-t-0 first:pt-0"
              style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}
            >
              <p className="label">{c.kind}</p>
              <p className="mt-2 font-body text-[1.125rem]">
                <span className="text-ink-faint line-through decoration-rubric/50">
                  {c.original}
                </span>
                <span className="mx-2 text-ink-faint">→</span>
                <span className="text-ink">{c.corrected}</span>
              </p>
              <p className="mt-1.5 font-body text-[0.9375rem] leading-relaxed text-ink-soft">
                {c.note}
              </p>
            </div>
          ))}
        </div>
      )}

      <details className="mt-10 border-t border-rule pt-5">
        <summary className="label cursor-pointer">
          ver el texto completo corregido
        </summary>
        <p className="mt-4 whitespace-pre-wrap font-body text-[1.0625rem] leading-relaxed">
          {review.corrected}
        </p>
      </details>

      <div className="mt-10">
        <Primary
          onClick={() => {
            startTransition(async () => {
              await dismissReview();
              onDone();
            });
          }}
        >
          Continuar
        </Primary>
      </div>
    </div>
  );
}
