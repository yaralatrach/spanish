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
    <form onSubmit={onSubmit} className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Prueba de nivel</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Doce preguntas, una sola vez. Si no lo sabes, elige lo que te suene
          mejor.
        </p>
      </div>

      {PLACEMENT_QUESTIONS.map((question, index) => (
        <fieldset key={question.id} className="flex flex-col gap-2">
          <legend className="mb-1 text-base">
            <span className="mr-2 text-neutral-400">{index + 1}.</span>
            {question.prompt}
          </legend>
          <div className="flex flex-wrap gap-2">
            {question.options.map((option) => {
              const selected = answers[question.id] === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() =>
                    setAnswers((prev) => ({ ...prev, [question.id]: option }))
                  }
                  className={`min-h-11 rounded-lg border px-4 py-2 text-sm ${
                    selected
                      ? "border-neutral-900 bg-neutral-900 text-white"
                      : "border-neutral-300 hover:border-neutral-500"
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </fieldset>
      ))}

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <span className="text-neutral-500">
          {answered} de {PLACEMENT_QUESTIONS.length}
        </span>
        <button
          type="submit"
          disabled={pending || !complete}
          className="min-h-11 w-full rounded-lg bg-neutral-900 px-5 py-2.5 font-medium text-white disabled:opacity-40 sm:w-auto"
        >
          {pending ? "Calculando…" : "Terminar"}
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
