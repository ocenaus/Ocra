import type { ReactNode } from "react";
import { Waves } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Honest empty state for a feature that has no data yet — either because
 * ORCA hasn't detected anything to report, or because the required data
 * provider isn't configured. Never render placeholder/fake data instead of
 * this.
 */
export function NotConfiguredPanel({
  title,
  description,
  icon,
  className,
}: {
  title: string;
  description: string;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-lg border border-dashed border-border/70 px-6 py-12 text-center",
        className,
      )}
    >
      {icon ?? <Waves className="size-8 text-muted-foreground" />}
      <p className="font-medium text-foreground">{title}</p>
      <p className="max-w-md text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
