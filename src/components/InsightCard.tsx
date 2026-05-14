type Props = {
  text: string;
  index?: number;
};

export function InsightCard({ text, index }: Props) {
  return (
    <div className="soft-card p-5 flex gap-4">
      {typeof index === "number" ? (
        <div
          className="text-xs font-medium pt-0.5 w-6 shrink-0 tabular-nums"
          style={{ color: "var(--text-lilac)" }}
        >
          {String(index).padStart(2, "0")}
        </div>
      ) : null}
      <p className="text-sm leading-relaxed text-white/90">{text}</p>
    </div>
  );
}
