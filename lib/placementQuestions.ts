export type LevelBand = "A1" | "A2" | "B1" | "B2";

export type PlacementQuestion = {
  id: string;
  band: LevelBand;
  prompt: string;
  options: string[];
  answer: string;
};

// Twelve items, three per band, Peninsular Spanish. Each band probes one thing
// that reliably separates it from the band below: A1 basic agreement, A2 the
// preterite and vosotros, B1 imperfect-vs-preterite and the present
// subjunctive, B2 concessive subjunctive and compound conditionals.
export const PLACEMENT_QUESTIONS: PlacementQuestion[] = [
  {
    id: "a1-1",
    band: "A1",
    prompt: "___ llamo Yara.",
    options: ["Me", "Te", "Se", "Mi"],
    answer: "Me",
  },
  {
    id: "a1-2",
    band: "A1",
    prompt: "¿De dónde ___ tú?",
    options: ["eres", "estás", "sois", "son"],
    answer: "eres",
  },
  {
    id: "a1-3",
    band: "A1",
    prompt: "En la mesa hay ___ libros.",
    options: ["unos", "un", "una", "uno"],
    answer: "unos",
  },
  {
    id: "a2-1",
    band: "A2",
    prompt: "Ayer ___ al cine con mis amigos.",
    options: ["fui", "voy", "iré", "iba"],
    answer: "fui",
  },
  {
    id: "a2-2",
    band: "A2",
    prompt: "Chicos, ¿ya ___ comido?",
    options: ["habéis", "habemos", "han", "hais"],
    answer: "habéis",
  },
  {
    id: "a2-3",
    band: "A2",
    prompt: "Este libro es más interesante ___ el otro.",
    options: ["que", "de", "como", "a"],
    answer: "que",
  },
  {
    id: "b1-1",
    band: "B1",
    prompt: "Cuando era pequeña, ___ todos los veranos a la playa.",
    options: ["iba", "fui", "he ido", "iré"],
    answer: "iba",
  },
  {
    id: "b1-2",
    band: "B1",
    prompt: "Espero que te ___ bien el examen.",
    options: ["salga", "sale", "saldrá", "salió"],
    answer: "salga",
  },
  {
    id: "b1-3",
    band: "B1",
    prompt: "Si tuviera más tiempo, ___ más.",
    options: ["leería", "leeré", "leo", "leyera"],
    answer: "leería",
  },
  {
    id: "b2-1",
    band: "B2",
    prompt: "Por mucho que lo ___, no lo conseguirá.",
    options: ["intente", "intenta", "intentará", "intentaba"],
    answer: "intente",
  },
  {
    id: "b2-2",
    band: "B2",
    prompt: "No me di cuenta de ___ había pasado hasta el día siguiente.",
    options: ["lo que", "que", "el que", "cual"],
    answer: "lo que",
  },
  {
    id: "b2-3",
    band: "B2",
    prompt: "De haberlo sabido, ___ antes.",
    options: ["habría venido", "vendría", "vine", "vendré"],
    answer: "habría venido",
  },
];

const BANDS: LevelBand[] = ["A1", "A2", "B1", "B2"];

/**
 * A band counts as passed at 2 of 3. The level is the highest band passed with
 * every band below it also passed, so one lucky B2 guess on top of a failed B1
 * does not promote. Passing all four lands above the test's ceiling: C1.
 */
export function scoreLevel(correctByBand: Record<LevelBand, number>): string {
  let level = "A1"; // floor: the test cannot place below its lowest band
  for (const band of BANDS) {
    if ((correctByBand[band] ?? 0) < 2) return level;
    level = band;
  }
  return "C1";
}
