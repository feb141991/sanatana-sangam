"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";

const teachings: Record<
  number,
  { label: string; move: number; kind: "virtue" | "vice" }
> = {
  4: { label: "Satya · truth steadies the path", move: 7, kind: "virtue" },
  9: { label: "Seva · service lifts the journey", move: 8, kind: "virtue" },
  16: { label: "Krodha · anger obscures discernment", move: -8, kind: "vice" },
  21: { label: "Daya · compassion widens the heart", move: 9, kind: "virtue" },
  28: {
    label: "Lobha · grasping pulls the mind back",
    move: -11,
    kind: "vice",
  },
  36: {
    label: "Viveka · discernment reveals the way",
    move: 8,
    kind: "virtue",
  },
  43: {
    label: "Ahankara · ego returns us to practice",
    move: -15,
    kind: "vice",
  },
};

export function GyanChauparPreview() {
  const [position, setPosition] = useState(0);
  const [roll, setRoll] = useState<number | null>(null);
  const [message, setMessage] = useState(
    "Roll to begin a small journey through virtue, reflection and return.",
  );

  function rollDice() {
    const nextRoll = Math.floor(Math.random() * 6) + 1;
    const landed = Math.min(49, position + nextRoll);
    const teaching = teachings[landed];
    const destination = teaching
      ? Math.max(0, Math.min(49, landed + teaching.move))
      : landed;

    setRoll(nextRoll);
    setPosition(destination);
    setMessage(
      destination === 49
        ? "The final square is a reminder: arrival becomes another beginning."
        : (teaching?.label ??
            `Square ${destination} · continue with steadiness.`),
    );
  }

  function reset() {
    setPosition(0);
    setRoll(null);
    setMessage(
      "Roll to begin a small journey through virtue, reflection and return.",
    );
  }

  return (
    <section className="bg-[var(--surface-soft)] px-5 py-24 sm:px-8 lg:px-10 lg:py-32">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.72fr_1.28fr] lg:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[var(--brand-primary-strong)]">
            Play sacred wisdom
          </p>
          <h2 className="mt-5 font-display text-5xl font-medium leading-none sm:text-6xl">
            Gyan Chaupar returns.
          </h2>
          <p className="mt-6 text-lg leading-8 text-[var(--text-muted-warm)]">
            The earlier website invited visitors to explore a game of dharmic
            progress. This compact edition preserves that playful doorway while
            the deeper native experience develops.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 text-sm text-[var(--text-muted-warm)]">
            <span className="rounded-full border border-[var(--card-border)] px-4 py-2">
              Virtue · ascend
            </span>
            <span className="rounded-full border border-[var(--card-border)] px-4 py-2">
              Vice · reflect
            </span>
            <span className="rounded-full border border-[var(--card-border)] px-4 py-2">
              Square 49 · return
            </span>
          </div>
        </div>

        <div className="rounded-[2.5rem] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-[var(--shadow-strong)] sm:p-8">
          <div
            className="grid grid-cols-7 gap-1.5"
            aria-label={`Gyan Chaupar board. Current position ${position}.`}
          >
            {Array.from({ length: 49 }, (_, index) => {
              const square = 49 - index;
              const teaching = teachings[square];
              const isCurrent = position === square;
              return (
                <div
                  key={square}
                  className={`flex aspect-square items-center justify-center rounded-lg border text-xs font-semibold sm:rounded-xl sm:text-sm ${
                    isCurrent
                      ? "border-[var(--brand-primary)] bg-[var(--brand-primary)] text-[var(--surface-base)]"
                      : teaching?.kind === "virtue"
                        ? "border-[var(--brand-primary)] bg-[var(--brand-primary-soft)] text-[var(--brand-primary-strong)]"
                        : "border-[var(--card-border)] bg-[var(--surface-raised)] text-[var(--text-dim)]"
                  }`}
                  aria-current={isCurrent ? "step" : undefined}
                >
                  {square}
                </div>
              );
            })}
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-[auto_1fr_auto] sm:items-center">
            <button
              type="button"
              onClick={rollDice}
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-[var(--brand-primary)] px-6 font-semibold text-[var(--surface-base)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] focus-visible:ring-offset-2"
            >
              Roll the dice{roll ? ` · ${roll}` : ""}
            </button>
            <p
              className="text-sm leading-6 text-[var(--text-muted-warm)]"
              aria-live="polite"
            >
              {message}
            </p>
            <button
              type="button"
              onClick={reset}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[var(--card-border)] px-4 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]"
            >
              <RotateCcw className="size-4" aria-hidden="true" />
              Reset
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
