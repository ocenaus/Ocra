import { cn } from "@/lib/utils";

/**
 * ORCA brand mark: a blue circle badge with a white whale-tail sweep and a
 * sparkle, rebuilt as flat SVG from the reference logo. Simple enough
 * geometry (circle, curves, a star) to reproduce faithfully in code — unlike
 * the pixel-art mascot, which needs real illustration assets.
 */
export function OrcaLogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={cn("size-6", className)} role="img" aria-label="ORCA">
      <circle cx="50" cy="50" r="49" fill="#3b8ff0" stroke="#ffffff" strokeWidth="2" />
      <path
        d="M55 32 L58.5 40 L67 43 L58.5 46 L55 54 L51.5 46 L43 43 L51.5 40 Z"
        fill="#ffffff"
      />
      <path
        d="M18 66 C 30 40, 55 32, 82 46 C 70 45, 58 49, 50 58 C 62 55, 72 58, 80 66 C 66 62, 54 63, 45 70 C 38 74, 26 74, 18 66 Z"
        fill="#ffffff"
      />
      <path d="M30 62 C 40 58, 50 58, 58 62" stroke="#3b8ff0" strokeWidth="1.4" fill="none" opacity="0.55" />
      <path d="M32 67 C 42 64, 52 64, 60 67" stroke="#3b8ff0" strokeWidth="1.4" fill="none" opacity="0.4" />
      <circle cx="24" cy="63" r="1.8" fill="#3b8ff0" />
    </svg>
  );
}

export function OrcaWordmark({
  className,
  size = "md",
  withTagline = false,
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
  withTagline?: boolean;
}) {
  const textSize = size === "lg" ? "text-2xl" : size === "sm" ? "text-sm" : "text-base";
  const iconSize = size === "lg" ? "size-10" : size === "sm" ? "size-5" : "size-7";

  return (
    <div className={cn("inline-flex items-center gap-2.5", className)}>
      <OrcaLogoMark className={cn("shrink-0 drop-shadow-sm", iconSize)} />
      <div className="flex flex-col leading-tight">
        <span className={cn("font-pixel tracking-tight text-foreground", textSize)}>ORCA</span>
        {withTagline && (
          <span className="text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
            by Oceanus chain
          </span>
        )}
      </div>
    </div>
  );
}
