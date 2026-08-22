"use client";

import { useEffect, useState } from "react";
import { Volume2, Wifi } from "lucide-react";
import { OrcaLogoMark } from "@/components/orca/wordmark";

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

/**
 * Decorative bottom taskbar in the spirit of the XP taskbar — Start button,
 * an "open" entry for the current tool, a system tray, and a clock. None of
 * it is a real OS; it's flavor for the desktop-app illusion.
 */
export function Taskbar() {
  return (
    <div className="xp-taskbar-gradient fixed inset-x-0 bottom-0 z-50 flex h-9 items-center gap-2 border-t border-[#0a3aa0] px-1.5 shadow-[0_-2px_8px_rgba(0,0,0,0.25)]">
      <span
        className="xp-start-gradient flex items-center gap-1.5 rounded-[4px] border border-white/30 px-3 py-1 text-sm font-bold text-white italic shadow-sm"
        aria-hidden="true"
      >
        <OrcaLogoMark className="size-4" />
        start
      </span>

      <span className="flex h-6 items-center gap-1.5 rounded-[3px] border border-white/30 bg-white/15 px-2 text-xs text-white shadow-inner">
        <OrcaLogoMark className="size-3.5" />
        ORCA — Bubble Map
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
