"use client";

import { useState, useTransition } from "react";

import { submitJournal } from "@/app/lib/actions";
import { MIN_JOURNAL_CHARS } from "@/lib/journal";

export function JournalGate() {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const length = text.trim().length;
  const remaining = Math.max(0, MIN_JOURNAL_CHARS - length);

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await submitJournal(text);
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Tu diario de hoy</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Escribe antes de empezar. Lo que escribas cuenta como prueba de las
          palabras que ya dominas.
        </p>
      </div>

      <textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        rows={10}
        autoFocus
        placeholder="¿Qué has hecho hoy?"
        className="w-full resize-y rounded-lg border border-neutral-300 p-3 text-base leading-relaxed outline-none focus:border-neutral-900"
      />

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <span className={remaining > 0 ? "text-neutral-500" : "text-green-700"}>
          {remaining > 0
            ? `Faltan ${remaining} caracteres`
            : `${length} caracteres`}
        </span>
        <button
          type="submit"
          disabled={pending || remaining > 0}
          className="min-h-11 w-full rounded-lg bg-neutral-900 px-5 py-2.5 font-medium text-white disabled:opacity-40 sm:w-auto"
        >
          {pending ? "Guardando…" : "Guardar y continuar"}
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
