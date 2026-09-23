"use client";

import { useState, useTransition } from "react";

import { submitPlacement } from "@/app/lib/actions";
import { PLACEMENT_QUESTIONS } from "@/lib/placementQuestions";

export function PlacementTest() {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const answered = Object.keys(answers).length;
  const complete = answered === PLACEMENT_QUESTIONS.length;

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await submitPlacement(answers);
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <form onSubmit={onSubmit}>
      <header className="rise">
        <p className="label">una sola vez</p>
        <h1 className="mt-2 font-display text-[2.5rem] leading-[1.05] tracking-tight sm:text-[3.25rem]">
          Prueba de nivel
        </h1>
        <p className="mt-3 font-body text-[1.0625rem] leading-relaxed text-ink-soft">
          Doce preguntas. Si no lo sabes, elige lo que te suene mejor.
        </p>
      </header>

      <div className="mt-12 flex flex-col gap-10">
        {PLACEMENT_QUESTIONS.map((question, index) => (
          <fieldset
            key={question.id}
            className="rise"
            style={{ animationDelay: `${Math.min(index, 8) * 50}ms` }}
          >
            <legend className="font-body text-[1.125rem] leading-relaxed">
              <span className="label mr-3 tabular-nums">{index + 1}</span>
              {question.prompt}
            </legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {question.options.map((option) => {
                const selected = answers[question.id] === option;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() =>
                      setAnswers((prev) => ({ ...prev, [question.id]: option }))
                    }
                    className={`min-h-11 rounded-sm border px-4 font-body text-[1rem] transition-colors ${
                      selected
                        ? "border-ink bg-ink text-paper"
                        : "border-rule text-ink-soft hover:border-ink-faint"
                    }`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </fieldset>
        ))}
      </div>

      <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-rule pt-6">
        <span className="label tabular-nums">
          {answered} de {PLACEMENT_QUESTIONS.length}
        </span>
        <button
          type="submit"
          disabled={pending || !complete}
          className="min-h-12 w-full rounded-sm bg-ink px-6 font-body text-[1.0625rem] text-paper transition-opacity hover:opacity-90 disabled:opacity-30 sm:w-auto"
        >
          {pending ? "Calculando…" : "Terminar"}
        </button>
      </div>

      {error && (
        <p className="mt-3 font-body text-[0.9375rem] italic text-rubric">
          {error}
        </p>
      )}
    </form>
  );
}
