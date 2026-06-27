interface Props {
  value: number;
  total: number;
  color?: string;
}

export function ProgressBar({ value, total, color = "var(--primary)" }: Props) {
  const pct = total === 0 ? 0 : Math.round((value / total) * 100);
  return (
    <div
      style={{
        position: "relative",
        height: "6px",
        borderRadius: "99px",
        background: "var(--border)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          height: "100%",
          width: `${pct}%`,
          background: color,
          borderRadius: "99px",
          transition: "width 400ms ease",
        }}
      />
    </div>
  );
}
