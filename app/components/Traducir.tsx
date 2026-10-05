"use client";

import { useState } from "react";

import { PassShell, Primary } from "@/app/components/PassShell";
import { checkWordAnswer, recordAttempt } from "@/app/lib/actions";
import type { DueWord } from "@/lib/repaso";

/**
 * English to Spanish, with nothing Spanish on screen to lean on. The hardest
 * of the recall exercises short of producing a sentence, which is why it sits
 * where it does on the ladder.
 */
export function Traducir({
  word,
  onDone,
}: {
  word: DueWord;
  onDone: () => void;
}) {
  const [value, setValue] = useState("");
  const [state, setState] = useState<"right" | "wrong" | null>(null);
  const [checking, setChecking] = useState(false);

  async function check() {
    if (!value.trim() || checking) return;
    setChecking(true);
    const ok = await checkWordAnswer(word.id, value);
    setState(ok ? "right" : "wrong");
    void recordAttempt(word.id, "producir", ok ? "clean" : "wrong");
    setChecking(false);
  }

  return (
    <>
      <p className="font-body text-[1.375rem] leading-relaxed">
        {word.definition_en}
      </p>
      {word.example_en && (
        <p className="mt-3 font-body text-[1rem] italic leading-relaxed text-ink-soft">
          {word.example_en}
        </p>
      )}

      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key !== "Enter") return;
          e.preventDefault();
          if (state === "right") onDone();
          else void check();
        }}
        autoFocus
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        placeholder="en español"
        className="mt-8 w-full border-0 border-b border-rule bg-transparent pb-2 font-display text-[1.5rem] outline-none transition-colors placeholder:font-body placeholder:text-[1.125rem] placeholder:italic placeholder:text-ink-faint focus:border-rubric"
      />

      {state === "wrong" && (
        <p className="mt-3 font-body text-[0.9375rem] italic text-rubric">
          Era <strong className="not-italic">{word.lemma}</strong>.
        </p>
      )}
      {state === "right" && (
        <p className="mt-3 font-body text-[0.9375rem] italic text-verde">
          Eso es.
        </p>
      )}

      <div className="mt-8 flex flex-wrap items-center gap-5">
        {state === null ? (
          <>
            <Primary onClick={check} disabled={!value.trim() || checking}>
              {checking ? "Comprobando…" : "Comprobar"}
            </Primary>
            <button
              type="button"
              onClick={() => {
                setState("wrong");
                void recordAttempt(word.id, "producir", "revealed");
              }}
              className="py-2 font-body text-[0.9375rem] italic text-ink-soft underline decoration-rule underline-offset-4 transition-colors hover:text-rubric"
            >
              No lo sé
            </button>
          </>
        ) : (
          <Primary onClick={onDone}>Siguiente</Primary>
        )}
      </div>
    </>
  );
}

export { PassShell };
