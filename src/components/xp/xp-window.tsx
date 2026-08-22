"use client";

import { useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type WindowStatus = "normal" | "minimized" | "maximized";

interface DragState {
  pointerId: number;
  startClientX: number;
  startClientY: number;
  originX: number;
  originY: number;
}

/**
 * The three classic titlebar buttons, wired to real behavior:
 *  - minimize: hide content, keep the titlebar visible (toggles back on
 *    another click).
 *  - maximize: fill the viewport; click again to restore.
 *  - close: while maximized, restores to normal (never removes the window —
 *    Ocean Map / Holder Insights / Contract Analysis are core content).
 *    Otherwise behaves like minimize.
 */
function TitlebarControls({
  onMinimize,
  onMaximizeToggle,
  onClose,
}: {
  onMinimize: () => void;
  onMaximizeToggle: () => void;
  onClose: () => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={onMinimize}
        onPointerDown={(e) => e.stopPropagation()}
        aria-label="Minimize"
        className="flex size-4 items-center justify-center rounded-[3px] border border-white/40 bg-gradient-to-b from-[#5fa8f5] to-[#1a5fce] text-[10px] leading-none text-white shadow-sm hover:brightness-110 active:brightness-95"
      >
        _
      </button>
      <button
        type="button"
        onClick={onMaximizeToggle}
        onPointerDown={(e) => e.stopPropagation()}
        aria-label="Maximize"
        className="flex size-4 items-center justify-center rounded-[3px] border border-white/40 bg-gradient-to-b from-[#5fa8f5] to-[#1a5fce] text-[9px] leading-none text-white shadow-sm hover:brightness-110 active:brightness-95"
      >
        ▢
      </button>
      <button
        type="button"
        onClick={onClose}
        onPointerDown={(e) => e.stopPropagation()}
        aria-label="Close"
        className="flex size-4 items-center justify-center rounded-[3px] border border-white/40 bg-gradient-to-b from-[#f47a6a] to-[#c22a1a] text-[10px] leading-none text-white shadow-sm hover:brightness-110 active:brightness-95"
      >
        ✕
      </button>
    </div>
  );
}

/**
 * Windows XP / Luna-style "window" chrome, with real (not just decorative)
 * behavior: drag by the titlebar (desktop/mouse only), maximize/restore,
 * minimize/restore. Used to frame each major ORCA section (bubble map,
 * holder insights, contract analysis) as if it were its own desktop window.
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
  const [status, setStatus] = useState<WindowStatus>("normal");
  const [drag, setDrag] = useState({ x: 0, y: 0 });
  const dragState = useRef<DragState | null>(null);

  function handleTitlebarPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    // Drag is a desktop/mouse affordance only — touch just taps the buttons.
    if (e.pointerType !== "mouse" || status === "maximized") return;
    dragState.current = {
      pointerId: e.pointerId,
      startClientX: e.clientX,
      startClientY: e.clientY,
      originX: drag.x,
      originY: drag.y,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handleTitlebarPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    const active = dragState.current;
    if (!active || active.pointerId !== e.pointerId) return;
    setDrag({
      x: active.originX + (e.clientX - active.startClientX),
      y: active.originY + (e.clientY - active.startClientY),
    });
  }

  function endDrag(e: ReactPointerEvent<HTMLDivElement>) {
    if (dragState.current?.pointerId === e.pointerId) {
      dragState.current = null;
    }
  }

  function handleMinimize() {
    setStatus((s) => (s === "minimized" ? "normal" : "minimized"));
  }

  function handleMaximizeToggle() {
    setStatus((s) => (s === "maximized" ? "normal" : "maximized"));
  }

  function handleClose() {
    // Closing a maximized window just restores it; in the normal state it
    // behaves like minimize. The window itself is never removed from the
    // page — this is core content, not a dismissible notification.
    setStatus((s) => (s === "maximized" ? "normal" : "minimized"));
  }

  const isMaximized = status === "maximized";
  const isMinimized = status === "minimized";
  const isDragged = drag.x !== 0 || drag.y !== 0;

  return (
    <section
      className={cn(
        "overflow-hidden rounded-[6px] border border-[#0a3aa0] shadow-[0_6px_18px_rgba(10,30,80,0.25)]",
        isMaximized
          ? "fixed inset-3 z-[100] flex flex-col sm:inset-8"
          : isDragged && "relative z-20",
        className,
      )}
      style={!isMaximized && isDragged ? { transform: `translate(${drag.x}px, ${drag.y}px)` } : undefined}
    >
      <div
        className="xp-titlebar-gradient flex touch-none items-center justify-between gap-2 px-2 py-1.5"
        style={{ cursor: isMaximized ? "default" : "grab" }}
        onPointerDown={handleTitlebarPointerDown}
        onPointerMove={handleTitlebarPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <div className="flex min-w-0 items-center gap-1.5 text-sm font-semibold text-white">
          {icon}
          <span className="truncate">{title}</span>
        </div>
        <TitlebarControls onMinimize={handleMinimize} onMaximizeToggle={handleMaximizeToggle} onClose={handleClose} />
      </div>
      {!isMinimized && (
        <div
          className={cn(
            "bg-[var(--color-surface)] p-4",
            isMaximized && "flex-1 overflow-y-auto",
            contentClassName,
          )}
        >
          {children}
        </div>
      )}
    </section>
  );
}
