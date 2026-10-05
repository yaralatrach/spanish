"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Primary } from "@/app/components/PassShell";
import { dismissReview, reviewJournal } from "@/app/lib/review";
import type { JournalReview as Review } from "@/lib/review";

export function JournalReview() {
  const router = useRouter();
  const [review, setReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true;

    reviewJournal()
      .then(async (result) => {
        if (!live) return;
        if (result) {
          setReview(result);
          setLoading(false);
          return;
        }
        // No key, or the call failed. Mark the step done anyway: an earlier
        // version left it unmarked, and because the rest of the day was gated
        // behind it, review never ran at all.
        await dismissReview();
        router.refresh();
      })
      .catch(async () => {
        if (!live) return;
        await dismissReview();
        router.refresh();
      });

    return () => {
      live = false;
    };
    // Runs once: the entry is already written and will not change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading || !review) {
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

  const clean = review.corrections.length === 0;
  const gaps = review.gaps ?? [];

  return (
    <div className="rise">
      <p className="label">tu diario, corregido</p>
      <h1 className="mt-2 font-display text-[2.25rem] leading-[1.05] tracking-tight sm:text-[2.75rem]">
        {clean ? "Sin errores" : `${review.corrections.length} correcciones`}
      </h1>

      <p className="mt-4 border-l-2 border-verde pl-4 font-body text-[1.0625rem] leading-relaxed text-ink-soft">
        {review.praise}
      </p>

      {gaps.length > 0 && (
        <section className="mt-10 rounded-sm bg-rubric-wash px-5 py-5">
          <p className="label">lo que te faltaba</p>
          <p className="mt-1 font-body text-[0.9375rem] italic leading-relaxed text-ink-soft">
            Palabras que has escrito en inglés. Las que están en la lista pasan
            al principio de la cola.
          </p>
          <dl className="mt-4 flex flex-col gap-4">
            {gaps.map((gap) => (
              <div key={`${gap.english}-${gap.spanish}`}>
                <dt className="font-display text-[1.25rem]">
                  {gap.spanish}
                  <span className="ml-3 font-body text-[0.9375rem] italic text-ink-faint">
                    {gap.english}
                  </span>
                </dt>
                <dd className="mt-0.5 font-body text-[0.9375rem] leading-relaxed text-ink-soft">
                  {gap.note}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      )}

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
            void dismissReview().then(() => router.refresh());
          }}
        >
          Continuar
        </Primary>
      </div>
    </div>
  );
}
