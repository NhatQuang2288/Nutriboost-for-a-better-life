const SIZE = 160;
const STROKE = 14;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function CalorieRing({ consumed, limit }: { consumed: number; limit: number }) {
  const percent = limit > 0 ? Math.min(1, consumed / limit) : 0;
  const offset = CIRCUMFERENCE * (1 - percent);
  const overLimit = consumed > limit;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={SIZE} height={SIZE} className="-rotate-90">
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="var(--muted)"
          strokeWidth={STROKE}
        />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke={overLimit ? "var(--destructive)" : "var(--primary)"}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="font-mono text-2xl font-semibold">{Math.round(consumed)}</span>
        <span className="text-xs text-muted-foreground">/ {Math.round(limit)} kcal</span>
      </div>
    </div>
  );
}
