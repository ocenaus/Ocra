import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** The three classic titlebar buttons. Decorative only — aria-hidden so they never imply working window controls. */
export function TitlebarControls() {
  return (
    <div className="flex items-center gap-1" aria-hidden="true">
      <span className="flex size-4 items-center justify-center rounded-[3px] border border-white/40 bg-gradient-to-b from-[#5fa8f5] to-[#1a5fce] text-[10px] leading-none text-white shadow-sm">
        _
      </span>
      <span className="flex size-4 items-center justify-center rounded-[3px] border border-white/40 bg-gradient-to-b from-[#5fa8f5] to-[#1a5fce] text-[9px] leading-none text-white shadow-sm">
        ▢
      </span>
      <span className="flex size-4 items-center justify-center rounded-[3px] border border-white/40 bg-gradient-to-b from-[#f47a6a] to-[#c22a1a] text-[10px] leading-none text-white shadow-sm">
        ✕
      </span>
    </div>
  );
}

/**
 * Windows XP / Luna-style "window" chrome: gradient titlebar with an icon,
 * title, and decorative min/max/close controls, wrapping a white content
 * panel. Used to frame each major ORCA section (bubble map, holder
 * insights, contract analysis) as if it were its own desktop window.
 */
export function XpWindow({
  title,
  icon,
  children,
  className,
  contentClassName,
}: {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <section
      className={cn("overflow-hidden rounded-[6px] border border-[#0a3aa0] shadow-[0_6px_18px_rgba(10,30,80,0.25)]", className)}
    >
      <div className="xp-titlebar-gradient flex items-center justify-between gap-2 px-2 py-1.5">
        <div className="flex min-w-0 items-center gap-1.5 text-sm font-semibold text-white">
          {icon}
          <span className="truncate">{title}</span>
        </div>
        <TitlebarControls />
      </div>
      <div className={cn("bg-[var(--color-surface)] p-4", contentClassName)}>{children}</div>
    </section>
  );
}
