export type FamilyMember = { lemma: string; rank: number | null };

/** Six persons, in order: yo, tú, él, nosotros, vosotros, ellos. */
export type Persons = (string | null)[];

export type Conjugations = {
  gerundio?: string | null;
  participio?: string | null;
  presente?: Persons;
  indefinido?: Persons;
  imperfecto?: Persons;
  futuro?: Persons;
  condicional?: Persons;
  subjuntivo?: Persons;
  imperativo?: Persons;
};

export type CurriculumWord = {
  id: number;
  lemma: string;
  pos: string;
  rank: number;
  conjugations: Conjugations | unknown[];
  family: FamilyMember[];
  participle_of: string | null;
};

export const POS_LABEL: Record<string, string> = {
  NOUN: "sustantivo",
  VERB: "verbo",
  AUX: "verbo auxiliar",
  ADJ: "adjetivo",
  ADV: "adverbio",
  ADP: "preposición",
  PRON: "pronombre",
  DET: "determinante",
  CCONJ: "conjunción",
  SCONJ: "conjunción",
  NUM: "numeral",
  INTJ: "interjección",
  PART: "partícula",
};

export const PERSONS = ["yo", "tú", "él", "nos.", "vos.", "ellos"];

/** Verbs carry a paradigm object; everything else carries an empty array. */
export function hasParadigm(
  conjugations: Conjugations | unknown[],
): conjugations is Conjugations {
  return !Array.isArray(conjugations) && conjugations !== null;
}
