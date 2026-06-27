interface Props {
  value: number;
  total: number;
  color?: string;
}

export function ProgressBar({ value, total, color = "var(--primary)" }: Props) {
  const pct = total === 0 ? 0 : Math.round((value / total) * 100);
  return (
    <div className="relative h-1.5 rounded-full bg-border overflow-hidden">
      <div
        className="absolute left-0 top-0 h-full rounded-full transition-[width] duration-[400ms] ease-[ease]"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  );
}
