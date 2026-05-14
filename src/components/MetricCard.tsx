type Props = {
  label: string;
  value: string | number;
  hint?: string;
  accent?: "default" | "lilac";
};

export function MetricCard({
  label,
  value,
  hint,
  accent = "default",
}: Props) {
  return (
    <div className="glass-card p-6 flex flex-col">
      <div className="text-[11px] uppercase tracking-[0.18em] muted-text">
        {label}
      </div>
      <div
        className="text-4xl font-semibold tracking-tight mt-3"
        style={accent === "lilac" ? { color: "var(--text-lilac)" } : undefined}
      >
        {value}
      </div>
      {hint ? (
        <div className="text-sm muted-text mt-1.5">{hint}</div>
      ) : null}
    </div>
  );
}
