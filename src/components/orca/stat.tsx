export function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs tracking-wide text-muted-foreground uppercase">{label}</p>
      <p className="text-sm font-semibold text-foreground break-words">{value}</p>
    </div>
  );
}
