"use client";

import { useState, useTransition } from "react";

import { markWord, markDerived } from "@/app/lib/actions";
import {
  POS_LABEL,
  PERSONS,
  hasParadigm,
  type Conjugations,
  type CurriculumWord,
} from "@/lib/words";

const TENSES: [keyof Conjugations, string][] = [
  ["presente", "presente"],
  ["indefinido", "pretérito"],
  ["imperfecto", "imperfecto"],
  ["futuro", "futuro"],
  ["subjuntivo", "subjuntivo"],
];

export function WordCard({
  word,
  index,
  onDecided,
}: {
  word: CurriculumWord;
  index: number;
  onDecided: (id: number, known: boolean) => void;
}) {
  const [marked, setMarked] = useState<boolean | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [, startTransition] = useTransition();

  const conj = hasParadigm(word.conjugations) ? word.conjugations : {};
  const isVerb = word.pos === "VERB" || word.pos === "AUX";

  function mark(known: boolean) {
    setMarked(known);
    onDecided(word.id, known);
    startTransition(async () => {
      await markWord(word.id, known);
    });
  }

  return (
    <article
      className="rise border-t border-rule pt-8 first:border-t-0 first:pt-0"
      style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
    >
      {/* Headword: the entry's whole reason for being, so it gets the space. */}
      <header className="flex items-start justify-between gap-4">
        <h2 className="font-display text-[2.125rem] leading-[1.1] tracking-tight sm:text-[2.5rem]">
          {word.lemma}
        </h2>
        <span className="label mt-2 shrink-0 tabular-nums">{word.rank}</span>
      </header>

      <p className="mt-1 font-body text-[0.9375rem] italic text-ink-soft">
        {POS_LABEL[word.pos] ?? word.pos.toLowerCase()}
        {word.participle_of && (
          <>
            {" · participio de "}
            <span className="not-italic">{word.participle_of}</span>
          </>
        )}
      </p>

      {word.definition_es ? (
        <div className="mt-5">
          <p className="font-body text-[1.0625rem] leading-relaxed">
            {word.definition_es}
          </p>

          {word.definition_en && (
            /* English sits below and quieter: present when needed, never the
               thing the eye lands on first. */
            <p className="mt-2 font-body text-[0.9375rem] leading-relaxed text-ink-soft">
              <span className="label mr-2 align-[0.1em]">en</span>
              {word.definition_en}
            </p>
          )}

          {word.example_es && (
            <p className="mt-4 border-l-2 border-rubric pl-4 font-body text-[1.0625rem] italic leading-relaxed">
              {word.example_es}
            </p>
          )}

          {word.etymology_es && (
            <p className="mt-4 font-body text-[0.875rem] leading-relaxed text-ink-faint">
              {word.etymology_es}
            </p>
          )}
        </div>
      ) : (
        <p className="mt-5 font-body text-[0.9375rem] italic text-ink-faint">
          Definición todavía no escrita.
        </p>
      )}

      {isVerb && conj.presente && (
        <div className="mt-6 rounded-sm bg-paper-sunk px-4 py-4 sm:px-5">
          <div className="flex flex-col gap-4">
            {(showAll ? TENSES : TENSES.slice(0, 1)).map(([key, label]) => {
              const forms = conj[key];
              if (!Array.isArray(forms)) return null;
              return (
                <div key={String(key)}>
                  <p className="label">{label}</p>
                  {/* Six persons across one row is unreadable on a phone. */}
                  <div className="mt-1.5 grid grid-cols-2 gap-x-5 gap-y-1 sm:grid-cols-3">
                    {forms.map((form, i) =>
                      form ? (
                        <p key={PERSONS[i]} className="font-body text-[0.9375rem]">
                          <span className="text-ink-faint">{PERSONS[i]} </span>
                          {form}
                        </p>
                      ) : null,
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap items-baseline justify-between gap-2">
            <button
              type="button"
              onClick={() => setShowAll((v) => !v)}
              className="label underline decoration-rule underline-offset-4 transition-colors hover:text-rubric"
            >
              {showAll ? "menos tiempos" : "más tiempos"}
            </button>
            {(conj.gerundio || conj.participio) && (
              <p className="font-body text-[0.875rem] italic text-ink-faint">
                {conj.gerundio} · {conj.participio}
              </p>
            )}
          </div>
        </div>
      )}

      {word.family.length > 0 && (
        <div className="mt-6">
          <p className="label">de la misma familia</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {word.family.map((member) => (
              <FamilyChip
                key={member.lemma}
                lemma={member.lemma}
                rootId={word.id}
              />
            ))}
          </div>
        </div>
      )}

      <div className="mt-7 flex gap-2.5">
        <Choice active={marked === true} onClick={() => mark(true)} tone="verde">
          Ya la sé
        </Choice>
        <Choice active={marked === false} onClick={() => mark(false)} tone="rubric">
          Es nueva
        </Choice>
      </div>
    </article>
  );
}

function Choice({
  active,
  onClick,
  tone,
  children,
}: {
  active: boolean;
  onClick: () => void;
  tone: "verde" | "rubric";
  children: React.ReactNode;
}) {
  const filled =
    tone === "verde"
      ? "border-verde bg-verde text-paper"
      : "border-rubric bg-rubric text-paper";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-11 rounded-sm border px-5 font-body text-[0.9375rem] transition-colors ${
        active ? filled : "border-rule text-ink-soft hover:border-ink-faint"
      }`}
    >
      {children}
    </button>
  );
}

/** Family members are context; clicking one records it on its own. */
function FamilyChip({ lemma, rootId }: { lemma: string; rootId: number }) {
  const [known, setKnown] = useState<boolean | null>(null);

  return (
    <button
      type="button"
      onClick={() => {
        const next = known !== true;
        setKnown(next);
        void markDerived(lemma, rootId, next);
      }}
      className={`min-h-9 rounded-full border px-3.5 py-1 font-body text-[0.9375rem] transition-colors ${
        known === true
          ? "border-verde bg-verde/10 text-verde"
          : known === false
            ? "border-rule text-ink-faint line-through"
            : "border-rule text-ink-soft hover:border-ink-faint"
      }`}
    >
      {lemma}
    </button>
  );
}
