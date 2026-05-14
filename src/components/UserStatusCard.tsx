import { ProgressBar } from "./ProgressBar";

type Props = {
  name: string;
  slug: "gigi" | "jose";
  status: string;
  answered: number;
  total: number;
};

export function UserStatusCard({ name, status, answered, total }: Props) {
  const initial = name.trim().charAt(0).toUpperCase() || "·";
  const percent = total > 0 ? Math.round((answered / total) * 100) : 0;

  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-4">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-white text-base font-medium"
          style={{
            background: "var(--gradient-primary)",
            boxShadow: "var(--glow-lilac)",
          }}
          aria-hidden
        >
          {initial}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-base font-medium tracking-tight truncate">
            {name}
          </div>
          <div className="text-xs muted-text truncate">{status}</div>
        </div>
      </div>

      <div className="mt-6">
        <div className="flex items-baseline justify-between text-xs mb-2">
          <span className="muted-text">
            {answered} de {total}
          </span>
          <span
            className="font-medium tabular-nums"
            style={{ color: "var(--text-lilac)" }}
          >
            {percent}%
          </span>
        </div>
        <ProgressBar
          value={percent}
          ariaLabel={`Progresso de ${name}: ${percent}%`}
        />
      </div>
    </div>
  );
}
