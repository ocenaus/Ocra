import { Waves } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Reserved space for the real pixel-art orca mascot artwork (full-body on
 * the desktop background, and a smaller pose beside Contract Analysis).
 * Deliberately a placeholder, not a code-drawn stand-in — ORCA doesn't fake
 * an illustration it doesn't have. Swap this for an <Image> pointing at the
 * real asset once it's supplied.
 */
export function MascotSlot({
  label = "Mascot artwork pending",
  tone = "light",
  className,
}: {
  label?: string;
  /** "light" for use over the dark sky backdrop, "dark" for use inside a white window panel. */
  tone?: "light" | "dark";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-1.5 rounded-md border-2 border-dashed px-3 py-4 text-center backdrop-blur-[1px]",
        tone === "light" ? "border-white/50 bg-white/10 text-white/80" : "border-border bg-secondary/60 text-muted-foreground",
        className,
      )}
      role="img"
      aria-label={label}
    >
      <Waves className="size-6" aria-hidden="true" />
      <span className="text-[10px] leading-tight font-medium text-balance">{label}</span>
    </div>
  );
}
