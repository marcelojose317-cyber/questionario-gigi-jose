type Props = {
  value: number;
  ariaLabel?: string;
};

export function ProgressBar({ value, ariaLabel }: Props) {
  const safe = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-label={ariaLabel}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={safe}
      className="h-1.5 w-full rounded-full overflow-hidden"
      style={{ background: "rgba(255, 255, 255, 0.06)" }}
    >
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{
          width: `${safe}%`,
          background: "var(--gradient-primary)",
          boxShadow: "var(--glow-lilac)",
        }}
      />
    </div>
  );
}
