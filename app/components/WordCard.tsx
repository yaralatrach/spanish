"use client";

import { useState, useTransition } from "react";

import { markWord, markDerived } from "@/app/lib/actions";
import {
  POS_LABEL,
  PERSONS,
  hasParadigm,
  type CurriculumWord,
} from "@/lib/words";

const TENSES: [keyof ReturnType<typeof paradigm>, string][] = [
  ["presente", "presente"],
  ["indefinido", "pretérito"],
  ["imperfecto", "imperfecto"],
  ["futuro", "futuro"],
  ["subjuntivo", "subjuntivo"],
];

function paradigm(word: CurriculumWord) {
  return hasParadigm(word.conjugations) ? word.conjugations : {};
}

export function WordCard({ word }: { word: CurriculumWord }) {
  const [marked, setMarked] = useState<boolean | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [pending, startTransition] = useTransition();

  const conj = paradigm(word);
  const isVerb = word.pos === "VERB" || word.pos === "AUX";

  function mark(known: boolean) {
    setMarked(known);
    startTransition(async () => {
      await markWord(word.id, known);
    });
  }

  return (
    <article className="rounded-xl border border-neutral-200 p-4 sm:p-5">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="flex items-baseline gap-3">
          <h2 className="text-xl font-semibold">{word.lemma}</h2>
          <span className="text-sm text-neutral-500">
            {POS_LABEL[word.pos] ?? word.pos.toLowerCase()}
          </span>
        </div>
        <span className="text-xs text-neutral-400">nº {word.rank}</span>
      </header>

      {word.definition_es && (
        <p className="mt-3 text-[15px] leading-relaxed text-neutral-800">
          {word.definition_es}
        </p>
      )}

      {word.example_es && (
        <p className="mt-2 border-l-2 border-neutral-200 pl-3 text-[15px] italic text-neutral-600">
          {word.example_es}
        </p>
      )}

      {word.participle_of && (
        <p className="mt-1 text-sm text-neutral-500">
          participio de <strong>{word.participle_of}</strong>
        </p>
      )}

      {isVerb && conj.presente && (
        <div className="mt-4">
          {/* A row of six inline forms is unreadable at phone width, so the
              persons lay out as a grid that widens with the screen. */}
          <div className="flex flex-col gap-3">
            {(showAll ? TENSES : TENSES.slice(0, 2)).map(([key, label]) => {
              const forms = conj[key];
              if (!Array.isArray(forms)) return null;
              return (
                <div key={String(key)}>
                  <p className="text-xs uppercase tracking-wide text-neutral-400">
                    {label}
                  </p>
                  <div className="mt-1 grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-3">
                    {forms.map((form, i) =>
                      form ? (
                        <div key={PERSONS[i]} className="text-sm">
                          <span className="text-neutral-400">{PERSONS[i]} </span>
                          {form}
                        </div>
                      ) : null,
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="mt-3 py-1 text-xs text-neutral-500 underline underline-offset-2"
          >
            {showAll ? "menos tiempos" : "más tiempos"}
          </button>
          {(conj.gerundio || conj.participio) && (
            <p className="mt-1 text-sm text-neutral-500">
              {conj.gerundio} · {conj.participio}
            </p>
          )}
        </div>
      )}

      {word.family.length > 0 && (
        <div className="mt-4">
          <p className="mb-1 text-xs text-neutral-400">de la misma familia</p>
          <div className="flex flex-wrap gap-2">
            {word.family.map((member) => (
              <FamilyChip key={member.lemma} lemma={member.lemma} rootId={word.id} />
            ))}
          </div>
        </div>
      )}

      <div className="mt-5 flex gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => mark(true)}
          className={`min-h-11 rounded-lg border px-4 py-2 text-sm ${
            marked === true
              ? "border-green-700 bg-green-700 text-white"
              : "border-neutral-300 hover:border-neutral-500"
          }`}
        >
          Ya la sé
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => mark(false)}
          className={`min-h-11 rounded-lg border px-4 py-2 text-sm ${
            marked === false
              ? "border-neutral-900 bg-neutral-900 text-white"
              : "border-neutral-300 hover:border-neutral-500"
          }`}
        >
          Es nueva
        </button>
      </div>
    </article>
  );
}

/** Family members are shown as context; clicking one records it separately. */
function FamilyChip({ lemma, rootId }: { lemma: string; rootId: number }) {
  const [known, setKnown] = useState<boolean | null>(null);

  return (
    <button
      type="button"
      onClick={() => {
        const next = known === true ? false : true;
        setKnown(next);
        void markDerived(lemma, rootId, next);
      }}
      className={`min-h-9 rounded-full border px-3 py-1.5 text-sm ${
        known === true
          ? "border-green-700 bg-green-50 text-green-800"
          : known === false
            ? "border-neutral-400 text-neutral-500"
            : "border-neutral-200 text-neutral-700 hover:border-neutral-400"
      }`}
    >
      {lemma}
    </button>
  );
}
