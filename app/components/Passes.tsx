"use client";

import { useState } from "react";

import { PassShell, Primary, Verdict } from "@/app/components/PassShell";
import { checkWordAnswer, recordAttempt } from "@/app/lib/actions";
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

  function choose(option: string) {
    setPicked(option);
    void recordAttempt(
      word.id,
      "reconocer",
      option === word.lemma ? "clean" : "wrong",
    );
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
      {/* The masked copy: a definition containing its own word answers the
          question. «En España, "vale" se usa constantemente» gave away valer. */}
      <p className="mt-3 font-body text-[1.25rem] leading-relaxed">
        {word.definition_es_masked ?? word.definition_es}
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
              onClick={() => choose(option)}
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
  const [value, setValue] = useState("");
  const [state, setState] = useState<"right" | "wrong" | null>(null);
  const [revealed, setRevealed] = useState(false);
  // Hints escalate from meaning to form: the English gloss keeps her
  // retrieving along the route she will actually use, and only when that
  // fails does she get the shape of the word.
  const [hints, setHints] = useState(0);
  const [checking, setChecking] = useState(false);

  const word = words[i];
  const cloze = word.cloze;
  const options = useStableOptions(word, batch);

  // Two hints, then the answer. The sentence in English first, because not
  // understanding the sentence is what actually blocks her, then a shortlist.
  //
  // There was a third rung showing the first letter and the length, and it
  // was worthless: next to a shortlist of four, "starts with t" is the whole
  // puzzle. A hint that only narrows an existing hint is not a hint.
  const HINTS = 2;

  async function check() {
    if (!value.trim() || checking) return;
    setChecking(true);
    const ok = await checkWordAnswer(word.id, value);
    setState(ok ? "right" : "wrong");
    if (ok) {
      void recordAttempt(
        word.id,
        "completar",
        hints === 0 ? "clean" : "hinted",
        hints,
      );
    } else {
      // A wrong answer escalates the scaffolding rather than handing over the
      // answer. Only once the hints run out does the word itself appear, and
      // by then she has had the sentence in English, a shortlist and the shape
      // of the word. Giving it away on the first miss ends the retrieval.
      void recordAttempt(word.id, "completar", "wrong", hints);
      if (hints < HINTS) setHints((n) => n + 1);
      else setRevealed(true);
    }
    setChecking(false);
  }

  function giveUp() {
    setRevealed(true);
    void recordAttempt(word.id, "completar", "revealed", hints);
  }

  function next() {
    setValue("");
    setState(null);
    setRevealed(false);
    setHints(0);
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

      {hints > 0 && !revealed && (
        <div className="mt-6 flex flex-col gap-4 border-l-2 border-rule pl-4">
          {/* The gapped translation, not the full one: "The population of
              Madrid…" hands over "población" in a single word. Where no gapped
              version is written, the hint is skipped rather than leaked. */}
          {word.example_en_gap && (
            <p className="font-body text-[1.0625rem] leading-relaxed text-ink-soft">
              {word.example_en_gap}
            </p>
          )}
          {hints >= 2 && (
            <div>
              <p className="label">una de estas</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {options.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setValue(option)}
                    className="min-h-10 rounded-sm border border-rule px-3.5 font-display text-[1.0625rem] text-ink transition-colors hover:border-ink-faint"
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!revealed && <Verdict state={state} />}

      {revealed && <Reveal word={word} />}

      <div className="mt-8 flex flex-wrap items-center gap-5">
        {state === "right" || revealed ? (
          <Primary onClick={next}>
            {i + 1 < words.length ? "Siguiente" : "Continuar"}
          </Primary>
        ) : (
          <>
            <Primary onClick={check} disabled={!value.trim() || checking}>
              {checking ? "Comprobando…" : "Comprobar"}
            </Primary>
            {hints < HINTS && (
              <button
                type="button"
                onClick={() => setHints((n) => n + 1)}
                className="py-2 font-body text-[0.9375rem] italic text-ink-soft underline decoration-rule underline-offset-4 transition-colors hover:text-rubric"
              >
                {hints === 0 ? "Pista" : "Otra pista"}
              </button>
            )}
            {/* Guessing wrong on purpose to escape teaches nothing. Saying so
                outright costs the attempt but buys the explanation. */}
            <button
              type="button"
              onClick={giveUp}
              className="py-2 font-body text-[0.9375rem] italic text-ink-soft underline decoration-rule underline-offset-4 transition-colors hover:text-rubric"
            >
              No lo sé
            </button>
          </>
        )}
      </div>
    </PassShell>
  );
}

/** Everything known about the word, shown when she says she does not know it. */
function Reveal({ word }: { word: PracticeWord }) {
  return (
    <div className="rise mt-8 border-t border-rule pt-6">
      <p className="font-display text-[2rem] leading-tight">{word.lemma}</p>
      {word.definition_en && (
        <p className="mt-1 font-body text-[1.0625rem] italic text-ink-soft">
          {word.definition_en}
        </p>
      )}

      {word.definition_es && (
        <p className="mt-4 font-body text-[1.0625rem] leading-relaxed">
          {word.definition_es}
        </p>
      )}

      {word.example_es && (
        <div className="mt-5 border-l-2 border-rubric pl-4">
          <p className="font-body text-[1.0625rem] italic leading-relaxed">
            {word.example_es}
          </p>
          {word.example_en && (
            <p className="mt-1.5 font-body text-[0.9375rem] leading-relaxed text-ink-soft">
              {word.example_en}
            </p>
          )}
        </div>
      )}

      {word.etymology_es && (
        <p className="mt-5 font-body text-[0.875rem] leading-relaxed text-ink-faint">
          {word.etymology_es}
        </p>
      )}
    </div>
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
  const [revealed, setRevealed] = useState(false);
  const [checking, setChecking] = useState(false);

  const word = words[i];

  async function check() {
    if (!value.trim() || checking) return;
    setChecking(true);
    const ok = await checkWordAnswer(word.id, value);
    setState(ok ? "right" : "wrong");
    void recordAttempt(word.id, "producir", ok ? "clean" : "wrong");
    setChecking(false);
  }

  function next() {
    setValue("");
    setState(null);
    setRevealed(false);
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

      {word.examples?.length > 0 && (
        <div className="mt-6">
          <p className="label">así se usa</p>
          <div className="mt-3 flex flex-col gap-4">
            {word.examples.map((example) => (
              <ExampleLine key={example.es} example={example} />
            ))}
          </div>
        </div>
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

      {revealed && <Reveal word={word} />}

      <div className="mt-8 flex flex-wrap items-center gap-5">
        {state === "right" || revealed ? (
          <Primary onClick={next}>
            {i + 1 < words.length ? "Siguiente" : "Continuar"}
          </Primary>
        ) : (
          <>
            <Primary onClick={check} disabled={!value.trim() || checking}>
              {checking ? "Comprobando…" : "Comprobar"}
            </Primary>
            <button
              type="button"
              onClick={() => {
                setRevealed(true);
                void recordAttempt(word.id, "producir", "revealed");
              }}
              className="py-2 font-body text-[0.9375rem] italic text-ink-soft underline decoration-rule underline-offset-4 transition-colors hover:text-rubric"
            >
              No lo sé
            </button>
          </>
        )}
      </div>
    </PassShell>
  );
}

/**
 * One example, Spanish first, with its translation behind a tap. Reading the
 * Spanish and only then checking is the point; showing both at once turns it
 * into a bilingual list she skims in English.
 */
function ExampleLine({ example }: { example: { es: string; en: string } }) {
  const [shown, setShown] = useState(false);

  return (
    <div className="border-l-2 border-rule pl-4">
      <p className="font-body text-[1.0625rem] italic leading-relaxed">
        {example.es}
      </p>
      {shown ? (
        <p className="mt-1 font-body text-[0.9375rem] leading-relaxed text-ink-soft">
          {example.en}
        </p>
      ) : (
        <button
          type="button"
          onClick={() => setShown(true)}
          className="mt-1 py-1 font-body text-[0.875rem] italic text-ink-faint underline decoration-rule underline-offset-4 transition-colors hover:text-rubric"
        >
          en inglés
        </button>
      )}
    </div>
  );
}

/** Options are shuffled once per word, not on every keystroke. */
function useStableOptions(word: PracticeWord, batch: PracticeWord[]): string[] {
  const [cache] = useState(() => new Map<number, string[]>());
  if (!cache.has(word.id)) cache.set(word.id, optionsFor(word, batch));
  return cache.get(word.id)!;
}
