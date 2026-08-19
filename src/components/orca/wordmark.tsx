import { cn } from "@/lib/utils";

export function OrcaWordmark({ className, size = "md" }: { className?: string; size?: "sm" | "md" | "lg" }) {
  const textSize = size === "lg" ? "text-3xl" : size === "sm" ? "text-lg" : "text-xl";

  return (
    <div className={cn("inline-flex items-center gap-2.5", className)}>
      <span className="relative flex size-6 items-center justify-center">
        <span className="absolute inline-flex size-full rounded-full bg-primary/60 animate-sonar-pulse" />
        <span className="relative size-2.5 rounded-full bg-primary shadow-[0_0_12px_2px_var(--color-primary)]" />
      </span>
      <span className={cn("font-semibold tracking-tight text-foreground", textSize)}>
        ORCA
      </span>
    </div>
  );
}
