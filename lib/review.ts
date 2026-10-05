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

export type JournalReview = {
  corrected: string;
  corrections: Correction[];
  praise: string;
};

export const KIND_LABEL: Record<CorrectionKind, string> = {
  acento: "acento",
  ortografía: "ortografía",
  gramática: "gramática",
  léxico: "léxico",
  estilo: "estilo",
};
