"use client";

import { useState } from "react";

import { PassShell, Primary, Verdict } from "@/app/components/PassShell";
import { checkWordAnswer } from "@/app/lib/actions";
import { optionsFor, type PracticeWord } from "@/lib/practice";

/** Definition shown, the word chosen from today's own batch. */
export function Reconocer({
  words,
  batch,
  onDone,
  position,
  total,
}: {
  words: PracticeWord[];
  batch: PracticeWord[];
  onDone: () => void;
  position: number;
  total: number;
}) {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);

  const word = words[i];
  const options = useStableOptions(word, batch);
  const right = picked === word.lemma;

  function next() {
    setPicked(null);
    if (i + 1 < words.length) setI(i + 1);
    else onDone();
  }

  return (
    <PassShell
      label="reconocer"
      title="¿Qué palabra es?"
      note="Lee la definición y elige la palabra que le corresponde."
      position={position}
      total={total}
    >
      <p className="label tabular-nums">
        {i + 1} de {words.length}
      </p>
      <p className="mt-3 font-body text-[1.25rem] leading-relaxed">
        {word.definition_es}
      </p>

      <div className="mt-8 flex flex-wrap gap-2.5">
        {options.map((option) => {
          const chosen = picked === option;
          const reveal = picked !== null && option === word.lemma;
          return (
            <button
              key={option}
              type="button"
              disabled={picked !== null}
              onClick={() => setPicked(option)}
              className={`min-h-12 rounded-sm border px-5 font-display text-[1.125rem] transition-colors ${
                reveal
                  ? "border-verde bg-verde text-paper"
                  : chosen
                    ? "border-rubric bg-rubric text-paper"
                    : "border-rule text-ink hover:border-ink-faint"
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>

      {picked !== null && (
        <div className="mt-8">
          {!right && (
            <p className="font-body text-[0.9375rem] italic text-ink-soft">
              Era <strong className="not-italic">{word.lemma}</strong>.
            </p>
          )}
          <div className="mt-4">
            <Primary onClick={next}>
              {i + 1 < words.length ? "Siguiente" : "Continuar"}
            </Primary>
          </div>
        </div>
      )}
    </PassShell>
  );
}

/** The example sentence with the word removed, typed back from memory. */
export function Completar({
  words,
  onDone,
  position,
  total,
}: {
  words: PracticeWord[];
  onDone: () => void;
  position: number;
  total: number;
}) {
  const [i, setI] = useState(0);
  const [value, setValue] = useState("");
  const [state, setState] = useState<"right" | "wrong" | null>(null);
  const [hint, setHint] = useState(false);
  const [checking, setChecking] = useState(false);

  const word = words[i];
  const cloze = word.cloze;

  async function check() {
    if (!value.trim() || checking) return;
    setChecking(true);
    const ok = await checkWordAnswer(word.id, value);
    setState(ok ? "right" : "wrong");
    // Failure reveals the word rather than moving on: the scaffold appears
    // only for the words that actually needed it.
    if (!ok) setHint(true);
    setChecking(false);
  }

  function next() {
    setValue("");
    setState(null);
    setHint(false);
    if (i + 1 < words.length) setI(i + 1);
    else onDone();
  }

  return (
    <PassShell
      label="completar"
      title="Completa la frase"
      note="Escribe la palabra que falta. Los acentos no cuentan."
      position={position}
      total={total}
    >
      <p className="label tabular-nums">
        {i + 1} de {words.length}
      </p>

      {hint && (
        <p className="mt-3 font-display text-[1.5rem] text-rubric">
          {word.lemma}
        </p>
      )}

      <p className="mt-4 border-l-2 border-rubric pl-4 font-body text-[1.25rem] italic leading-relaxed">
        {cloze?.before}
        <span className="not-italic text-ink-faint">_____</span>
        {cloze?.after}
      </p>

      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            if (state === "right") next();
            else void check();
          }
        }}
        autoFocus
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        placeholder="escribe aquí"
        className="mt-8 w-full border-0 border-b border-rule bg-transparent pb-2 font-display text-[1.5rem] outline-none transition-colors placeholder:font-body placeholder:text-[1.125rem] placeholder:italic placeholder:text-ink-faint focus:border-rubric"
      />

      <Verdict state={state} />

      <div className="mt-8">
        {state === "right" ? (
          <Primary onClick={next}>
            {i + 1 < words.length ? "Siguiente" : "Continuar"}
          </Primary>
        ) : (
          <Primary onClick={check} disabled={!value.trim() || checking}>
            {checking ? "Comprobando…" : "Comprobar"}
          </Primary>
        )}
      </div>
    </PassShell>
  );
}

/** Her own sentence, graded the same way her journal is. */
export function Producir({
  words,
  onDone,
  position,
  total,
}: {
  words: PracticeWord[];
  onDone: () => void;
  position: number;
  total: number;
}) {
  const [i, setI] = useState(0);
  const [value, setValue] = useState("");
  const [state, setState] = useState<"right" | "wrong" | null>(null);
  const [checking, setChecking] = useState(false);

  const word = words[i];

  async function check() {
    if (!value.trim() || checking) return;
    setChecking(true);
    setState((await checkWordAnswer(word.id, value)) ? "right" : "wrong");
    setChecking(false);
  }

  function next() {
    setValue("");
    setState(null);
    if (i + 1 < words.length) setI(i + 1);
    else onDone();
  }

  return (
    <PassShell
      label="producir"
      title="Escribe tu propia frase"
      note="Cualquier forma de la palabra vale. Se comprueba igual que el diario."
      position={position}
      total={total}
    >
      <p className="label tabular-nums">
        {i + 1} de {words.length}
      </p>

      <p className="mt-3 font-display text-[2rem] leading-tight">{word.lemma}</p>
      {word.definition_es && (
        <p className="mt-2 font-body text-[0.9375rem] leading-relaxed text-ink-soft">
          {word.definition_es}
        </p>
      )}

      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={3}
        autoFocus
        placeholder="Tu frase…"
        className="mt-8 w-full resize-y border-0 border-l-2 border-rule bg-transparent pl-4 font-body text-[1.125rem] leading-relaxed outline-none transition-colors placeholder:italic placeholder:text-ink-faint focus:border-rubric"
      />

      {state === "wrong" && (
        <p className="mt-3 font-body text-[0.9375rem] italic text-rubric">
          No encuentro <strong className="not-italic">{word.lemma}</strong> en tu
          frase. Úsala en cualquier forma.
        </p>
      )}
      {state === "right" && (
        <p className="mt-3 font-body text-[0.9375rem] italic text-verde">
          Hecho.
        </p>
      )}

      <div className="mt-8">
        {state === "right" ? (
          <Primary onClick={next}>
            {i + 1 < words.length ? "Siguiente" : "Continuar"}
          </Primary>
        ) : (
          <Primary onClick={check} disabled={!value.trim() || checking}>
            {checking ? "Comprobando…" : "Comprobar"}
          </Primary>
        )}
      </div>
    </PassShell>
  );
}

/** Options are shuffled once per word, not on every keystroke. */
function useStableOptions(word: PracticeWord, batch: PracticeWord[]): string[] {
  const [cache] = useState(() => new Map<number, string[]>());
  if (!cache.has(word.id)) cache.set(word.id, optionsFor(word, batch));
  return cache.get(word.id)!;
}
