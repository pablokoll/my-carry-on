export function TypeBadge({ type }: { type: string }) {
  return (
    <span className="bg-[rgba(74,123,181,0.1)] text-primary rounded-full px-2.5 py-0.5 text-xs font-medium">
      {type}
    </span>
  );
}
