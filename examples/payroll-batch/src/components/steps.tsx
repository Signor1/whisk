const LABELS = ["Review", "Dispatch", "Confirm"] as const;

export type StepsProps = {
  active: 1 | 2 | 3;
};

export function Steps({ active }: StepsProps) {
  return (
    <ol className="m-0 flex list-none items-center gap-3 p-0 text-[11px] uppercase tracking-[0.18em]">
      {LABELS.map((label, i) => {
        const idx = (i + 1) as 1 | 2 | 3;
        const state =
          idx < active ? "done" : idx === active ? "active" : "pending";
        return (
          <li
            key={label}
            className="inline-flex items-center gap-2"
            aria-current={state === "active" ? "step" : undefined}
          >
            <StepMarker state={state} idx={idx} />
            <StepLabel state={state}>{label}</StepLabel>
            {idx < LABELS.length && (
              <span aria-hidden className="text-ink-muted">
                —
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

function StepMarker({
  state,
  idx,
}: {
  state: "done" | "active" | "pending";
  idx: number;
}) {
  return (
    <span
      className={
        "flex h-6 w-6 items-center justify-center rounded-full text-[11px] " +
        (state === "done"
          ? "bg-emerald text-ivory"
          : state === "active"
            ? "bg-claret text-ivory"
            : "border border-line bg-ivory text-ink-muted")
      }
    >
      {state === "done" ? "✓" : idx}
    </span>
  );
}

function StepLabel({
  state,
  children,
}: {
  state: "done" | "active" | "pending";
  children: React.ReactNode;
}) {
  return (
    <span
      className={
        state === "active"
          ? "text-claret-deep"
          : state === "done"
            ? "text-emerald"
            : "text-ink-muted"
      }
    >
      {children}
    </span>
  );
}
