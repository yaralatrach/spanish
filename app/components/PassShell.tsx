"use client";

export function PassShell({
  label,
  title,
  note,
  position,
  total,
  children,
}: {
  label: string;
  title: string;
  note?: string;
  position: number;
  total: number;
  children: React.ReactNode;
}) {
  return (
    <div className="rise">
      <p className="label">{label}</p>
      <h1 className="mt-2 font-display text-[2.25rem] leading-[1.05] tracking-tight sm:text-[2.75rem]">
        {title}
      </h1>
      {note && (
        <p className="mt-3 font-body text-[1.0625rem] leading-relaxed text-ink-soft">
          {note}
        </p>
      )}

      <div className="mt-6 flex items-center gap-3">
        <div className="flex gap-1.5">
          {Array.from({ length: total }, (_, i) => (
            <span
              key={i}
              className={`h-1 w-6 rounded-full transition-colors duration-500 ${
                i < position ? "bg-rubric" : "bg-rule"
              }`}
            />
          ))}
        </div>
        <span className="label tabular-nums">
          {Math.min(position + 1, total)}/{total}
        </span>
      </div>

      <div className="mt-10">{children}</div>
    </div>
  );
}

export function Verdict({ state }: { state: "right" | "wrong" | null }) {
  if (!state) return null;
  return (
    <p
      className={`mt-3 font-body text-[0.9375rem] italic ${
        state === "right" ? "text-verde" : "text-rubric"
      }`}
    >
      {state === "right" ? "Eso es." : "Todavía no. Mira la palabra y prueba otra vez."}
    </p>
  );
}

export function Primary({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className="min-h-12 w-full rounded-sm bg-ink px-6 font-body text-[1.0625rem] text-paper transition-opacity hover:opacity-90 disabled:opacity-30 sm:w-auto"
    >
      {children}
    </button>
  );
}
