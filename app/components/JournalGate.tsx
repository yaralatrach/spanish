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
    <form onSubmit={onSubmit} className="rise">
      <p className="label">antes de empezar</p>
      <h1 className="mt-2 font-display text-[2.5rem] leading-[1.05] tracking-tight sm:text-[3.25rem]">
        Tu diario de hoy
      </h1>
      <p className="mt-3 font-body text-[1.0625rem] leading-relaxed text-ink-soft">
        Escribe antes que nada. Cada palabra de la lista que uses aquí cuenta
        como aprendida: haberla usado tú vale más que haberla reconocido.
      </p>

      <textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        rows={12}
        autoFocus
        placeholder="¿Qué has hecho hoy?"
        className="mt-8 w-full resize-y border-0 border-l-2 border-rule bg-transparent pl-5 font-body text-[1.0625rem] leading-relaxed outline-none transition-colors placeholder:text-ink-faint placeholder:italic focus:border-rubric"
      />

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-rule pt-5">
        <span
          className={`label tabular-nums ${remaining === 0 ? "text-verde" : ""}`}
        >
          {remaining > 0 ? `faltan ${remaining}` : `${length} caracteres`}
        </span>
        <button
          type="submit"
          disabled={pending || remaining > 0}
          className="min-h-12 w-full rounded-sm bg-ink px-6 font-body text-[1.0625rem] text-paper transition-opacity hover:opacity-90 disabled:opacity-30 sm:w-auto"
        >
          {pending ? "Guardando…" : "Guardar y continuar"}
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
