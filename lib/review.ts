/** Shape of a journal correction. Plain types: the client imports these too. */
export type CorrectionKind =
  | "acento"
  | "ortografía"
  | "gramática"
  | "léxico"
  | "estilo";

export type Correction = {
  original: string;
  corrected: string;
  note: string;
  kind: CorrectionKind;
};

/** A word she wrote in English because she did not have the Spanish. */
export type Gap = {
  english: string;
  spanish: string;
  note: string;
};

export type JournalReview = {
  corrected: string;
  corrections: Correction[];
  gaps: Gap[];
  praise: string;
};

export const KIND_LABEL: Record<CorrectionKind, string> = {
  acento: "acento",
  ortografía: "ortografía",
  gramática: "gramática",
  léxico: "léxico",
  estilo: "estilo",
};
