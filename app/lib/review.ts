"use server";

import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import * as z from "zod";

import { db } from "@/lib/supabase";
import { todayInMadrid } from "@/lib/today";
import type { JournalReview } from "@/lib/review";

const ReviewSchema = z.object({
  corrected: z
    .string()
    .describe("El texto completo corregido, conservando la voz de quien escribe."),
  corrections: z
    .array(
      z.object({
        original: z.string().describe("El fragmento tal como ella lo escribió."),
        corrected: z.string().describe("El fragmento corregido."),
        note: z
          .string()
          .describe("Por qué, en español claro y en una sola frase."),
        kind: z.enum(["acento", "ortografía", "gramática", "léxico", "estilo"]),
      }),
    )
    .describe("Una entrada por error. Vacío si no hay ninguno."),
  praise: z
    .string()
    .describe("Una cosa concreta que hizo bien, en español, en una frase."),
});

const SYSTEM = `Corriges el diario en español de una estudiante de nivel B1 cuyo objetivo es el español peninsular nativo.

Reglas:
- Corrige todo: acentos, ortografía, concordancia, tiempos verbales, preposiciones y palabras en otro idioma.
- El acento que falta es un error, no un descuido: márcalo siempre.
- Una palabra en inglés dentro del texto se corrige por la española que corresponda.
- Conserva su voz y lo que quiso decir. No reescribas su estilo ni alargues las frases.
- Usa español peninsular: vosotros, coger, ordenador, zumo.
- Las notas van en español, claras y breves, dirigidas a ella.
- Si una frase ya está bien, no la toques.`;

/**
 * Corrects the day's journal. Returns null when no API key is configured, so
 * the app works unchanged without one: the review is an addition to the gate,
 * never a condition of passing it.
 */
export async function reviewJournal(): Promise<JournalReview | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;

  const day = todayInMadrid();
  const { data: session } = await db
    .from("sessions")
    .select("journal_text, journal_review")
    .eq("day", day)
    .maybeSingle();

  if (!session?.journal_text) return null;
  // Already corrected: never pay for the same entry twice.
  if (session.journal_review) return session.journal_review as JournalReview;

  const client = new Anthropic();

  try {
    const response = await client.messages.parse({
      model: "claude-opus-5-5",
      max_tokens: 4000,
      system: SYSTEM,
      // Correcting a short diary entry is not hard reasoning, and effort is
      // what this costs money on.
      output_config: {
        effort: "low",
        format: zodOutputFormat(ReviewSchema),
      },
      messages: [{ role: "user", content: session.journal_text }],
    });

    if (response.stop_reason === "refusal" || !response.parsed_output) {
      return null;
    }

    const review = response.parsed_output as JournalReview;

    await db
      .from("sessions")
      .update({ journal_review: review })
      .eq("day", day);

    return review;
  } catch {
    // A grammar check must never block the day. Failing quietly is correct.
    return null;
  }
}

/** Moves past the correction. It is read once, not a gate to clear. */
export async function dismissReview(): Promise<void> {
  await db
    .from("sessions")
    .update({ review_seen_at: new Date().toISOString() })
    .eq("day", todayInMadrid());
}

/**
 * A short passage built from the day's own words, for reading them in
 * connected prose after meeting them in isolation. Cached on the session: one
 * passage per day, generated once.
 */
export async function dailyPassage(lemmas: string[]): Promise<string | null> {
  if (!process.env.ANTHROPIC_API_KEY || lemmas.length === 0) return null;

  const day = todayInMadrid();
  const { data: session } = await db
    .from("sessions")
    .select("passage")
    .eq("day", day)
    .maybeSingle();

  if (session?.passage) return session.passage;

  const client = new Anthropic();

  try {
    const response = await client.messages.create({
      model: "claude-opus-5-5",
      max_tokens: 1500,
      output_config: { effort: "low" },
      system: `Escribes un párrafo corto en español peninsular para una estudiante de nivel B1.

Reglas:
- Entre 70 y 110 palabras, un solo párrafo.
- Usa todas las palabras que te den, en cualquier forma flexionada.
- Que sea una escena concreta y cotidiana, no una definición ni una lista.
- Nivel B1: frases naturales, sin vocabulario rebuscado alrededor.
- Devuelve solo el párrafo, sin título ni comillas ni explicación.`,
      messages: [
        {
          role: "user",
          content: `Palabras: ${lemmas.join(", ")}`,
        },
      ],
    });

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();

    if (!text) return null;

    await db.from("sessions").update({ passage: text }).eq("day", day);
    return text;
  } catch {
    return null;
  }
}
