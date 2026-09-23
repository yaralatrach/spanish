/**
 * Builds the gapped sentence for the completion pass by finding the word's own
 * inflected form inside its example. Matching the longest form first matters:
 * "señalaron" must win over "señal", or the gap swallows only part of the word.
 */
export type Cloze = { before: string; answer: string; after: string } | null;

export function buildCloze(example: string, forms: string[]): Cloze {
  const ordered = [...forms].sort((a, b) => b.length - a.length);

  for (const form of ordered) {
    // Word boundaries by hand: \b does not respect accented letters reliably.
    const pattern = new RegExp(
      `(^|[^\\p{L}\\p{M}])(${escape(form)})([^\\p{L}\\p{M}]|$)`,
      "iu",
    );
    const match = pattern.exec(example);
    if (!match) continue;

    const start = match.index + match[1].length;
    return {
      before: example.slice(0, start),
      answer: example.slice(start, start + match[2].length),
      after: example.slice(start + match[2].length),
    };
  }
  return null;
}

function escape(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
