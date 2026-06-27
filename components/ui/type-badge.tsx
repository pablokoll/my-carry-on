export function TypeBadge({ type }: { type: string }) {
  return (
    <span
      style={{
        background: "rgba(74,123,181,0.1)",
        color: "var(--primary)",
        borderRadius: "999px",
        padding: "2px 10px",
        fontSize: "12px",
        fontWeight: 500,
      }}
    >
      {type}
    </span>
  );
}
