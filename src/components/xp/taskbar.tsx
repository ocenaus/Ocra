"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Volume2, Wifi } from "lucide-react";
import { OrcaLogoMark } from "@/components/orca/wordmark";
import { NAV_ITEMS } from "@/components/xp/nav-items";

/** Purely decorative XP-style taskbar clock — starts blank so server/client markup match, fills in after mount. */
function TaskbarClock() {
  const [time, setTime] = useState<string | null>(null);

  useEffect(() => {
    function tick() {
      setTime(new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }));
    }
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  return <span className="tabular-nums">{time ?? "--:--"}</span>;
}

/** Start menu — same items as the sidebar, so both surfaces always agree on what's real vs. "Soon". */
function StartMenu({ onNavigate }: { onNavigate: () => void }) {
  const pathname = usePathname();

  return (
    <div
      className="absolute bottom-full left-1.5 mb-1 w-60 overflow-hidden rounded-[6px] border border-[#0a3aa0] bg-[var(--color-surface)] shadow-[0_8px_24px_rgba(6,20,55,0.45)]"
      role="menu"
    >
      <div className="xp-titlebar-gradient px-3 py-2 text-sm font-semibold text-white">ORCA by Oceanus chain</div>
      <div className="flex flex-col gap-0.5 p-1.5">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = item.isActive?.(pathname) ?? false;

          if (!item.href) {
            return (
              <span
                key={item.label}
                className="flex items-center gap-2.5 rounded-[3px] px-2.5 py-1.5 text-sm text-muted-foreground/70"
                aria-disabled="true"
              >
                <Icon className="size-4 shrink-0" />
                <span className="flex-1 truncate">{item.label}</span>
                <span className="rounded-full border border-border bg-white px-1.5 py-0.5 text-[9px] font-semibold tracking-wide text-muted-foreground uppercase">
                  Soon
                </span>
              </span>
            );
          }

          return (
            <Link
              key={item.label}
              href={item.href}
              role="menuitem"
              onClick={onNavigate}
              className={
                "flex items-center gap-2.5 rounded-[3px] px-2.5 py-1.5 text-sm font-medium transition-colors " +
                (isActive ? "bg-secondary text-foreground" : "text-foreground hover:bg-secondary/60")
              }
            >
              <Icon className="size-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Bottom taskbar in the spirit of the XP taskbar — a working Start button
 * (opens a menu matching the sidebar), an "open app" pill, a system tray,
 * and a clock.
 */
export function Taskbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="xp-taskbar-gradient fixed inset-x-0 bottom-0 z-50 flex h-9 items-center gap-2 border-t border-[#0a3aa0] px-1.5 shadow-[0_-2px_8px_rgba(0,0,0,0.25)]">
      {menuOpen && (
        <>
          <button
            type="button"
            aria-label="Close Start menu"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setMenuOpen(false)}
          />
          <div className="relative z-50">
            <StartMenu onNavigate={() => setMenuOpen(false)} />
          </div>
        </>
      )}

      <button
        type="button"
        onClick={() => setMenuOpen((open) => !open)}
        aria-expanded={menuOpen}
        aria-haspopup="menu"
        className="xp-start-gradient relative z-50 flex items-center gap-1.5 rounded-[4px] border border-white/30 px-3 py-1 text-sm font-bold text-white italic shadow-sm hover:brightness-105 active:brightness-95"
      >
        <OrcaLogoMark className="size-4" />
        start
      </button>

      <span className="flex h-6 items-center gap-1.5 rounded-[3px] border border-white/30 bg-white/15 px-2 text-xs text-white shadow-inner">
        <OrcaLogoMark className="size-3.5" />
        ORCA — Ocean Map
      </span>

      <div className="ml-auto flex items-center gap-2.5 rounded-[3px] border border-white/20 bg-white/10 px-2.5 py-1 text-white">
        <Wifi className="size-3.5" aria-hidden="true" />
        <Volume2 className="size-3.5" aria-hidden="true" />
        <span className="text-xs font-medium">
          <TaskbarClock />
        </span>
      </div>
    </div>
  );
}
